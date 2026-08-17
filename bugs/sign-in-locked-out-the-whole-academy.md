# Sign-in locked out the whole academy

**Found:** 2026-08-17 · **Fixed:** 2026-08-17 · **Repos:** `jtrax-backend`, `jtrax-admin`
· **PR:** jtrax-backend#19, jtrax-admin#44

Staff could not sign in to the deployed console. The screen said **"invalid email
or password"**; the password was correct.

## Cause

Sign-in was rate-limited **per client IP** at ten a minute. The comment on
`clientIP` even explained the proxy problem and solved it with `X-Forwarded-For`
— which works when the *browser* calls the API.

It does not, because **the portals call the API from their own servers**. A
Next.js server action on Vercel makes the request, so Render sees Vercel's
address for every member of staff, and there is no end-user `X-Forwarded-For` to
read. The budget was never "ten tries for you"; it was **ten tries for the whole
academy**, and the eleventh person to sign in that minute was refused.

Forgot-password was worse: **three a minute, shared**.

The console then made it undiagnosable. `signIn` mapped every non-OK response to
`"invalid"`, so a 429 rendered as *"invalid email or password"* — which sends a
person to reset a password that was right.

## Fix

- **Sign-in is budgeted per account**, inside the handler. Guessing at one
  person's password is still throttled and cannot take a colleague down. A
  correct password clears the budget, so earlier fumbles are not still counted.
- **Forgot-password is budgeted per address** — the limit exists to stop anyone
  using the academy's mail reputation to pester a third party, which is a
  per-address concern, not a per-IP one.
- The remaining IP limits are flood guards set well above any real burst.
- **429 is a distinct state in the UI**, in EN and TH.
- Limiters are owned by the handler, not the package, so two servers in one
  process do not share a budget. (They did, and it broke unrelated tests.)

## The lesson worth keeping

**An IP-based rate limit is meaningless when the caller is your own server.** Any
limit on a server-to-server endpoint has to key on something that identifies the
*end user* — here, the account. Check every other IP-keyed limit against this
before adding one.

## Two bugs found in the same area

- **Emails are case-insensitive; the `UNIQUE` index is not.** Every write path
  lower-cased, but a row that ever got in as `Head@JCA.ac.th` — an import, a
  direct SQL edit, an older build — could never be signed in to, because sign-in
  lower-cases what is typed. Migration `0010` repairs those, skipping any that
  would collide (merging two accounts is not a migration's decision). Sign-in
  now matches on `lower(trim(email))` too.
- **"At least 8 characters" meant 8 bytes.** `len(p) < 8`, written out in four
  places. Thai is three bytes per character, so a **three-character** Thai
  password passed. Now one `ValidatePassword`, counting runes. `roster.go` — the
  `JTRAX_ROSTER_PASSWORD` import — had no password rule at all.

Related: [[backend-crud-and-live-portals]]

Tags: #bug #auth #rate-limiting #deployment
