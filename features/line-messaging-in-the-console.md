# LINE messaging in the console

**Shipped:** 2026-08-16 · **Repos:** `jtrax-backend`, `jtrax-admin` · **PR:** jtrax-backend#16, jtrax-admin#42

Parents write to the academy's LINE Official Account, and the front desk answers
from the admin console without opening the LINE app.

## Why

The console has had a Messages screen since the first build. It ran on
`CONVERSATIONS_SEED` and said so in a banner — the ER model has no message
table, so there was nothing to read and everything vanished on reload.

Meanwhile LINE is how Thai parents actually contact a school. The academy was
answering in the LINE app, on a phone, with no connection to the student record.

## Before building this: LINE already gives you a free inbox

Worth knowing, because it nearly makes the feature unnecessary: **LINE hosts a
browser chat console at `chat.line.biz`**, included with every Official Account.
Staff sign in with a LINE Business ID and answer messages there. If "reply
without opening the LINE app" were the whole requirement, that tool already does
it and costs nothing to run.

What it cannot do is put the conversation next to the student's record, the
credit balance and the attendance history. That is the only thing this feature
buys, and it is the answer to give whenever someone asks why the academy
maintains its own inbox.

There is **no official embeddable widget** for the staff inbox. LINE's website
plugin is an add-friend button for visitors, pointing the other way, and
`chat.line.biz` sets `X-Frame-Options`, so it cannot be iframed. Talking to the
Messaging API directly is the only route.

## The cost model, which drove the design

Two ways to send, and the difference is the economics of the whole feature:

| | Reply | Push |
| --- | --- | --- |
| Needs | a `replyToken` from an inbound event | just the `userId` |
| When | shortly after they wrote | any time |
| Cost | **free, unmetered** | **counts against the monthly allowance** |

A school answering an hour later pays for something that would have been free at
the time. So `deliver` in `jtrax-backend/internal/api/line.go` tries the reply
token first and falls back to push when LINE rejects it — a rejected token costs
one wasted call, while not trying costs a billed message every time. The token
is single-use and cleared the moment it is spent.

Every outbound row records which transport it used, and the console surfaces it:
each message is tagged *free reply* or *counted*, the contact panel totals a
thread's usage, and Settings shows the live remaining quota read from LINE.

**On the free plan this allowance is the real limit on the feature, not
hosting** — which matters given [[jtrax-free-tier-no-card]]. The number is
region-specific and changes; the figure to trust is the live one on the Settings
screen.

## How it works

- **Migration `0007_line_messaging.sql`** — `line_channel` (credentials),
  `line_contact` (one row per LINE person; that *is* the thread), `line_message`.
- **`internal/line/`** — signature verification, event parsing, reply/push/
  profile/quota. Plain `net/http`, no SDK, so `CGO_ENABLED=0` and the distroless
  image are untouched.
- **`internal/secretbox/`** — AES-256-GCM sealing for the stored credentials.
- **`internal/api/line.go`** — the webhook plus the staff endpoints and an SSE
  inbox stream, mounted at `/api/v1/line/…`.
- **`jtrax-admin/components/pages/MessagesPage.tsx`** and
  `components/settings/LineChannelCard.tsx`.

Full detail in `jtrax-backend/docs/line-messaging.md`.

## Decisions made along the way

- **Credentials are entered in the console, not set as environment variables.**
  They belong to the academy's LINE account rather than to the deployment, and
  rotating them should not need a redeploy. They are sealed before storage under
  `LINE_TOKEN_KEY`, which *does* come from the environment — so the house rule
  holds: the environment holds the key, the database holds ciphertext. Without
  that key the server **refuses to store them** rather than falling back to
  clear. There is no degraded mode, because the degraded mode is a leak.
- **No linking to parent records.** A thread stands on its own: a LINE person by
  their LINE name. This was the user's explicit call — *"no linking, just reply
  from here without opening LINE"* — and it removed a whole table and screen.
- **The `line_id` already in the ER model cannot be used for this.** It holds a
  LINE display handle (`@someone`); the Messaging API only accepts a `userId`
  scoped to one channel, learned only when that person first writes. The two are
  not interchangeable and there is no lookup between them. Anything built later
  on those columns will not send messages. → [[deleting-and-linking-people]]
- **Staff means Admin and Receptionist. Teachers are excluded.** The academy's
  LINE account is the front desk's; a teacher answering as the school is a
  different feature with a different authorization story.
- **Only an Admin holds the credentials.** A receptionist answers messages but
  cannot read, replace or delete the token.
- **SSE, and the event carries the whole list.** Applying the lesson from
  [[playing-chess-in-the-portals]]: a message arriving updates the console with
  **zero follow-up API calls**, and the open thread reloads only when its last
  message actually moved. That guard is also what stops mark-read looping —
  clearing a badge publishes an event which would otherwise clear it again.

## Things that bite

- **LINE delivers webhooks at least once, not exactly once.** `provider_id` is
  unique and inserts use `INSERT OR IGNORE`, so a redelivery does not double-post
  or double-count the unread badge.
- **The LINE console's "Verify" button posts an empty event batch.** Treating it
  as malformed makes the console report the webhook as broken.
- **Timestamps.** The schema follows the house convention of `datetime('now')`,
  which is not ISO 8601 — browsers parse it as *local* time. The API converts to
  RFC 3339 on the way out, or a Bangkok receptionist sees every message seven
  hours out.
- **Text is capped in runes, not bytes.** Thai is three bytes a character; a byte
  limit would cut a valid message to a third of its length.
- **Check the Chat setting in LINE Official Account Manager.** LINE's own chat
  feature and the Messaging API webhook interact, and the behaviour has changed
  between versions of that console. Verify which events still reach the webhook
  before relying on both at once.

## Verification

Twelve authorization and correctness guards were mutated one at a time and all
twelve were caught. One mutation exposed a flaw in the test suite itself:
asserting on the SSE endpoint with `io.ReadAll` would have **hung** rather than
failed once the guard was removed — a test that hangs when the thing it guards
breaks is not a test.

The console was driven in Chrome against a real API: live delivery with no
reload, reply, transport tagging, Thai.

## Follow-ups

- [ ] **The console does not collapse its sidebar below `lg`.** At 390px the nav
      still takes 232px and every page overflows to 494px — `/students` measures
      identically, so this is pre-existing and shell-wide, not from this work.
      It contradicts [[jtrax-responsive-all-platforms]] and wants its own branch.
- [ ] Set `LINE_TOKEN_KEY` on Render (`openssl rand -base64 32`) before this can
      be configured in production.
- [ ] Automated alerts over LINE — `notification_preference` has check-in,
      credit-expiry and announcement toggles with nothing behind them. Deferred
      deliberately: automated sends are what burn the message allowance.

Related: [[playing-chess-in-the-portals]], [[puzzles-from-a-real-bank]],
[[backend-crud-and-live-portals]]

Tags: #feature #line #messaging #security
