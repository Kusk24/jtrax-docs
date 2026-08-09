---
name: ship-ready
description: "Pre-pull-request check — verify the branch holds one logical seam, commits are small with correct message style, no secrets are staged, security rules were applied, docs and vault notes are written, and the change was actually driven end to end. Use before opening a PR, when the user asks whether work is ready to ship or ready for review, or after finishing a feature."
---

# Ship-ready check

Run through this before a pull request exists. Report what passes and what doesn't —
do not fix silently, and do not commit or push.

## 1. One seam per branch

```bash
git log main..HEAD --oneline
git diff main...HEAD --stat
```

- Does every commit belong to the same logical change? If the branch mixes seams
  (a refactor plus a feature, two unrelated features), say so and propose the split
  **now** — after the PR exists it is far more expensive.
- Is the branch name purpose-shaped, not `patch-1`?

## 2. Commit hygiene

- Single-line subjects, conventional prefix, **no scope**: `feat: …` not `feat(api): …`.
- No commit that mixes a verbatim move with a behaviour change.
- Nothing staged by accident — check `git status` for stray files.

## 3. Secrets

```bash
git diff main...HEAD | grep -nEi '(api[_-]?key|secret|password|token|BEGIN [A-Z ]*PRIVATE KEY|[A-Za-z0-9]{32,})'
```

Any hit is a stop. Also confirm no `.env`, `.pem`, `.csv` of credentials, or dump file
is in the diff, and that new secrets are read from the environment.

## 4. Security rules

For every route, handler, or query the change adds or touches:

- Authorization gate present — who may call this?
- Tenant/user isolation enforced in the query, not the caller.
- Input validated at the boundary; internal errors not echoed to clients.
- Anything unauthenticated is rate-limited.

If the change touches auth, sessions, or tenancy, flag it explicitly for a second
reviewer — those paths tend to accumulate a single owner.

## 5. Data

- Schema change has a matching hand-written `migrations/NNNN_*.sql`.
- No already-applied migration was edited.
- No one-off script was run against a shared database.

## 6. Interface

- Every new user-facing string goes through the i18n layer, in all supported
  languages.
- Currency and dates formatted via `Intl` with ISO codes.

## 7. Verification

- The flow was **driven end to end**, not just typechecked. Say which flow and what
  you observed.
- New behaviour has a test that would fail without the change.
- Name anything you could not verify, and why.

## 8. Documentation

- Repo `docs/` updated if implementation changed.
- Vault note written — use the `vault-note` skill.
- No doc left referencing a name this change renamed.

## Report

Give a short pass/fail list, the exact commands you ran, and the specific items that
need the user's decision. End with what you would do next if they say go.
