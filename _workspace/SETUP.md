# JTrax workspace setup — work the same way as everyone else

Five minutes, once per machine. This folder holds the shared Claude Code
configuration for JTrax: the house rules, two workflow skills, and a
permission allowlist. Installing it makes a fresh Claude Code session behave
identically for every collaborator.

## 1. Lay out the workspace

The workspace root is a plain folder (NOT a git repo) with the repos as
siblings:

```
JTrax/
├── CLAUDE.md          ← house rules (from this folder)
├── .claude/           ← skills + permissions (from this folder)
├── jtrax-web-app/
├── jtrax-admin/
├── jtrax-mobile-app/
├── jtrax-backend/
└── jtrax-docs/        ← this repo, the knowledge vault
```

## 2. Copy the kit to the workspace root

```bash
cd <your JTrax workspace root>
cp jtrax-docs/_workspace/CLAUDE.md .
cp -R jtrax-docs/_workspace/.claude .
```

`.claude/` is a hidden folder — it won't show in Finder or Obsidian, that's
normal. Note the filename matters: Claude Code auto-loads **`CLAUDE.md`**
only; any other name is ignored.

## 3. Always start Claude Code from the workspace root

That's what makes cross-repo questions answerable and loads the rules +
skills automatically. Verify with `/context` — the house rules should be
listed. You should also have `/vault-note` and `/ship-ready` available.

## 4. If you use Obsidian

Open **`jtrax-docs/` as the vault**, not the workspace root — otherwise every
repo README becomes a note and wikilinks collide.

## 5. Keep the kit in sync

The copies in this folder are the source of truth. If you improve the house
rules or a skill in your workspace root, copy the change back here and push —
every correction worth repeating belongs in the shared rules, not in one
person's setup.

## 6. Never put secrets in the workspace

Anything inside the workspace is readable by every agent session without a
prompt. Keys → `~/.ssh` · logins → password manager · app secrets →
gitignored `.env`, referenced by variable name only.
