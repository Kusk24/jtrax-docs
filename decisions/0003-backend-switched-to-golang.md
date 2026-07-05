# 0003 — Backend switched to Go

- **Date:** 2026-07-05
- **Repo:** `jtrax-backend` · `main` (scaffold-level change, no feature branches
  existed to conflict with)
- **Status:** Scaffold only, pushed

## Decision
The Express + TypeScript scaffold (decision 0001) is replaced by **Go**. The
repo now contains only `go.mod` (module `github.com/Kusk24/jtrax-backend`,
Go 1.23) and `cmd/server/main.go` — a stdlib `net/http` server exposing the
same `GET /health` as before (port 3000, `PORT` overridable).

## Deliberately not decided yet
No web framework (gin/echo/chi), no ORM/DB layer, no folder architecture —
the system design isn't finished, so the scaffold stays stdlib-only to keep
every option open. Nothing gets built here until the design is done.

## Note
Go isn't installed on the dev machine yet (`brew install go`), so the scaffold
is unverified-by-compile; it's ~25 lines of stdlib using the Go 1.22+ method
pattern (`"GET /health"`).
