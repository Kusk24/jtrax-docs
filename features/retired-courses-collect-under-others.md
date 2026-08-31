# Retired courses collect under Others

**Shipped:** 2026-09-01 · **Repos:** `jtrax-admin` · **PR:** #91

Class History's course filter lists the courses the academy still runs.
Everything else is one **Others** entry.

## Why

It read `raw.classes` straight, while the Students screen's filter has always
gone through `classFilterOptions`, which drops archived rows. So this was the
last place in the console presenting a course nobody can enrol in as a thing
you could pick — and on an academy that has retired a few, most of the filter
was dead names.

They cannot simply go, though. A retired course keeps its past
([[0007-retire-a-row-instead-of-deleting-it]]), so its classes are in this
history for good, and a filter that cannot reach them makes them findable only
by scrolling. One Others entry keeps them reachable without giving every dead
name its own line.

## How it works

`components/pages/ClassHistoryPage.tsx` builds its options from
`liveClasses(...)` and appends `OTHER_COURSES` — but **only when something is
in it**, so an academy that has never retired a course is not given an option
that always finds nothing.

Others catches two different situations for the same reason: a class whose
course is archived, and a class whose course row has gone entirely. Neither has
a live name to be filed under.

## Decisions made along the way

- **Matching moved from the course name to its id.** By name was near enough
  until two courses shared one — then a class of the retired "Saturday Camp"
  answered a filter for the live one. The row already carried `classId`; it
  just was not what the filter compared.
- **Others is a sentinel, not `""`.** Empty is All, and it must not be a value
  a real course id could ever take.

Related: [[0007-retire-a-row-instead-of-deleting-it]],
[[a-class-is-what-a-session-was]], [[credits-follow-the-child]]

Tags: #feature #admin #ux #courses
