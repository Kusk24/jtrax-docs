# Admin app — super admin portal (from mockups, batch 1)

- **Date:** 2026-07-04
- **Repo:** `jtrax-admin`
- **Branches (stacked, merge in order):**
  1. `feature/super-admin-dashboard` — shell (topbar + sidebar/drawer nav), types,
     mock data, validated chart colors, dashboard (KPIs, 5 charts, follow-up table)
  2. `feature/super-admin-branches` — branch admin cards, branch management +
     clone-branch modal, branch detail with tabs
  3. `feature/super-admin-courses` — course cards, 4-step add-course wizard,
     course detail (sections table, week calendar + schedules panel, teachers,
     per-section students)
  4. `feature/super-admin-people` — teacher table, student table + admin student
     profile, add-student form with success screen (links to record payment)
  5. `feature/super-admin-payments` — payments table, combined-payment form with
     repeatable child/course allocations and live summary
  6. `feature/super-admin-attendance` — attendance monitoring (grouped daily chart,
     history + session detail card, alerts with guardian notify), system settings,
     reports placeholder, chart rendering fix
  7. `feature/branch-admin-portal` — branch admin portal: pages extracted into
     `components/admin/pages/*` taking `base` + optional `branch: BranchId`;
     `/super/*` and `/branch/*` are thin route wrappers. Branch admin = same UI
     scoped to one branch (mocked to Bangkok until auth): nav drops Branch
     Admins/Branches, topbar shows a fixed branch chip instead of the All-Branches
     selector, dashboard loses the Total Branches KPI + branch-performance chart,
     and every list (students, teachers via `branchIds`, payments, sections,
     calendar events, attendance history, alerts) filters on `branchId`. Adding a
     branch = one new entry in `branches[]` — records separate by ID, per the
     member/branch database requirement.
- **Status:** All pushed; `pnpm build` green (16 `/super/*` + 13 `/branch/*`
  routes, all ƒ dynamic due to the locale cookie)

## Decisions
- **Nav:** desktop = fixed 224px sidebar (icons + labels) at `lg`; below that a
  hamburger drawer — the 10-item admin nav doesn't fit the portal bottom-tab pattern.
- **Charts:** Recharts. Data colors are *derived steps* of the theme palette that pass
  the dataviz validator on the card surface: navy `#4a63a8`, brick `#c0392b`, olive
  `#7e9440`, rust `#8c3a1e` (in `lib/chart-colors.ts`). Color follows the entity:
  branches Bangkok=brick / Onnut=olive / Bangbo=navy; levels Beginner=brick /
  Intermediate=olive / Advance=rust — consistent across all charts.
  `isAnimationActive={false}` everywhere (deterministic screenshots/print) and no
  negative left margins (they clip Y-axis labels).
- **Tabs on detail pages** are client-side (`DetailTabs`), no sub-routes.
- **Reports** nav item exists but only a placeholder page — no mockup yet.
- **i18n:** every string in `messages/en.json` + `th.json`; new admin namespaces
  (`adminNav/dash/status/admins/branchesPage/coursesPage/wizard/tabs/branchDetail/
  courseDetail/teachersPage/studentsPage/studentProfile/addStudent/paymentsPage/
  addPayment/attendancePage/settingsPage/reportsPage`). Mock data (names, branches,
  courses, section labels) stays English.
- **Commits:** single-line, no Co-Authored-By trailer (user preference from this day).

## Verification
Playwright + system Chrome: dashboard at 390/768/1280, branches/course
detail/attendance at 1280, payment form at 390, plus Thai (`locale=th` cookie) on
dashboard + attendance. Chart animation had to be disabled for the area chart to
render completely in screenshots.
