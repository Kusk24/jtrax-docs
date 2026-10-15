# The browser could not save a setting

**Fixed:** 2026-10-15 · **Repo:** `jtrax-backend` · **PR:** #113 (merged, deployed the same day)

The backend's CORS answer allowed `GET, POST, PATCH, DELETE` but not **PUT**. A browser refuses a cross-origin call with an unlisted method before the server sees it. So in the phone app's browser build, a parent's notification switch flipped on screen but never saved, and the console showed "blocked by CORS policy".

## Who it hit

- `PUT /api/v1/notification-settings` (a parent's switches) and `PUT /api/v1/ocr` (the scan model).
- Only browser clients calling the API **directly** from an origin in `ALLOWED_ORIGINS`, such as the Expo web build used to test the phone app.
- **Not** the installed phone app: native code has no CORS.
- **Not** the web portal or admin: both call the API through their own same-origin proxy.

## Fix

`internal/httpx/middleware.go`: PUT is added to `Access-Control-Allow-Methods`. The origin rules are unchanged.

`TestCORSAllowsEveryMethodTheAPIUses` fails without the fix.

## Found while

Checking whether parents can manage notifications on the web and the phone. They can on both:
- Settings shows a switch per notification type, saved per account.
- A type the school has turned off is hidden.
- The web portal also has the "Notifications on this browser" switch.

Notifications go to parents only, so students and teachers have nothing to manage.

Driven both ways in Chrome at 390 px: a switch flipped on the web was off on the phone, and one flipped on the phone stayed off after a reload.

Related: [[notifications-system-plan]], [[parents-get-notifications-in-the-browser]], [[phone-catches-up-and-gets-push]]

Tags: #bug #notifications #backend #mobile
