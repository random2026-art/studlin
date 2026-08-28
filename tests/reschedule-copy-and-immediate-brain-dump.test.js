// Regression tests for a 2026-08-27 follow-up round, both from live
// feedback after the previous reschedule-tradeoff-metrics fix shipped:
//
// 1. The Reschedule modal's new week-workload line looked broken in
//    practice, not just imperfect: a percentage of weekly capacity rounds
//    to the same "1%" for a lightly-scheduled student regardless of which
//    day is picked, and two candidates landing in the SAME week as each
//    other (any two weekend days) showed the literal identical number,
//    since the task was already going to count toward that week's total
//    either way. Both true, but reading as a broken stat side by side.
//    Fixed by switching to concrete minutes (always legible regardless of
//    week size) and only rendering the line when the week's total
//    genuinely changes (or is already busy) -- nothing to say when a
//    candidate doesn't move the task into a different week at all.
//
// 2. Brain Dump: "study for a class for 40 minutes now," typed late at
//    night on a genuinely empty calendar, silently rolled to tomorrow.
//    Root cause: findOpenSlotFor's own catch-up allowance for today
//    (CATCHUP_BUFFER_MINS, a fixed 2 hours past the normal work-end time)
//    had already closed for the night -- a real, previously-invisible
//    policy cutoff, not "no room." An explicit "now" is a stated,
//    deliberate instruction, not a soft preference to second-guess with
//    that cap -- IMMEDIATE_CATCHUP_MINS lets both the real commit-time
//    placement (planBrainDumpTasks) and the pre-commit honesty check
//    (which warns "no open time right now" before the student even
//    commits) search all the way to the actual end of the day instead.
//
// findOpenSlotFor/findLegalSlotOrNull/planBrainDumpTasks/weekPrepLoad are
// real top-level pure functions, tested directly via the harness. The
// Reschedule modal's JSX and the Brain Dump review's pre-commit clarify
// check are inside component closures -- source-level regression guards,
// same established precedent as every other component-closure fix this
// session. Run with `npm test`.
const { test, describe } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");
const { loadStudlinModule } = require("./harness.js");

const SOURCE = fs.readFileSync(path.join(__dirname, "..", "studlin-app.jsx"), "utf8");

const DEFAULT_PREFS = {
  workStartTime: "09:00",
  workEndTime: "18:00",
  bedtime: "23:00",
  taskDifficultyPreference: "NONE",
  bufferMarginStrategy: "15_MIN",
  weekendEnabled: false,
  weekendStartTime: "09:00",
  weekendEndTime: "18:00",
  peakHourBuckets: [],
};

describe("Fix 1a: weekPrepLoad exposes real minutes, not just a derived ratio (additive -- every existing caller is unaffected)", () => {
  test("usedMins/totalCapacity ride along with the existing isPressured/ratio/competingTitle fields", () => {
    const { weekPrepLoad } = loadStudlinModule({ now: "2026-07-25T08:00:00" });
    const result = weekPrepLoad("2026-07-27", { id: "t1" }, [], DEFAULT_PREFS);
    assert.equal(typeof result.usedMins, "number");
    assert.equal(typeof result.totalCapacity, "number");
    assert.equal(typeof result.isPressured, "boolean");
    assert.equal(typeof result.ratio, "number");
  });

  test("totalCapacity matches the ratio math already relied on elsewhere (usedMins/totalCapacity === ratio)", () => {
    const { weekPrepLoad } = loadStudlinModule({ now: "2026-07-25T08:00:00" });
    const task = { id: "t1", title: "Test", date: "2026-07-27", time: "10:00", kind: "assignment", status: "pending", duration: 300 };
    const result = weekPrepLoad("2026-07-27", { id: "t1" }, [task], DEFAULT_PREFS);
    assert.equal(result.usedMins, 300);
    assert.ok(Math.abs(result.ratio - result.usedMins / result.totalCapacity) < 1e-9);
  });
});

describe("Fix 1b: Reschedule modal's week line uses concrete minutes and only renders when there's something real to say", () => {
  test("the old percentage-based line is gone", () => {
    assert.doesNotMatch(SOURCE, /Pushes that week to <strong>\{afterPct\}%<\/strong> booked/);
  });

  test("the new line is keyed on real usedMins before/after, not a rounded ratio percentage", () => {
    assert.match(SOURCE, /const beforeMins=c\.weekPressureBefore\.usedMins;/);
    assert.match(SOURCE, /const afterMins=c\.weekPressure\.usedMins;/);
    assert.match(SOURCE, /const pushesIntoWeek=afterMins>beforeMins;/);
  });

  test("renders nothing when the candidate doesn't push into a different week AND that week isn't already busy -- no redundant identical line across candidates in the same week", () => {
    assert.match(SOURCE, /if\(!pushesIntoWeek&&!c\.weekPressure\.isPressured\)return null;/);
  });

  test("a genuine push states real before/after minutes, and a week starting from zero gets its own honest phrasing instead of a misleading '0m to 40m'", () => {
    assert.match(SOURCE, /That week has nothing else on it yet — adds <strong style=\{\{color:T\.text\}\}>\{fmtMinsDur\(afterMins-beforeMins\)\}<\/strong>/);
    assert.match(SOURCE, /Raises that week's workload from <strong style=\{\{color:T\.text\}\}>\{fmtMinsDur\(beforeMins\)\}<\/strong> to <strong style=\{\{color:T\.text\}\}>\{fmtMinsDur\(afterMins\)\}<\/strong>/);
  });
});

describe("Fix 2a: findOpenSlotFor/findLegalSlotOrNull accept an optional catchupBufferMins override, defaulting to the unmodified CATCHUP_BUFFER_MINS", () => {
  test("omitting the override preserves the exact pre-fix behavior: a task that doesn't fit even with the normal 2-hour catch-up still rolls to tomorrow", () => {
    const { findLegalSlotOrNull } = loadStudlinModule({ now: "2026-07-20T23:00:00" }); // 11pm, well past 18:00 + 2h catch-up (20:00)
    const slot = findLegalSlotOrNull([], [], DEFAULT_PREFS, "2026-07-20", "09:00", 40, null);
    assert.notEqual(slot.date, "2026-07-20", "without the override, an 11:45pm request is still past the normal catch-up window and must roll off today");
  });

  test("passing IMMEDIATE_CATCHUP_MINS lets that exact same late-night, empty-calendar request land TODAY instead", () => {
    const { findLegalSlotOrNull, IMMEDIATE_CATCHUP_MINS } = loadStudlinModule({ now: "2026-07-20T23:00:00" });
    const slot = findLegalSlotOrNull([], [], DEFAULT_PREFS, "2026-07-20", "09:00", 40, null, IMMEDIATE_CATCHUP_MINS);
    assert.equal(slot.date, "2026-07-20", "an explicit 'now' request against a genuinely empty calendar must succeed today, however late it is");
  });

  test("the widened window still respects a REAL conflict -- it's not a bypass of actual room-finding, only of the arbitrary time-of-night cutoff", () => {
    const { findLegalSlotOrNull, IMMEDIATE_CATCHUP_MINS } = loadStudlinModule({ now: "2026-07-20T23:00:00" });
    // A block from 11pm clear through the rest of the day -- even with the
    // widened window, nothing fits before midnight (1440), so this must
    // still legitimately roll to tomorrow.
    const blocker = { id: "b1", title: "Something", date: "2026-07-20", time: "23:00", kind: "busy block", status: "pending", duration: 300 };
    const slot = findLegalSlotOrNull([blocker], [], DEFAULT_PREFS, "2026-07-20", "09:00", 40, null, IMMEDIATE_CATCHUP_MINS);
    assert.notEqual(slot.date, "2026-07-20", "a real conflict must still push to tomorrow even with the widened immediate-catchup window");
  });
});

describe("Fix 2b: planBrainDumpTasks' immediate branch actually uses the wider window", () => {
  test("an explicit 'now' study item lands today on a genuinely empty, late-night calendar (this is the exact live bug report)", () => {
    const { planBrainDumpTasks } = loadStudlinModule({ now: "2026-07-20T23:00:00" });
    const items = [{ kind: "study", title: "Study for ENG 10", immediate: true, durationMin: 40 }];
    const { tasks } = planBrainDumpTasks(items, [], [], DEFAULT_PREFS);
    const studyTask = tasks.find(t => t.kind === "study block");
    assert.ok(studyTask, "a study block should have been created");
    assert.equal(studyTask.date, "2026-07-20", "an explicit 'now' request on an empty calendar must land today, even at 11pm");
  });

  test("planBrainDumpTasks passes IMMEDIATE_CATCHUP_MINS, not the plain default, for the immediate branch specifically", () => {
    const idx = SOURCE.indexOf('}else if(it.immediate){');
    const body = SOURCE.slice(idx, idx + 800);
    assert.match(body, /findLegalSlotOrNull\(working,routines,prefs,today,prefs\.workStartTime,duration,it\.dueDate\|\|null,IMMEDIATE_CATCHUP_MINS\);/);
  });
});

describe("Fix 2c: the pre-commit \"no open time right now\" honesty check matches the same wider window, so it never warns falsely about a case the real commit would actually succeed at", () => {
  test("the review-screen check also passes IMMEDIATE_CATCHUP_MINS", () => {
    const idx = SOURCE.indexOf('if(kind==="study"&&it.immediate&&!it.needsDuration){');
    const body = SOURCE.slice(idx, idx + 1500);
    assert.match(body, /findLegalSlotOrNull\(events,routines,prefs,todayKeyNow,prefs\.workStartTime,duration,it\.dueDate\|\|null,IMMEDIATE_CATCHUP_MINS\);/);
  });
});
