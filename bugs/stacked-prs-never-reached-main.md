# Three PRs showed as merged but only the first reached main

**Found:** 2026-08-13 · **Fixed:** 2026-08-13 · **Repos:** `jtrax-backend`

## Symptom

`gh pr list --state merged` reported PRs #1, #2 and #3 all merged on
2026-08-11. `main` contained four files: `cmd/server/main.go`, `internal/db/db.go`
and the two migrations. Auth, the CRUD engine, the seed and all seven
integration tests were missing — roughly 1,400 of the backend's 1,776 lines
were absent from the branch everything deploys from.

Nothing was lost; the work sat on `feature/auth` and `feature/crud-api`. But
`main` was not deployable, and the PR list gave no hint of that.

## Cause

The three PRs were opened as a stack, each targeting its parent:

```
PR #1: feature/database-schema -> main                    ✅ reached main
PR #2: feature/auth            -> feature/database-schema ❌ merged into a branch
PR #3: feature/crud-api        -> feature/auth            ❌ merged into a branch
```

When #1 merged into `main`, GitHub did not retarget #2, because the
organisation keeps branches on merge — `feature/database-schema` still existed,
so #2's base was still valid and merging it "succeeded". Same for #3. Each PR
was genuinely merged into the branch it named. None of that reached `main` past
the first.

The failure is silent by construction: every PR shows the green "Merged" badge,
and the only way to notice is to look at what `main` actually contains.

## Fix

Re-opened the same two branches as PRs #4 (`feature/auth` → `main`) and #5
(`feature/crud-api` → `main`). No code changed; only the base branch. Because
the stack is linear, #5 contains #4's commits and merging them in order
restores `main` exactly.

## Prevention

The house rules already carried this rule before it happened —
"*Stacked PRs need manual retargeting. When a parent merges, run
`gh pr edit <N> --base main` or main silently misses commits*" — and it was
still missed, because the retarget has to happen at merge time and the merge is
done by a human in a browser hours later.

The more reliable habit, now being used for the deployment work: **target every
PR at `main` from the start.** GitHub then shows a cumulative diff until the
parent merges, which is noisier to review but cannot silently miss commits.

Cheap check, worth running after merging any stack:

```sh
git fetch origin && git log --oneline origin/main -5
git merge-base --is-ancestor origin/feature/x origin/main && echo in || echo MISSING
```

Related: [[0005-render-and-turso-for-free-hosting]],
[[backend-crud-and-live-portals]], [[claude-workspace-setup]]

Tags: #bug #ops #process #git
