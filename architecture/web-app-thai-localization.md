# Web app — Thai localization (en/th)

- **Date:** 2026-07-03
- **Repo/branch:** `jtrax-web-app` · `feature/thai-localization` (stacked on
  `feature/cute-restyle` — merge that first)
- **Status:** Shipped on branch, pending merge

## Approach
**next-intl, cookie-based (no URL locale prefix).** The locale lives in a `locale`
cookie read by `i18n/request.ts`; default is English. No route churn, server and client
components both translate via `useTranslations` / `getTranslations`. Side effect: all
routes are now server-rendered on demand (ƒ) because the cookie is per-request.

Dictionaries: `messages/en.json` + `messages/th.json`, namespaced
(`landing/nav/common/days/home/schedule/attendance/checkin/roster/notifications/profile`).

## Thai quality decisions (not literal translation)
- **Role-aware wording:** teacher tabs are ตารางสอน / เช็คชื่อ (teaching schedule /
  roll-call) while student & parent tabs are ตารางเรียน / การเข้าเรียน.
- Natural UI phrases: วันนี้คุณมี 1 คลาสเรียน, คลาสที่กำลังจะถึง, มาทั้งหมด / ขาดทั้งหมด,
  เสร็จสิ้นการเช็คชื่อ, เหลือ 2 เครดิต | หมดอายุ 20.5.26.
- Dates in Thai use **Buddhist Era** (พ.ศ. 2569) in the translated header string.
- Weekday strip labels translate through the `days` namespace (MON → จ. …).
- **Thai font:** Mitr via `next/font` appended to both font stacks — Latin stays
  Fredoka/Nunito, Thai glyphs fall through to Mitr (cute + legible). Thai gets
  `letter-spacing: 0` on headings and looser body line-height for vowel marks.
- **Mock data stays English** (names, courses, locations, notification bodies) — it
  represents backend data, which will be localized at the data layer later.

## Language switcher placement
- **Landing page:** top-right corner (standard website placement) — `LanguageToggle`
  EN ⇄ ไทย pill.
- **Inside portals:** top-right is occupied (bell/avatar), so per the "if it conflicts,
  put it in settings" rule the toggle lives in each profile page: student & parent
  profiles get a Language row in the **More** card; teacher profile gets a Language card.
- The toggle writes the cookie and calls `router.refresh()` — no reload, state kept.

## Verification
`next build` passes. All 8 key screens screenshotted at 390×844 with the `th` cookie
(Playwright script — the CLI can't set cookies) and teacher home re-checked with no
cookie (English default intact). Verified role-aware nav labels render differently per
portal in Thai.
