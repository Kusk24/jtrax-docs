# Web app — parent frontend (v1, mock data)

- **Date:** 2026-07-03
- **Repo/branch:** `jtrax-web-app` · `feature/parent-frontend` (`079720c`…`1ec4af8`)
- **Status:** Shipped on branch, pending merge to `main`

## What shipped
First full interface of the web app: the **parent portal**, built from the Figma
mobile mockups, plus a temporary **role selection landing page** (Student / Parent /
Teacher). Student and teacher portals are placeholder pages until their mockups exist.
Everything is frontend-only — no backend calls yet.

## Routes
| Route | Page |
|---|---|
| `/` | Role selection (temporary — will be replaced by real login when backend is ready) |
| `/parent` | Home: greeting + guardian badge, low-credit alert banner, My Children, Upcoming Classes |
| `/parent/notifications` | Notifications with All/Unread filter |
| `/parent/schedule` | Week date strip (interactive) + classes for the selected day |
| `/parent/attendance` | Attendance history grouped by date, Present/Absent + credit pills |
| `/parent/profile` | Parent profile, children shortcuts, contact info, More section |
| `/parent/profile/[childId]` | Child profile: remaining credits, enrolled classes, attendance history |
| `/student`, `/teacher` | Placeholders linking back to role selection |

## Structure & conventions
- **Mock data:** all data lives in `lib/parent-data.ts` as typed objects (children,
  classes, notifications, attendance). Backend integration later = replace this one module.
- **Shared components:** `components/` — `Avatar` (colored initials, no photo assets yet),
  `CreditBar`, `ClassCard`, `ParentHeader`, `ParentNav`.
- **Design tokens:** Tailwind v4 `@theme` in `app/globals.css` — cream background, navy
  primary, olive = present/success, brick red = low credits/absent, peach = alerts.
- **Icons:** `lucide-react` (only dependency added).

## Responsive strategy
Mockups are mobile-first; the build adapts across devices:
- **< 768px (phones):** floating bottom tab bar (Home / Schedule / Attendances / Profile),
  matching the mockups.
- **≥ 768px (iPad/laptop):** left sidebar with "Switch role" link; content centered at
  `max-w-3xl`; card lists become 2-column grids at `lg`.

## Verification
`next build` passes (all routes prerendered, child profiles via `generateStaticParams`).
Screenshotted at 390px and 1280px against the mockups. Gotcha found: flex
`justify-center` + `overflow-x-auto` clips the left edge of the schedule date strip —
fixed with an inner `w-max mx-auto` wrapper.
