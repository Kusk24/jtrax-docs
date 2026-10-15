# Daily puzzles never run out

**Shipped:** 2026-10-03 · **Repos:** `jtrax-backend` · **PR:** #76 (on top of #75)

A pupil's daily puzzle set now always fills: when their level has nothing new left, the
backend fetches more from Lichess instead of showing "You've solved every puzzle we have!".

## Why

The daily set never repeats a puzzle, and the bank shipped with sixty. At three a day a
pupil reached the end in about twenty days. The practice list (#75) already refilled its
own levels from Lichess; the daily set did not. Asked for 2026-10-02 ("it should never
run out whenever the time").

## How it works

Two layers, both in `internal/api/dailytopup.go`:

- **On the spot (the guarantee).** `assignDaily` (`internal/api/puzzles.go:185`) counts
  the unseen puzzles in the pupil's band with `unseenInBand` and, if there are fewer than
  today's set needs, fetches one at a time (`fetchForBand`) until there are enough or
  `dailyTopUpAttempts` (6) runs out (`internal/api/puzzles.go:216`).
- **In the background (the reserve).** After a set is chosen, if fewer than
  `reserveDays` (3) days' worth are left in the band, `topUpInBackground` fetches more
  without making the pupil wait. One top-up per difficulty at a time (`sync.Map`), so a
  whole class opening the app together sends one request, not thirty.

The band is the pupil's level from #75 (`dailyTarget` → `tiers` in `puzzlebank.go`):
beginner 0–799, intermediate 800–1199, advanced 1200+. `unseenInBand` excludes both
`puzzle_attempt` and `puzzle_list`, the same two exclusions the daily choice makes.
Lichess bands: `easiest` … `hardest` (`internal/lichess/puzzles.go` gained `Harder` and
`Hardest`). Fetched puzzles go into the shared bank, so every pupil at that level
benefits.

A Lichess outage is logged and the pupil still gets whatever the bank holds.

## Decisions made along the way

- Fetch on demand rather than seed a large bank up front. A bank of any size still runs
  out, and the fetch is cheap.
- Capped attempts per request: a page load must never turn into an unbounded loop
  against someone else's rate-limited API.
- Tests run against an offline Lichess stub by default (`internal/api/main_test.go`
  `TestMain`), so no test reaches the real Lichess.

## Verified

Against the real Lichess: 3 puzzles fetched and the bank grew from 60 to 68. Deployed to
Lightsail 2026-10-03 with migrations 0041–0058 from #75; see [[jtrax-on-lightsail]].

## Follow-ups

- [ ] The phone app still opens Free Play via `puzzles/free` (`src/lib/puzzles.ts:67`),
  which #75 removed. Port it to `/api/v1/puzzles/list` before the first store build.

Related: [[jtrax-on-lightsail]]

Tags: #feature #puzzles #backend
