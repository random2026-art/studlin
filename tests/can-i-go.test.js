// checkTimeOffImpact ("Can I go?") -- a pure dry-run consequence check.
// These cover the 3 gaps fixed in this pass: it used to only ever evaluate
// the FIRST affected task (silently ignoring the rest), only flagged
// exam-prep/deadline-bound events (a plain study block was invisible to
// it), and was hardcoded to "right now, today" with no way to ask about a
// future outing.
const { test, describe } = require("node:test");
const assert = require("node:assert/strict");
const { loadStudlinModule } = require("./harness.js");

// checkTimeOffImpact reads getSchedulePreferences() internally (default
// workStartTime "10:00", workEndTime "18:00") -- no prefs argument to pass.
describe("checkTimeOffImpact", () => {
  test("ok:true when nothing overlaps the requested window", () => {
    const m = loadStudlinModule({ now: "2026-08-10T10:00:00" });
    m.lsSet("events", [
      { id: "e1", date: "2026-08-10", time: "15:00", duration: 30, kind: "study block", status: "pending" },
    ]);
    const result = m.checkTimeOffImpact(2);
    assert.equal(result.ok, true);
  });

  test("regression: a plain study block with no deadline is no longer invisible to the check", () => {
    const m = loadStudlinModule({ now: "2026-08-10T10:00:00" });
    m.lsSet("events", [
      { id: "e1", date: "2026-08-10", time: "11:00", duration: 30, kind: "study block", status: "pending" },
    ]);
    const result = m.checkTimeOffImpact(2);
    assert.equal(result.ok, false, "a plain overlapping study block should now be flagged, not ignored");
    assert.equal(result.displaced.length + result.blocked.length, 1);
  });

  test("a free-period placeholder never counts as an affected item", () => {
    const m = loadStudlinModule({ now: "2026-08-10T10:00:00" });
    m.lsSet("events", [
      { id: "e1", date: "2026-08-10", time: "11:00", duration: 30, kind: "free period", status: "pending" },
    ]);
    const result = m.checkTimeOffImpact(2);
    assert.equal(result.ok, true);
  });

  test("regression: evaluates every affected task, not just the first", () => {
    const m = loadStudlinModule({ now: "2026-08-10T10:00:00" });
    m.lsSet("events", [
      { id: "e1", date: "2026-08-10", time: "11:00", duration: 30, kind: "deadline", status: "pending", deadline: "2026-08-20", title: "First task" },
      { id: "e2", date: "2026-08-10", time: "11:30", duration: 30, kind: "deadline", status: "pending", deadline: "2026-08-20", title: "Second task" },
    ]);
    const result = m.checkTimeOffImpact(2);
    assert.equal(result.ok, false);
    assert.equal(result.displaced.length, 2, "both overlapping tasks should be reported, not just the first");
    // harness.js runs the app in a separate vm realm -- assert.deepEqual
    // against a literal array always false-fails there, compare via a
    // plain string join instead.
    const titles = result.displaced.map(d => d.title).sort().join(",");
    assert.equal(titles, "First task,Second task");
  });

  test("a task genuinely nowhere to go is reported as blocked", () => {
    const m = loadStudlinModule({ now: "2026-08-10T10:00:00" });
    // Deadline is today, so no other day is ever tried. A 10-hour time-off
    // request (10am-8pm) covers both the normal work window (ends 6pm) and
    // the 2-hour today-only catch-up buffer findLegalSlotOrNull also
    // allows -- genuinely nowhere left for a 30-min task to land today.
    m.lsSet("events", [
      { id: "e1", date: "2026-08-10", time: "11:00", duration: 30, kind: "deadline", status: "pending", deadline: "2026-08-10", title: "Due today" },
    ]);
    const result = m.checkTimeOffImpact(10);
    assert.equal(result.ok, false);
    assert.equal(result.blocked.length, 1);
    assert.equal(result.blocked[0], "Due today");
  });

  test("regression: an explicit future date/time is respected instead of always checking 'now'", () => {
    const m = loadStudlinModule({ now: "2026-08-10T10:00:00" });
    m.lsSet("events", [
      // Nothing today, so a same-day check would report all-clear --
      // this only shows up if the future date is actually honored.
      { id: "e1", date: "2026-08-16", time: "15:00", duration: 30, kind: "study block", status: "pending" },
    ]);
    const sameDay = m.checkTimeOffImpact(2);
    assert.equal(sameDay.ok, true, "nothing today, so a same-day check should be clear");
    const future = m.checkTimeOffImpact(2, { date: "2026-08-16", startTime: "14:00" });
    assert.equal(future.ok, false, "the future date's own conflict should now be caught");
  });

  test("with no opts, behavior is unchanged from before -- defaults to right now, today", () => {
    const m = loadStudlinModule({ now: "2026-08-10T14:00:00" });
    m.lsSet("events", [
      { id: "e1", date: "2026-08-10", time: "15:00", duration: 30, kind: "study block", status: "pending" },
    ]);
    const result = m.checkTimeOffImpact(2);
    assert.equal(result.ok, false);
  });

  // Regression (2026-08-08): a fixed recurring Activity (e.g. a weekly
  // church service) never lived in `events` at all -- only routines -- so
  // this check was completely blind to it, reporting "ok:true" for a
  // window that plainly overlapped a real, fixed commitment.
  describe("fixed routine occurrences (e.g. a recurring Activity like church)", () => {
    test("a fixed activity overlapping the requested window is now caught", () => {
      const m = loadStudlinModule({ now: "2026-08-10T09:00:00" }); // Monday
      m.saveWeeklyRoutine([
        { id: "r1", title: "Church", kind: "busy", days: [0], startTime: "08:00", duration: 420 }, // 8am-3pm
      ]);
      // 3 hours starting 1pm -> 1pm-4pm, overlaps Church's 8am-3pm.
      const result = m.checkTimeOffImpact(3, { date: "2026-08-10", startTime: "13:00" });
      assert.equal(result.ok, false);
      assert.equal(result.fixedConflicts.length, 1);
      assert.equal(result.fixedConflicts[0].title, "Church");
    });

    test("a fixed activity that doesn't overlap the window is not flagged", () => {
      const m = loadStudlinModule({ now: "2026-08-10T09:00:00" });
      m.saveWeeklyRoutine([
        { id: "r1", title: "Church", kind: "busy", days: [0], startTime: "08:00", duration: 420 }, // ends 3pm
      ]);
      const result = m.checkTimeOffImpact(3, { date: "2026-08-10", startTime: "16:00" });
      assert.equal(result.ok, true);
    });

    test("a free-period routine never counts as a fixed conflict -- it represents open time", () => {
      const m = loadStudlinModule({ now: "2026-08-10T09:00:00" });
      m.saveWeeklyRoutine([
        { id: "r1", title: "Free Period", kind: "free", days: [0], startTime: "13:00", duration: 180 },
      ]);
      const result = m.checkTimeOffImpact(3, { date: "2026-08-10", startTime: "13:00" });
      assert.equal(result.ok, true);
    });

    test("a habit routine (no fixed time) is never treated as a fixed conflict", () => {
      const m = loadStudlinModule({ now: "2026-08-10T09:00:00" });
      m.saveWeeklyRoutine([
        { id: "r1", title: "Read", kind: "habit", days: [0], duration: 20 },
      ]);
      const result = m.checkTimeOffImpact(3, { date: "2026-08-10", startTime: "13:00" });
      assert.equal(result.ok, true);
    });

    test("a fixed conflict and an at-risk study block can both be reported at once", () => {
      const m = loadStudlinModule({ now: "2026-08-10T09:00:00" });
      m.saveWeeklyRoutine([
        { id: "r1", title: "Church", kind: "busy", days: [0], startTime: "08:00", duration: 420 },
      ]);
      m.lsSet("events", [
        { id: "e1", date: "2026-08-10", time: "13:30", duration: 30, kind: "deadline", status: "pending", deadline: "2026-08-10", title: "Due today" },
      ]);
      const result = m.checkTimeOffImpact(3, { date: "2026-08-10", startTime: "13:00" });
      assert.equal(result.ok, false);
      assert.equal(result.fixedConflicts.length, 1);
      assert.equal(result.fixedConflicts[0].title, "Church");
      // Whether the study task lands as "blocked" or "displaced" depends on
      // work-hours math not central to this regression -- the point here is
      // that a fixed-routine conflict and a task-level conflict are both
      // surfaced together, not one hiding the other.
      assert.equal(result.blocked.length + result.displaced.length, 1);
    });
  });
});
