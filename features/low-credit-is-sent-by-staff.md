# Low credit is sent by staff, not by check-out

**Shipped:** 2026-09-24 (in review) · **Repos:** `jtrax-backend`, `jtrax-admin` · **PRs:** backend #65, admin #135 (merge the backend first)

The "Low credit balance" notification no longer goes out by itself when a check-out leaves a child's balance low. Staff send it from the dashboard, the same way as the credits-expiring reminder.

## Why

The user asked for it on 2026-09-24: the academy wants a person to decide when a family is asked to top up.

## How it works

- `sendCheckoutNotifications` (`jtrax-backend/internal/api/notifications.go`) still sends the "credits used" receipt, but no longer sends `low_credit`.
- `POST /api/v1/notifications/low-credit` (staff only) works like `credit-expiry`:
  - `dry_run` lists the children at or under `credit_rule_low_credit`, lowest balance first.
  - `student_ids` narrows the send to those children, and ids outside the list come back in `skipped`.
  - Each family gets it at most once per day.
- A balance is counted the way the console's `toStudents` counts it: credits on an active course, plus the child's credits that are in no course.
- `notify.DefaultEnabled` is now true for every type. Low credit used to be opt-in because it fired at every check-out.
- In admin, the Student Status card has **Remind: low credit** and **Remind: credits expiring** (`components/dashboard/CreditReminders.tsx`, which now takes a `kind` prop).

## Found on the way

- Admin #131 removed `<CreditReminders />` from the dashboard, so from 2026-09-23 until this change the expiry reminder could not be sent from anywhere. This change puts it back, and `DashboardReferenceLayout.test.tsx` now fails if either button goes missing.

Related: [[admin-search-sidebar-and-targeted-reminders]] [[notifications-system-plan]] [[an-hour-of-class-costs-an-hour-of-credit]]

Tags: #feature #notifications #admin #backend
