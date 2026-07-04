# Feedback round — admin tables, dashboard, payments + teacher/student profiles

- **Date:** 2026-07-04
- **Branches:** `jtrax-admin` · `feature/admin-row-details` (stacked on
  `feature/branch-admin-portal`) · `jtrax-web-app` ·
  `feature/student-attendance-view` (stacked on `feature/ongoing-class-bar`)
- **Status:** Pushed; verified in browser incl. modal clicks (en + th)

## Admin — row detail modals (`RowDetails`)
Every table row's chevron now opens a detail modal (label/value list + **Edit** and
**Remove** buttons, visual-only until the backend). Wired into: students, teachers,
payments, course-detail section students, and attendance history. Shared client
component `components/admin/RowDetails.tsx`; accepts optional `children` for richer
content. New `common.remove` / `common.viewDetails` strings.

## Admin — attendance history tab
The session-detail side/bottom card is **gone from the page** — that content now
lives inside the row's detail modal (teacher chip, date/time, updated-at,
present/absent lists), opened via the row chevron.

## Admin — dashboard quick actions
"Top Classes by Fill Rate" chart removed; a **Quick Actions** card sits in its slot:
Register New Student → `{base}/students/new`, Add Payment → `{base}/payments/new`,
View Critical Students → `{base}/students`. Works in both super and branch portals
via the shared `base`.

## Admin — payment form discount
`AddPaymentForm` has a **Discount (฿)** field in Transaction Details; the summary
shows a "Discount −฿X" line and the total becomes `max(0, subtotal − discount)`.

## Web app — teacher sees the student's own attendance history
The teacher student profile's Attendance History card previously showed *class*
sessions. It now lists that student's own records (latest 2, present/absent) and
**View All** opens `/teacher/students/[id]/attendance` — the exact same screen as
the student portal's Attendance tab, via the new shared
`components/AttendanceHistoryList.tsx` (date-grouped cards with status + credits
chips). `studentDetail.lastAttendance` mock removed.

## Web app — credit validity made obvious (`CreditSummaryCard`)
Per the annotated mockup: remaining credits and **VALID UNTIL date side by side**,
a "{n} days left" chip, and an explicit note "Credits expire on {date} and cannot
be used after this date." Applied to the student profile, parent child profile and
teacher student profile (low = brick tones, healthy = olive). `daysLeft` is a mock
prop until dates are backend-computed. New `profile.validUntilLabel/daysLeft/
creditsExpireNote` strings in both languages.
