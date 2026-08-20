# Responsive floor: 360px, verified — not assumed

**Date:** 2026-08-21 · **Repos:** jtrax-web-app, jtrax-admin, jtrax-mobile-app
**PRs:** jtrax-web-app#39, part of jtrax-mobile-app#7

The house rule said "every screen works at 390 / 768 / 1280" — and everything
did. Nothing had ever been measured at **360px**, the width of most budget
Androids in Thailand, or at 320.

## What the sweep found

Every route of both web apps, four widths (360/390/768/1280), measuring
`scrollWidth − clientWidth` and naming the widest offender when it broke:

- **jtrax-admin**: clean at 320 and 360 on all 12 routes — the earlier
  nav-wrap and Table work already covered it.
- **jtrax-web-app** public/teacher/parent: clean at 360.
- **jtrax-web-app student**: every route overflowed 15px — the student screens
  are drawn on a fixed 390×844 canvas. Fixed by scaling the canvas in a
  clipping `.sv-frame` (discrete steps 0.96/0.92/0.87/0.82 down to 320px).
- **jtrax-mobile-app**: clean at 360; at 320 the bottom nav's five fixed-pad
  tabs overflowed 37px → `flex-1 min-w-0`.

## Traps for the next sweep

- **`scale(calc(100vw / 390))` is invalid CSS** — `scale()` takes a unitless
  number and CSS cannot divide a length down to one. The declaration drops
  *silently* and an `overflow: hidden` frame then **crops instead of scales**;
  overflow measures zero while a third of the Challenge button is missing.
  Only the screenshot caught it. Discrete stepped scales work everywhere,
  including iOS 15 Safari (no `atan2()` trick needed).
- **`networkidle` is not a page-health signal.** `/parent` renders fine but
  holds one image request open long enough that networkidle never fires — the
  sweep reported the route "failed" at every width until the gate changed to
  `load`. Measure overflow after `load`, not networkidle.
- **A stale dev server survived `pkill` for the third time this project**
  (Metro this round: a 6-minute-old process served the pre-fix bundle through
  two verification runs). Before believing any check, compare the listener's
  PID age against when you restarted: `ps -o pid,etime -p $(lsof -tnP
  -iTCP:<port> -sTCP:LISTEN)`.

Related: [[one-palette-across-every-app]], [[tournament-rounds-from-swiss-manager]]

Tags: #ops #responsive #verification
