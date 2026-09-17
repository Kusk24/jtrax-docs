# A tab is not somewhere you came from

**Found:** 2026-09-10 · **Fixed:** 2026-09-11 ·
**Repos:** `jtrax-web-app`, `jtrax-mobile-app` · **PRs:** web #61, mobile #13

Challenge and Play showed a back arrow beside their titles while sitting on the
bottom bar as tabs — offering to "return" to a place the child had not come
from.

## Symptom

Reported from a phone: *"why are there backbutton? lol i know it redirect but
like mobile page is like kinda odd you know"*, with a screenshot of
`/student/challenge` — an arrow in the corner, and the same screen's own tab
highlighted on the bar below it.

## Cause

`PlayShell` drew the arrow **unconditionally**, on web and on the phone. The
component already knew the difference and was not using it: web had a `nav`
prop meaning "show the bottom bar", which is the same fact as "this screen is a
tab".

The phone had it worse. Its bar is rendered by `src/app/student/_layout.tsx`,
not per screen, so it could not be switched off from a screen at all — every
play screen had **both** an arrow and a bar, including the boards, where the bar
eats the bottom of an eight-rank board.

## The rule

One rule seen from either end:

- **A tab** is left by the bar, so it takes no arrow.
- **Anything pushed** is left by the arrow, so the bar goes and the board keeps
  the whole phone.

## The part that was not obvious

Answering "is this screen a tab" needed a **second predicate**. The existing
`isActive` matches by prefix, which is right for highlighting — a board three
screens deep should still light Play up — and is exactly why it cannot be asked
this question:

```
"/student/play/ai".startsWith("/student/play")  // true
```

So a prefix match says every board is a tab. `isRoot` is the new one, and it
compares exactly. Both live in `jtrax-mobile-app/src/lib/portal-tabs.ts` rather
than in the nav component, because anything importing `react-native` or
`lucide-react-native` drags in Flow source the test runner cannot parse — so in
the component they could not be tested at all.

`PortalBottomNav` gained `rootsOnly`, which only the student portal passes. The
parent portal keeps today's behaviour; it is a separate piece of work.

## Verified

Both apps driven at 390px in system Chrome, tabs and pushed screens:

| | back arrow | bottom bar |
|---|---|---|
| `/student`, `/student/puzzles`, `/student/challenge`, `/student/play`, `/student/profile` | — | ✓ |
| `/student/play/ai`, `/student/play/friend`, `/student/play/room/…`, `/student/puzzles/…` | ✓ | — |

Mutation-checked: reverting `isRoot` to prefix matching fails five tests, each
naming a pushed route.

## Follow-ups

- [ ] The parent portal still shows its bar on pushed screens
      (`/parent/profile/[childId]`). Same rule, not yet applied.
- [ ] `jtrax-web-app` has no React component testing stack, so the web half of
      this fix is covered by a browser walkthrough only.

Related: [[the-phone-catches-up-with-the-portal]],
[[student-portal-in-academy-colours]], [[reference-ui-suite-pass]]

Tags: #bug #mobile #web-app #navigation
