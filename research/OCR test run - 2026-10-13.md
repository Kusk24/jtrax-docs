# OCR test run - 2026-10-13

**Date:** 2026-10-13 (23:45–00:05 Bangkok time) · **Where:** `JTrax/ocr-tests/` (outside every repo, beside `credentials/`)

I ran 15 photos through JTrax's three OCR features, using the real Gemini key on a local backend. **14 of 15 were read correctly.** The run also showed why scans fail in practice: the key is on Gemini's free tier, which allows **20 requests a day per model**.

## What was tested

- **Public tournament entry, ID card scan:** cases 01–06.
- **Parent portal entry, ID card scan:** cases 07–10.
- **Admin Register Student, paper form scan:** cases 11–15.

The ID images are specimen passports and ID cards from Wikimedia Commons, plus three real Thai cards with their details blacked out. The form cases are JCA's `Registration_Form.jpg`, filled in with made-up answers in handwriting fonts from Google Fonts. Sources are in `ocr-tests/SOURCES.md`.

## Findings

- **Reading is good when Gemini answers.**
  - All ten ID cards were handled correctly. Names and dates of birth were read, and the three blacked-out Thai cards were refused with `no_date_of_birth` rather than given an invented date.
  - The Thai handwritten form was read in full. `25/11/2559` became `2016-11-25`, although only the ID card path has the Buddhist-era rule in its sanitiser.
  - The blank form came back empty.
  - `gemini-3.1-flash-lite` missed most fields on a tilted, dim form photo (case 14).
- **The free tier is the problem.**
  - `gemini-3.8-flash`, the server default, ran out after three calls of the first run. `gemini-flash-latest` is the same model and shares its quota.
  - `gemini-3.5-flash` shares `gemini-3.6-flash`'s quota, which also ran out.
  - Requests Google refused as `503` "high demand" still counted toward the 20.
  - Google said "retry in 7h12m" at 23:47 Bangkok time, so the quota resets around 07:00 Bangkok time.
- **Overload and slowness.**
  - 503s were frequent on 3.6, 3.7 and 3.8 flash.
  - Flash-lite took 10–45 s per photo. Twice it went past the backend's 60 s limit and came back as `unreachable`.
  - JTrax tries each scan once.
- If production uses the same key, which I could not check, a tester would see `quota 429` or `provider_error 503` once [[a-failed-scan-says-why]] is live. That explains "OCR not working".

## Recommendation

Use a paid Gemini key: no 20-a-day cap, and Google may not train on the photos of children's IDs. Short of that, JTrax could retry a 503 after a pause and fall back to a second model, but the daily cap would still apply. Either is the user's decision.

Related: [[a-failed-scan-says-why]], [[choose-the-scan-model-in-settings]], [[id-card-photos-were-too-large-to-scan]]

Tags: #research #ocr #ops
