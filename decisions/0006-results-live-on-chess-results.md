# 0006 — Tournament results live on chess-results.com, never in JTrax

**Date:** 2026-08-21 · **Status:** accepted · **PRs:** jtrax-admin#57, #58

## Context

The academy runs tournaments the way the region's arbiters do, in their own
words: *player list → pairing → upload to Chess-Results → enter results → next
round pairing → upload again.* Swiss-Manager is the tool; chess-results.com is
the publication. The console nonetheless shipped a full second results system —
add round, propose pairings, record results, publish standings — which
disagreed with the arbiter's table the moment a round was uploaded.

## Decision

- **JTrax's tournament is registration tracking**: the public sign-up link,
  the approval queue, fees and discounts, the participants list. That stays.
- **Results are shown from the connected platform, never typed into JTrax.**
  The console's Results tab is the chess-results link, the public-page
  publish/share card, and a read-only preview of the mirrored table. The
  round-authoring UI was removed (jtrax-admin#57); the backend endpoints
  remain but have no doorway.
- The public `/t/<id>` page for an **unlinked** published event lists
  registered players (the tracking data) until the link is added — stated in
  the console so nobody hunts for an "enter results" button.
- **The round trip is first-class** (#58): linked tournaments carry a
  "chess-results" jump and an "Update results" button on the list card and the
  detail header — go there, upload from Swiss-Manager, come back, press
  Update. The list page itself became three tabs (Ongoing & upcoming / Past /
  chess-results.com) instead of one stacked scroll.

## Consequences

- One version of the truth: whatever the arbiter uploaded, mirrored under the
  politeness rules in [[tournament-rounds-from-swiss-manager]].
- Any future "host a casual in-house event fully inside JTrax" wish means
  reopening this ADR, not quietly resurrecting the hidden endpoints.

Related: [[tournaments-linked-to-chess-results]], [[public-tournament-registration]]
