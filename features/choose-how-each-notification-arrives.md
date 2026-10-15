# Choose how each notification arrives

**Shipped:** 2026-10-15 · **Repos:** `jtrax-backend`, `jtrax-web-app`, `jtrax-mobile-app` · **PRs:** backend #114, web #112, mobile #66 (all merged; backend and web deployed)

In a parent's Settings, on the web and the phone, **School Announcements** and **Payment Receipts** now show *Also by: Email · Phone app · Browser* under their switch. A parent can keep announcements in the app and stop the email, take receipts on the phone but not in the browser, and so on.

## Why

On 2026-10-15 the user asked whether parents can manage their notifications on the web and the phone. They could, but only one switch per type: a type was either on everywhere or off. The user asked for per-channel choices.

## How it works

- **The academy's rule is in one place:** `notify.ChannelsFor(type)`. Only announcements and payment receipts leave the app (email, browser push, phone push); check-in, check-out, credits, reminders and cancellations stay in the bell.
  - `Send` now enforces the rule itself, so a caller that forgets `InAppOnly` can't email a check-in.
- **The apps learn it from the server:** `GET /api/v1/notification-settings` returns `channelsByType`, so the switches appear only where a channel can actually be used.
- **Saving uses what already existed:** `PUT` with `channel: email|webpush|mobile`, read by `prefEnabled`. Absent means on. No schema change.
- **Both apps share a helper:** `lib/notification-channels.ts` is the same file in web and mobile.
  - The switch row is `NotifChannelSwitches`, shown only while the type itself is on.
  - Strings `pv2.notifAlsoBy` and `notifBy*` are in EN and TH.

## Verified

Driven in Chrome against a local backend on `main`:
- on the web, at 390 px (EN) and 1280 px (TH), switching off Announcements by Email survived a reload;
- in the phone app's web build, that choice showed there too, and switching off Payment Receipts by Browser saved.

Backend tests check `channelsByType` for every type, an announcement with email off still landing in the inbox, and a check-in sent without `InAppOnly` staying in-app.

## Follow-ups

- [ ] The phone app needs a new build to reach installed phones (no over-the-air updates are set up).

Related: [[notifications-system-plan]], [[the-browser-could-not-save-a-setting]], [[parents-get-notifications-in-the-browser]]

Tags: #feature #notifications #web #mobile #backend #parent
