# The phone matches the redesigned portals

**Shipped:** merged to `main` 2026-10-06 · **Repos:** `jtrax-mobile-app` ·
**PRs:** mobile #52 · #53 · #54 · #55 · #56 · #57 · #58 · #59 · #60 · #61 · #62 (on top of #42, #50)

A pupil's Profile and every parent screen on the phone now look and behave like
the web portals after web #88 and #89. A parent can also enter a child in a
tournament from the phone again: the old entry form was refused by the server.

## Why

[[the-phone-gets-the-parent-portal]] (mobile #21) ported the parent `pv2`
portal as it stood on 2026-09-20. The web then redesigned both portals in #88
(student panel, parent attendance and payments) and #89 (ID-card check on
tournament entry, parent home and child page). The phone fell a generation
behind again.

One gap was a broken feature, not a look. Since [[every-entry-is-accepted]], a
parent's entry must carry an ID-card check, a nickname and accepted terms. The
phone still sent contact, medical notes and remarks, and the backend answered
`400 please give the player's nickname`.

## How it works

One PR per screen, stacked in this order:

| PR | What |
|---|---|
| #52 | Student Profile: emoji avatar and display name (`PATCH /auth/me`), three numbers, this week's streak. Account cards take the portal palette and follow dark mode. |
| #53 | README rewritten from Expo's template: clone, run the backend with `JTRAX_SEED=1`, `pnpm ios`. Adds `.env.example`. |
| #54 | `ParentData` joins what the web's does: credits per course, lifetime bought/used, payment history, hours toward the certificate (`certificate_hours`), the low-credit line, the school's notification switches. Seven `src/lib` helpers copied verbatim from web with their tests. |
| #55 | Child page: a card per course, lifetime credits, copyable Student ID, and a password reset for a child who signs in with a username (`POST /students/{id}/password`, parent-only, joined through `student_parent`). |
| #56 | Home: the bell by the greeting, recent announcements only (30 days, at most 3), the event's own banner, two child cards to a row. Today's activity counts the daily puzzle set, not 30 minutes. |
| #57 | Attendance tab: filter by child and course, each class's cost. The filters open a bottom sheet, not a dropdown. |
| #58 | Settings: only the notification types the school sends. Contact School dials the academy's numbers from `GET /public/academy` (it dialled `+66123456789`). |
| #59 | Profile: payment history, each with a receipt to save. |
| #60 | Announcements: the same notice card as the home, and the web's dialog. |
| #61 | Tournament entry: ID card (photo or upload), Thai name, nickname, terms, category by birth year. Regulation and venue-map rows; a closed event says so. |

Things that differ from web, and why:

- **Receipts** (`src/components/parent/ReceiptVoucher.tsx`): the web paints on a
  `<canvas>`. The phone lays the same design out as views and saves it with
  `react-native-view-shot`, then hands it to the share sheet (`expo-sharing`).
  `src/lib/receipt-content.ts` holds what the receipt says, so it can be tested.
- **ID card upload** (`src/lib/api.ts`, `postForm`): it goes through
  `XMLHttpRequest`. The `fetch` Expo installs refuses a file given by URI
  ("Unsupported FormDataPart"), and a URI is the only way to send a photo.
- **The uploaded regulation** is downloaded with the token in the header and
  opened in the share sheet. A token in a URL would sit in the browser's history.
- **Tournament banner** (`src/components/parent/TournamentBanner.tsx`): the
  organiser's upload, fetched with the session token, or a banner drawn from the
  event. It replaces a generic "Chess Championship 2026" image.

New native modules, all in Expo Go so `pnpm ios` still works:
`react-native-view-shot`, `expo-sharing`, `expo-image-picker` (permission
wording in `app.json`).

## Caught up again (2026-10-06)

The web merged #90–#94 the same day. Two touch screens the phone has, and
are ported:

- **Mobile #63 ← web #93.** The parent's tournament card follows the event
  (`lib/tournament-card.ts`, verbatim with its tests): open, closed,
  registered, under way. The live card lists ongoing events only, and the
  Event Information block is gone from the registration page. One phone-only
  change: the corner tag draws a word per line, because "Registration" split
  mid-word in the 64pt circle.
- **Mobile #64 ← web #94.** Incoming friend challenges on the student Home,
  checked every 5 seconds. The list moved out of `ChallengePanel` into
  `IncomingChallenges.tsx` first, in its own commit.

Not ported, because those pages exist only on the website: #90 (Pay Now /
Pay Later on the public form), #91 (the family arrival link) and #92 (the
public form's birth-date check, which the server also enforces).

## Pay later (2026-10-07)

Web #96 added a fourth payment choice to the parent registration flow; the
phone has it from mobile #65 (merged 2026-10-07).

- **What it does.** Pay later registers the child and holds the place,
  exactly like PromptPay and bank transfer: nothing is charged. The button
  reads Register Now, and the held screen says the fee can be paid "here or
  at the front desk". "Here" is the event screen's Pay by card, which a held
  entry already shows.
- **Phone-only difference.** The button label and the held screen's wording
  are picked in `src/lib/pay-choice.ts`, with tests, rather than inline as on
  the web, so the new behaviour has a test.
- **Not ported:** web #95 (the arrival page answers the email's Attending /
  Not attending button). That page exists only on the website.
- **Driven** in the web build at 390 wide against a local backend: the
  registration was created with no payment row, and the event screen showed
  "Fee not paid yet" and "Pay by card".

## Decisions made along the way

- **One PR per screen, stacked.** Each is reviewable on its own and lists what
  was driven on the simulator. The cost is that each must be retargeted as its
  parent merges (house rule: `gh pr edit <N> --base main`).
- **The phone keeps the web's strings** even where the phone uses fewer. Dead
  keys were removed only when the web had removed them too, so the two
  catalogues stay comparable.
- **No mock data, no new endpoints.** Every screen reads the live backend.
  Nothing in `jtrax-backend` changed for this work.

## Verified

Driven on the iPhone 16 simulator in Expo Go, against a local backend with the
seeded database, not only typechecked. Each PR lists its own checks. The
tournament entry was checked through to the database row: Penny, nickname
"Pen", the Thai name, category U8, terms accepted, THB 800. A stand-in for the
scan provider answered with a fixed card read, because the real one needs
`OCR_API_KEY`.

## Bugs found on the way

- [[the-payment-step-crashed-on-a-navigation-error]]: on main as well.
- The Thai `pv2.creditsDeducted` lacked the `{n}` placeholder the English uses,
  so the catalogue test failed. The web has the same gap and no test to catch it.
- The web's parent Settings also dials the placeholder number, and the web's
  practice chart labels the last seven days Mon–Sun whatever today is. Both are
  flagged as separate tasks.

## Follow-ups

- [x] Merge mobile **#50** (the plural polyfill) first. Merged 2026-10-06
      with the rest; the formatting errors are gone on `main`.
- [x] Retarget each stacked PR to `main` as the one below it merges. All 22
      open mobile PRs (#41–#62) merged 2026-10-06. #61 and #62 needed `main`
      merged in: the student and parent chains both grew from #42, so the
      catalogues and the student tab bar conflicted. The bar resolution
      re-applies #62's cross-fade to the four-tab bar from #48.
- [ ] Run it on a real phone. Everything here was driven on the simulator only.
- [ ] Real ID-card scanning needs `OCR_API_KEY` on the server. Without it the
      entry step says reading is not available.
- [ ] `react-hooks/set-state-in-effect` still fires on `ParentData`'s load
      effect (on main too).

Related: [[the-phone-gets-the-parent-portal]], [[the-phone-catches-up-with-the-portal]],
[[phone-catches-up-and-gets-push]], [[the-parent-portal-reads-the-real-rows]],
[[every-entry-is-accepted]], [[public-tournament-registration]],
[[choose-the-scan-model-in-settings]], [[a-parent-pays-a-tournament-fee]],
[[card-payments-through-stripe-checkout]], [[an-hour-of-class-costs-an-hour-of-credit]],
[[parents-section-student-email-and-password-reset]], [[one-palette-across-every-app]],
[[mobile-app-port]]

Tags: #feature #mobile #parent #student #tournament
