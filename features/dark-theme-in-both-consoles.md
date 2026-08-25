# Dark theme, in the console and the parent portal

**Shipped:** 2026-08-24 · **Repos:** `jtrax-admin`, `jtrax-web-app`
**PRs:** console #84 · portal #46, re-landed as #47 (see [[stacked-prs-never-reached-main]])

Both apps follow `user_account.theme_preference` — Light, Dark, or System
(the OS) — saved through the existing `PATCH /auth/me`, so the choice follows
the person to any machine.

## Console (#84)

Every colour already went through `lib/theme.ts`; its 39 tokens are now
`var(--jt-*)` references defined once in `globals.css` with dark halves via
`light-dark()`. An Auto/Light/Dark pill sits beside the language toggle.

## Parent portal (#46)

The profile's theme picker — dead state since the design port — now applies
and persists. The layout server-renders `data-theme` from the account, so dark
arrives dark with no flash.

**The trap worth remembering:** the portal scopes its theme to the shell div,
and Tailwind v4 registers `@theme` variables at `:root` — so `light-dark()`
resolves against the *page's* scheme, not the shell's. The attribute flipped
and nothing changed, found only by driving it. The portal uses classic scoped
variable overrides instead; the console gets away with `light-dark()` because
its toggle sets the root element itself.

## Deliberately not themed

The chess board and pieces (both apps) and the navy gradient cards: a pupil's
game looks the same to the pupil, the parent and the office, whatever the
theme, and the gradient cards are dark in both.

Related: [[one-palette-across-every-app]],
[[the-parent-portal-reads-the-real-rows]], [[admin-app-jtrax-design-port]]

Tags: #feature #admin #web-app #ux
