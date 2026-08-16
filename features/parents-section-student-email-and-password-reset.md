# Parents section, student emails, and self-service password reset

**Date:** 2026-08-13 · **Repos:** `jtrax-backend`, `jtrax-admin`, `jtrax-web-app`

Three asks that turned out to share one root: the schema keeps a person's login
identity on `user_account` and their domain row somewhere else, and nothing had
ever bridged the two for students or parents.

## Why the email was missing

`teacher` and `admin` each carry their own `email` column; `student` and
`parent` do not. The address is on `user_account.email`, reached through
`user_account_id`. That inconsistency is what made a missing student email read
as an oversight rather than a design.

Rather than duplicate the login identity a third and fourth time, the CRUD
engine gained a `Derived` column — read-only, pulled in by a scalar subquery:

```go
Derived: []Derived{
    {Name: "email", Expr: "(SELECT ua.email FROM user_account ua WHERE ua.user_account_id = student.user_account_id)"},
},
```

Two properties are load-bearing and easy to lose in a later refactor:

- **Staff-only by default.** `Derived.Roles` lists roles *beyond* staff and is
  empty for email. `students` has `ReadRoles: everyone` and teachers are
  unscoped, so without the gate this would have handed every teacher every
  student's address. The column is dropped from the SELECT list rather than
  filtered from the response, so it never enters the JSON at all.
- **Read-only for free.** `validate` already rejects any field without a
  matching `Col`, so `PATCH {"email": …}` is a 400 rather than a silent no-op.

`Expr` is spliced into SQL, so it must stay a constant authored in the registry
and must never be built from request data.

## Parents section

Pure frontend — `DataProvider` was already fetching `parents`,
`parent-contacts` and `student-parents`, and the backend already served all
three to staff (`canRead` is `isStaff(role) || ReadRoles`, so `ReadRoles` means
"roles *beyond* staff"; an admin was never blocked). There was simply no screen.

Built from the console's own `page-kit`/`ui` primitives and shaped like
`StudentsPage`, since a parent is the other half of a student row. The detail
shows both addresses, because they are usually different: `loginEmail` from
`user_account`, `email` from whatever the office recorded in `parent_contact`.

Added a `parents` icon to the ported `ICON_DATA` set — two adults of equal
size, where `students` is the same pair with the second figure smaller.

## Password reset

Nothing existed behind "Forgot password?" anywhere. The admin console showed a
sentence telling people to ask a Super Admin; the portals had no link at all.
Now `POST /auth/forgot-password` and `POST /auth/reset-password`, with UI in
both frontends.

Decisions worth not re-litigating:

- **The stored token is a SHA-256, never the token.** The raw value exists only
  in the email, so leaking `password_reset` does not grant account takeover.
- **Forgot-password cannot enumerate accounts.** Status and body are identical
  for registered and unregistered addresses, and a send failure is logged
  rather than returned — returning it would confirm the address exists.
- **Completing a reset deletes every session for the account** and voids any
  other outstanding link, in one transaction. If the reset happened because
  somebody else knew the old password, leaving their session alive defeats it.
- **The portal in the link is chosen from the account's role on the server** —
  `ADMIN_URL` for staff, `APP_URL` for everyone else. Never from anything the
  caller sends, or a request could aim the link at an attacker's host. This was
  missed on the first pass: one `APP_URL` would have mailed admins a link to the
  parent portal.
- **Tightest rate limit of the three unauthenticated routes**, 3/min against
  login's 10. Each accepted call sends mail to someone else's inbox.

Delivery is plain `net/smtp`, not a provider SDK, so the host is configuration:
`SMTP_HOST`, `SMTP_PORT`, `SMTP_USERNAME`, `SMTP_PASSWORD`, `MAIL_FROM`,
`APP_URL`, `ADMIN_URL` — all from the environment, none committed. Leaving
`SMTP_HOST`/`MAIL_FROM` unset is deliberate: the endpoint still answers and logs
the link marked `SENSITIVE`, so a fresh clone works without a mail server. The
cost is that a deploy which forgets to configure mail fails quietly — check the
logs once after enabling it. Provider choice on the free-and-no-card
constraint is discussed in the runbook; see [[deploying-jtrax-backend]].

## Verification

The backend guards are mutation-tested — session revocation, single-use, and
the staff-only column each confirmed to fail when the guard is removed, so they
are gates rather than passing assertions. The frontends have no test harness at
all, so both flows were driven in a real browser end to end: request a link,
pull the token from the log, spend it, confirm the replay is rejected, the old
password is dead, and the new one signs in.

## Known gaps

- **Every admin console page overflows horizontally at 390px** — `/students`,
  `/payment` and `/admins` all report a 501px document against a 390px
  viewport. Pre-existing and app-wide; the tables set `minWidth: 760` inside an
  `overflowX: auto` wrapper by design, but the page itself still scrolls. Wants
  its own pass across all nine screens.
- **The Admins page still has a Reset password button that only shows a
  message.** Making it real needs no email at all —
  `PATCH /api/v1/users/{id}` already accepts a password — but it is a separate
  decision.

Related: [[sign-in-sign-out-and-the-unguarded-teacher-portal]],
[[public-url-forced-two-security-fixes]], [[deploying-jtrax-backend]],
[[backend-crud-and-live-portals]]

Tags: #feature #security #auth #backend #admin #web-app
