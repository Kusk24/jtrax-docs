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
endpoints at the end.

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

- **No TLS.** Everything is plain HTTP, including the admin login, which posts a
  password in the clear. This is the top outstanding risk and blocks real use.
  Needs a domain first — there is none yet.
- **SQLite has only the daily Lightsail snapshot behind it.** Litestream to S3 is
  not set up, and no restore has ever been tested.
- **SSH is open to the world** on 22; it should be restricted to a known address.
- **`jtrax-ai` is not hosted anywhere** — 3.7 GB of PyTorch and Maia2 checkpoints
  will not fit on this box and Lightsail has no GPU instances.

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

## Secrets

Nothing is committed. On the box: `~/apps/jtrax-backend/.env` and each app's
`.env.local`, all mode 600. The variables are `DATABASE_URL`, `PORT`,
`ALLOWED_ORIGINS`, `JTRAX_API_URL`, `NEXT_PUBLIC_PORTAL_URL`. The SSH private key
lives on the Mac only, outside every git repo.

Tags: #ops #deployment #lightsail #aws
