# An hour of class costs an hour of credit

**Shipped:** 2026-08-21 · **Repos:** `jtrax-backend`, `jtrax-admin` · **PRs:** backend #33, console #64

## The rule

One credit is one hour. A session is worth what it lasts, so ninety minutes
costs 1.5 and a half-hour costs 0.5. Balances are fractional and always were:
`credit_transaction.amount`, `credit_package.credit_amount` and
`class_session.duration_hours` are all `REAL`, and a balance is a plain sum
over the ledger.

Three decisions, taken deliberately:

- **Charged at check-in**, and reversed if the attendance is removed. The
  balance on screen is current when the desk is deciding whether to ask for a
  top-up, which is the moment it matters.
- **Balances may go negative.** The child attended; the record should say so. A
  negative balance already drives the red chip and the follow-up list.
- **Two states are not errors.** A student with no enrolment has nowhere to
  charge, and a session with no readable length has no cost. Both record the
  visit and leave the balance alone.

## What was actually there

Nothing deducted anything. The schema described the intent — a `consumption`
type, `credit_transaction.attendance_id`, and a seed row showing the shape:

```go
{"ctx_3", "enr_penny", "consumption", -1, "2026-05-05", "att_1"}
```

A grep for `consumption` across all four repos found that row, the enum, and a
dropdown option. No code path created one. Credits moved on a payment, the
roster import's opening balance, and manual adjustments — never on attendance.

So the question "does decimal credit deduction work" had a shorter answer than
expected: there was no deduction to be decimal about.

## Where it lives, and why

In the backend. The front desk, the teacher's roster and Class History all
write the same `attendance` rows; a rule kept in one of three clients is a rule
the other two get wrong.

`Resource` grew two hooks — `AfterWrite` and `BeforeDelete` — which run inside
the same transaction as the write, so a visit and what it cost cannot land
separately. Resources without a hook keep the plain single-statement path;
a transaction per row is not a cost every resource should pay for the sake of
two.

`chargeAttendance` is **re-runnable rather than incremental**: it deletes what
this attendance cost before and writes what it costs now. That is what lets one
function serve both the insert and the update, so moving a student from a
one-hour class to a two-hour one changes the charge instead of adding a second.
Worth keeping as a pattern — an idempotent "recompute from the stored row" hook
is far easier to reason about than a diff-aware one.

## duration_hours was never trustworthy

Only the seed and the roster import ever set it. The console's session form
collects a start time and an end time and nothing worked out the difference, so
every session staff created carried a `NULL` length — which under this change
would have been a free class.

It is now derived on every session write, and `0019` backfills what was already
on file. Sessions whose times are unreadable or run backwards are left `NULL`
rather than given a wrong number: an incomplete timetable should stay visibly
incomplete.

## The console side

`fmtCredits` — two decimal places, trailing zeros dropped. Fourteen credits
minus three half-hour lessons is `13.499999999999998` in binary floating point,
which is the right number and the wrong thing to put on a chip. Only two places
rendered a raw balance (the students list and the check-in table); everything
else already goes through next-intl, which rounds for display on its own.

The manual credit entry gained `step: 0.5`. Without it the spinner counts in
whole hours and the browser calls 13.5 a mistake, in a field whose whole point
is half-hour lessons.

## Verified

Eight backend tests over the API, asserting balances rather than rows: half an
hour costs 0.5, ninety minutes 1.5, a session's length is taken off the clock,
deleting an attendance refunds it, moving to a longer class recharges rather
than double-charges, an empty balance goes negative rather than refusing, a
student with no enrolment is still recorded, and a session ending before it
starts charges nothing.

`fmtCredits` is tested against floating-point dust directly.

## Revisited: negative balances, 2026-08-22

The second decision above was challenged and stands. Backend #36 —
*"Refuse a session a child cannot pay for"* — was built and verified against a
running server: the charge read the balance before writing and refused with
`400 Boon has 0.5 credits left and this session costs 2`, in the same
transaction, so no attendance row survived the refusal.

It was **closed unmerged**. The academy lets a child attend on credit and settle
afterwards, so refusing the attendance is the wrong rule — turning a child away
at the door to protect a balance is not something the front desk does. The
console marks the shortfall instead: a red figure beside the name on the session
panel says who to chase, and the tick survives the session being lengthened,
because there is nothing to withdraw.

Worth recording because the refusal is a reasonable-looking change that will be
proposed again. See [[create-session-would-not-press]].

Related: [[the-front-desk-remembered-nothing]],
[[the-console-asked-for-things-it-could-not-keep]],
[[backend-crud-and-live-portals]], [[credits-follow-the-child]],
[[create-session-would-not-press]],
[[0007-retire-a-row-instead-of-deleting-it]]

Tags: #feature #backend #admin #data
