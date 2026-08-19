# Rated games on Lichess

**Shipped:** 2026-08-19 · **Repos:** `jtrax-backend`, `jtrax-web-app`, `jtrax-admin`

A game played on the JTrax board can now *be* a real, rated game on lichess.org.
Two students sit down here; the result and the rating change land on their real
Lichess accounts.

Supersedes one claim in [[lichess-ratings-in-jtrax]], which said Lichess had no
write API. It does.

## Correcting the earlier note

That note said Lichess "pushes nothing" and cannot be written to. The first half
is still true. The second was wrong, and it changed what was buildable:

| Endpoint | Auth needed | Rated? |
| --- | --- | --- |
| `POST /api/challenge/open` | **none at all** | yes |
| `POST /api/import` | optional token | **never** |
| `POST /api/board/game/{id}/move/{uci}` | `board:play` | yes |

Verified against the live API before any code was written — an anonymous open
challenge and an anonymous PGN import both succeeded.

Importing a finished PGN gives a real Lichess game page with analysis, but an
imported game is **never rated**. So the only way a game played here can move a
rating is for it to be a Lichess game *while it is being played*.

## The shape

1. The student grants play access — OAuth2 with PKCE, scopes `board:play` and
   `challenge:write` and nothing else.
2. The token is sealed with AES-256-GCM and stored. It never leaves the server.
3. Staff create a room with rated on, and a clock.
4. The second seat filling triggers the pairing: white's token challenges black's
   username, black's token accepts.
5. Each JTrax move is forwarded with the token of the player who made it, after
   it is stored and shown locally.
6. A stream of the Lichess game runs alongside and decides the result.

## The one design decision worth remembering

**JTrax owns legality; Lichess owns the result.**

JTrax already replays the move list on every request, and making a child wait on
a network round trip before their own piece moves is what makes a board feel
broken. But Lichess owns the clock and the rating, so if it says the game is
over, the game is over.

Both run the same rules over the same move list, so they agree about chess. The
only thing they can genuinely disagree about is time — which is what the stream
is there for.

When they do disagree, the room **detaches**: it stops being rated, records why,
and says so on the board while the game is still in play. It never rolls the
board back to match. Taking back a move a child already played is worse than
losing the rating.

## Under-13s

Lichess requires an account holder to be 13. The academy's answer, decided with
the client: younger pupils play on an account **created and held by a parent or
teacher, with Kid Mode on**; older pupils use their own.

- `managed_by` records who holds the account. That is a safeguarding fact about
  a child, not a UI detail, so it is stored rather than inferred from a birthday.
- A parent or teacher can run the whole grant flow on a child's behalf, scoped in
  the query — a parent can only do it for their own children.
- **Kid Mode is not verified by us.** Reading it needs the `preference:read`
  scope, and widening every child's grant for a check an adult can do once was
  judged a bad trade. Kid Mode restricts chat, forums and private messages; it
  does not restrict play.

## Two bugs the browser found that the tests did not

Both were invisible to the Go test suite and to a typecheck, and both turned up
within a minute of actually clicking the button:

- **Every self-linked pupil was labelled parent-managed.** `startedByStudent`
  queried `user_account` for a `student_id` column that does not exist. The error
  was read as "not the student", so the flag defaulted the wrong way — on a field
  that claims an adult holds a child's password.
- **A pupil landed back on the home screen after granting.** The callback returns
  to `/student`, but the card that sent them lives on the profile *screen*, which
  is component state rather than a route. They saw nothing confirming it worked.

## Things that bite

- **Tokens last a year and cannot be refreshed** — only granted again. The portal
  warns a month out. There is no renewal loop to write and never will be.
- **A teacher-versus-pupil game can never be rated**, because only a student row
  carries a Lichess link. Correct: a lesson should not move a child's rating.
- **Lichess only accepts certain clocks** — 0/15/30/45/60/90 seconds, or any
  multiple of 60 up to three hours. Checked at room creation rather than at
  pairing, because by then two pupils are waiting at a board.
- **Repeatedly pairing the same two pupils is what boosting looks like** to
  Lichess. Nothing throttles it yet. Worth watching before a class runs weekly
  rated ladders against each other.
- **A restart is survivable but not seamless.** Stream goroutines live in memory;
  on boot `resume()` re-attaches to every Active rated room, and a game that
  finished while the process was down is reconciled on reconnect. Between the
  crash and the next boot, though, nobody is listening.

## Reachable end to end

Added after the first pass, which shipped a backend nothing could reach:

- **Admin** — a *Rated on Lichess* checkbox and a time control (5+0, 10+5, 15+10,
  30+20) on room creation, and a Rated badge in the rooms list that flips to the
  detach reason when a game stops counting.
- **Student board** — a banner saying the game counts, with a link through to it
  on Lichess, and the detach reason in plain language if it stops.
- **Parent** — each child's Lichess ratings on their profile. Renders nothing when
  no account is linked, so a family that does not use Lichess never sees an empty
  card nagging them. This closes the gap carried over from
  [[lichess-ratings-in-jtrax]].

## Still not built

- **Mobile is untouched.**
- **`TrackedPerfs` still excludes correspondence, chess960 and the variants**, so
  a pupil who only plays those sees nothing.
- **Nothing throttles repeat pairings**, which is the boosting risk above.

## See also

- [[lichess-ratings-in-jtrax]] — the read-only half this builds on
- [[playing-chess-in-the-portals]] — the game rooms being relayed
- `jtrax-backend/docs/lichess.md` — endpoint and configuration detail
