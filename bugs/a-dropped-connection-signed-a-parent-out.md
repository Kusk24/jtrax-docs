# A dropped connection signed a parent out

**Found:** 2026-09-19 · **Fixed:** 2026-09-20 (mobile #22) · **Repos:** `jtrax-mobile-app`

## Symptom

Opening the app with no connection — a train in a tunnel, Wi-Fi dropping — sent a signed-in parent to the sign-in screen, as if their session had expired. Their password was never wrong, so typing it again did nothing until the network came back.

## Cause

On launch `SessionProvider` (`src/lib/session.tsx`) checks the stored token with `GET /auth/me` before trusting it. Its `catch` cleared the token on **any** failure. A server that *refused* the token and a server that never *answered* look the same at the call site, and the code treated both as "signed out".

## Fix

`clearsSession` in `src/lib/session-recovery.ts` decides: only a failure the server answered (401, 403, or a reply the app cannot parse) clears the token. An unreachable server (`ApiError.status === 0`) keeps it and sets `offline`. `RequireRole` then shows "Cannot reach the server — you are still signed in" with **Try again**, which re-runs the check.

Driven as Expo web: backend stopped → the offline card, still signed in; backend restarted and Try again → straight back to the parent home; a forged token → 401, cleared, sign-in.

## Prevention

`src/lib/session-recovery.test.ts` pins the rule. It lives apart from `session.tsx` because anything importing `expo-secure-store` drags in native modules the test runner cannot load — the same reason `portal-tabs.ts` sits apart from `PortalNav.tsx`.

Related: [[the-phone-gets-the-parent-portal]], [[mobile-app-port]]

Tags: #bug #mobile #auth
