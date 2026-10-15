# The standings race

**Shipped:** 2026-09-25 (PR open) · **Repos:** `jtrax-admin` · **PR:** jtrax-admin#142

The Results tab can now draw a line per player showing where they stood after
every round. It works like an F1 championship chart: the academy's own players
are in colour and everyone else is faint grey. It sits above the rounds, which
stay as the record, and staff can switch it off.

## Why

The rounds from jtrax-admin#137 made the event readable, but only as text. The
question at a venue is "how is our child doing?", and in a Swiss event that is a
question about climbing, not about surviving a bracket.

The user asked for a visual on top of the rounds, compared a knockout "VS, next
stage" style with the F1 standings chart, and chose the chart. They asked for it
to be an **addition** that **can be turned off**.

## How it works

- **The ranking.** `jtrax-admin/lib/standings-race.ts` → `standingsRace(views, members?)`
  adds up each player's points round by round from the mirrored pairings. It
  scores results with the existing `scoresOf`, so forfeits (`+ - -`) and byes
  count the way the arbiter printed them. It ranks by points only, and a shared
  score is a shared place (`=3rd`).
- **The chart.** `jtrax-admin/components/tournament/StandingsRace.tsx` is plain
  SVG drawn at the real width (a `ResizeObserver`), so labels stay readable on a
  phone:
  - Academy players are coloured (the top 3 if none are ours), capped at 8.
  - Clicking a line or a legend chip opens that player's view from #137.
  - Below 560 px the names move from the chart into the legend.
- **The switch.** "Hide / Show standings race" is in the Results header in
  `ResultsTable.tsx`. The choice is remembered per browser by
  `jtrax-admin/lib/shown-pref.ts` (`useShown`), which uses the same
  `useSyncExternalStore` pattern as `lib/view-mode.ts`.
- **When it appears:** only once two rounds have results. Before that, neither
  the chart nor the switch is shown.
- **On one age group's tab**, only that group's players are ranked; games
  against players from other groups still count for them.

## Decisions made along the way

- **No knockout bracket.** JCA events are Swiss: everybody plays every round and
  nobody is eliminated, so a bracket would show children as "out" who are still
  playing. A bracket could still suit a genuinely knockout event later.
- **Position by points, not by official tiebreaks.** chess-results publishes
  tiebreaks only for the current ranking. Working out Buchholz for past rounds
  would be the console inventing a placing, so the subtitle says what the chart
  ranks by.
- **The switch is per browser, not per tournament.** It is a viewing
  preference on the staff console. If the chart ever goes on the public results
  page, whether parents see it becomes an organiser's decision, and that would
  be a per-tournament setting.

## Follow-ups

- [ ] The same chart on the public results page, `jtrax-web-app/app/t/[id]`, if wanted.
- [ ] VS-style board rows and a per-player score line were proposed with it and not chosen (see `JTrax/QnA/Tournament-results-visuals-plan.pdf`).

Related: [[tournament-rounds-from-swiss-manager]] · [[tournaments-linked-to-chess-results]] · [[tournament-results-and-chess-results]]

Tags: #feature #tournaments #chess-results #admin
