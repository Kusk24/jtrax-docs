# The phone catches up with the portal

**Shipped:** 2026-09-11 · **Repos:** `jtrax-mobile-app`, `jtrax-backend` ·
**PRs:** mobile #12 · #13 · #14 · #15 · #16 · #17, backend #55

A pupil on the phone now gets the same portal they get in a browser: daily
puzzles, a challenge to a classmate, a Lichess account, and a home screen with
numbers they actually earned.

## Why

The mobile app was a port of `jtrax-web-app` **main as it stood in July**, and
the portal has been rewritten since — the student side became the reference
design in [[reference-ui-suite-pass]] (web #58) the day before this. The phone
was one whole generation behind, and the gap was not cosmetic:

| | portal | phone, before |
|---|---|---|
| Puzzles, streak | ✓ | absent |
| Challenge a classmate | ✓ | absent |
| Lichess link and ratings | ✓ | absent |
| Home | greeting, streak, daily challenge | a hard-coded "Penny" |
| Schedule / attendance / check-in | deleted | still there |

The last row is the one that needed a decision rather than a port. Those
screens went from the portal in `39dc4a9` when the game shell landed, because
**the front desk takes attendance** at the console
([[an-hour-of-class-costs-an-hour-of-credit]],
[[the-front-desk-remembered-nothing]]) — so a pupil has no check-in to do and
no register to read. The same reasoning
[[0008-the-academy-has-no-teacher-role]] applied to the teacher portal, which
had already gone from this repo.

The client confirmed the phone should match the portal exactly. The screens are
deleted, not hidden — hiding them is the state ADR 0008 describes as rot.

## How it works

Six seams, each a PR, in order:

1. **#12 — the endpoints.** `src/lib/puzzles.ts`, `lichess.ts`, `challenges.ts`,
   and the `sv2` / `challenge` / `lichess` message namespaces in EN and TH. All
   three go through `src/lib/api.ts`, so they carry the bearer token from the
   Keychain. **There is no same-origin proxy** — a native app has no origin —
   which is the only structural difference from the web clients.
2. **#13 — the back arrow.** A tab is left by the bar; anything pushed is left
   by the arrow. See [[a-tab-is-not-somewhere-you-came-from]].
3. **#14 — puzzles.** `/student/puzzles` and `/student/puzzles/[puzzleId]`. The
   solution never reaches the phone: a move is posted and the server answers
   with the verdict *and* the position. Same bank and same grader as
   [[puzzles-from-a-real-bank]].
4. **#15 — challenge.** Search, invite, accept, decline, at
   `/student/challenge`, against the endpoints from [[student-challenges]].
5. **#16 — the flip.** The portal's home, the five-tab nav
   (Home · Puzzles · Challenge · Play · Profile), and the removal of
   `schedule.tsx`, `attendance.tsx`, `checkin.tsx`, `notifications.tsx`, the
   `checkin` message namespace and `StudentHeader`.
6. **#17 — profile and Lichess.** `lib/student-data.ts` is deleted; the phone
   has no mock data left.

Boards reuse `src/components/game/ChessBoard.tsx` — tap-to-move, orientation
flip and promotion were already written and already right, so the puzzle screen
is wiring rather than a second board.

## Decisions made along the way

- **The screens go, they are not hidden.** The client chose this explicitly.
  → [[0008-the-academy-has-no-teacher-role]] for the precedent.
- **`nav.schedule` and `nav.attendances` stay.** The parent portal still uses
  both labels. Removing them with the student screens would have shipped the
  parent bar showing raw keys; caught before committing.
- **The portal's Free Play tab was not ported.** On web its three rows are
  `div`s with `cursor-pointer` and no click handler. A control that looks
  tappable and does nothing is worse on a phone than one that is absent.
  Either build it or delete it on web.
- **The search state was restructured, not ported.** The portal keeps `results`
  and `searching` apart, which leaves a window where the list answers a query
  the box no longer holds. The phone keeps the players found *and the query
  they were found for* in one piece of state, so both derive from one fact.
  Worth doing the same on web.
- **A test runner was added** (`vitest`, `src/lib` and the catalogues only, no
  React Native transform). The repo had no way to run a test at all.

## Two bugs found on web while porting

- **`sv2.ratingLabel` is called with no argument** on the portal's home
  (`StudentGame.tsx:505`). It is `"Rated {rating}"`, so that tile renders a
  missing-parameter error rather than a label. The phone shows the number over
  the format instead — "1450" / "Rapid" — and an em dash over "not rated yet"
  with no linked account.
- **An `APP_URL` with a path matched no origin at all**, silently stranding
  every pupil on the Lichess outcome page. Same bug as the phone's, fixed in
  backend #55.

## The backend change

**Auth path — `lichessoauth.go`.** A phone's return is a deep link, so
`MOBILE_URL` (`jtraxmobileapp://`) joins `APP_URL` and `ADMIN_URL` in
`returnAllowed`, and both sides are now reduced to `scheme://host` by a new
`originOf` before comparing. The old code trimmed one trailing slash and
compared strings, which could not hold a scheme with no host.

Only `?lichess=<outcome>` rides on that redirect — never a code or a token,
which is asserted in a test. A scheme is a landing place, not a delivery
channel. `MOBILE_URL` is optional; unset, behaviour is unchanged.

## Verified

Driven in a real browser (Expo web at 390×844, system Chrome) against a local
Go backend with a seeded database, not typechecked and assumed:

- **A real puzzle solved end to end.** Wrong move rejected, `Ba5xc3#` accepted,
  auto-advance to the next unsolved. Then read back from the database:
  `wrong_moves=1`, `opened_at` set on exactly the two puzzles opened and
  neither that was not, `streak=1` from the server.
- **A challenge between two accounts.** Penny invites, the API shows Uri an
  incoming `15+10`, Uri accepts on the phone and lands at a game room seated as
  Black.
- **A Lichess link against the live API.** A real public account that is not
  ours was linked, a code issued, and **`check` refused it** — the proof step
  reads the bio and cannot be talked out of it.
- Thai checked on the phone, not only in the catalogue: ปริศนา /
  ฝ่ายขาวเดิน — หาตาเดินที่ดีที่สุด, rendering in Mitr.

## Follow-ups

- [ ] **Set `MOBILE_URL` on the deployed backend** once #55 lands, or the
      Lichess grant links the account without returning into the app.
- [ ] **The parent portal is still a generation behind** — the portal's `pv2`
      rewrite has not been ported. This work covered the student side only.
- [ ] **No component tests on the phone.** The runner added in #12 is
      deliberately `src/lib`-only; rendering a NativeWind screen needs a preset
      and a mock per native module. `jtrax-web-app` has the same gap.
- [ ] Fix `sv2.ratingLabel` on web, and the search-state window in
      `ChallengeScreen.tsx`.
- [ ] `expo lint` sits at 169 problems, ~95 of them one rule
      (`react-hooks/set-state-in-effect`) fired by ordinary data loading. Worth
      deciding whether the rule earns its place.

Related: [[reference-ui-suite-pass]], [[0008-the-academy-has-no-teacher-role]],
[[puzzles-from-a-real-bank]], [[student-challenges]],
[[lichess-ratings-in-jtrax]], [[rated-games-on-lichess]],
[[playing-chess-in-the-portals]], [[training-our-own-chess-opponents]],
[[a-tab-is-not-somewhere-you-came-from]]

Tags: #feature #mobile #backend #lichess #puzzles
