# Parent + Student portal redesigns (imported from Claude Design)

- **Date:** 2026-08-05
- **Why:** Client feedback — the existing parent/student workflow doesn't meet
  requirements. Both portals were redesigned in Claude Design (claude.ai/design)
  and the approved `.dc.html` mockups were imported and implemented 1:1.
- **Branches (both pushed, PRs open):**
  - `feature/parent-redesign` in `jtrax-web-app` — replaces the whole
    `/parent` section.
  - `feature/student-redesign` in `jtrax-web-app` — replaces the whole
    `/student` section with the Mochi chess game.
- **Sources:** Claude Design projects
  - Parent: `JTrax Parent.dc.html` (project `ddac9218-…f8e9`)
  - Student: `JTrax Chess.dc.html` (project `5847107f-…3cb84e`)

## Parent portal (`feature/parent-redesign`)
- **Design system:** clean blue — DM Sans (body) + Poppins (display) via
  `next/font` vars, `pp-*` color tokens in `app/globals.css` (ink `#1A2B4A`,
  blue `#2E5CB8`, deep `#234A9F`, navy `#1E3A70`, greens/ambers/reds for
  status). 410px phone shell on mobile, 232px sidebar ≥ `lg`.
- **Screens:** Home (announcement carousel + modal, tournament card with
  countdown badge, children photo cards, today's activity), Notifications,
  Announcements, Tournament detail → register → payment → confirmation flow,
  Attendance History (interactive calendar + child filter chips), Child
  Attendance History, Child Profile (gradient credits card with expiry
  warning, practice line chart with tooltips, enrolled classes), My Profile
  (children list, notification toggles, screen-time wheel picker, theme +
  language pills wired to the real locale cookie).
- **Nav:** 3 tabs — Home / Attendances / Profile (bottom bar on mobile,
  sidebar at `lg`). Notifications/announcements/tournament alias to Home;
  `/parent/child/*` aliases to Attendances.
- **Data:** `lib/parent-v2-data.ts` (mock, English); strings in `pv2.*`
  namespace, 131 keys in both `messages/en.json` and `th.json`.

## Student portal (`feature/student-redesign`)
- **Concept:** kid-facing game — take care of the cat **Mochi** by solving
  daily chess puzzles, then feed it. Fixed 390×844 game canvas, centered and
  rounded on larger screens.
- **Design system:** Chewy (display) + Comic Relief (body) via `next/font`,
  `sv-*` warm tokens (brown `rgb(109,61,52)`, cream, gold, peach, tan).
  Thai falls through to Mitr (both game fonts are Latin-only).
- **Screens (single client component `app/student/StudentGame.tsx`, screen
  state — no routes):** Home (room scene with daily-challenge card: 3 states
  — start / feed Mochi / mission complete), Feed (drag fish to the cat's
  mouth with pointer events, eating/celebrate sprites, confetti, Great Job
  modal), Puzzles (Daily tab 3 cards + Free Play tiers), Puzzle (working 8×8
  board, `lib/student-game.ts` mate-in-1 engine with real legal-move
  generation, speech-bubble feedback, auto-advance, all-solved overlay),
  Profile (Mochi card + 21-cell streak grid).
- **Old student pages removed:** attendance / schedule / checkin /
  notifications / profile plus `StudentNav`/`StudentHeader` (superseded by
  the game; check-in remains on the teacher side).
- **i18n:** `sv2.*` namespace, 30 keys in en + th.

## DesignSync import pipeline (repeatable, and its gotcha)
- Files come via the `claude_design` MCP tool (`DesignSync.get_file`).
  **Responses are capped at 256 KiB** — larger assets arrive silently
  truncated (base64 decodes to exactly 192 KiB, no PNG `IEND`).
- Repair pipeline used here: decode from the persisted tool-result file →
  open with PIL `LOAD_TRUNCATED_IMAGES` → find the last row with real
  content → crop to the surviving band (or `sips` re-encode).
- Assets that survived cropping: student `boyandcat`, `eating`, and the
  `bg.png` wall band (floor redrawn in CSS). Assets lost past the cap and
  replaced with designed fallbacks: parent tournament banner (gradient +
  chessboard `TournamentBanner` component), parent avatar (initials
  `ParentAvatar`), Mochi profile avatar (uses `happy.png`), angry-cat
  wrong-answer icon (lucide `X`).
- Small files can also be recovered from the session transcript JSONL if the
  tool result was inline (regex the base64 out) — done for `fish.png` and
  `paw.png`.
