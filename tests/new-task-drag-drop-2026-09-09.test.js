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

  // 2026-09-16 user report: "the drag option does not work" -- the pill
  // was a native draggable element requiring one continuous gesture
  // starting INSIDE the modal (pick it up, the modal closes mid-drag,
  // carry it onto the calendar without releasing). Native HTML5
  // drag-and-drop is a confirmed reliability gap on real trackpads (see
  // architecture-native-dnd-trackpad-unreliable), and unmounting the drag
  // source mid-gesture (the modal closing) is its own separate way for a
  // native drag to silently die. Replaced with a two-step flow: a plain
  // click button that requires a title and adds a persistent chip to a
  // "To place" sidebar tray, which the student then drags onto the
  // calendar at their own pace using the same mousedown/mousemove/mouseup
  // idiom already proven reliable for the Schedule with Friends chip
  // (startGsChipDrag/gsChipPointToDayTime, reused directly here).
  test("both drag pills are now plain click buttons calling addDraftToDragTray, not native draggable elements", () => {
    assert.doesNotMatch(SOURCE, /draggable onDragStart=\{\(e\)=>\{\s*e\.dataTransfer\.setData\(NEW_TASK_DRAG_MIME/, "the old native-draggable pill should no longer exist");
    const matches = SOURCE.match(/<button type="button" onClick=\{addDraftToDragTray\}/g) || [];
    assert.equal(matches.length, 2, "both the task-kind and non-task-kind branches should use the new button");
  });

  test("addDraftToDragTray blocks with a real inline error on an empty title instead of silently defaulting to \"Untitled\"", () => {
    const idx = SOURCE.indexOf("const addDraftToDragTray=()=>{");
    assert.notEqual(idx, -1);
    const body = SOURCE.slice(idx, idx + 400);
    assert.match(body, /if\(!evTitle\.trim\(\)\)\{setEvTitleError\("Add a title first\."\);return;\}/);
    assert.match(body, /addUnplacedTaskDraft\(dragNewTaskPayload\(\)\)/);
  });

  test("dragNewTaskPayload no longer silently falls back to \"Untitled\" -- addDraftToDragTray's guard above is what prevents an empty title from reaching it now", () => {
    const idx = SOURCE.indexOf("const dragNewTaskPayload=()=>{");
    assert.notEqual(idx, -1);
    const body = SOURCE.slice(idx, idx + 1100);
    assert.doesNotMatch(body, /"Untitled"/);
    assert.match(body, /title:evTitle\.trim\(\),/);
  });

  test("Field's required/error props render the standard red-asterisk-plus-inline-error convention, and the Title field in New Task uses both", () => {
    const fieldIdx = SOURCE.indexOf("const Field = ({label, children, hint, required, error})");
    assert.notEqual(fieldIdx, -1);
    const fieldBody = SOURCE.slice(fieldIdx, fieldIdx + 500);
    assert.match(fieldBody, /required&&<span style=\{\{color:T\.red,marginLeft:3\}\}>\*<\/span>/);
    assert.match(fieldBody, /error\?<div style=\{\{fontSize:11,color:T\.red,marginTop:4\}\}>\{error\}<\/div>/);
    assert.match(SOURCE, /<Field label="Title" required error=\{evTitleError\}>/);
  });

  test("the new drag-chip tray uses the mousedown idiom, not native draggable, matching the proven-reliable Schedule-with-Friends fix", () => {
    const idx = SOURCE.indexOf("const startDraftChipDrag=(draft)=>(e)=>{");
    assert.notEqual(idx, -1);
    const body = SOURCE.slice(idx, idx + 2000);
    assert.match(body, /if\(e\.button!==0\)return;/);
    assert.match(body, /gsChipPointToDayTime\(ev\.clientX,ev\.clientY\)/, "reuses the same generic day/time hit-testing the GS chip fix already proved reliable");
    assert.match(body, /commitNewTaskDrop\(info\.draft,hit\.dateKey,hit\.startTime\)/);
    assert.match(body, /removeUnplacedTaskDraft\(info\.draft\.id\)/, "a placed chip must leave the tray, not linger as if it were still unplaced");
  });

  // 2026-09-16 user report: "when i drag it you cant see it move and drag
  // if that makes sense" -- the floating ghost label alone was too subtle
  // to register as movement. Added a real-time highlight on the calendar
  // day cell under the cursor (same data-daykey hit-testing
  // gsChipPointToDayTime already does) plus a grabbing cursor and a dimmed
  // source chip, all via direct DOM writes on mousemove/mousedown/mouseup
  // (not React state), matching this same block's existing convention.
  test("dragging a tray chip highlights the calendar day cell under the cursor in real time, and cleans the highlight up on drop/unmount", () => {
    const idx = SOURCE.indexOf("const startDraftChipDrag=(draft)=>(e)=>{");
    assert.notEqual(idx, -1);
    const body = SOURCE.slice(idx, idx + 2000);
    assert.match(body, /document\.body\.style\.cursor="grabbing";/, "cursor should visibly change to grabbing the moment the drag starts");
    assert.match(body, /document\.elementFromPoint\(ev\.clientX,ev\.clientY\)\?\.closest\("\[data-daykey\]"\)/, "hit-tests the day cell under the cursor on every move, same element gsChipPointToDayTime targets");
    assert.match(body, /dayEl\.style\.outline=`2px dashed \$\{T\.lime\}`/, "the hovered day cell gets a visible outline while dragging");
    assert.match(body, /clearHover\(\);/, "the previous highlight must be cleared before applying a new one, and on drop/unmount");
    assert.match(body, /document\.body\.style\.cursor="";/, "cursor resets back to normal once the drag ends");
  });

  test("the tray chip currently being dragged dims to 0.35 opacity so the pickup is visually obvious at the source, not just at the cursor", () => {
    const idx = SOURCE.indexOf('<div key={draft.id} onMouseDown={startDraftChipDrag(draft)}');
    assert.notEqual(idx, -1);
    const body = SOURCE.slice(idx, idx + 500);
    assert.match(body, /opacity:\(draftChipDragging&&draftChipDragRef\.current&&draftChipDragRef\.current\.draft\.id===draft\.id\)\?0\.35:1/);
  });

  test("unplacedTaskDrafts persists to localStorage under its own key, same convention every other piece of durable state in this file uses", () => {
    assert.match(SOURCE, /useState\(\(\)=>lsGet\("unplacedTaskDrafts",\[\]\)\)/);
    assert.match(SOURCE, /lsSet\("unplacedTaskDrafts",next\)/);
  });

  test("WeeklyPlanner's drop handler for NEW_TASK_DRAG_MIME still exists (generic drop-side infrastructure, unreachable via the new tray flow but left in place, not removed)", () => {
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
