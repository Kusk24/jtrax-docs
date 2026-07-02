# Web app — student frontend (v1, mock data)

- **Date:** 2026-07-03
- **Repo/branch:** `jtrax-web-app` · `feature/student-frontend` (stacked on
  `feature/parent-frontend` — merge parent first)
- **Status:** Shipped on branch, pending merge

## What shipped
The **student portal** from the Figma mobile mockups, plus refactors that turn the
parent-only pieces into shared building blocks. Frontend-only; the check-in flow is a
simulated state machine until the backend + verification mechanism exist (see ADR 0002).

## Routes
| Route | Page |
|---|---|
| `/student` | Home: greeting + Student badge, low-credit alert, Upcoming Classes with **Check-in** button |
| `/student/checkin` | Self check-in: verifying → success (auto after ~3s, mock); or "Teacher has not started attendance session yet" |
| `/student/schedule` | Week date strip + classes for selected day |
| `/student/attendance` | Attendance history grouped by date |
| `/student/notifications` | Notifications with All/Unread filter |
| `/student/profile` | Profile: remaining credits, **Parents Contact** (tel:/mailto: actions), enrolled classes, More |

## Check-in flow (mechanism-agnostic)
The UI implements the three mockup states without committing to a verification
technology: `not-started` (teacher hasn't opened the session) → `verifying` → `success`
(timestamp + "-1 credit"). The "verifying" step is a black box on purpose — QR scan, code
entry, geofence, or teacher approval can slot in without changing the surrounding
screens. Preview any state with `?state=not-started|success`; the mock session flag lives
in `lib/student-data.ts` (`attendanceSession.active`).

## Shared building blocks (refactors in this branch)
- `lib/types.ts` — domain types moved out of `parent-data` (`Student`/`Child`,
  `ClassSession`, `NotificationItem`, `AttendanceRecord`); both portals' mock data files
  use them.
- `components/PortalNav.tsx` — generic bottom-tab/sidebar nav; `ParentNav` and
  `StudentNav` are thin tab configs (aliases keep Home lit on notifications and Schedule
  lit on check-in, matching the mockups).
- `components/NotificationsPanel.tsx` — shared All/Unread list used by both portals.
- `ClassCard` grew `hideStudentPanel` + `action` props: the student home card drops the
  identity panel (viewer *is* the student) and hosts the Check-in button.

## Verification
`next build` passes (17 routes; `/student/checkin` is dynamic for the `?state` override).
Screenshotted at 390px/1280px against mockups: home, all three check-in states, profile,
schedule.
