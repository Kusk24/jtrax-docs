# The phone catches up with web #97–#111

**Shipped:** 2026-10-15 (in review) · **Repo:** `jtrax-mobile-app` · **PR:** mobile #67 (one PR, one commit per change)

The phone app now has every web portal change since web #96 that applies to a phone: certificates, voided payments, the Daily Challenge stars, the tournament carousel, the archived sign-in message, the scan error codes, and the smaller ID photo.

## Why

On 2026-10-15 the user asked whether the phone was up to date with the portal. It was level only to web #96 ([[the-phone-matches-the-redesigned-portals]]) plus #112 (mobile #66, [[choose-how-each-notification-arrives]]). The user asked for one PR, with meaningful commits.

## What changed

| Web | Phone |
|---|---|
| #111 | No edit pencil on the parent's profile |
| #99 | Archived account told so at sign-in (403); upcoming tournaments as a swipe row with a count and dots (`SwipeCards`); a thin blue outline on announcement cards |
| #102 | Voided payments kept and tagged; a voided fee isn't an entry's payment |
| #98 | `src/lib/shrink-photo.ts`: the ID card photo is scaled to 1600 px JPEG before upload (`expo-image-manipulator`) |
| #109 | `src/lib/scan-error.ts`: the scan's reason and code; `ApiError.body` keeps the reply |
| #101 | Game cards open one at a time (`GameModeGroup`) |
| #100, #107 | `ChildCertificates` on the child's page and a certificate screen; Download PDF uses `expo-print`'s `printToFileAsync` plus the share sheet, with the logo inlined as base64 because iOS can't load a local image into a printed page |
| #103, #105 | Daily Challenge card: "Let's play", "x/3 puzzles completed", three stars; `starEmpty` and `starLine` added to `ST_LIGHT`/`ST_DARK` and `tailwind.config.js` |

Not ported, because they don't apply to a phone: web #97 (browser push), #104 (the web's own proxy), #106, #108 and #110 (public pages). The child card's hours, added in #99, were removed again in #101.

## Verified

- vitest 253 passing.
- Each change driven in the Expo web build at 390 px against a local seeded backend.
- The PDF share sheet and the native photo shrink run only on a device; their logic is unit-tested.
- **Gotcha:** the Expo web dev server here often kept serving a stale bundle after a file changed. Restart it with `--clear` before trusting a screenshot.

## Follow-ups

- [ ] Merge mobile #67, then make a new app build (two new native modules: `expo-image-manipulator`, `expo-print`).
- [ ] On a real phone, check that Download PDF on a certificate and an ID card photo are each under 1 MB.

Related: [[the-phone-matches-the-redesigned-portals]], [[a-failed-scan-says-why]], [[id-card-photos-were-too-large-to-scan]]

Tags: #feature #mobile #parent #student
