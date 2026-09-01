# A form that kept none of what it collected

**Found:** 2026-09-01 · **Fixed:** 2026-09-01 · **Repos:** `jtrax-admin`, `jtrax-backend` · **PRs:** admin #91, #92, #93, #94 · backend #40

## Symptom

Reported as one thing: *"I cannot edit the student date of birth — when I
changed it, it does not change the student yrs."*

It turned out to be two unrelated faults on one screen, and the second was
much larger than the report.

## Cause 1: a date field that could not show the date

`<input type="date">` accepts exactly `YYYY-MM-DD` and renders **blank** for
anything else. No warning, no fallback — an empty field over a date the
database is holding.

Every other reader of `date_of_birth` is forgiving: `new Date` takes a
timestamp, a space instead of a `T`, a slashed date. So a row imported as
`2015-08-21T00:00:00Z` — and `JTRAX_ROSTER` writes whatever the JSON contained,
verbatim (`internal/db/roster.go:300`) — looked right on the roster, right in
the age beside the name, and *unset* in the one place the office goes to
correct it.

Which reads, correctly, as a field that cannot be edited.

The age arithmetic was never wrong. `age()` parses all of those shapes happily,
which is exactly why the fault survived: every screen that *displays* the date
agreed it was there.

### Fix

`toDateInput` in `lib/live.ts`, applied on the way in (`toStudents`) and on the
way out (the save). It reads a leading ISO date **textually** rather than
through `new Date`, which would shift `2011-05-02T00:00:00Z` back a day for
anyone west of Greenwich and quietly move a child's birthday.

Date of birth is also shown in the read-only panel now. Its only trace used to
be the age in the header, so an office checking whether a correction had saved
had to work backwards from that number — and a wrong date and a missing one
look identical that way.

## Cause 2: the card showed fourteen fields and wrote five

Found while chasing the first. `onSave` wrote `name`, `date_of_birth`,
`current_level`, `current_school`, `fide_id`. The other nine were typed, saved,
and discarded with no error.

Five were **real facts with a real home** the form simply never wrote to — the
guardian's name, the relationship, and their phone, email and LINE ID. A
guardian is a person with their own record, shared with their other children,
so saving them is three tables: `parent`, the `student_parent` link that
carries the relationship, and one `parent_contact` row per line.

Four had **nothing behind them in either direction**, which is worse — they
invited an edit the console was never going to keep:

| field | what it actually was |
|---|---|
| Course | derived from the enrolment |
| Membership | the course's own class type |
| Branch | one option, no column |
| Student LINE ID | `toStudents` set it to `""` every time; no column at all |

The Branch picker carried a comment warning that a mismatched list would
"silently move them to the first option on save". That is precisely what the
whole card was doing, to six fields at once.

### Fix, and a correction to it (#93)

The four phantom fields went. The ones that are real facts stay in the
read-only panel, and the card says where a course is changed: the Enrolments
tab, which moves the credits across with them ([[credits-follow-the-child]]).

The guardian block was first made to **write** (#92). That was the wrong half.
A parent is their own record, *shared with their other children*, so editing
their name or phone number from a child's page edits a person nobody is looking
at — and silently rewrites what the sibling's page says too.

What belongs to the child is the **link**: which parent, and how they are
related. Both are stored on `student_parent` and nowhere else, and both stayed.
The parent's own details are shown read-only with a way through to them, and
`ParentsPage` gained a `detailId` so that link lands on the parent rather than
on a list to search again.

The lesson generalises past this form: **a field belongs on the screen that
owns the row it writes.** "Convenient to edit here" and "this screen owns this
fact" are different questions, and only the second one survives a shared
record.

## A wrong turn worth recording

The first hypothesis was that the backend was rejecting the edit — a local
`PATCH` returned `400 unknown field "current_school"`, which would have failed
the *whole* save including the date. It was a stale `go run` process: the
registry has had that column since backend #32. The deployed service was never
affected.

**The lesson is cheap and kept costing:** before blaming a deployed service,
check that the local one you are testing is the code you are reading.
`git log -S '<the field>' -- <the file>` settles it in one command.

## Still open: a report this did not explain

The office reported after #92 that the date of birth *still* would not change.
It could not be reproduced from here — driven in a real browser against a local
backend on the same commit, every field on the card saves and the age moves.
Ruled out with evidence: the deployed backend missing the column (landed
2026-08-21, service deployed 2026-08-24), the service being asleep (`/health`
in 0.24s, keep-alive green), the role (`isStaff` covers Admin and
Receptionist), and the date format.

So #93 also made a failed save **look failed**: the form stays open and carries
what the server actually said with the status it said it with, instead of
closing and dropping a four-second toast in a corner. A save that fails
invisibly and a save that works are the same screen, and the difference was
being left for the office to diagnose.

**When a fault cannot be reproduced, the next best change is the one that makes
it report itself.**

### Reported a third time, and the last shape it can be (#94)

Same report again after #93, and still not reproducible — driven in a real
browser against a real backend, every field saves and the age moves.

So the console now checks its own work. The backend answers a `PATCH` with the
row it wrote, so the save compares that against what it asked for and names any
field that came back different — or is missing from the response entirely,
which is a server that has never heard of the column and a different problem
from one that ignored it.

That closes the last gap. A **refusal** is a 4xx and says why. A write that is
**accepted and does not take** is a 200 over an untouched row, a form that
closes, and a screen showing what it showed before — indistinguishable from
success, and the only shape left that matches the report once refusals, roles,
the date format and a sleeping backend are all ruled out. Nothing was looking
for it, because nothing had reason to think a 200 could lie.

**A write is not verified by its status code.** Where the response carries the
stored row, comparing it costs nothing and is the only check that catches this
class of fault.

## Prevention

A field that cannot be saved is a lie the screen tells every time it is opened,
and neither of these announced itself — no error, no console warning, just the
old value back on the next render. Both were found by driving the form, not by
reading it.

Worth asking of any edit form: **for each field on it, name the column.** If
there isn't one, it belongs in the read-only panel or nowhere.

Two more went that way in #94, from the *read-only* panel this time — the same
question applies to what a screen displays, not only to what it collects:

- **Credits expire** is not a fact about a child. It belongs to the credits
  that were bought and is counted from the payment that bought them, and a
  child can hold several with different dates — so one row on their profile is
  at best the latest and at worst a number the desk plans around. It is on the
  Credits tab, per entry.
- **The student's LINE ID** was never asked for at registration and had no
  column. `studentLineId`, `studentLineIdNo` and `parentLineIdNo` were `""` on
  every row and are gone from the type.

**Branch** went the other way: the console had displayed it since it was built
and never stored it, so backend `0024` gave it a column and registration now
asks. A displayed field with no column is the same lie as an editable one — it
just takes longer to notice.

Related: [[credits-follow-the-child]], [[deleting-and-linking-people]],
[[parents-section-student-email-and-password-reset]],
[[the-console-asked-for-things-it-could-not-keep]],
[[the-academy-screen-saved-none-of-its-choices]]

Tags: #bug #admin #ux #forms #data
