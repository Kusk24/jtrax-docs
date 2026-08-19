# Keeping the free backend awake

**Date:** 2026-08-20 · **Repo:** `jtrax-backend` · **PR:** #30

Slow page loads on the deployed portals were the backend cold-starting, not the frontends: production builds of the student screens load in 57–68ms with <10KB of JS.

## The finding

Render's free plan sleeps a service after **15 minutes** idle; the cold start that follows (30–60s) outlasts Vercel's proxy timeout, so users see 504s or very long loads. `keep-alive.yml` pings `/health` every 10 minutes to prevent that — and it was running and succeeding, yet the service still slept.

The cause: **GitHub does not run scheduled workflows on time.** Observed run times on this repo: 11:00 → 11:35 → 11:55. A 35-minute gap is well past the idle window. The workflow's own history is green; only the goal fails — the same *silent success* shape as the stacked-PR incident in [[git-workflow-verify-the-goal]].

## The fix, and why it is free

Cron every **5 minutes** instead of 10. Two late runs in a row still land inside the window. It costs nothing extra: a service that never sleeps bills the same instance-hours whether pinged 5 or 50 times an hour — the only thing frequency buys is tolerance for GitHub being late. Month of uptime ≈ 730 of the 750 free instance-hours, unchanged, and still only viable while jtrax-backend is the workspace's sole free service.

## Still open

`LICHESS_TOKEN_KEY` and `PUBLIC_API_URL` must be set by hand in the Render dashboard (declared in `render.yaml`, values are secrets). Until then the student portal says "Lichess play is not configured on this server" — accounts link and ratings sync regardless; only game relay is off.

Related: [[rated-games-on-lichess]]

Tags: #ops #deployment
