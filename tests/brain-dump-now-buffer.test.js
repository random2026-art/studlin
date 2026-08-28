// Regression test for a 2026-08-28 follow-up to the "study now" fix.
//
// Live report, with a screenshot: at 9:47am, on a genuinely empty
// calendar, Brain Dump's pre-commit check said "No open time right now —
// the next slot that fits is 10:15AM." The user suspected an invisible
// per-event buffer (the kind Settings' automatedBufferEnabled toggle
// controls) -- it wasn't that. findOpenSlotFor's own nowFloorMins rounds
// "now" up to the next 15-minute grid mark AND adds a flat 15 minutes
// before doing that rounding (587 minutes -> +15 -> 602 -> ceil to the
// next 15-min mark -> 615 = 10:15). For a normal caller that's a
// reasonable small cushion; for an EXPLICIT "study X now" instruction, two
// stacked paddings turning "now" into "28 minutes from now" is exactly the
// dishonest-feeling gap the user flagged. IMMEDIATE_NOW_BUFFER_MINS (0)
// removes just the extra flat padding for the two "immediate" call sites
// -- the grid rounding itself stays (findOpenSlotFor can never hand back
// an already-past time either way), so "now" lands on the very next
// quarter-hour instead of the one after that.
//
// findOpenSlotFor/findLegalSlotOrNull/planBrainDumpTasks are real
// top-level pure functions, tested directly via the harness. Run with
// `npm test`.
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

describe("findOpenSlotFor/findLegalSlotOrNull: nowBufferMins is optional and defaults to the unmodified 15", () => {
  test("omitting the override reproduces the exact live bug: 9:47am on an empty calendar offers 10:15am, not something closer to now", () => {
    const { findLegalSlotOrNull } = loadStudlinModule({ now: "2026-07-20T09:47:00" });
    const slot = findLegalSlotOrNull([], [], DEFAULT_PREFS, "2026-07-20", "09:00", 40, null);
    assert.equal(slot.date, "2026-07-20");
    assert.equal(slot.time, "10:15", "this is the exact reported number -- confirms the default padding is still intact for every non-immediate caller");
  });

  test("passing IMMEDIATE_NOW_BUFFER_MINS drops the extra flat padding -- the same empty calendar now offers the very next quarter-hour instead", () => {
    const { findLegalSlotOrNull, IMMEDIATE_CATCHUP_MINS, IMMEDIATE_NOW_BUFFER_MINS } = loadStudlinModule({ now: "2026-07-20T09:47:00" });
    const slot = findLegalSlotOrNull([], [], DEFAULT_PREFS, "2026-07-20", "09:00", 40, null, IMMEDIATE_CATCHUP_MINS, IMMEDIATE_NOW_BUFFER_MINS);
    assert.equal(slot.date, "2026-07-20");
    assert.equal(slot.time, "10:00", "still rounds up to the next 15-min grid mark (never an already-past time), just without the extra 15 minutes stacked on top");
  });

  test("it still never hands back an already-past time -- the grid-rounding safety net survives even with the padding removed", () => {
    const { findLegalSlotOrNull, IMMEDIATE_CATCHUP_MINS, IMMEDIATE_NOW_BUFFER_MINS } = loadStudlinModule({ now: "2026-07-20T09:59:00" });
    const slot = findLegalSlotOrNull([], [], DEFAULT_PREFS, "2026-07-20", "09:00", 40, null, IMMEDIATE_CATCHUP_MINS, IMMEDIATE_NOW_BUFFER_MINS);
    assert.equal(slot.time, "10:00", "9:59 must still round forward to 10:00, never land on or before the actual current time");
  });
});

describe("planBrainDumpTasks: an explicit 'now' item actually lands near the real current time, not padded further", () => {
  test("this is the exact live scenario: 9:47am, empty calendar, 'study for ENG 10 for 40 minutes now'", () => {
    const { planBrainDumpTasks } = loadStudlinModule({ now: "2026-07-20T09:47:00" });
    const items = [{ kind: "study", title: "Study for ENG 10", immediate: true, durationMin: 40 }];
    const { tasks } = planBrainDumpTasks(items, [], [], DEFAULT_PREFS);
    const studyTask = tasks.find(t => t.kind === "study block");
    assert.ok(studyTask, "a study block should have been created");
    assert.equal(studyTask.date, "2026-07-20");
    assert.equal(studyTask.time, "10:00", "must land on the very next quarter-hour, not the one after that");
  });

  test("planBrainDumpTasks' immediate branch passes IMMEDIATE_NOW_BUFFER_MINS alongside IMMEDIATE_CATCHUP_MINS", () => {
    const idx = SOURCE.indexOf('}else if(it.immediate){');
    const body = SOURCE.slice(idx, idx + 900);
    assert.match(body, /findLegalSlotOrNull\(working,routines,prefs,today,prefs\.workStartTime,duration,it\.dueDate\|\|null,IMMEDIATE_CATCHUP_MINS,IMMEDIATE_NOW_BUFFER_MINS\);/);
  });
});

describe("The pre-commit 'no open time right now' honesty check matches the same de-padded window", () => {
  test("so it never warns about a gap the real commit wouldn't actually have", () => {
    const idx = SOURCE.indexOf('if(kind==="study"&&it.immediate&&!it.needsDuration){');
    const body = SOURCE.slice(idx, idx + 1600);
    assert.match(body, /findLegalSlotOrNull\(events,routines,prefs,todayKeyNow,prefs\.workStartTime,duration,it\.dueDate\|\|null,IMMEDIATE_CATCHUP_MINS,IMMEDIATE_NOW_BUFFER_MINS\);/);
  });
});
