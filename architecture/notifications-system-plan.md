# Notifications — current state and plan

**Date:** 2026-08-21 · **Updated:** 2026-09-05 · **Status:** backend backbone
**built** (step 1), frontends + push pending · **Repos:** all four

> **2026-09-05 — the backbone landed.** `jtrax-backend` PR #45 built step 1 of
> the build order below: the `notification` / `notification_delivery` /
> `notification_setting` / `push_subscription` schema (migration 0018,
> keyed on `user_account_id` as this note recommended), the `internal/notify`
> service, per-user preference and inbox endpoints, and the three triggers the
> academy asked for — check-in/out (post-commit hook on attendance),
> announcement fan-out, and a **manual, staff-only** credit-expiry trigger.
> Email is wired through the existing `mail` package and stays inert until SMTP
> is configured. Browser and mobile push are scaffolded (subscriptions register,
> deliveries queue `pending`) but the send workers are not inlined — still "a
> different risk class", still wanting a reviewed library. Verified by five
> tests driving the real HTTP flow. **Still to do:** the in-app inboxes and
> Settings UI in the web + mobile apps (replacing today's mocks), and the push
> send paths. The old parent-only `notification_preference` is left inert, not
> dropped (migrations are append-only).

The academy wants notifications for **parents, students and admins**, over
**three channels: browser (web) push, email, and an in-app inbox**, with each
person able to turn them off in Settings. The *catalogue of events* that
trigger a notification will be supplied separately by the academy — this note
deliberately does not invent it.

## The one-line summary for whoever builds this

**Nothing notifies anyone today.** The parent portal's three preference
switches are real and persist to the database, but **no code anywhere reads
those flags**, because there is no sender to gate. Every notification *list* in
every app is a hard-coded mock. The only automated outbound message in the
whole product is the password-reset email.

## Verified current state

Checked 2026-08-21. "Real" means it reaches the Go backend.

| Piece | Where | Real or mock |
|---|---|---|
| Parent preference switches | `jtrax-web-app/app/parent/profile/page.tsx:122` → `savePrefs` in `components/parent/ParentData.tsx:219` → `PATCH /api/notification-preferences/{parentId}` | **Real, but inert** — stored and never read |
| `notification_preference` table | `jtrax-backend/internal/db/migrations/0001_initial_schema.sql:64` | Real: 3 INTEGER flags, **keyed by `parent_id`** |
| Announcements (admin CRUD) | `jtrax-admin/components/pages/AnnouncementPage.tsx:27` | Real |
| Announcements (parent read) | `jtrax-web-app/components/parent/ParentData.tsx:168` | Real; read/unread is local state only |
| Parent notification list (web) | `app/parent/notifications/page.tsx:6` → `notifsV2` | **Mock**, 2 hard-coded rows |
| Notification lists (mobile ×2) | `src/app/{parent,student}/notifications.tsx:4` | **Mock** |
| `NotificationsPanel` (web) | `components/NotificationsPanel.tsx` | **Dead code**, zero importers |
| SMTP sender | `jtrax-backend/internal/mail/mail.go` | Real; only caller is `passwordreset.go:77` |
| LINE Messaging | `internal/line/line.go`, `internal/api/line.go` | Real, but staff-inbox only (see blocker) |
| Student / teacher notification screens (web) | — | **Do not exist** |
| Admin notification surface | — | **Does not exist**; console Settings has only Credit Rules + LINE credentials |
| Push infrastructure | — | **Zero.** No service worker, manifest, VAPID, `expo-notifications`, or PWA anything, in any repo |

## Three blockers to know before estimating

1. **The preference table is parent-shaped.** `notification_preference` is
   keyed by `parent_id` with three fixed boolean columns. Students and admins
   have nowhere to store a preference, and there is no channel dimension —
   "email me but don't push me" is unrepresentable. This table needs replacing,
   keyed on `user_account_id` (which every role has, and which already carries
   `language_preference`).

2. **LINE is not addressable per parent.** The Messaging API can only send to a
   channel-scoped `userId`, learned when someone follows or messages the
   Official Account. The `line_id` on `parent_contact`/`teacher`/`admin` is a
   *display handle* (`@someone`) and cannot be sent to — this is documented at
   `migrations/0007_line_messaging.sql:6-13`. Using LINE as a notification
   channel therefore needs a **follow-and-link flow** plus a migration first.
   Worth weighing anyway: in Thailand LINE is likely the channel parents
   actually read, and the send side is already written.

3. **iOS web push needs the site installed.** Browser push on iPhone Safari
   only works once the parent adds the site to their home screen (iOS 16.4+).
   Android and desktop Chrome behave normally. If most parents are on iPhone,
   plan the PWA install prompt as part of the feature, not as a follow-up — or
   lean on email/LINE for them.

## Suggested shape

Not prescriptive, but this is the model the existing code points at.

```
notification              -- one row per thing that happened, per recipient
  notification_id, user_account_id, type, title, body,
  data (JSON, for deep links), created_at, read_at   -- NULL read_at = unread

notification_delivery     -- one row per channel attempt, for debugging and retries
  notification_id, channel ('inapp'|'email'|'webpush'|'line'),
  status ('pending'|'sent'|'failed'|'skipped_by_preference'), sent_at, error

notification_preference   -- REPLACES the parent-only table
  user_account_id, type, channel, enabled
  PRIMARY KEY (user_account_id, type, channel)
  -- absent row = the default for that type; only overrides are stored

push_subscription
  user_account_id, endpoint UNIQUE, p256dh, auth, user_agent,
  created_at, last_seen_at, failed_at
```

Points that follow from the existing codebase:

- **Render in the recipient's language.** `user_account.language_preference`
  is EN/TH per account, so the sender must pick the language per recipient —
  not per request. Message bodies belong in a server-side catalogue, not in the
  front-end message files.
- **The three current parent flags map onto `type` values**, so the existing
  switches can keep working through a migration that translates them.
- **Web push in Go** means VAPID (ECDSA P-256 JWT) plus RFC 8291 payload
  encryption. The house style avoids SDKs (`mail` speaks SMTP, `line` speaks
  net/http), but hand-rolling AEAD key derivation is a different risk class
  from an HMAC — recommend a reviewed library here, or budget real time and
  tests for it.
- **modernc sqlite is single-writer** (`SetMaxOpenConns(1)`). A fan-out that
  writes one row per recipient inside a request will block reads; generate
  notifications in one transaction and deliver out-of-band.
- **The console's credit thresholds already are the triggers** for the parent's
  "credit" preference (`jtrax-admin/components/pages/SettingsPage.tsx` — low
  credit / expiring days / inactive days), but the two live in different apps
  with nothing connecting them. Any credit-related notification should read
  those settings rather than invent its own numbers.

## Security requirements (house rules — non-negotiable)

- **Every notification query scoped by `user_account_id` at the query layer**,
  not in the caller. A parent must never be able to read another family's row.
- **Push endpoints are per-user secrets.** Treat `push_subscription` rows like
  credentials; never return another user's, never log them.
- **VAPID private key and SMTP credentials come from the environment only.**
  Never committed, never written into a doc or this vault. Follow the sealing
  pattern `LINE_TOKEN_KEY` already uses if they land in the database.
- **Rate-limit anything unauthenticated**, and rate-limit the send path itself
  — a notification system is a spam cannon pointed at the school's own domain
  reputation.
- **An unsubscribe path in every email**, honoured without a login.
- This feature touches auth-adjacent surface (per-user preferences, per-device
  subscriptions): it deserves a second pair of eyes on the isolation.

## Decisions still open

Ask the academy before building:

1. **Which channels ship first** — in-app inbox is the backbone (everything
   lands there regardless); browser push, email and LINE can follow in any
   order. Is mobile push (Expo/FCM/APNs — a *different* mechanism from web
   push) in scope now or later?
2. **Preference granularity** — a per-event × per-channel grid ("check-in →
   push yes, email no"), or master switches per channel? The schema above costs
   the same either way; only the Settings UI differs.
3. **Email host.** The infra rule is free *and* no credit card
   ([[jtrax-free-tier-no-card]] / `decisions/0005-render-and-turso-for-free-hosting.md`).
   Brevo (300/day, no card, plain SMTP) fits the existing `mail` package
   unchanged; Resend needs domain DNS; Gmail SMTP throttles bulk.
4. **The event catalogue** — the academy said they will supply what to notify
   about. Until then, do not guess: the schema above takes `type` as a string
   precisely so the list can arrive later.

## Suggested build order

1. Schema + per-user preferences + in-app inbox (replaces every mock list, in
   all three apps). Nothing external, immediately useful.
2. Settings UI for all three roles.
3. Email channel (the `mail` package already exists) + unsubscribe.
4. Browser push (service worker, VAPID, subscription management, PWA install
   prompt for iOS).
5. LINE, if wanted — needs the follow-and-link flow first.
6. Mobile push, if wanted — separate mechanism, separate token store.

Related: [[public-tournament-registration]], [[line-messaging-in-the-console]]

Tags: #architecture #notifications #planned
