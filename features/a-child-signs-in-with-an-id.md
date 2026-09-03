# A child signs in with an ID

**Shipped:** 2026-09-03 · **Repos:** `jtrax-backend`, `jtrax-admin`,
`jtrax-web-app`, `jtrax-mobile-app` · **PRs:** backend #43 · admin #101 ·
web #52 · mobile #10

A student's login is `stu_penny_ward`, not `penny.ward@student.jca.ac.th`. And
the Membership row is gone, because the academy has never had one.

## Why

Asked plainly: *there is no such thing as membership in our project yet, and a
child is not asked about it when registering — delete it.* And: *student
accounts are created by ID now, like `stu_student_name`, because realistically
a five-to-ten-year-old has no email and we cannot generate one for them.*

Both are the same shape of defect and each is the opposite half of it.

**Membership** was a field with nothing behind it — already catalogued in
[[a-form-that-kept-none-of-what-it-collected]] as one of the six the card
collected and dropped. It read as populated because `toStudents` filled it from
the course's own `class_type`, so a child in Beginner had a "Beginner
membership": the course said twice, wearing the clothes of a tier the office
might act on.

**The address** was the more expensive one, because inventing a value is worse
than leaving one blank:

> `penny.ward@student.jca.ac.th` — a domain that receives no mail and never has.

The code already knew. A comment beside the parent version of the same trick
said *"it is a username, not a mailbox"* — the fiction was documented and kept
anyway. What it cost:

- The **password-reset link goes into the void**. The one feature the address
  exists to support cannot work for the accounts that have it.
- The desk **cannot tell it from a real address** a family actually gave, so
  the field is unreadable exactly when someone needs to know whether they can
  write to a child.

A blank field says "we do not have this". An invented one says "we do", and is
wrong. **An honest ID is better than a fake address** because only one of the
two tells you what it cannot do.

## How it works

One identifier column, two kinds of value. `auth.ValidateLoginID` accepts
either a real address or a bare ID, and **anything containing an `@` is still
held to the full address rules** — so `penny@student` cannot slip through by
being called an ID. One namespace, one UNIQUE index, no way for an ID to
collide with an address.

Only `Student` accounts may hold one:

- Staff and parents reset their own password through a link. A bare ID has no
  mailbox behind it, so creating a receptionist as `desk` would quietly move
  them into the group who need somebody else to let them back in — and nothing
  at the moment of creation would say so.
- `validateIdentifierFor` makes the role decide the rule, and **PATCH reads the
  role from the row rather than the body**. A rule keyed on data the caller
  supplies is only as good as the caller's honesty about who they are editing.

`forgot-password` declines to hand an ID to the mail sender. It would have
failed one layer down and logged a real identifier as a bounce, with the child
still locked out. The reply is unchanged, so this does not become a way to ask
which identifiers belong to children.

Migration `0027` converts the invented addresses. Passwords are untouched, so
nobody is signed out; what changes is the string typed into the first box.

## Two children called John Smith

The safeguard that was asked for, and the more interesting half.

`lib/student-login-id.ts` builds the ID from the name and steps it along:
`stu_john_smith`, `stu_john_smith_2`, `stu_john_smith_3`.

**Uniqueness lives in the database's UNIQUE index, not in a check.** Listing
the accounts first and picking a free name is check-then-act: two receptionists
registering two John Smiths in the same few seconds both read "free", and one
of them fails anyway. Trying and catching is right when it matters, *and* it is
the same code path as the ordinary duplicate — not a second path that runs
rarely and is therefore never exercised.

Three decisions inside that loop, each of which is a bug if taken the other way:

- **The ID that was taken is what goes on the card.** The dialog used to
  recompute it from the name at the end. With a suffix in play that hands the
  second Smith the *first* one's ID, on the piece of paper the family walks out
  with.
- **A failure that is not a clash comes straight back.** Retrying a short
  password ten times gives the desk the tenth copy of the same error, several
  seconds later, under an ID that changed underneath them.
- **A name an ASCII ID cannot carry gets a random tail, not the word
  "student".** This is a Bangkok academy: a Thai roster is the normal case, not
  an edge one, and the obvious fallback files every one of them under
  `stu_student_2`, `_3`, `_4` — unique, and useless to anyone reading it.

The loop is bounded at ten. If a suffix is not resolving the collision by then,
something other than a duplicate name is failing, and ninety more tries turns
one clear error into a very slow one.

## The field that refused to submit

Both portals had `type="email"` on the sign-in box. A student typing
`stu_penny_ward` gets **no request and no error from the server** — just a
browser tooltip about a missing `@`, which reads like the child typed their own
ID wrong. `type="text"` with `autoComplete="username"`, which is also the
correct hint for an identifier that is sometimes not an address, so a password
manager still fills it.

On mobile, `keyboardType="email-address"` puts an `@` where the underscore
should be and hides the underscore behind a modifier key. A small annoyance on
a laptop; the whole task on a phone, which is where a child actually types this.

## Decisions made along the way

- **The column is still called `email`.** Renaming it to `login_id` would touch
  every query, the API response key, `Identity`, and both portals mid-flight on
  a live database — a large blast radius for a rename. The honesty is carried
  in the *values*, the validation and the labels instead. Worth revisiting when
  something else forces that table open.
- **The card labels the row by what it holds** — `Login ID` for an ID, `Email`
  for an address — because an older student may have a real one and the answer
  decides whether the desk can write to them.
- **Only the invented domain is converted.** The rule is about the domain, not
  the role: a student who gave a working address keeps the only self-service
  route they have.
- **A collision declines rather than failing.** `a.b@` and `a-b@` both flatten
  to `stu_a_b`. Neither is converted and both stay visible as accounts still on
  the old domain. A failed migration is a failed deploy, and merging two
  children is not a migration's call.
- **The students search matches the ID**, since it is now the thing a family
  arrives holding, printed on their card.

## Consequence worth stating

**A child with an ID cannot reset their own password.** There is nowhere to
send a link. This is not a regression — the invented address could not receive
one either — but it is now honest rather than hidden, and the office does it
for them.

## Follow-ups

- [ ] Parents given at the desk still get `@parent.jca.ac.th`, the same fiction
      one entity over. It has more excuse (an adult may supply a real address
      later, and the dialog says the made-up one can't be written to) but it is
      the same trick and should probably go the same way.
- [ ] Public tournament registration matches a returning student on
      `user_account.email`. A child with an ID will never match — they could
      not have matched with an unguessable invented address either, so nothing
      broke, but the lookup is now visibly aimed at a field students do not
      have.

Related: [[a-form-that-kept-none-of-what-it-collected]],
[[parents-section-student-email-and-password-reset]],
[[public-tournament-registration]]

Tags: #feature #backend #admin #web #mobile #auth #data
