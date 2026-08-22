# Retire a row instead of deleting it

**Date:** 2026-08-21 · **Status:** accepted
**Repos:** `jtrax-backend`, `jtrax-admin` · **PRs:** backend #34 #35, console #68 #69 #72 #76

## Context

Three Delete buttons in the console had never once worked, and all three failed
the same way: a 409 from the database the moment the record had any history.

The foreign keys are the reason, and every one of them is deliberate:

| Deleting | Refused by | Because |
|---|---|---|
| a class | `student_enrollment.class_id`, `class_session.class_id`, `credit_package.class_id` — all NOT NULL | a class with one enrolment or one session cannot go |
| a credit package | `payment.credit_package_id` | a payment is what says a family bought twenty credits for 12,000 baht, and the package is where the twenty comes from |
| an enrolment | `credit_transaction.enrollment_id` NOT NULL | credits hang off an enrolment, so a term of ledger goes with it |

The office was stuck with every class it had ever named, a price list that could
only grow, and every class a child had ever joined.

Deleting for real means rebuilding those three tables to make `class_id`
nullable — and two of them are themselves referenced by NOT NULL columns
(`attendance.session_id`, `credit_transaction.enrollment_id`), so their rows
would have to be parked and restored mid-migration, against live data, for
nothing anyone can see.

The deeper problem is that deletion is the wrong verb. Last term's attendance
has to keep naming the class it was, and a receipt has to keep adding up. The
academy does not want the record gone; it wants the class off the list.

## Options considered

| Option | Pro | Con |
|---|---|---|
| Rebuild the tables so the FKs are nullable | a real delete | a multi-table rebuild with rows parked mid-migration, and the history is still lost |
| `ON DELETE CASCADE` | one line | deletes the receipts along with the price list — exactly what must not happen |
| **`archived_at TEXT`, nullable** | one column, no rebuild, reversible by clearing it | every screen that *offers* the row has to remember to filter |
| Reuse a lifecycle column already on the row | no schema change at all, and the word already means this | only exists where somebody thought of it first |

## Decision

**Retire the row. Keep it on file, take it off every list where it can be
chosen.** Which mechanism depends on whether the table already has a word for
it:

- **`archived_at`** where there was none — `class` (backend `0020`) and
  `credit_package` (`0021`), each with an index, served like any other column
  (`internal/api/registry.go:184`, `:253`).
- **`student_enrollment.status`** where there was. Active / Completed /
  Withdrawn has been in the schema since the first migration — a lifecycle built
  for exactly this — and an `archived_at` beside it would be a second way to say
  the same thing.

The rule that makes it work is a split the console now holds explicitly:

> **Choosing and naming are different questions, and only one of them should
> forget.**

Screens that *offer* a class, package or enrolment go through a filter;
screens that *name* one read the raw collection, so an old enrolment and a
finished session still say what they were. In `jtrax-admin`:

- `liveClasses` — `lib/live.ts:463`
- `livePackages` — `lib/live.ts:507`, which answers two questions at once: the
  package is not retired, *and* neither is its class. A class going takes its
  prices with it without each one being retired by hand.
- `activeEnrolments` / `isActiveEnrolment` — `lib/live.ts:479`. A blank status
  counts as Active: the column is NOT NULL with an Active default, and a row
  predating that default should not drop a child out of their class on a
  technicality.
- `isArchived` — `lib/live.ts:492`, one predicate for both.

The API keeps serving archived rows. Hiding them there would break the naming
half; the console is where the two questions are told apart.

## Consequences

**A delete button had to become an honest verb.** On an enrolment the row
offered Edit and Delete and both were wrong — editing retypes the class on a row
with a term of credits behind it, and "Delete" is not what happens. There is one
button and it says **Withdraw** (`components/pages/StudentsPage.tsx:290`). It
does whichever is true: an enrolment nobody has spent anything against is a
mistake being undone and is really deleted; one with credits or payments behind
it is a term that happened, and is withdrawn. The confirmation says which,
because the row afterwards looks different.

**Withdrawn now means something.** Nothing had ever read that column, so a child
who had left a class was still offered its sessions, could still be checked into
them, and still counted on its roster. Every "is this child in this class"
question goes through `activeEnrolments`: the desk's check-in, the create-session
roster, and the latecomer picker on a running session.

**A new picker is a new place to forget.** The filter is not enforced by the
type system — a screen that reads `raw.classes` for a dropdown will silently
offer a retired class. `lib/classes.test.ts` and `lib/enrolments.test.ts` pin
the helpers; the discipline of routing every picker through them is a review
habit, not a compiler error.

**It is reversible.** Clearing the column brings the class or package back,
which a delete never would. Nothing in the console exposes that yet — an
un-retire is a database edit today.

**A class needs only a name.** `class_type` is NOT NULL and describes a class
rather than identifies it, so `Col` grew a `Default` applied on create
(`internal/api/resource.go`), rather than making the office answer three
questions to write down that it teaches Beginners. `Default` is deliberately not
`Required`: one means "you must say", the other "if you don't, this is what it
is", and a column with both would be a contradiction.

**Credits stayed put when a child moved on.** Withdrawing keeps the balance on
the old enrolment and joining a new class starts at nothing — the money is still
on the books and the child cannot spend it. That is the gap
[[credits-follow-the-child]] fills, and it exists *because* of this decision.

Related: [[credits-follow-the-child]],
[[the-console-asked-for-things-it-could-not-keep]],
[[an-hour-of-class-costs-an-hour-of-credit]],
[[backend-crud-and-live-portals]], [[the-front-desk-remembered-nothing]]

Tags: #decision #backend #admin #data
