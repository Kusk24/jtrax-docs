# A second click on a slow save was a second record

**Found:** 2026-08-16 · **Fixed:** 2026-08-16 · **Repos:** `jtrax-admin` · **PR:** #35

## Symptom

> when clicking a button like Record Payment, make sure to create only one
> record — when I clicked it too long it creates a duplicate, and in those
> seconds of writing the button didn't change like "recording", so I clicked
> twice.

The user diagnosed it exactly. The button neither locked nor said anything
while the write was in flight, so a second press was a second payment.

## Cause

The same shape as [[registering-a-student-looked-like-a-freeze]], which was
fixed the same day for the *registration* button only. Every other button that
wrote had the same hole: `disabled` was set from whether the form was valid, not
from whether a request was outstanding.

```tsx
disabled={!canSave}          // "a student is chosen" — still true mid-write
onClick={() => onSave(...)}  // fires again on the second click
```

Nine buttons: Record Payment, the Academy course save and teacher delete, the
admin delete, adding and removing a student on a live session, adding an
attendee on Class History, the student detail Save, the tournament Publish and
the category Add.

## Fix

`ActionButton` in `components/crud.tsx` — runs an async job, refuses every click
until it resolves, and swaps its label while it works ("Saving…", "Deleting…").

One subtlety worth keeping: three handler props declared `void` while returning
a promise (`onSave` on the payment form and the student detail, `onPublish` on
the tournament wizard). A guard that awaits a `void` releases immediately and
guards nothing, so those signatures had to become `Promise<void>` for the fix
to be real rather than apparent.

## Verified

Every write delayed 500ms to imitate the deployed backend, then each button
clicked twice 150ms apart — asserting both that the button is disabled
mid-flight *and* that the row count moved by one:

- one payment recorded, not two
- one course created, not two
- one admin created, not two

## Prevention

Any button that writes goes through `ActionButton`. The generic rule: `disabled`
must be a function of *request in flight*, not only of *form validity* — and if
the handler is typed `void`, the guard is decorative.

Related: [[registering-a-student-looked-like-a-freeze]], [[admin-console-ux-pass]]

Tags: #bug #admin #data
