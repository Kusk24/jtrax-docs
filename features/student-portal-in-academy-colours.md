# Student portal in the academy's colours

**Shipped:** 2026-08-20 · **Repos:** `jtrax-web-app`, `jtrax-admin` · **PR:** jtrax-web-app#32, #33, jtrax-admin#53

The student portal stopped being a warm cottage with a cat and became the academy's own product: navy `#24417C` on `#F7FAFD`, sampled from jcachess.ac.th's computed styles rather than eyeballed.

## What changed

- **The cat (Mochi) is gone entirely** — the peeking art, the feeding screen and its pointer-drag handler, the paw corners, the fish, eleven image assets, and the strings that only described them. The profile avatar (the cat's face) is the pupil's initial.
- **The `sv-*` tokens were renamed as well as recoloured.** They were literally `sv-brown` and `sv-peach`; a token called brown holding navy misleads the next reader. They are roles now: `ink`, `body`, `primary`, `accent`.
- **The corner badge is one real number.** It showed hard-coded "10 stars / 32 fish" where a child would read them as earned. It now shows their synced Lichess rating (rapid first, puzzle last — puzzle is not playing strength), and is *absent* rather than zero with no linked account.
- **Screens were re-laid in flow.** The old home pinned its one card at `top-449` because a cat and sofa filled everything above; deleting the art left a 320px hole that pixel-ratio checks called "fine". Home is now greeting → stat tiles → daily card → Play/Challenge actions.
- **Route screens got the bottom nav** (`StudentBottomNav`): `/student/play` and `/student/challenge` had none, stranding a child behind a corner arrow. Items link to `/student?screen=…`, which also made the state-held screens addressable.
- **Console tournament links unified** into one `ShareLink` (QR + full selectable URL + 44px labelled Copy/Open) replacing the 34px icon-only copy button on the results card.

## Lessons that cost time (all verified the hard way)

- **axe does not check contrast against CSS gradients.** Four headings were navy-on-navy over the new navy wash and axe called the screens clean. The catch was sampling rendered pixels under each `<h1>` (variance < ~12 ⇒ invisible).
- **A green colour audit cannot see a broken layout.** The 320px void shipped behind "warm/cool pixel ratio correct, axe clean". Per-band DOM occupancy (largest empty band per screen) is the check that found it.
- **Tailwind v4 `@theme` edits can be served stale by `.next`.** The browser read the old token values while the file held the new ones; new tokens resolved empty. `rm -rf .next`.
- **`opacity-60/70` on brand navy fails WCAG** (`#24417C` → 4.3:1 or worse). De-emphasis uses the palette's `sv-body` (`#355575`, 5.6:1), never faded ink — including *inline* `style={{opacity}}`, which class-based sweeps miss.

## Follow-ups

- [ ] jtrax-mobile-app still carries the old cottage palette; the port ([[jtrax-mobile-app]] memory says web code copies near-verbatim) should pick up the new tokens.
- [ ] The daily-challenge streak still increments client-side on the third puzzle; nothing server-side guards it.

Related: [[student-challenges]], [[lichess-ratings-in-jtrax]], [[rated-games-on-lichess]]

Tags: #feature #design #student
