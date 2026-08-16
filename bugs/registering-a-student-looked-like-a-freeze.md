# Registering a student looked like a freeze, then failed on a unique email

**Found:** 2026-08-16 · **Fixed:** 2026-08-16 · **Repos:** `jtrax-admin` · **PR:** #30

## Symptom

Reported from the deployed console:

> registering a student … it just freezes, and I clicked register again and it
> showed email must be unique and quit and boom new student already in the list.
> It happened when I add a teacher or admin or parent too, so maybe it is a
> backend problem.

Every symptom pointed at the backend — a hang, then a constraint error, then the
record turning out to exist all along.

## Cause

Not the backend. `DataProvider.create/update/remove` each refetched **all
twenty-two collections** after the write, so a flow's cost was
`writes × collections`, all of it serial.

Measured in Chrome against a local backend:

```
registering one student: 189 requests in 1235ms
  9 writes, 180 reads
  submit button still enabled mid-flight: true
```

Nine writes: a student login, the student, an enrolment, a parent login, the
parent, three contact rows, the family link. On localhost the 180 reads cost a
second. Against Render's free tier in Singapore, at 100–300ms a round trip, they
cost the better part of a minute — with the button still live the whole time.
The second press re-ran all nine writes, and the first to land hit the unique
index on the email the first run had already inserted. Hence "freeze", then
"email must be unique", then finding the student there anyway.

The same shape existed on every multi-write form: admin (2 writes), teacher (2),
parent (6), session delete (1 per attendee + 1).

## Fix

- `batch()` on the data provider holds the refetch while a flow runs and does it
  once at the end — including when the flow throws, because a half-written flow
  still has rows the screen has to show. Depth-counted, so a batch nested inside
  another does not refetch early.
- Applied to registration, parent create/edit, admin create/delete, teacher
  create, session delete, tournament delete and saving the credit rules.
- Submit buttons disable and change label while writing: "Registering…",
  "Saving…", "Deleting…".

`189 → 29 requests`.

## What made it hard to see

Every clue pointed the wrong way. The console reported a *server* error
(`email must be unique`) for a *client* problem, and the record really was
created, so "the backend accepted it and then broke" was the natural reading.
Only counting requests showed it.

The check that now covers it delays every write by 400ms to imitate the deployed
backend and then deliberately double-clicks; it fails 4 of 6 assertions against
the unfixed code.

## Prevention

A refetch-everything-after-every-write data layer is fine for one write and
quadratic for a flow. Any sequence of writes belongs in a `batch`, and any
button that starts one has to stop taking clicks until it finishes — the second
click is not a user error, it is what anyone does when a screen stops
responding.

Related: [[admin-console-ux-pass]], [[backend-crud-and-live-portals]]

Tags: #bug #admin #performance
