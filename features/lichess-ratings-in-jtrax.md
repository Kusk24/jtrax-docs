# Lichess ratings in JTrax

**Shipped:** 2026-08-16 · **Repos:** `jtrax-backend` · **PR:** jtrax-backend#17

A student's Lichess ratings — blitz, rapid, classical, puzzle — synced into the
academy and visible next to their record.

## Why

The academy sees everything played **here** (`game_room` records every move) and
nothing played **there**. Lichess is where students practise at home, so this
closes the half of a pupil's chess the school was blind to.

## What it is not, which matters more than what it is

Worth stating plainly, because all four were assumed at some point in the
conversation that led here:

- **Not a way to create accounts.** Lichess has **no signup API**. Every student
  registers themselves; the school cannot provision accounts for them.
- **Not a record of a student's chess.** Lichess knows about games played *on
  Lichess*. Nothing here covers the JTrax board or over-the-board play at the
  academy.
- **Not live.** Lichess pushes nothing — no webhook, no subscription. "Synced"
  means the server reads on a schedule. (Same shape as the answer to "can
  webhooks make chess moves instant" — see [[playing-chess-in-the-portals]].)
- **Not a FIDE rating.** Lichess is Glicko-2 and runs well above FIDE. Stored in
  `lichess_rating`, deliberately nowhere near `student.fide_rating`, which seeds
  tournaments and would be quietly corrupted by mixing the two.

## No credentials at all

No API key, no registration, no approval — every endpoint used is public. That
is why the feature costs nothing to run, which matters under
[[jtrax-free-tier-no-card]]. `LICHESS_API_BASE` exists only to point at a test
stub or an egress proxy.

## The verification problem, and the cheap answer

**A typed username is a claim, not a fact.** Nothing stops a pupil entering a
grandmaster's account and appearing at 3000 on a screen their parents see. For a
school where progress is reported to families, that is an integrity hole, not a
cosmetic one.

A student who links their own account gets a one-time code — `JTRAX-K7M2QX94` —
and pastes it into their **Lichess bio**. The server reads the bio back. A bio is
**public to read and private to write**, which is exactly the property account
verification needs, and it costs one API call instead of an OAuth round trip and
a stored token.

Unverified links are **kept but marked** — a teacher recording a known username
is genuinely useful — and the console shows the difference rather than
presenting both as fact. Staff never see the code: they cannot edit a pupil's
bio, so handing it over would only invite passing it around.

## One request for the whole academy

`POST /api/users` takes up to 300 usernames and returns them all, so a class of
thirty is one call rather than thirty. Per-student polling is how an integration
gets rate-limited; Lichess answers 429 when it has had enough, and the client
treats that as a reason to **stop**, not to retry.

The sync is **lazy** — a read older than six hours refreshes — rather than a
timer, because the service sleeps at night on the free tier.

## Data-fidelity decisions

- **A game type with zero games is not recorded.** Lichess reports
  1500-provisional for something never played; storing it would seed a
  leaderboard with a rating nobody earned.
- **Provisional flags are carried through, not dropped.** Those numbers swing
  wildly and must not read as achievements.
- **A closed or renamed account drops out of the bulk reply** and keeps its last
  known ratings, so one bad username cannot blank a class.
- `lichess_rating_day` keeps one reading per type per day (`INSERT OR IGNORE`),
  so a term's progress is visible and repeated syncs do not rewrite a chart
  someone is looking at.

## Verification

Nine authorization and fidelity guards mutated one at a time; **nine of nine
caught**. Then driven against the **real lichess.org** through the running
server: two accounts linked, one bulk request, real ratings returned with
provisional flags intact, unknown username a 404, a student seeing one link and
404 on a classmate's history.

## The blocker to check before relying on this

**Lichess has a minimum age** — 13 in most jurisdictions, higher under GDPR in
some. A chess academy teaching young children will have students who cannot hold
an account at all. **This can therefore never be the primary progress record**,
only a supplement for the older group. Confirm against the current Lichess terms
and against the actual roster before building anything that assumes coverage.

## Follow-ups

- [ ] **No UI yet.** The data syncs; nothing displays it. Student profile (link
      your account, see your ratings, the verification step) and an admin column
      still to build.
- [ ] A team route was considered and not taken: the academy could create a
      Lichess team and run team arenas, which would give real *points* from
      events the school controls rather than ratings it can only display.
      Better shape if "track their points" turns out to mean competition.
- [ ] Parents can read their children's ratings through the scoped endpoint, but
      the parent portal does not surface them.

Related: [[playing-chess-in-the-portals]], [[puzzles-from-a-real-bank]],
[[backend-crud-and-live-portals]]

Tags: #feature #chess #lichess #integration
