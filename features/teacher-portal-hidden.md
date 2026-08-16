# Teacher portal hidden from the role chooser

**Date:** 2026-08-09 · **Repos:** `jtrax-web-app` · **Branch:** `feature/hide-teacher-portal` (PR pending)

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

Tags: #feature #web-app #teacher
