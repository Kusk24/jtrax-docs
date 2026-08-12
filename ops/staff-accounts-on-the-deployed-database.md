# Staff accounts on the deployed database

**Date:** 2026-08-13 · **Environment:** production

## What this covers

Creating the admin console's sign-ins on the deployed Turso database, and
resetting one when it is forgotten. The demo seed cannot do either.

## Why the seed is not the answer

`db.Seed` is a one-shot fixture: it returns immediately if `user_account` has
any row, so once the database is in use it can never add another account. It
also gives every account it creates the *same* password. It exists to make a
fresh clone show familiar content, nothing more.

`JTRAX_STAFF` is the real path. It runs on every boot, local or remote, and is
idempotent: an account that does not exist is created, one that does has its
password, role and name updated.

## Steps

1. In the Render dashboard, on `jtrax-backend`, add an environment variable
   `JTRAX_STAFF` holding a JSON array:

   ```
   [{"email":"head@jca.ac.th","password":"…","role":"Admin","name":"JCA Head Office","phone":"02-123-4567"},
    {"email":"front@jca.ac.th","password":"…","role":"Receptionist","name":"Front Desk"}]
   ```

   `role` is `Admin` or `Receptionist`. Passwords must be at least 8
   characters. Render wants it on one line.

2. Redeploy. The log line `staff accounts provisioned: …` names the emails
   written and never the passwords.

3. Sign in at <https://jtrax-admin.vercel.app>.

4. **Delete the variable and redeploy again.**

5. Further accounts are easier from the console: the Admins page creates a real
   `user_account` and shows a generated temporary password once.

## Parent and student accounts

Staff are the only accounts `JTRAX_STAFF` makes. The families come from a
separate import, `JTRAX_ROSTER=1` + `JTRAX_ROSTER_PASSWORD`, which turns the
ten students the console used to hard-code into twenty accounts — ten parents,
ten students — with their classes, credits and contacts. Same shape: opt in,
redeploy, remove both variables.

Parents sign in with the address the office recorded
(`carol.carter@gmail.com`); students get `<line-id>@student.jca.ac.th`. All
twenty share one password, so it is demo data — real families should go through
the forgot-password flow.

Two of the imported statuses do not match the labels the console carried: Kevin
Lim was written as Low Credit with 4 credits and Daniel Wong as Inactive with
2, but the rules are low-credit at ≤3 and credits are checked before
attendance. The credit figures are imported verbatim, so those two read as
Normal and Low Credit. The hard-coded labels were the thing that was wrong.

## Gotchas

**Step 4 is not tidying up.** Unlike `JTRAX_SEED`, which no-ops once accounts
exist, `JTRAX_STAFF` keeps applying. Left set, live passwords sit in the Render
dashboard *and* every deploy silently resets them — including a password a
colleague has since changed from the console.

**A reset signs people out.** Changing a password deletes that account's rows
in `auth_session`, on purpose: otherwise whoever held the old password keeps a
working session.

**The console is staff-only.** `fetchMe` rejects any role that is not `Admin`
or `Receptionist`, so a Teacher or Parent account gets bounced to `/login` with
no explanation. Those roles belong to the portals in `jtrax-web-app`.

**The two roles are the whole set.** The console used to show a third,
"Super Admin", which no backend account could actually be — see
[[console-roles-match-the-backend]]. An Admin sees every section; a
Receptionist does not get Admins, Academy or Settings.

**A cold start looks like a wrong password.** Render's free plan sleeps after
15 minutes and takes 30-60s to wake, which is longer than the sign-in request
waits. Hit `/health` first if a sign-in seems to hang.

## Secrets

`JTRAX_STAFF` (the JSON above, temporary), `DATABASE_URL`, `TURSO_AUTH_TOKEN`.
Values live in the Render dashboard only.

Related: `jtrax-backend/docs/deployment.md`, [[claude-workspace-setup]].

Tags: #ops #auth #deployment
