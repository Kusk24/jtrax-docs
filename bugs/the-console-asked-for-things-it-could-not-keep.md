# The console asked for four things it could not keep

**Found:** 2026-08-21 · **Fixed:** 2026-08-21 · **Repos:** `jtrax-backend`, `jtrax-admin`

## Symptom

The role-workflow walkthrough of 21 August marked the Admin's two central jobs
— enrolling a child and taking their money — as *partly live*, and named why:

> The guardian is only created when both a name and an email are given,
> although the form accepts a name and phone alone. "Current school" and
> "FIDE ID" are collected but not saved.

> The Status and Reference fields on the form are discarded — every payment
> saves as Paid with no reference.

Four fields with a box on screen and nowhere to land. Three of them vanished in
silence; the fourth, the guardian, took a whole person with it — a child
registered with a phone number and no email address ended up with nobody
attached to them, and nothing said so.

## Cause

Each one a different distance from the database.

**Current school** had no column at all. The wizard had asked for it since the
design was ported and nobody had noticed the write did not mention it.

**FIDE ID** had a column — `student.fide_id`, added by `0013` for the
chess-results join — and a slot in the resource registry. The registration
write simply never sent it. The field that lets an arbiter's standings name a
JCA pupil was typed in and dropped one layer above where it was wanted.

**The guardian** was gated on `draft.parentName && draft.parentEmail`, because
a guardian needs a login and a login needs an email address. The form asked for
a name, a relation, a phone and an email, marked none of them required, and let
the button through on a phone number alone — so the condition was written for
one contract and the form offered another.

**Payment status and reference** were held in React state that no handler ever
read: `onSave` sent a literal `status: "Paid"` and no `reference_number`. Below
that, the column agreed — `CHECK (status IN ('Paid'))`, from the initial
schema. So even a corrected form would have been refused by the database. The
list had already been simplified around the constraint, with a comment
explaining that a status column would read "Paid" on every row.

## Fix

**Backend** — `0018_school_and_payment_status.sql`:

- `ALTER TABLE student ADD COLUMN current_school TEXT`
- `payment` rebuilt with `CHECK (status IN ('Paid','Pending','Refunded'))`.
  SQLite cannot widen a CHECK in place, and `credit_transaction.payment_id`
  points into the table being dropped — so this repeats the parking dance from
  [[payments-outlive-students]]: back the links up, null them, rebuild, restore.
  `PRAGMA defer_foreign_keys` does not rescue that case; it is written up in
  `0006` and the note still holds.
- `registry.go`: `current_school` on students, `payStatus` widened to three.

**Console** — `jtrax-admin`:

- `StudentsPage.tsx` sends `current_school` and `fide_id` on registration, and
  the student detail both shows and edits them — a field that is saved and then
  invisible is only half kept.
- The guardian is created on a **name**, not a name *and* an email. Without an
  address the login falls back to `first.last@parent.jca.ac.th`, exactly as a
  student's does — a username, not a mailbox. The dialog that hands over the
  temporary password says when the address was invented and that nothing can be
  sent to it. The email *contact* stays empty until the family gives one; the
  Parents screen already distinguishes login address from contact address, so
  there was a shape to fit into rather than one to invent.
- `PaymentPage.tsx` sends the status and the reference the desk typed. The
  status column is back on the list, with a filter beside the method one.
- Credits now follow the payment, which is what the walkthrough already claimed
  happened. A payment marked Paid writes its package's `purchase` transaction in
  the same batch; a Pending one writes nothing, and marking it Paid later on the
  edit form is what releases the credits — guarded by the transaction that
  points back at the payment, so it happens once.
- `live.ts`: `toPayments` reads the real status instead of asserting `"Paid"`,
  and `monthRevenue` / `toRevenueTrend` count only Paid rows. This was forced by
  the rest: the moment Pending became recordable, a total over every row would
  have counted money the academy has been promised but does not have.
- While confirming the labels: `students.dateOfBirth` was missing from both
  catalogues, so the registration form's date field was captioned
  `students.dateOfBirth` in English and Thai alike. Added.

## Verified

`internal/api/deskfields_test.go` — school and FIDE ID survive a round trip; a
Pending payment keeps its reference, can be moved to Refunded, and `Maybe` is
refused with 400.

Then the console's actual write sequence, against a server on a fresh database,
in the order the wizard makes them: student with school and FIDE ID → enrolment
→ guardian login on a generated address → guardian → phone contact → family
link → a Pending bank transfer → no credits while pending → cleared to Paid →
20 credits released → bogus status rejected → school still there on reload.

## Prevention

None automated for the general shape, and it is worth naming: **a form field
with no assertion behind it can be deleted from the write and nothing goes
red.** All four of these compiled, typechecked, and passed every test. The one
real guard is the walkthrough itself — reading the screens against the code and
writing down what is not saved, which is how these were found.

Where a rule does exist: a field the form collects should appear in a test that
reads it back, not only in one that writes it.

Related: [[payments-outlive-students]], [[deleting-and-linking-people]],
[[admin-console-ux-pass]], [[ui-audit-2026-08-21]]

Tags: #bug #admin #backend #data
