# Tournaments linked to chess-results.com

**Shipped:** 2026-08-19 · **Repos:** `jtrax-backend`, `jtrax-admin`, `jtrax-web-app` · **PR:** jtrax-backend#27, jtrax-admin#51, jtrax-web-app#30

One of the academy's own tournaments can now name the chess-results.com event it *is*, and from then on its public page follows the arbiter's standings instead of rounds typed into the console.

## Why

The academy does not author the standings for an event an arbiter runs. They pair it in Swiss-Manager and upload to chess-results.com, and that upload is what players, parents and federations treat as true. A second table typed into JTrax is wrong the moment a round lands, and then there are two answers to "who won".

This is distinct from [[external-tournaments-from-chess-results]], which follows *other people's* events the academy's students happen to play in. This one is about the academy's own events, which also carry registration, fees and a discount — none of which chess-results has any notion of.

So the split is: **registration and money stay in JTrax; the standings live where they are made.**

## How it works

`0015_tournament_chess_results_link.sql` adds a nullable `tournament.chess_results_id`. Null is the normal case — a club night has no chess-results event and the console's own rounds are the result.

`internal/api/tournamentlink.go`:

| Route | Notes |
|---|---|
| `GET /api/v1/tournaments/{id}/chess-results` | Read-only; never fetches |
| `POST /api/v1/tournaments/{id}/chess-results` | Paste a link; tracks and links in one action |
| `DELETE …` | Breaks the tie, leaves the event tracked |
| `POST …/refresh` | Pull a round in without waiting for the timer |

The public results endpoint consults `linkedResultsFor()` first and serves the arbiter's table when linked, with `source`, `sourceUrl`, `stage` and `fetchedAt`.

Console: `components/tournament/LinkedResultsCard.tsx`, at the top of the Results tab — above publishing, because it decides *what* gets published.

## Decisions made along the way

- **Tracking and linking are one action.** Staff pasting a link onto a tournament mean "this is that". Making them also add it to a separate list is how you end up linked to an event whose standings nobody ever fetches.
- **Our own rounds are not served alongside a linked table.** chess-results publishes a ranking; pairing it with stale boards of ours would invite exactly the disagreement this ends.
- **The public table drops `studentId` and `studentName`.** The arbiter's names are already public on their site — but *which of those rows are our pupils* is the academy's knowledge, not the public's.
- **Reading the link is free.** The Results tab loads the current link through a read-only route that never fetches. chess-results is donation-run and bans scrapers; opening a screen must not cost them anything. Pinned by `TestReadingTheLinkDoesNotFetch`, which fails on a single extra upstream request.
- **`ParseRef` refuses any host but chess-results.com.** That is the whole SSRF surface, tested against `example.com`, a link-local metadata address, and junk.
- **Linking is not a back door around publishing.** `results_public` is still a separate decision; `TestLinkedResultsStillRequirePublishing` pins it.

## Follow-ups

- [ ] Only the ranking table is read — chess-results' per-round crosstables are not parsed, so a linked event shows standings but no pairings and no bracket.
- [ ] Nothing reconciles a linked event's standings against the tournament's own registration list; a player who registered here but is absent from the arbiter's table is not flagged.

Related: [[external-tournaments-from-chess-results]], [[public-tournament-registration]]

Tags: #feature #tournaments #chess-results
