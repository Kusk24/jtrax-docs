# A failed load is not an empty one

**Found:** 2026-09-12 · **Fixed:** 2026-09-12 ·
**Repos:** `jtrax-admin`, `jtrax-web-app`, `jtrax-mobile-app` ·
**PRs:** admin #123 · web #62 · mobile #18

Seven cards swallowed a failed fetch and rendered their empty state, so "the
API is unreachable" and "there is nothing here" looked identical — and only one
of them was ever a fact.

## Why it was looked for

[[the-tournament-qr-code-was-a-grey-square]] was live for **19 days** and
nobody reported it. The lesson generalised: a failure that looks like a loading
or empty state does not read as broken, so it is never filed. The rest of the
codebase was audited for the same shape rather than waiting for the next one.

93 `catch` blocks discard their error across the three repos. Most are correct
— a refused clipboard needs no interface. The **seven** that mattered all
carried the same comment: *"The empty state covers it; a cold API is not an
error worth showing."*

## The seven, by what a wrong answer costs

| Site | Said, on a failed request | Cost |
|---|---|---|
| `admin RegistrationQueue.tsx` | **the card vanished entirely** | the office sees no queue on a tournament with paid entries waiting |
| `web`/`mobile LichessCard` | "not connected", with a Connect button | a pupil re-links an account they already linked |
| `web`/`mobile ChallengeScreen` | "no invitations" | a child is told nobody wants to play them while an invitation waits |
| `admin ExternalTournaments` | "no external tournaments" | misleading |
| `admin LichessPanel` | "nobody has linked an account" | misleading |

The first was worse than the pattern suggests:

```js
if (!loading && rows.every((r) => r.source !== "Public")) return null;
```

On failure `rows` is `[]` and **`[].every()` is `true`**, so the whole card
returned `null`. Not an empty state — no card at all.

## Fix

Three changes per site, and **no new pattern**:

1. The failure sets an error instead of being discarded.
2. The empty state is **suppressed while errored** — printing "nothing is
   waiting" under "could not load" is a card answering a question it has just
   admitted it cannot answer.
3. `RegistrationQueue` no longer disappears when errored.

`common.loadFailed` already existed in `jtrax-admin` in EN and TH, and five
cards already used it — `ExternalTournaments` was inconsistent *with itself*,
reporting a failed refresh while swallowing the failed initial load. The
portals gained the same key, worded for children: *"We couldn't load this just
now. Please try again."*

## Verified

- **`jtrax-admin`** — `components/failed-loads.test.tsx`, six tests stating the
  rule once for all three cards. They assert the `role="alert"` rather than a
  sentence, because `errorText` prefers an `Error`'s own message; a separate
  test rejects with something unreadable to prove the fallback wording is
  wired. Mutation-checked: swallowing again fails 2, restoring the
  `[].every()` vanish fails 2, showing empty-and-error together fails 1. One
  test pins that a **genuine** empty state still appears on success.
- **`jtrax-web-app`** — no component-testing stack, so verified in a browser at
  390×844 with **only** those two endpoints aborted, so sign-in still worked.
  Both directions: with them down the screens say "couldn't load" and do *not*
  invite a Lichess connection; with them up the genuine empty state returns.
- **`jtrax-mobile-app`** — same change, verification carried by the portal's.

## Lessons

- **A failure state that looks like a loading state will not be reported.** The
  cheapest guard is that they never share a placeholder.
- **`[].every()` is `true`.** Any "is this list entirely X" guard doubles as
  "did this load at all" unless the error is in the condition.
- **Check for a convention before inventing one.** Five cards already did this
  correctly; the fix was finishing a pattern, not adding one.

## Follow-ups

- [ ] **Neither portal has a React component-testing stack.** The admin console
      does, which is why only it has tests for this rule. Worth closing
      properly rather than each time it bites.
- [ ] The remaining ~86 discarded errors were left alone deliberately. Worth a
      skim if the pattern shows up again somewhere with consequence.

Related: [[the-tournament-qr-code-was-a-grey-square]],
[[dark-theme-in-both-consoles]], [[the-phone-catches-up-with-the-portal]],
[[public-tournament-registration]]

Tags: #bug #admin #web-app #mobile #error-handling
