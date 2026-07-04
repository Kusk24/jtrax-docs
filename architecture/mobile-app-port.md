# Mobile app — React Native port of the web app (jtrax-mobile-app)

- **Date:** 2026-07-05
- **Repo:** `jtrax-mobile-app` · remote `git@github.com:Kusk24/jtrax-mobile-app.git`
- **Branches:** `main` (scaffold + foundation + role select) →
  `feature/student-portal` → `feature/parent-portal` → `feature/teacher-portal`
  (stacked; merge in order). 12 small commits.
- **Status:** All 21 screens ported from **web-app `main`** (cute clay theme —
  explicitly *not* the sketch-theme branch); typecheck clean; verified visually
  via Expo Web + Playwright (en + th).

## Stack (chosen to copy from the web app, not rewrite)
- **Expo SDK 57 + expo-router** (`src/app/` file routing ≈ Next App Router;
  dynamic routes like `[childId].tsx` map 1:1).
- **NativeWind 4 + Tailwind 3.4** — same utility classes as the web app; palette
  copied into `tailwind.config.js`. pnpm gotcha: `react-native-css-interop` must
  be a *direct* dependency or Metro can't resolve NativeWind's jsx runtime.
- **use-intl** — the engine inside next-intl, same `useTranslations` API and the
  **same `messages/en.json`/`th.json` copied verbatim**; locale persisted in
  AsyncStorage instead of a cookie (`I18nProvider` + `useLocaleSwitch`).
- **lucide-react-native** (same icon names as web incl. chess pieces),
  `react-native-svg`, shared `PawnIcon` port.
- **Fonts:** Fredoka + Nunito via `@expo-google-fonts`; native fonts are one
  family per weight, so weights are utilities: `font-sans`, `font-sans-semibold`,
  `font-sans-bold`, `font-sans-extrabold`, `font-display(-semibold)`. Thai glyphs
  fall back to the system Thai font (no per-glyph fallback in RN).
- **Data:** `lib/types.ts` + the three mock-data files copied verbatim from
  web-app main.

## Porting rules used (for future screens)
div→View, p/h/span→Text (every string must sit in a Text), Link→expo-router
Link asChild + Pressable, button→Pressable (`active:` replaces hover), flex-row
must be explicit, `ring-2 ring-card`→`border-2 border-card`, icon colors via
`lib/colors.ts` hexes, `fill-*` via icon `fill` prop, Avatar splits the data's
combined `bg-*/text-*` class string. Custom bottom tab bar (`PortalBottomNav`)
instead of native Tabs so the design matches the web exactly.

## Known gotcha
**expo-router typed routes** regenerate only when the dev server (re)starts —
`tsc` reports new routes as invalid until then. Restart `expo start` before
typechecking after adding routes.

## Verification
Expo Web (react-native-web) on :8090 + Playwright at 390×844: role select
(en+th switch), student home/profile/check-in, parent home, teacher
home/manual check-in/summary — all pixel-faithful to the web portals.
