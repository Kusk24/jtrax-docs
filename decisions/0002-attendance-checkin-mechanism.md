# 0002 — Attendance check-in mechanism

- **Status:** Accepted (2026-07-03) — both paths confirmed: teacher manual marking + a
  cross-platform (web **and** mobile) self check-in
- **Date:** 2026-07-03

## Context
Attendance has two paths: **manual marking by the teacher** and **student self check-in**
("Check-in once you are in the classroom"). Self check-in needs proof-of-presence that
works in the **web app now and a mobile app later**, is gated by a teacher-started
session, and deducts 1 credit on success. Students are young children (~8), so they may
use a parent's phone, a school tablet, or no device at all.

## Options considered

| # | Mechanism | Web | Mobile | Notes |
|---|---|---|---|---|
| 1 | **Rotating QR / 6-digit code** shown by teacher (projector/tablet), signed token refreshing ~30s | ✅ camera or type code | ✅ camera | Proven pattern; screenshot-sharing dies when code rotates; no extra hardware |
| 2 | **Reverse QR / kiosk**: classroom tablet scans the student's personal QR badge, or kids tap their name on a door kiosk | ✅ | ✅ | Best for device-less 8-year-olds; kiosk is just our web app in kiosk mode |
| 3 | **Teacher live roster approval**: student taps Check-in → shows "pending" on teacher's screen → teacher confirms | ✅ | ✅ | Zero hardware, fully cross-platform; presence proof is the teacher's eyes; slight teacher workload |
| 4 | Geolocation fence | ⚠️ coarse IP on laptops | ✅ GPS | Weak indoors, spoofable — soft signal only |
| 5 | School Wi-Fi / IP allowlist | ✅ silent | ✅ | Breaks on cellular/VPN — soft signal only |
| 6 | BLE beacons / NFC tap | ❌ | ✅ native only | Web Bluetooth/NFC too limited (esp. iOS) — rules it out while web is primary |
| 7 | Ultrasonic audio token | ⚠️ | ⚠️ | Cool but flaky; mic permissions scare parents |

## Recommendation (layered)
1. **Session gate** — teacher starts/stops the attendance session (already in the UI:
   "Teacher has not started attendance session yet"). No session, no check-in.
2. **Primary proof: rotating QR + short code (option 1)** — teacher's screen shows a
   signed QR refreshing every ~30s with the 6-digit fallback below it. Mobile scans; web
   types the code or uses webcam. One check-in per student per session.
3. **Safety net: teacher roster with manual override (option 3)** — live check-in list on
   the teacher side; teacher can mark present/absent for kids without a device, dead
   batteries, or disputes. This is also the "manual checking from teacher side".
4. Later, add geo/Wi-Fi (4/5) as advisory signals and consider a door kiosk (2) if most
   students turn out to be device-less.

## Sketch of backend model (for later)
- `attendance_sessions`: id, section_id, teacher_id, started_at, ended_at, rotating_secret
- `checkins`: session_id, student_id, method (`qr` | `code` | `manual`), checked_in_at,
  credit_delta
- Code/QR = HMAC(session secret, 30s time bucket) → server verifies, writes check-in,
  decrements credit, notifies parent ("Uri — Checked in Successfully").

## Consequences
- Student UI now implements the self check-in front half: a **class-code entry step**
  (6-digit, numeric keyboard on mobile) with a **Scan QR Code** button — camera scanning
  ships with the mobile build; on web the typed code is the primary path. Wrong code
  shows an inline error; the mock accepts `attendanceSession.code` from
  `lib/student-data.ts` (see `architecture/web-app-student-frontend.md`).
- Teacher portal must include: start/end session, rotating QR + code display, live
  roster with manual toggle — feeds the teacher-mockup work.
- Backend must implement the session/HMAC model sketched above and emit the parent
  notification on check-in.
