# Free Play picks its own difficulty

**Shipped:** 2026-09-16 · **Repos:** `jtrax-backend`, `jtrax-web-app` · **PR:** —

A pupil who has finished the daily three can now keep going: the Free Play tab
offers Beginner, Intermediate and Advanced, and each hands out a real puzzle at
that difficulty. The bank refills itself from Lichess when a tier runs dry, so a
tier never reports itself empty while there are puzzles in the world.

## Why

The tab has existed since the portal shipped and **none of it did anything**. The
three tier rows were `div`s carrying `cursor-pointer` and no click handler
(`app/student/StudentGame.tsx:619` before this change), so the mouse changed
shape and nothing happened. The `0/3 puzzles` bar above them was the daily set's
progress, rendered on a tab with no set — a target that never moved.

This was found and written down on 2026-09-11 while porting the phone
([[the-phone-catches-up-with-the-portal]]), which deliberately shipped *without*
a Free Play tab on the grounds that "a control that looks tappable and does
nothing is worse on a phone than one that is absent", and left the choice on web
as *either build it or delete it*. The academy chose build.

## The bank was the real problem

`internal/db/puzzles.csv` holds **sixty** positions, and they are not spread
evenly: 6 below 800, 44 between 800 and 1199, 10 above. The daily set already
takes three a day and never repeats one — `assignDaily` excludes anything ever
attempted, and the code's own comment puts exhaustion at "about the twentieth
day". Free Play drawing on the same bank would have emptied Beginner in a single
sitting.

So the tiers top the bank up from the public Lichess puzzle API rather than
reporting themselves empty. A fetched puzzle is written into `puzzle` like any
other, which is what keeps everything downstream unchanged: assignment, grading
and the never-repeat rule need no special case for where a position came from.

## How it works

- `GET /api/v1/puzzles/free?tier=beginner|intermediate|advanced`
  (`internal/api/freeplay.go`), student-only, rate-limited to 30/min.
- The tier is a rating band — under 800, 800–1199, 1200 up. It picks the unseen
  puzzle nearest the middle of the band, so a tier does not open with its hardest.
- Empty band → `internal/lichess/puzzles.go` fetches one, converts it, stores it,
  and the loop tries again. Capped at three fetches per press.
- The portal holds a free puzzle in its own state rather than appending to the
  daily array (`app/student/StudentGame.tsx`), and solving one fetches the next at
  the same difficulty instead of advancing through a set.

**The API's move convention is not the CSV's.** The puzzle database distributes
the position *before* the opponent's move, with that move first in the solution,
and the importer applies it. The API instead gives a whole game plus
`initialPly`, and replaying through that ply lands on the **pupil's** turn with
`solution[0]` already theirs. Applying the CSV rule to an API body produces a
position whose solution is illegal — a board that rejects every correct answer.
This was checked against the live API before any code was written, and is pinned
by `TestTheSolutionIsLegalFromTheConvertedPosition`.

## Decisions made along the way

- **One bank, one never-repeat rule.** Free Play and the daily set draw from the
  same `puzzle` table, and a puzzle seen in either is spent. The alternative —
  separate pools with Free Play repeatable — would have let a child re-solve one
  position for practice credit.
- **Free Play counts as practice.** The grader writes the same `practice_activity`
  row, so the streak counts it. The child practised; the streak counts days
  practised.
- **Whatever Lichess sends is kept**, even when its rating misses the tier that
  asked. A puzzle in the wrong band still fills a band someone else will want.
- **The difficulty band has to be asked for.** Measured unauthenticated, three
  samples each: `easiest` 662–778, `easier` 942–1147, `normal` 1516–1554. Asking
  without one returns the normal band, so the two easier tiers could never be
  refilled — the first build had exactly that bug and served `exhausted` forever
  on Beginner while quietly filling the bank with 1300+ puzzles.

## Two bugs this work had to fix

**A fourth puzzle in a set of three.** Free Play records a `puzzle_attempt` like
the daily set does, and the daily endpoint reads *every* attempt dated today — so
one Free Play puzzle appeared as "Puzzle 4" on the daily tab. Migration `0034`
adds `puzzle_attempt.source` (`daily` | `free`) and the daily reads are scoped to
`daily`. Caught only by reading the Thai screenshot: the English check passed
because `solvedCount` was 0 either way, and the count was what was being watched
rather than the list.

**`sv2.ratingLabel` was called with no argument** on the home screen
(`StudentGame.tsx:561`), the bug [[the-phone-catches-up-with-the-portal]] noted on
web. It is `"Rated {rating}"` used where a plain label belonged, and in a dev
build next-intl *throws* on the missing parameter, which broke the whole client
component — no tab switched, no effect ran. A new `sv2.ratingTile` ("Rating" /
"เรตติ้ง") is the label; `ratingLabel` keeps its correct use at `:664`.

## Verified

Driven in system Chrome at 390×844 against a local backend with a seeded
database, not typechecked and assumed:

- A tier press fetches `/api/puzzles/free?tier=beginner` and a real board opens —
  "White to move — mate in 2".
- The daily list stays at three puzzles after two Free Play puzzles; before
  `0034` it grew.
- The Free Play tab shows its own subtitle rather than the daily `0/3` bar.
- Thai renders: ปริศนา / เล่นอิสระ / เลือกระดับแล้วฝึกต่อได้เลย.
- Nine backend tests, two of them mutation-checked: removing the never-repeat
  clause and raising the fetch cap each fail their test.

## Follow-ups

- [ ] **Lichess rate-limits, and a classroom is many children.** Testing tripped
      their 429 within about twenty requests, and the client correctly refuses to
      retry through it. A tier that cannot refill says "nothing left at this level
      right now", which is honest but not good. Prefetching into the bank out of
      band — a cron topping each tier up to N — would take the fetch off the
      child's press entirely.
- [ ] The phone has no Free Play tab. Now that there is something behind it, the
      reason it was left out no longer holds.
- [ ] `cmd/importpuzzles` can still bulk-load the Lichess database, which would
      make the on-demand path a rare fallback rather than the normal one.

Related: [[puzzles-from-a-real-bank]], [[the-phone-catches-up-with-the-portal]],
[[training-our-own-chess-opponents]], [[lichess-ratings-in-jtrax]]

Tags: #feature #web-app #backend #puzzles #lichess
