# The phone catches up with the web portal, and gets push notifications

**Shipped:** 2026-09-24 (in review) · **Repos:** `jtrax-mobile-app`, `jtrax-backend` · **PRs:** mobile #26–#30, backend #68

The phone app now has what the web portal gained since it was last brought level, and it receives push notifications for everything the inbox gets.

## Why

The user asked on 2026-09-24 for the phone to be synchronised with the web app first, then to get push. A comparison of routes, shared `lib/` files and commits found four things the web had and the phone did not.

## The catch-up

| PR | What | Came from |
|---|---|---|
| mobile #26 | The parent's streak counts actual practice days (`streakFrom`), not `student.streak_count` | web #64 |
| mobile #27 | Free Play at Beginner, Intermediate and Advanced, on the existing puzzle board via `/student/puzzles/free?tier=` | web `2e638fe` |
| mobile #28 | A captured-pieces tray and material lead on the computer and class-game boards | web `7fc1ba6` |
| mobile #29 | Move sounds with an on/off speaker button, through `expo-audio` | web #74 |

Found on the way (#28): the piece SVGs had no `viewBox`, so they were **cropped, not scaled**, at every size. `pieceArt` now adds one.

In #29 the `expo-audio` plugin is configured with the microphone and background audio **off**. Its defaults would have added both permissions to the app.

## Push notifications

**Backend (#68)**
- `internal/push` is a small Expo push client: batches of 100, and it reads each result ticket.
- `notify.Service.SetPush` sends every `mobile` delivery after the inbox commit, to every phone the person has registered.
- A phone Expo reports as `DeviceNotRegistered` (the app was removed) gets `failed_at` set and is not tried again.
- The school's per-type switch and the person's per-channel switches still apply.
- `push-subscriptions` only accepts an Expo token for `mobile`.
- `EXPO_ACCESS_TOKEN` is optional.

**Phone (#30)**
- After sign-in and on each launch: ask permission, create the Android `default` channel, get the Expo token, and register it.
- On sign-out, the token is unregistered before the session is revoked.
- Banners still show while the app is open.
- A tap opens Notifications, or Announcements for an announcement (parent), or Home (student).
- `PushResponder` renders nothing on the web, where the underlying Expo call throws.

## Set-up that only the user can do

1. `eas init`, which writes `extra.eas.projectId`. Without it the phone gets no token and quietly skips push.
2. Android: upload an FCM V1 key from a free Firebase project to the Expo credentials.
3. iPhone: an Apple Developer account; `eas build` creates the push key.
4. A real build (`eas build`). Expo Go cannot receive push on Android since SDK 53.

## Merge order

- Backend #68 before mobile #30.
- Mobile #27 before #29, which is built on #27.
- All the other mobile PRs merge cleanly with each other.

## Not verified

No real push reached a real phone. That needs the set-up above and a device. Sound and push were checked in Expo web and through unit and API tests with a fake Expo.

Related: [[families-hear-about-cancellations-and-fees]] [[low-credit-is-sent-by-staff]] [[the-board-makes-a-sound]] [[mobile-app-port]] [[notifications-system-plan]]

Tags: #feature #mobile #notifications #push #backend
