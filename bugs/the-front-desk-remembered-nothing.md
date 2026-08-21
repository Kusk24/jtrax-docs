# The front desk remembered nothing

**Found:** 2026-08-21 · **Fixed:** 2026-08-21 · **Repos:** `jtrax-admin`

## Symptom

From the 21 August role-workflow walkthrough, under Receptionist:

> **Important.** This desk does not save anything yet. The chip flips to
> "Checked in" and the credit badge moves, but the check-in table and the
> "Checked in today" figure beside it do not — and everything is lost on
> refresh. Use Class History to record attendance until this is wired up.

The worst kind of screen: one that looks like it worked. A receptionist checks
a queue of children in, every chip turns green, and the academy has no record
that any of them came.

## Cause

`components/dashboard/FindStudent.tsx` kept a `Record<string, DeskState>` in
`useState` and wrote to it. Four actions — check in, assign a class, dismiss,
top up credits — all moved that object and none of them called the API.

Everything *around* it was already live and had been for a while:
`CheckinTable` reads real attendance rows and stamps `check_out_time` when it
dismisses, `KpiStrip` counts `checkins.length`, and `toCheckins` joins today's
sessions to `attendance`. So this was one component short of working, and the
gap read as a whole feature being fake.

## The state the database allows

`attendance` is a student **at a session** — `session_id` is `NOT NULL`. There
is no row meaning "here, but not in a class yet", and inventing one would mean
a session-less attendance row, which is not a fact about anything.

So checking in and being in a class are the same act, and the desk has three
states rather than the four its action matrix allows for:

| State | What it is |
|---|---|
| `none` | no attendance row for any session running today |
| `in_class` | a row exists, `check_out_time` is empty |
| `dismissed` | a row exists and has been stamped out |

`checked_in` in `lib/desk-actions.ts` is now unreachable. The row is kept —
it is the client's own table and costs nothing — with a comment saying why,
because the way to earn it back would be a schema change, not a guess.

## Fix

`lib/desk-state.ts`, pure functions over plain rows, so the rule can be read
and run without React:

- `deskStatusOf` — which of the three, from today's sessions and the
  attendance rows.
- `candidateSessions` — the sessions this student could be checked in to: the
  ones for classes they are enrolled in, falling back to **everything running
  today** when they are enrolled in none. A child standing at the desk has to
  be recordable whatever the paperwork says; sending the receptionist to
  another screen mid-queue is how a desk stops being used.
- `checkInIntent` — one candidate, write it; several, ask; none, say nothing is
  running rather than failing quietly.

`FindStudent.tsx` now reads those and writes: `attendance` on check-in (moving
the row rather than adding a second if the wrong class was picked first),
`check_out_time` on dismiss, and a `manual_adjustment` credit transaction on a
top-up — a manual adjustment, not a purchase, because no money changed hands
at the desk. Money goes through Record Payment, which writes its own entry.

Both dead ends say so out loud: no class running today, and no enrolment to
put credits on.

## Verified

`lib/desk-state.test.ts` (10) and `components/dashboard/FindStudent.test.tsx`
(6). The component tests assert the **requests**, not the chips — a green chip
is exactly what this bug had.

Mutation-checked: with the three write functions returning early — the original
behaviour, a desk that moves chips and saves nothing — four of the six fail.
Restored, all pass.

Then driven against the running backend, in the desk's own order: check in →
`Checked in today` reads 1 → dismiss stamps `check_out_time` → +10 credits
lands as a manual adjustment. Probe rows removed afterwards.

## Prevention

The component tests assert requests rather than rendered state, which is the
only assertion that would have failed on the original code. That is the rule
worth keeping for this screen: **for a desk, the test is the write.**

Related: [[the-console-asked-for-things-it-could-not-keep]],
[[the-payer-and-the-child-did-not-know-each-other]],
[[backend-crud-and-live-portals]]

Tags: #bug #admin #data
