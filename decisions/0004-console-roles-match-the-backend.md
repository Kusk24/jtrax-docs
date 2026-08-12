# Console roles match the backend

**Date:** 2026-08-13 · **Status:** accepted

## Context

The admin console carried three roles from the mockup — Super Admin, Admin,
Receptionist — while `user_account.role` only ever issues two staff roles,
`Admin` and `Receptionist`.

The mismatch was visible, not cosmetic. Creating someone through the Admins
page as "Admin" listed them as Admin, but `lib/auth.ts` promoted *every*
backend Admin to "Super Admin" when they signed in. The same account showed a
different role depending on which screen you looked at, and no account could
ever be a plain Admin in the nav.

It only surfaced once real sign-ins replaced the demo person-picker: while the
console switched between mock people, nothing forced the two mappings to agree.

## Decision

`JtraxRole` is `Admin | Receptionist`, one-to-one with the backend. The nav's
`superOnly` flag becomes `adminOnly`. Admin inherits the navy that Super Admin
had, being the top role again.

## Consequences

Access is unchanged: an Admin sees every section, a Receptionist still does not
get Admins, Academy or Settings. What changes is that the role shown on a
person is the role they actually sign in as.

A third tier is a schema change now, not a frontend constant — it needs a new
value in the `role` CHECK constraint on `user_account`. That is the right cost:
the previous arrangement let the console invent a role the backend could not
issue.

Related: [[staff-accounts-on-the-deployed-database]],
[[0003-backend-switched-to-golang]].

Tags: #decision #auth #frontend
