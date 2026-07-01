# JTrax Docs

Shared documentation vault for the JTrax project. Lives in its own repo (`jtrax-docs`)
and is opened as part of the JTrax Obsidian vault.

## When we write docs
After a **major or otherwise notable change** — a shipped feature, a stack/architecture
decision, an ops change. Not preemptively.

## Structure
- `decisions/` — architecture decision records (ADRs), one file per decision: `NNNN-title.md`.
- `architecture/` — system design and diagrams.
- `api/` — API reference notes.
- `meeting-notes/` — dated meeting notes.

## Keeping the shared repo conflict-free
This vault is shared on GitHub, so we optimize for **no merge conflicts**:

1. **Additive by default** — one new file per change / decision / meeting. Avoid several
   people editing the same file.
2. **Pull before you write, push right after** (single-main): `git pull` → edit →
   `git commit` → `git push`, then tell others to pull.
3. **Per-user Obsidian state is gitignored** — `workspace.json`, `workspace-mobile.json`,
   `cache`, `.trash/` change every session and are the top conflict source.
4. Keep reformatting out of content commits.

**Tip:** enable the Obsidian **Git** community plugin (auto-pull on open + auto-commit/push
on a timer) so the pull-before-edit rhythm is automatic.
