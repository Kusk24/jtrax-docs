# Admin app — JTRAX design port (jtrax-admin)

- **Date:** 2026-08-01
- **Repo/branch:** `jtrax-admin` · `feature/jtrax-design-port` → PR #11
- **Status:** Pushed, PR open; `pnpm build` green

## What it is
A port of the `JTRAX Dashboard.dc.html` mockup (Claude Design Canvas export) into a
self-contained `/jtrax` route tree. It is a **parallel** tree, not a replacement: `/super`
and `/branch` are untouched.

Ten screens: dashboard (two role variants), Admins, Academy, Class History, Students,
Payment, Tournament, Announcement, Messages, Settings.

## Why parallel rather than a restyle
The mockup diverges from the existing admin app on nearly every axis, so merging them
would have meant rewriting working screens:

| | existing `/super` + `/branch` | JTRAX mockup |
|---|---|---|
| Roles | `super` / `branch` | Super Admin / Admin / Receptionist |
| Nav | Branches, Teachers, Attendance, Reports | Academy, Class History, Tournament, Announcement, Messages |
| Theme | cream `#f7f4ee` / navy `#2b4380`, Fredoka+Nunito, clay shadows | flat `#F7FAFF` / blue `#284C8F`, Inter |
| Styling | Tailwind v4 `@theme` tokens | inline styles + scoped stylesheet |

Keeping both lets us compare side by side and decide later which survives.

## Structure
- `lib/jtrax/` — `theme.ts` (COLORS/ROLE_COLORS/CLASS_CATEGORY_COLORS), `icons.ts` (the
  mockup's own 59-icon set — chess pieces and the LINE bubble have no lucide equivalent),
  `data.ts` (all seed fixtures), `nav.ts`, `derive.ts` (view-model helpers).
- `components/jtrax/` — `JtraxShell` (sidebar/topbar/role switcher), `JtraxContext`
  (active person + credit rules), `page-kit.tsx` (shared table/modal/drawer/pagination),
  `pages/*` one file per section.
- `app/jtrax/` — `layout.tsx` (scoped Inter font), `page.tsx` (dashboard),
  `[section]/page.tsx` → `SectionRouter`.

Seed arrays and the icon table were **extracted programmatically** from the mockup rather
than retyped, so they match the design exactly.

## Decisions
- **Styling stays inline**, scoped under `.jtrax-root` in `app/jtrax/jtrax.css`, which also
  cancels `globals.css`'s squishy-press transform inside this tree. Hover states live in
  CSS because they can't be expressed inline — same reason the mockup used a stylesheet.
- **Role guard in the client**, not the route segment: the active role is client state, so
  `SectionRouter` renders a "no access" notice rather than the route 404ing.
- **Credit rules are shared context** — Settings edits them, the dashboard's Needs Follow-up
  card reads them.
- **Modals centre with auto margins, never `translateX`** — the fade-in keyframe animates
  `transform` and silently cancels transform-based centring. This cost a real bug once.

## Known gaps
- **No i18n.** These pages are English-only, diverging from the repo rule that every string
  goes in `messages/en.json` + `th.json`. The mockup has no Thai copy. **Needs a decision
  before merge** — either translate the port or accept it as English-only until the design
  ships Thai.
- **The design export was truncated** at a 256 KiB read cap, cutting the tail of
  `renderVals()`. `followUps` bucketing, the 6-month revenue series and the class-history
  rows are reconstructed from the seeds and are marked `RECONSTRUCTED` in `derive.ts`.
  Worth re-checking against a complete export if one turns up.
- **Tournament photos** use generated gradient art; the mockup's images weren't imported.
- Mockup quirks kept deliberately: Total Students is hardcoded `33` against a 10-row seed,
  and "Create Session" closes without persisting (the design had no handler either).

## Verification
`tsc --noEmit`, `eslint`, `next build` clean. All ten routes checked over HTTP: 200 with
their real seed content and no runtime errors; `/super` and `/branch` still 200. Earlier
browser-driven checks confirmed the reception desk cycle (check in → assign class →
dismiss → add credits), check-in dismissal, the Create Session panel and the role switcher.

## Conflict safety
Fully additive — 33 new files, all under `app/jtrax/`, `components/jtrax/`, `lib/jtrax/`,
`public/jtrax/`. Zero deletions, no existing file modified, so no overlap with the other
open feature branches.
