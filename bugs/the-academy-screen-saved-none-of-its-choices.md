# The Academy screen saved none of its choices

**Found:** 2026-08-21 · **Fixed:** 2026-08-23 · **Repos:** `jtrax-admin`, `jtrax-backend`
**PRs:** console #77 #78, backend `4ed9793` (migration `0022`)

## Symptom

From the console: choosing a piece for a class and pressing Save changed
nothing. The icon snapped back the moment the form closed. The Badge field
looked like free text and always showed the class type back. And every class in
the academy was a **Group** class, whatever it actually was — including the
private ones.

Recorded as open in [[ui-audit-2026-08-21]]: *"Academy: Badge, Icon and teacher
Status are collected and never sent; every course saves as Group."*

## Cause

Three separate faults that all present as "the form does not save".

**The icon and badge had nowhere to go.** There were no columns. The console
derived both from `class_type` on every render — the badge *was* `class_type`
under a different label, and the icon was a three-way guess on it
(`Master ? trophy : Private ? king : queen`). So the picker set state that the
next render immediately overwrote, and Save posted a body with neither field in
it. Two faults on top of each other: even if the write had carried them, the
render would have thrown the choice away.

**The class type was never asked for.** `class.class_type` is NOT NULL with
`CHECK (class_type IN ('Private','Group','Master'))` since the first migration.
The Add form seeded its draft with **"Beginner"** — which is a *level*, not one
of the three — so the guard on save fell through to `"Group"` every time, and the
edit path never sent the column at all.

**It was labelled "Category" on screen**, which is the rest of the reason nobody
could tell where any of it came from: one column, two names, and neither screen
used the database's.

## Fix

**Backend `0022_a_class_has_a_face.sql`** — two nullable columns, `icon` and
`badge`, neither load-bearing and nothing joining on either
(`internal/api/registry.go:179`).

The backfill writes exactly what the console had been showing — trophy for
Master, king for Private, queen otherwise, and `class_type` as the badge — so
**the deploy changes nothing on screen**. The `IS NULL` guard means re-running it
cannot clobber a choice somebody has since made, and the seed writes both itself,
since a freshly migrated database has no rows for the backfill to find.

**Console `lib/class-face.ts`** — the two rules that decide what to show when a
class has not got one yet:

- `classTypeOf` — a stored type, or the one the database would have defaulted
  to. Anything unrecognised becomes Group rather than being shown as-is: the
  column is a closed set, and a form that opens on a value the picker cannot
  offer silently rewrites it on the next save.
- `iconOf` / `badgeOf` — the stored choice wins, **but only if the picker still
  offers it**.

`AcademyPage.tsx:125` reads all three from the class, and both are sent on create
*and* on edit. `class_type` is a picker now, on both paths, labelled with the
name the database uses.

## Decisions made along the way

- **Deliberately no CHECK on `icon`.** The names come from the console's own icon
  set, which moves with the design; a constraint would mean a migration every
  time somebody adds a piece to the picker, and a class whose icon was retired
  would fail to save for reasons the office cannot act on. The console validates
  against the set it actually has.
- **Fall back rather than draw an empty box.** A name retired from the icon set
  would otherwise render nothing, and the picker cannot show a piece it no longer
  has — so nobody could pick their way out of it. Falling back is recoverable;
  a blank square is not.

## Prevention

**A field derived on every render cannot also be edited.** That is the shape
worth recognising: the picker, the state and the render were all correct in
isolation, and the bug lived in the fact that the render recomputed what the
picker had just set. Grep for a form field whose value is computed from another
column and check whether anything writes it.

`lib/class-face.test.ts` covers the fallbacks and the closed set;
`AcademyPage.test.tsx` covers the create and edit payloads. Each mutation-checked.

Driven in a browser against a scratch backend: chose the rook, typed a badge,
saved, reloaded the page, and both came back; then changed a class to Private and
reloaded to confirm that stuck too.

## Follow-ups

- [ ] **Teacher Status is still not saved** — the third item in the audit line.
      `AcademyPage.tsx:135` hard-codes `"Active"` when reading a teacher and
      `:227` when drafting one, so the picker at `:896` is still cosmetic.
      There is no column for it yet.

Related: [[a-game-opens-as-a-page-and-leaves-as-pgn]], [[ui-audit-2026-08-21]],
[[0007-retire-a-row-instead-of-deleting-it]],
[[the-console-asked-for-things-it-could-not-keep]],
[[one-shape-for-every-detail-view]]

Tags: #bug #admin #backend #data
