# The phone gets the parent portal

**Shipped:** 2026-09-20 · **Repos:** `jtrax-mobile-app` · **PR:** mobile #21 (needs backend #59)

A parent on the phone now gets the same portal they get in a browser: announcements, each child's page and attendance history, the tournament flow with a real fee, and their notification settings — all reading the live backend.

## Why

[[the-phone-catches-up-with-the-portal]] brought the student side of the phone up to the web portal and left a follow-up: the parent side was still the original mock design from [[mobile-app-port]] — a schedule tab, a per-child profile and a notifications panel reading `src/lib/parent-data.ts`. The web parent portal had since been rebuilt as `pv2` ([[portal-redesigns-from-claude-design]]), so the two had drifted a whole generation apart.

## How it works

- New screens under `src/app/parent/`: `announcements.tsx`, `child/[childId]/index.tsx` and `child/[childId]/history.tsx`, `tournament.tsx`, `settings.tsx`. Home, attendance, notifications and profile rebuilt.
- Shared parent components in `src/components/parent/`; data loading in `src/components/parent/ParentData.tsx`, types in `src/lib/parent-v2-data.ts` — the same shapes as `jtrax-web-app`, ported rather than reinvented.
- The tournament screen enters a child through `POST /api/v1/tournaments/{id}/entries` and pays through the registration's `stripe-link`; see [[a-parent-pays-a-tournament-fee]]. It sends no fee; the price shown is the server's `student_fee`.
- Currency through `Intl` with the ISO code (`src/lib/money.ts`). `api.put` added for the notification preference toggles.
- Removed with no remaining references: the old `schedule` and `profile/[childId]` screens, `Avatar`, `ClassCard`, `CreditBar`, `NotificationsPanel`, `ParentHeader`, `ParentNav`, `avatar-colors`, `parent-data`, `types`.

## Decisions made along the way

- On the phone the card form opens in the system browser sheet, not a WebView — a WebView shows no origin for a parent to check before typing a card number.
- Verified as Expo web at 390px (all nine screens, real data, no console errors, no horizontal scroll), not on a device or the iOS simulator.

## Follow-ups

- [ ] Run it on the iOS simulator and a real phone before calling the port done.
- [x] The greeting reads "Hi, Sandy !" with a space before the "!" — copied from web, where the string is the same. Fixed in web #73 and mobile #23 (opened 2026-09-20).

Related: [[the-phone-catches-up-with-the-portal]], [[a-parent-pays-a-tournament-fee]], [[a-dropped-connection-signed-a-parent-out]], [[mobile-app-port]]

Tags: #feature #mobile #parent
