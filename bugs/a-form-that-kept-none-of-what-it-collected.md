# A form that kept none of what it collected

**Found:** 2026-09-01 · **Fixed:** 2026-09-01 · **Repos:** `jtrax-admin` · **PRs:** #91, #92

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

### Fix

The guardian block writes, and only what changed — most edits touch one field
and each is a request. A cleared contact line is **deleted rather than
blanked**: `parent_contact.value` is required, so an empty one is a row the
backend refuses, and a blank phone number reads at the desk as "we have one".
Batched with the child's own save, so correcting a family costs one refetch
rather than six.

The four phantom fields are gone from the editor. The ones that are real facts
stay in the read-only panel, and the card now says where a course is changed:
the Enrolments tab, which moves the credits across with them
([[credits-follow-the-child]]).

## A wrong turn worth recording

The first hypothesis was that the backend was rejecting the edit — a local
`PATCH` returned `400 unknown field "current_school"`, which would have failed
the *whole* save including the date. It was a stale `go run` process: the
registry has had that column since backend #32. The deployed service was never
affected.

**The lesson is cheap and kept costing:** before blaming a deployed service,
check that the local one you are testing is the code you are reading.
`git log -S '<the field>' -- <the file>` settles it in one command.

## Prevention

A field that cannot be saved is a lie the screen tells every time it is opened,
and neither of these announced itself — no error, no console warning, just the
old value back on the next render. Both were found by driving the form, not by
reading it.

Worth asking of any edit form: **for each field on it, name the column.** If
there isn't one, it belongs in the read-only panel or nowhere.

Related: [[credits-follow-the-child]], [[deleting-and-linking-people]],
[[parents-section-student-email-and-password-reset]],
[[the-console-asked-for-things-it-could-not-keep]],
[[the-academy-screen-saved-none-of-its-choices]]

Tags: #bug #admin #ux #forms #data
