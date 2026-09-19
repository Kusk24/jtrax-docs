# Linting the web app

**Date:** 2026-09-20 · **Environment:** development

## What this covers

How `pnpm lint` runs in `jtrax-web-app`, and what it currently reports.

Next 16 removed `next lint`. The web app's `lint` script was still `next lint`, and nothing else stood behind it: there was no ESLint dependency and no config. So `pnpm lint` failed with "Invalid project directory provided … /lint" and had not linted anything since the upgrade. Fixed in web #72 (opened 2026-09-20).

## Steps

1. The setup matches `jtrax-admin`:
   - `eslint@^9` and `eslint-config-next@16.2.10` as dev dependencies;
   - `eslint.config.mjs` with core web vitals + TypeScript;
   - `"lint": "eslint"`.
2. Run it:
   ```bash
   pnpm lint
   ```

## Gotchas

- **Vendored bundles are ignored.** `public/models/**` (the ONNX runtime the chess models run on) and `public/stockfish/**` are minified third-party code. Linted, they produced 6,400+ of the first run's 6,442 findings.
- **It still exits 1.** It reports 16 real findings in our code: 11 × `react-hooks/set-state-in-effect`, 2 × `react-hooks/immutability` and 3 unused variables, across 13 files.
- **Admin is in the same state**, with 14 findings. The mobile app's `expo lint` sits around 169, most of them the same `set-state-in-effect` rule fired by ordinary data loading ([[the-phone-catches-up-with-the-portal]]).
- **Fixing them is its own change.** It alters how screens load data, so it doesn't belong in a tooling PR.

## Secrets

None.

Related: [[the-phone-catches-up-with-the-portal]]

Tags: #ops #tooling #web
