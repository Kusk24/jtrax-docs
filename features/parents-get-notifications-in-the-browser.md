# Parents get notifications in the browser

**Shipped:** 2026-10-07 · **Repos:** `jtrax-backend`, `jtrax-web-app` · **PRs:** backend #87, web #97 (merged, deployed to Lightsail the same day)

A parent can switch on **Notifications on this browser** in the portal's Settings. Every notification their inbox gets then also appears as a browser notification, even when no JTrax tab is open.

## Why

Browser push looked finished but never was. On 2026-10-07 the user asked which branch had been left behind. None had: the work had only ever been started.

- Migration 0018 already had the `webpush` channel and the `p256dh`/`auth` columns.
- `POST /api/v1/push-subscriptions` already accepted browser subscriptions.
- But `notify.Send` left every browser delivery `pending`, with the comment "Browser push has no sender yet".
- No branch in any repo had a service worker or a subscription flow.

Phone push was complete: backend #68 and mobile #30.

## How it works

**Backend**
- `internal/webpush/webpush.go` sends Web Push using `github.com/SherClockHolmes/webpush-go`, with aes128gcm encryption and VAPID signing.
  - The keys come from the environment only: `WEBPUSH_VAPID_PUBLIC_KEY`, `WEBPUSH_VAPID_PRIVATE_KEY` and `WEBPUSH_SUBJECT`.
  - Without all three, `New` returns nil and the channel stays off.
  - A message is kept by the push service for 24 hours (TTL).
  - A 404 or 410 from the push service counts as **gone**.
- `notify.Service.SetWebPush` turns the channel on. `sendToBrowsers` runs after the commit, like email and phones:
  - one request per browser;
  - the delivery is `sent` if any of the person's browsers received it;
  - a gone subscription gets `failed_at` and is not tried again.
  - The payload is `{title, body, data:{notificationId, type, …}}`, the same data the phone gets.
- It is wired in both places a notifier is built: `internal/api/routes.go` and `cmd/server/main.go` (the background jobs).
- `GET /api/v1/push-subscriptions/webpush-key` gives a signed-in caller the public key. It answers 404 while browser push is not set up.
- Registering a `webpush` subscription now requires:
  - an https endpoint on a known push service (Google, Mozilla, Apple or Microsoft; `webpush.AllowedEndpoint`);
  - a 65-byte `p256dh` and a 16-byte `auth`.
- `go run ./cmd/vapidkeys` prints a new key pair. The deployment steps are in `docs/deployment.md` under "Browser notifications".

**Web app**
- `public/sw.js`:
  - shows each push, tagged with the notification id so a repeat does not show twice;
  - opens `/parent/announcements` for an announcement and `/parent/notifications` for anything else, the same screens the phone opens;
  - registers a renewed subscription itself when the browser replaces one (`pushsubscriptionchange`).
- `lib/browser-push.ts` covers: the state (`unavailable` / `unsupported` / `blocked` / `off` / `on`), turning it on (permission, then subscribe, then register), turning it off, and `forgetBrowserPush`.
  - A subscription made with an old key is dropped.
  - An existing subscription is registered again when Settings opens, so it is tied to whoever is signed in now.
- `components/parent/BrowserPushSwitch.tsx` sits at the top of Settings → Notification Preferences.
  - It is hidden while the server has no key.
  - Where the browser can't show notifications, or the parent blocked them, it shows a sentence explaining that instead of a switch.
  - Its strings are in EN and TH (`pv2.browserNotif*`).
- `components/SignOutButton.tsx` unsubscribes the browser before signing out, so the next person to use it does not get the last parent's alerts.

## Decisions made along the way

- **Library, not hand-rolled crypto.** `webpush-go` is the common Go implementation.
  - The test in `internal/webpush/webpush_test.go` acts as the browser: it decrypts the request body using its own implementation of RFC 8291 and verifies the VAPID signature. That checks the output is readable by a browser, not just that the library agrees with itself.
  - `golang.org/x/crypto` was raised to v0.57.0 as part of this.
- **Endpoints are allowlisted.** The server POSTs to whatever endpoint a subscription names. Without the allowlist, a parent could make the server call an address inside its own network (SSRF).
- **Parents only.** The parent portal is the only web portal with an inbox. Students get pushes on the phone.
- **An explicit switch, not a prompt on load.** Browsers penalise sites that ask for permission unprompted, and Safari only shows the prompt in answer to a click.

## Verified

- **Backend:** `go test ./...` passes. The new tests cover:
  - a push that a browser can decrypt, with a valid signature;
  - gone and error responses;
  - the endpoint allowlist;
  - a check-in reaching the browser channel;
  - a gone browser not being tried again;
  - no keys, so the delivery stays pending;
  - the key endpoint's 404, 200 and 401 answers.
- **Web:** vitest 207 passing. `lib/service-worker.test.ts` runs `public/sw.js` against a stand-in browser.
- **Driven end to end** in real Chrome through Playwright, against a local backend with local-only keys:
  - the switch subscribed through `fcm.googleapis.com` and registered (201);
  - an announcement posted as admin appeared as a Chrome notification ("Browser push test / No class on Monday.");
  - the delivery row is `sent`;
  - switching off removed the subscription (DELETE 200).
- **Speed:** the first subscribe in a fresh Chrome profile took about 32 seconds, which is Chrome connecting to Google's push service for the first time. The switch stays disabled until it finishes.

## Follow-ups

- [x] Merged (backend #87, web #97) and deployed 2026-10-07. Checked after the deploy: `/sw.js` answers 200 and the key route answers 401 without a session.
- [x] Production keys added to `~/apps/jtrax-backend/.env` by hand on 2026-10-07. Backend #88 made `WEBPUSH_SUBJECT` optional: it falls back to `MAIL_FROM`, then `APP_URL`. My first attempt took the API down: I wrote a comment line and `export` prefixes into `.env`, which is read as plain `NAME=value` lines, and the API crash-looped until the backup was restored.
- [ ] Confirm in production: a parent sees the switch in Settings, and an admin announcement arrives as a browser notification.
- [ ] iPhone and iPad: Safari supports Web Push only for a site added to the Home Screen, which needs a web app manifest. The portal has none, so those parents see "This browser can't show notifications". This is a product decision.
- [ ] `architecture/notifications-system-plan.md` still says browser push is not sent.

Related: [[phone-catches-up-and-gets-push]], [[notifications-system-plan]], [[low-credit-is-sent-by-staff]]

Tags: #feature #notifications #backend #web #parent
