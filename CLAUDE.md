# jtrax-docs

The JTrax knowledge vault — single `main` branch, shared; pull before writing.
Note conventions and templates: see `_templates/` and the `vault-note` skill.

**Start at `INDEX.md`, not at the notes.** The vault is ~99 notes and ~72,000
words; the index is one line each, so the whole thing can be surveyed for the
cost of a single note. Read it, then open only what it points at. It is
generated — `python3 _workspace/reindex.py` after adding or renaming a note,
which a `PostToolUse` hook already does automatically. It is not committed:
it is derived from the notes, and a generated file that everyone rewrites is
a merge conflict waiting to happen.

House rules: `../CLAUDE.md`.
