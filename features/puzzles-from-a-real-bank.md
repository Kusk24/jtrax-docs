# Puzzles from a real bank

**Date:** 2026-08-16 · **Repos:** `jtrax-backend` · **PR:** #13

Pupils are set three tactics puzzles a day, matched to their rating and graded
on the server. Teachers can author their own.

## What was there before

Three puzzles, hard-coded in the frontend, identical for every pupil, every day,
forever — built by placing pieces square by square in
`jtrax-web-app/lib/student-game.ts`:

```ts
b[0][7] = "k"; b[1][6] = "p"; b[7][0] = "R"; b[7][4] = "K";
```

`practice_activity.puzzles_completed` counted solves with nothing behind it.

## Where puzzles come from

Two sources, distinguished by `puzzle.source`:

- **`Lichess`** — the [puzzle database](https://database.lichess.org/), ~5
  million puzzles with ratings and theme tags, released **CC0 (public domain)**.
  Unlike the Stockfish binary in [[playing-chess-in-the-portals]] there is no
  licence condition on redistributing it. 60 are seeded in
  `internal/db/puzzles.csv`; `cmd/importpuzzles` loads thousands more.
- **`JCA`** — authored by a teacher, so the position from Tuesday's lesson can
  be set rather than a random fork.

### The off-by-one-ply trap

Lichess distributes the position **before** the opponent's move, with that move
first in the solution. The importer applies it, so `puzzle.fen` is always the
position the pupil actually sees, with the pupil to move. Miss this and every
puzzle in the bank is wrong by one ply — and it looks plausible, because the
board still renders.

### Why not import all five million

The full dump is ~300 MB compressed. It would swamp a free-tier database
([[0005-render-and-turso-for-free-hosting]]) and serve nobody: a pupil will
never reach the end of ten thousand. The importer filters by rating as it reads
and validates every solution against the engine, dropping rows that do not play.

## Grading is on the server

`GET /puzzles/daily` sends the position, rating, themes, side to move, and how
many moves are needed. It never sends the solution.

Same argument as move legality in [[playing-chess-in-the-portals]], and it
matters more here because there is no opponent to notice. These attempts feed
streaks and practice records that parents see.

`played` carries only the pupil's **own** moves; the opponent's replies come
from the stored solution, so the server rebuilds the position rather than
trusting the client to report it.

## A test that looked right and was not

The leak test originally checked that no field called `moves` appeared in the
pupil's payload. Mutating the handler to stash the solution in `themes` instead
sailed straight past it.

Checking a field *name* is not checking the *value*. The test now fetches the
real solution as a teacher and fails if that string — or even its first move —
appears anywhere in what the pupil is sent.

Worth remembering the general shape: a guard test that asserts on structure
rather than on the thing you actually care about will pass for the wrong reason.

## Decisions made along the way

- Server-side grading over shipping the solution, for the same reason moves are
  validated server-side.
- Both sources rather than one: Lichess gives volume and rating coverage, but a
  chess school needs the puzzle from the lesson.
- The daily set is **materialised** as `puzzle_attempt` rows on first request
  rather than recomputed, so refreshing cannot reroll a puzzle a pupil just
  failed.
- Puzzles are drawn nearest `student.fide_rating` (defaulting to 800). The
  rating column is the point — a beginner and a club player should not get the
  same three.
- `Resource.Check` was added to the CRUD engine: optional validation beyond
  enums and required columns. It makes a teacher's typo a 400 at the boundary
  rather than a pupil stuck on an unsolvable board. No other resource sets it.

## Follow-ups

- [ ] Frontends: the student portal still shows the three hard-coded puzzles.
      The API is live but nothing consumes it yet — web, admin authoring and
      mobile are all outstanding.
- [ ] Wire solves back into `practice_activity` so streaks reflect real work.
- [ ] Adjust a pupil's rating as they solve, so the bank tracks them.

Related: [[playing-chess-in-the-portals]], [[backend-crud-and-live-portals]],
[[0004-sqlite-and-generic-crud-backend]]

Tags: #feature #chess #puzzles
