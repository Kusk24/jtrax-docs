# Settings in two columns

**Shipped:** 2026-09-04 · **Repos:** `jtrax-admin` · **PRs:** #103 (reverted),
#104

Settings is one tab whose page divides in two, the way the parent portal's
settings screen does.

```
Settings
──────────────────────────────────────────────
Academy Rules       │  Appearance
  Low credit        │    Auto | Light | Dark
  Expiring soon     │
  Inactive student  │  LINE Official Account
  Certificate       │    token, secret, webhook
  Reset / Save      │
──────────────────────────────────────────────
Admins                          (full width)
```

## The misread, which is the point of this note

Asked for: *make the admin settings follow the parent settings, like two
divided setting pages for settings.*

#103 read "two divided setting pages" as **two nav entries** and split the
section into Profile and Settings. It shipped, and the correction was immediate:
*no, what I mean by splitting is the whole tab area, not splitting into two
tabs.*

Both readings are available in the words. What settles it is the thing being
pointed at — **the parent portal's settings screen is one tab in a two-column
grid**, and that is visible in `app/parent/settings/page.tsx` in a line:

```jsx
<div className="grid content-start gap-5 md:grid-cols-2 md:gap-x-6">
```

That file had already been read twice in the same session, for other work. The
model named as the model was the answer, and the reading went to the
*organisational* meaning of "split" instead of the *visual* one because the
preceding work had all been about role boundaries and page structure. **Context
from the last task is a prior on the next one, and it is not always the right
prior.**

The cheap check was open: pull up the screen being pointed at and see what shape
it is, before deciding what shape to copy.

## What #104 does

`jt-duo` — the console's own two-column grid, one column until 880px — around
two flex columns, with the header above and the roster below.

- **The 820px reading cap came off.** It existed to keep lines of prose short,
  which a half-width column does by itself; keeping both would have made each
  column 410px.
- **The staff roster stays full width, under both columns.** It is a table and a
  card grid, not prose, and halving it puts a roster in a 400px box. The page
  already had this instinct — the old layout capped the prose at 820 and let
  Admins run wide — so the columns inherited it rather than inventing it.
- **A receptionist gets no grid at all.** Only Appearance is theirs, and one
  card beside an empty half reads worse than one column.
- **The theme's heading moved above its card** rather than sitting inside the
  card's flex row, so both columns read the same way: a heading, then what it
  names. It had been inside the card because it had no column to head.

## Testing a layout without CSS

jsdom has no layout, so the unit tests assert the **structure the stylesheet
acts on** — that `.jt-duo` exists with two children, which block is in which
one, that the roster is outside them, and that "Appearance" is printed exactly
once. That last one is a duplicate-heading guard: the heading moved, and the
version where it moved *and* stayed would have looked fine to every other
assertion.

Geometry was measured in a real browser instead, at two widths, reading
`getBoundingClientRect` rather than class names:

```
admin @ 1440   columns "572px 572px"
               Academy Rules left 256 top 162
               Appearance    left 844 top 162   → side by side
               Admins        left 256 top 857   → below both
admin @  800   columns "772px"                  → stacked
desk  @ 1440   no grid, Appearance alone
```

**A class name is not a layout.** `.jt-duo` was present at 800px too — the grid
collapses to one column by media query, so asserting the class would have
claimed two columns on a laptop that has one.

## What #103 leaves behind

Nothing in the code: reverted whole, including the Profile page, the reroute
table and the message-namespace moves. Recorded here because the *reasoning*
in it was sound and may be worth having later — Settings does hold one personal
preference among three blocks of academy configuration, and that is why the
section is open to the front desk at all. If the console ever grows a real
profile screen, that is the argument for it.

Related: [[the-nav-loses-two-tabs]], [[dark-theme-in-both-consoles]],
[[one-shape-for-every-detail-view]], [[one-typeface-across-every-app]]

Tags: #feature #admin #ux #layout
