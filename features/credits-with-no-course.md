# Credits with no course

**Shipped:** 2026-09-03 · **Repos:** `jtrax-admin`, `jtrax-backend` · **PRs:** admin #98, #99, #100 · backend #42

Hours a family paid for belong to the child, not to the enrolment row that
recorded them. Deleting a course no longer deletes the balance.

## Why

Reported plainly: *a child had thirteen credits, their one and only enrolment
was deleted, and the balance went to zero.*

`credit_transaction.enrollment_id` was `NOT NULL`, so a credit could not exist
without an enrolment. That left the console choosing between refusing the
delete and destroying the ledger — and neither is the answer, because the money
was real either way. The first version chose destroying it, which is how
thirteen paid-for hours stopped existing.

## How it works

Backend `0026` rebuilds `credit_transaction`: `enrollment_id` becomes nullable,
and two columns are added because the enrolment had been answering them by
proxy —

- **`student_id`**, whose the hours are.
- **`class_id`**, what they were bought for, and therefore what rate they
  convert at. Without it a detached balance would move as a bare number and
  quietly change what a family paid for.

Both backfilled from the enrolment. Deleting an enrolment now *detaches* its
credit entries, the way it already detached its payments
([[payments-outlive-students]]), and `toStudents` counts the entries no
enrolment claims toward the child's balance — which is the literal fix to the
report.

The student page shows what is left over — *"13 credits not in any course"*,
with the course they were bought for named — and a **Move into a course**
action beside it, which is the old Move Credits with its arithmetic intact:
both rates, the half-credit grid, a typed override, the expiry carried across.

## The number left, and what it is worth (#99)

Reported a change later: twenty hours of Beginner, moved to Intermediate and
become 16.5, every course deleted, then Beginner joined again — and the console
handed back **16.5**, not what that money buys.

A loose balance is rarely one purchase. That ledger is three entries:

```
+20    Beginner       bought
−20    Beginner       moved out
+16.5  Intermediate   moved in
```

The *number* left is 16.5. What it is *worth* is Intermediate money. Those are
different questions and only the second survives a move — and the console was
answering the first, then labelling the answer with a course read off
`looseCredits.at(-1)`. One arbitrary row standing in for the whole balance.

**The bug was order-dependent, which is why it did not reproduce at first.**
With an Intermediate row last it happened to be right; with a Beginner row
last it priced Intermediate hours at Beginner's rate and the conversion became
a no-op. Which row came last was the API's business. The first fixture written
for it passed for that reason alone, and the test now asserts the answer across
*every* ordering — a balance's worth must not depend on what order rows
arrive in.

`valueOfLots` prices every entry in its own course and sums the money;
`creditsForValue` turns that into hours in the course being joined. The dialog
shows the money in the middle, because a family shown two credit counts has no
way to see why one is larger.

Settling is one entry per course rather than one for the lot: a single −16.5
row would have to name a course, and naming any of them files Intermediate
hours under Beginner, priceable at the wrong rate for ever after.

**The shape:** a derived field that is only correct when a collection is
homogeneous, computed from an arbitrary member of it. It reads as a small
convenience and is a silent correctness bug the moment the collection is mixed
— and nothing in the types says the collection was ever meant to be uniform.

## A move must not mint hours (#100)

Reported next, and it is the same balance seen from the other side: *moving 20
Beginner credits to Master gives 13-something, but moving them back gives
**20.5** — the system is giving away half a credit.*

```
20 credits of Beginner (600/hr)  = 12,000 THB
  -> Master (900/hr):  13.33, nearest = 13.5    worth 12,150   (+150 THB)
  -> Beginner:         20.25, nearest = 20.5
```

Twenty hours in, twenty and a half out. The conversion had been rounding to
**nearest**, and nearest rounds *up* whenever the remainder is a quarter credit
or more — which is most remainders. Each hop then compounds the one before it,
so a round trip is a pump: repeat it and the balance climbs without anyone
paying.

The direction has now been changed twice, so the whole history is in the
docstring of `floorToHalfCredit` rather than only in this note. Up first,
rejected for handing out half an hour a move. Nearest second, on the theory
that it evens out. **It does not, because a conversion is not a measurement —
it is an exchange.** A measurement rounded to nearest is unbiased about a true
value that already exists; a rate conversion rounded up invents money that was
never paid, and the next conversion prices the invention as real.

Down is the only direction with the property that matters: **a conversion never
creates value.** What lands is always worth no more than what left, so no
sequence of moves can mint hours. Two tests pin it — a property test over every
rate pair × balance asserting `credits × toRate <= value`, and a twelve-hop
pump that must never exceed where it started.

The floor goes through hundredths before halving. `19.5 * 2` is
`38.99999999999999` in binary floating point, and flooring that raw costs half
a credit for a value that ought to be exact; snapping to the hundredth first
removes the representation error without touching any real remainder, because
nothing here is priced below a hundredth of an hour. **A floor makes every
floating-point error one-directional and permanent, which a nearest-round was
hiding.**

The trade-off is now the family's, not the academy's: 20 → 13 → 19.5, so up to
half a credit is lost per move rather than gained. That is bounded per move and
in the direction that cannot be exploited. Exact round trips would need the
ledger to carry the *value* in baht alongside the count — offered, not built.

## Decisions made along the way

- **Every write stamps `student_id` and `class_id`.** Registration, the desk's
  top-up, a payment, a course change. A row written without them is a credit
  belonging to nobody the moment its enrolment goes, and the backfill only
  covers what existed when the migration ran.
- **The Parent and Student read scopes had to widen.** They matched on
  `enrollment_id IN (…student_enrollment…)`, so a family's remaining balance
  would have vanished from their own portal the moment the office tidied away
  the course it was bought for. **A nullable foreign key changes every query
  that reached the row through it** — the scopes are the half that is easy to
  miss, because nothing in the console fails when they are wrong.
- **No rate on the old course carries the hours across unconverted.** A retired
  or unpriced course must not hold a balance hostage.
- **The delete dialog was rewritten, not just the code.** It said the credits
  *"go with it, and cannot be recovered"*. That was true when it was written
  and stopped being true in the same change — and an office told its credits
  will be destroyed will avoid the button that tidies the list. A warning is
  part of the behaviour it describes.

## Follow-ups

- [ ] The parent portal reads the balance through the same adapter, so loose
      credits count there too — but it has no way to *say* they are unattached.
      A family seeing credits against no class may ask why.

Related: [[credits-follow-the-child]], [[changing-a-childs-course]],
[[payments-outlive-students]], [[an-hour-of-class-costs-an-hour-of-credit]],
[[0007-retire-a-row-instead-of-deleting-it]]

Tags: #feature #admin #credits #data
