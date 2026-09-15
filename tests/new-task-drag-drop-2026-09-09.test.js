// Projects Redesign follow-up (2026-09-09): New Task's "I'll pick the
// time" only ever offered typed Date/Start Time fields -- for a small,
// imprecise task ("do this sometime this afternoon") not knowing the
// exact time OR duration up front is the whole reason to want to drag
// instead of type. Mirrors the existing EventDetailModal "+Add my own
// time block" drag pattern, but this CREATES a new task from scratch
// (no dueEventId to link to) so it needs its own MIME/payload shape and
// its own commit handler (commitNewTaskDrop, in CalendarTab).
//
// computeDropDuration is a real, pure, top-level function -- unit tested.
// Everything else here is component-closure UI, so those are source-level
// regression guards, same mixed-coverage convention this session has used
// throughout. Run with `npm test`.
const { test, describe } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");
const { loadStudlinModule } = require("./harness.js");

const SOURCE = fs.readFileSync(path.join(__dirname, "..", "studlin-app.jsx"), "utf8");

const DEFAULT_PREFS = {
  workStartTime: "09:00", workEndTime: "18:00", bedtime: "23:00",
  taskDifficultyPreference: "NONE", bufferMarginStrategy: "15_MIN",
  weekendEnabled: true, weekendStartTime: "09:00", weekendEndTime: "18:00",
  peakHourBuckets: [],
};

describe("computeDropDuration: fills a real gap under an hour, defaults to an hour otherwise", () => {
  test("a 35-minute gap before the next thing on the calendar becomes exactly 35 minutes", () => {
    const { computeDropDuration } = loadStudlinModule({ now: "2026-09-09T09:00:00" });
    const events = [{ id: "next", date: "2026-09-10", time: "15:35", duration: 60, status: "pending" }];
    const duration = computeDropDuration(events, [], DEFAULT_PREFS, "2026-09-10", "15:00");
    assert.equal(duration, 35);
  });

  test("no gap-limiting event that day defaults to a plain 1 hour", () => {
    const { computeDropDuration } = loadStudlinModule({ now: "2026-09-09T09:00:00" });
    const duration = computeDropDuration([], [], DEFAULT_PREFS, "2026-09-10", "15:00");
    assert.equal(duration, 60);
  });

  test("a gap of an hour or more also just defaults to 1 hour, not the full gap", () => {
    const { computeDropDuration } = loadStudlinModule({ now: "2026-09-09T09:00:00" });
    const events = [{ id: "next", date: "2026-09-10", time: "18:00", duration: 60, status: "pending" }];
    const duration = computeDropDuration(events, [], DEFAULT_PREFS, "2026-09-10", "15:00");
    assert.equal(duration, 60, "a 3-hour gap should not become a 3-hour block -- only sub-hour gaps get filled exactly");
  });

  test("dropping right at the boundary of an existing block still floors at 5 minutes, never 0 or negative", () => {
    const { computeDropDuration } = loadStudlinModule({ now: "2026-09-09T09:00:00" });
    const events = [{ id: "next", date: "2026-09-10", time: "15:00", duration: 60, status: "pending" }];
    const duration = computeDropDuration(events, [], DEFAULT_PREFS, "2026-09-10", "15:00");
    assert.ok(duration >= 5);
  });

  test("a done task on the calendar doesn't count as a boundary -- its old slot is free, matching every other occupied-interval check in this file", () => {
    const { computeDropDuration } = loadStudlinModule({ now: "2026-09-09T09:00:00" });
    const events = [{ id: "done-task", date: "2026-09-10", time: "15:20", duration: 30, status: "done" }];
    const duration = computeDropDuration(events, [], DEFAULT_PREFS, "2026-09-10", "15:00");
    assert.equal(duration, 60, "a completed task's old time slot must not artificially shrink the new block's duration");
  });
});

describe("New Task drag-and-drop: component-closure UI (source-level regression guards)", () => {
  test("the drag option is scoped to Task/Assignment(non-Attack-Block)/reminder/busy block/Study Session -- excludes Project, Exam, Class", () => {
    const idx = SOURCE.indexOf("const canDragNewTask=");
    assert.notEqual(idx, -1);
    const line = SOURCE.slice(idx, idx + 250);
    assert.match(line, /!isProjectKind/, "Project hard-requires notes/phases before it'll save at all -- dragging would just hit the same block");
    assert.match(line, /!\(evKind==="assignment"&&evAttackBlock\)/, "Attack Block already finds the time itself -- a manually dragged time isn't even a guaranteed placement there");
  });

  test("the payload resolves Assignment to kind:deadline (2026-09-10 write-side unification) and Task/Study Session to study block, plus isGeneralTask/isAssignment flags, same convention resolveAssignmentKind's own fix uses", () => {
    const idx = SOURCE.indexOf("const dragNewTaskPayload=()=>{");
    assert.notEqual(idx, -1);
    const body = SOURCE.slice(idx, idx + 1100);
    assert.match(body, /resolvedKind=evKind==="assignment"\?"deadline":\(\(evKind==="task"\|\|evKind==="studySession"\)\?"study block":evKind\)/);
    assert.match(body, /isGeneralTask:true/);
    assert.match(body, /isAssignment:true/);
  });

  test("dragging closes the modal and switches to Calendar, same as EventDetailModal's own manual-block drag chip", () => {
    const idx = SOURCE.indexOf("e.dataTransfer.setData(NEW_TASK_DRAG_MIME");
    assert.notEqual(idx, -1);
    const body = SOURCE.slice(idx, idx + 300);
    // 2026-09-15 fix: this used to assert onClose() -- an identifier that
    // doesn't exist anywhere in CalendarTab's scope (the modal's real close
    // function is resetForm, per its own <Modal onClose={resetForm}> wrapper).
    // The old assertion just encoded the bug: starting the drag threw a
    // ReferenceError, the modal never closed, and it sat on top of the
    // calendar blocking the drop target -- exactly the live "drag doesn't
    // work" report this fixes.
    assert.match(body, /setActive\("calendar"\); resetForm\(\);/);
  });

  test("WeeklyPlanner's drop handler reads the new MIME independently of MANUAL_BLOCK_DRAG_MIME's dueEventId-required contract", () => {
    const idx = SOURCE.indexOf("e.dataTransfer.getData(NEW_TASK_DRAG_MIME) && onDropNewTaskRequest");
    assert.notEqual(idx, -1);
  });

  test("commitNewTaskDrop uses computeDropDuration rather than a fixed default, and never assumes a dueEventId exists", () => {
    const idx = SOURCE.indexOf("const commitNewTaskDrop=(payload,dateKey,time)=>{");
    assert.notEqual(idx, -1);
    const body = SOURCE.slice(idx, idx + 900);
    assert.match(body, /computeDropDuration\(events,routines,getSchedulePreferences\(\),dateKey,time\)/);
    assert.doesNotMatch(body, /dueEventId:payload\.dueEventId/, "this creates a brand-new task -- it must not carry over the linked-block shape commitManualBlockDrop uses");
  });
});
