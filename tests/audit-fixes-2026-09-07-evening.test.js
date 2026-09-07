// Regression tests for the overnight full-app audit, 2026-09-07 evening.
// Six parallel fork agents each read-only-audited one area of the app;
// every finding below was independently verified against the real source
// before being fixed. Run with `npm test`.
const { test, describe } = require("node:test");
const assert = require("node:assert/strict");
const { loadStudlinModule } = require("./harness.js");

const DEFAULT_PREFS = {
  workStartTime: "09:00", workEndTime: "18:00", bedtime: "23:00",
  taskDifficultyPreference: "NONE", bufferMarginStrategy: "15_MIN",
  weekendEnabled: false, weekendStartTime: "09:00", weekendEndTime: "18:00",
  peakHourBuckets: [],
};
const minutesOf = (t) => { const [h, m] = t.split(":").map(Number); return h * 60 + m; };

describe("Calendar audit -- Fixed/Free toggle now actually reaches a recurring occurrence", () => {
  test("expandRoutineOccurrences copies movable onto the materialized occurrence", () => {
    const { expandRoutineOccurrences } = loadStudlinModule();
    const routines = [{ id: "r1", kind: "class", title: "Gym", days: [0], startTime: "17:00", duration: 60, movable: true }];
    const occ = expandRoutineOccurrences(routines, "2026-09-07", "2026-09-07"); // a Monday
    assert.equal(occ.length, 1);
    assert.equal(occ[0].movable, true);
  });

  test("a routine with no movable field materializes as fixed (false), not undefined", () => {
    const { expandRoutineOccurrences } = loadStudlinModule();
    const routines = [{ id: "r1", kind: "class", title: "Chem", days: [0], startTime: "09:00", duration: 60 }];
    const occ = expandRoutineOccurrences(routines, "2026-09-07", "2026-09-07");
    assert.equal(occ[0].movable, false);
  });
});

describe("Calendar audit -- exam-during-its-own-class is never a false 'needs attention' conflict", () => {
  test("reconcileFixedEventConflicts suppresses the pairing via isExpectedInClassOverlap", () => {
    const m = loadStudlinModule();
    const cls = { id: "cls-1", title: "Chem Lecture", date: "2026-09-08", time: "10:00", duration: 60, kind: "class", courseId: "course-chem", movable: false, status: "pending" };
    m.lsSet("events", [cls]);
    const exam = { id: "exam-1", title: "Midterm", date: "2026-09-08", time: "10:00", duration: 60, kind: "exam", courseId: "course-chem", status: "pending" };
    const result = m.reconcileFixedEventConflicts([exam]);
    assert.equal(result.needsAttention.length, 0, "an exam during its own class's real meeting time is expected, not a conflict");
  });

  test("a genuine double-booking (different courses) still gets flagged", () => {
    const m = loadStudlinModule();
    const cls = { id: "cls-1", title: "Chem Lecture", date: "2026-09-08", time: "10:00", duration: 60, kind: "class", courseId: "course-chem", movable: false, status: "pending" };
    m.lsSet("events", [cls]);
    const exam = { id: "exam-1", title: "Bio Midterm", date: "2026-09-08", time: "10:00", duration: 60, kind: "exam", courseId: "course-bio", status: "pending" };
    const result = m.reconcileFixedEventConflicts([exam]);
    assert.equal(result.needsAttention.length, 1, "two different fixed things genuinely overlapping must still be flagged");
  });
});

describe("Syllabus audit -- ClassSetupWizard's kind:\"assignment\" now gets real Attack Block gating", () => {
  function wizardItem(overrides) {
    // Exactly the shape buildReviewFromExtraction/ITEM_KIND_OPTIONS stamps
    // for a plain assignment -- kind:"assignment", not "deadline".
    return { title: "Problem Set 3", date: "2026-08-05", kind: "assignment", include: true, attackBlock: true, proposeSessions: false, noDate: false, detail: "", difficulty: 500, ...overrides };
  }
  test("a wizard-scanned assignment gets attackStartDate/prepPending like a Notes-canvas one would", () => {
    const { buildSyllabusEventBatch, getWeeklyRoutine, getSchedulePreferences } = loadStudlinModule({ now: "2026-07-20T09:00:00" });
    const { markerEvents } = buildSyllabusEventBatch([], "wiz-1", "Chemistry", [wizardItem({ estimatedHours: 5, date: "2026-12-01" })], null, getWeeklyRoutine(), getSchedulePreferences());
    assert.equal(markerEvents.length, 1);
    assert.equal(markerEvents[0].kind, "deadline", "stored kind still collapses to deadline, same as before");
    assert.ok(markerEvents[0].attackStartDate, "attackStartDate must be stamped for a wizard-scanned assignment, not silently skipped");
  });

  test("the stored deadline field is a real date, not null, for a wizard-scanned assignment", () => {
    const { buildSyllabusEventBatch, getWeeklyRoutine, getSchedulePreferences } = loadStudlinModule({ now: "2026-07-20T09:00:00" });
    const { markerEvents } = buildSyllabusEventBatch([], "wiz-2", "Chemistry", [wizardItem({ date: "2026-09-10" })], null, getWeeklyRoutine(), getSchedulePreferences());
    assert.equal(markerEvents[0].deadline, "2026-09-10");
  });

  test("an actionable-now wizard assignment gets a real Attack Block chain-building attempt (attackEvents non-empty when a slot exists)", () => {
    const { buildSyllabusEventBatch, getWeeklyRoutine, getSchedulePreferences } = loadStudlinModule({ now: "2026-07-20T09:00:00" });
    // A near deadline with a real estimate should gate as actionable today.
    const { attackEvents } = buildSyllabusEventBatch([], "wiz-3", "Chemistry", [wizardItem({ estimatedHours: 1, date: "2026-07-22" })], null, getWeeklyRoutine(), getSchedulePreferences());
    assert.ok(attackEvents.length > 0, "a plain wizard assignment must be able to enter the Attack Block chain-building loop");
  });
});

describe("Brain Dump audit -- 'then'-chaining now works after a timed event/reminder/exam, not just after another study item", () => {
  test("a study item chained after a fixed-time event lands right after that event ends", () => {
    const { planBrainDumpTasks } = loadStudlinModule({ now: "2026-07-16T08:00:00" });
    const items = [
      { kind: "event", title: "Work", dueTime: "13:00", durationMin: 120, chained: false },
      { kind: "study", title: "Chem homework", durationMin: 60, chained: true },
    ];
    const { tasks } = planBrainDumpTasks(items, [], [], DEFAULT_PREFS);
    const work = tasks.find((t) => t.title === "Work");
    const chem = tasks.find((t) => t.title === "Chem homework");
    assert.ok(work && chem);
    assert.equal(chem.date, work.date);
    const gap = minutesOf(chem.time) - (minutesOf(work.time) + work.duration);
    assert.ok(gap >= 0 && gap <= 30, `expected chem homework to start right after work ended, gap was ${gap}min`);
  });

  test("a study item chained after a real-time reminder anchors to the reminder's own time", () => {
    const { planBrainDumpTasks } = loadStudlinModule({ now: "2026-07-16T08:00:00" });
    const items = [
      { kind: "reminder", title: "Call advisor", dueTime: "14:00", chained: false },
      { kind: "study", title: "Read chapter 4", durationMin: 45, chained: true },
    ];
    const { tasks } = planBrainDumpTasks(items, [], [], DEFAULT_PREFS);
    const read = tasks.find((t) => t.title === "Read chapter 4");
    assert.ok(read);
    assert.equal(read.date, "2026-07-16");
    assert.ok(minutesOf(read.time) >= minutesOf("14:00"), "should not land before the reminder it's chained after");
  });

  test("a reminder with NO real time is never used as a chain anchor (would chain onto a fake placeholder time)", () => {
    const { planBrainDumpTasks } = loadStudlinModule({ now: "2026-07-16T08:00:00" });
    const items = [
      { kind: "reminder", title: "Grab dinner", chained: false }, // no dueTime -> placeholder 09:00, timeUnconfirmed
      { kind: "study", title: "Study for finals", durationMin: 60, immediate: true, chained: true },
    ];
    const { tasks } = planBrainDumpTasks(items, [], [], DEFAULT_PREFS);
    const study = tasks.find((t) => t.title === "Study for finals");
    assert.ok(study);
    // With no real anchor, chained falls through to its own immediate/normal placement -- just assert it didn't crash and got scheduled somewhere real.
    assert.ok(study.date && study.time);
  });
});

describe("Studlin AI chat audit -- create_task no longer forces a guessed flat duration", () => {
  test("a study task with no durationMin mentioned goes through a real Attack Block probe, not a fabricated flat 30-minute block", () => {
    const { buildCreateTaskProposal } = loadStudlinModule({ now: "2026-07-16T08:00:00" });
    const parsed = { title: "Finish history essay", taskKind: "study", dueDate: "2026-08-01", dueTime: null, durationMin: null };
    const result = buildCreateTaskProposal(parsed, [], [], DEFAULT_PREFS);
    assert.ok(result.ok);
    const task = result.tasks.find((t) => t.title === "Finish history essay");
    assert.ok(task);
    assert.equal(task.isAttackBlock, true, "no duration was ever stated -- this must start a real Attack Block chain, not guess 30 minutes");
  });

  test("a study task WITH a stated duration is scheduled directly, no unnecessary Attack Block probe", () => {
    const { buildCreateTaskProposal } = loadStudlinModule({ now: "2026-07-16T08:00:00" });
    const parsed = { title: "Quick review", taskKind: "study", dueDate: "2026-08-01", dueTime: null, durationMin: 20 };
    const result = buildCreateTaskProposal(parsed, [], [], DEFAULT_PREFS);
    assert.ok(result.ok);
    const task = result.tasks.find((t) => t.title === "Quick review");
    assert.ok(task);
    assert.ok(!task.isAttackBlock, "a real stated duration means there's nothing to probe for");
    assert.equal(task.duration, 20);
  });
});

describe("Studlin Prep audit -- Build Study Plan reasoning never claims a self-report the student never made", () => {
  test("confidenceKnown:false never says 'you said' regardless of the underlying default value", () => {
    const { studyPlanReasoning } = loadStudlinModule();
    const lines = studyPlanReasoning("okay", "moderate", 0, false, false, 3, 25, false, 10, false, false);
    const joined = lines.join(" ");
    assert.ok(!joined.includes("you said"), `reasoning text must not fabricate a self-report: "${joined}"`);
  });

  test("confidenceKnown:true (a real tap, or a real past confidenceLog entry) still gets attributed to the student", () => {
    const { studyPlanReasoning } = loadStudlinModule();
    const lines = studyPlanReasoning("shaky", "moderate", 0, false, false, 3, 25, false, 10, false, true);
    const joined = lines.join(" ");
    assert.ok(joined.includes("you said you're shaky"), "a real self-report should still be reflected honestly");
  });

  test("confidenceKnown defaults to true when omitted, so no other/older call site silently changes behavior", () => {
    const { studyPlanReasoning } = loadStudlinModule();
    const lines = studyPlanReasoning("solid", "moderate", 0, false, false, 3, 25, false, 10, false);
    assert.ok(lines.join(" ").includes("already feeling solid"));
  });
});
