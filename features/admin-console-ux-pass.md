# Admin console UX pass: card views, a session calendar, and two shortcuts

**Shipped:** 2026-08-16 · **Repos:** `jtrax-admin` · **PRs:** #25, #29, #27, #28

Staff can now flip any list between a table and cards, read class history as a
month calendar with the weekend on its own, jump from a dashboard follow-up
count straight to those students, and go from registering a student to taking
their first payment without re-entering anything.

## Why

Four asks from the same session, all "the screen is right but the path through
it is wrong":

1. Every list was a table. A table is right for scanning one column down a page
   and wrong for recognising a person — the same reason Teams offers both.
2. Registering a student dropped you back on the student list. The next thing
   the desk always does is take the money, and that meant finding them again.
3. The dashboard's follow-up cards counted students needing attention, then
   linked to the *unfiltered* roster — throwing away the count that was the
   point of the card.
4. Class history was a reverse-chronological list. The academy teaches at the
   weekend, and the question the desk asks is "which weekends were busy".

## How it works

### Card / list switch — PR #25

- `lib/view-mode.ts` — the per-screen preference, in `localStorage`, read via
  `useSyncExternalStore`. An effect copying the stored value into state would
  paint the wrong view for a frame and trip the console's
  `react-hooks/set-state-in-effect` rule.
- `components/view-mode.tsx` — the segmented switch, `CardGrid`, `EntityCard`.
  One card component so nine screens can't drift into nine different cards.

Covered: Students, Parents, Payments, Class History, Admins, Academy (courses,
packages and teachers each remember separately), Tournaments, participants,
Games. Screens that were already cards keep cards as their default and gain a
table; the rest keep the table.

Class History's card is the one that earns its keep — the attendee chips are
open on the card, so adding or removing a student no longer needs a row
expanded first.

### Class history calendar — PR #29

`components/calendar.tsx`. Weeks start **Monday**, so the weekend is the last
two columns and can be shown alone. **Weekend days** is the default;
**Every day** shows the full grid. Picking a day opens that day's sessions
underneath as the same cards, with their attendees, so the calendar is not
read-only.

The header says how many sessions the month holds and, in weekend mode, how
many are hidden on weekdays — the imported roster has weekday sessions, and a
calendar that drops rows without saying so is a lie.

`mondayFirstIndex()` parses `YYYY-MM-DD` from its parts rather than
`new Date(iso)`, which reads a bare date as UTC and lands on the previous day
west of Greenwich.

### Follow-up deep link — PR #27

The three dashboard cards link to `/students?followUp=low|expiring|inactive`.
`StudentsPage` gains a **Follow-up** filter running the same `buildFollowUps`
bucketing the card counted, so card and list cannot disagree; each option shows
its own count, which makes that checkable on screen.

The param is threaded through the server component in
`app/(app)/[section]/page.tsx` — not `useSearchParams`, which would bail the
route out of server rendering — validated against the three known buckets, and
used as the component `key` so arriving from a different card resets the filter.

### Registration → payment — PR #28

The wizard's credentials dialog still comes first (passwords are shown once);
its button, its X and Escape all continue to `/payment?student=<id>`, which
opens Record Payment with the student chosen, their class shown, and their
class's credit package selected at its real price.

Two things had to be fixed for the prefill to have anything to prefill with,
both leftovers of the pass that put the console on real rows
([[staff-accounts-on-the-deployed-database]] covers how that data gets in):

- **The wizard's class picker was a hardcoded four** (`Group Class`,
  `Private Class`, …) that no longer match what the school teaches. Registering
  someone therefore matched no class and created **no enrolment at all**. It
  now lists the academy's real classes.
- **The payment form carried a hardcoded price list.** A package edited on the
  Academy page never reached the till. It now reads `credit_package`, and the
  recorded payment stores `credit_package_id` — so the payment list can show
  what was bought instead of a dash.

## Decisions made along the way

- **Monday-first weeks**, against the Sunday-first convention the date chip in
  the shell uses, so that Saturday and Sunday are adjacent and genuinely the
  same weekend. Sunday-first would have paired a Sunday with the Saturday six
  days after it.
- **Weekend-only is the default view**, not every-day: five empty weekday
  columns squeeze the two that matter into a quarter of the width.
- **The preference is per screen, not global.** The office wants courses as
  cards and credit packages as a table at the same time.

## Verified

Driven in Chrome (`channel: 'chrome'`, from `/tmp`) against a backend with
`JTRAX_ROSTER=1` imported, asserting against the API rather than the rendered
screen — 89 checks across four scripts, all passing, re-run against merged
`main`:

- every screen offers both switches, the card view *replaces* the table, the
  same rows are in both, and the choice survives a reload
- the calendar's month count matches the database (17 sessions), weekend mode
  draws exactly the 3 weekend days and says 14 are hidden, every-day mode draws
  all 13 session days, and picking the busiest day lists both its real sessions
  and all 5 students actually checked in
- each follow-up card's own count matches the filter it lands on and the rows
  shown
- registering a student writes them, lands on their id, prefills their name,
  class, package and price, and saving writes one payment at the package price
  carrying `credit_package_id` and tied to their enrolment

One check bug worth recording: asserting against the whole page let the class
name printed in the month grid stand in for the panel below it. Scope panel
assertions to the cards.

## Follow-ups

- [ ] `jtrax-backend` has no game-room endpoints — the Games screen 404s in
      either view. Admin, web and mobile all shipped their side (#24, web #22,
      mobile #5); the Go side has not.
- [x] ~~`buildFollowUps` puts an **Expired** student in the *low credit*
      bucket~~ — fixed in #34 by making the status the single source of truth
      and adding an **Expired Credits** card. See below.
- [ ] The Record Payment form still has a **Status** picker that is decorative —
      `status: "Paid"` is hardcoded on create.
- [ ] Messages remains the one fixture-backed screen; there is no `message`
      table. It carries a preview-only notice.

## Afterwards, 2026-08-16

Three things came back from testing this pass on the deployed console, each
fixed in its own PR:

- **The registration wizard looked like it hung**, then failed on a unique
  email. Not the backend — the console refetched every collection after every
  write. #30, written up in
  [[registering-a-student-looked-like-a-freeze]].
- **Two filters for the same thing.** The follow-up picker added here sat beside
  the existing status picker. #34 removed it and made the *status* the single
  source of truth: `studentStatus` now reads the saved thresholds (it had
  hard-coded 3 / 7 / 30 while the dashboard read the saved ones, so editing a
  threshold moved the counts and left the chips alone), and `buildFollowUps`
  simply groups by it. A fourth card, **Expired Credits**, keeps expired
  students on the dashboard.
- **Payments needed a date range.** #32 — from/to like class history, with the
  header total and the CSV export following the filter.

And the delete flow that never worked at all:
[[deleting-and-linking-people]].

Related: [[backend-crud-and-live-portals]],
[[staff-accounts-on-the-deployed-database]], [[stacked-prs-never-reached-main]],
[[0004-sqlite-and-generic-crud-backend]]

Tags: #feature #admin #ux
