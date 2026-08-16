# Seeded admin password and rate limiting both broke once the API left localhost

**Found:** 2026-08-13 · **Fixed:** 2026-08-13 · **Repos:** `jtrax-backend`

## Symptom

Neither was visible on a laptop. Both were found while preparing the first
deployment (PR #6), by asking what changes when the same code answers requests
from the internet instead of `localhost`.

1. Anyone who read the public repository could sign in as
   `admin@jca.ac.th` on the deployed API.
2. One caller sending eleven bad logins a minute would lock **every** user out
   of signing in.

## Cause

**The seed published an admin password.** `db.Seed` hardcoded one throwaway
literal (now the documented `db.DevPassword`) for every seeded account, admin
included, and `main` ran the seed unconditionally at startup. That is exactly right for a throwaway local
file and exactly wrong for a URL the internet can reach — the password is a
string literal in a public repo, so the credential is effectively published
alongside the code. The mistake was not the constant; it was that nothing
distinguished "local file" from "remote database" at the point of seeding.

**Rate limiting keyed on the wrong address.** The limiter bucketed by
`r.RemoteAddr`, which is correct when the client connects directly. Behind
Render's proxy every request arrives from the proxy, so all callers shared one
bucket — the fixed window of 10/minute became a global limit on the login
endpoint, turning a per-attacker control into a denial-of-service lever.

Both are the same class of bug: code that is correct on `localhost` and wrong
the moment a proxy and a public URL exist. Neither would ever fail a test that
only runs locally.

## Fix

- `cmd/server/main.go` — `seedConfig` decides whether to seed. A remote DSN
  must opt in with `JTRAX_SEED=1` *and* supply `JTRAX_SEED_PASSWORD`; passing
  the published dev password to a remote database is a startup error. A local
  file still seeds itself so a fresh clone is usable.
- `internal/db/seed.go` — `Seed` takes the password as an argument instead of
  hardcoding it. The constant survives as `db.DevPassword`, documented as
  local-only.
- `internal/httpx/middleware.go` — new `clientIP` prefers the left-most
  `X-Forwarded-For` entry, falling back to `RemoteAddr`. That header is
  caller-supplied and trivially spoofed, so it may only relax a limit, never
  tighten one: it is used for rate limiting alone and never for an
  authorization decision.

## Prevention

`TestSeedConfig` in `cmd/server/main_test.go` covers all six cases, including
"remote database refuses the published dev password". It was confirmed to fail
when the guard is removed, so it is a real gate rather than a passing assertion.

The rate-limit fix was driven with live requests rather than unit-tested: 12
logins from 12 distinct forwarded IPs were never throttled, 12 from a single
forwarded IP were throttled after 10. There is **no automated test** for it —
that is a gap, and the natural place to close it is a handler-level test in
`internal/httpx`.

The general rule worth keeping: before a service becomes publicly reachable,
re-read anything that touches credentials or client identity, because both are
things `localhost` quietly gets right for you.

Related: [[0005-render-and-turso-for-free-hosting]],
[[deploying-jtrax-backend]], [[backend-crud-and-live-portals]]

Tags: #bug #security #backend #auth
