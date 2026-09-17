# Every entry is accepted, and each age group is its own event

**Shipped:** 2026-09-17 · **Repos:** `jtrax-backend`, `jtrax-admin`,
`jtrax-web-app` · **PRs:** backend #57, admin #128, web-app #67

Signing up for a tournament now puts you in it. The organiser sets the age
groups and the student discount while creating the event and reads each group's
results from the arbiter's own link for that group, and the entry form asks for
the terms, a nickname and an age — filling the name and age in from a photo of
the player's ID card.

## Why

The academy takes everyone who applies. So the approve/reject queue was a step
that only ever ended one way, and an unworked one is worse than no queue at
all: a place nobody has confirmed looks exactly like a place nobody has looked
at. Four things the academy asked for on 2026-09-17.

## How it works

**Nothing waits.** `internal/api/publicregistration.go` inserts `Approved`, and
the two endpoints in `registrationqueue.go` are deleted rather than left
unused — a console on the previous build must not be able to put a row back
into a state nothing can resolve. Migration `0032` carries the rows that were
already waiting.

**Sections and the discount are set at creation.** `CreateWizard` in
`components/pages/TournamentPage.tsx` grew a categories editor and a
`student_discount_pct` field; the overview keeps the category list, read-only.

**Each age group reads its own chess-results event.** Migration `0033` puts
`chess_results_id` on `tournament_category` too; the group strip in
`components/tournament/ResultsTab.tsx` loads that group's link.

**The entry form reads an ID card.** `internal/ocr/idcard.go` (a second prompt
and a smaller result shape), `POST /api/v1/public/tournaments/{id}/scan-id`, and
migration `0034` for the nickname, the age and the terms timestamp.

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

**The wrong model, shipped and then corrected.** The first version of the
results tab split one ranked list into groups by matching players against our
entrants by name — normalising for the fact that chess-results prints `Somchai,
Jaidee` where the console holds `Somchai Jaidee`, which on the comma alone
matched nobody. It had fifteen tests and it was solving a problem that does not
exist: the arbiter publishes each age group as its own chess-results
tournament, with its own link, so the groups arrive separated. Asked which
category a player is in, we were guessing at something we had been told
outright.

`0015` is where the assumption came from — one `chess_results_id`, on the
tournament — and it was reasonable for the event it was written for. It is
wrong for a chessfest, where five groups run in one hall on one day. Under it
the console could follow exactly one of them, so "the results" meant whichever
group somebody pasted first and the other four had nowhere to go.

The helper and its tests were deleted rather than kept as a fallback. A second
answer nobody reaches is a second answer waiting to disagree with the first.

## Decisions made along the way

- **The tournament's own link stays**, and a group link overrides it. Some
  events really are one ranked list — a club night, a single-section rapid — so
  "Whole event" is the first tab and nothing had to be migrated.
- **The group strip sits above the link card**, not inside the standings table.
  The card is about whichever group is selected, and a card that changes meaning
  under a control further down reads as the control having done nothing.
- **The card is keyed on the group.** It holds a half-typed URL in its own
  state, and carrying that across would offer one group's pasted link on
  another.
- **"Loaded" is derived from the scope the data was fetched for**, not a
  boolean toggled in the effect. A separate flag has to be set false on the way
  in, which is a frame where the previous group's link is still on screen as
  though it were this group's.
- **The ID card is read and discarded.** No column, no file: it is a child's
  identity document, the two values are what we wanted, and a store of them is
  a thing to leak and a thing somebody would later have to be asked to delete.
- **The scan fills only empty fields.** Somebody who typed their name and then
  attached a card has said it twice, and the typed one is what they meant.
- **The age is derived from the card's date, not read off it.** A card prints a
  date and never an age.
- **Buddhist-era years are converted in the sanitiser**, not trusted to the
  prompt. A model answering `2540-05-02` would otherwise produce a child aged
  minus five hundred, refused by every age check for a reason nobody could act
  on.
- **The terms tick is refused, not defaulted.** An entry recorded as having
  accepted terms nobody ticked is not a weak record, it is a false one. And the
  timestamp is the server's: a client-supplied time on a consent record is
  worth nothing.
- **Age verification prefers the date of birth.** That is what a card proves;
  an age is what somebody typed. The claimed age is used only when there is no
  date of birth at all — the entrant who skipped the scan — which is better
  than refusing an entry we could have checked.
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

## The first unauthenticated endpoint that costs money

Everything else a stranger can reach is a database read or a row insert. The
card scan calls a paid vision API, which makes an idle abuser's bill the
academy's bill. Four things bound it, and they are why it is its own file rather
than a role check inside the staff-side scanner:

- it answers only for a tournament **open to public registration** — a closed
  event 404s, as the entry endpoint does, so the surface exists only while
  entries are being taken;
- **5/min**, against the entry form's 10: a scan is seconds of provider time
  where an insert is microseconds of ours;
- the upload is **capped before it is read**, and the mime type is sniffed
  rather than believed;
- the reply is a **suggestion** — nothing is written, so turning the provider
  off or having it fail costs nobody their entry.

Tests assert the provider is not called at all for a closed event or a
mis-picked file, because "it is rate-limited" is not the same as "it is free to
refuse".

## Follow-ups

- [ ] Age groups cannot be edited after creation. A typo, or a group added once
  entries are in, has nowhere to be fixed. The editor moved wholesale when it
  could have been added in both places.
- [ ] The academy's form also collects a **payment slip** — bank transfer,
  early bird 1,000 THB to 28 Sep, late 1,200 THB after. JTrax still only
  *quotes* a tournament fee and has nowhere to put proof of payment, even
  though Stripe Checkout shipped for class credits on 2026-09-09. The "no
  online payment" decision in [[public-tournament-registration]] predates that
  rail by three weeks and has never been revisited.
- [ ] Nothing still emails a registrant. Under approval that was a missing
  confirmation; now it is the *only* message they would ever get, and the
  gap is wider rather than narrower →
  [[public-tournament-registration]].
- [ ] Six tests in `practice_test.go` / `puzzles_test.go` failed on a clean
  `main` while this was being written and passed again the next day. They are
  date-dependent, which means they are flaky rather than fixed.

Related: [[public-tournament-registration]], [[the-product-to-do-pass]],
[[tournaments-linked-to-chess-results]], [[0007-retire-a-row-instead-of-deleting-it]]

Tags: #feature #tournaments #admin #security #ocr
