# Every entry is accepted, and the results come apart by section

**Shipped:** 2026-09-17 · **Repos:** `jtrax-backend`, `jtrax-admin` · **PRs:**
backend #57, admin #128

Signing up for a tournament now puts you in it. The organiser sets the sections
and the student discount while creating the event, and reads the standings one
section at a time.

## Why

The academy takes everyone who applies. So the approve/reject queue was a step
that only ever ended one way, and an unworked one is worse than no queue at
all: a place nobody has confirmed looks exactly like a place nobody has looked
at. Three of the four things the academy asked for on 2026-09-17; the fourth
([[#What is not here]]) needs a form we could not read.

## How it works

**Nothing waits.** `internal/api/publicregistration.go` inserts `Approved`, and
the two endpoints in `registrationqueue.go` are deleted rather than left
unused — a console on the previous build must not be able to put a row back
into a state nothing can resolve. Migration `0032` carries the rows that were
already waiting.

**Sections and the discount are set at creation.** `CreateWizard` in
`components/pages/TournamentPage.tsx` grew a categories editor and a
`student_discount_pct` field; the overview keeps the category list, read-only.

**The results tab splits by section.** `groupStandingsByCategory` in
`lib/tournament-results.ts`, tabbed in `components/tournament/ResultsTab.tsx`.

## The safeguard that went, said out loud

`publicregistration.go` opened with a list of four things holding the widest
door in the product open, and approval was one of them. The list now has three
and a paragraph naming what the fourth cost, because a security note that
quietly loses a bullet is worse than one that never had it.

What stands in its place was already there and had not been noticed: validation
moved *to the door* on 2026-09-10 ([[the-product-to-do-pass]]). The category
must belong to this event, the age rule in the category's name is enforced
against the date of birth, and a claimed student discount must name a student
that exists. The desk's remaining power is to correct a fee or withdraw an
entry, not to admit one — both through the ordinary table.

**A related thing that had already gone stale.** The queue card existed to
surface "claimed JCA student, no match" for the desk to judge. Verified student
IDs made that unreachable from the public form three weeks ago; the card had
not caught up. Removing approval did not obsolete it — it was already
obsolete, and removing approval is what made anyone look.

## Two quiet failures, and one still live

**The charge that never happened.** Approving was where `fee_quoted` became
`fee_charged`. Remove the approval and every public entry reads as owing
nothing on the desk's own roster — a number that is wrong rather than missing,
on the screen the academy bills from. `fee_charged` moved into the insert, and
the migration back-fills with `COALESCE` so a fee somebody typed by hand
survives.

**The card that would have looked fine.** `RegistrationQueue` filtered to
`Pending`. Nothing is `Pending` now, so left alone it would have been
permanently *empty* rather than obviously broken — the failure mode where
there is nothing to see and no reason to look.

**The join in the results tab is the live one.** chess-results.com does not
know what JTrax calls its categories, so a standing's section comes from the
entrant it belongs to — by `studentId` where the backend recognised one, by
name otherwise. A matcher slightly too strict does not throw: it drops
everybody into "Not in a section" and the tabs look real while being empty.
chess-results prints `Somchai, Jaidee` where the console holds `Somchai
Jaidee`, and on the comma alone the match rate was zero. Fifteen tests, because
this is the kind of thing that degrades rather than breaks.

## Decisions made along the way

- **Rows matching no entrant are kept**, in a section of their own, which
  appears only when it has something in it. An open event is mostly people the
  academy has never met; dropping them would turn "the results" into "the
  results for our pupils" without saying so. The leftover is not a section of
  the tournament, so an always-present empty one would read as a section
  nobody entered.
- **Empty categories are kept.** A tab that appears once somebody in it scores
  is a tab that comes and goes while the arbiter uploads rounds.
- **The standings card is mounted on the event having standings**, not on the
  selected tab having rows. Gating on the tab takes the tab strip away with the
  table, and there is no way back to the section that did have results. The
  top-ten slice is per section, so a section whose best player came eleventh is
  not blank.
- **The discount is clamped in the console, not just the database.** The
  control is `<input type="number">`, which accepts `-5` and `300` happily, and
  the backend refuses anything outside 0–100 — so unclamped it does not save a
  wrong discount, it loses the whole tournament at the last step of the wizard.
- **`needsApproval` stays in the reply, and is `false`.** Dropping the key
  leaves it `undefined` for a portal on the old build: falsey by accident
  rather than on purpose.
- **`Rejected` and `Withdrawn` rows are left alone** by the migration. They
  record decisions that were really made, and `Withdrawn` is how the desk takes
  somebody out of a tournament now.
- **Categories stay visible on the overview**, read-only. Moving where a thing
  is set is not the same as hiding what it is.

## What is not here

The fourth ask — a registration ID card, terms and conditions, and age
verification, with OCR filling in name and age — is **not started**. The
academy's Google Form is behind a Google login and returns 401, so the fields
were not readable. Two decisions were taken in advance and are worth keeping:

- **The ID card image is extracted and discarded**, never written to the
  database. It is a child's identity document; the values are what we want, and
  a store of children's ID cards is a thing to leak and a thing to have to
  delete later.
- The OCR provider exists and works, but is prompted for **registration
  forms** — `internal/ocr/` — so an ID card needs a second prompt and result
  shape, the same gap the tournament regulation has
  ([[the-product-to-do-pass]]).

## Follow-ups

- [ ] Sections cannot be edited after creation. A typo, or a section added once
  entries are in, has nowhere to be fixed. The editor moved wholesale when it
  could have been added in both places.
- [ ] Nothing still emails a registrant. Under approval that was a missing
  confirmation; now it is the *only* message they would ever get, and the
  gap is wider rather than narrower →
  [[public-tournament-registration]].
- [ ] Six tests in `practice_test.go` / `puzzles_test.go` fail on a clean
  `main`. Unrelated to this work and untouched by it, but they are red.

Related: [[public-tournament-registration]], [[the-product-to-do-pass]],
[[tournaments-linked-to-chess-results]], [[0007-retire-a-row-instead-of-deleting-it]]

Tags: #feature #tournaments #admin #security
