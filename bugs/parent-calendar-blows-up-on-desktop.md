# Parent attendance calendar renders giant circles on laptop widths

**Found:** 2026-08-09 · **Fixed:** 2026-08-09 · **Repos:** `jtrax-web-app`

## Symptom

On the Vercel deploy at `/parent/attendance` viewed on a laptop (≥1024px), the
calendar spanned the full content width; each day cell is `aspect-square`, so
present-day markers became ~170px green circles and the month barely fit on
screen. Same construction existed on `/parent/child/[childId]/history`. On iPad
widths (768–1023px) the whole portal rendered as a 410px phone strip.

## Cause

The parent redesign was ported 1:1 from a 410px-wide phone mockup
([[portal-redesigns-from-claude-design]]). The desktop grid gave the calendar
card `lg:col-span-2` (full width) while its day cells scale with column width
(`aspect-square` in `grid-cols-7`) — nothing capped the card, so cells grew
with the viewport. Below `lg` the shell was hard-capped at `max-w-[410px]`,
which is why tablets got the phone layout.

## Fix

Branch `feature/parent-responsive` (PR pending):

- Attendance page: calendar card capped at `max-w-[440px]` and moved to a
  `lg:grid-cols-[minmax(0,440px)_minmax(0,1fr)]` split — calendar left,
  filter chips + history right (`app/parent/attendance/page.tsx`).
- Child history page: same 440px cap on the calendar column.
- Shell: `md:max-w-[760px]` so iPads get a wide card, and the page grids now
  switch to two columns at `md` instead of `lg` (home, profile, child profile,
  child history).
- Narrow single-column flows (tournament, notifications, announcements)
  centered with `mx-auto`.

Verified via Playwright screenshots at 390 / 768 / 1280 on six parent screens.

## Prevention

House rule already requires verifying at 390/768/1280 — the redesign was only
screenshot at 390/1440 on screens without calendars. When porting fixed-width
mockups, cap any `aspect-square` grid with a `max-w` at the card level before
calling a screen done.

Tags: #bug #web-app #parent #responsive
