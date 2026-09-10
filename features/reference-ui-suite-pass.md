# Reference UI suite pass

**Shipped:** 2026-09-10 · **Repos:** `jtrax-admin`, `jtrax-web-app` · **PRs:** admin #114/#115, web #57/#58

The supplied Student, Parent, Admin, Tournament, Results and public-registration
references are now represented in the product without replacing real JTrax
flows with prototype-only behavior.

## What changed

- **Student portal — web #58:** light-blue 390 px canvas; compact streak and
  challenge cards; gold daily challenge; mint/lilac play modes; redesigned
  puzzles and gamified profile; one labeled five-item navigation pattern across
  stateful and routed screens.
- **Parent portal — web #58:** compact branded header, parent account chip,
  reference-style account/profile card, child overview, contact rows, and
  responsive card sizing. The home still leads with real announcements,
  children and activity rather than prototype fixtures.
- **Public registration — web #57:** wide event facts, official-regulation
  banner, numbered player/contact, affiliation/category and review sections,
  plus an explicit registration-request summary. The call to action does not
  pretend online payment exists.
- **Admin dashboard — admin #114:** the compact revenue/status, quick-action,
  check-in and class workspace recorded in
  [[dashboard-kpis-drawn-not-just-counted]].
- **Admin tournament workspace — admin #115:** grouped creation sections,
  registration-first detail ordering, and a horizontally scrollable round
  mirror. Clicking a player traces them across rounds; double-click opens a
  compact read-only detail drawer.

## Product boundaries kept

- Results remain one-way from chess-results.com, following
  [[tournament-rounds-from-swiss-manager]] and ADR 0006. The new round flow is
  visualization, not another place to author pairings or scores.
- Tournament regulations are stored and shown, but the UI no longer claims an
  upload was parsed when no parser exists.
- Public registration creates a pending academy request. It does not promise a
  place or claim payment was taken.
- Student and parent cards use signed-in account, attendance, credit, practice,
  rating and Lichess data; the references guide hierarchy and styling, not
  fabricated achievements.

## Verification

- Browser comparison covered student home, puzzles, play and profile; parent
  home, children and profile; public registration; admin sign-in, dashboard and
  tournament creation.
- `jtrax-web-app`: TypeScript, 33/43 relevant tests, and production builds.
- `jtrax-admin`: TypeScript, 429 tests under Node 24, and production build.

Related: [[student-portal-in-academy-colours]], [[the-parent-portal-reads-the-real-rows]], [[public-tournament-registration]], [[tournament-results-and-chess-results]]

Tags: #feature #ui #student #parent #admin #tournament
