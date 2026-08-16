# Payments outlive the students they were taken for

**Shipped:** 2026-08-16 · **Repos:** `jtrax-backend`, `jtrax-admin` · **PRs:** backend #15, admin #38

Deleting a child no longer deletes their payments. The rows stay in the books,
marked "student removed", still naming the child, their class and the guardian
who paid — and the totals do not move.

## Why

> when deleting children, do not delete the payment records, keep the children
> name and info in the payment record

The cascade shipped that morning ([[deleting-and-linking-people]]) deleted
payments along with everything else pointing at a student. That is right for
attendance and wrong for money: the payment was received, and "who paid what"
has to be answerable long after the student left.

## How it works

Migration `0006_payment_outlives_student.sql`:

- `payment.student_id` becomes **nullable**, so a row can be detached from a
  student who no longer exists rather than deleted with them.
- `student_name`, `class_name`, `parent_name` are added and backfilled.

The cascade in `internal/api/people.go` now sets `student_id` and
`enrollment_id` to NULL and writes the names first, rather than deleting.
`COALESCE`, so a payment that already carries its own snapshot keeps it.

**Snapshots rather than joins, on purpose.** A payment records what was true
when the money changed hands; renaming a class later must not rewrite last
year's receipts. The roster import and the console both write the three names
at creation time, so it is not only deleted students that have them.

## The trap: `defer_foreign_keys` does not cover DROP TABLE

Dropping NOT NULL means a SQLite table rebuild, and
`credit_transaction.payment_id` points into the table being dropped. The
obvious fix — `PRAGMA defer_foreign_keys = ON`, which unlike `foreign_keys` can
be set inside a transaction — **does not work**:

```
COMMIT FAILED -> FOREIGN KEY constraint failed
```

`DROP TABLE` raises one deferred violation per referencing row, and recreating
the table under the same name with the same primary keys does not clear them.
The counter survives to COMMIT.

The migration instead parks the links in a scratch table, nulls them, rebuilds,
restores them, and drops the scratch table — nothing is ever dangling, and no
pragma is needed.

**This was only visible on an existing database.** The Go test suite builds
every database from empty, where `payment` and `credit_transaction` are both
empty and the drop is a no-op. The first version of the migration passed the
whole suite and would have failed on the deployed Turso database. Worth
remembering: *a migration is not tested until it has run against data written
under the previous schema.*

## Verified

- The upgrade path: a database built on the previous schema with the dev seed
  (2 payments, 2 credit transactions pointing at them), then the real migration
  runner over it — both payments preserved with names backfilled, both credit
  links restored, `pragma foreign_key_check` clean, server healthy.
- Three API tests: a deleted student's payments survive detached and named; a
  whole family deleted keeps every payment with a name; an existing snapshot is
  not overwritten.
- A roster test asserts every imported payment carries all three names.
- Through the console: deleting Ava Patel left 13 payments at 13, both of hers
  still naming her, detached, still saying who paid, and marked on screen.

## Follow-ups

- [ ] The Payment screen has no way to *edit* the snapshot names — a typo at
      the till is permanent unless the row is deleted and re-recorded.

Related: [[deleting-and-linking-people]], [[admin-console-ux-pass]],
[[0004-sqlite-and-generic-crud-backend]]

Tags: #feature #backend #admin #data
