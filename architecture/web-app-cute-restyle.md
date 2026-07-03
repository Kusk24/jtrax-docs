# Web app — cute art-style restyle + tablet nav

- **Date:** 2026-07-03
- **Repo/branch:** `jtrax-web-app` · `feature/cute-restyle` (off `main` after the
  parent/student/teacher merges)
- **Status:** Shipped on branch, pending merge

## Art direction
The app adopts a **cute / kawaii (clay-style) look** referencing the soft watercolor
Mofusand-style illustrations, **without changing the theme**: the cream/navy/brick/
olive/peach palette in `globals.css` is untouched. Cute comes from shapes, type, and
motion:

- **Fonts:** Fredoka (headings, via global `h1–h3` rule) + Nunito (body), self-hosted
  through `next/font` variables `--font-display` / `--font-sans`.
- **Shapes:** `--radius-card` bumped 0.875 → 1.25rem; card borders `border` →
  `border-2` (chunky); avatars get a `ring-2 ring-card` sticker outline.
- **Shadows:** new theme tokens `shadow-clay` / `shadow-clay-lg` (soft double shadow)
  replace `shadow-sm`/`shadow-lg` on cards, pills and the bottom nav.
- **Motion:** global squishy press — every `a`/`button` scales to 0.96 on `:active`
  with a bouncy cubic-bezier; active bottom-nav tab plays a small `animate-pop`.
  Both disabled under `prefers-reduced-motion`.

New components must reuse these tokens (`rounded-card`, `border-2 border-line` /
`border-navy/20`, `shadow-clay`) instead of inventing new ones.

## Navigation breakpoint decision
Bottom tab bar is kept through **tablet portrait**; the sidebar starts at **lg
(1024px)** — iPad portrait is held one-handed with thumbs at the bottom, while iPad
landscape/desktop have the width to spare for a sidebar. Implementation: `PortalNav`
and the three portal layouts switched `md:` → `lg:` (`lg:hidden` / `hidden lg:flex` /
`lg:pl-56`), sticky Finish buttons switched to `lg:bottom-6`.

## Verification
`next build` passes. Teacher home screenshotted at 390×844 (bottom bar), 768×1024
(bottom bar — the change), and 1280×800 (sidebar); student home spot-checked. Fredoka/
Nunito confirmed in the served CSS.
