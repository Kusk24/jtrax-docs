# JTrax on AWS Lightsail

**Date:** 2026-09-16 · **Environment:** production

## What this covers

All three JTrax services now run on a single AWS Lightsail instance in Singapore,
managed by pm2 behind nginx. This replaces the Render + Turso + Vercel split
described in [[deploying-jtrax-backend]] and decided in
[[0005-render-and-turso-for-free-hosting]].

The machine-level runbook — how to connect, full specs, gotchas — lives outside the
vault at `JTrax/SERVER.md`, deliberately in a folder that is not a git repo so the
SSH key beside it can never be committed.

## The box

| | |
|---|---|
| Instance | `jtrax-prod`, `ap-southeast-1a` (Singapore, ~30-50ms to Bangkok) |
| Plan | $7/mo — 1 GB RAM, 2 vCPU, 40 GB SSD |
| OS | Amazon Linux 2023 (`dnf`, user `ec2-user`, SELinux already permissive) |
| Swap | 4 GB swapfile, `vm.swappiness=10` |

The $12 / 2 GB plan was unavailable at creation, almost certainly a new-account
quota. Lightsail cannot resize in place: upgrading means snapshot → new instance
from snapshot on the larger plan → reattach the static IP.

## What runs where

| Process | Port | Manager | Resident |
|---|---|---|---|
| `jtrax-api` (Go binary) | 8790, loopback only | pm2 | ~11 MB |
| `jtrax-web` (Next 16) | 3000 | pm2 | ~145 MB |
| `jtrax-admin` (Next 16) | 3001 | pm2 | ~140 MB |
| nginx | 443 → all three, by subdomain | systemd | ~10 MB |

All three fit in 916 MB with room to spare — 305 MB used after boot, swap barely
touched. The pre-deploy estimate of 300-500 MB per Next app was roughly double the
truth, which is the only reason the $7 plan is viable.

Layout: `~/apps/<repo>` (repos at `origin/main`), `~/apps/ecosystem.config.js`,
`~/data/jtrax.db`, `~/logs/`.

## Steps

1. **Swap before anything.** 1 GB with no swap gets the Next build OOM-killed.
   Use `dd`, not `fallocate` — the root filesystem is XFS and `swapon` rejects
   sparse files.
2. **Toolchain.** `dnf install git nginx nodejs22`, corepack for pnpm (it honours
   the pinned `packageManager`, so 10.29.3 is picked up automatically), `npm i -g pm2`.
3. **Clone over forwarded SSH agent** (`ssh -A`). No deploy key or token is stored
   on the box, which also means deploys only work from a machine whose agent holds
   a GitHub key.
4. **Cross-compile the Go binary** on the Mac with `CGO_ENABLED=0 GOOS=linux
   GOARCH=amd64` and `scp` it over. `modernc.org/sqlite` is pure Go, so the server
   never needs a Go toolchain — which matters at 916 MB.
5. **Build the Next apps on the box**, sequentially, with
   `NODE_OPTIONS=--max-old-space-size=3072`.
6. **Persist.** `pm2 save` + `pm2 startup systemd`.

Routine deploys afterwards: `./deploy.sh [all|api|web|admin]` from the JTrax folder.
It always deploys `origin/main`, never the working tree, and smoke-tests four
endpoints at the end. Since 2026-09-20 the smoke test goes through nginx on 443 by
hostname (`curl --resolve`); before that it still checked web on `:80` and admin
on `:8080`, which stopped being true when TLS went in. Migrations run by
themselves when the new backend starts — there is no separate migrate step.

## Gotchas

**The Lightsail firewall is not reachable over SSH.** Ports and static IPs live in
the AWS control plane. Only 22 and 80 are open by default — 443 is *not* — so TLS
will need a console change too, not just certbot.

**Each app gets its own hostname, not a subpath.** Neither Next app sets
`basePath`, so serving admin under `/admin` would break every asset URL.
Verified live on 2026-09-17: `54-254-234-85.sslip.io` → :3000,
`admin.54-254-234-85.sslip.io` → :3001, `api.54-254-234-85.sslip.io` → :8790,
all on 443 with Certbot certificates. Nothing listens on 8080 any more.

**nginx's stock `server` block had to be commented out** (`/etc/nginx/nginx.conf`
lines 37-53, original at `nginx.conf.orig`), or two servers fight over `:80`.

**nginx now does proxy the Go backend**, on `api.`, which is what lets Stripe's
webhook reach it — the only inbound call the API takes. Probed 2026-09-17: a
forged signature answers 400, so the route is mounted and Stripe is configured.
Originally it did not, and both Next apps reach it server-side
on `127.0.0.1:8790` through their own `/api/[...path]` route, which attaches the
session token. So the backend is not publicly exposed and there is no CORS to
configure. Note that route prepends `/api/v1/` — `/api/public/x` in the browser is
`/api/v1/public/x` at the backend, which will waste your time when a hand-written
curl 404s.

**Verify a reboot, do not assume it.** `pm2 startup` printing a success line is the
same *silent success* shape as [[git-workflow-verify-the-goal]]. An actual reboot
confirmed swap remounts, pm2 resurrects all three, and all four endpoints return
200. A Lightsail *reboot* keeps the public IP; a *stop/start* does not.

## Still open

- ~~**No TLS.**~~ Resolved 2026-09-17 on `sslip.io` names, and 2026-09-24 on
  the academy's own domain (see [[#Moved to a real domain]]).
- **SQLite has only the daily Lightsail snapshot behind it.** Litestream to S3 is
  not set up, and no restore has ever been tested. Config and restore check
  are in backend PR #117 (2026-10-15); the box setup is in
  [[backups-with-litestream]] and is still to do.
- **SSH is open to the world** on 22; it should be restricted to a known address.
- **`jtrax-ai` is not hosted anywhere** — 3.7 GB of PyTorch and Maia2 checkpoints
  will not fit on this box and Lightsail has no GPU instances.

## Deploy log

- **2026-10-15:** full deploy of backend #115–#121, web #114–#118 and admin #183–#184
  (the mobile merges, #69–#74, have no server side). The live database was backed up first
  with `sqlite3 .backup` to `~/data/jtrax-pre-2026-10-15.db` (`integrity_check` ok, at
  migration 0079). Migrations 0080 (`consent_record`) and 0081 (`data_request`) applied
  on start. Smoke test 4/4; `/privacy` answers 200 with the draft notice; the new
  `/me/export` and `/data-requests` routes answer 401 without a session; the first
  retention sweep left no expired sessions or stale ID reads. See
  [[sessions-slide-and-end-on-every-password-change]], [[url-state-across-the-apps]],
  [[privacy-notice-consent-export-and-erasure]].
- **2026-10-03:** full deploy of backend #75 and #76, web #88, and admin #143 (the mobile
  #40 merge has no server side). Before deploying, the live database was backed up with
  `sqlite3 .backup` to `~/data/jtrax-pre-2026-10-03.db`. The new binary was then run on
  port 8799 against a copy, to check that migrations 0041–0058 applied cleanly (60 in
  all, `integrity_check` ok). Existing tournaments stay live because 0048's `draft`
  column defaults to 0. Smoke test passed 4/4. Two migrations share the 0041 prefix;
  that is harmless because `schema_migration` tracks by filename. Backend #58 was not
  merged: it changes public registration to multipart with an ID photo, which needs
  web #68.

## Resolved after first write

**Static IP attached 2026-09-16:** `54.254.234.85` (`Jtrax-StaticIp`). Attaching it
*changed* the public address from the launch-time `13.212.239.237` — worth knowing,
because `NEXT_PUBLIC_PORTAL_URL` is inlined by Next at **build** time, so the admin
console had to be rebuilt, not just restarted. Anything holding the old address
(SSH alias, `ALLOWED_ORIGINS`, pm2 env) needed updating in the same pass.

**Firewall:** 443 open to all. The old 8080 rule — open to one source address while
the admin login was still plain HTTP — is obsolete now that admin has its own TLS
hostname, and should be closed. Not verified here: the Lightsail firewall is not
reachable over SSH, so this needs the console.

## Moved to a real domain

**2026-09-24.** The three apps now run on `portal.`, `admin.` and `api.` of the
academy's own domain. The names are written down only in `JTrax/SERVER.md` and
`deploy.sh`, which are not in git: **every JTrax repo is public, this vault
included**, so no note here names them. (They are not secret — DNS and the
public certificate logs list them — but nothing in a public repo needs to
point at the box.)

What happened, and why:

- **The symptom:** the new names answered over **plain HTTP**. They had no
  server block of their own, so they fell through to a catch-all on port 80
  that served the portal — sign-in page included — unencrypted, for every
  name, `api.` and `admin.` too.
- **Certificate:** `certbot certonly --nginx`, certificate name = the domain,
  covering the three names. `certonly` on purpose: certbot issues and renews,
  and `conf.d/jtrax.conf` is written by hand, so its comments and structure
  survive renewals.
- **nginx now:**
  - Nothing is served on port 80. Every known name redirects to HTTPS, and the
    bare IP and unknown names redirect to the portal.
  - An unknown name on 443 gets `ssl_reject_handshake on` rather than the
    first certificate on the box.
  - `X-Forwarded-For` is **set to `$remote_addr`, not appended**. The
    backend's rate limiter reads the left-most entry (`httpx.clientIP`), and
    appending kept whatever the caller had sent there, which made every per-IP
    limit dodgeable. This closes that at the edge.
  - HSTS (1 year, no `includeSubDomains`), `nosniff`, `SAMEORIGIN` framing,
    and a referrer policy on the new names. `server_tokens off`, and Next's
    `X-Powered-By` is hidden.
- **The old `sslip.io` names:** the portal and admin names 301 to the new
  ones. The API name still **proxies**, because installed phone builds and the
  Stripe / LINE webhooks point at it, and a redirect would drop a webhook POST.
  Remove that block once those have moved.
- **App config:** `APP_URL`, `ADMIN_URL`, `PUBLIC_API_URL` and `ALLOWED_ORIGINS`
  in the backend `.env`, and `NEXT_PUBLIC_PORTAL_URL` in the admin's
  `.env.local` and in `ecosystem.config.js`, now use the new names. The admin
  console was rebuilt, because Next inlines `NEXT_PUBLIC_` at build time.
  The edit replaced address strings in place and printed only variable names;
  the files stay mode 600.

**Checked from outside, 2026-09-24:**
- Each new name serves a valid certificate, and HTTP redirects to HTTPS.
- The portal → Next → Go → SQLite chain answers 200.
- Unauthenticated `GET /api/v1/students` answers 401, and a forged Stripe
  signature answers 400.
- The running API process carries the new values.
- `deploy.sh`'s smoke test goes through the new names: 4/4 answer 200.

## Secrets

Nothing is committed. On the box: `~/apps/jtrax-backend/.env` and each app's
`.env.local`, all mode 600. The variables are `DATABASE_URL`, `PORT`,
`ALLOWED_ORIGINS`, `APP_URL`, `ADMIN_URL`, `PUBLIC_API_URL`, `JTRAX_API_URL`,
`NEXT_PUBLIC_PORTAL_URL`, plus each feature's own keys (see `SERVER.md`). The SSH private key
lives on the Mac only, outside every git repo.

Tags: #ops #deployment #lightsail #aws
