# Lichess is a section, not a footnote

**Shipped:** 2026-08-22 · **Repos:** `jtrax-admin` · **PR:** #73

The Lichess dashboard has its own place in the console nav, next to Games, and
the receptionist can open it.

## Why

It lived at the bottom of the students list — below the table, inside its card,
and **only in list view**, so switching the roster to cards made it disappear
entirely. Nothing said it had gone; there was no reason to expect a screen to
depend on a view toggle three sections up the page.

It is not a footnote to the roster. It is the half of a pupil's chess the
academy never sees, read from somewhere else entirely
([[lichess-ratings-in-jtrax]]), and it belongs on a screen where it can be
looked at rather than scrolled past.

## How it works

`components/pages/LichessPage.tsx` is a header and the existing `LichessPanel`;
the panel itself did not change, it only stopped being someone else's tail.
`lib/nav.ts:24` adds the section between Games and Students, so the two chess
screens sit together and the office records start below them.

`lib/nav.test.ts` covers the entry, including that it survives the role filter.

## Decisions made along the way

- **No role flags on it** (`lib/nav.ts:22`). Academy and Settings are
  `hideForReceptionist`; this is not. *"How is my child doing at home"* is asked
  at the front desk as often as in the office, and a receptionist who cannot
  answer it has to fetch an admin to read a rating off a screen.
- **Next to Games, not among the office records.** The nav's order is the
  console's only grouping — there are no headings — so adjacency is what says
  two screens are about the same thing.

Related: [[lichess-ratings-in-jtrax]], [[rated-games-on-lichess]],
[[a-game-opens-as-a-page-and-leaves-as-pgn]],
[[0004-console-roles-match-the-backend]]

Tags: #feature #admin #ux #chess
