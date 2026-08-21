# The payer and the child on a payment did not know each other

**Found:** 2026-08-21 · **Fixed:** 2026-08-21 · **Repos:** `jtrax-admin`

## Symptom

> in record payment, when you choose children, the parent must already
> selected if the child have parent linked, and if the user selected parent
> first, then if they have children, the user can select one of their children
> or their only child

Two fields describing one family, and only one direction was wired. Naming the
child filled in the guardian; naming the guardian did nothing at all — the
student picker still offered every child in the academy, and the desk had to
find the right one by name among forty.

## The rule this encodes

**A child has one guardian. A guardian has any number of children.** And either
side can be linked to nobody — deleting a parent leaves their children behind,
deleting a child leaves the parent behind, and the desk still has to be able to
work with whoever is left. `student_parent` has room for more per child than
the academy uses; the console follows the academy.

## Cause

`chooseStudent` set the payer from `student_parent`; the payer `<select>` was a
plain `setPayerId`. Nothing read the link in the other direction, so a guardian
was a label on the receipt rather than a way of choosing anybody.

A second hole, in the same flow and only visible on a cold load: the form takes
the student, the guardian and the class price from the collections **once**, in
`useState` initialisers. Reached the usual way — the registration wizard's
"Continue to payment" — the DataProvider sits in the layout and is already
full, so the prefill works. Opened from a pasted or refreshed
`/payment?student=…`, the fetch is still in flight at mount, `prefilled` is
`undefined`, and a `useState` initialiser never runs twice. The form came up
empty and stayed empty, with the child's name in the address bar.

## Fix

`components/pages/PaymentPage.tsx`:

- `childrenOf(parentId)` reads `student_parent` the other way round. Choosing a
  payer with **one** child chooses that child, with the package and price their
  class carries — the same thing naming the child would have done. With
  **several**, the student picker narrows to them and says whose list it is
  holding. With **none**, there is nothing to prefill and the field goes blank.
  In both of the last two, a student already named who is not this guardian's
  is cleared rather than left paired with someone they have no link to.
- Choosing **Not recorded** as the payer is a decision about the payer alone —
  usually for a child who has no guardian to record — so it leaves the child
  alone. It is the one payer change that does not touch the student.
- The zero-children case does *not* narrow the picker to an empty list. Blank
  is a state the desk can work out of; a dropdown with nothing in it and no way
  to widen it is not.
- Naming a child still names who pays — there is one guardian per child, so
  there is nothing to choose between. A child linked to **nobody** empties the
  payer instead of leaving the last family looked at sitting in it:
  `parent_name` is snapshotted onto the payment, and a stale one is wrong on
  the receipt for good.
- The hint under the payer says which way the two fields just moved, and the
  no-match line names the family it searched instead of claiming no student in
  the academy matched.
- The form waits for `loading` before mounting, so the prefill has something to
  read.

## Verified

The rule was first written into the click handlers and *reasoned* about, which
was not good enough to answer "does it work". It now lives on its own in
`lib/payment-pairing.ts` — four pure functions over `student_parent` rows, no
React — and the form only turns their answers into field state.

Compiled and run against every shape the desk meets. Fifteen cases, all
passing: child with a guardian, child with none, guardian with one child, with
several, with none; switching the payer while a child is named (kept when
theirs, dropped when not); "Not recorded", which clears the payer and keeps the
child; and the picker's scope, which is empty — meaning *show everyone* —
for both a childless guardian and no payer at all.

The click path itself is still unexercised: no browser automation here, and the
pairing rule being right does not prove the handler is wired to it.

## Prevention

The rule is now testable, and was tested — but by a script run once, not by
anything CI will run again. `jtrax-admin` has no test runner. Extracting the
decision was the cheap half; adding a runner so `payment-pairing` has a
permanent test is the half still outstanding, and it is the obvious next thing
if these forms grow another rule.

Worth noting as the cost of the gap: this fix, and the four in
[[the-console-asked-for-things-it-could-not-keep]], were all found by a person
walking the screens rather than by anything red.

Related: [[the-console-asked-for-things-it-could-not-keep]],
[[deleting-and-linking-people]], [[payments-outlive-students]]

Tags: #bug #admin
