# A public entrant pays online

**Shipped:** 2026-09-24 (in review) · **Repos:** `jtrax-backend`, `jtrax-web-app` · **PRs:** backend #64, web-app #75 (merge the backend first)

Someone who enters a tournament through the public form (no account) can pay the fee online, either straight away from the done screen or later from the confirmation email. Before this, the form quoted a fee and then said "do not pay until you hear from us", which stopped being true once every entry was accepted ([[every-entry-is-accepted]]).

## Why

Found on 2026-09-24, while testing Stripe in sandbox. A parent could pay through the portal ([[a-parent-pays-a-tournament-fee]]), but the public poster form had no payment link, and it told people not to pay. The user chose to do the whole thing: pay on screen, plus an email with a pay link.

## How it works

**Who may pay: a pay code, not an account**
- Registering creates a random 256-bit code for the entry.
- Only its SHA-256 is stored, in `tournament_registration.pay_code_hash` (migration `0039`), the same rule `password_reset` follows.
- The code goes back to the browser once (`payCode` in the register reply) and goes in the email.

**Endpoints** (`jtrax-backend/internal/api/publicpay.go`)
- `POST /api/v1/public/tournament-registrations/{id}` with `{code}` returns the entry and its `state`: unpaid, paid, free or closed.
- `POST …/{id}/pay` with `{code}` returns the Stripe page. It reuses `createTournamentPayment` and `checkoutLink`, so one entry has one payment and one link.
- A wrong code, a missing code and an unknown id all answer 404. The hash is compared in constant time. The code is read from the body only.
- Rate limits: 30/min to read, 20/min to pay.

**The confirmation email** (`sendEntryConfirmation`)
- EN and TH, plain text, sent to the address the entrant typed.
- The link is `…/register/{tid}/pay?entry={id}#code={code}`. The code sits after `#`, so it never reaches a server log.
- With card payments off, the email says to pay by bank transfer or at the desk instead.
- It is sent off the request and never fails the registration.

**Stripe**
- The entrant's email is filled in on Stripe's page (`customer_email`).
- A tournament payment's `student_id` may now be NULL, for an entrant who isn't a JCA student.

**Web app**
- `app/register/[id]/RegisterForm.tsx`: the done screen now says "You're registered" and offers **Pay now** or pay later.
- `app/register/[id]/pay/`: the page the email link opens, marked `noindex`.
- `PayNow.tsx`: the button both screens share.

## Decisions made along the way

- **A code in the link, not an account.** Public entrants have no login, and making them create one to pay would lose them. The code allows exactly one thing, opening a payment page at the stored fee, so leaking it costs nothing beyond that.
- **The code goes after the `#`.** A password reset link puts its token in the query string; this one doesn't need to, because the page reads the code in the browser and posts it in a body.
- **The email was built here** even though notifications are someone else's area ([[notifications-backbone]]). The user chose this on 2026-09-24. It is a single transactional message on the existing `mail.Sender`, not a notification type.

## Follow-ups

- [ ] Real delivery needs the academy's sending domain (see `SERVER.md`) verified in Resend. Until then Resend only delivers to the account owner's own address. The on-screen Pay now works either way.
- [ ] PromptPay: the webhook only settles `checkout.session.completed` with `payment_status=paid`. If sandbox shows PromptPay arriving later (`checkout.session.async_payment_succeeded`), handle that event too.
- [ ] A place to upload a bank-transfer slip is still missing ([[every-entry-is-accepted]] follow-up).
- [ ] The rate limits are per IP, but the web app calls the API through its own server proxy, so every visitor shares one budget. That was already true of the register endpoint.

Related: [[card-payments-through-stripe-checkout]] [[a-parent-pays-a-tournament-fee]] [[public-tournament-registration]] [[every-entry-is-accepted]]

Tags: #feature #payments #public #security #backend #web
