# Admin app — scaffold (jtrax-admin)

- **Date:** 2026-07-03
- **Repo/branch:** `jtrax-admin` · `main` (initial scaffold)
- **Remote:** `git@github.com:Kusk24/jtrax-admin.git`
- **Status:** Scaffolded and pushed; portal screens come next from mockups

## What it is
Separate Next.js app for the two admin roles:
- **Super admin** (`/super`) — manages branches and branch admins, whole-school view.
- **Branch admin** (`/branch`) — manages one branch's teachers, students, classes.

## Setup (mirrors jtrax-web-app exactly)
- Next.js 16 App Router + React 19 + TypeScript + Tailwind v4, **pnpm**.
- **Design system ported from the web app:** same `globals.css` (unchanged palette:
  cream/navy/brick/olive/peach, clay shadows, `--radius-card`, pop animation, squishy
  press), Fredoka + Nunito + Mitr via `next/font`, `lucide-react` icons.
- **i18n ported:** next-intl cookie locale (`i18n/request.ts`, `messages/en.json` +
  `th.json`), `LanguageToggle` top-right on the landing page. Admin Thai wording:
  super admin = ผู้ดูแลระบบส่วนกลาง, branch admin = ผู้ดูแลสาขา. Dictionaries are seeded
  with shared namespaces (`landing/nav/common/days/notifications`); every new admin
  string goes into **both** files.
- `PortalNav` copied over for reuse (bottom tab bar < lg, sidebar ≥ 1024px) — admin
  tab configs will be added per portal.
- Landing page = temporary role select (Super Admin / Branch Admin cards), same
  pattern as the web app's landing.

## Workflow
Same as other code repos: one meaningfully named branch per seam (e.g.
`feature/super-admin-*`, `feature/branch-admin-*`), small logical commits, push the
branch. `main` holds the scaffold. `pnpm build` verified before push.
