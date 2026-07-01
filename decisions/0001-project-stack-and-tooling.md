# 0001 — Project stack and tooling

- **Status:** Accepted
- **Date:** 2026-07-02

## Context
JTrax is split into three repos under a single parent folder (which is also the Obsidian
vault): `jtrax-backend`, `jtrax-web-app`, `jtrax-docs`. We needed an initial stack for the
backend and web app.

## Decision
- **Backend (`jtrax-backend`):** Express 5 + TypeScript (ESM). Single `GET /health` route to start.
- **Web app (`jtrax-web-app`):** Next.js 16 (App Router) + React 19 + Tailwind CSS v4
  (`@tailwindcss/postcss`), TypeScript.
- **Package manager:** pnpm across all repos. `pnpm-lock.yaml` is committed; `node_modules`,
  `.next`, `dist`, and `next-env.d.ts` are gitignored.

## Consequences
- Both dev servers default to port **3000** — run one on an alternate port when running them
  together (e.g. `PORT=3001 pnpm dev` for the backend, or `next dev -p 3001` for the web app).
- Initial scaffold was committed straight to `main` (repos were empty); feature work uses a
  branch per logical seam from here on.
- Verified at scaffold time: backend compiles and `/health` responds; web app passes
  `next build` and prerenders `/`.

## References
- `jtrax-backend` `1e9ac88` · `jtrax-web-app` `6da9597`
