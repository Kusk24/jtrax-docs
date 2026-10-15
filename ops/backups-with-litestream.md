# Backups with Litestream

**Date:** 2026-10-15 · **Environment:** production

## What this covers

Continuous replication of the production SQLite file to S3, and how to prove a
restore works. Until this, `~/data/jtrax.db` had only the daily Lightsail
snapshot behind it and no restore had ever been tested (see
[[jtrax-on-lightsail]]). The snapshot loses up to a day of attendance and
payments; Litestream streams every change within seconds and keeps a daily
snapshot for 30 days. The Lightsail snapshot stays as a second, independent copy.

The repo side is `jtrax-backend` PR #117:

- `deploy/litestream.yml` — the config. Every location comes from the
  environment, so the public repo names no bucket.
- `deploy/restore-check.sh` — restores the latest replica to a scratch file,
  runs `integrity_check`, and checks that migrations and accounts are present.
  Exits non-zero on any failure.

Tested locally on 2026-10-15 with Litestream 0.5.17, replicating to a folder
against a running backend. An account created after replication started was in
the restored copy, and the script printed `ok — 84 migrations, 6 accounts`.
**None of the steps below have been run on the box yet.**

## Steps

AWS side (console):

1. **Bucket** in `ap-southeast-1`. Block all public access, keep default
   SSE-S3 encryption on, no versioning needed (Litestream manages retention).
2. **IAM user** for Litestream only, with an access key and a policy limited
   to that bucket:
   - `s3:ListBucket` and `s3:GetBucketLocation` on the bucket ARN
   - `s3:GetObject`, `s3:PutObject` and `s3:DeleteObject` on `<bucket-arn>/jtrax/*`

   This key must not be a root or admin key. If it leaks, it can only read or
   write backups.

On the box:

3. **Install.** Download `litestream-0.5.17-linux-x86_64.rpm` and
   `checksums.txt` from the GitHub release. Check the checksum with
   `sha256sum`, then run `sudo dnf install ./litestream-0.5.17-linux-x86_64.rpm`.
   This installs `/usr/bin/litestream` and a `litestream` systemd unit.
4. **Config.** Copy `deploy/litestream.yml` from the merged `main` to
   `/etc/litestream.yml`, replacing the sample the rpm installed.
5. **Environment.** Create `/etc/litestream.env` with owner root and mode 600.
   Write only plain `NAME=value` lines: no comments and no `export` (see
   [[jtrax-on-lightsail]]; a comment crash-looped the API once). It needs:
   - `JTRAX_DB_PATH`: the same absolute path that `DATABASE_URL` in the
     backend `.env` points at
   - `LITESTREAM_REPLICA_URL`: `s3://<bucket>/jtrax?region=ap-southeast-1`
   - `LITESTREAM_ACCESS_KEY_ID` and `LITESTREAM_SECRET_ACCESS_KEY`
6. **Unit override.** Run `sudo systemctl edit litestream` and add a
   `[Service]` section with `EnvironmentFile=/etc/litestream.env` and
   `User=ec2-user`. Litestream keeps its own metadata beside the database in
   `~/data/`, so it should run as the same user that owns that folder.
7. **Start.** Run `sudo systemctl enable --now litestream`, then
   `journalctl -u litestream -n 50` should show `snapshot complete` within
   a minute.
8. **Prove it.** Run:
   `sudo bash -c 'set -a; . /etc/litestream.env; set +a; /home/ec2-user/apps/jtrax-backend/deploy/restore-check.sh'`.
   The result counts only once it prints `restore-check: ok`. Record the date
   in the deploy log in [[jtrax-on-lightsail]].
9. **Reboot once** and check that `systemctl status litestream` is active.
   This follows the "verify a reboot, do not assume it" rule in
   [[jtrax-on-lightsail]].

**Restoring for real** (data loss or a bad migration):

1. `pm2 stop jtrax-api`.
2. Restore to a new file:
   `litestream restore -config /etc/litestream.yml -o ~/data/jtrax.restored.db "$JTRAX_DB_PATH"`.
   To go back to a moment before a bad write, add `-timestamp 2026-10-15T08:00:00Z`.
3. Run `sqlite3 ~/data/jtrax.restored.db 'PRAGMA integrity_check;'`. It must
   print `ok`.
4. Move the live file and its `-wal`/`-shm` aside. Do not delete them. Then
   move the restored file into place.
5. `sudo systemctl restart litestream`, then `pm2 start jtrax-api`. The
   `deploy.sh` smoke test should return 4/4.

## Gotchas

- **Never restore onto the live path while the API runs.** Always restore to a
  new file and swap with the API stopped.
- **`JTRAX_DB_PATH` must match the backend exactly.** If it points at a
  different file, Litestream happily replicates an empty database and the logs
  look healthy.
- **WAL is required.** `internal/db/db.go` opens with `journal_mode(WAL)` and
  `busy_timeout(5000)`. Don't change either without checking this.
- **Upgrading across Litestream 0.3 → 0.5 changes the replica format.** Pin a
  version, and run the restore check after any upgrade.
- **A green journal is not a backup.** Only `restore-check.sh` passing counts.

## Secrets

`LITESTREAM_ACCESS_KEY_ID` and `LITESTREAM_SECRET_ACCESS_KEY`, kept only in
`/etc/litestream.env` (mode 600). The bucket name lives in
`LITESTREAM_REPLICA_URL` in the same file and in `SERVER.md`, never in a repo.

## Follow-ups

- [ ] Do steps 1–9 on the box.
- [ ] Schedule `restore-check.sh` weekly (a systemd timer) and alert on failure.
- [ ] `jtrax-backend/docs/deployment.md` still describes Render + Turso; it
      should point at [[jtrax-on-lightsail]] and this note.

Related: [[jtrax-on-lightsail]], [[deploying-jtrax-backend]], [[sessions-slide-and-end-on-every-password-change]]

Tags: #ops #backups #lightsail #backend
