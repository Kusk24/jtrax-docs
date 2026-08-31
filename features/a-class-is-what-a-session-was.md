# A class is what a session was

**Shipped:** 2026-09-01 · **Repos:** `jtrax-admin` · **PR:** #90

The console now uses the academy's own two words: a **course** is the type of
class, a **class** is the thing that meets on Tuesday at four.

## Why

The office asked for "session" to become "class", and the interesting part is
why renaming only that word would have made things worse.

The console was using **class** for two different things:

- the `class` row — Beginner Group A, the thing a child enrols in and a credit
  package is priced against
- and, in Class History and on the dashboard, the `class_session` row — the
  hour that actually ran on a Tuesday

"Session" was the second one's name in about half the screens. So the collision
was already there: *Class* meant a course on the students list and an afternoon
on Class History, and *Session* meant the afternoon too. Renaming session →
class and stopping would have merged the two words into one that meant both
things everywhere, which is the confusion, not the fix.

Both words moved instead. The academy already had the vocabulary — the Academy
screen has called the `class` table **Courses** since it was built — so this is
the rest of the console catching up with a screen that was already right.

## How it works

`messages/en.json` and `messages/th.json`, values only:

| was | is |
|---|---|
| Create Session | Create Class |
| Session Details | Class Details |
| Sessions by day | Classes by day |
| No sessions match these filters | No classes match these filters |
| Class (column, filter label, form label) | Course |
| All Classes | All Courses |
| Class Type | Course Type |
| A session runs for at least half an hour | A class runs for at least half an hour |

Thai moved with it: **คาบเรียน → คลาส**, and **คลาส → คอร์ส** where it meant
the course.

## Decisions made along the way

- **Values, not keys.** `session.createTitle` still says `session`, and
  `common.class` still says `class`. The keys track the database's own names —
  `class_session` and `class` — and renaming them would have put the message
  file out of step with the schema to make a translator's file read nicer.
  The one thing that would justify it is a schema rename, and there is no
  reason for one.
- **`students.practiceHint` lost the word rather than translating it.** A
  practice session at home is not a class, so "days with a logged practice
  session" became "days with practice logged" instead of becoming a lie.
- **The dashboard's "No class attended in {days} days" was already correct**
  under the new vocabulary and was left alone.

## Follow-ups

- [ ] `jtrax-web-app` and `jtrax-mobile-app` still say "session" in places. The
      parent portal is where a family reads these words, so it matters more
      there than in the office.

Related: [[check-in-and-check-out]], [[the-nav-loses-two-tabs]],
[[an-hour-of-class-costs-an-hour-of-credit]], [[credits-follow-the-child]],
[[web-app-thai-localization]]

Tags: #feature #admin #ux #copy #i18n
