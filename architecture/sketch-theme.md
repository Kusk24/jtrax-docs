# Hand-drawn sketch theme (experimental, UI-only)

- **Date:** 2026-07-04
- **Branches:** `feature/sketch-theme` in **both** `jtrax-web-app` (stacked on
  `feature/student-attendance-view`) and `jtrax-admin` (stacked on
  `feature/admin-row-details`)
- **Status:** Pushed, verified in browser (en + th). Pure theme change — zero
  component/markup edits; merging or dropping it touches only
  `app/globals.css`, `app/layout.tsx` and (admin) `lib/chart-colors.ts`.

## How the pencil look is achieved (CSS only)
- **Fonts:** `Patrick_Hand` for headings, **`Mali`** (Thai + Latin handwriting
  with real 400–700 weights) for body and all Thai text, via `next/font`
  variables `--font-hand-display` / `--font-hand-thai`.
- **Paper + shading:** cream → `#f1ede1`, card → `#faf7ee`. Two fixed overlays
  cover the viewport (multiply blend, pointer-events none): `body::before` draws
  **directional cross-hatching** (two repeating-linear-gradients at 112°/64°)
  plus four soft radial **graphite smudges** near the edges; `body::after` lays
  `feTurbulence` paper-tooth grain. Together they make every flat fill and
  recharts chart read as colored pencil. ⚠️ The SVG data-URI must be **fully
  percent-encoded — literal spaces break it in production** (that's why the
  first deploy looked flat).
- **Lines:** `--color-line` → graphite `#978e7c`; ink/muted warmed to graphite
  grays; palette hues kept but softened one step.
- **Wobble:** unlayered overrides give `.rounded-card/xl/2xl/3xl/full` uneven
  corner radii (large asymmetric values scale down proportionally, so circles
  and pills stay recognisable but hand-drawn).
- **Shading:** `--shadow-clay` → hard 2–3px graphite offset + soft smudge blur.
- **Charts (admin):** `chart.grid/tick/ink/surface/track` softened to pencil
  values; axis text inherits the handwriting font automatically.

## Gotcha worth remembering
Tailwind v4 **prunes `@theme` font tokens whose values reference runtime
`next/font` variables** — `--font-sans: var(--font-hand-thai), …` silently
disappeared from `:root` and everything fell back to the preflight stack. Fix:
declare such tokens in **`@theme inline`** (and/or reference the runtime vars
directly in `body`/heading rules).
