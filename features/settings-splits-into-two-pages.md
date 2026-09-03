# Settings splits into two pages

**Shipped:** 2026-09-04 · **Repos:** `jtrax-admin` · **PR:** #103

Profile is yours. Settings is the academy's, and admin-only.

## Why

Asked for directly: *make the admin settings follow the parent settings, like
two divided setting pages.* The parent portal has had the division since it was
built — Profile is who you are, Settings is what you set.

The console's Settings was one scroll holding four unrelated blocks: the
academy's credit thresholds, its LINE credentials, its staff accounts, and the
theme. Only the last belongs to the person reading it.

**The page had already written its own split**, one round earlier, in
[[the-nav-loses-two-tabs]]:

> the theme above belongs to whoever is signed in, but who *can* sign in is the
> office's to decide

That comment was there to justify a role check. It is the section boundary, and
it went unnoticed as one for a month. **A comment explaining why two things on a
page need different rules is usually describing two pages.**

| **Profile** — yours | **Settings** — the academy's |
|---|---|
| Name, role | Credit rules |
| Sign-in email, phone, branch | LINE channel |
| Appearance | Staff accounts |

## The receptionist is the reason this is worth doing

One theme card was the entire reason Settings had to be open to the front desk.
Everything else on the page was already gated — so a receptionist opened a
screen named after the academy's configuration and found a **single control**.

With the theme on Profile there is nothing on Settings that is theirs, so the
tab is not theirs either. **A page whose every block is gated should not be in
the nav**; a nav entry that leads to one usable control and three refusals is
worse than no entry.

## The guard moved for the third time

Worth tracking, because it is the same protection wearing a different mechanism
each round:

1. `admins` was an `adminOnly` **tab** — the nav kept the desk out.
2. [[the-nav-loses-two-tabs]] folded it into Settings, so **`isAdmin` inside the
   component** became the only thing between a receptionist and Create Admin.
   That note flagged it as "the risky half".
3. Now the **nav again**, because Settings itself is admin-only.

Each move was correct for its round and none of them changed what must be true.
The tests assert the invariant — *a receptionist never reaches the staff
accounts* — rather than the mechanism, which is why they survived all three.
They render through `SectionRouter` rather than the page component now, since
reaching past the router would test a page nobody in that role can open.

## A refusal that would have been true and useless

The front desk could open `/settings` yesterday, for the theme. The theme moved.
A bookmark or a habit landing them there is asking for a screen that **still
exists and is still theirs**, so `REROUTE_WHEN_BLOCKED` sends them to Profile
instead of the no-access notice.

Deliberately one entry, not a general redirect table. Every other refusal in the
console is a section with no counterpart for that role, and **quietly landing
somebody somewhere they did not ask for is worse than saying no** — the reroute
is only right because the destination is what they were actually after. A test
asserts every entry points at a section that role can reach, so a reroute cannot
send someone to another refusal or loop.

## Decisions made along the way

- **The theme's copy moved into the `profile` namespace**, where it renders.
  Copy that lives in the namespace of the page it left is the kind of thing that
  survives one refactor and confuses the next.
- **The card lost its title.** The section heading and the card were both going
  to say "Appearance", stacking the same word twice. The heading names the
  group; the card says what the choice actually does.
- **Profile says where a new password comes from.** It is exactly where somebody
  looks for a password field, and this console has never had one — staff use the
  sign-in page's link, or an admin sets one
  ([[a-child-signs-in-with-an-id]]). An absent control that is explained is not
  a missing feature; an absent control that is silent is.
- **`settings.subStaff` deleted.** It existed to word the page differently for a
  receptionist, and no receptionist reaches the page.

Related: [[the-nav-loses-two-tabs]], [[dark-theme-in-both-consoles]],
[[a-child-signs-in-with-an-id]], [[one-shape-for-every-detail-view]],
[[0004-console-roles-match-the-backend]]

Tags: #feature #admin #ux #nav
