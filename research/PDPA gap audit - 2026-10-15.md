# PDPA gap audit — 2026-10-15

**Scope:** `jtrax-backend`, `jtrax-web-app`, `jtrax-admin`, `jtrax-mobile-app`, and the Lightsail box.
**Status:** this is an engineering read of the code, not legal advice. The academy's counsel should confirm each point, especially the section references, before anything is published.

What personal data JTrax holds, where it goes, and how it measures against
Thailand's Personal Data Protection Act B.E. 2562 (2019). The academy is the
**data controller**. Every hosting, AI, payment and messaging service below is
a **data processor** acting for it. Most of the people in the data are
**children**.

## Verdict

Security (s.37(1)) is in reasonable shape after the 2026-10-15 work
([[sessions-slide-and-end-on-every-password-change]], [[backups-with-litestream]]).
The **rights and transparency** half of the Act is mostly missing. Two items are urgent:

1. **Children's scans may be used for model training.** ID cards and
   registration forms are sent to Google Gemini. `internal/ocr/gemini.go`
   records that on the **free tier Google may use prompts to train models**.
   Confirm the production key is on a paid tier. Until it is, the scan feature
   should be off (`OCR_PROVIDER=none`).
2. **Health data is collected without explicit consent.**
   `tournament_registration.medical_notes` is health data, which s.26 treats
   as sensitive. Collecting it needs explicit consent, and the entry flow only
   records `terms_accepted_at`.

## What is held

| Data | Where | Whose |
|---|---|---|
| Name, date of birth, school, branch, level, FIDE ID/rating | `student` | child |
| Sign-in email or student ID, PBKDF2 password hash, language, theme | `user_account` | everyone |
| Name, phone, email, LINE ID | `parent`, `parent_contact`, `teacher`, `admin` | adults |
| Guardian relationship | `student_parent` | child + parent |
| Attendance check-in/out times | `attendance` | child |
| Payments: amounts, method, Stripe session, names copied in, audit trail | `payment`, `payment_audit` | parent |
| Tournament entries: name EN/TH, DOB, age, contact email and phone, **medical notes**, remarks, document type, OCR'd name/DOB | `tournament_registration` | child (often a public, non-member child) |
| DOB and name read off an ID card or passport (photo not kept, migration 0062) | `id_card_check` | child |
| LINE profile, chat history | `line_contact`, `line_message` | parent |
| Lichess username, OAuth token (sealed), ratings | `student_lichess`, `lichess_rating*` | child |
| Practice, puzzles, games, certificates | `practice_activity`, `puzzle_attempt`, `game_*`, `solo_game`, `student_certificate` | child |
| Push endpoints, user agent | `push_subscription` | device |
| Notifications sent | `notification`, `notification_delivery` | everyone |

## Where it goes (processors, and data leaving Thailand)

| Processor | What it receives | Location |
|---|---|---|
| AWS Lightsail (`ap-southeast-1`) | everything, as the server and its disk | Singapore |
| AWS S3 (Litestream, once set up) | the whole database | Singapore |
| Google Gemini | photos of ID cards and paper registration forms | Google, multi-region |
| Stripe | payer email, amount, entry reference | US/global |
| LINE Messaging API | parent LINE IDs, message text | Japan/Thailand |
| Google FCM / web push services | device tokens, notification text | global |
| SMTP provider (`internal/mail`) | names, emails, notification and reset links | depends on provider |
| Lichess | the child's Lichess identity, via OAuth | France |

Every row above is a transfer outside Thailand. Sections 28–29 require the
destination to have adequate protection, or an exception such as consent or
contract necessity, or appropriate safeguards. None of this is documented today.

## Gaps against the Act

| Requirement | Section | State | Tracked in |
|---|---|---|---|
| Privacy notice at or before collection: purposes, lawful basis, retention, recipients, rights, contact | s.23 | **Missing.** No privacy page in any app, EN or TH. | privacy notice + consent seam |
| Consent that is specific, informed and withdrawable, with records | s.19 | Partial. Only tournament `terms_accepted_at`. | privacy notice + consent seam |
| Children under 10 need a guardian's consent; children aged 10–20 need it for anything beyond what they may do alone | s.20 | **Missing** where consent is the lawful basis. Public tournament entry is the exposed path. | privacy notice + consent seam |
| Sensitive data (health; religion is printed on Thai ID cards) needs explicit consent | s.26 | **Missing.** Medical notes are collected, and ID-card images that may show religion go to Gemini. | privacy notice + consent seam; Gemini tier |
| Collect only what the purpose needs | s.22 | Good on ID photos (0062). Review `medical_notes`, `remarks` and LINE chat history. | — |
| Right of access and data portability | s.30–31 | **Missing.** No export. | export + erase seam |
| Right to erasure or anonymisation | s.33 | **Missing.** Deleting archives the record ([[0007-retire-a-row-instead-of-deleting-it]]) and frees the email (0078). Nothing is anonymised. | export + erase seam |
| Right to rectification | s.35–36 | Partial. Staff can edit records; there is no request path. | export + erase seam |
| Objection and restriction | s.32, s.34 | **Missing.** Handled manually at best. | export + erase seam (request queue) |
| Retention limits, with a way to delete data once it is no longer needed | s.37(3) | **Missing.** Nothing is ever purged. | retention purge seam |
| Security | s.37(1) | Mostly done. Gaps: no encryption at rest; SSH is open to the world ([[jtrax-on-lightsail]]). | — |
| Report a breach to the PDPC within 72 hours | s.37(4) | **Missing.** No procedure, no contact list. | ops note to write |
| Record of processing activities | s.39 | **Missing.** The two tables above are the start of one. | this note |
| Processor agreements | s.40 | Unknown. Needs DPAs from Google, Stripe, LINE, AWS and the SMTP provider. | academy |
| Data Protection Officer | s.41 | Likely not mandatory at this size, but sensitive data about children argues for naming a contact person at least. | academy |

## Decisions the academy must make (engineering can't)

- The wording of the privacy notice, the controller's contact details, and
  whether to appoint a DPO.
- The lawful basis for each purpose. Class records are probably contract.
  Marketing announcements and LINE chat are probably consent. Payments are
  probably legal obligation, since tax law requires records to be kept for
  years.
- How long to keep each kind of data, especially payments (accounting law)
  and public tournament entrants.
- Whether `medical_notes` is needed at all. If it is, which staff may read it.

## Follow-ups

- [ ] Confirm the Gemini key is on a paid tier. Otherwise turn scanning off.
- [x] Privacy notice page (EN/TH) and consent records: guardian consent for
      minors, explicit consent for medical notes. Merged 2026-10-15, see
      [[privacy-notice-consent-export-and-erasure]].
- [x] Data export and erasure for a family, and a staff action to carry it
      out (same note).
- [x] Retention purge job for data with no legal reason to keep. Housekeeping
      is on; the policy periods are the academy's to set (same note).
- [ ] Breach-response runbook in `ops/`.
- [ ] Encryption at rest for the SQLite file and the backups (the S3 bucket's
      SSE covers backups).
- [ ] Restrict SSH on the box to known addresses.

Sources consulted:
- [Watson Farley & Williams — Thailand's PDPA: a business checklist](https://wfw.com/articles/thailands-personal-data-protection-act-a-business-checklist)
- [Securiti — Thailand PDPA overview](https://securiti.ai/thailand-personal-data-protection-act-pdpa)
- [Captain Compliance — PDPA compliance checklist](https://captaincompliance.com/education/pdpa-law-thailand/)

Section numbers follow the Act's published English translation. Check them against the PDPC's official text.

Related: [[jtrax-on-lightsail]], [[backups-with-litestream]], [[0007-retire-a-row-instead-of-deleting-it]], [[deleting-and-linking-people]], [[public-tournament-registration]], [[scan-models-prices-and-cost]]

Tags: #research #security #pdpa #privacy
