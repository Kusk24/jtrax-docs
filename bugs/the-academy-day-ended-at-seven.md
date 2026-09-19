# The academy's day ended at seven in the morning

**Found:** 2026-09-20 · **Fixed:** backend #61, opened 2026-09-20 · **Repos:** `jtrax-backend`

## Symptom

Six practice and puzzle tests failed on `main` whenever they ran between midnight and 07:00 Bangkok, and passed with `TZ=UTC`. It was noticed while testing the tournament fee at 00:30 ([[a-parent-pays-a-tournament-fee]]).

The tests were only the visible part. On a server whose clock is UTC — Lightsail's default — the academy's day ended at **07:00 Bangkok**:

- a pupil solving puzzles at 06:30 was recorded on yesterday;
- the daily set rolled over mid-morning;
- the practice strip showed the wrong day.

Driven on `main` at 04:11 Bangkok with `TZ=UTC`, a pupil's daily set was dated the 19th while Bangkok was on the 20th.

## Cause

Two clocks for one idea.

- The code took "today" from the server's local zone: `today()`, a duplicate `todayISO()`, and `time.Now()` in the practice summary.
- SQL used `date('now')`, which is always UTC.
- On a Bangkok machine the code agreed with itself but not with SQLite, which is what broke the tests. On a UTC server both agreed, and both were wrong about Bangkok.

A second bug sat underneath. `currentStreak` measured the gap from "now", hours included, to rows dated at midnight. At dawn a two-day gap measured under two days, so a streak that had lapsed was still shown alive.

## Fix

- **One clock for calendar days.** `internal/academytime` gives `Now()` and `Today()` in a fixed UTC+7 zone. Thailand has no daylight saving, and a fixed zone needs no tzdata on the host.
- **Every day-level decision reads it.** That covers:
  - the daily set and Free Play;
  - the practice strip and streak;
  - early-bird and registration deadlines (`pricing.go`, `publicregistration.go`);
  - credit expiry on a card payment;
  - the low-credit reminder, whose `date('now')` is now a parameter;
  - Lichess rating snapshots;
  - the roster import;
  - a public entrant's age.
- **Moments in time stay UTC:** `created_at`, `opened_at` and `sqliteNow()`.
- **The streak compares calendar day with calendar day** (`practice.go`, `currentStreak`).

## Prevention

- `academytime.Freeze` lets a test pin the hour. Two tests pin both bugs at a frozen 06:30 Bangkok, so they fail at any hour without the fix, not only before 07:00: `TestAnEarlyMorningPupilGetsTheAcademysDay` and `TestALapsedStreakHasLapsedAtDawn`.
- The unit tests `TestTheAcademyDayTurnsAtBangkokMidnight` and `TestTheServersOwnZoneDoesNotMoveTheDay` check the boundary itself.
- The test fixtures now date rows through `academyDay()` rather than SQLite's `date('now')`.
- The full suite passes with the process in Bangkok, UTC, Los Angeles and Kiritimati.

Rule going forward: a **calendar day** comes from `academytime`, never `time.Now()` or `date('now')`. A **moment** stays UTC.

Related: [[a-parent-pays-a-tournament-fee]], [[jtrax-on-lightsail]]

Tags: #bug #backend #time
