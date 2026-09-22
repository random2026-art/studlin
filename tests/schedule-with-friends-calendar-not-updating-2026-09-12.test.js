// Full-audit bug, 2026-09-12 user report ("schedule with friend feature
// still doesn't work"): every other write site inside CalendarTab
// (commitManualBlockDrop, commitNewTaskDrop, etc.) calls both setEvents(next)
// AND lsSet("events",next) so the already-mounted grid updates immediately.
// postGroupSchedule -- the "Done" button at the end of the whole Schedule
// with Friends flow -- only called addTaskWithRebalance (which lsSet's
// internally) and threw away its returned array, never calling setEvents.
// The organizer's own calendar silently would not show the block they just
// placed and sent until they left the Calendar tab and came back (a full
// remount re-reads localStorage) -- indistinguishable from the whole feature
// doing nothing, despite the Firestore writes underneath it all succeeding.
//
// Source-level regression guard (component-closure UI), same convention as
// the other Schedule with Friends test files. Run with `npm test`.
const { test, describe } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");

const SOURCE = fs.readFileSync(path.join(__dirname, "..", "studlin-app.jsx"), "utf8");

describe("postGroupSchedule updates the organizer's own on-screen calendar, not just localStorage", () => {
  test("the addTaskWithRebalance return value is captured and pushed into React state via setEvents", () => {
    const idx = SOURCE.indexOf("const postGroupSchedule=async()=>{");
    assert.notEqual(idx, -1, "postGroupSchedule should still exist under this name");
    const body = SOURCE.slice(idx, idx + 3800);
    // 2026-09-22: addTaskWithRebalance now returns {events,moved} instead of
    // a bare array (moved is whatever else rebalanceDay silently reshuffled
    // on the same day) -- setEvents reads .events, same underlying fix.
    assert.match(body, /const rebalanceResult=addTaskWithRebalance\(\{/, "must capture addTaskWithRebalance's return value instead of discarding it");
    assert.match(body, /setEvents\(rebalanceResult\.events\)/, "must push the new array into CalendarTab's own events state, same as commitManualBlockDrop/commitNewTaskDrop");
  });
});
