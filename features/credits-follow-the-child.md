# Credits follow the child into the class they moved to

**Shipped:** 2026-08-23 · **Repos:** `jtrax-admin` · **PRs:** #74, #80 (amount + expiry), #81→#82 (half-credit grid — #81 merged into its stack base by mistake and was re-landed as #82, see [[stacked-prs-never-reached-main]])

A child who leaves Beginner with eight credits and joins Intermediate no longer
loses them. The office moves the balance from one enrolment to the other, and
the console shows the whole sum — from, worth, to — before anyone commits.

## Why

Credits hang off an **enrolment**, not a student: `credit_transaction` points at
`enrollment_id`, which is what makes a balance answerable per class. Once
[[0007-retire-a-row-instead-of-deleting-it]] let a child leave a class, that
became a trap — withdrawing kept the balance where it was, joining a new class
started at nothing, and the money was on the books in a place the child could
not spend it.

The office's workaround would have been a manual adjustment on each side, with
the conversion done in somebody's head at the desk.

## The rule: the money moves, the hours change

A credit is an hour, and every class charges the hour differently. So moving a
balance is not moving a number.

> Eight credits left in Beginner, where twenty cost 12,000, are **4,800 baht of
> teaching** — which in Intermediate, where twenty cost 20,000, buys **4.8
> hours**.

The money is what the two sides have in common, so the money is what is
preserved. `lib/credit-transfer.ts`:

- `ratePerCredit` — money per credit, from a class's own credit package, or
  `null` when the package cannot say.
- `planTransfer` — works out what moving would produce **without moving it**.
- `roundCredits` — a hundredth of a credit, which is thirty-six seconds of
  class: below anything the academy can teach or bill for, and rounding at the
  point of writing keeps the figure on screen equal to the figure in the ledger.

## How it works

Both rates come from the two classes' own credit packages, never from a figure
held in the code. Every class is created with one (#69, see
[[0007-retire-a-row-instead-of-deleting-it]]), so a private class or a level
invented next term converts correctly the day it exists and nothing has to be
taught the name of a class.

Where the payment records **which package was bought**, that one is used — a
family who paid last term's price keeps last term's hours.

It writes **two ledger entries rather than editing a number**
(`components/pages/StudentsPage.tsx:931`, `:938`): `-balance` on the old
enrolment and `+plan.credits` on the new one, both `manual_adjustment`. The
credits can be followed out of one class and into the other, which a mutated
balance would not allow.

## Decisions made along the way

- **An explicit action, not an automatic one.** It would be easy to convert on
  withdrawal. A balance that changes on its own is the one thing a family will
  argue about, so the sum is shown in full and somebody presses the button.
- **A class with no priced package refuses rather than guesses**
  (`problem: "rateUnknown"`). A guess either hands out free hours or takes paid
  ones away. Same for a free class — price zero has no rate.
- **Nothing to move is its own answer**, not an error: `nothingToMove` when the
  old balance is zero or negative.
- **Fractions are kept.** Rounding to whole credits would quietly give away or
  take back up to an hour of teaching on every move.
  **Revised in #81 (2026-08-24):** kept, but on the half-credit grid. A session
  costs 0.5 or 1 — the academy has no smaller unit of teaching — so a computed
  4.8 was a balance whose tail nothing could ever spend. `roundToHalfCredit`
  rounds the **result** (never the rates) to the **nearest** half: 13.2 → 13,
  13.3 → 13.5, 4.8 → 5. Rounding up was tried first and rejected by the
  academy — it hands out up to half an hour free on every move; nearest caps
  what either side gives at a quarter credit. A figure the office types by
  hand is still written as typed.

## Revisited: the amount and the expiry, 2026-08-24 (#80)

Using the flow surfaced two gaps.

**The conversion was the only possible answer.** One click wrote the computed
figure; there was no way to land on a round number or a negotiated one. The
dialog now has a **Credits to add** field: prefilled with the conversion, and
what is in the field is what gets written. A hand-typed figure shows a note with
what the conversion works out to. This also softens the `rateUnknown` refusal —
the automatic path still never guesses, but the office can type the figure
itself, which is a decision rather than a guess.

**The moved balance stopped expiring.** The incoming entry carried no
`expiry_date`, so the student's chip and the parent portal's "valid until" both
went blank after a move. An **Expires** field, prefilled with the old balance's
own latest expiry, rides on the incoming entry only.

Both mutation-checked in `StudentEnrolments.test.tsx`, and driven in a browser:
19 credits typed down to 10.5 with a 2027 expiry landed as `-19` / `+10.5` with
the date on the ledger.

## Follow-ups

- [ ] The two entries are `manual_adjustment`, the same type a desk top-up
      writes. A `transfer` type would let a report tell "the office moved this"
      from "the office added this" — needs a backend enum change.
- [ ] Nothing converts a balance at the till: a family paying for Intermediate
      while holding Beginner credits still gets two separate balances until
      somebody moves one.

Related: [[0007-retire-a-row-instead-of-deleting-it]],
[[an-hour-of-class-costs-an-hour-of-credit]], [[payments-outlive-students]],
[[the-front-desk-remembered-nothing]]

Tags: #feature #admin #data
