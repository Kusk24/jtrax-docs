# Admin console: open sidebar, header search, targeted credit reminders

**Shipped:** 2026-09-11 · **Repos:** `jtrax-admin`, `jtrax-backend` ·
**PRs:** admin #118, #119, #120 · backend #51

Three fixes to how an admin moves through the console: the sidebar arrives
expanded, one search box in the header opens any record, and the credit
reminder shows who it will reach and sends only to the families left ticked.

## Why

The reference pass ([[reference-ui-suite-pass]]) shipped the desktop sidebar
collapsed to an icon rail, which made the first act of every session decoding
eleven icons. It also dropped the Needs Follow-up card — and with it the only
"Send credit reminders" button, so on `main` there was briefly no way to send
them at all. And the only search in the console was the receptionist's desk
card; an admin had none. The user asked for all three: sidebar open by
default, "a search bar that can be searched", and reminders where "you can
see which parent we are sending, instead of sending to all".

## How it works

### Sidebar (admin #118)

One line: `JtraxShell.tsx` starts `navExpanded` at `true`. The chevron still
collapses to the rail; phone/tablet navigation untouched.

### Header search (admin #120)

- `lib/global-search.ts` — pure and unit-tested. Prefix beats word-start
  beats substring; students also match by the ID on their card; five hits per
  kind so a common letter can't flood the list.
- `components/GlobalSearch.tsx` — the box, in the shell's header on every
  page. Grouped dropdown, keyboard walking (↑ ↓ Enter Esc), click via
  `pointerdown` so the choice lands before blur closes the list. The dropdown
  anchors to whichever side of the box has room — right-only anchoring pushed
  it off the left edge of a 390px phone.
- `/students?id=…` now opens the student's detail (new `startDetailId` on
  `StudentsPage`); parents and tournaments already had deep links. Class hits
  land on the Academy list — no per-class deep link exists yet.
- Reads `DataContext` null-tolerantly and renders nothing outside the
  provider (the auth pages share the shell's chrome).

### Targeted credit reminders (backend #51 + admin #119)

`POST /api/v1/notifications/credit-expiry?days=N` gains an optional body:

- `{"dry_run": true}` — who would this reach: each affected student, the
  parents' names (`parentNamesOf`, the display half of `parentAccountsOf`),
  and the soonest expiry. Sends nothing.
- `{"student_ids": [...]}` — narrows a real send. The list can only shrink
  the server's eligible set; an id outside the window comes back `skipped`,
  never sent to. Empty body keeps the old send-to-everyone behaviour.

The admin side is a button on the Roster Health card opening a dialog: every
family ticked by default, untick to leave one out, a child with no parent
account flagged "call instead". The orphaned `FollowUps.tsx` (dead since the
reference pass) went with it.

Verified end-to-end: unticked Uri, sent, and read Sandy's inbox through the
API — exactly one `credit_expiry` notification, about Penny.

## Decisions made along the way

- The manual trigger stays expiry-only. A manual low-credit blast would be
  mostly silently dropped — `low_credit` defaults off per the academy's rule
  ([[the-product-to-do-pass]]), and `svc.Send` honours each parent's
  preference — which would read as the console lying about what it sent.
- Payments are not searched: a payment's identity is its student, and
  searching the student already surfaces them.
- The server stays the authority on reminder eligibility; the client's
  selection is an intersection, never a source.

## Follow-ups

- [ ] Per-class deep link on the Academy page, so a class hit opens the class
      rather than the list.
- [ ] The revenue hover-detail from the same session sits on the
      old-dashboard comparison branch (admin #117), not `main` — it only
      lands if that branch is chosen.

Related: [[reference-ui-suite-pass]], [[dashboard-kpis-drawn-not-just-counted]],
[[the-product-to-do-pass]], [[admin-console-ux-pass]]

Tags: #feature #admin #backend #notifications #search
