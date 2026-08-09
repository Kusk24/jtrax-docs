---
name: vault-note
description: "Write a knowledge-vault note after shipping work — feature, decision, bug, or ops. Use when a change has just been completed, merged, or deployed; when the user says something is done or working; or when asked to document what changed, record a decision (ADR), write up a bug, or capture an ops/runbook step. Also use to fix stale notes when a module, repo, or route has been renamed."
---

# Vault note

Write the note yourself, without being asked, once a piece of work is done. The vault
is the canonical cross-repo record — repo docs describe code, the vault describes
what changed and why.

## Before writing

1. **Find the vault.** Its path is in the project's `CLAUDE.md`. If there isn't one,
   ask where notes should go rather than inventing a location.
2. **Pull first** if the vault is a git repo — it is usually shared and single-branch.
3. **Search before creating.** If a note already covers this area, update it rather
   than adding a near-duplicate. Duplicate filenames break wikilinks.

## Which folder

| Folder | For | Filename |
|---|---|---|
| `features/` | New or changed user-visible capability | `kebab-case-feature.md` |
| `decisions/` | A choice with alternatives and consequences (ADR) | `kebab-case-decision.md` |
| `bugs/` | A defect worth remembering — cause and fix | `kebab-case-symptom.md` |
| `ops/` | Deploy, infra, runbooks, incidents | `kebab-case-topic.md` |
| `research/` | Audits, analyses, findings with a date | `Title - YYYY-MM-DD.md` |

Names must be unique across the whole vault — `[[wikilinks]]` resolve by filename, so
a second `security-hardening.md` makes both ambiguous.

## Shape

Use the matching file in `_templates/`. Every note carries:

- **A one-line summary** at the top — what changed, in the reader's language.
- **Why**, not just what. The reason survives longer than the code.
- **Wikilinks** to related notes: `[[other-note]]`. Link liberally; a link to a note
  that doesn't exist yet is a valid marker of work to do.
- **Absolute dates** (`2026-08-09`), never "last week".
- **Concrete references** — `file:line`, migration numbers, route paths, PR numbers.
- **Tags** at the bottom: `#feature #decision #bug #ops` plus the area.

## Never write into the vault

- Secrets of any kind — keys, tokens, passwords, connection strings, `.pem` contents.
  If a note needs to mention one, name the environment variable instead.
- Anything about a person's performance, compensation, or equity without asking first.
- Customer or patient data. Use a placeholder.

## After writing

- Add the note to the relevant index if the vault keeps one.
- **Don't commit or push** unless the user asks — they run git themselves. Tell them
  the note is written and uncommitted, and if the vault is shared, remind them others
  need to pull once they push.
