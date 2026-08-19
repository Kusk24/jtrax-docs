# Public tournament registration

**Shipped:** 2026-08-19 · **Repos:** `jtrax-backend`, `jtrax-admin`, `jtrax-web-app` · **PR:** jtrax-backend#26, jtrax-admin#50, jtrax-web-app#30

Anyone with the link can now register for a tournament the academy has opened, and JCA's own students get a discount the front desk sets per event.

## Why

The console showed a "Registration Website" card with a QR code and a link. Neither was real: the link was a module constant pointing at `jca-demo-registration-site.vercel.app`, identical for every tournament, and the QR was a decorative grid of pseudo-random squares with three finder blocks — it looked scannable and did nothing.

Underneath, the schema could not express public registration at all. `tournament_registration.student_id` was `NOT NULL`, so a registration *was* a student, and the ordinary case of an open event — a child from another school whose name the academy has never seen — had nowhere to go.

## How it works

**Schema** — `0014_public_registration.sql` rebuilds `tournament_registration` so `student_id` is nullable, and adds `status`, `source`, `contact_email`, `contact_phone`, `fee_quoted`, `student_discount_applied`. The tournament gains `public_registration` and `student_discount_pct`.

The rebuild needed care: `tournament_pairing` references the table being dropped and `white_registration_id` is `NOT NULL`, so the references cannot be nulled out the way `0006` did it. The pairings are parked wholesale, deleted, and restored once the new table exists.

**Backend** — `internal/api/publicregistration.go` serves three unauthenticated routes under `/api/v1/public/tournaments`. The staff side is `internal/api/registrationqueue.go`.

**Portal** — `/register` and `/register/[id]` in `jtrax-web-app`, on the shared [[public-pages-shell]].

**Console** — `components/tournament/RegistrationCard.tsx` and `RegistrationQueue.tsx`, with a real QR from `components/tournament/QrCode.tsx`.

## What holds an unauthenticated write endpoint open

This is the product's first endpoint where a stranger creates a row. Four things hold it:

- A tournament is closed until an organiser opens it, exactly like `results_public`. A closed event 404s rather than 403s, so it cannot enumerate tournament ids.
- Every public submission lands as `Pending`. Nothing a stranger types becomes a participant on its own.
- Deadline and capacity are enforced *inside* the write transaction, not read beforehand — two people cannot both take the last seat.
- Rate-limited (10/min write, 60/min read), with partial unique indexes so one email holds one live place per event.

## Decisions made along the way

- **The student discount is claimed, not detected.** A registrant ticks "I am a JCA student" and is quoted the discount on that alone. The server *does* look their email up against student records but never says so in the reply — if the discount only appeared for addresses that matched, the form would be a way to test whether a given child is a pupil here, one submission at a time. The match is surfaced only in the staff queue, where "claimed, and we found a matching student" versus "claimed, no match" is the judgement the desk exists to make. `TestPublicRegistrationRevealsNothingAboutWhoIsAStudent` fails if the two replies ever diverge.
- **A percentage, not a second fee column.** It is how the front desk says it, and it stays correct when the fee is edited.
- **The quote is stored, not recomputed.** A fee is a promise made at a moment; editing the tournament's price later must not rewrite what somebody was told they owed.
- **Rejected rows are kept.** A blanket unique constraint would mean one rejection bars a child from the event forever, so the index skips them.
- **No online payment.** JTrax records payments, it does not take them. The form quotes a fee and says plainly not to pay until the academy confirms.

## Follow-ups

- [ ] Nothing emails the registrant when staff approve or reject them — the confirmation promises a reply that no code sends yet.
- [ ] `NEXT_PUBLIC_PORTAL_URL` must be set on the jtrax-admin Vercel project, or the console cannot build the registration link and says so.
- [ ] Pending sign-ups do not expire; a tournament that fills with un-decided requests blocks real ones until the desk clears them.

Related: [[external-tournaments-from-chess-results]], [[tournaments-linked-to-chess-results]]

Tags: #feature #tournaments #security
