# The product to-do pass: notifications, tournaments, parent portal

**Shipped:** 2026-09-10 · **Repos:** `jtrax-backend`, `jtrax-admin`, `jtrax-web-app`
**PRs:** backend #48 #49 · admin #112 #113 · web-app #55 #56 #57

Everything in `To Do List - JTrax.pdf` except the tournament confirmation
flow, which needs a scheduler and is not started.

## Why

The academy reviewed the built product and wrote up what was wrong or
missing: notifications that did not match how credits actually work, a
parent portal that showed blank profiles and an empty home page, and
tournament screens that could not take a regulation file or charge an
early-bird price.

## The three notification rules

Set by the academy on 2026-09-10 and now enforced in three places:

1. **Low credit is off by default** and opt-in per parent
   (`notify.DefaultEnabled` returns false only for `low_credit`).
2. **Everything else defaults on** — an absent preference row means the
   type's default, not a blanket yes.
3. **The admin decides what the school sends at all**: `notify_<type> = off`
   in `system_configuration`, edited from Settings → *Notifications the
   school sends*. Absent means on, so a new type works before anyone visits
   that screen.

A parent's own toggle and the school switch are different questions: the
school switch stops a type reaching anyone; the parent's stops it reaching
them. Both must be on.

## What changed

**Credits are deducted at check-out, so check-out is the receipt.** The
plain "has left class" became `credit_deducted`, carrying class time,
credits used and credits left. A check-out that charged nothing falls back
to the old wording rather than inventing a zero-credit receipt.

**New types**: `credit_deducted`, `low_credit` (opt-in, once a day per
student), `payment_received` (in-app + email, fired from all three paths a
payment can become Paid — desk, edit form, and the Stripe webhook, which
writes SQL directly and so needs its own call).

**The parent portal reads the real backbone.** Its notifications were
re-derived client-side from attendance stamps and read marks lived in
localStorage; now the inbox is the server's, read marks are `read_at`, and
Settings writes the backbone's per-type toggles → [[notifications-backbone]].

**Tournaments** gained an early-bird *window* (`early_bird_fee` had sat
unusable since `0001` with no deadline column), a regulation file stored in
the database and readable by parents, a verified student ID on public
entry, and category age validation read out of the category's own name
("U8 Boys" → under 8 on the tournament's start day) →
[[tournaments-linked-to-chess-results]].

**Parent portal fixes**: a child with no photo drew a blank block — the
"black profile" — and now gets a monogram; the home page carries children
and today's activity again, because announcements and tournaments are rare
and the page read as "nothing is happening".

## Decisions made along the way

- **Early bird and the student discount never stack.** Early bird is for
  outside participants; the student discount comes off the *regular* fee.
  The PDF asked what the student discount was for; this is the answer.
- **Verified student IDs cost some anonymity.** The original public
  registration deliberately did not check the claim, so the endpoint could
  not be used to discover who is a pupil. Checking reintroduces that: a
  caller can test whether an ID exists. Accepted because the academy asked
  for validation; mitigated by opaque IDs that return no name, the tightest
  rate limit on the API (10/min), and an unchanged email path — a known and
  an unknown address still come back byte-identical.
- **Two fakes removed.** The Create Tournament wizard waited 1.8s and then
  filled the form with a tournament that does not exist; the parent portal's
  notification list imitated a sender. Both now do the real thing or
  nothing.
- **The in-app channel is a type's master switch.** The old rule said the
  inbox could never be turned off, but the portal's per-alert toggles *are*
  in-app toggles, and "Check-in Alerts: off" has to mean off.

## Bugs found by driving it

Both `/api` proxies (admin and web-app) read every upstream reply with
`text()` and answered `application/json`, so a regulation PDF arrived
corrupted; and the web-app proxy had no `PUT` handler at all, so saving a
notification preference bounced with 405. Neither would have shown up in a
type-check or a unit test.

## Follow-ups

- [ ] **Tournament confirmation flow** — registration-confirmed email,
  participation confirmation on a date the admin picks (default 5 days
  before, reminder at 3), confirmed/cancelled notices, results-published.
  Needs time-based sending, which the backend deliberately has none of.
- [ ] Real extraction from an uploaded regulation. The file is stored and
  readable; nothing parses it. The OCR provider exists but is prompted for
  registration forms → [[scanning-a-paper-registration-form]].
- [ ] Push send workers (VAPID / Expo) are still scaffolding.

Related: [[notifications-backbone]], [[card-payments-through-stripe-checkout]],
[[credits-follow-the-child]], [[an-hour-of-class-costs-an-hour-of-credit]]

Tags: #feature #notifications #tournaments #parent-portal #security
