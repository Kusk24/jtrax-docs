# URL state: refresh and Back keep you where you were

**Shipped:** 2026-10-15 (merged, not yet deployed) · **Repos:** `jtrax-web-app`, `jtrax-admin`, `jtrax-mobile-app` · **PR:** web #115 · admin #183 · mobile #69

Refreshing a page, pressing Back, or opening a shared link now lands on the same screen: the open record, its tab, a wizard step, the filters, the page of a list. Before, all of these went back to the start.

## Why

The user reported it on 2026-10-15 and asked for it to be fixed everywhere. The worst case was a parent halfway through a tournament entry losing the step and everything they had typed. **"URL state"** is now the user's name for this. Use it in requests: "make this URL state".

## The rule (the standard)

- **In the address:** anything a person would expect to bookmark, share or go Back to. That means the open record, the tab, the wizard step, filters, the page of a list, and the selected round or day.
- **Moving vs refining:**
  - Moving somewhere (open a record, switch tab, next step) **pushes** a history entry, so Back retraces it.
  - Refining what is shown (filters, page) **replaces** the entry, so Back leaves the screen instead of undoing chips.
  - The console keeps its older convention: opening and closing a record push, and tabs replace.
- **Never in the address:** anything typed. Search text and form drafts are often a child's name, and addresses end up in server logs and browser history.
  - Web and console keep drafts in `sessionStorage`, for that tab only.
  - Mobile keeps them in memory, for the life of the app.
- **Not URL state:** transient UI such as hover, an open dropdown or a toast. Per-device preferences, like the console's table/cards view, stay in `localStorage`.
- **Forged values fall back.** An address naming a step the family cannot be on, another family's child, or an unknown filter shows the nearest valid screen.

## How it works

- **Web:** `lib/url-state.ts`.
  - `useUrlValue` / `useUrlParam` read the search params; their setters push or replace.
  - A `back()` helper retraces entries the screen pushed, and after a reload steps back in place instead of leaving the site.
  - `useSessionDraft` keeps form drafts per tab.
  - Screens covered: parent tournament entry (`?step=`), notifications (`?tab=`), attendance (`?child=&month=&course=`), student puzzles (`?level=`), public results (`?round=&category=`).
  - Public results render under Suspense, with the plain view as the fallback, so the pre-rendered HTML still has the pairings.
- **Console:** builds on the existing `useUrlBackedState`.
  - The section route now passes the whole query down as `query`.
  - **Fix:** two writes in one click (set a filter, reset the page) used to lose the first. The hook now remembers its last write until the address catches up.
  - `useSessionText` keeps search boxes per tab.
  - Screens covered: Students, Parents, Payments, Games, Class history, Tournament participants, Messages.
- **Mobile:** route params via `router.setParams`.
  - `src/lib/url-state.ts` holds the rules (tested); `use-url-state.ts` holds the hooks.
  - Android's hardware Back steps back through the tournament flow.
  - Screens covered: tournament, notifications, attendance, student history.

## Not done

- The console's two create wizards (student registration, tournament) still restart on refresh. They hold uploaded files, which can't survive a reload.
- The student puzzle board: a refresh mid-puzzle returns to that section's list, not to the half-played board.
- Android hardware Back was not verified (no emulator). Check it on the rebuild.

Related: [[jtrax-web-verify-recipe]], [[a-tab-is-not-somewhere-you-came-from]], [[admin-console-ux-pass]]

Tags: #feature #web-app #admin #mobile #navigation
