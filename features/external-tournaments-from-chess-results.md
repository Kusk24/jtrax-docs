# External tournaments from chess-results.com

**Shipped:** 2026-08-19 · **Repos:** `jtrax-backend`, `jtrax-admin`, `jtrax-web-app`
**PRs:** jtrax-backend#22 → #23; jtrax-admin#48; jtrax-web-app#29 (bracket); jtrax-admin#46 (public link fix)

The second half of the tournament-results decision recorded in
[[tournament-results-and-chess-results]] ("own results first, then import"): the academy
can now follow tournaments its students play in *elsewhere*, read from
chess-results.com. Alongside it, the public tournament page gained a knockout
bracket view.

## What "connect with chess-results" can and cannot mean

Asked directly by the client: *"we should have maybe connect with them, to
update, read etc? or just link button?"* The answer is dictated by the site:

- **Update: impossible.** chess-results.com is the publishing side of
  Swiss-Manager, the arbiter's desktop program. There is no upload API for
  anyone. JTrax results cannot appear there, ever, by any build.
- **Read: built.** Staff paste a tournament link into the console's Tournament
  section; the backend pulls the standings (a scraper — the site has no read
  API either), stores them, and recognises our students' rows. Refresh pulls
  again as rounds land; unfinished events auto-refresh on read after 30
  minutes.
- **Link out: built too.** Every tracked event links back to the source, which
  is the authority.

## Recognising our students in someone else's table

- `student.fide_id` is new (migration 0013): a FIDE ID names a child in any
  arbiter's table for life, across "Somchai, N.", "Somchai, Niran" and a Thai
  spelling. Staff enter it once on the student record.
- Matching is FIDE ID first, exact normalised name second — and *no* fuzzy
  matching. In the live test "Chaiyo, Malee" correctly did not match a student
  named just "Malee": a false match on a public standings page is worse than a
  miss.
- Matched rows are highlighted in the console with a `JCA · name` badge.

## The bracket

The public page `/t/<id>` now draws a real knockout bracket — columns per
round, connectors, results, champion card with a trophy — **only when the
rounds genuinely form one**: each round at most half the previous, everyone
advancing from it. Swiss events keep the round-by-round list, because a bracket
would misrepresent a Swiss. Wide brackets scroll sideways inside their card on
phones.

## Scraper honesty

The parser is header-driven, anchored on the `CRs1` table class, and pinned by
tests against real saved pages. It fails loudly on changed markup rather than
shipping half a table. Politeness is enforced: 60s floor per tournament,
stored copies served to readers, rate-limited track endpoint, and the URL
parser refuses any host that is not chess-results.com (the endpoint turns
caller input into a server-side GET — an open host list would be an SSRF
proxy).

## Three bugs this seam surfaced

- **Missing-column lookups returned column 0** (Go map zero value), so
  tournaments without a FideID column stored *ranks* as FIDE IDs.
- **Blank-rank rows were dropped.** chess-results blanks the rank on shared and
  unranked rows; a real player vanished from the parse. Kept now, carrying the
  previous rank; row position, not rank, is identity.
- **The list endpoint deadlocked the whole backend** — a query per row while
  the listing rows held SQLite's single connection. Found because the flow was
  driven in a real browser, not because a test failed; the regression test now
  hangs loudly on the bug.

## Limits, stated plainly

- Standings only — per-round crosstables from chess-results are not parsed, so
  external events show a table, not a bracket.
- Matching quality depends on staff entering FIDE IDs; name matches only catch
  exact spellings.
- A markup change on chess-results.com breaks the read until the parser is
  updated. The pinned-fixture tests are the alarm.

## See also

- [[tournament-results-and-chess-results]] — the academy's own tournaments, and the
  decision this completes
- `jtrax-backend/docs/chess-results.md` — parser, politeness and endpoint detail
