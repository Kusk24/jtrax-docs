# Create Session would not press

**Found:** 2026-08-21 · **Fixed:** 2026-08-22 · **Repos:** `jtrax-admin`
**PRs:** #65 #66 #67 #70 #71

## Symptom

Reported twice, in the same words: *"create session is not working."* The
dashboard's Create Session panel opened, a class was showing in the dropdown,
both time fields had digits in them, and the button stayed grey. Pressing it did
nothing — no error, no row, no toast.

A screenshot from the second report showed both time fields filled and the
footer insisting *"Set a start and end time"*.

## Cause

Two independent faults, either of which alone produces a dead button. The first
three PRs are a record of finding that out.

**1 — the class was frozen at mount.** `useState(classes[0]?.name)` reads the
list once, and the panel opens before the collections land on a cold backend or
a hard reload. The state stayed `""` for good, while the `<select>`, having no
option matching `""`, displayed its first one anyway. The class *looked* chosen,
both times could be filled, and the guard never passed. Worse, `createSession`
matched the panel's class name against a list it had also read at mount, so on
the paths where it did fire it bailed in silence.

**2 — `<input type="time">` reports `value === ""` until every segment is
filled**, and how many segments there are is the browser's business: a 12-hour
locale wants AM/PM as well. A field reading `03:30` on screen can genuinely be
empty to the code. The old footer could not tell that apart from a field nobody
had touched, so it told the desk to fill in two fields that were already full.

The API was never the problem — posting the panel's own payload returned 201,
which is how this was narrowed down.

## Fix

Diagnosis first, then a rebuild.

- **#65** — the footer names the missing pieces instead of showing a selected
  count that was not the reason, and `createSession` reports its failure instead
  of returning quietly.
- **#66** — the class is worked out at render, so what the dropdown shows and
  what the panel writes are the same thing. Changing the class stopped wiping
  the times: a class has no fixed hours — that is the whole reason sessions are
  written one at a time — so which class it is says nothing about when it runs,
  and clearing them only made the desk type them twice.
- **#67** — the footer learned to distinguish four cases, reading
  `validity.badInput` for the half-entered one, since that is the browser's own
  admission that it is holding digits it will not hand over.
- **#70** — the panel rebuilt on `lib/session-draft.ts`. **The times are selects,
  and a pair of selects cannot be half chosen.** Both ends are picked freely in
  five-minute steps; `draftProblem` returns the *first* problem in the order a
  person reads the form (`session-draft.ts:120`), which keeps the footer to one
  honest sentence.
- **#71** — one list of every five-minute mark in the day is 288 options:
  correct, and unusable. An hour and a minute chosen separately is 24 options and
  12, and between them they still reach every mark the timetable uses. Choosing
  an hour alone means the whole hour (`joinClock`, `session-draft.ts:65`), so 4pm
  is 16:00 without also saying "and no minutes".

Two data faults came out with it. The student list is now **the class's own
roster** — the picker had offered every student in the academy, so a child could
be added to a session of a class they had never been enrolled in, which is an
attendance with no enrolment behind it that nothing can charge. And the panel
**reads its session back out of today's live list by id on every render**: it had
been handed a snapshot at open, so adding a student appeared to do nothing and
the desk pressed again.

## Decisions made along the way

- **A minimum session of 30 minutes** (`MIN_SESSION_MINUTES`). Below that a
  mistyped end is far likelier than a twenty-minute lesson.
- **What it will cost is on screen before the desk commits** — one credit an
  hour, so 90 minutes reads 1.5, beside each child's balance. The server works
  the same sum out again from the session it stores; the panel's copy is for the
  person, not for the ledger.
- **A balance that will not cover the session is marked, not blocked.** Backend
  #36 was opened to refuse the attendance outright and was **closed unmerged on
  2026-08-22**: the academy lets a child attend on credit and settle afterwards,
  so turning them away at the door is the wrong rule. The red figure beside the
  name says who to chase. This reaffirms the negative-balance decision in
  [[an-hour-of-class-costs-an-hour-of-credit]].
- **Ticks do not survive a change of class**, because they were made against a
  roster that no longer applies.

## Prevention

**Do not use `<input type="time">` for a field a button depends on.** Its empty
value is not a statement about what the user can see. Where a control gates an
action, prefer one whose value cannot be partial.

Every fix is mutation-checked: restore the bug and exactly one test fails.
`lib/session-draft.test.ts` covers the times, the floor and the price without a
browser; `components/dashboard/SessionPanel.test.tsx` covers the panel.

The stale-roster test had to be sharpened before it was worth anything — it first
asserted the new arrival's name appeared once, which passed with the bug still
in, because a student missing from the stale roster was listed under "add"
instead. It now looks for the remove button that only a roster row carries.
**An assertion that a name is on screen is not an assertion about which list it
is in.**

Related: [[the-front-desk-remembered-nothing]],
[[an-hour-of-class-costs-an-hour-of-credit]],
[[0007-retire-a-row-instead-of-deleting-it]], [[ui-audit-2026-08-21]]

Tags: #bug #admin #ux
