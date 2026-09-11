// User report, 2026-09-10 (with a screenshot): "when i click dont know
// when drag onto calendar it doesnt do anything, fix this all throughout
// studlin... it needs to be so i can just drag it from left to anywhere
// and could move it if i want to."
//
// Root cause, confirmed by reading each view's own onDrop handler: the
// "Don't know exactly when? Drag onto the calendar" chip (New Task modal)
// and EventDetailModal's "+ Add my own time block" chip both use real
// HTML5 drag-and-drop (NEW_TASK_DRAG_MIME / MANUAL_BLOCK_DRAG_MIME) so the
// drag survives the modal closing and switching to the Calendar tab mid-
// drag. WeeklyPlanner's own handleDrop already checked both MIME types --
// Week view always worked. Month view's onDrop only ever checked
// sidebarDragChip/dragId, never either MIME type -- dropping either chip
// there did nothing. Day view (DayPlanner) had NO drag-and-drop wiring
// at all -- not these two MIME types, not sidebarDragChip, not even
// dragging an EXISTING day-view block to move it.
//
// Fixed: Month view's onDrop gained both MIME checks (defaulting to
// 09:00 -- a month cell has no per-time precision, same default its own
// sidebarDragChip branch already used). Day view gained the full set --
// sidebarDragChip, routine-occurrence dragging, moving an existing block
// (moveEvent, the same shared function Week/Month already trust for
// collision/deadline-wall handling), and both MIME types -- via a new
// Y-position-to-time calculation mirroring WeeklyPlanner's own.
//
// Also found and fixed in the same investigation: a THIRD, independent
// kind-resolution formula (dragNewTaskPayload's own resolvedKind, used
// only for this exact drag chip) still hardcoded kind:"study block" for
// an Assignment even after the 2026-09-10 write-side unification fixed
// resolveAssignmentKind -- exactly the kind of drift the unification was
// meant to prevent, just not caught until this second pass.
//
// Everything here is CalendarTab/DayPlanner component-closure code, not
// exported pure functions -- source-level regression guards, same
// established precedent as friend-request-notification-badge.test.js.
// Run with `npm test`.
const { test, describe } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");

const SOURCE = fs.readFileSync(path.join(__dirname, "..", "studlin-app.jsx"), "utf8");

describe("Month view's onDrop now handles both MIME-based drag chips (source-level regression guard)", () => {
  test("MANUAL_BLOCK_DRAG_MIME and NEW_TASK_DRAG_MIME are both checked, defaulting to 09:00 (no per-time precision in a month cell)", () => {
    const marker = 'onDragOver={e=>e.preventDefault()} onDrop={e=>{';
    const idx = SOURCE.indexOf(marker);
    assert.notEqual(idx, -1);
    const body = SOURCE.slice(idx, idx + 1900);
    assert.match(body, /e\.dataTransfer&&e\.dataTransfer\.getData\(MANUAL_BLOCK_DRAG_MIME\)&&commitManualBlockDrop/);
    assert.match(body, /commitManualBlockDrop\(payload,c\.key,"09:00"\);/);
    assert.match(body, /e\.dataTransfer&&e\.dataTransfer\.getData\(NEW_TASK_DRAG_MIME\)&&commitNewTaskDrop/);
    assert.match(body, /commitNewTaskDrop\(payload,c\.key,"09:00"\);/);
  });

  test("sidebarDragChip and dragId (existing-event move) still work exactly as before -- this is additive, not a rewrite", () => {
    const idx = SOURCE.indexOf('onDragOver={e=>e.preventDefault()} onDrop={e=>{');
    const body = SOURCE.slice(idx, idx + 400);
    assert.match(body, /if\(sidebarDragChip\)\{openNewEventForDrop\(sidebarDragChip,c\.key,"09:00"/);
    assert.match(body, /else if\(dragId\)\{moveEvent\(dragId,c\.key\);setDragId\(null\);\}/);
  });
});

describe("Day view (DayPlanner) gains full drag-and-drop from scratch (source-level regression guards)", () => {
  test("accepts the same drag-related props CalendarTab already threads into WeeklyPlanner", () => {
    // 2026-09-11: DayPlanner's signature grew quickCreateDraft/
    // onQuickCreateDrag/onQuickCreateDragEnd (the drag-to-create-a-task
    // feature) -- matched as a prefix here rather than re-encoding the
    // full, now-longer parameter list, so a future additive prop doesn't
    // require touching this same assertion again.
    assert.match(SOURCE, /function DayPlanner\(\{dayEvents, setEvents, selDay, todayK, colorOf, fmtTime, fmtTimeRange, openEdit, markDone, uncrossDone, prefs, setSelDay, catchUpPending, openNew, newItemHighlightIds, onEditRoutine, moveEvent, sidebarDragChip, onDropSidebarChip, onDropManualBlockRequest, onDropNewTaskRequest, onDropRoutineOccurrence, onRoutineDragStateChange/);
  });

  test("CalendarTab wires moveEvent/sidebarDragChip/both MIME handlers/routine-occurrence dragging into DayPlanner, same shared functions Week/Month already trust", () => {
    const idx = SOURCE.indexOf("{calView===\"daily\"&&(");
    assert.notEqual(idx, -1);
    const body = SOURCE.slice(idx, idx + 900);
    assert.match(body, /moveEvent=\{moveEvent\}/);
    assert.match(body, /sidebarDragChip=\{sidebarDragChip\}/);
    assert.match(body, /onDropManualBlockRequest=\{commitManualBlockDrop\}/);
    assert.match(body, /onDropNewTaskRequest=\{commitNewTaskDrop\}/);
    assert.match(body, /onDropRoutineOccurrence=\{onDropRoutineOccurrence\}/);
  });

  test("timeFromDragY computes a real time from cursor position against the timeline's own rect, snapped to 15-minute increments (same shape as WeeklyPlanner's handleDragOver)", () => {
    assert.match(SOURCE, /const timeFromDragY=\(e\)=>\{/);
    assert.match(SOURCE, /const rect=el\.getBoundingClientRect\(\);/);
    assert.match(SOURCE, /const snappedMins=Math\.min\(45,Math\.round\(rawMins\/15\)\*15\);/);
  });

  test("handleDayDrop checks sidebarDragChip, routine-occurrence, existing-event move, and both MIME types, in that priority order", () => {
    const idx = SOURCE.indexOf("const handleDayDrop=(e)=>{");
    assert.notEqual(idx, -1);
    const body = SOURCE.slice(idx, idx + 1400);
    assert.match(body, /if\(sidebarDragChip&&onDropSidebarChip\)\{/);
    assert.match(body, /\}else if\(dayDragRoutineOccurrence&&onDropRoutineOccurrence\)\{/);
    assert.match(body, /\}else if\(dayDragId&&moveEvent\)\{/);
    assert.match(body, /e\.dataTransfer&&e\.dataTransfer\.getData\(MANUAL_BLOCK_DRAG_MIME\)&&onDropManualBlockRequest/);
    assert.match(body, /e\.dataTransfer&&e\.dataTransfer\.getData\(NEW_TASK_DRAG_MIME\)&&onDropNewTaskRequest/);
  });

  test("every existing day-view block is draggable to move it (not just brand-new drops) -- routine occurrences go through the same routine-drag state Week view uses, real events through dayDragId", () => {
    const idx = SOURCE.indexOf("onDragStart={()=>{ if(!ev.isRoutine){setDayDragId(ev.id);}");
    assert.notEqual(idx, -1, "existing blocks in Day view must be draggable, mirroring WeeklyPlanner's own onDragStart branch");
  });

  test("the timeline container is wired with onDragOver/onDrop/onDragLeave so dropping is possible anywhere on the day, not just on existing blocks", () => {
    // 2026-09-11: this element gained data-gridbg/onMouseDown (drag-to-
    // create a task) between ref and onDragOver -- checked individually so
    // that additive change doesn't require re-encoding the exact
    // attribute order here again.
    assert.match(SOURCE, /ref=\{timelineRef\}/);
    assert.match(SOURCE, /onDragOver=\{handleDayDragOver\} onDrop=\{handleDayDrop\} onDragLeave=\{\(\)=>setDayDragOver\(false\)\}/);
  });

  test("a cancelled drag (dropped outside a valid target) resets all drag state via onDragEnd, so the preview line never gets stuck", () => {
    assert.match(SOURCE, /const handleDayDragEnd=\(\)=>\{setDayDragId\(null\);setDayDragRoutineOccurrence\(null\);setDayDragOver\(false\);setDayDropTime\(null\);/);
    assert.match(SOURCE, /onDragEnd=\{handleDayDragEnd\}/);
  });
});

describe("dragNewTaskPayload now matches resolveAssignmentKind's write-side unification (source-level regression guard -- a real drift bug found in this same investigation)", () => {
  test("Assignment resolves to kind:deadline here too, not the old kind:\"study block\" this drag chip's own separate formula still used", () => {
    assert.match(SOURCE, /const resolvedKind=evKind==="assignment"\?"deadline":\(\(evKind==="task"\|\|evKind==="studySession"\)\?"study block":evKind\);/);
  });
});
