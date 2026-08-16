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

## The opposite failure, three times over

**2026-08-16, `jtrax-admin`.** Merging a stack *with* `--delete-branch` is the
mirror image of the same trap, and it bit three times before the lesson stuck:
PR #26, then #31, then nearly #33.

```sh
gh pr merge 25 --squash --delete-branch   # closes PR #26, whose base was that branch
gh pr edit 26 --base main
# GraphQL: Cannot change the base branch of a closed pull request.
```

Deleting the base branch closes every PR pointing at it, and GitHub refuses to
reopen or retarget a closed PR — the review thread is gone for good. The
recovery each time was a fresh PR against `main`, which loses the discussion and
renumbers the work.

**Rule: never pass `--delete-branch` while any PR still targets that branch.**
Merging a stack goes:

```sh
gh pr merge <parent> --squash          # no --delete-branch
git checkout -B <child> origin/<child>
git rebase origin/main                 # squash rewrote history; rebase, don't merge
git push -f origin <child>
gh pr edit <child> --base main
gh pr merge <child> --squash
# …repeat, then delete every branch at the end
```

The rebase matters as much as the flag: a squash merge replaces the parent's
commits with one new commit, so a child branch still carrying the originals
conflicts against `main` even though the *content* is identical.

Related: [[0005-render-and-turso-for-free-hosting]],
[[backend-crud-and-live-portals]], [[claude-workspace-setup]]

Tags: #bug #ops #process #git
