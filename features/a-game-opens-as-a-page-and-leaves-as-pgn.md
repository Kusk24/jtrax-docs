# A game opens as a page, and leaves as PGN

**Shipped:** 2026-08-23 · **Repos:** `jtrax-admin`, `jtrax-backend`
**PRs:** console #77 #78, backend #37

Staff can open a game as a full page, export its moves as PGN, and throw away a
room that was never a record.

## Why

Three things about the Games screen, all reported from the console.

**The detail was a 460px drawer**, on the theory that staff watch a board *while*
doing something else. In practice it is the thing they came to look at, and a
board, two players and a move list do not fit in a column that narrow — the board
came out small and the moves were a scrollbar inside a scrollbar.

**There was no way to be rid of a room.** `DELETE /game-rooms/{id}` has always
meant *cancel*: it ends a game that is happening and keeps the record, because a
game that was played is a record. But most rooms are not records — a code minted
for a lesson that did not happen, a board opened twice by mistake, three test
rooms from the afternoon somebody spent learning the screen. They pile up at the
top of the list.

**Export gave a coach a spreadsheet.** Every other list in the console exports
CSV because every other list ends up in one. A game does not: a column of
`e4, e5, Nf3` is a chess game with the chess taken out.

## How it works

### The page

`components/pages/GamesPage.tsx` — the list gives way, a Back link returns, and
the board sits beside the moves instead of above them, the same shape a student's
detail uses ([[one-shape-for-every-detail-view]]). The list itself moved onto a
white card; it had been rendering straight onto the page background, so it read
as floating text.

### Delete is its own endpoint

`DELETE /game-rooms/{id}/record` (`internal/api/games.go:690`) removes the room
and its moves; `lib/games.ts:67` calls it. **Separate from cancel rather than
repurposing DELETE**, because an older console still sends DELETE for "Stop this
game" and having that destroy a board during a deploy window is exactly the
accident worth designing out.

A game being played is refused with 409 (`games.go:630`) — the two players are
mid-move, and the fix for a game that should not be running is to stop it, which
is the other endpoint and undoes far less. `game_move.game_room_id` is NOT NULL
so the moves go with the room; a challenge's link is nullable and the challenge
is its own record of who asked whom, so that one is unhooked rather than
destroyed.

Offered from the list as well as the detail, since the rooms most worth clearing
are the ones nobody ever opened.

### PGN — `lib/pgn.ts`

Two faults only a real reader could have found, both of which fail silently
because **PGN fails by parsing into an empty board rather than by complaining**:

- **The standard says to escape a quote in a tag as `\"`.** chess.js — the
  parser this console draws its own boards with — rejects the whole file at the
  first one, and it is not alone. A pupil with a nickname in quotes would have
  exported a game that opens nowhere. `tag()` writes a single quote instead: the
  name still reads as itself, and the file opens.
- **The Date tag was a day out.** Rooms are stamped with SQLite's
  `datetime('now')` — UTC, written with no marker to say so — so every game
  played before seven in the morning in Bangkok exported as yesterday.
  `pgnDate()` marks the string as UTC first, then asks for its local calendar
  date. Slicing the string would take the UTC day; handing it to `new Date`
  unmarked would shift the instant by seven hours instead.

The second one was only visible by reading a file that had actually been
downloaded.

## Decisions made along the way

- **Cancel and delete are different acts and both are wanted.** Cancelling ends a
  game that is happening; deleting throws away a record that was never one.
- **Delete is not offered on a board two people are playing.** Stopping that is
  the reversible act, and the backend refuses it anyway.
- **PGN, not CSV, for this one list** — because the destination is Lichess with
  an engine on it, not a spreadsheet.

## Follow-ups

- [ ] The PGN carries the Seven Tag Roster only. Result and termination are
      written from the room's own status; ratings and time control are not
      exported because the console does not record them per game.

Related: [[playing-chess-in-the-portals]], [[rated-games-on-lichess]],
[[one-shape-for-every-detail-view]],
[[the-academy-screen-saved-none-of-its-choices]], [[ui-audit-2026-08-21]]

Tags: #feature #admin #backend #chess
