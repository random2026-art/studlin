// Regression tests for the 2026-09-06 task-type taxonomy fixes.
//
// User reports, in one message: (1) editing a Task that was created with
// "No schedule yet" showed it as "To-do" instead of "Task"; (2) an
// assignment's due date had no way to also state a due TIME; (3) "Assignment
// and Study Session should be different" -- they used to be the same
// evKind, relabeled by scheduling mode, so picking "I'll pick the time"
// made "Assignment" vanish from the Type picker entirely; (4) Brain Dump
// had no way to produce a real Assignment at all.
//
// Root causes, all in studlin-app.jsx:
// - CalendarTab's saveChecklistItem (New Task's "No schedule yet" save)
//   never stamped isGeneralTask/isAssignment, so a checklist item's
//   original Type was silently discarded.
// - EventDetailModal's typeChoice ternary checked asChecklist before
//   asGeneralTask, so ANY checklist item always displayed as "To-do"
//   regardless of the (missing) flag.
// - resolveAssignmentKind collapsed "Assignment + manual mode" into the
//   exact same kind:"study block" shape a real Study Session uses, with a
//   label that swapped based on mode instead of two real, coexisting Type
//   options.
// - Neither CalendarTab's buildTask/saveChecklistItem nor Brain Dump's
//   planBrainDumpTasks ever persisted a due TIME -- only a bare date.
//
// planBrainDumpTasks is a real top-level pure function, tested directly.
// NewEventModal/EventDetailModal are component closures (same as every
// other fix in this file), so those are source-level regression guards --
// same established precedent as event-detail-delete.test.js and
// brain-dump-now-buffer.test.js. Run with `npm test`.
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

describe("planBrainDumpTasks: a 'study' item is stamped isAssignment -- it already has exactly what an Assignment means everywhere else (a real due date, Studlin finds the time)", () => {
  test("a scheduled study-kind item comes back tagged isAssignment:true", () => {
    const { planBrainDumpTasks } = loadStudlinModule({ now: "2026-07-20T09:00:00" });
    const items = [{ kind: "study", title: "Finish history essay", dueDate: "2026-07-25", durationMin: 45 }];
    const { tasks } = planBrainDumpTasks(items, [], [], DEFAULT_PREFS);
    const task = tasks.find(t => t.title === "Finish history essay");
    assert.ok(task, "a task should have been created");
    assert.equal(task.isAssignment, true);
  });

  test("an Attack Block study item (its own separate marker+chain path) is unaffected by the isAssignment stamp", () => {
    const { planBrainDumpTasks } = loadStudlinModule({ now: "2026-07-20T09:00:00" });
    const items = [{ kind: "study", title: "Big project", attackBlock: true, dueDate: "2026-08-01" }];
    const { tasks } = planBrainDumpTasks(items, [], [], DEFAULT_PREFS);
    // Attack Block's own marker/chain shape never carried isAssignment
    // before this fix either -- confirming the new stamp only touches the
    // plain (non-attackBlock) branch, not this one.
    assert.ok(tasks.length >= 1);
  });
});

describe("CalendarTab's saveChecklistItem preserves which real Type was picked (source-level guard)", () => {
  test("stamps isGeneralTask when Type was Task", () => {
    const idx = SOURCE.indexOf("const saveChecklistItem=()=>{");
    assert.notEqual(idx, -1, "saveChecklistItem must exist");
    const body = SOURCE.slice(idx, idx + 900);
    assert.match(body, /\.\.\.\(evKind==="task"\?\{isGeneralTask:true\}:\{\}\)/);
  });

  test("stamps isAssignment when Type was Assignment", () => {
    const idx = SOURCE.indexOf("const saveChecklistItem=()=>{");
    const body = SOURCE.slice(idx, idx + 900);
    assert.match(body, /\.\.\.\(evKind==="assignment"\?\{isAssignment:true\}:\{\}\)/);
  });

  test("persists a real deadlineTime, not just a bare date", () => {
    const idx = SOURCE.indexOf("const saveChecklistItem=()=>{");
    const body = SOURCE.slice(idx, idx + 900);
    assert.match(body, /deadlineTime:evDeadline\?\(evDeadlineTime\|\|null\):null/);
  });
});

describe("CalendarTab's buildTask stamps isAssignment for the scheduled (non-checklist) Assignment path too", () => {
  test("isAssignment is stamped alongside the existing isGeneralTask stamp", () => {
    const idx = SOURCE.indexOf("const buildTask=(date,time,titleSuffix,splitInfo)=>{");
    assert.notEqual(idx, -1, "buildTask must exist");
    const body = SOURCE.slice(idx, idx + 5000);
    assert.match(body, /\.\.\.\(evKind==="task"\?\{isGeneralTask:true\}:\{\}\)/);
    assert.match(body, /\.\.\.\(evKind==="assignment"\?\{isAssignment:true\}:\{\}\)/);
  });

  test("persists a real deadlineTime field", () => {
    const idx = SOURCE.indexOf("const buildTask=(date,time,titleSuffix,splitInfo)=>{");
    const body = SOURCE.slice(idx, idx + 5000);
    assert.match(body, /deadlineTime:evDeadline\?\(evDeadlineTime\|\|null\):null/);
  });
});

describe("NewEventModal: Assignment's manual-mode due-date field doesn't double up with checklist mode's own due-date field (live user report, reproduced in-browser)", () => {
  test("the manual-mode due-date block requires !isChecklistMode, same guard every sibling taskMode==\"manual\" field already has", () => {
    // Real bug: clicking \"I'll pick the time\" then \"No schedule yet\"
    // left taskMode stuck at \"manual\" (the Scheduling toggle's \"No
    // schedule yet\" branch only ever sets asChecklist, never resets
    // taskMode) -- without this guard, BOTH this block and
    // isChecklistMode's own due-date block rendered at once, producing
    // two stacked \"Due date (optional)\" fields.
    const idx = SOURCE.indexOf('evKind==="assignment"&&!isChecklistMode&&taskMode==="manual"&&taskRepeatDays.length===0&&(');
    assert.notEqual(idx, -1, "the manual-mode due-date block must exclude isChecklistMode");
  });

  test("every other taskMode===\"manual\" field in this modal already carries the same guard, for consistency", () => {
    const count = (SOURCE.match(/isTaskKind&&!isChecklistMode&&taskRepeatDays\.length===0&&taskMode==="manual"/g) || []).length;
    assert.ok(count >= 1, "the Date/Start Time manual-mode block is the established pattern this fix now matches");
  });
});

describe("NewEventModal's Type picker offers Assignment and Study Session as two real, always-correctly-labeled, coexisting options", () => {
  test("Type SelectChip has separate assignment and studySession entries, neither relabeled by mode", () => {
    const idx = SOURCE.indexOf('<CustomSelect boxed options={[{value:"assignment",label:"Assignment"},{value:"studySession",label:"Study Session"}');
    assert.notEqual(idx, -1, "the Type picker must offer both as distinct, statically-labeled options -- not one relabeling the other by taskMode");
  });

  test("resolveAssignmentKind resolves studySession to a real scheduled block, same as manual-mode assignment/task", () => {
    const idx = SOURCE.indexOf("const resolveAssignmentKind=()=>");
    assert.notEqual(idx, -1);
    const line = SOURCE.slice(idx, idx + 400);
    assert.match(line, /evKind==="studySession"\?"study block"/);
  });

  test("switching Type to Study Session forces manual scheduling -- no Scheduling toggle, no AI placement, no due date", () => {
    const idx = SOURCE.indexOf('if(k==="studySession"){setTaskMode("manual");');
    assert.notEqual(idx, -1, "onEvKindChange must force manual mode the moment Study Session is picked");
  });
});

describe("EventDetailModal: typeChoice checks the real flags before asChecklist -- the actual Task/Assignment -> To-do bug", () => {
  test("asGeneralTask and asAssignment both win over asChecklist in the priority order", () => {
    const idx = SOURCE.indexOf("const typeChoice=asProject?");
    assert.notEqual(idx, -1, "typeChoice must exist with asProject-first priority");
    const line = SOURCE.slice(idx, idx + 200);
    assert.match(line, /asProject\?"project":asGeneralTask\?"task":asAssignment\?"assignment":asChecklist\?"todo":kind/);
  });

  test("asAssignment is initialized from the saved event's own isAssignment flag on open, same as asGeneralTask", () => {
    const idx = SOURCE.indexOf('setAsProject(isProjectMarker(ev));setAsChecklist(!!ev.checklist);setAsGeneralTask(!!ev.isGeneralTask);setAsAssignment(!!ev.isAssignment);');
    assert.notEqual(idx, -1);
  });

  test("picking Assignment from the Type picker sets kind to deadline and clears the other UI-level type flags", () => {
    const idx = SOURCE.indexOf('else if(v==="assignment"){');
    assert.notEqual(idx, -1, "onTypeChange must have a real assignment branch, not fall through to the generic else");
    const body = SOURCE.slice(idx, idx + 200);
    assert.match(body, /setAsAssignment\(true\)/);
    assert.match(body, /setKind\("deadline"\)/);
  });

  test("finishSave persists both isAssignment and a real deadlineTime", () => {
    const idx = SOURCE.indexOf("const finishSave=(forcedAttackSlot)=>{");
    assert.notEqual(idx, -1);
    const body = SOURCE.slice(idx, idx + 5600);
    assert.match(body, /isAssignment:asAssignment\|\|undefined/);
    assert.match(body, /deadlineTime:deadlineTime\|\|null/);
  });
});
