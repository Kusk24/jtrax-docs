# Student challenges

**Shipped:** 2026-08-19 · **Repos:** `jtrax-backend`, `jtrax-web-app` · **PR:** jtrax-backend#28, jtrax-web-app#31

A pupil can search for another pupil by name or player ID and invite them to a game. Accepting produces a board both are already seated at.

## Why

A board could only be minted by staff and handed out as a code, so two children who wanted a game had to ask an adult for one. Everything needed for a pupil-initiated game already existed — rooms, seats, the live event stream, the Lichess relay — except the invitation.

## The search, and the decision behind it

Searching by name lets any signed-in pupil list other children's names. That was an explicit product decision: the alternative (classmates only) means two friends in different class times can never challenge each other.

The decision does **not** extend past a name. `GET /api/v1/players/search` returns a name, a student id, and whether the account can play rated — never an email, date of birth, parent or rating. `TestSearchReturnsNothingBeyondANameAndId` fails if any other field ever appears.

Other brakes on it: session required and `canPlay` only (a parent gets 403), 60/min, a two-character minimum so one letter cannot return the roll, and the searcher never appears in their own results.

The exact-id path exists so a friend in another class can be reached by sharing the id shown on their own profile, without being findable by name at all.

## How it works

`0016_student_challenges.sql` adds `game_challenge` — deliberately not a room in a "Pending" state. A room that was never accepted is not a game that was never played; it is a conversation that went nowhere, and it should not hold a code or appear in anybody's history.

A partial unique index allows one live invitation per direction, so holding down the button cannot fill an inbox. Declined rows are excluded: a decline is "not now", not "never".

Accepting mints the room and seats both players in one transaction — `internal/api/challenges.go`, `mintRoom()`, factored out of `handleCreateRoom` so a challenge board is the same kind of board the console hands out. The challenger takes White, because somebody has to and "the one who asked" is a rule a child can predict.

Portal: `app/student/challenge/`, a route rather than a screen in `StudentGame`'s state — a pupil who follows an invitation or reloads should land there, not at home.

## Decisions made along the way

- **Rated warns rather than hides.** Ticking rated against an unlinked opponent says so, on the search row and again on a pending invitation. A pupil who cannot see the option cannot find out why; "you both need a Lichess account" is something they can go and fix.
- **A gap the relay would have had.** Both seats fill at once, so nothing would have started the Lichess relay — `handleJoinRoom` triggers it when Black sits down, and nobody sits down here. A rated challenge would have shown a rated badge on a game that never reached Lichess. `mountGameRooms` now returns its relay for the accept path to use, rather than a second relay double-forwarding every move.

## Follow-ups

- [ ] Challenges never expire; a pending invitation sits in an inbox forever.
- [ ] Nothing notifies the challenged pupil outside the screen itself — no LINE message, no badge on the home nav. The screen polls every 5s while open.
- [ ] Nothing throttles repeat pairings, so two pupils could play each other for rating points unsupervised — the same boosting risk already noted in [[rated-games-on-lichess]].

Related: [[rated-games-on-lichess]], [[lichess-ratings-in-jtrax]]

Tags: #feature #games #security
