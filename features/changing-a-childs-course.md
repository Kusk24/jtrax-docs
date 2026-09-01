# Changing a child's course, in one act

**Shipped:** 2026-09-02 · **Repos:** `jtrax-admin`, `jtrax-backend` · **PRs:** admin #95 · backend #41

The enrolment list has four actions instead of two: Add, **Change course**,
Withdraw and **Delete**. A move records the course the child came from.

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
