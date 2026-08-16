# Deploying jtrax-backend

**Date:** 2026-08-13 · **Environment:** production

## What this covers

Getting the Go API onto Render with a Turso database, and pointing the two
Vercel portals at it. The step-by-step runbook lives with the code at
`jtrax-backend/docs/deployment.md` — this note is the cross-repo view and the
things worth knowing before you start. Why this pairing:
[[0005-render-and-turso-for-free-hosting]].

## Steps

1. **Database.** `turso db create jtrax`, then `turso db show jtrax --url` and
   `turso db tokens create jtrax`.
2. **Service.** Render dashboard > Blueprints > New Blueprint Instance, pointed
   at `Kusk24/jtrax-backend`. `render.yaml` describes everything; Render prompts
   for the values marked `sync: false`.
3. **Seed once.** Migrations run on every boot; seeding does not. Set
   `JTRAX_SEED=1` and `JTRAX_SEED_PASSWORD`, redeploy, then remove both and
   redeploy again.
4. **Portals.** Set `JTRAX_API_URL` to the Render URL in both Vercel projects
   and redeploy. No code change — `app/api/[...path]/route.ts` already reads it.
5. **Keep-alive.** Set the `BACKEND_URL` Actions *variable* in the backend repo
   so `.github/workflows/keep-alive.yml` can ping `/health`.

## Gotchas

**The keep-alive is load-bearing, not a nicety.** A free service sleeps after 15
minutes idle and takes 30-60s to wake. Vercel gives up first, so a sleeping
backend looks like a 504 in the portals rather than a slow page. If the portals
start returning "backend unreachable", check whether the cron ran before
assuming the service crashed.

**750 free instance-hours per workspace per month.** Staying awake all month
costs ~730. The ~20 hours of margin disappears the moment a second free service
exists in the same Render workspace — then both get suspended until the month
rolls over.

**Seeding is deliberately opt-in.** It publishes accounts on a URL the internet
can reach, so a remote database refuses to seed unless told to, and refuses the
dev password outright. See [[public-url-forced-two-security-fixes]].

**Migrations are split before they are sent.** The libSQL protocol takes one
statement per request, so `internal/db/statements.go` splits each file. It
understands quoted strings and `--` comments but not an inner `;`, so a
`CREATE TRIGGER` would need the splitter taught about `BEGIN … END` first.

**`turso db dump jtrax > jtrax-$(date +%F).sql` before anything schema-shaped.**
The free plan keeps 24h of point-in-time restore, which is less reassuring than
a file you hold.

## Secrets

Named by environment variable only:

- `DATABASE_URL` — the `libsql://` URL. Not itself a secret, but pair it with:
- `TURSO_AUTH_TOKEN` — kept as its own variable so the token never lands in a
  value that gets logged. The server folds it into the DSN at startup and
  redacts the result before logging (`db.Redact`).
- `JTRAX_SEED_PASSWORD` — set only for the one deploy that seeds, then removed.
- `JTRAX_API_URL` — in Vercel, per project. Server-side only; no
  `NEXT_PUBLIC_` prefix, because the browser never calls the backend directly.

Related: [[0005-render-and-turso-for-free-hosting]],
[[backend-crud-and-live-portals]], [[claude-workspace-setup]]

Tags: #ops #backend #deployment
