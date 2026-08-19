# Git workflow: verify the goal, not the operation

**Date:** 2026-08-20 · applies to every JTrax repo

Twice now, work that every tool reported as successful never reached `main`:

1. **Stacked PRs merged top-down** (2026-08-19): children merged into parent branches that were never retargeted, because `delete_branch_on_merge` is off in this org. GitHub said MERGED; the commits were stranded on intermediate branches. Recovered by PRs #24/#25/#49.
2. **A push after the merge** (2026-08-19): jtrax-web-app#32 was merged at `a84ecc5`; a follow-up fix was force-pushed to the same branch minutes later. The push succeeded, the PR showed merged — the commit sat on a closed branch. Recovered by #33.

Both share the *silent success* shape: every operation reports green, only the goal fails. The keep-alive cron had the same shape ([[keeping-the-free-backend-awake]]).

## The rule

After any merge, and before claiming anything shipped, ask the question that matters:

```sh
git fetch origin
git ls-tree -r --name-only origin/main | grep <the-new-file>
# or: git log origin/main --oneline -3
```

**Does `main` contain the work?** — not "did the PR merge", not "did the push succeed", not "is the workflow green". And once a PR is merged, its branch is dead: follow-ups go on a fresh branch off `main`, never onto the merged branch.

Tags: #ops #git
