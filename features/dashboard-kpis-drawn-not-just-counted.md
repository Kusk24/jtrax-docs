# Dashboard KPIs drawn, not just counted

**Shipped:** 2026-09-08 · **Repos:** `jtrax-admin` · **PR:** #109

The four KPI tiles on the admin dashboard now repeat their number as a small
drawing along the tile's bottom edge — the desk reads the shape before the
digit.

## Why

The user asked for the dashboard to show its numbers "visually, not just a
number". A count hides its composition: "12 checked in" reads the same at
4 pm whether everyone has gone home or nobody has, and "6 students" reads
the same whether the roster is healthy or half of it has lapsed.

## How it works

Each tile keeps its icon, number and sub-line, and gains one visual drawn from
data `DataProvider` already holds — no new fetches, no chart library, plain
divs in the repo's inline-style idiom:

- **Revenue This Month** — six mini bars of the monthly trend (the existing
  `revenueTrend` points), the month in progress carrying the accent.
- **Total Students** — a segmented bar cutting the roster the same three ways
  the follow-up card does: fine / needs attention / expired-or-inactive.
- **Checked In Today** — one dot per child in arrival order, filled while they
  are in class, faded to the tint once dismissed. Past 24 children the dots
  stop being countable at tile size and it falls back to a proportional bar.
- **Classes Today** — a segment per class, filling in as the day is taught.

The drawing and its counting live in
`components/dashboard/KpiVisuals.tsx`; the maths (`studentMix`,
`checkinDots`) is exported bare and unit-tested. Tiles became columns with
the visual pinned via `margin-top: auto`, so the four drawings sit on one
line across the strip however the text above them wraps
(`components/dashboard/KpiStrip.tsx`).

Every drawing carries a `role="img"` with a localized aria-label, EN + TH
(`messages/{en,th}.json`, `dashboard.revenueBars` / `studentMix` /
`checkinDots` / `classDone`).

## Decisions made along the way

- Dots-per-child over a donut for check-ins: at a school's scale the number
  *is* countable, and "two dots still filled" answers the safeguarding
  question ("who is still in the building?") faster than a ring fraction.
  The 24-dot cap keeps the honest fallback for a big day.
- The students bar reuses the follow-up buckets' three-way cut rather than
  inventing a fourth taxonomy — the amber and red segments are the same
  students the follow-up card lists below → [[admin-console-ux-pass]].
- jsdom quirk found while testing: an invalid CSS colour (`amber`) is
  silently dropped from `style.background`, which can make a colour
  assertion pass or fail for the wrong reason. Test fixtures use real CSS
  colours.

## Follow-ups

- [ ] The revenue tile's bars slightly duplicate the six-month `RevenueTrend`
  card below it; if the big chart ever grows richer (per-day bars, package
  split), the tile could show this month's daily takings instead.

Related: [[admin-console-ux-pass]], [[backend-crud-and-live-portals]]

Tags: #feature #admin #dashboard
