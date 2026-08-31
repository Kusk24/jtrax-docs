# The nav loses two tabs

**Shipped:** 2026-09-01 · **Repos:** `jtrax-admin` · **PR:** #90

Lichess and Games are one chess section, Lichess first. Staff accounts are a
section of Settings, and only the admin's Settings.

## Why

The nav is the console's only grouping — there are no headings — so its length
and its order are the whole of what tells staff which screens belong together.
Two entries were paying rent they could not cover.

**Lichess and Games** answer the same question, *what is this child playing*, of
two different places: one at home, one on a board the console opened itself.
They were already adjacent ([[lichess-is-a-section-not-a-footnote]] put them
there deliberately), which was the tell — adjacency was standing in for the
fact that they are one screen.

**Admins** was a tab used a handful of times a year — a new receptionist, a
forgotten password — sitting near the top of a list of screens the office opens
every morning. Everything on it was already "how this academy is set up", which
is what Settings is for.

## How it works

`lib/nav.ts` drops both entries. `components/pages/LichessPage.tsx` is gone;
its panel moved into `components/pages/GamesPage.tsx`, above the games list.
`AdminsPage` gained a `level` prop and is rendered by `SettingsPage` behind
`isAdmin`.

Both follow the Academy page's pattern: **h1 for the first section, h2 for the
rest**, so a page with two sections still has exactly one h1. On the chess
screen that makes *Lichess at home* the h1 and *Games* the h2 — a nav label of
"Games" leading to an h1 of "Lichess at home" is the same shape as "Academy"
leading to "Courses", which has read fine for months.

`LichessPanel` gained `heading={false}`. Under a page header that already names
it, printing "Lichess at home" again inside the card read as two sections that
happened to share a name. (The old `LichessPage` had the same duplication; it
was just less obvious with nothing under it.)

## Decisions made along the way

- **The role guard moved, and that is the risky half.** Admins was `adminOnly`
  in the nav, so the nav alone kept the front desk out. Settings is open to
  both roles — a receptionist needs it for their own theme
  ([[dark-theme-in-both-consoles]]) — so `isAdmin` inside `SettingsPage` is now
  the only thing between the desk and the Create Admin button.
  `SettingsPage.test.tsx` asserts the receptionist sees neither the button nor
  the roster, because a guard with nothing holding it is a guard that gets
  deleted by the next person tidying up.
- **`MERGED_SECTIONS`, not a 404.** `/lichess` → `/games` and `/admins` →
  `/settings`. `generateStaticParams` reads `NAV_STRUCTURE`, so removing a tab
  would otherwise take every bookmark, typed URL and stale browser tab pointing
  at it down with it. The redirect is checked *before* the nav lookup,
  precisely because a merged id is deliberately no longer in the nav.
- **The section ids did not change.** `/games` keeps its route and its
  view-mode storage key; renaming it to something covering both would have been
  a second round of broken links for a cosmetic gain.
- **`nav.admins` and `nav.lichess` deleted from both locales.** Nothing renders
  them — the redirect means not even `SectionPlaceholder` can ask — and
  `lib/nav.ts` already carries a comment about not keeping label fields that
  nothing renders.

Related: [[lichess-is-a-section-not-a-footnote]],
[[a-game-opens-as-a-page-and-leaves-as-pgn]], [[lichess-ratings-in-jtrax]],
[[0004-console-roles-match-the-backend]], [[dark-theme-in-both-consoles]],
[[a-class-is-what-a-session-was]]

Tags: #feature #admin #ux #nav #chess
