# Host the backend on Render (free Docker) with Turso as the database

**Date:** 2026-08-13 · **Status:** accepted

## Context

The portals were already deployed on Vercel, but `jtrax-backend` ran only on a
laptop against a local SQLite file — so nothing on the internet had data behind
it. The requirement was explicit: *free*, and comfortable enough to keep using.

Constraints that were real at the time:

- The backend is 1,776 lines of Go with a pure-Go SQLite driver
  (`modernc.org/sqlite`), so it compiles to a static binary and a small
  container. Nothing about it needed changing to be hostable.
- It is SQLite-shaped in two places: 254 `?` placeholders and `datetime('now')`
  defaults in the migrations. Any move to Postgres pays for both.
- The portals reach the backend through their own `/api/[...path]` proxy route,
  so the browser never calls it directly. No CORS, no cookie-domain problem,
  and the host only has to be reachable from Vercel's servers.
- Several "free" tiers named in the original stack diagram are no longer free:
  Railway is ~$5/mo, Fly.io ~$2-3/mo.

## Options considered

| Option | Pro | Con |
|---|---|---|
| Render + Turso | No card anywhere; SQLite dialect unchanged, so zero query rewriting | Free service sleeps after 15 min idle; 30-60s cold start |
| Google Cloud Run + Turso | Scales to zero, no sleep penalty, generous always-free quota | Requires a card on the Google Cloud account |
| Cloud Run / Render + Neon Postgres | Standard Postgres, better long-term ceiling | Placeholder rewrite shim plus dialect fixes in both migrations |
| Fly.io keeping SQLite on a volume | Least work of all — just a Dockerfile and a volume | Not free |
| Supabase (PostgREST + RLS), no server | Nothing to host; RLS *is* query-layer isolation | Full rewrite; free projects pause after ~1 week idle and need a manual click to wake |
| Move the API into Next.js on Vercel | One less service | Rewrite of the CRUD engine and auth; the admin console would then call the web app cross-origin |

## Decision

**Render free Docker service + Turso**, keeping the Go backend as-is.

The deciding reason was the "no card" constraint combined with Turso speaking
SQLite: every query and both migration files run unchanged, so the port was a
driver swap rather than a database migration. Turso being reached over HTTP
also suits a host that sleeps — there is no connection pool to re-establish on
wake, which is what makes Postgres awkward behind a scale-to-zero service.

Supabase was rejected despite appearing in the original stack diagram: free
projects pause after about a week of inactivity and need a manual restore. For
a school app used in bursts that is the opposite of comfortable.

## Consequences

**Easy now.** Local development is untouched — `go run ./cmd/server` still uses
a local file and seeds itself. `DATABASE_URL` picks the driver
(`internal/db/db.go:36`). Migrations are applied one statement at a time on
*both* drivers, so the local test suite exercises the same code path deployment
uses (`internal/db/statements.go`).

**Harder now.** The free plan spins down after 15 minutes idle and takes 30-60s
to wake — longer than Vercel waits, so a sleeping backend surfaces in the
portals as a 504, not as a slow page. A GitHub Actions cron pings `/health`
every 10 minutes to prevent it. That works because a full month of uptime costs
~730 of the 750 free instance-hours, but **only while `jtrax-backend` is the
only free service in the workspace**. Adding a second one suspends both.

**To revisit.** If the 500M monthly row reads become tight — the portals fetch
every collection on load — the fix is caching in the proxy route, not a bigger
plan. If the cold-start ceiling stops being acceptable, Cloud Run is the same
container with no code change.

Related: [[0004-sqlite-and-generic-crud-backend]],
[[0003-backend-switched-to-golang]], [[deploying-jtrax-backend]],
[[public-url-forced-two-security-fixes]], [[stacked-prs-never-reached-main]]

Tags: #decision #ops #backend #hosting
