// checkTimeOffImpact ("Can I go?") -- a pure dry-run consequence check.
// These cover the 3 gaps fixed in this pass: it used to only ever evaluate
// the FIRST affected task (silently ignoring the rest), only flagged
// exam-prep/deadline-bound events (a plain study block was invisible to
// it), and was hardcoded to "right now, today" with no way to ask about a
// future outing.
const { test, describe } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");
const { loadStudlinModule } = require("./harness.js");

const APP_SOURCE = fs.readFileSync(path.join(__dirname, "..", "studlin-app.jsx"), "utf8");

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

// 2026-08-28: a friend's suggested improvement, from the user directly --
// "Can I go?" used to only ever answer the question and stop there. Now,
// once the tradeoffs are on screen, the student can actually act on them
// in one tap (confirmTimeOff, in CalendarTab) instead of manually redoing
// the same reschedule elsewhere. simulateTimeOffBlock is the shared core
// both checkTimeOffImpact (the dry-run above) and the real commit action
// call, so the two can never disagree about what a given window actually
// does. Tested directly here since it's a real top-level pure function;
// confirmTimeOff itself lives inside CalendarTab's component closure --
// source-level regression guards for that half, same established
// precedent as every other component-closure fix this session.
describe("simulateTimeOffBlock (the shared real/dry-run core)", () => {
  test("returns a real, concretely-dated busy block for the requested window", () => {
    const m = loadStudlinModule({ now: "2026-08-10T10:00:00" });
    const { block } = m.simulateTimeOffBlock(2, { date: "2026-08-10", startTime: "14:00" }, [], [], { workStartTime: "10:00", workEndTime: "18:00" });
    assert.equal(block.date, "2026-08-10");
    assert.equal(block.time, "14:00");
    assert.equal(block.duration, 120);
    assert.equal(block.kind, "busy block");
    assert.equal(block.status, "pending");
  });

  test("workingEvents actually contains the block plus every original event, ready to persist as-is", () => {
    const m = loadStudlinModule({ now: "2026-08-10T10:00:00" });
    const existing = [{ id: "e1", date: "2026-08-10", time: "09:00", duration: 30, kind: "study block", status: "pending" }];
    const { block, workingEvents } = m.simulateTimeOffBlock(2, { date: "2026-08-10", startTime: "14:00" }, existing, [], { workStartTime: "10:00", workEndTime: "18:00" });
    assert.ok(workingEvents.some(e => e.id === block.id), "the new block itself must be in the array a caller would persist");
    assert.ok(workingEvents.some(e => e.id === "e1"), "an untouched, non-conflicting existing event must survive unchanged");
  });

  test("a genuinely conflicting task's date/time is actually updated in workingEvents, not just named in displaced", () => {
    const m = loadStudlinModule({ now: "2026-08-10T10:00:00" });
    const existing = [{ id: "e1", date: "2026-08-10", time: "14:00", duration: 30, kind: "deadline", status: "pending", deadline: "2026-08-20", title: "Moves" }];
    const { displaced, workingEvents } = m.simulateTimeOffBlock(2, { date: "2026-08-10", startTime: "13:00" }, existing, [], { workStartTime: "10:00", workEndTime: "18:00" });
    assert.equal(displaced.length, 1);
    const moved = workingEvents.find(e => e.id === "e1");
    assert.ok(moved, "the original task must still exist in workingEvents, just relocated");
    assert.notEqual(moved.time, "14:00", "its time must actually reflect the new slot, not the original conflicting one");
  });

  test("a blocked task (nowhere legal to go) is left completely untouched in workingEvents", () => {
    const m = loadStudlinModule({ now: "2026-08-10T10:00:00" });
    const existing = [{ id: "e1", date: "2026-08-10", time: "11:00", duration: 30, kind: "deadline", status: "pending", deadline: "2026-08-10", title: "Due today" }];
    const { blocked, workingEvents } = m.simulateTimeOffBlock(10, { date: "2026-08-10", startTime: "10:00" }, existing, [], { workStartTime: "10:00", workEndTime: "18:00" });
    assert.equal(blocked.length, 1);
    const untouched = workingEvents.find(e => e.id === "e1");
    assert.ok(untouched, "a blocked task must still be present, not dropped");
    assert.equal(untouched.time, "11:00", "left at its original time -- nothing legal was found, so nothing was silently forced");
  });

  test("a fixed routine occurrence (a class) never appears in workingEvents at all -- it isn't a real event to move", () => {
    const m = loadStudlinModule({ now: "2026-08-10T09:00:00" });
    const routines = [{ id: "r1", title: "Chemistry", kind: "class", days: [0], startTime: "13:00", duration: 60 }];
    const { fixedConflicts, workingEvents } = m.simulateTimeOffBlock(2, { date: "2026-08-10", startTime: "13:00" }, [], routines, { workStartTime: "10:00", workEndTime: "18:00" });
    assert.equal(fixedConflicts.length, 1);
    assert.equal(fixedConflicts[0].title, "Chemistry");
    assert.ok(!workingEvents.some(e => e.title === "Chemistry"), "a class is a routine occurrence, never a real events[] entry -- there is nothing here for this function to move or touch");
  });
});

describe("CalendarTab's confirmTimeOff (source-level regression guards -- component closure)", () => {
  test("calls the exact same simulateTimeOffBlock core the dry-run preview uses, not a second, possibly-divergent computation", () => {
    assert.match(APP_SOURCE, /const \{blocked,displaced,workingEvents\}=simulateTimeOffBlock\(timeOffHours,\{date,startTime\},lsGet\("events",\[\]\),routines,getSchedulePreferences\(\)\);/);
  });
  test("actually persists the result -- both the React state and localStorage, matching this component's own established save pattern", () => {
    assert.match(APP_SOURCE, /setEvents\(workingEvents\);lsSet\("events",workingEvents\);/);
  });
  test("recomputes against the real current date/time rather than trusting timeOffResult verbatim (real time may have passed since the check)", () => {
    const idx = APP_SOURCE.indexOf("const confirmTimeOff=()=>{");
    const body = APP_SOURCE.slice(idx, idx + 400);
    assert.match(body, /const date=timeOffFuture\?timeOffDate:dayKey\(\);/);
  });
  test("the modal only offers this action once a check has actually been run -- there's nothing to confirm before that", () => {
    assert.match(APP_SOURCE, /\{timeOffResult&&<Btn onClick=\{confirmTimeOff\}>\{timeOffResult\.ok\?"Block this time":"Block it anyway"\}<\/Btn>\}/);
  });
});
