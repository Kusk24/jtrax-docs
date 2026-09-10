# Admin dashboard: visual KPIs to daily workspace

**Shipped:** 2026-09-08; reshaped 2026-09-10 · **Repos:** `jtrax-admin` · **PRs:** #109, #114

The admin dashboard now leads with revenue and an actionable student-status
visual, then puts quick actions, today's check-ins and today's classes into one
compact daily workspace.

## Why

The user asked for the dashboard to show its numbers "visually, not just a
number". A count hides its composition: "12 checked in" reads the same at
4 pm whether everyone has gone home or nobody has, and "6 students" reads
the same whether the roster is healthy or half of it has lapsed.

## How it works

### Reference-layout pass — PR #114 (current)

The client reference showed that the September KPI pass still repeated too
much information. PR #114 removes the separate revenue, follow-up, roster,
attendance, course and payment chart stack from the home route. The current
structure is:

- `components/dashboard/DashboardHome.tsx:46` — revenue and student status at the
  top, quick actions next, then check-ins and today's classes side by side on
  wide screens.
- `components/dashboard/StudentStatus.tsx:26` — five concentric status rings. Each
  localized legend row is a real link to `/students?status=<status>`, so the
  visual is also the route into the affected roster rather than a passive chart.
- `components/dashboard/TodaysClasses.tsx:145` — two class cards remain static; only
  a third or later card makes the class region independently scrollable. Zero
  classes and zero check-ins have explicit empty states matching the supplied
  reference.
- `components/JtraxShell.tsx:264` and `app/globals.css:817` — the desktop sidebar is a
  compact icon rail by default, expands on demand, and exposes localized
  hover/focus tooltips while collapsed. Phone and tablet navigation remains the
  horizontal strip.

The behavior is covered in
`components/dashboard/DashboardReferenceLayout.test.tsx`. Browser verification
covered 390 px, 768 px and 1280 px, English and Thai, light and dark themes,
the status deep-link filter, and the two-class no-scroll rule.

### Original visual KPI pass — PR #109 (historical)

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

- [x] ~~The revenue tile's bars duplicated the six-month `RevenueTrend` card.~~
  PR #114 removed the large repeated chart and kept one compact revenue shape.

Related: [[admin-console-ux-pass]], [[backend-crud-and-live-portals]]

Tags: #feature #admin #dashboard
