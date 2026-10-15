# Families hear about cancelled classes and paid tournament fees

**Shipped:** 2026-09-24 (in review) · **Repos:** all four · **PRs:** backend #66, #67 · admin #136 · web-app #77 · mobile #25 (merge the backend first)

Two things families had to find out for themselves now reach them. When the office cancels an upcoming class, the parents of every child due at it are told. When a tournament fee is paid, whoever paid it gets a receipt: through the inbox for a parent, by email for someone who entered on the public form.

## Why

On 2026-09-24 the user asked for "any other place that is necessary" to be covered after [[low-credit-is-sent-by-staff]]. An audit of every place that affects a family turned up three silent ones:

- **Cancelling a class** (added by admin #131) deleted the attendance, refunded the credits, and told nobody.
- **A tournament fee recorded at the desk** never sent "Payment successful". The desk writes SQL directly, so the payments resource's receipt hook never ran.
- **A public entrant** ([[a-public-entrant-pays-online]]) got no receipt at all, because `notifyPaymentPaid` returned early when there was no student.

## How it works

- `POST /api/v1/class-sessions/{id}/cancel` (`jtrax-backend/internal/api/classcancel.go`, staff only):
  - One transaction: refunds each attendance (`refundAttendance`), deletes the attendance, deletes the session.
  - Then sends `class_cancelled` to the parents of students actively enrolled in the class plus anyone on that session's roster.
  - Only for today or later: a past session is tidying, not news.
  - The Thai date uses the Buddhist-era year.
- Admin's **Cancel class** calls that endpoint instead of deleting rows itself (`components/dashboard/SessionPanel.tsx`).
- `handleDeskPayment` now calls `notifyPaymentPaid`, the same as the Stripe webhook.
- `emailPublicEntrantReceipt` emails the registration's `contact_email` through `notify.Service.Email`. It skips an address that already belongs to one of the child's parents.
- `class_cancelled` is a new type in every catalogue:
  - `notify.Type*`, `validType`, and the settings `types` list in the backend
  - the admin switchboard
  - `NOTIF_TYPES` and `NOTIF_DEFAULTS` in web and mobile, with an inbox icon and a settings switch

## Also fixed

The parent screens (web #76, mobile #24) still showed low credit as off, with "Off unless you turn it on", after the backend made it default-on in [[low-credit-is-sent-by-staff]]. Both now default on, and a test checks that every type does.

## Not done, on purpose

- **Welcome emails for new accounts.** The office hands out the temporary credentials in person, and emailing a password is worse than that.
- **Rescheduled classes and withdrawn tournament entries.** Neither was asked for. The desk usually calls.

Related: [[notifications-system-plan]] [[low-credit-is-sent-by-staff]] [[a-public-entrant-pays-online]] [[card-payments-through-stripe-checkout]]

Tags: #feature #notifications #payments #backend #admin #web #mobile
