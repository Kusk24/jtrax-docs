# Sessions slide while in use, and every password change ends them

**Shipped:** 2026-10-15 (deployed 2026-10-15) · **Repos:** `jtrax-backend`, `jtrax-web-app` · **PR:** backend #115, #116 · web #114

A session now lasts as long as it is used, up to 90 days, instead of a fixed
30 days. A session left idle for 14 days ends. When an admin sets someone's
password from the console, that person is signed out everywhere.

## Why

These came out of a review of how data is secured, on 2026-10-15. Two gaps:

- **The session length was fixed.** A token left on a lost phone stayed valid
  for the full 30 days. An active parent was signed out in the middle of using
  the app on day 30.
- **One password path did not sign people out.** Resetting by link, changing
  your own password, and a parent setting a child's password already ended
  sessions ([[parents-section-student-email-and-password-reset]]). An admin
  setting a password via `PATCH /api/v1/user-accounts/{id}` did not. Handing
  an account back left any signed-in phone still signed in.

## How it works

- **Sliding sessions:** `jtrax-backend/internal/auth/session.go`.
  - `expires_at` is now an idle deadline, `SessionIdle` (14 days).
    `auth.Lookup` moves it forward on use, at most once an hour per session so
    reads do not turn into writes.
  - `created_at` anchors a hard cap, `SessionMax` (90 days). Sliding never
    goes past it.
  - No migration: both columns existed since `0002_auth_session.sql`.
    Existing sessions start sliding on their next request.
- **Admin-set passwords:** `auth.SetPasswordKeeping`
  (`internal/auth/reset.go`). It is `SetPassword` plus one token to spare,
  which is the admin's own console session when they change their own
  password. The PATCH handler in `internal/api/useraccounts.go` now uses it.
- **Web cookie:** `SESSION_MAX_AGE` in `jtrax-web-app/lib/session.ts` goes
  from 30 to 90 days. The cookie is written only at sign-in, so a shorter one
  would cut off a session the backend still considers live.
- **Admin and mobile unchanged.** The admin console keeps its deliberate
  7-day "remember me" cookie. Mobile keeps the token in `expo-secure-store`
  with no expiry, and already clears it on a 401
  ([[a-dropped-connection-signed-a-parent-out]]).

## Decisions made along the way

- **Same lifetimes for every role.** Staff could get a shorter idle window,
  but admin's 7-day cookie already caps staff in the browser. One rule is
  easier to reason about.
- **The sliding write is throttled, not skipped.** Writing on every request
  would be simpler, but every portal read would become an SQLite write.

## Tests

- `internal/auth/session_test.go`: sliding, idle end, the cap (including a
  deadline that tries to slide past it), and the hourly throttle.
- `internal/api/useraccountpassword_test.go`: the admin resets a teacher (the
  teacher gets 401, the admin stays signed in), and the admin changes their
  own password (only that session survives). Both fail without the fix.
- `jtrax-web-app/lib/session.test.ts`.
- Driven against a local server.
  - Password reset: the teacher's token went 200 → 401.
  - Sliding: a deadline 1 day away moved to 14 days away; a past deadline
    got a 401.
  - Web: signing in in Chrome set an httpOnly cookie expiring in 90.00 days.

## Follow-ups

- [x] Deployed 2026-10-15 with `./deploy.sh all`; smoke test 4/4.
- [ ] Mobile `.env` git-ignored: #68 was closed in favour of the same change as a local commit on mobile `main`, which still has to reach GitHub. Only
      `EXPO_PUBLIC_API_URL` and `EXPO_PUBLIC_MODEL_BASE_URL` are read, and
      both are public URLs. No secrets belong in that app's env, because
      `EXPO_PUBLIC_*` ships inside the bundle.

Related: [[backend-crud-and-live-portals]], [[sign-in-sign-out-and-the-unguarded-teacher-portal]], [[backups-with-litestream]]

Tags: #feature #security #auth #backend #web-app
