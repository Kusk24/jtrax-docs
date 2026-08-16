# 0004 — SQLite storage and a registry-driven generic CRUD API

**Date:** 2026-08-11 · **Status:** Accepted · **Repos:** `jtrax-backend`

## Context

The ER model (`jtrax-ermodel.pdf`, 21 entities) is final enough to build on,
and the admin + web portals need real CRUD now. The backend was a bare Go
stdlib scaffold ([[0003-backend-switched-to-golang]]); no database or
framework had been chosen, and Go was not previously installed on the dev
machine (installed via Homebrew, go 1.26).

## Decision

- **SQLite via `modernc.org/sqlite`** (pure Go, no cgo) as the only
  dependency. One writer connection, WAL mode, FKs on. Schema lives in
  hand-written append-only migrations (`internal/db/migrations/NNNN_*.sql`)
  applied by a ~60-line embedded runner — no ORM, per house rules.
- **A generic CRUD engine driven by a resource registry**
  (`internal/api/registry.go`): each entity declares its table, columns,
  enum values, per-verb role permissions, and per-role row-scope SQL.
  Five handlers (list/get/create/update/delete) serve all 21 entities.
- **Auth:** stdlib PBKDF2 password hashes, opaque bearer tokens in an
  `auth_session` table (own migration — infrastructure, not ER),
  fixed-window rate limit on login. Roles: Admin/Receptionist = staff
  (full CRUD), Teacher (attendance + session writes), Parent/Student
  (reads and writes scoped to their own rows **in the query**, not the
  caller).

## Alternatives considered

- **Postgres**: better concurrency/enums, but requires a running service for
  a school-sized single-tenant app; SQLite keeps dev and deploy trivial. The
  migration files are plain SQL, so a later move is mechanical.
- **Hand-written per-entity handlers**: ~21× the code for identical shapes;
  the registry keeps authorization rules in one reviewable file. Bespoke
  endpoints still exist where shape demands it (`user_account`, `/auth/*`).
- **An ORM / sqlc generation**: banned by house rules (hand-written
  migrations) and unnecessary at this scale.

## Consequences

- Domain workflows that are more than row CRUD (credit consumption on
  check-in, streak recomputation) still need bespoke endpoints — the
  registry only covers entity CRUD.
- SQLite's single-writer model caps concurrent writes; fine for one academy,
  revisit if multi-branch write load grows.
- `session_status`/enum changes require a new migration (CHECK constraints).

Tags: #decision #backend
