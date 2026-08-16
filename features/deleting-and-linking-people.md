# Deleting and linking students and parents

**Shipped:** 2026-08-16 · **Repos:** `jtrax-backend`, `jtrax-admin` · **PRs:** backend #14, admin #33

The office can remove a child or a guardian in one step, decide whether the
other goes with them, and attach a new child to a guardian who is already on
file instead of creating a second account for the same person.

## Why

Reported from the deployed console:

> I cannot delete a child. It shows it is referenced by other data. Only after I
> delete her class and her parent can it be deleted.

The generic `DELETE /api/v1/<resource>/{id}` refuses a row anything points at,
which is right for a class or a credit package — you should not lose a term of
attendance because someone tidied a dropdown. It is wrong for a person. A child
who has attended anything has attendance, credit transactions, payments, an
enrolment and a family link, so removing them meant deleting five kinds of row
by hand in an order the console had to know, with nothing to undo a
half-finished attempt.

## How it works

### Backend — two cascade routes

```
DELETE /api/v1/students/{id}/cascade[?parent=orphan]
DELETE /api/v1/parents/{id}/cascade[?children=delete]
```

Staff-only, one transaction each, answering with what actually went
(`{"student": "...", "parent": "...", "children": [...], "attendance_rows": 12}`).
`internal/api/people.go`; endpoint notes in `jtrax-backend/docs/deleting-people.md`.

Order is forced by the foreign keys — `credit_transaction` references the
enrolment, the payment *and* the attendance row, so it goes first of all:

1. `credit_transaction`
2. `attendance`, `payment`
3. `student_enrollment`
4. `practice_activity`, `practice_settings`, `puzzle_attempt`,
   `tournament_registration`
5. `student_parent`
6. `student`
7. `auth_session`, `password_reset`, then `user_account`

### The two family rules

- **`parent=orphan`** removes the guardian *only when this was their last
  child*. The sibling count is read inside the transaction, after the link is
  gone — asking before would have counted the child being removed. A guardian
  with other children is never touched.
- **`children=delete`** cascades each child first. Without it the children stay
  and simply lose their guardian, which is the usual case: one parent leaves,
  another is linked later.

### Console

The student's delete panel offers "Also delete {name}, who has no other
children" — and only when that is true. The parent dialog says the children are
kept by default and offers "Also delete their N children: …".

Registering a child now offers **New guardian** or **Existing guardian**;
picking an existing one links rather than creating a second account for the same
person, which is all the wizard could do before. Adding a parent has an optional
**Link a child**, offering only students nobody has claimed.

## Decisions made along the way

- **A child has one guardian; a guardian has any number of children.** The
  pickers enforce it by only offering unclaimed students — the link is keyed by
  student, so offering a claimed one would silently move them.
- **The login is deleted last, and only if nothing outside the ER model still
  references it** — a game the student played (`game_room.white_account_id`), an
  announcement they posted. Rewriting that history to free the row is a worse
  trade than one orphaned login, so the account stays and `accounts_kept` counts
  it. SQLite leaves a transaction usable after a constraint failure, so the
  refusal costs nothing else in the cascade.
- **Cascade as a separate route, not a flag on the generic DELETE.** The plain
  delete keeps refusing referenced rows, which is the behaviour every other
  resource wants; `/cascade` is a more specific mux pattern, so the two coexist.

## Verified

`internal/api/people_test.go` — 10 tests over the seeded family (Sandy with
Penny and Uri; Penny carrying attendance, credits, a payment and an enrolment):
the plain delete still refusing with the student intact, the cascade clearing
each referencing table and her login, a guardian kept when a sibling remains and
taken when none does, children kept by default and removed on request, a missing
student not reporting success, and Student / Teacher / unauthenticated all
refused with nobody removed.

Console side, driven in Chrome and asserted against the API: five flows,
24 checks — deleting a child with a full record in one step, the guardian kept
because a sibling remains, the last child taking their guardian and contact rows
with them, a parent deleted with children kept and with children taken, and a
new sibling registered under an existing guardian with no duplicate account.

## Afterwards, 2026-08-16

- **Payments are no longer deleted with the child.** The first version of this
  cascade removed them; they are now detached and keep the names — see
  [[payments-outlive-students]].
- **A child can be linked to a guardian from their own page** (admin #37), not
  only from the Parents screen. Unlink is there too, and detaches only that
  child.

## Follow-ups

- [x] ~~no way to move a child between guardians~~ — unlink and link are both on
      the student's page now, which is two clicks rather than two screens.

Related: [[admin-console-ux-pass]], [[registering-a-student-looked-like-a-freeze]],
[[backend-crud-and-live-portals]], [[0004-sqlite-and-generic-crud-backend]]

Tags: #feature #admin #backend
