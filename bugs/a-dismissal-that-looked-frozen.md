# A dismissal that looked frozen, and a history that never said when

**Found:** 2026-08-22 · **Fixed:** 2026-08-23 · **Repos:** `jtrax-admin` · **PR:** #75

> **Naming note, 2026-09-01.** The button called *Dismiss* below is now *Check
> Out* — see [[check-in-and-check-out]] (#90). The prose here is left as it was
> written because it is the record of what the desk saw in August. The
> `ActionButton` fix it describes is unchanged and now covers the bulk
> check-out too.

## Symptom

Two things about attendance the desk could not see.

**Dismissing a child looked frozen.** The Dismiss button was pressed, nothing on
screen changed for several seconds, so the desk reloaded the page — and found the
dismissal had gone through the whole time.

**Class History showed names and nothing else.** When each child arrived and when
they left is the question that screen exists to answer, and it listed the roster
with no times at all.

## Cause

**Nothing was wrong with the write.** A write in this console refetches every
collection, which against the deployed backend is seconds, and Dismiss was a
plain button with no pending state — it sat there looking unpressed for all of
them. There was no feedback to distinguish "working" from "ignored you", and the
error path was worse: a refusal was swallowed, so it read as the same freeze.

**The times were on the rows all along.** `attendance` carries `check_in_time`
and `check_out_time` — the dashboard's check-in table has rendered both since it
went live — and Class History's session detail simply never read them.

## The wrong suspect, and how it was found

Worth recording, because the investigation was more interesting than the fix.

The refresh chain was the obvious culprit, so a test was written against the real
`DataProvider`, and it appeared to prove the desk's search results were stale.
That was the test's fault: the fake API was handing React **the same array object
on every fetch**, which no HTTP response does, so memoised consumers correctly
saw nothing had changed and skipped re-rendering.

With the mock corrected to return fresh objects (`DataProvider.test.tsx:52`)
both refresh paths were fine, and the real cause turned out to be that nothing on
screen changes for several seconds. The mock also takes 40ms now
(`DataProvider.test.tsx:57`), which is the condition the bug was reported under —
an instant fake API cannot reproduce a bug that is entirely about latency.

## Fix

- Dismiss goes through `ActionButton` (`components/dashboard/CheckinTable.tsx:138`),
  like every other write in the console: disabled while in flight, label saying
  so, and the error reported rather than swallowed.
- The session detail in Class History lists both times
  (`components/pages/ClassHistoryPage.tsx:523`, `:527`), through the shared
  `clockOf` from `lib/live.ts:426` rather than a second copy — two copies of that
  formatter drifted apart once already.
- A child who has not been dismissed reads **"still in class"**
  (`ClassHistoryPage.tsx:450`), not a blank. A blank there reads as missing data
  rather than a class still running.

## Prevention

**A fake API that returns the same object twice is not a fake API.** Real
responses are always new objects, so a mock that reuses one makes memoised
consumers look broken and hides the bugs that latency causes. A mock should also
be *slow enough to be wrong* — the pending-state class of bug is invisible against
an instant one.

**Every write in this console refetches everything**, so every button that
triggers one needs a pending state. `ActionButton` is the house component for
that; a plain `<button>` on a write is the smell.

Related: [[the-front-desk-remembered-nothing]],
[[an-hour-of-class-costs-an-hour-of-credit]],
[[create-session-would-not-press]], [[ui-audit-2026-08-21]],
[[backend-crud-and-live-portals]]

Tags: #bug #admin #ux
