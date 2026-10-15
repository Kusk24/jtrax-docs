# A failed scan says why

**Shipped:** 2026-10-13 · **Repos:** `jtrax-backend`, `jtrax-web-app`, `jtrax-admin` · **PRs:** backend #100, #101, #102 · web #109 · admin #166, #167 (all merged and deployed 2026-10-13)

A failed ID card scan now shows the cause and an exact code, so a tester can report something like `model_unavailable 404` instead of "it doesn't work". This covers the public entry form, the parent portal, and the admin's Register Student → Upload Registration Form. HEIC photos are now read instead of refused, and the admin shrinks a form photo before sending it.

## Why

On 2026-10-13 the user asked whether OCR on the ID card works. A tester had said it didn't, and every failure showed the same "could not read the card". The real cause was only in the server log, and I can't read the production log without the user. Production could not be checked from here, so the user asked for the form to show the exact error.

## How it works

**Backend (#100)**
- `internal/api/scanfailure.go`:
  - `providerFailure` names a provider error. The codes are `model_unavailable` (404), `key_rejected` (400/401/403), `quota` (429), `provider_error`, `unreachable` and `no_answer`.
  - Settings → Form scanning → Test uses the same function, so the Test button and a scan say the same thing for the same failure. Test's reply is unchanged.
- A failed scan answers `{error, reason, status}`. `status` is the scan service's own status, and only appears when it answered.
- The ID card step's other failures carry codes too: `not_configured`, `too_large`, `no_image`, `not_an_image`, `no_date_of_birth`.
- The staff form scan gets the same reason and status. Its other failures got codes in #102, which also fixed the sentence to name the real settings card, **Form scanning**. #102 exists because those two commits were pushed to #100's branch after #100 merged.
- Only the code and the status leave the server. The provider's reply can quote the child's document, so it stays in the log.
- `ocr.ErrNoCandidate` is now exported, so "answered with nothing" can be told apart from a connection failure.

**Web (#109)**
- `lib/scan-error.ts` `scanErrorText` builds the message: the sentence (`register.scanWhy.*`, EN and TH), then `(error: <code> <status>)`.
- A reply that didn't come from the backend has no code, so it is named by its HTTP status instead. For example, nginx refusing a large photo answers HTML, which shows as `http 413`.
- No answer at all shows as "could not be sent".
- The public form now shows a failed scan in red as an alert, the same as the parent portal.

**Admin (#166, #167)**
- #166: `lib/scan-error.ts` `scanErrorText` reads `reason` and `status` from `ApiError.body`. The strings are `students.scanWhy.*`, EN and TH, and replace the generic `scanFailed`.
- #167: the form photo was uploaded exactly as the camera took it, the same 1 MB nginx problem as [[id-card-photos-were-too-large-to-scan]]. `lib/shrink-image.ts` is copied from the web. A 1.4 MB, 4032 px photo now reaches the scanner at about 88 KB.

**HEIC (#101)**
- `http.DetectContentType` does not recognise HEIC. So a HEIC photo was refused with 415, by a message that asks for HEIC.
- `sniffImage` in `internal/api/registrationscan.go` reads the `ftyp` brands to recognise it. AVIF uses the same container, so it is ruled out.
- This only matters when the browser can't shrink the photo first. For example, desktop Chrome can't decode HEIC.

## Verified

- `go test ./...` passes. The new tests fail without the change.
- Web: vitest 225 passing, tsc and eslint clean.
- Driven in Chrome at 390 px, against a local backend and a Gemini stand-in:
  - Gemini 404, 429 and an empty answer each showed their own sentence and code.
  - Thai showed the Thai sentence.
  - A good read still filled in the name and date of birth.
- Admin driven in Chrome at 1280: 404 (EN), 429 (TH) and an empty answer each showed their own sentence and code, and a good read pre-filled the form. vitest 1006 passing.
- Not driven: the parent portal's ID card step. It shares `scanErrorText` with the public form.
- **Not verified in production:** I couldn't read the live log or call the live API.

## Follow-ups

- [x] Merged and deployed 2026-10-13, together with migration 0076 (class charges to two decimals). It was rehearsed on a copy first, and the live database was backed up to `~/data/jtrax.db.bak-20261013-before-0076`.
- [ ] Ask the tester to scan again and send the code shown.
- [ ] The phone app's ID card step (`src/components/parent/TournamentIdCheck.tsx`) shows the server's `error` sentence. Once #100 is live, that sentence names the cause and the status, but only in English and without the code. Porting `scanErrorText` would match the web.

Related: [[id-card-photos-were-too-large-to-scan]], [[choose-the-scan-model-in-settings]], [[public-tournament-registration]]

Tags: #feature #ocr #backend #web #admin #tournament
