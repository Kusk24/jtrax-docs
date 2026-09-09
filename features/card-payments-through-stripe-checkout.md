# Card payments through Stripe Checkout

**Shipped:** 2026-09-09 · **Repos:** `jtrax-backend`, `jtrax-admin` · **PRs:** backend #47, admin #111

The desk records a payment as Pending, presses "Get card payment link" on its
detail, and sends the parent a Stripe-hosted page. When the money clears,
the webhook marks the payment Paid and releases its credits — the same state
the desk produces by hand, through the same rules ([[an-hour-of-class-costs-an-hour-of-credit]]).

## Why

Parents asked-for-cards was anticipated rather than observed: cash and
PromptPay stay the default and cost 0%. Stripe was chosen over GB Prime
Pay/Xendit at the user's direction (2026-09-09); Thailand pricing at the time:
domestic cards 3.65% + ฿10, no upfront or monthly fee.

## How it works

- `POST /api/v1/payments/{id}/stripe-link` (staff only) creates a Checkout
  Session for a Pending payment and stores it on the row (migration `0028`);
  asking again returns the stored link, so a closed tab cannot mint a second
  chargeable session. Refuses settled payments (409) and amounts under
  Stripe's ฿10 floor (422).
- `POST /api/v1/stripe/webhook` verifies Stripe's signature (HMAC-SHA256 over
  `t.payload`, constant-time compare, 5-minute replay window, secret-roll
  tolerated), checks the event's amount against the payment row, then settles
  idempotently: credits are granted by whichever delivery wins
  `UPDATE … WHERE status='Pending'`; redeliveries answer 200 and change
  nothing. `jtrax-backend/internal/stripepay` is hand-rolled HTTP, no SDK —
  same pattern as [[scanning-a-paper-registration-form]]'s Gemini provider.
- `GET /pay/done` / `/pay/cancelled`: plain bilingual pages Checkout returns
  the parent to. Payment state is what the webhook said, never which URL a
  browser loaded.
- Console: the section lives on `PaymentDetail`
  (`jtrax-admin/components/pages/PaymentPage.tsx`); a session is only created
  by a button press, never by opening the detail.

## Security posture

No card data ever touches JTrax (hosted Checkout → PCI SAQ-A). Keys from env
only: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, optional
`STRIPE_RETURN_URL` / `STRIPE_BASE_URL` (dev stub). Unset keys = feature off,
webhook route unregistered (404, not unverifiable-accept). Webhook route is
rate-limited, body-capped at 512 KB; Stripe error bodies go to the log, never
to a client. A signed event whose amount does not match the payment row is
refused and logged — ฿10 cannot settle a ฿12,000 debt.

## Setup

Stripe dashboard → Developers → API keys (`sk_live_…`) and Webhooks → Add
endpoint `https://<api-host>/api/v1/stripe/webhook` with event
`checkout.session.completed` (`whsec_…`); both into Render's environment.
Requires the academy's business registration documents at Stripe signup.

## Follow-ups

- [ ] Parent-side "pay now" in the web app portal (link already exists on the
  payment row; the portal could surface it instead of the desk copying it).
- [ ] A "payment received" notification to the parent via [[notifications-backbone]].

Related: [[credits-follow-the-child]], [[notifications-backbone]]

Tags: #feature #payments #backend #admin #security
