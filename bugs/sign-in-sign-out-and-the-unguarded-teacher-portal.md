# Sign-in looked browser-specific, sign-out did nothing, and /teacher needed no session

**Found:** 2026-08-13 · **Fixed:** 2026-08-13 · **Repos:** `jtrax-web-app`, `jtrax-admin`

## Symptom

Three unrelated-looking complaints, all reported at once, all first visible only
after the backend moved off `localhost`:

1. The web app could be signed into in Chrome but not in Safari. The admin
   console worked in both.
2. Once signed in to the web app there was no way back out.
3. Not reported, found while looking: `https://jtrax-web-app.vercel.app/teacher`
   returned **200 to an anonymous visitor**, while `/parent` and `/student`
   correctly returned 307.

## Cause

**None of the three was a browser bug, and only one was really about auth.**

*Sign-in.* `LoginForm.tsx:11` and `LoginScreen.tsx:9` each hardcoded the local
seed password as a string literal, used by the "Demo accounts" shortcut buttons.
Once the deployed backend was seeded from `JTRAX_SEED_PASSWORD` (see
[[public-url-forced-two-security-fixes]]) those literals were stale, so every
shortcut returned 401. Chrome appeared to work because its password manager
autofilled the real password — and clicking a demo button *overwrote* it with
the stale one. Driving the same flow in Chrome and WebKit produced identical
failures, which is what ruled the browser out. The admin console seemed fine
only because that password was typed rather than clicked.

The admin screen was the worse of the two: it rendered the password into the
page through an `auth.demoHint` string, so the public login page was printing a
credential to every visitor.

*Sign-out.* `signOut` had existed in `app/actions/auth.ts` since the portals
were wired up, and nothing ever imported it. Two controls looked like a way out
and were both `<Link href="/">`: the parent profile's **Log Out** button and the
teacher sidebar's **Switch role**. Each navigated home without touching the
cookie, so `app/page.tsx` resolved a live session and redirected straight back
in. A dead control is worse than a missing one — it reads as "logout is done".

*Teacher guard.* This one traces directly to [[teacher-portal-hidden]]. The
Teacher card was pulled from the landing chooser as a visibility-only change,
and that note recorded the routes were "still reachable by URL". When auth
arrived later, guards were added to the layouts of the two portals reachable
from the UI and the invisible one was simply never revisited. Hiding an entry
point does not gate a route, and it removes the thing that would have reminded
anyone the route exists.

## Fix

- `app/teacher/layout.tsx` — resolves the session with `fetchMe` and redirects
  unless the role is `Teacher`, the same gate the other two layouts already had.
  (jtrax-web-app PR #18)
- `components/LoginForm.tsx` — shortcuts and the password literal removed; the
  card is a plain email + password form with one line saying parents and
  students each hold their own account. Retired the dead role-picker strings and
  the tagline that still read "Choose how you want to sign in".
  (jtrax-web-app PR #19)
- `components/SignOutButton.tsx` (new) — owns the form post and pending state
  only; each portal supplies its own className, since the three share no visual
  language. Wired into the parent profile, teacher profile, teacher sidebar and
  the student game's Profile tab, replacing both dead links. `nav.switchRole`
  deleted — the account's `role` column fixes the role, so there is nothing to
  switch. (jtrax-web-app PR #20)
- `components/LoginScreen.tsx` — constant, chip grid, hint line, the
  `jt-pick-grid`/`jt-pick-chip` CSS and the `auth.demoTitle`/`auth.demoHint`
  strings all removed. (jtrax-admin PR #15)

## Prevention

There is **no automated test for any of this** — `jtrax-web-app` has no test
harness at all, which is the real gap. Everything was verified by driving the
flows against a local backend in a real browser: each role signing in and
landing in its own portal, each sign-out control clearing the cookie *and*
leaving the backend token revoked (`/auth/me` → 401), and the teacher guard
checked in all three directions (anonymous, correct role, wrong role).

Two rules worth keeping:

- **A guard belongs on the layout, not on the entry point.** If a route exists,
  it is reachable; hiding the link that leads to it protects nothing.
- **When a symptom sounds environmental — "only in Chrome", "only on my
  machine" — reproduce it in two environments before believing the framing.**
  Here the browser was a coincidence of autofill, and taking it at face value
  would have sent the search somewhere with no bug in it.

The design question behind the login change is settled: the account carries the
role (`user_account.role`, migration `0001`), so a role picker on a sign-in form
can never decide anything and must not appear to.

Related: [[public-url-forced-two-security-fixes]], [[teacher-portal-hidden]],
[[deploying-jtrax-backend]], [[backend-crud-and-live-portals]]

Tags: #bug #security #auth #web-app #admin
