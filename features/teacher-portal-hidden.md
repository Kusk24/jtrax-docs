# Teacher portal hidden from the role chooser

**Date:** 2026-08-09 · **Repos:** `jtrax-web-app` · **Branch:** `feature/hide-teacher-portal` (PR pending)
**Status:** superseded by [[0008-the-academy-has-no-teacher-role]] (2026-08-23) —
the portal is deleted, in the web app and on mobile. The "restored instantly"
option below is gone, which was the point of the decision.

The client doesn't need the teacher role for now, so the Teacher card was
removed from the landing-page chooser (`app/page.tsx` — roles array now
Student + Parent, grid `sm:grid-cols-2`). All `/teacher/*` routes, components
and translations are intact and still reachable by URL; this is a
visibility-only change so the portal can be restored instantly or deleted
later once the decision is final.

If the portal is removed entirely later, also delete: `app/teacher/`,
`components/Teacher*`, `components/CheckinHeader.tsx`, `components/RosterRow.tsx`,
the `teacher*`/`dismissal`/`ongoing` message namespaces, and the teacher
entries in [[portal-redesigns-from-claude-design]]-era notes referencing
dismissal ([[web-app-teacher-dismissal]]).

**Done on 2026-08-23, and that list was short.** It missed `PortalNav`,
`SessionProgress`, `CreditSummaryCard`, `AttendanceHistoryList`, `Avatar`, the
four teacher types in `lib/types.ts`, and — the one that would have broken
sign-in — `homeFor` in `lib/session.ts`, which routed a Teacher account at
`/teacher` whatever the chooser showed. Hiding a card is not the same as
removing a portal; the URL and the redirect both outlived it. See
[[0008-the-academy-has-no-teacher-role]].

Tags: #feature #web-app #teacher
