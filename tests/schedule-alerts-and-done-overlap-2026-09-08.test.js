// Two bugs from a live 2026-09-08 user report (screenshot showed the exact
// same conflict line repeated three times, growing to 16 over the course
// of live testing):
//
// 1. The Google Calendar poll (every 10 minutes) re-reconciles the WHOLE
//    fresh batch every time, not just newly-added events -- a still-
//    unresolved conflict between two fixed events gets re-detected and
//    re-appended on every single poll, with nothing anywhere in the chain
//    deduping against an already-known/already-shown alert.
//    dedupeScheduleAlerts (pure, exported) is the fix, applied at all 3
//    accumulation points.
//
// 2. "when i tried to move something in the future over something already
//    finished it overlapped and showed warning" -- WeeklyPlanner's drag-
//    overlap warning badge (conflictTitles) was the one overlap check in
//    the whole file that didn't exclude a done sibling (every other one --
//    getDayOccupiedIntervals, moveEvent, findAllOverlaps -- already does,
//    confirmed via computeOccupiedIntervals's own 2026-08-26 comment: a
//    done task's old slot is free real estate). Source-level regression
//    guard since this is component-closure JSX. Run with `npm test`.
const { test, describe } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");
const { loadStudlinModule } = require("./harness.js");

const SOURCE = fs.readFileSync(path.join(__dirname, "..", "studlin-app.jsx"), "utf8");

describe("dedupeScheduleAlerts: a still-unresolved conflict isn't re-announced every poll", () => {
  test("an exact duplicate 'attention' entry (same pair) is collapsed to one", () => {
    const { dedupeScheduleAlerts } = loadStudlinModule({ now: "2026-09-08T09:00:00" });
    const entry = { kind: "attention", newEvent: { id: "gcal-1", title: "Marketing Club Omni Meeting" }, conflictsWith: { id: "leadin-1", title: "Fundamentals of AI" } };
    const result = dedupeScheduleAlerts([entry, { ...entry }, { ...entry }]);
    assert.equal(result.length, 1, "three identical polls detecting the same still-standing conflict should collapse to one entry");
  });

  test("two genuinely different conflicts (different pairs) both survive", () => {
    const { dedupeScheduleAlerts } = loadStudlinModule({ now: "2026-09-08T09:00:00" });
    const a = { kind: "attention", newEvent: { id: "gcal-1" }, conflictsWith: { id: "leadin-1" } };
    const b = { kind: "attention", newEvent: { id: "gcal-2" }, conflictsWith: { id: "leadin-2" } };
    const result = dedupeScheduleAlerts([a, b]);
    assert.equal(result.length, 2, "real, distinct conflicts must never be conflated into one");
  });

  test("a 'moved' entry dedupes by the moved event's own id", () => {
    const { dedupeScheduleAlerts } = loadStudlinModule({ now: "2026-09-08T09:00:00" });
    const moved = { kind: "moved", id: "ev-1", title: "Study block" };
    const result = dedupeScheduleAlerts([moved, { ...moved }]);
    assert.equal(result.length, 1);
  });

  test("'moved' and 'attention' entries never collide with each other even if other fields overlap", () => {
    const { dedupeScheduleAlerts } = loadStudlinModule({ now: "2026-09-08T09:00:00" });
    const moved = { kind: "moved", id: "x" };
    const attention = { kind: "attention", newEvent: { id: "x" }, conflictsWith: { id: "y" } };
    const result = dedupeScheduleAlerts([moved, attention]);
    assert.equal(result.length, 2);
  });
});

describe("surfaceReconcileResult and the periodic Google poll both dedupe before storing/displaying", () => {
  test("surfaceReconcileResult dedupes the persisted pendingScheduleChangeAlerts queue, not just what's rendered", () => {
    const idx = SOURCE.indexOf("function surfaceReconcileResult(result){");
    assert.notEqual(idx, -1);
    const body = SOURCE.slice(idx, idx + 400);
    assert.match(body, /lsSet\("pendingScheduleChangeAlerts",dedupeScheduleAlerts\(/);
  });

  test("both live setScheduleChangeAlerts accumulation points (pending-alert handoff and the Google poll) dedupe too", () => {
    const matches = SOURCE.match(/setScheduleChangeAlerts\(a=>dedupeScheduleAlerts\(/g) || [];
    assert.ok(matches.length >= 2, "both the pendingScheduleChangeAlerts handoff and the periodic Google poll must dedupe, not just one of them");
  });
});

describe("WeeklyPlanner's drag-overlap warning excludes a done sibling, matching every other overlap check", () => {
  test("both layoutDayEvents-based conflictTitles computations exclude status===\"done\"", () => {
    const matches = SOURCE.match(/dayLaidOut\.filter\(o=>o\.ev\.id!==ev\.id&&o\.ev\.status!=="done"&&o\.start<end&&start<o\.end/g) || [];
    assert.ok(matches.length >= 3, "all three conflictTitles computations in the file must exclude a done sibling");
  });
});
