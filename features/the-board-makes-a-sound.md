# The board makes a sound

**Shipped:** — (in review since 2026-09-24) · **Repos:** `jtrax-web-app` · **PR:** web #74

Every move now makes the sound a chess player expects — a wooden knock, a sharper one for a capture, a ring for check — and a speaker button turns it off.

## Why

The board was silent, so a child could not tell by ear that the computer had answered. Every chess site people already use gives moves a sound; the academy asked for the classic kind, not music.

## How it works

- **The sounds are synthesised, not downloaded.** chess.com's and Lichess's files are not ours to ship. `scripts/make-sounds.mjs` models a wooden piece on a wooden board (a filtered noise burst exciting a few damped resonances, over a low thump) and bell partials for the chimes. It is seeded, so it reproduces the seven `public/sounds/*.wav` files byte for byte. About 360 KB, fetched only where a board is shown.
- **Which sound** — `lib/sound/kind.ts`: check outranks promotion, castle, capture, then a plain move. A puzzle's reply arrives as a position, so `moveBetween` recovers the move from the two positions either side of it.
- **Playing** — `lib/sound/player.ts`, Web Audio so sounds can overlap. Decoded on first play, not on load, so no AudioContext exists before the player has touched the page.
- **Where** — `ChessBoard` plays on each new `lastMove` (computer and classmate games), skipping the first render so a resumed game is quiet. `ResultDialog` plays the end bell. The puzzle board in `StudentGame` is wired separately: the pupil's move, the reply a beat later, a low knock for a wrong move, the bell when solved.
- **The switch** — `lib/sound/setting.ts`, on by default, remembered per device in `localStorage`, still honoured in a private window where storage refuses.

## Decisions made along the way

- Original sounds over familiar ones: licensing, not taste. If the academy later licenses a real set, only the `.wav` files change.
- WAV over MP3: every browser decodes it, and the set is small enough that compression was not worth a build step.

## Follow-ups

- [ ] Someone has to **listen** to them — they were verified by measurement (no clipping, capture brighter than move) and by logging which sound plays for each move, not by ear.
- [ ] The phone app is still silent. The same files would work through `expo-audio`.

Related: [[the-phone-catches-up-with-the-portal]], [[puzzles-from-a-real-bank]]

Tags: #feature #web #game
