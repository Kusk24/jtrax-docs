# Privacy notice, consent records, data export and erasure

**Shipped:** 2026-10-15 (deployed 2026-10-15) · **Repos:** all four · **PR:** backend #118, #119, #120, #121 · web #116, #117, #118 · admin #184 · mobile #70, #71

What changed:
- Families can now read a privacy notice.
- Entries record what was agreed to.
- A parent can download everything held about their family and ask for it to be erased.
- Personal data that no longer has a purpose is deleted on a timer.

This closes most of the gaps in [[PDPA gap audit - 2026-10-15]].

## Why

The user asked for the four PDPA gaps to be built after the audit. The Act's security half was mostly in place; its rights and transparency half was missing.

## How it works

- **Privacy notice (s.23).**
  - Web `/privacy` and the app's `/privacy` screen, in EN and TH, linked from the public footer and from every consent checkbox.
  - Marked **draft — awaiting the academy's approval**.
  - The version `2026-10-15-draft` lives in three places that change together: backend `PrivacyNoticeVersion`, web `lib/privacy.ts` and mobile `src/lib/privacy.ts`.
- **Consent records (s.23, s.26).** Migration `0080_consent_is_recorded.sql` adds `consent_record`, with purpose `privacy_notice` or `health_data`.
  - **Public entry:** the privacy-notice tick is required.
  - **Parent entry:** recorded when the app sends it, but not required, so older phone builds keep working.
  - **Medical notes** are refused without `health_consent`.
- **Export (s.30–31).** `GET /api/v1/me/export`, for parents and students.
  - It is scoped by the caller's own ids and every query names its columns, so hashes and tokens never appear (tested).
  - Staff get 403.
  - The web profile has a download button. The app shares the file through the share sheet.
- **Erasure (s.33).** Migration `0081_a_family_can_ask_to_be_erased.sql` adds `data_request`.
  - A parent asks from their profile.
  - The guardian's page in the console shows the request, and an admin either erases the family (the existing cascade delete) or declines with a reason.
  - Deleting the guardian closes the request itself.
  - Payments are kept, detached and named, because accounting law requires it ([[payments-outlive-students]]).
- **Retention (s.37(3)).** `internal/api/retention.go` runs an hourly sweep.
  - Housekeeping is always on: expired sessions, spent reset links after 30 days, unused ID-card reads after a day, and dead push subscriptions after 30 days.
  - Policy rules stay **off until the academy sets a period**, in days, through `JTRAX_RETAIN_MEDICAL_NOTES_DAYS`, `JTRAX_RETAIN_PUBLIC_ENTRANT_DAYS`, `JTRAX_RETAIN_NOTIFICATION_DAYS` and `JTRAX_RETAIN_LINE_MESSAGE_DAYS`.
  - A typo or negative value keeps the data.

## Decisions made along the way

- **The parent-portal privacy tick is recorded but not enforced**, so families on older app builds aren't locked out. Consent is not the lawful basis for a parent entering their own child (contract is). The notice still has to be shown.
- **Erasure reuses the existing people delete** instead of adding a second anonymiser, so there is one cascade to keep correct.
- **The erasure banner in the console is not from a mockup.** It reuses `ConfirmModal` and the theme on the guardian's page; move it when a design exists ([[jtrax-admin-from-mockups-only]]).

## Follow-ups

- [ ] The academy approves the notice's wording; bump the version in all three places.
- [ ] The academy chooses retention periods and sets the `JTRAX_RETAIN_*` variables in the backend `.env`.
- [x] Consent records in the export (backend #121) and the privacy tick in the parent tournament flow (web #118, mobile #71). Held back until the first PRs merged, so none had to be stacked.
- [x] Deployed 2026-10-15. The production database was backed up to `~/data/jtrax-pre-2026-10-15.db` first; migrations 0080 and 0081 applied, `/privacy` live, the new routes answer 401 without a session, and the first retention sweep left no expired sessions or stale ID reads.
- [ ] Confirm the Gemini key is on a paid tier, because free-tier prompts may be used for training.
- [ ] Write a breach-response runbook in `ops/`.

Related: [[PDPA gap audit - 2026-10-15]], [[backups-with-litestream]], [[sessions-slide-and-end-on-every-password-change]], [[deleting-and-linking-people]]

Tags: #feature #pdpa #privacy #security #backend #web-app #admin #mobile
