# A class is a length, not an end time

**Shipped:** 2026-09-01 · **Repos:** `jtrax-admin` · **PR:** #91

Creating a class asks when it starts and how long it runs. It used to ask for
two clock times and work out the gap.

## Why

Nobody decides a class ends at 17:30. They decide it runs for an hour and a
half, starting at four — so the form was asking the office to do arithmetic to
express something it already knew.

Asking for the length directly also moves the half-hour floor from an error
message into the shape of the control. There is no way to pick twenty minutes,
so nobody has to be told off for trying.

## How it works

`lib/session-draft.ts` gained `durationOptions`, `endAfter` and
`defaultDurationFor`. Quarter-hour steps from 30 minutes to four hours: finer
is a timetable nobody runs, longer is a holiday camp, which is several classes.

`end_time` is still what gets stored, so nothing downstream changed — the
backend, Class History and the credit sum all read the same two times they
always did.

Three behaviours that came out of it:

- **A late start is only offered the lengths that fit before midnight.**
  Offering four hours from 23:00 and refusing it afterwards is the Create
  button that will not press, all over again.
- **Moving the start slides the class rather than resizing it.** Choosing two
  hours and then correcting 10:00 to 09:00 used to leave a three-hour class.
  This is the whole point of asking for a length.
- **The end time is worked out and shown** beside the price. A length is only
  reassuring if you can see where it lands.

## Decisions made along the way

- **`endBeforeStart` stays in `draftProblem`.** It is now unreachable from the
  screen — a length cannot be negative — but the times it guards still reach
  the backend, and the guard is still tested at the function level. A check
  that is unreachable *today* is not the same as one that is unnecessary.
- **A class ending exactly at midnight is allowed**, and reads `00:00`. It
  belongs to the day it started.
- **The start is still two selects, not `<input type="time">`.** That input
  reports `""` until every segment is filled and how many segments there are is
  the browser's business, so a field reading "03:30" could be empty to the code
  ([[create-session-would-not-press]]).

Related: [[create-session-would-not-press]],
[[an-hour-of-class-costs-an-hour-of-credit]],
[[a-class-is-what-a-session-was]], [[the-front-desk-remembered-nothing]]

Tags: #feature #admin #ux #attendance
