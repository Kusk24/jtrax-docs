# The payment step crashed on a navigation error

**Found:** 2026-10-06 · **Repos:** `jtrax-mobile-app` · **Fixed in:** mobile #61 (first commit)

On the phone, a parent tapping **Continue to Payment** in the tournament flow got
a red screen: *"Couldn't find a navigation context. Have you wrapped your app
with 'NavigationContainer'?"* The bug was already on main.

## Symptom

The message points at navigation, and the source frame points at `usePalette()`
on the screen's first line. Neither is the cause. It reproduced on a cold
launch, so it was not a stale hot reload. The stack is what gives it away: a
long run of `replace` and `stringify` frames inside
`react-native-css-interop`, ending in `printUpgradeWarning`.

## Cause

`src/app/parent/tournament.tsx` renders its stages (event, entry, payment,
done) as early returns, each a `<ScrollView>` in the same position. React reused
one stage's views for the next and changed their `className`s.

NativeWind cannot apply a new kind of style to a view after its first render.
It remounts the view and, in development, prints a warning that serialises the
view's original props. Those props reach expo-router's navigation context,
whose getters throw when read outside a navigator. So the warning itself
crashed the render.

## Fix

Each stage's root `ScrollView` gets its own `key` (`detail`, `register`,
`payment`). Moving between stages mounts a fresh tree, so nothing is restyled
after its first render. Each stage now also opens at the top, where before it
kept the previous stage's scroll position.

## Lesson

In this app, a screen that swaps between whole layouts in one component should
key each layout's root. If *"Couldn't find a navigation context"* appears inside
a portal that plainly is inside a navigator, check for `printUpgradeWarning` in
the stack before suspecting the router.

Related: [[the-phone-matches-the-redesigned-portals]], [[the-phone-gets-the-parent-portal]]

Tags: #bug #mobile #nativewind
