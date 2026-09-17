# A parent pays a tournament fee

**Shipped:** 2026-09-15 · **Repos:** `jtrax-backend`, `jtrax-web-app`, `jtrax-mobile-app`, `jtrax-admin` · **PR:** —

A family can now sign a child up for a tournament and actually pay the entry
fee by card, from the portal or the phone. Before this the payment step was
scenery: it asked which method they preferred, threw the answer away, charged
nothing, and showed "Registration Confirmed. A confirmation has been sent to
your email" — for a confirmation nothing sends.

## Why

The registration screen has had a three-radio payment step and a "Pay Now"
button since the portal shipped, and all of it was mock. Three separate things
a parent was told were untrue: that they had paid, that they would get an
email, and — on the console side — every participant read "Paid" whatever had
been collected. The medical-notes and remarks boxes were uncontrolled inputs
with no column behind them, so a parent typing an allergy into the form was
telling their own browser.

Stripe was already live for the desk ([[card-payments-through-stripe-checkout]]);
this opens the same machinery to the person who owes the money.

## How it works

- Migration `0033` gives `tournament_registration` its `medical_notes` and
  `remarks` columns; `0032` adds `payment.tournament_registration_id` with a
  unique partial index — the guard against a family being charged twice for one
  place.
- `POST /api/v1/tournament-registrations/{id}/stripe-link`
  (`jtrax-backend/internal/api/tournamentpay.go`) is **Parent-only**. The
  `student_parent` join is part of the lookup, not a check after it, so another
  family's registration reads as 404 rather than 403 — that it exists is not
  the caller's business. It opens a Pending `payment` for the fee on first ask
  and hands off to `checkoutLink`, the staff endpoint's body factored out of
  `stripe.go`. Rate-limited to 20/min: authenticated, but it spends a Stripe API
  call per request.
- The place is created **before** the money, always. A declined card, a closed
  tab or a family who decide to pay at the desk must not cost the child their
  entry, so the fee is a second call and its failure leaves the registration
  standing.
- The webhook needs no special case: a tournament payment has no package and no
  enrolment, so `grantPurchasedCredits` correctly grants nothing.
- PromptPay and bank transfer are taken at the counter. Choosing either now
  registers the child and says exactly that ("Place Held") instead of claiming
  money moved. The same screen is what a parent sees when the academy has no
  Stripe key configured — the 503 is a supported state, not an error.
- The event screen grew a "Your Entries" card listing the family's places with
  the fee's real state, and a "Pay by card" button for an outstanding one. This
  is the way back after a declined card: re-entering the flow used to hit the
  `idx_registration_one_per_student` unique index and simply fail.
- `jtrax-admin` participant drawers show the real payment status and the two
  note blocks, labelled — an allergy is for whoever is in the room on the day,
  a remark is for the office (`components/pages/TournamentPage.tsx`).

## Decisions made along the way

- A tournament fee is an ordinary `payment` row, not a new table. It reconciles
  on the payments screen beside everything else, and the webhook, the receipts
  and [[payments-outlive-students]] all keep working unchanged.
- A fee handed over at the front desk is not linked to the registration, so it
  still reads as unpaid in the portal. The portal says so carefully rather than
  guessing: "Already paid at the front desk? Then there is nothing to do here."
- On the phone the card form opens in the system browser sheet, not a WebView.
  A WebView shows no origin, so a parent has nothing to check before typing a
  card number into it.
- Closing that browser says nothing about whether the charge went through — the
  webhook is the only thing that knows — so the phone shows "Place Held" and
  the fee reads as paid the next time the portal loads.

## Follow-ups

- [ ] A tournament's "Total Revenue" still sums `fee_charged` across
      participants, so it counts fees that have not been collected. Now that
      payment status is real, it could count what actually arrived.
- [ ] Nothing emails a registration confirmation. The copy no longer claims one
      does; sending one belongs with [[notifications]].
- [ ] A parent-created registration lands `Approved` (the table default) while a
      public one lands `Pending` for staff review. Worth deciding deliberately.

Related: [[card-payments-through-stripe-checkout]], [[public-tournament-registration]],
[[payments-outlive-students]]

Tags: #feature #payments #tournaments
