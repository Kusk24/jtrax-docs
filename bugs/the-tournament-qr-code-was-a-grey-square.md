# The tournament QR code was a grey square

**Found:** 2026-09-12 · **Fixed:** 2026-09-12 · **Repos:** `jtrax-admin` ·
**PR:** #122

Every QR code in the console — tournament registration and the public results
page — had been a blank placeholder since the dark theme shipped.

## Symptom

Reported from the console: *"I don't see QR code in our website can you make
it? why it is not working in tournament?"*, alongside the academy's own
Instagram post whose entire instruction is **"SCAN THE QR CODE TO REGISTER"**.

The QR was not missing. `components/tournament/QrCode.tsx` had been there since
[[reference-ui-suite-pass]]; what was on screen was its *loading placeholder*,
permanently.

## Cause

[[dark-theme-in-both-consoles]] (#84) turned every token in `lib/theme.ts` into
a CSS custom property. `QrCode.tsx` passed one of them to the encoder:

```
Invalid hex color: var(--jt-text)
```

`qrcode` parses colour strings itself and cannot resolve a CSS variable.

Three things had to line up for this to survive:

1. The throw happens **inside a promise**, so nothing crashes.
2. The `.catch()` **discarded the error** — there was not even a log.
3. The placeholder shown on failure is **the same placeholder shown while
   loading**, so the screen never looked broken, only slow.

Any one of those missing and it would have been caught the same week.

## Fix

**The colours are literal hex, and not theme tokens — on purpose.** A QR code
is not part of the interface, it is a target for a camera, and scanners are
built for dark modules on a light field. `#000000` on `#FFFFFF` in both themes,
including the padding behind it: a dark quiet zone breaks a scan as thoroughly
as dark modules do.

Encoding moved to `lib/qr.ts`, so the decision about those colours sits
somewhere testable, next to the reason. The catch now logs.

Two things shipped with it:

- **Save QR code** — a 1024px PNG with a four-module quiet zone, named from the
  tournament id in the link. The card's code is 96px; a registration QR's real
  life is on a poster or in a post.
- **The academy's mark in the middle**, from `public/jca-logo.png`. The *school*
  mark, not an event's: this component draws every tournament's code, so an
  event logo would put "CHESSFEST BANGKOK 2026" in the middle of Wellington
  College's. Error correction went M → **H** to pay for it.

## What the logo actually costs

A logo is deliberate damage, so the size is a measured bound rather than a
judgement. On a real level-H encode:

| logo width | % of area | clean | rotated 7° | blurred | shrunk to 300px |
|---|---|---|---|---|---|
| none | — | ✓ | ✓ | ✓ | ✓ |
| **22% (shipped)** | 4.8% | ✓ | ✓ | ✓ | ✓ |
| 35% | 12.2% | ✓ | ✓ | ✓ | ✓ |
| 45% | 20.2% | ✗ | ✗ | ✗ | ✗ |

`LOGO_SCALE` is a constant with a test asserting it stays ≤ 0.25.

## Lessons

- **A failure state that looks like a loading state will not be reported.**
  Worth checking anywhere else the two share a placeholder.
- **Tokenising a palette can break things that are not styling.** Anything
  handed to a library that parses colours — canvas, QR, chart exports, PDF —
  needs a literal. A grep for theme tokens crossing a library boundary is a
  reasonable follow-up.
- **Do not verify a QR by looking at it.** The code this component replaced was
  pseudo-random noise that looked exactly like a QR. These are checked by
  decoding the rendered pixels.
- **Check your decoder against a control first.** OpenCV's default
  `QRCodeDetector` could not read the level-H code *with no logo on it*, which
  read at first like the logo had broken it. `QRCodeDetectorAruco` reads every
  variant.

## Follow-ups

- [ ] **Per-tournament logos.** An event like CHESSFEST wants its own mark. The
      shape already exists — `tournament_regulation` is a per-tournament file
      table with an upload endpoint — so this is a migration plus UI, not a
      design problem.
- [ ] Audit for other theme tokens handed to colour-parsing libraries.

Related: [[dark-theme-in-both-consoles]], [[reference-ui-suite-pass]],
[[public-tournament-registration]], [[tournament-results-and-chess-results]]

Tags: #bug #admin #tournament #dark-theme

## Swept

The same defect class was audited across all three apps and fixed in seven
places — `jtrax-admin` #123, `jtrax-web-app` #62, `jtrax-mobile-app` #18. See
[[a-failed-load-is-not-an-empty-one]].
