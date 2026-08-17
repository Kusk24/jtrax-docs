# Tournament results, and what chess-results.com can't do

**Shipped:** 2026-08-17 · **Repos:** `jtrax-backend` · **PR:** jtrax-backend#18

Rounds, pairings and live standings for a JCA event — entered by an arbiter,
readable by anyone once the organiser publishes them.

## The finding that shaped the whole feature

**chess-results.com is not a service you can post to.** It is the public output
of **Swiss-Manager**, the pairing program an arbiter runs on a laptop at the
venue: pair a round locally, click upload. There is no API, no write endpoint
and no partner integration.

Getting a JCA event onto chess-results means *being* the organiser running
Swiss-Manager. Nothing in JTrax — or in any third-party product — can push
results there. Anyone who asks for that integration again should be shown this
paragraph.

**Reading it is a different matter.** Verified against the live site:

- Tournament pages are plain GETs — `chess-results.com/tnr1365480.aspx?lan=1`,
  302 to an `S2.` mirror — and standings are server-rendered HTML, not a JS app.
- `&prt=4&excel=2010` returns the same table as a spreadsheet.
- **Every row carries a FIDE ID**, which is the reliable key for matching a
  student rather than guessing at name spellings.
- `robots.txt` allows everyone **except `Chess365-Bot`** — they have blocked a
  scraper by name before, so tread lightly.

Importing a student's placing from an external Thai tournament is therefore
possible, and is the **second seam** (not yet built). It is scraping either way:
fetch only events a JCA student entered, cache hard, identify honestly.

## Why the school needed its own results anyway

The console had shown every tournament player on a score of `—` with zero wins
since the first build, because the ER model has tournaments, categories and
registrations but no table for **what happened**. Those were placeholders, like
the Messages screen before [[line-messaging-in-the-console]].

For JCA's own events chess-results is irrelevant — the academy is the organiser
and the results are its own.

## Pairings, not a score column

A score column per player is half the size and cannot answer "who did she
play?", cannot print a cross-table, and cannot compute a **Buchholz** tiebreak —
which is what separates two children who finish level, and therefore what
decides who goes home with the trophy.

Distinctions the model deliberately keeps, because these are the ones that cause
arguments in a hall:

- **A bye and a forfeit both score a point without a game played.** An unplayed
  point contributes nothing to an opponent's Buchholz, and a parent asking why
  their child has a point but no moves deserves an answer the data can give.
- **Buchholz here is the plain form** — the sum of the scores of opponents
  actually faced — not FIDE's variants that substitute a virtual opponent for
  byes. Written down because "Buchholz" alone names half a dozen slightly
  different numbers.
- **Players level on every tiebreak share a rank.** Joint third is a real
  result; printing 3rd and 4th invents a difference that does not exist.
- **An unpaired player still appears**, on nil points. Vanishing from your own
  tournament is not an acceptable way to represent "no games yet".

Round status is **derived** from the boards rather than set by hand, and is
recomputed after pairing as well as after a result, because a round of nothing
but byes is finished the moment it is paired.

### Pairing proposals are a convenience, not an engine

`/proposed-pairings` sorts by standing and pairs down the list avoiding
rematches. A real Swiss uses the **Dutch system** — colour balance, float
history, score groups — and this does none of it. It exists so an arbiter starts
from a sensible list rather than a blank screen; every board is editable before
saving. If the academy ever runs a FIDE-rated event, this is not sufficient and
Swiss-Manager is the answer.

## The public standings page

`GET /api/v1/public/tournaments/{id}/results` takes no session, because a
results table only signed-in parents can see is not a results table — a
grandparent should be able to open the link.

Four things make that defensible:

1. **Opt-in per event** — `tournament.results_public` defaults to 0. Publishing
   children's names and scores is an organiser's decision, not a side effect of
   a table existing.
2. **Rate-limited**, as anything unauthenticated must be.
3. **Strictly less than the staff view**: name, category, score, board results —
   what is already pinned to the wall at a tournament hall. No contact details,
   no date of birth, no student or registration ids.
4. **An unpublished event returns the same 404 as a non-existent one**, so the
   endpoint cannot be used to enumerate ids.

The leak test searches the payload **by value**, not by field name — the lesson
from the puzzle-solution test, which a mutation once slipped past precisely
because it checked for a field called `moves`.

## Verification

Eight authorization and validation guards mutated one at a time; **eight of
eight caught**. Twelve standings tests against a hand-worked three-round event
where every number was calculated on paper before the code ran.

## The bug worth remembering

The round-completion query referenced the pairing table from inside an `UPDATE`
on the round table. It silently matched nothing — **and the handler swallowed
the error and returned 200**, so the failure was invisible. A "non-fatal" error
branch that returns success is exactly how a broken query survives a test suite.
It is now a small helper that logs.

## The screens (2026-08-17, jtrax-admin#43, jtrax-web-app#26)

**Admin — a `results` tab on the tournament.** Built for where it is actually
used, standing in a noisy hall between rounds on a phone: **Add round pairs it
in one press** (an arbiter wants a paired round, not an empty one to fill),
results are **buttons rather than a dropdown** and send on tap with no save
step, forfeits hide behind a toggle, and the standings sit above the boards and
reorder as results land.

**Public — `/t/[id]` in the web app.** The only route in that app with no
sign-in. Server-rendered and fetched straight from the backend rather than
through `/api`, because that proxy exists to attach a session token and this
page has none. `revalidate = 10`, so a screen left up in the hall follows the
round with nobody pressing anything. An unpublished event returns the same 404
as a missing one, and `generateMetadata` returns a bare title on a miss so the
name cannot leak through a page title either.

Driven end to end in Chrome: created a four-player event, paired it, tapped both
results, watched the round flip to Finished, published, then opened the public
URL **in a browser with no session at all** — 200, with an unpublished
tournament 404ing for the same visitor. Joint ranks survived to the public page:
two players on 1 point both shown as rank 1.

Two things that run caught: `published` was hard-coded `true` in the admin's
`live.ts`, so the tab would have claimed every tournament was already public;
and the new tab read `Results` while the existing two read `overview` /
`participants`.

**A debugging lesson worth more than the fix:** a phantom "recording a result
resets the tab" turned out to be the test driver creating every tournament with
the *same name*, so `.first()` kept selecting an earlier run's and stacking
rounds onto it. Against a persistent dev database, unique fixture names are not
optional.

## Follow-ups
- [ ] **Import from chess-results** by FIDE ID — the second half of the original
      request.
- [ ] Categories exist but standings are computed across the whole event; a
      U10 section and an Open section currently share one table.
- [ ] Colour balance is not tracked, so a proposal can hand the same player
      White five rounds running.

Related: [[line-messaging-in-the-console]], [[lichess-ratings-in-jtrax]],
[[playing-chess-in-the-portals]]

Tags: #feature #tournament #chess-results #public
