# A card that said "3 / 1 classes", and seven more from one round of screenshots

**Found:** 2026-09-24 · **Fixed:** 2026-09-24 (PRs open) ·
**Repos:** `jtrax-web-app`, `jtrax-mobile-app`, `jtrax-backend` ·
**PRs:** web #78–#84, mobile #31–#37, backend #69

Eight reports, each a marked-up screenshot of the parent and student portals.
Every one was a number, a label or a layout the child or parent could see was
wrong. None was new code: all eight had been there since the screens were first
built.

## Symptom

1. **Student → Profile → Classes: "0"**, for a pupil who had been to two classes.
2. **Parent → Children card: "3 / 1 classes"**, with "15 / 20 credits left".
   The parent asked for "2 classes" and "credits used / total", e.g. "4 / 20".
3. **Fish** in Today's Activity: in the heading, in each child's ring, and as
   the unit of the Challenge column ("+1 🐟").
4. **Two texts over each other** on a solved puzzle: the "Completed!" card
   and the "Checkmate! You solved it." bubble.
5. **"Back to Play"** on the result dialog of a game started from Challenge.
6. **"Your game with Moey is ready"** still on Challenge after Moey resigned.
7. **A speech bubble** for puzzle feedback. The parent wanted plain, bigger text.
8. **"Puzzle 1"** as the heading of a Beginner Free Play puzzle.

## Cause

- **1:** the tile read `student.last_attended_date` and printed `"1+"` or
  `"0"`. It could never show a real count, and nothing keeps that column up to
  date.
- **2, classes:** the card set *every attendance row on file* over *the
  sessions of the child's current class that had already ended*. Those are
  counted from different sets, so the first can exceed the second: make-up
  sessions in another class, a session later today, or a row with no check-in.
- **2, credits:** the message was `"{count} / 20 credits left"`. The 20 was
  typed into both translations, so a 40-credit package still said "/ 20".
- **3, and the "+1":** the fish are left over from the Mochi cat design, which
  [[student-portal-in-academy-colours]] removed from the student side only. The
  number beside the fish was `max(1, minutes / 10)`, so every child had "+1",
  including one who hadn't practised.
- **4 and 7:** the bubble was absolutely positioned 68 px above the board, which
  is where the Completed card sits. Both render when `solved` is true.
- **5:** the room page hard-coded `/student/play`. Nothing told it where the
  board had been opened from.
- **6:** `GET /api/v1/challenges` returned every `Accepted` challenge without
  looking at its room, so a finished game stayed "ready" for good.
- **8:** the heading was always `puzzleN(puzzleIndex + 1)`, and Free Play
  never sets `puzzleIndex`. The phone already titled Free Play by level, but in
  the plural.

## Fix

- **Classes:** one rule, `classesAttended`, in `lib/classes-attended.ts` (web)
  and `src/lib/classes-attended.ts` (phone). It counts attendance rows with a
  check-in, on a session still on the timetable, which is exactly what the
  history lists as Present.
  - The card now says "2 classes", and the Profile tile uses the same count.
  - `heldSessions` is gone.
  - The certificate progress on the child page uses the same count.
- **Credits:** `creditsUsed` (`lib/credits-used.ts`) gives "2 / 20 credits
  used" (`{used, number} / {total, number}`), with the total taken from the
  ledger. The bar fills as credits are used.
- **Fish → stars:** lucide `Star` in `pp-amber`, and `fish.png` is deleted from
  both apps.
  - The Challenge column is now `practice_activity.puzzles_completed` for today
    (`todayActivityOf`, `lib/today-activity.ts`).
- **Puzzle feedback:** one fixed-height slot under the heading. It shows the
  message as 18 px text, or, on reopening a solved puzzle, the Completed card:
  one or the other, never both. The board doesn't move.
- **Challenge:**
  - The Challenge screen links to `/student/play/room/{id}?from=challenge`.
  - With that marker, the room's back arrow and the dialog's button go to
    Challenge ("Back to Challenge").
  - The backend lists an accepted challenge only while its room is `Open` or
    `Active` (`internal/api/challenges.go`, `handleListChallenges`).
- **Free Play heading:** "Beginner / Intermediate / Advanced puzzle", at 22 px
  on web so "Intermediate puzzle" clears the sound switch.

## Prevention

- Tests that fail on `main`:
  - `lib/classes-attended.test.ts` (both apps)
  - `lib/credits-used.test.ts`, which also asserts neither message contains a
    literal 20
  - `lib/today-activity.test.ts`
  - `TestAFinishedChallengeGameLeavesTheList`
- The layout fixes (4, 7, 8) have no unit test. They were checked with
  Playwright: bounding-box overlap between the message, the card, the board and
  the title in every puzzle state, at 390 px, in EN and TH.
- The general lesson: a number on a card needs one definition that two screens
  share. The card and the history under it had different ones, and so did the
  pupil's Profile. See also [[a-failed-load-is-not-an-empty-one]].

**Still open:** a game started from Challenge is still headed "Class game".

Tags: #bug #parent-portal #student-portal #puzzles #challenges
