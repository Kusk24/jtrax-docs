# The parent portal reads the real rows

**Shipped:** 2026-08-24 · **Repos:** `jtrax-web-app` · **PRs:** #43, #44 (child card revised)

A parent now sees their own children's real records — the class's actual next
session, real credit arithmetic, notifications derived from attendance stamps —
and when the backend is unreachable the portal says so instead of quietly
showing sample children.

## Why

The console got real ([[backend-crud-and-live-portals]] and everything since);
the parent portal only looked it. Three complaints, all confirmed in code:

1. **Class times, branch, room and teacher on the child screen were
   placeholders.** `ParentData.tsx` mapped real students and then invented the
   rest: `sched: "Mon & Wed"`, `time: "2:00 – 3:00 PM"`, `branch: "Bangkok"`,
   `room: "Room 1A"`, and `teacher: teachers[0]` — the academy's first teacher,
   whoever the child's was.
2. **Backend down → sample children.** Every collection initialised from mocks
   and stayed there on any fetch failure. Penny and Uri, indistinguishable from
   a family's real children — the worst finding class in
   [[ui-audit-2026-08-21]], mock data rendered as live.
3. **Read marks were `useState`** — gone on every navigation. And the
   notifications list itself was mock end to end even when everything else was
   live, linking to child ids that 404'd.

## How it works

`components/parent/ParentData.tsx` joins twelve collections (now including
`parents` and `parent-contacts` for identity) and exposes a `status`:
`loading | live | error`. No screen renders until data is real; the error state
is a card with a retry. The layout guard learned the same distinction —
`fetchMeOrDown` in `lib/session.ts` returns `"down"` on a network failure, so a
signed-in parent whose server restarts sees "cannot reach the server" instead of
being bounced to login as if their account were gone. A side effect of holding
no mock children: refreshing `/parent/child/<id>` no longer 404s.

- **The schedule is the class's next session on the books** — date, start, end.
  Sessions are written one at a time by the desk
  ([[create-session-would-not-press]]); no weekly pattern exists to display.
- **Removed rather than faked: branch, room, teacher.** The schema has no room
  or branch column and no teacher-to-class link anywhere (checked: `teacher_id`
  appears only as the teacher table's own key). The card shows schedule, credits
  expiry, level and enrolled-since instead — all real columns.
- **Real arithmetic**: credit bars divide by credits actually bought, not `/20`;
  attended-of-held from the class's real sessions; "classes left" is the count
  of scheduled future ones; age from `date_of_birth`; fractional credits
  rounded the way the console rounds them
  ([[an-hour-of-class-costs-an-hour-of-credit]]).
- **Notifications derive from rows that record what happened**: check-in and
  pick-up stamps from `attendance`, plus an expiry within 14 days — filtered by
  the parent's existing notification preferences. An expiry already past reads
  **Expired**, not "expiring soon · 0 days". Read marks persist in
  localStorage keyed by parent id; there is no per-notification table in the
  backend to keep them in, and [[notifications-system-plan]] is where a real
  one is sketched.
- **The calendars show the three most recent months** (`recentMonths` in
  `lib/parent-v2-data.ts`) with today ringed from the clock, replacing a fixed
  Apr–Jun 2026 whose "today" was hard-coded to two different dates.
- **Identity**: the sidebar, greeting, profile contacts and the tournament
  registration prefill read the signed-in account. The prefill used to arrive
  filled with a sample parent's email, and a family who did not notice
  registered their child under it.

## Decisions made along the way

- **Absent data is absent, not defaulted.** Faking a room number is how the
  desk stops trusting the screen; if the academy wants teacher/room on the
  card, that is a backend schema change first (no teacher-to-class link
  exists — see [[0008-the-academy-has-no-teacher-role]] for why the teacher
  half is currently moot).
- **localStorage for read marks, not a backend table.** Per-device rather than
  per-account is the accepted cost; the alternative was inventing schema from
  the front-end.
- **`fmtDate` stays en-GB** across the portal — localising all date formats is
  a separate pass; the two new date sites (today's date, notification stamps)
  do use the locale, including the Buddhist year in Thai.

## Verified

Driven in Chrome at 390px against a locally seeded backend: signed in as the
seeded parent, then wrote a session, a check-in, a dismissal and practice
minutes through the API as staff — all four appeared on home, the child page
and notifications. Marked one notification read, reloaded: 4 unread became 3
and stayed 3. Killed the backend: the error card with retry, no sample
children, no login bounce. `tsc`, `next build`, 8/8 tests.

## Revisited: the child card's numbers, 2026-08-24 (#44)

The academy's feedback after a real class change reshaped the card:

- **The balance stands alone.** "16.5 / 36.5" — the denominator summed
  everything ever added, so top-ups grew it forever and a moved-in balance
  counted on top of the original purchase, reading as doubled after a class
  change. History shown as a quota; removed, with the "credits remaining" bar.
- **No upcoming-session line after all.** #43 showed the class's next session
  as the schedule; the academy's point is that a session written one at a time
  is not a plan a parent can put in a calendar. Gone.
- **Attended-of-50.** A certificate is awarded after 50 classes
  (`CERT_SESSIONS`, `lib/parent-v2-data.ts`) — the classes block counts toward
  that milestone instead of session tallies that shifted with every purchase.
- **History rows keep their session's own class.** They printed the child's
  *current* class, so a move relabelled a term of old rows overnight.

## Follow-ups

- [ ] The student portal (`sv2`) has its own hard-coded today in the message
      catalogue; the mobile app is still "real login, mock everything else" —
      both tracked in [[ui-audit-2026-08-21]].
- [ ] Read marks are per-device. A `notification` table with a read flag is the
      real fix — [[notifications-system-plan]].
- [ ] The profile's "Contact school" phone number is static content.

Related: [[ui-audit-2026-08-21]], [[an-hour-of-class-costs-an-hour-of-credit]],
[[create-session-would-not-press]], [[backend-crud-and-live-portals]],
[[notifications-system-plan]], [[web-app-parent-frontend]],
[[0008-the-academy-has-no-teacher-role]], [[a-dismissal-that-looked-frozen]]

Tags: #feature #web-app #parent #data
