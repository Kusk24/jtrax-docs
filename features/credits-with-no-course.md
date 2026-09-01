# Credits with no course

**Shipped:** 2026-09-02 · **Repos:** `jtrax-admin`, `jtrax-backend` · **PRs:** admin #98 · backend #42

Hours a family paid for belong to the child, not to the enrolment row that
recorded them. Deleting a course no longer deletes the balance.

## Why

Reported plainly: *a child had thirteen credits, their one and only enrolment
was deleted, and the balance went to zero.*

`credit_transaction.enrollment_id` was `NOT NULL`, so a credit could not exist
without an enrolment. That left the console choosing between refusing the
delete and destroying the ledger — and neither is the answer, because the money
was real either way. The first version chose destroying it, which is how
thirteen paid-for hours stopped existing.

## How it works

Backend `0026` rebuilds `credit_transaction`: `enrollment_id` becomes nullable,
and two columns are added because the enrolment had been answering them by
proxy —

- **`student_id`**, whose the hours are.
- **`class_id`**, what they were bought for, and therefore what rate they
  convert at. Without it a detached balance would move as a bare number and
  quietly change what a family paid for.

Both backfilled from the enrolment. Deleting an enrolment now *detaches* its
credit entries, the way it already detached its payments
([[payments-outlive-students]]), and `toStudents` counts the entries no
enrolment claims toward the child's balance — which is the literal fix to the
report.

The student page shows what is left over — *"13 credits not in any course"*,
with the course they were bought for named — and a **Move into a course**
action beside it, which is the old Move Credits with its arithmetic intact:
both rates, the half-credit grid, a typed override, the expiry carried across.

## Decisions made along the way

- **Every write stamps `student_id` and `class_id`.** Registration, the desk's
  top-up, a payment, a course change. A row written without them is a credit
  belonging to nobody the moment its enrolment goes, and the backfill only
  covers what existed when the migration ran.
- **The Parent and Student read scopes had to widen.** They matched on
  `enrollment_id IN (…student_enrollment…)`, so a family's remaining balance
  would have vanished from their own portal the moment the office tidied away
  the course it was bought for. **A nullable foreign key changes every query
  that reached the row through it** — the scopes are the half that is easy to
  miss, because nothing in the console fails when they are wrong.
- **No rate on the old course carries the hours across unconverted.** A retired
  or unpriced course must not hold a balance hostage.
- **The delete dialog was rewritten, not just the code.** It said the credits
  *"go with it, and cannot be recovered"*. That was true when it was written
  and stopped being true in the same change — and an office told its credits
  will be destroyed will avoid the button that tidies the list. A warning is
  part of the behaviour it describes.

## Follow-ups

- [ ] The parent portal reads the balance through the same adapter, so loose
      credits count there too — but it has no way to *say* they are unattached.
      A family seeing credits against no class may ask why.

Related: [[credits-follow-the-child]], [[changing-a-childs-course]],
[[payments-outlive-students]], [[an-hour-of-class-costs-an-hour-of-credit]],
[[0007-retire-a-row-instead-of-deleting-it]]

Tags: #feature #admin #credits #data
