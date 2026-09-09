// Schedule with Friends follow-up (2026-09-09 user report): dropping the
// Meeting/Study Session sidebar chip onto the calendar always sized the
// placed block to a flat 1 hour, regardless of how much real room was
// there -- unlike New Task's own drag-to-place (commitNewTaskDrop, see
// tests/new-task-drag-drop-2026-09-09.test.js), which fills a gap under an
// hour exactly rather than overrunning into whatever's next. Same rule now
// applies here via computeDropDuration.
//
// Source-level regression guard (component-closure UI, not a pure
// function) -- same mixed-coverage convention this session uses elsewhere.
// Run with `npm test`.
const { test, describe } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");

const SOURCE = fs.readFileSync(path.join(__dirname, "..", "studlin-app.jsx"), "utf8");

describe("placeGroupScheduleChip: fills the real gap under an hour, same rule as New Task's drag-to-place", () => {
  test("uses computeDropDuration instead of a fixed 60-minute block", () => {
    const idx = SOURCE.indexOf("const placeGroupScheduleChip=(chip,dateKey,startTime)=>{");
    assert.notEqual(idx, -1);
    const body = SOURCE.slice(idx, idx + 400);
    assert.match(body, /computeDropDuration\(events,routines,getSchedulePreferences\(\),dateKey,startTime\|\|"09:00"\)/);
    assert.match(body, /endTime:minutesToTime\(start\+duration\)/, "endTime must be derived from the computed duration, not a hardcoded +60");
  });
});
