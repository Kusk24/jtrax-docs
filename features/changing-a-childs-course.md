# Changing a child's course, in one act

**Shipped:** 2026-09-02 · **Repos:** `jtrax-admin`, `jtrax-backend` · **PRs:** admin #95, #96, #97 · backend #41

The enrolment list has three actions: **Add**, **Change course** and
**Delete**. A move records the course the child came from.

## Why

The office asked for a change action, and for the change to remember the
previous course. Both halves matter for the same reason.

Moving a child up a level was **two acts done by hand** — withdraw, then
remember to enrol them again — and the result was two unrelated rows: a
Withdrawn enrolment in the old course and an Active one in the new, with
nothing saying the second happened because of the first.

Months later that is the difference between two answers to one question. *"Why
did this child stop attending Beginner?"* — they left the academy, or they
moved up to Intermediate. The roster could not tell them apart. The credit
transfer's ledger notes were the only trace, so **a move with a zero balance
left none at all**.

## How it works

`moved_from_class_id` on `student_enrollment` (backend `0025`), written by
`changeCourse` in `components/pages/StudentsPage.tsx`.

The order is the whole design:

1. **The new enrolment first** — the credits need somewhere to land.
2. **The balance converts across** at the two courses' rates, as the same
   matching pair of ledger entries every transfer writes
   ([[credits-follow-the-child]]).
3. **The old course is left last.** By then the outgoing entry has given it a
   history, so `leaveClass` withdraws it and keeps it rather than deleting a
   row a receipt still points at.

Doing (3) first would have deleted an empty enrolment and taken the ledger's
other half with it.

## Withdraw and Move credits went (#96)

Shipped first as five actions — Add, Move credits, Change, Withdraw, Delete —
and the office cut it to three. They were right on both counts.

**Withdraw had no job left.** The only reason to end an enrolment without
starting another is that the record should not be there, and that is Delete.

**Move credits had no home left.** Its arithmetic is what Change course needs,
so it moved inside: the conversion at both rates, the half-credit rounding, the
typed override, the prefilled expiry. One difference survives the move — the
standalone dialog *refused* to proceed without a rate, because the transfer was
the whole act and could wait for a typed figure. Inside a change it carries the
balance across unconverted and says so: the office came to move a child, not to
price a course, and blocking that is the software arguing with the reason it
was opened.

The one case the merge loses is shifting credits between two courses a child is
*both* still in. Nobody has asked for it.

## The Delete that was there and could not be seen (#96)

Reported as *"I cannot find your delete button — did you even put it in?"* It
was in the code, and it was invisible.

It was gated on `!enrolmentHasHistory(id)` — the same rule `leaveClass` uses to
decide between deleting and withdrawing. Correct for *that* decision, and
exactly wrong here: **every row a change leaves behind carries the ledger entry
that moved its credits out**, so the condition meant to protect those rows hid
the button on precisely the rows the list needed tidying of.

The fix is to do the work the condition was avoiding. Dependants go in the
order the foreign keys allow:

1. **Payments are detached, not deleted.** `payment.enrollment_id` is nullable
   and a payment has carried its own `student_name` and `class_name` since
   `0006` ([[payments-outlive-students]]) — it was built to outlive what it
   points at, so a receipt still reads. Money is never deleted here.
2. **Credit entries go with the row.** `credit_transaction.enrollment_id` is
   NOT NULL, so they cannot be detached.

The dialog counts both out loud first, because "tidying up the list" and
"deleting a term of credit history" are the same click and only one of them is
what the office had in mind.

**The lesson:** a guard borrowed from one decision does not automatically fit
another. `enrolmentHasHistory` answers "can this be deleted *without doing
anything else*" — reusing it as "should Delete be offered" quietly redefined
the feature as "Delete, except when you need it".

## The conversion broke, and it was a lookup not the arithmetic (#97)

Reported a change later: moving credits from a dearer course to a cheaper one
stopped producing more credits.

`planTransfer` was never involved. It keeps the money and lets the hours change,
and its own tests have covered both directions since it was written. What was
wrong is **which package it was handed** for the course being moved into.

That course has no enrolment yet, so its rate was asked for with an empty
enrolment id — and `rateOf` compares `String(p["enrollment_id"] ?? "")` against
it. Empty matches every payment that has *no* enrolment. So an empty id never
meant "no payment"; it meant "the first detached payment on file", and the
destination rate came off whatever package that one bought.

**The trap was armed by the previous change.** Detached payments used to be
rare. #96 made Delete null `enrollment_id` on an enrolment's payments so the
receipt survives ([[payments-outlive-students]]) — which is right, and which
means the more the office tidied the list, the more certainly the next
conversion was computed against an unrelated course's price list. A feature
that quietly degrades the longer it is used.

**The shape worth remembering:** a sentinel that is also a legitimate stored
value. `""` meant "there is no enrolment" to the caller and "this payment has
no enrolment" to the data, and nothing in the type system could tell those
apart. The fix is to not ask: skip the lookup when there is nothing to look up.

## Decisions made along the way

- **The column points at the class, not the enrolment.** An enrolment nothing
  has been spent against is deleted rather than withdrawn — a mistake being
  undone — so a reference to one can vanish. A class row never does: retiring
  it keeps it ([[0007-retire-a-row-instead-of-deleting-it]]), which is exactly
  the guarantee a historical pointer needs.
- **Carrying the credits is a tick box, on by default.** An hour paid for is an
  hour owed whichever course it is taken in, and leaving the balance on a
  course the child has left is how one goes missing.
- **With no rate on one side, the hours move across unconverted** rather than
  being dropped, and the dialog says so. The office can correct a number on the
  Credits tab; it cannot recover credits the console quietly declined to carry.
  This is the opposite call from the standalone Move Credits dialog, which
  refuses to guess — there, the move is the whole act and can simply wait for a
  typed figure; here it is one step inside a change that is going ahead anyway.
- **Targets exclude a course the child is already in.** A second enrolment for
  the same pair is two balances and two rosters for one child in one room.
- **Delete is offered only where nothing hangs off the row.**
  `credit_transaction` and `payment` both reference the enrolment, so the
  database refuses to drop one they point at — a Delete button there would be a
  button that always fails. An enrolment with a term behind it is *withdrawn*,
  which is the honest word for what happened to it. This is the same rule
  `leaveClass` has always applied silently; it is now two visible buttons
  instead of one that quietly picked.

## Follow-ups

- [ ] The parent and student portals show a child's classes but not that they
      moved between them. The line the console shows — "Moved from Beginner" —
      would read just as well to a family.

Related: [[credits-follow-the-child]],
[[0007-retire-a-row-instead-of-deleting-it]],
[[a-form-that-kept-none-of-what-it-collected]],
[[an-hour-of-class-costs-an-hour-of-credit]],
[[a-class-is-what-a-session-was]]

Tags: #feature #admin #ux #enrolments #credits
