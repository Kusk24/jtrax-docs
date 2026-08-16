# Playing chess in the portals

**Date:** 2026-08-16 · **Repos:** `jtrax-backend`, `jtrax-web-app`, `jtrax-admin`, `jtrax-mobile-app`

Students can now play chess: against the computer on their own, or against each
other in a room a staff member opens and hands out as a code. Staff watch the
board live and keep the record of who played whom.

Until now the only chess in JTrax was `lib/student-game.ts` — a 109-line
mate-in-1 puzzle toy with no castling, en passant, promotion, check detection or
draws. Fine for a fixed puzzle; not a game.

## The AI opponent is Stockfish, and it runs in the browser

The original plan was to host a model and fine-tune it. That was the wrong shape
twice over, and the reasoning is worth keeping:

- **Chess AI is not an LLM.** LLMs produce illegal moves, lose the position
  after ~20 plies, and cost a call *per move*. Stockfish is free and stronger
  than every human who has ever lived.
- **Hosting it is worse than shipping it.** Stockfish compiles to WebAssembly
  and runs on the pupil's own device: no CPU on a 512 MB free instance, no
  round trip, no 30-second cold start, and it works with no network. Hosting it
  would also have meant a ~50 MB C++ binary and a subprocess in what is
  currently an 11 MB `distroless/static` image.

Where an LLM *does* belong here is post-game coaching — "you hung your knight on
move 14", in Thai and English — which is one call per finished game rather than
one per move. Not built yet; see Follow-ups.

The build is **`stockfish-18-lite-single`** (7.3 MB). Single-threaded on purpose:
the multi-threaded builds need `SharedArrayBuffer`, which needs cross-origin
isolation (`COOP`/`COEP`) on every response, which would break Google Fonts and
every other cross-origin asset — to make an engine already far beyond any pupil
slightly stronger. Difficulty is capped through UCI instead: levels 1–3 limit
search depth, 4–5 add `UCI_LimitStrength`. Stockfish's own floor is Elo 1320,
which still crushes a beginner, so depth is what makes the easy levels easy.

**Stockfish is GPL-3.** The files are shipped unmodified with `Copying.txt` and
a pointer to upstream. Do not patch them — a modified engine would pull JTrax's
own source under the GPL's distribution terms.

## The server owns the rules

`jtrax-backend/internal/game/` wraps `github.com/notnil/chess` (pure Go, no
transitive dependencies, so `CGO_ENABLED=0` and the static image survive).

Trusting each browser to grade its own game means a student who opens dev tools
wins every game, and the academy's record of who beat whom becomes fiction.

Games are **replayed from their move list**, never restored from the stored FEN:
threefold repetition and the fifty-move rule are properties of the *history*, so
a game rebuilt from a bare FEN can never claim either. `game_room.fen` is a cache
for quick reads, not the source of truth.

## Rooms, codes and seats

`migrations/0004_game_room.sql` adds `game_room` and `game_move`. Endpoints and
authorization are documented in `jtrax-backend/docs/game-rooms.md`.

Two mechanisms are load-bearing and easy to lose in a refactor:

- **The seat claim is a conditional `UPDATE`**, not a read-then-write. Three
  students submitting the same code at the same instant all pass any check
  written in Go; the free-seat test has to be the `WHERE` clause.
- **`game_move`'s primary key is `(game_room_id, ply)`.** That is the referee
  for a double-tap or a stale retry: the second insert violates the key and
  answers 409 rather than appending two moves to one turn.

Codes are `crypto/rand` over a 32-character alphabet with `I`, `O`, `0` and `1`
removed — those are the ones a child mistypes off a whiteboard.

A room code is a **bearer credential**: it is stripped from any room the caller
is neither staff for nor seated in, and it never appears in an event.

## Live updates are SSE, not WebSockets

Chess is turn-based at roughly a move every few seconds, so full duplex buys
nothing, and SSE is ~100 lines of `net/http` rather than a protocol upgrade.
What actually decided it: `EventSource` reconnects on its own, and the API
sleeps after fifteen idle minutes on Render's free tier — a stream *will* drop
mid-game and has to heal unnoticed.

Every event is a **full snapshot**, not a delta, so a watcher that missed one
still converges and a reconnect needs no replay.

Two things to know before scaling: the hub is **in-process** (correct for one
instance, silently wrong for two), and slow subscribers are **dropped rather
than waited for**, so a backgrounded tab cannot stall the opponent.

Both Next.js apps had to stop buffering: `app/api/[...path]/route.ts` now
forwards `text/event-stream` as a stream with `X-Accel-Buffering: no`.

## The mobile app needed an account first

`jtrax-mobile-app` was not wired to the backend at all — the entry screen was a
**role picker** that let anyone tap "Student" and walk in, and every screen read
mock fixtures. Multiplayer needs a real identity to claim a seat with, so the
picker was replaced by a real sign-in: token in `expo-secure-store` (Keychain /
Keystore), `RequireRole` on each portal layout, sign-out on all three profiles.

The guard lives on the layout, not the screens — the same lesson as
[[sign-in-sign-out-and-the-unguarded-teacher-portal]].

Two things could not be copied from the web app:

- **No `EventSource` in React Native.** `src/lib/sse.ts` is a ~90-line reader
  over `XMLHttpRequest`, whose `responseText` grows as the body arrives. It
  needs no dependency and, unlike the browser's `EventSource`, it can attach the
  bearer token — which is why mobile talks to the API directly and the web apps
  need a same-origin proxy.
- **No WebAssembly in Hermes.** Stockfish cannot run in the app's own JS
  runtime, so it goes in a hidden 0×0 WebView. **This part does not work yet —
  see Follow-ups.**

## Decisions made along the way

- Stockfish in the browser over a hosted or fine-tuned model — cost, latency,
  cold starts, and the static image.
- Server-side move validation over client-validated with an opponent witness:
  three direct Go dependencies instead of two, in exchange for results that are
  facts rather than an honour system.
- SSE over WebSockets — reconnection on a free tier that sleeps.
- Seats reference `user_account`, not `student`, so a teacher can sit down
  against a pupil for a lesson.
- Parents cannot take a seat: every seat taken is a seat a pupil cannot have.

## Follow-ups

- [ ] **Mobile vs-computer does not work.** The WebView bridge is proven
      (`jtrax-hello` round-trips) but the engine never completes its UCI
      handshake. Diagnosed: this build (chess.com's `stockfish.js`) only wires
      UCI up in its **Worker** path, and a `blob:` Worker gets an opaque origin
      that WKWebView will not let read a `file://` .wasm — it fails silently on
      both sides. Current attempt stages page, worker and .wasm into one cache
      directory via `expo-file-system`; `stageEngine()` itself is now throwing
      on the SDK 57 `File`/`Directory` API. The screen degrades honestly
      (30s timeout → "could not start on this device").
- [ ] Post-game coaching endpoint — prompt + PGN + Stockfish evaluation, one
      call per finished game. Fine-tuning only if a prompt provably cannot do it.
- [ ] No abandonment timeout: a room left mid-game stays `Active` forever.
- [ ] The admin console overflows at 390px on every table page, Games included
      — pre-existing and console-wide, worth its own pass.

Related: [[backend-crud-and-live-portals]],
[[sign-in-sign-out-and-the-unguarded-teacher-portal]],
[[parents-section-student-email-and-password-reset]]

Tags: #feature #chess #mobile
