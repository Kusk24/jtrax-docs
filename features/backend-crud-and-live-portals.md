# Backend CRUD system + admin/web portals on live data

**Date:** 2026-08-12 · **Repos:** `jtrax-backend`, `jtrax-admin`, `jtrax-web-app`

The Go backend is real: full schema from `jtrax-ermodel.pdf`, session auth,
and role-scoped CRUD over every entity — and both the admin console and the
web portals now read and write it. Mobile is intentionally untouched (pending
refactor). Architecture rationale: [[0004-sqlite-and-generic-crud-backend]].

## PRs (stacked where noted)

- `jtrax-backend` #1 schema migrations → #2 session auth → #3 CRUD API +
  seed + integration tests (each PR retargets to `main` when its parent
  merges — `gh pr edit <N> --base main`)
- `jtrax-admin` #12 — console on the live API
- `jtrax-web-app` #15 — portals on the live API

## Backend surface

- `POST /api/v1/auth/login|logout`, `GET|PATCH /api/v1/auth/me` (login is
  rate-limited; passwords PBKDF2; opaque tokens in `auth_session`, 30-day TTL)
- `/api/v1/<resource>` list/get/create/update/delete for all 21 ER entities,
  driven by the registry in `internal/api/registry.go` — per-verb role
  permissions, enum validation, and Parent/Student row scoping **in the
  query**. `user_account` endpoints are bespoke (hashes never serialize).
- Seed (`internal/db/seed.go`) mirrors the frontend mocks: Sandy (Parent),
  Penny/Uri (Students), Ms. Serene (Teacher), admin account, classes,
  packages, payments, Wellington tournament. All seeded accounts share
  `db.DevPassword` (local databases only — see
  [[public-url-forced-two-security-fixes]]). Runs on empty DB only.
- Dev: `PORT=8790 go run ./cmd/server` (8080 is taken on the dev machine);
  DB file via `JTRAX_DB`. Reading the SQLite file with another tool while
  the server runs shows stale pre-WAL state — query through the API instead.

## Frontend integration pattern (same in both apps)

Bearer token in an **httpOnly cookie** → server layouts gate by role →
browser calls a same-origin `/api/[...path]` proxy route that attaches the
token server-side (token never reaches client JS). A client-side data
provider fetches collections and maps snake_case ER rows into the existing
display shapes (`jtrax-admin/lib/live.ts`, `jtrax-web-app/components/parent/
ParentData.tsx`), so screens kept their design-port markup.

## What's live vs still mock

- **Live (admin):** students (list/detail/edit/delete + registration wizard
  with enrollment), payments, admins, academy classes + teachers (teacher
  create provisions a Teacher account), announcements, tournaments.
- **Live (web):** sign-in landing, parent children/credits/attendance/
  announcements/tournament registration/notification prefs; student game
  streak + practice_activity write on completing the daily puzzles.
- **Still mock:** admin dashboard KPIs/check-ins/messages; web parent
  notifications list (no notifications entity in the ER model) and the
  practice chart when no rows exist. Domain workflows beyond row CRUD
  (credit consumption on check-in, streak recompute) need bespoke endpoints.

Tags: #feature #backend #admin-app #web-app
