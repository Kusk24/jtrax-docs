# The academy has no teacher role

**Date:** 2026-08-23 · **Status:** accepted
**Repos:** `jtrax-web-app`, `jtrax-mobile-app`, `jtrax-backend`, `jtrax-admin`
**PRs:** web-app #42 · mobile #9 · backend #38 · console #79 (backend deploys first)
**Supersedes:** [[teacher-portal-hidden]]

JTrax has four kinds of user — admin, receptionist, parent, student — and no
fifth. A teacher is a **record of who teaches**, not somebody who signs in.

## Context

The teacher portal was built in July 2026 from the Figma mockups
([[web-app-teacher-frontend]]) and grew a dismissal flow and an Ongoing tab
soon after ([[web-app-teacher-dismissal]]). In August the client said they did
not need the role for now, and the Teacher card was taken off the role chooser
— visibility only, so it could be restored or deleted once the decision was
final ([[teacher-portal-hidden]]).

The decision is now final, and the workflow settled somewhere else in the
meantime. **The front desk takes attendance.** Checking a child in, dismissing
them, and spending the hour off their credits all happen at the receptionist's
screen ([[the-front-desk-remembered-nothing]],
[[an-hour-of-class-costs-an-hour-of-credit]]), and a session's roster is built
in the console ([[create-session-would-not-press]]). There is nothing left for a
teacher to do in software that the console does not already do better, in the
place where the family is standing.

Meanwhile the code was not merely idle, it was **wrong**:

- The portal was mock end to end — every teacher greeted as "Serene", every
  student opening as Penny's record, the QR screen inventing a scan every five
  seconds ([[ui-audit-2026-08-21]]).
- It was still reachable. `homeFor("Teacher")` returned `/teacher`, so a teacher
  account signing in landed in it.
- And the console **minted those accounts**: adding a teacher in Academy created
  a `user_account` with a fabricated `@jca.ac.th` address and a random password
  nobody was ever shown. The academy was accumulating live credentials for a
  portal made of fixtures.

## Options considered

| Option | Pro | Con |
|---|---|---|
| Keep it hidden, as in August | reversible; no work | mock screens keep rotting, and the accounts keep being minted |
| Wire the portal to the real API | a teacher could take their own register | builds a second attendance path against the one the desk uses; nobody asked for it |
| **Delete the portal, keep the record** | one attendance path; no credentials for a screen that does not exist | a teacher portal later is a rebuild, not a revert |

## Decision

**Delete the teacher front-ends. Keep teachers as records. Stop issuing teacher
accounts.**

What went:

- `jtrax-web-app` — `app/teacher/**` and every component only it used
  (`TeacherNav`, `TeacherHeader`, `TeacherClassCard`, `CheckinHeader`,
  `RosterRow`, `SessionProgress`, `CreditSummaryCard`, `AttendanceHistoryList`,
  `PortalNav`, `Avatar`), `lib/teacher-data.ts`, four types, and eleven message
  namespaces in both catalogues. 30 files, ~2,570 lines.
- `jtrax-mobile-app` — the same portal one generation behind (no dismissal, no
  Ongoing): `src/app/teacher/**`, six components, `src/lib/teacher-data.ts`,
  four types, and the teacher keys out of the shared namespaces. 21 files,
  ~1,670 lines.
- `homeFor` in both apps no longer routes Teacher anywhere. It already had a
  `null` case meaning "this app has no portal for that role" — Teacher is one of
  those now, like Admin and Receptionist.

What stayed, deliberately:

- **The `teacher` table and the `teachers` resource.** The Academy screen lists
  teachers, edits them and exports them; a parent's class card names the teacher
  their child is with. Deleting the role would delete the answer to "who teaches
  this class".
- **The Teacher role in the backend** — the `user_account` CHECK, the
  `WriteRoles` grants on sessions, attendance, announcements and puzzles, and
  the Lichess and play paths. Nothing issues a teacher account any more, so
  those grants are unreachable rather than wrong; ripping them out is an auth
  change against a deployed database and belongs in its own PR. **Open
  follow-up, below.**

## Consequences

**A teacher no longer needs a login to exist.** `teacher.user_account_id` was
`NOT NULL UNIQUE REFERENCES user_account`, which is what forced the console to
mint a credential for every teacher it wrote. Migration `0023` rebuilds the
table with the column nullable — safe to rebuild plainly, because nothing in the
schema references `teacher`, which is exactly the condition
[[0007-retire-a-row-instead-of-deleting-it]] did *not* have. `UNIQUE` stays and
still works: SQLite permits many NULLs, so account-less teachers coexist while a
linked one is still one-to-one.

**Existing teachers keep their link.** The migration copies the column across,
so nothing on file changes and no current sign-in stops resolving. New rows
simply have none.

**The console writes one row instead of two.** `AcademyPage.tsx` no longer
creates a `user-accounts` row for a teacher, which also closes the audit finding
that *"teacher accounts are created with a password nobody is ever shown"*.

**Restoring a teacher portal later is a rebuild.** That is the accepted cost.
The deleted code was mock anyway, so what would have been "restored" is fixtures
— a real portal would be written against the API from scratch whichever way this
went.

## Verified

- `jtrax-web-app` — `tsc` clean, `next build` clean with no `/teacher` route in
  the manifest, 8/8 tests.
- `jtrax-mobile-app` — `tsc` clean but for a pre-existing `global.css`
  side-effect import; `expo lint` down from 166 problems to 164, none in a file
  this touched.
- `jtrax-admin` — `tsc` and `eslint` clean, 249/249 tests.
- `jtrax-backend` — `go vet` and the full suite green, plus three new tests in
  `internal/api/teacherrecord_test.go`. Mutation-checked: restore
  `Required: true` on the column and the first one fails with
  `400 user_account_id is required`.

## Follow-ups

- [ ] **Retire the Teacher role in the backend** — `user_account` CHECK,
      `accountRoles` (`internal/api/useraccounts.go:14`), the four `WriteRoles`
      grants (`registry.go:201`, `:231`, `:316`, `:428`), `canPlay`
      (`games.go:24`) and the Lichess branches. Touches auth on a deployed
      database, so it wants its own PR and a check for existing Teacher rows
      first.
- [ ] **Any Teacher accounts already on the deployed database** are still valid
      credentials that now resolve to no portal. Worth an audit before the role
      itself is removed — see [[staff-accounts-on-the-deployed-database]].
- [ ] `internal/db/seed.go` still seeds `tch_serene` with a `usr_serene`
      account. Harmless demo data, but it contradicts this note on a fresh dev
      database.
- [ ] `jtrax-web-app` has **no working lint** — `next lint` was removed in Next
      16 and eslint is not a dependency. Unrelated to this change, noticed while
      verifying it.

Related: [[teacher-portal-hidden]], [[web-app-teacher-frontend]],
[[web-app-teacher-dismissal]], [[ui-audit-2026-08-21]],
[[the-front-desk-remembered-nothing]],
[[an-hour-of-class-costs-an-hour-of-credit]],
[[0007-retire-a-row-instead-of-deleting-it]],
[[0004-console-roles-match-the-backend]]

Tags: #decision #web-app #mobile #backend #admin #teacher
