// Second follow-up to the 2026-09-21 pinned-task fix (see
// pinned-never-moved-and-preview-before-move-2026-09-21.test.js). User was
// asked to plan first (via /plan) before building the remaining 3
// auto-movers + an explicit Pin button; this covers that batch:
//   1. An explicit Pin button (previously only "Unpin" existed).
//   2. rebalanceDay stamps its own moves + returns {events,moved} --
//      covered in scheduling.test.js's own "rebalanceDay" describe block,
//      not duplicated here.
//   3. Routine-edit conflicts (computeRoutineConflictPlan) -- full preview
//      before committing, same pattern as Catch Me Up.
//   4. Calendar-sync/import conflicts (computeFixedEventConflictPlan) --
//      same preview-first treatment, plus the scheduleChangeAlerts panel's
//      "doesn't show up live in the same session" bug fixed as a byproduct.
// Run with `npm test`.
const { test, describe } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");
const { loadStudlinModule } = require("./harness.js");

const SOURCE = fs.readFileSync(path.join(__dirname, "..", "studlin-app.jsx"), "utf8");

const DEFAULT_PREFS = {
  workStartTime: "09:00", workEndTime: "18:00", bedtime: "23:00",
  taskDifficultyPreference: "NONE", bufferMarginStrategy: "15_MIN",
  weekendEnabled: false, weekendStartTime: "09:00", weekendEndTime: "18:00",
  peakHourBuckets: [],
};

function studyBlock(overrides) {
  return {
    id: "study-1", title: "Study chem", date: "2026-07-20", time: "10:00",
    subject: "Chemistry", kind: "study block", notes: "", priority: 5, difficulty: 5,
    deadline: null, duration: 30, status: "pending", timeSpent: 0,
    completedAt: null, ...overrides,
  };
}

describe("computeRoutineConflictPlan (routine-edit conflicts, preview-first)", () => {
  const today = "2026-07-20";
  // Monday 10:00-11:00 class, same weekday as `today` (2026-07-20 is a Monday).
  const dow = (new Date(today + "T12:00:00").getDay() + 6) % 7;
  const newClass = [{ id: "r1", kind: "class", title: "Bio 101", days: [dow], startTime: "10:00", duration: 60, subject: "Biology" }];

  test("a pending study block overlapping the new routine gets a real proposed slot", () => {
    const { computeRoutineConflictPlan } = loadStudlinModule();
    const plan = computeRoutineConflictPlan([studyBlock()], newClass, DEFAULT_PREFS, today);
    assert.equal(plan.moves.length, 1);
    assert.equal(plan.moves[0].id, "study-1");
    assert.equal(plan.moves[0].from.date, today);
    assert.equal(plan.moves[0].from.time, "10:00");
    assert.ok(plan.moves[0].to.date !== today || plan.moves[0].to.time !== "10:00");
  });

  test("no overlap at all is a no-op", () => {
    const { computeRoutineConflictPlan } = loadStudlinModule();
    const plan = computeRoutineConflictPlan([studyBlock({ time: "14:00" })], newClass, DEFAULT_PREFS, today);
    assert.equal(plan.moves.length, 0);
  });

  test("a pinned task overlapping the new routine is never offered, not even as a preview", () => {
    const { computeRoutineConflictPlan } = loadStudlinModule();
    const plan = computeRoutineConflictPlan([studyBlock({ userPinned: true })], newClass, DEFAULT_PREFS, today);
    assert.equal(plan.moves.length, 0);
  });

  test("a done task is exempt", () => {
    const { computeRoutineConflictPlan } = loadStudlinModule();
    const plan = computeRoutineConflictPlan([studyBlock({ status: "done" })], newClass, DEFAULT_PREFS, today);
    assert.equal(plan.moves.length, 0);
  });

  test("pure -- never mutates the events it's given, and returns no `events` key (compute only, no commit)", () => {
    const { computeRoutineConflictPlan } = loadStudlinModule();
    const original = studyBlock();
    const snapshot = JSON.stringify(original);
    const plan = computeRoutineConflictPlan([original], newClass, DEFAULT_PREFS, today);
    assert.equal(JSON.stringify(original), snapshot, "the input event object must be untouched");
    assert.equal(plan.events, undefined, "no events key -- this never commits, only proposes");
  });

  test("a task more than ROUTINE_CONFLICT_HORIZON_DAYS out is left alone", () => {
    const { computeRoutineConflictPlan, ROUTINE_CONFLICT_HORIZON_DAYS } = loadStudlinModule();
    const d = new Date(today + "T12:00:00");
    d.setDate(d.getDate() + ROUTINE_CONFLICT_HORIZON_DAYS + 5);
    const farDow = (d.getDay() + 6) % 7;
    const farClass = [{ id: "r1", kind: "class", title: "Bio 101", days: [farDow], startTime: "10:00", duration: 60 }];
    const farDateKey = d.toISOString().slice(0, 10);
    const plan = computeRoutineConflictPlan([studyBlock({ date: farDateKey })], farClass, DEFAULT_PREFS, today);
    assert.equal(plan.moves.length, 0);
  });
});

describe("computeFixedEventConflictPlan (calendar-sync/import conflicts, preview-first)", () => {
  test("a new fixed exam proposes a relocation for a colliding flexible study block", () => {
    const { computeFixedEventConflictPlan } = loadStudlinModule();
    const exam = { id: "exam-1", title: "math 101", kind: "exam", date: "2026-08-06", time: "10:00", duration: 60 };
    const plan = computeFixedEventConflictPlan([exam], [studyBlock({ date: "2026-08-06" })], [], DEFAULT_PREFS);
    assert.equal(plan.moved.length, 1);
    assert.equal(plan.moved[0].id, "study-1");
    assert.equal(plan.moved[0].causedByTitle, "math 101");
    assert.ok(plan.moved[0].to.date !== "2026-08-06" || plan.moved[0].to.time !== "10:00");
  });

  test("no collision is a no-op", () => {
    const { computeFixedEventConflictPlan } = loadStudlinModule();
    const exam = { id: "exam-1", title: "math 101", kind: "exam", date: "2026-08-06", time: "10:00", duration: 60 };
    const plan = computeFixedEventConflictPlan([exam], [studyBlock({ date: "2026-08-06", time: "14:00" })], [], DEFAULT_PREFS);
    assert.equal(plan.moved.length, 0);
    assert.equal(plan.needsAttention.length, 0);
  });

  test("two fixed events colliding (neither can move) goes to needsAttention", () => {
    const { computeFixedEventConflictPlan } = loadStudlinModule();
    const cls = { id: "class-1", title: "Period 3", kind: "class", date: "2026-08-06", time: "10:00", duration: 50, status: "pending" };
    const exam = { id: "exam-1", title: "math 101", kind: "exam", date: "2026-08-06", time: "10:00", duration: 60 };
    const plan = computeFixedEventConflictPlan([exam], [cls], [], DEFAULT_PREFS);
    assert.equal(plan.moved.length, 0);
    assert.equal(plan.needsAttention.length, 1);
  });

  test("pinned/done/checklist/co-op flexible blocks are exempt", () => {
    const { computeFixedEventConflictPlan } = loadStudlinModule();
    const exam = { id: "exam-1", title: "math 101", kind: "exam", date: "2026-08-06", time: "10:00", duration: 60 };
    const existing = [
      studyBlock({ id: "pinned-1", date: "2026-08-06", userPinned: true }),
      studyBlock({ id: "done-1", date: "2026-08-06", status: "done" }),
      studyBlock({ id: "checklist-1", date: "2026-08-06", checklist: true }),
      studyBlock({ id: "coop-1", date: "2026-08-06", studySessionId: "s1" }),
    ];
    const plan = computeFixedEventConflictPlan([exam], existing, [], DEFAULT_PREFS);
    assert.equal(plan.moved.length, 0);
  });

  test("pure -- reconcileFixedEventConflicts (the storage-writing wrapper) leaves the colliding study block exactly where it was, only the new fixed event commits", () => {
    const m = loadStudlinModule();
    m.lsSet("events", [studyBlock({ date: "2026-08-06" })]);
    const exam = { id: "exam-1", title: "math 101", kind: "exam", date: "2026-08-06", time: "10:00", duration: 60 };
    const result = m.reconcileFixedEventConflicts([exam]);
    const untouched = result.events.find((e) => e.id === "study-1");
    assert.equal(untouched.time, "10:00", "not relocated -- only proposed");
    assert.equal(untouched.movedByStudlin, undefined);
    assert.ok(result.events.find((e) => e.id === "exam-1"), "the new fixed event commits unconditionally");
    assert.equal(result.moved.length, 1);
  });
});

describe("reconcileToastSuffix now describes a proposal, not a completed move", () => {
  test("wording says 'need a new time', not 'moved to make room' (the old text would now be a false claim)", () => {
    const { reconcileToastSuffix } = loadStudlinModule();
    const text = reconcileToastSuffix({ moved: [{ id: "a" }], needsAttention: [] });
    assert.match(text, /needs? a new time/);
    assert.doesNotMatch(text, /moved to make room/);
  });
});

describe("Pin button (source guards -- no isolated render harness for JSX in this repo, same convention every other component-closure UI test in this file family uses)", () => {
  test("the block popover offers Pin for an eligible unpinned task, gated on the same isReorderableTask predicate Unpin's own negation implies", () => {
    const idx = SOURCE.indexOf("{isReorderableTask(ev)&&(");
    assert.notEqual(idx, -1, "a Pin button must exist in the popover");
    const body = SOURCE.slice(idx, idx + 500);
    assert.match(body, />Pin</);
    assert.match(body, /userPinned:true/);
  });

  test("the Edit Task modal offers Pin for an eligible unpinned task, next to the existing Unpin row", () => {
    const idx = SOURCE.indexOf("Not pinned. Studlin can move this to fit your schedule.");
    assert.notEqual(idx, -1);
    const body = SOURCE.slice(idx - 200, idx + 500);
    assert.match(body, /isReorderableTask\(ev\)/);
    assert.match(body, />Pin</);
    assert.match(body, /userPinned:true/);
  });

  test("both Pin buttons write userPinned:true the same way the adjacent Unpin button writes false (same commit/setEvents pattern, no new write path invented)", () => {
    const popoverPinIdx = SOURCE.indexOf("{isReorderableTask(ev)&&(");
    const popoverBody = SOURCE.slice(popoverPinIdx, popoverPinIdx + 300);
    assert.match(popoverBody, /events\.map\(x=>x\.id===ev\.id\?\{\.\.\.x,userPinned:true\}:x\)/);
    assert.match(popoverBody, /setEvents\(next\);lsSet\("events",next\);/);

    const modalPinIdx = SOURCE.indexOf("Not pinned. Studlin can move this to fit your schedule.");
    const modalBody = SOURCE.slice(modalPinIdx, modalPinIdx + 300);
    assert.match(modalBody, /commit\(allEvents\.map\(x=>x\.id===ev\.id\?\{\.\.\.x,userPinned:true\}:x\)\)/);
  });
});

describe("scheduleChangeAlerts panel now offers Move/Skip on a proposal instead of Undo on an already-applied move", () => {
  test("the per-item 'moved' row has Move and Skip actions, not Undo", () => {
    const idx = SOURCE.indexOf("{scheduleChangeAlerts.length>0&&(()=>{");
    assert.notEqual(idx, -1);
    const body = SOURCE.slice(idx, idx + 3000);
    assert.match(body, />Move</);
    assert.match(body, />Skip</);
    assert.match(body, /applyScheduleChangeMove\(a\)/);
  });

  test("a batch of more than one proposed move gets a 'Move all' bulk action", () => {
    const idx = SOURCE.indexOf("{scheduleChangeAlerts.length>0&&(()=>{");
    const body = SOURCE.slice(idx, idx + 3600);
    assert.match(body, /applyAllScheduleChangeMoves/);
    assert.match(body, /movedCount>1&&/);
  });

  test("applyScheduleChangeMove re-validates the slot is still free before committing (a stale proposal must never silently overlap)", () => {
    const idx = SOURCE.indexOf("const applyScheduleChangeMove=(a)=>{");
    assert.notEqual(idx, -1);
    const body = SOURCE.slice(idx, idx + 1200);
    assert.match(body, /computeOccupiedIntervals\(/);
    assert.match(body, /movedByStudlin:true/);
  });
});

describe("surfaceReconcileResult also notifies an already-mounted App live (regression: used to only ever populate via a mount-only localStorage read, so every trigger except one bypassed effect produced nothing visible until the next full reload)", () => {
  test("dispatches a window event in addition to the existing localStorage handoff", () => {
    const idx = SOURCE.indexOf("function surfaceReconcileResult(result){");
    assert.notEqual(idx, -1);
    const body = SOURCE.slice(idx, idx + 1600);
    assert.match(body, /lsSet\("pendingScheduleChangeAlerts"/, "the mount-time fallback must still exist");
    assert.match(body, /window\.dispatchEvent\(new CustomEvent\("studlin:scheduleChangeAlerts"/);
  });

  test("App listens for it and merges into scheduleChangeAlerts with the same dedup as the mount-time path", () => {
    assert.match(SOURCE, /window\.addEventListener\("studlin:scheduleChangeAlerts",onLiveAlerts\)/);
    assert.match(SOURCE, /setScheduleChangeAlerts\(a=>dedupeScheduleAlerts\(\[\.\.\.a,\.\.\.e\.detail\]\)\)/);
  });
});
