# Claude workspace setup for collaborators

**Date:** 2026-08-09 · **Repos:** `jtrax-docs` (distribution), workspace root (install target)

Every collaborator runs Claude Code with the same house rules, skills, and
permissions. The shared kit lives in [`_workspace/`](../_workspace/SETUP.md)
in this repo — follow its `SETUP.md` (copy `CLAUDE.md` + `.claude/` to your
workspace root, start Claude from the root, point Obsidian at `jtrax-docs/`
only).

What the kit enforces:

- **House rules** (`CLAUDE.md`): act by default; user commits/pushes unless
  they ask Claude to; branch per seam with small per-concern commits,
  single-line conventional messages with no scope; auto-open the PR when a
  seam is done; three-layer docs with this vault as the source of truth;
  security/i18n/verification gates. JTrax specifics (stack, repos, run
  commands, EN+TH rules) are at the bottom of the file.
- **`vault-note` skill**: writes the feature / decision / bug / ops note here
  after work ships, using `_templates/`, without being asked.
- **`ship-ready` skill**: pre-PR checklist — one seam, commit hygiene, secret
  scan, security rules, migrations, i18n, end-to-end verification, docs.
- **Permission allowlist** (`.claude/settings.json`): read-only git/pnpm/gh
  commands stop prompting.

The `_workspace/` copies are canonical — improve rules there and push, don't
let personal setups drift. Related: [[portal-redesigns-from-claude-design]]
for how the current portals were built under these rules.

Tags: #ops #tooling #onboarding
