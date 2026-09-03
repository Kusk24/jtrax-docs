# One typeface across every app

**Shipped:** 2026-09-03 · **Repos:** `jtrax-web-app` · **PRs:** web #53

[[one-palette-across-every-app]] gave every front-end the academy's navy. The
child's app was still in a different voice: **Chewy** and **Comic Relief**, a
rounded hand-drawn pair chosen to read as a child's app. It now uses **DM Sans
and Poppins**, the console's pairing, which the parent portal already had.

Asked for plainly: *in children web app, use the font that is used in admin web
app and parent web app.* A family moving between the parent portal and their
child's saw two different products, and the academy is one.

The change is one line per slot. The `--font-sv-body` / `--font-sv-display`
tokens stayed, so no student screen had to be touched — **what a name resolves
to is the change; renaming the slot would have edited every file for nothing.**

The playfulness lives in the colour, the spacing and the squishy press
feedback. None of that moved.

## The weight that came with the face

Those headings carried `font-normal`, which was not a design choice — Chewy
ships weight 400 and nothing else, so the class was a description of what was
available. Poppins at 400 reads thin in a 32px white heading, and the parent
portal pairs the same face with bold. They take `font-bold` now.

**A font swap is not only a family swap.** Every weight, size and tracking
value around it was tuned against the old face, and the ones that were tuned
around a *limitation* of it are the ones that break quietly.

## The bug underneath — an unlayered rule beats every layer

The real find. `globals.css` had, outside any layer:

```css
h1, h2, h3 { font-family: var(--font-display); }
```

**Unlayered declarations beat every cascade layer, regardless of specificity.**
Tailwind emits utilities into `@layer utilities`, so this rule outranked
`font-sv-display` and `font-pp-display` on any heading that used them — a class
that says exactly what it wants, losing to a bare element selector.

Which would have been visible immediately, except that `--font-display` is
**empty at `:root`**. Runtime `next/font` variables get pruned out of a plain
`@theme` — the file says so, in a comment beside the two `@theme inline` blocks
that exist to work around it, and `--font-sans` / `--font-display` were in the
plain one anyway. An empty custom property makes the declaration *invalid at
computed-value time*, which for an inherited property means **inherit**. So the
heading silently took its parent's font, which was the body font, which looked
entirely deliberate.

Two mechanisms, each harmless-looking, and the failure is the composition:

- The rule wins when it should not, and
- resolves to nothing when it does.

Either alone would have been obvious. Together they produce a heading that
renders plausibly and never once used the font it names.

**It was not only the student side.** Measured on the same page, before and
after:

| | before | after |
|---|---|---|
| `/parent` h1, class `font-pp-display` | DM Sans | **Poppins** |
| `/parent/settings` h1, same class | DM Sans | **Poppins** |
| `/`, `/forgot-password` h1, no font class | ui-sans-serif | unchanged |

The parent portal's headings had been classed for Poppins since it was built
and were rendering in the body font the whole time.

The fix is `@layer base` around the rule: a heading that names its own face
wins, one that names none still inherits exactly as before. **Base styles
belong in the base layer** — that is what the layer is for, and unlayering one
turns it from a default into an override.

## Follow-up left alone deliberately

`--font-sans` and `--font-display` are still empty, so the public pages —
sign-in, forgot-password, the tournament pages — fall through to
`ui-sans-serif` instead of the Nunito/Fredoka they name. Moving them into
`@theme inline` would fix it and **restyle every public page in the same
commit**, which is a design decision rather than a bug fix, and nobody asked
for it. Recorded here so the next person finds the cause rather than the
symptom.

- [ ] Decide whether the public surfaces are meant to be Nunito/Fredoka. If
      yes, the fix is moving both tokens into the `@theme inline` block beside
      the `pp-` and `sv-` ones.

## Also in this change: a control that controlled nothing

The parent settings screen had **Daily Screen Time**, under Game Settings, with
an hours-and-minutes picker. It set React state and nothing else: no request,
no column, no check anywhere in the student app, and the answer was forgotten on
reload.

It read as a parental control and enforced nothing. **A limit a parent believes
is running is worse than no limit at all** — the same shape as the invented
addresses in [[a-child-signs-in-with-an-id]]: a field that answers a question
the system cannot actually answer.

Related: [[one-palette-across-every-app]], [[student-portal-in-academy-colours]],
[[a-child-signs-in-with-an-id]], [[a-form-that-kept-none-of-what-it-collected]]

Tags: #feature #web #design #css
