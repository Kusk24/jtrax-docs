# One shape for every detail view, list and icon in the console

**Shipped:** 2026-08-16 · **Repos:** `jtrax-admin` · **PRs:** #39, #40, #41

Every detail view in the console now opens the same way — name, what the record
*is* underneath it, then **Edit** and **Delete** spelled out on the right — and
every list pages at twelve, switches List-then-Card, and carries the same row
actions whichever view you are in.

## Why

Eleven points from one session, all variations on *"this screen and that screen
disagree"*:

- Parent cards had edit and delete icons; student cards had none, so the only
  way to edit a student was to open them first.
- Student detail put its credit chips in the same row as the buttons, the parent
  used icon-only buttons, the admin's actions were in a modal footer, the
  teacher's sat in a red panel. Same job, four shapes — nothing was where the
  previous screen had trained you to look.
- Delete was red as a row icon and grey as a text button. A delete that looks
  like Cancel is a delete waiting to be misclicked.
- The view switch read Card-then-List on some screens and List-then-Card on
  others.
- The table paged at 10 while the cards paged at 12, so flipping view silently
  changed how much of the list you were looking at.
- List headers were the page background colour, so the column labels floated.
- Registration never asked for date of birth or level — the two fields the
  imported roster already had and the cards already displayed, which is why old
  students showed an age and new ones showed `0 yrs`.
- A payment row was the only list row in the console you could not open.
- Class-history cards carried the attendance editor: marking a student present
  and adding one to the session both happened on the card, in the middle of a
  grid.
- The students, parents and academy icons did not say what they meant.

## How it works

### The shared detail block — `components/detail.tsx`

`DetailHeader` takes `avatar`, `title`, `subtitle`, `badges` and `actions`.
Badges render **under the name**, not beside the buttons: they say what the
record *is*, which belongs with its name, not with the controls that change it.
`EditButton` and `DeleteButton` are written-out words, not glyphs — on a page
you opened deliberately, "Edit" should not be a guess at a shape. `BackLink` and
`DangerPanel` came along for the same reason: three screens had hand-rolled the
red confirm panel in three different shades of red.

Adopted by Students, Parents, Admins, Academy and Tournaments in the same PR.

### Red means delete — `components/page-kit.tsx`

`dangerButtonStyle` (outlined) for "Delete", `dangerSolidButtonStyle` (filled)
for the button that actually carries it out.

### Twelve everywhere — `components/page-kit.tsx`

`TABLE_PAGE_SIZE` 10 → 12, and `CARD_PAGE_SIZE` / `pageSizeFor()` deleted rather
than kept in sync. Twelve divides by both three and four, so the card grid never
leaves a ragged last row at any width the console supports.

Table headers moved from `COLORS.bg` to `COLORS.light`, so the header band is
visibly a header.

### List first, card last — `components/view-mode.tsx`

`MODE_ORDER` sorts the buttons, so a screen cannot declare its options in an
order that contradicts another screen. The clickable card region is labelled
`Open {what}` — it used to be unlabelled, and an accessibility check kept
matching the card wrapper when it wanted the Edit button inside it.

### Registration asks for what the cards show

`#w-dob` and `#w-level` on the wizard's manual-entry step, stored as
`date_of_birth` and `current_level`, so a newly registered student's card and
detail view look like an imported one's.

### Two records that could not be opened

- A payment row and a payment card open the record: payer, reference, gross,
  discount, final amount, method.
- Class-history sessions moved their attendance list and "Add student" off the
  card and into the session's own view (#40).

### Icons — `lib/icons.ts`

`students` is a graduation cap; it used to be two figures of different sizes,
indistinguishable at 18px from `parents` — two figures of the same size — in the
nav, the one place the difference matters. `parents` is now an adult and a child
hand in hand: the height difference and the joined hands carry the meaning that
two circles of different radii did not. `book` (Academy) became a board with a
piece on it; a plain book said "documentation".

### The picker that hid its own list — #41

Follow-up from the same batch: the payment form's student picker caps at eight
options and gave no sign there were more. It now says
*"{count} more — type to narrow the list"*.

## Decisions made along the way

- **Words, not icons, on detail views; icons on rows and cards.** A row has no
  space for two labels and is scanned in bulk; a detail view is opened one at a
  time and deserves to be unambiguous.
- **Delete the second page size rather than reconcile it.** Two constants that
  must agree are a defect waiting to happen.

## The mistake worth remembering

PR #39 passed 28 checks, then I split its history with `git reset --soft` plus
`git checkout <sha> -- file` and silently dropped three of five commits before
pushing — student card actions, the registration fields and the payment/session
detail views never reached `main`. It surfaced from a screenshot, not from a
test. Re-applied and re-verified as #40. **Re-verify after rewriting history;
a green check belongs to the tree that was checked, not to the branch name.**
See [[stacked-prs-never-reached-main]].

## Follow-ups

- [ ] Row detail is still three different things across the console — full page,
      centred modal, right drawer — for the same "I clicked a row". Tracked in
      [[ui-audit-2026-08-21]]. **Partly closed 2026-08-23:** Games moved from a
      460px drawer to a full page and adopted this note's `DetailHeader` /
      `BackLink` shape (#77, [[a-game-opens-as-a-page-and-leaves-as-pgn]]). The
      Academy course and teacher still open a centred `Modal`
      (`AcademyPage.tsx:549`, `:594`) and a tournament participant still opens a
      drawer (`TournamentPage.tsx:833`).

Related: [[admin-console-ux-pass]], [[deleting-and-linking-people]],
[[payments-outlive-students]], [[a-second-click-was-a-second-record]],
[[one-palette-across-every-app]], [[ui-audit-2026-08-21]],
[[a-game-opens-as-a-page-and-leaves-as-pgn]],
[[quick-actions-open-the-form-not-the-tab]]

Tags: #feature #ux #jtrax-admin
