# The theme pill showed Auto over a dark screen

**Fixed:** 2026-09-04 · **Repo:** `jtrax-admin` · **PR:** #107

Reported plainly: *the theme picker auto is always selected.*

It was. Whatever the account held, the pill lit **Auto** — while the console
around it was correctly dark, on every screen, across refreshes.

## What was not broken

Almost everything, which is why it took a browser to see it:

- The click saved. `PATCH /auth/me` returned 200.
- The account held it. `/auth/me` came back `themePreference: "Dark"`.
- The root layout applied it. `<html data-theme="dark">`, server-rendered.
- The console *was* dark.

Only the control lied about the state it was controlling. **A wrong indicator
over correct behaviour is harder to trust than a broken feature** — the office
cannot tell whether the setting failed or the screen did.

## Why

The initial state was read from the DOM:

```tsx
const [theme, setTheme] = useState<Theme>(() => {
  if (typeof document === "undefined") return "System";
  const attr = document.documentElement.dataset.theme;
  return attr === "dark" ? "Dark" : attr === "light" ? "Light" : "System";
});
```

with a comment explaining the choice: *a lazy initialiser, not an effect — the
attribute is there before React runs.*

That is true in the browser and beside the point. **A `"use client"` component
is server-rendered first**, and on the server `document` does not exist, so the
guard returned `"System"` and the server emitted HTML with Auto pressed.

The client initialiser then computed `"Dark"` — and React threw the result
away, because it does not reconcile attribute mismatches during hydration. It
said so, in the console, every single load:

> A tree hydrated but some attributes of the server rendered HTML didn't match
> the client properties. **This won't be patched up.**

The bug was reporting itself, in the place a person looks last.

**The shape:** an SSR-safe *guard* is not an SSR-safe *value*. `typeof document
=== "undefined"` stops the crash and quietly makes the server's answer wrong,
and a wrong answer that renders is worse than one that throws. Any initialiser
with that guard in it is a claim that the fallback is correct on the server —
and here it never was.

## Fix

The theme reaches the picker the way the signed-in person already does:
resolved from the session cookie in `app/(app)/layout.tsx`, handed down through
`JtraxContext`, read with `useJtrax()`.

**A value the server renders has to come from something the server can see.**

`app/layout.tsx` was already reading `me.themePreference` to set `data-theme`;
the app layout now takes the whole identity rather than just the person, so both
come from one resolve rather than two.

## The test, and why jsdom would have missed it

`renderToString`, deliberately: it inspects the markup the browser is stuck
with. **A test that mounts the component in jsdom passes against the broken
version**, because `document` exists there — jsdom is the browser half of the
problem, never the server half.

Confirmed by running the new test against the old code before keeping it:

```
× presses Light when that is what the account holds   expected 'Auto' to be 'Light'
× presses Dark  when that is what the account holds   expected 'Auto' to be 'Dark'
× shows the saved theme without being touched         expected 'false' to be 'true'
```

Three more assertions came out of writing it: exactly one button pressed per
theme (two would mean the pill is showing two answers), that choosing one sends
`{themePreference}` to the account, and that Auto **clears** `data-theme`
rather than writing `"system"` — following the machine is the absence of a
value, not a value of its own.

Verified in a real browser, each theme chosen and then the page reloaded:

```
chose Light  → after reload pill=Light  (n=1)  html=light  account=Light
chose Dark   → after reload pill=Dark   (n=1)  html=dark   account=Dark
chose Auto   → after reload pill=Auto   (n=1)  html=null   account=System
hydration errors: 0
```

Related: [[dark-theme-in-both-consoles]], [[settings-in-two-columns]],
[[the-console-asked-for-things-it-could-not-keep]]

Tags: #bug #admin #ssr #react
