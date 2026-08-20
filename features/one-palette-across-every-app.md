# One palette across every app

**Date:** 2026-08-20 · **Repos:** all four front-ends
**PRs:** jtrax-web-app #34 #35 #36, jtrax-admin #54, jtrax-mobile-app #6

[[student-portal-in-academy-colours]] moved the student portal to the academy's
navy. This finishes the job: the teacher portal, the sign-in screen, the mobile
app and the chess board were all still the old warm cottage palette, so which
school JTrax looked like depended on which screen you opened.

Every front-end now uses the jcachess.ac.th family — navy `#24417C` on
`#F7FAFD`, sampled from the site's computed styles rather than eyeballed.

## Tokens are only tokens if nothing bypasses them

The recurring finding, in every repo:

| repo | bypasses found |
|---|---|
| jtrax-web-app (parent) | **53** hard-coded hexes duplicating `pp-*` tokens |
| jtrax-web-app (student) | board colours in 3 components; `sv-board-dark` defined and **never used** |
| jtrax-admin | 51 hex + 13 `rgb()` literals; `#E8F9EE`, one letter off `COLORS.successBg` |
| jtrax-mobile-app | old `#f7f4ee` in 4 layouts, a rainbow of Tailwind defaults |

Darkening a token fixed only some failures, because the rest were inline
`style={{ color: "#64708c" }}` — which no class-based sweep can see. **A colour
audit that greps for classes will report a codebase clean while most of its
colours are hard-coded.** Grep for hex literals too, and especially inside
`style={{…}}`.

Renames went with the retints: `cream` → `paper`, `peach` → `highlight`. A token
called `peach` holding a pale blue misleads whoever reads it next — the same
reason `sv-brown` became `sv-ink`.

## Contrast is a property of a pair, not a colour

The `pp-*` pastels were chosen against white. Against the tinted panels they
actually sit on they were nowhere near legible — `pp-green` as text on
`pp-green-soft` measured **2.39:1**. Same story in the console, where disabled
controls set a lightened colour *and* `opacity: 0.6`; those multiply, and the
pagination arrows landed at **1.30:1**.

Check every colour against the background it is really on, and never stack a
fade on top of a lightened colour.

## Two accessibility fixes worth naming

- **The parent portal's three notification switches had no accessible name** —
  `<button aria-pressed>` with no text, announced as "button, pressed". They are
  `role="switch"` with the setting's own label now.
- **`window.alert(e.message)` in 14 places** (12 console, 2 parent portal) put
  raw server strings in front of users, always English, in fully bilingual apps.
  The console has one `ErrorToastProvider`; the portal uses inline `role="alert"`
  messages. The real error goes to `console.error` and never to the screen.

## What the checks could not see

- **axe does not check contrast against CSS gradients.** It called the puzzle
  screen clean while "White to move — mate in 1" was navy on the navy wash —
  measured luminance spread **3.9**, i.e. absent. Sampling rendered pixels
  behind every text node is the check that finds these; it now runs over all six
  student screens.
- **A stale bundle will lie to you twice.** Tailwind v4 `@theme` edits were
  served stale from `.next` (the browser reported the old token while the file
  held the new one), and an Expo dev server that survived `pkill` served a
  pre-change bundle for three screenshot rounds. Verify the server is the one
  you just started — check its PID's age.

## Also fixed

- `common.signOut` **existed in neither language file**, so every mobile profile
  screen threw `MISSING_MESSAGE` and showed an error toast instead of the
  button. Every `t("…")` call in all 54 mobile screens is now checked against
  `en.json`; the rest resolve, EN/TH parity holds.
- Avatar tints were Tailwind's rose/amber/violet/lime/sky/stone rainbow. Six
  academy-family tints now, defined once per repo and shared, each ≥ 5.7:1.
- `lib/nav.ts` in the console carried English `label` fields nothing renders —
  removed, with a note on the type saying why there is no `label`.

## Follow-ups

- [ ] The mobile board's colours were chosen by computing contrast, not by
      looking: the Stockfish WebView cannot start under `react-native-web`, so
      the board never rendered in the browser. Check it in a simulator.
- [ ] The console still hard-codes `#fff` in 36 places instead of
      `COLORS.surface`, and `app/globals.css` re-declares the whole `lib/theme.ts`
      palette as raw hex. Two sources of truth, kept in sync by hand.

Related: [[student-portal-in-academy-colours]], [[admin-console-ux-pass]],
[[git-workflow-verify-the-goal]]

Tags: #design #accessibility #frontend
