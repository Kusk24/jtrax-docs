# Quick Actions open the form, not the tab

**Shipped:** 2026-08-23 · **Repos:** `jtrax-admin` · **PR:** #76

A dashboard pill named after an act now performs it: "Register Student" arrives
on the students page with the registration wizard already open. The roster filter
also stopped hiding children who are in two classes.

## Why

Every Quick Action pill is named after something the desk does — Register
Student, Record Payment — and every one of them landed on that section's **list**,
where the person still had to find the button that does it.

> A shortcut that shortens half the journey is a tab with extra steps.

The roster's class filter had a subtler version of the same problem. It filtered
on the student row's `className`, which is only ever the *first* active
enrolment — so a child in two classes was missing from the second one, which is
precisely the case the filter exists for.

## How it works

One query, read by every section that has something to create — `lib/quick-actions.ts`:

- `createHref(section, prefill)` → `/students?new=`, with the value prefilling
  the first field where the form has an obvious one, so the desk can search for a
  child on the dashboard, find nobody, and register them without typing the name
  again.
- `opensCreate(param)` → `param !== undefined`.
- `createParamOf(href)` — what `opensCreate` will be told, for a link
  `createHref` produced.

Read server-side in `app/(app)/[section]/page.tsx:32` rather than with
`useSearchParams`, which would bail the whole route out of server rendering.

The class filter reads the enrolments instead of the row
(`lib/student-classes.ts`): `isInClass` passes a child who is in *any* of them,
`classFilterOptions` offers only live classes (a retired one hands the desk a
filter that always comes back empty — see
[[0007-retire-a-row-instead-of-deleting-it]]), and the Class column now names
**every** class a child is in, so a row that turns up under a filter says why it
did.

## The trap: `?new=` is a request, and `""` is falsy

`?new=` means "open the form with nothing typed yet". An empty string is falsy,
so `if (param)` type-checks, lints, passes review — and opens nothing. Every
quick action silently lands back on the list it was meant to skip.

It bit twice. The second time was the remount key: `startNew ?? ""` collapses
*absent* and *present-but-empty* into the same string, so navigating from
`/payment` to `/payment?new=` kept the mounted list and the pill did nothing at
all. `SectionRouter.tsx:64` prefixes instead — `new:${startNew}` — so the two
states are distinguishable.

The test found that one. **The comment warning against exactly this was already
written directly above the line.**

## Decisions made along the way

- **One shared query, not a flag per page.** `?new=` is read the same way by
  students, payments, announcements and tournaments; a bespoke param per section
  is four chances to get the falsy check wrong instead of one.
- **Both ends are tested against each other**, not each asserting a string and
  hoping they agree: `createParamOf(createHref(...))` feeds `opensCreate`
  (`lib/quick-actions.test.ts`, `components/pages/QuickActionTargets.test.tsx`).
- **Verified against a real Next 16 server** that `?new=` arrives as `""` rather
  than being dropped from the query, since no component test crosses the router.

## Also in this PR

A test written in #75 that **only passed after lunch**: its fixture built "today"
with `toISOString()`, which is yesterday for the first seven hours of every
Bangkok morning. It uses `todayISO()` now (`lib/live.ts:331`) — the same day the
dashboard means — and passes from Kiritimati to Midway.

The enrolment row's Edit and Delete became a single **Withdraw**; that seam is
recorded in [[0007-retire-a-row-instead-of-deleting-it]].

## Follow-ups

- [ ] Most console screens still hold navigation state in `useState` — Students,
      Parents, Payments, Class History, Academy, Admins, Games. `?new=` and
      `lib/url-state.ts` are the tools; each screen still needs wiring. Tracked
      in [[ui-audit-2026-08-21]].

Related: [[0007-retire-a-row-instead-of-deleting-it]],
[[a-dismissal-that-looked-frozen]], [[one-shape-for-every-detail-view]],
[[ui-audit-2026-08-21]], [[admin-console-ux-pass]]

Tags: #feature #admin #ux
