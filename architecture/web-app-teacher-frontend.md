# Web app — teacher frontend (v1, mock data)

- **Date:** 2026-07-03
- **Repo/branch:** `jtrax-web-app` · `feature/teacher-frontend` (stacked on
  `feature/student-frontend` — merge student first)
- **Status:** Shipped on branch, pending merge

## What shipped
The **teacher portal** from the Figma mobile mockups: dashboard, schedule, both
attendance-taking modes (manual checklist + scan), post-session summary with edit mode,
roster student profile, attendance history, and teacher profile. Frontend-only on mock
data (`lib/teacher-data.ts`); the scan feed and session persistence are simulated until
the backend exists (ADR 0002).

## Routes
| Route | Page |
|---|---|
| `/teacher` | Home: greeting + Teacher badge, Weekly Progress card (sessions/hours stats), Upcoming Class with manual/scan launchers, My Classes grid |
| `/teacher/schedule` | Week date strip + today's classes with attendance launchers |
| `/teacher/checkin/manual` | Manual attendance: search, All Absent/All Present, per-student check toggles, live session progress |
| `/teacher/checkin/scan` | Scan mode: pulsing scan target, scanned-in progress, recent-scans feed (mock: a student "scans in" every 5s) |
| `/teacher/attendance` | Attendance history grouped by date (`15/16 present` cards) |
| `/teacher/attendance/[sessionId]` | Attendance Summary: present/absent sections, **Edit** toggle reveals per-row Absent/Present flips, View All expands past the 3-row preview |
| `/teacher/students/[studentId]` | Teacher's view of a student: credits panel, Parents Contact (tel:/mailto:), enrolled class progress, last attendance |
| `/teacher/profile` | My Profile: monthly overview stat tiles, assigned branches, contact info |

## Design decisions
- **Edit mode instead of swipe**: the "edit attendance" mockup implies swipe-to-reveal;
  v1 uses an explicit Edit/Done toggle that shows the red Absent / green Present buttons —
  simpler, mouse-friendly, and the row Link → student profile stays tappable in view mode.
- **Finish Attendance is sticky** above the bottom nav so it's reachable mid-roster.
- Roster rows, session progress bar, and the back-header are shared components
  (`RosterRow`, `SessionProgress`, `CheckinHeader`) reused across all four attendance
  screens; `TeacherNav` is a thin config over the existing `PortalNav`.
- Class artwork from the mockups is a gradient + crown placeholder until real course
  images exist.
- New domain types in `lib/types.ts`: `Teacher`, `TeacherClass`, `RosterStudent`,
  `TeacherAttendanceSession`.

## Verification
`next build` passes (24 routes). All 8 screens screenshotted at 390×844 via Playwright +
system Chrome against the mockups; sticky Finish button re-verified after the fix.
