# House rules

How I want you to work in this project. These override your defaults.

## Acting vs. deliberating

- **Default to action.** When you have enough to act, act. Don't survey options you
  won't pursue or re-litigate settled decisions.
- **Deliberate only** for destructive or irreversible moves, real branching choices,
  or genuine ambiguity.
- **I'm the source of truth.** When intent is genuinely unclear, ask — don't guess.
  One clear question beats a wrong assumption delivered confidently.
- **Report honestly.** If tests fail, say so with the output. If you skipped a step,
  say so. When something is verified, state it plainly without hedging.
- **Don't over-correct.** Fix a mistake and move on. No apology paragraphs, no
  tallying past errors.

## Branches and commits

- **I commit myself.** Don't run `git commit`, `git push`, or branch commands unless
  I ask.
- **Small commits AND separate branches.** Split each logical seam into its own
  branch up front — not several commits on one branch. Stage by path, never `git add -A`
  across seams.
- **Check before every PR.** Run `git log main..HEAD` and confirm the branch contains
  one seam. Split before the PR exists, not after.
- **Open the PR automatically once a seam is done** — after the branch is pushed and
  verified, run `gh pr create` without being asked. One PR per seam, title matching
  the commit style.
- **Stay on the branch while testing.** During a test-and-fix cycle, commit fixes to
  the current feature branch. Ask before branching off for a separate topic.
- **Stacked PRs need manual retargeting.** If the org keeps branches on merge, GitHub
  will not retarget children to `main`. When a parent merges, run
  `gh pr edit <N> --base main` or main silently misses commits.
- **Commit message style:**
  - Single-line subject only. No body, no footer.
  - Conventional prefix with **no scope**: `feat: …`, `fix: …` — never `fix(backend): …`.
  - A fix that touches several screens or concerns still gets one commit per
    concern — never one blanket commit.

## Documentation

Three layers, each with a different job:

1. **Repo `README` / `CONTRIBUTING`** — how to run, build, and contribute. Standard,
   no project jargon.
2. **Repo `docs/`** — implementation notes for the code in that repo.
3. **The vault** — canonical cross-repo knowledge: features, decisions, bugs, ops.
   Wikilinked, and the source of truth when layers disagree.

Rules:

- **Write vault notes without being asked.** After shipping a piece of work, write up
  what changed. Use the `vault-note` skill. Don't wait to be told.
- **Make repos self-documenting once real work starts** — `CLAUDE.md`, `README`,
  `docs/`. Do it when work begins, not preemptively on an empty repo.
- **Repo `CLAUDE.md` points at the vault**, it does not duplicate it.
- **Fix stale docs when you notice them.** A renamed module referenced in six notes
  is a real bug — agents cite stale notes back as fact.

## Code structure

- **Small, purpose-named modules** over large catch-all files. Re-export through a
  barrel (`index.ts`) so import sites stay stable.
- **Header comment on every module** — one or two lines on what lives here and why.
- **Refactors move code verbatim.** A move commit changes location only; behaviour
  changes go in a separate commit so the diff stays reviewable.
- **Match the surrounding code** — comment density, naming, idioms. New code should
  be indistinguishable from what's already there.
- **Reference code as `file:line`** so it's clickable.
- **pnpm only, in every repo.** Never `npm install`/`npm run`/`yarn` — the
  lockfile is `pnpm-lock.yaml` and `packageManager` is pinned. Use `pnpm exec`
  (not `npx`) to run local binaries.

## Security — do not drift

Every new feature ships with these built in, not added later:

- **Authorization gates on every route.** No endpoint ships without deciding who may
  call it.
- **Tenant/user isolation enforced at the query layer**, not in the caller.
- **Secrets come from the environment only.** Never commit a key, token, password, or
  `.pem`. Never write one into a doc, a note, or the vault.
- **Validate input at the boundary**, and never echo internal errors to a client.
- **Rate-limit anything unauthenticated.**

If a change touches auth, sessions, or tenancy, say so explicitly in your summary so
it gets a second pair of eyes.

## Data and schema

- **Hand-write numbered migrations** — `migrations/NNNN_short_name.sql`. Edit the
  schema file, then add the matching migration. Never use an ORM's auto-generate.
- **Migrations are append-only.** Never edit one that has run anywhere.
- **Never run one-off scripts against a shared database.** Write a migration.

## Interface conventions

- **Localize every user-facing string** through the i18n layer, in every supported
  language, at the time you add it — not in a later pass.
- **Currency: ISO codes only.** Use `Intl` with the ISO code (`MMK`, `THB`). Never
  hand-roll a symbol or abbreviation — `K` reads as "thousand".
- **Dates and numbers go through `Intl` too.** No hand-rolled formatting.

## Verification

- Generation is cheap; checking is the bottleneck. Before saying something works,
  **drive the actual flow** — not just a typecheck or a passing unit test.
- New behaviour ships with at least one test that would fail without it.
- If you could not verify something, say which part and why.

---

## Project specifics

- **Project:** JTrax — chess-school management (students, parents, teachers, admins;
  scheduling, attendance, credits) for JCA Chess Academy.
- **Stack:** Next.js 16 + React 19 + Tailwind v4 + next-intl, pnpm (web + admin);
  Expo SDK 57 + NativeWind + use-intl (mobile); Go (backend, SQLite + REST).
  **pnpm is the package manager for every JS repo.**
- **Repos (siblings of this file):**
  - `jtrax-web-app` — student / parent / teacher portals (`Kusk24/jtrax-web-app`)
  - `jtrax-admin` — super + branch admin portal, screens follow the user's mockups
    only (`Kusk24/jtrax-admin`)
  - `jtrax-mobile-app` — Expo port of web-app main (`Kusk24/jtrax-mobile-app`)
  - `jtrax-backend` — Go scaffold (`Kusk24/jtrax-backend`)
  - `jtrax-docs` — the knowledge vault (see below)
- **Vault:** `jtrax-docs/` — a git repo, single `main` branch, shared. Existing
  notes live in `architecture/`, `decisions/` (ADRs, `NNNN-title.md`), `api/`,
  `meeting-notes/`; new notes from the `vault-note` skill go in `features/`,
  `bugs/`, `ops/`, `research/` with templates in `_templates/`.
- **Run locally:** `pnpm dev` in `jtrax-web-app` / `jtrax-admin`;
  `pnpm start` (Expo) in `jtrax-mobile-app`. Go is installed
  (`/opt/homebrew/bin/go`) — the backend runs locally with
  `JTRAX_DB=<file> JTRAX_SEED_PASSWORD=<pw> PORT=8790 go run ./cmd/server`,
  which seeds demo accounts (`sandy01234@gmail.com`, `admin@jca.ac.th`, …)
  with that shared password.
- **Supported languages:** EN + TH via next-intl `locale` cookie. Thai is
  role-aware (e.g. ตารางสอน teacher vs ตารางเรียน student), Mitr font for Thai
  glyphs. Mock data (names, courses, branches) stays English.
- **UI:** every screen works at 390 / 768 / 1280 (nav switches to sidebar at
  `lg`); no emoji as UI icons — lucide or inline SVG. Verify visually via
  Playwright from `/tmp` with system Chrome (`channel: 'chrome'` — headless
  clamps below 500px wide on macOS).
