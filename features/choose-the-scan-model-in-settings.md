# Choose and test the scan model in Settings

**Shipped:** 2026-09-24 (in review) · **Repos:** `jtrax-backend`, `jtrax-admin` · **PRs:** backend #62, #63 · admin #133 (stacked on #132)

An admin can pick which Gemini model reads scanned registration forms and ID cards, press **Test** to check it against the server's key before saving, and see the result straight after every save. No redeploy is needed.

## Why

On 2026-09-24 every form scan on Render failed with `could not read the form`. The backend log said `gemini: status 404`. Google now serves the 2.5 models only to accounts that already used them, so a key made today gets a 404 for `gemini-2.5-flash`, which was the built-in default. Before this change, the model could only be set with `OCR_MODEL` and a redeploy, and the only way to find out a model was wrong was a failed scan.

## How it works

**Backend**
- `internal/ocr/model.go`:
  - `ValidModel` only allows names matching `^[a-z0-9][a-z0-9.-]{0,63}$`, because the name goes into Google's URL path.
  - A provider can implement the optional `ModelChooser` interface: `Model`, `WithModel`, `Test`.
  - `StatusError` carries only the upstream HTTP status.
- `internal/ocr/gemini.go`:
  - `call` is one request path shared by scans and the test.
  - `Test` sends a single text-only prompt with no image, so it costs very little.
  - `WithModel` returns a copy of the provider. It ignores an invalid name.
- `internal/api/ocrsettings.go`, all Admin only:
  - `GET /api/v1/ocr`: whether a key is configured, the model in use, the server default, and the saved model.
  - `PUT /api/v1/ocr {model}`: saves `ocr_model` in `system_configuration`. An empty model deletes it, so the server default applies again.
  - `POST /api/v1/ocr/test {model?}`: answers `ok`, or a `reason`. The reasons are `model_unavailable` (404), `key_rejected` (400/401/403), `quota` (429), `provider_error`, `unreachable` and `not_configured`. Rate-limited to 10 per minute.
- `scannerFor` reads the saved model on every scan, so a change applies to the next scan with no restart. It is used in both `registrationscan.go` and `idcardscan.go`.
- The built-in default is now `gemini-3.8-flash` (#62).

**Admin**
- `components/settings/ScanModelCard.tsx` is a card under Settings, below LINE, shown to Admin only.
- The picker offers: Server default, the free image-reading models a new key can use (listed in `lib/ocr.ts` as `SCAN_MODELS`), or Other….
- **Test** checks the chosen model without saving it.
- **Save** saves the model, then tests it automatically.
- The result shows as green or red text explaining the reason, in EN and TH.

## Decisions made along the way

- **The key stays in the environment.** Only the model name, which is not a secret, is stored in the database. This follows the house rule that secrets come from the environment.
- **Admin only**, the same as the LINE credentials, because the model decides which outside service reads a child's form. A receptionist could still write `ocr_model` through the generic `system-configuration` endpoint. That value is still validated where it is used, so it cannot change the provider URL; `TestAModelNameThatCouldBendTheURLIsRefused` covers this.
- **A failed test answers 200** with `ok: false`, because the test itself ran. Only the upstream status is passed on, never the upstream body.
- **No automatic test when Settings opens.** Each test uses the key's free quota, so tests run only on Test and after Save.

## Found on the way

- `messages/en.json` and `th.json` had been missing a comma since admin #131. That broke the Vercel build for `main`, so production kept running an older version. #132 fixes it and adds `lib/messages.test.ts`, which checks that both files parse and have the same keys.

## Follow-ups

- [ ] Merge order: backend #62 and #63, then admin #132. Retarget admin #133 to `main` with `gh pr edit 133 --base main`, then merge it.
- [ ] Until #62 and #63 are deployed, set `OCR_MODEL=gemini-3.8-flash` on Render.
- [ ] The free Gemini tier may use what it receives for training. Use a paid key before scanning real family forms.

Related: [[public-tournament-registration]] [[every-entry-is-accepted]] [[notifications-system-plan]]

Tags: #feature #ocr #admin #backend
