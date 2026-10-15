# ID card photos were too large to scan

**Fixed:** 2026-10-07 · **Repo:** `jtrax-web-app` · **PR:** #98 (merged, deployed the same day)

Testers reported that the ID card scan on the public tournament form did not work. The code was not the problem: on a local backend with a stand-in reader, the scan read the card correctly. The photo never reached the reader.

## Cause

`postCard` in `lib/registration.ts` uploaded the photo exactly as the phone took it. A camera photo of a card is usually 2–5 MB, and sometimes over 10 MB.

- **nginx:** sits in front of the API, and its default request body limit is 1 MB. `SERVER.md` never mentions raising it.
- **Backend:** has its own limit of 10 MB (`maxScanBytes` in `internal/api/registrationscan.go`).

When an upload is refused, nginx answers with an HTML page rather than JSON. `postCard` could not parse that, so all the form could say was "could not read the card".

The local test had passed only because its stand-in image was 9 KB.

## Fix

`lib/shrink-image.ts` redraws the photo before it is sent:
- turned upright from its EXIF orientation;
- scaled to 1600 px on its longest side;
- saved as a JPEG at quality 0.85.

Photos under 700 KB, files that are not images, and anything the browser cannot decode are sent as they are.

The fix covers both the public form and the parent portal's ID check, because both upload through `postCard`.

**Driven locally:** an 11.8 MB, 4032×3024 photo reached the scanner as about 780 KB, and the card was read. That photo was random noise, which is the worst case for JPEG compression; a real photo of a card comes out smaller.

## Still open

- [ ] Not yet checked against the real Gemini OCR. If scans still fail on the live site, Admin → Settings → Scan model → Test names the cause: no key, unknown model, key refused, quota, or Google unreachable. See [[choose-the-scan-model-in-settings]]. Since 2026-10-13 the form itself shows the cause and its code: [[a-failed-scan-says-why]].
- [ ] `nginx`'s `client_max_body_size` on Lightsail is still unconfirmed. Raising it to about 12m would let the backend's own 10 MB limit be the real one.
- [ ] The phone app sends `expo-image-picker` photos at quality 0.8 without resizing. It could exceed the same limit once it is pointed at the live API.

Related: [[public-tournament-registration]], [[choose-the-scan-model-in-settings]], [[every-entry-is-accepted]]

Tags: #bug #ocr #web #tournament
