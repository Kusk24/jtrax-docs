# Scan models with prices, and what scanning costs

**Shipped:** 2026-10-14 (deployed) · **Repos:** `jtrax-backend`, `jtrax-admin` · **PRs:** backend #104, #107 (re-lands #105, #106) · admin #169, #172 (re-lands #170, #171)

Settings → Form scanning now offers Google's current model list for the server's key, each with its price. It shows what scanning has cost this month and about what 1,000 scans cost on each model. It also says the model is one choice for the whole academy, and who made it.

## Why

On 2026-10-14 the academy moved to a paid Gemini key, so every scan is now billed. The user asked for three things: that one person's choice applies to everyone, that the list comes live from Gemini, and that costs are shown.

Before this, the picker was a list written into the admin app (`SCAN_MODELS`), with no prices.

The model choice was already academy-wide: `ocr_model` in `system_configuration` is read on every scan (see [[choose-the-scan-model-in-settings]]). The screen just didn't say so.

## How it works

- **Live list (#104):** `GET /api/v1/ocr/models` (Admin only, 10 per minute) asks Google which models the key can call.
  - It sends the key in the header, the same way a scan does, and follows Google's pages.
  - `ocr.ForScanning` keeps only models that can read a photo. It leaves out speech, image making, embeddings, live audio, robotics and the `-latest` aliases.
  - The list is cached for 10 minutes.
  - When Google refuses, the admin keeps its built-in list and shows the reason code.
- **Prices (#104):** `internal/ocr/prices.go` holds Standard-tier prices copied from Google's pricing page on 2026-10-13 (`PricesAsOf`).
  - An announced change carries its start date, e.g. `gemini-3.8-flash` goes from $0.75 / $3.75 to $1.50 / $7.50 per million tokens on 2027-01-01.
  - A model Google publishes no price for, such as `gemini-3.7-flash` or `gemini-3.5-flash`, shows none.
  - **This table has to be updated by hand when Google changes its prices.** Settings shows the date and links to the page.
- **Cost (#105):** migration **0077** adds `ocr_usage`, one row per answered call with its model, its kind (form, ID card or test) and its tokens. Thinking counts as output.
  - Nothing read off the document is stored.
  - `GET /api/v1/ocr` gains `usage`: this month's scans, tests, tokens and cost, priced on the day of each call, plus the average scan size over the last 90 days.
  - The admin uses that average to show "≈ $X per 1,000 scans" for every priced model.
- **Who chose it (#106):** saving the model records `ocr_model_by` (a display name) and `ocr_model_at`. The card shows "Chosen by …" and that every scan in the academy uses this model.

## Measured

On 2026-10-14, real scans on `gemini-3.8-flash` averaged about 1,300 input and 600 output tokens, which is about $0.003 a scan, or $3.25–3.35 per 1,000 scans. Driven in Chrome against Google's real API at 1280 px (EN) and 390 px (TH).

## Follow-ups

- [x] Deployed 2026-10-14 with migration 0077 (rehearsed first; live database backed up to `~/data/jtrax.db.bak-20261014-before-0077`). #105/#106 and #170/#171 had first merged into their parent branches, not `main`, because stacked PRs aren't retargeted; backend #107 and admin #172 re-landed them.
- [ ] Update `prices.go` whenever Google's pricing page changes.

Related: [[choose-the-scan-model-in-settings]], [[a-failed-scan-says-why]], [[OCR test run - 2026-10-13]]

Tags: #feature #ocr #admin #backend
