# Check in and check out, and a room that empties at once

**Shipped:** 2026-09-01 · **Repos:** `jtrax-admin` · **PR:** #90

The desk checks a child **out**. And when a class ends it checks the whole room
out in one press, instead of one child at a time.

## Why

Two separate complaints, one screen.

**The word.** The button said *Dismiss*, and its status said *Dismissed*. Nobody
at the front desk says that. They say a child has been checked out — which is
also the pair of *Check In*, the button sitting immediately beside it. A verb
and its opposite should be recognisably the same pair; "Check In" and "Dismiss"
were not, so the second button read as a different kind of act altogether.

**The one-at-a-time.** Four o'clock is not a child at a time. A class ends and
everyone leaves together, and the desk was pressing the same button eight or
twenty times. Each press is a write, and a write refetches every collection
([[the-front-desk-remembered-nothing]] is why it writes at all) — so twenty
children was twenty full reloads of the console.

## How it works

`components/dashboard/CheckinTable.tsx` grew a tick-box column and a select-all
in the table's first heading. `components/page-kit.tsx` had to widen `Table`'s
`columns` from `string[]` to `ReactNode[]` for that: a header that can only
hold text would have pushed the control somewhere the desk does not look.

Three things worth keeping:

- **Only children still in class get a box.** A row for someone already gone is
  the record of a finished afternoon, not a pending act, so there is nothing to
  tick and nothing for "all" to sweep up.
- **Select-all reaches the rows the collapsed table is hiding — and then opens
  the table.** "All" that meant "the five you can see" would be a lie at
  closing time. But selecting people you cannot see and sending them home
  quietly is worse, so pressing it expands the list.
- **The writes go through `batch`.** Twenty children cost one refetch, not
  twenty. `components/dashboard/CheckinSelection.test.tsx` counts the
  provider's own GETs to hold that — the assertion is against a round measured
  from the first render rather than a hard-coded collection count.

The per-row button is untouched in behaviour, because the other real case is
one parent arriving early for one child.

## Decisions made along the way

- **"Checked out", not "Checked Out", for the status.** It sits beside "In
  class" in the same chip, and the two should look like one vocabulary. The
  *button* stays title case — it pairs with "Check In".
- **The bar appears only once something is ticked.** An always-present bar with
  a disabled button is permanent furniture for an act taken once a day, and it
  pushed the first names below the fold.
- **Indeterminate on the header box.** Some-but-not-all is a real third state;
  without it the box reads "none selected" while a dozen are.
- **Internal names left alone.** `check_out_time` was always the column, and
  `status: "Dismissed"` is still the value `lib/live.ts` computes — only what
  the screen says changed. The word was never wrong in the database.

Related: [[the-front-desk-remembered-nothing]],
[[a-dismissal-that-looked-frozen]], [[a-second-click-was-a-second-record]],
[[a-class-is-what-a-session-was]], [[0002-attendance-checkin-mechanism]]

Tags: #feature #admin #ux #attendance
