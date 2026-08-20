# Tournament rounds, straight from Swiss-Manager

**Shipped:** 2026-08-20 · **Repos:** all four
**PRs:** jtrax-backend#31, jtrax-web-app#37 #38, jtrax-admin#56

The academy's real tournament workflow, in their own words: *player list →
pairing → upload to chess-results → enter results → next round pairing →
upload again*. Swiss-Manager is the source of truth; chess-results.com is the
publish point; JTrax never asks anyone to type a result twice. This work makes
JTrax the **public window** onto that workflow: pairings appear on the public
page minutes after the arbiter uploads them, and nobody touches JTrax between
rounds.

## What exists now

- **Backend** mirrors the `art=2&rd=N` pairing pages next to the standings it
  already mirrored: board, names, ratings, result verbatim ("1 - 0", "1" on a
  bye, empty before play), seats matched to students by the same
  normalised-name rule. Public payloads strip the student marks, staff views
  keep them.
- **`/t/<id>`** gained a round picker (defaulting to the newest round — the
  pairings people are standing in front of), a *find-a-player* search that
  lays out one player's whole tournament (round, board, colour, opponent,
  result, highlighted), and a once-a-minute client refresh so a projector
  left open genuinely follows along.
- **Portals** point at it: parent home lists "Tournaments now", student home
  gets a mint banner. Both render nothing between events (backed by
  `GET /public/live-tournaments` — published Upcoming/Ongoing only).
- **Console** card says "N rounds mirrored" and that the public page follows
  the arbiter's uploads by itself.

## Decisions worth remembering

- **The page heading is the only truth about which round you fetched.**
  chess-results never 404s a round: ask for round 99 and it silently serves
  the last round again. Parse the `<h3>Round N</h3>` and treat a mismatch as
  "not published" — trusting the URL would store the same round under nine
  numbers.
- **Fetch-once economics.** A round the ranking heading has counted is
  immutable: fetched once, kept forever. Only the pending round refetches
  (pairings can be corrected until play starts). Live refresh = 1–2 pages;
  budget of 5 round pages per refresh spreads a finished event's backfill.
  Final events cost the site zero further requests — asserted in a test by
  counting stub hits.
- **The public read refreshes in the background.** Serve the stored copy now,
  `go refresh()` when stale (>3 min) and unfinished — a parent's phone never
  waits on chess-results.com, and the 60-second floor means a hall full of
  phones costs the site at most one fetch a minute. The client's own poll is
  what nudges this, so "live" needs no cron.
- **Duplicate header columns.** The pairing header names two players, so
  `No.`/`Rtg`/`Pts.` appear twice; the ranking parser's single-index header
  map would silently keep only Black's columns. `headerAllColumns` keeps all
  indices and takes "first Rtg after the White column".

## A bug the tests caught

**The console's per-tournament Refresh button had answered 502 since it
shipped**: the handler claimed the politeness throttle, then `refreshExternal`
claimed it again, and the second claim always failed — reported as
"chess-results.com could not be read". No test had ever driven that button to
success. One claim now, in `refreshExternal`, and throttling answers 429.

## Verified the hard way

Not just stubs: linked a **real 33-player, 9-round event** on
chess-results.com end to end — first link stored rounds 1–5 (budget), an
immediate refresh answered 429 (floor), the next backfilled 6–9, and the
public page rendered all of it at 390/768/1280, axe-clean, in EN and TH.

## Follow-ups

- [ ] Corrections the arbiter uploads to an *old* round are never re-read
      (counted rounds are immutable by design). Rare; a manual unlink/relink
      re-mirrors everything if it ever matters.
- [ ] jtrax-mobile-app has no tournament surface yet; the student banner and
      the public page port near-verbatim.

Related: [[tournaments-linked-to-chess-results]], [[public-tournament-registration]]

Tags: #feature #tournament #integration
