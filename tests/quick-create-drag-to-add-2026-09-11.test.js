// User request, 2026-09-11: "you can hold and drag on a calendar in a day
// and it expand a new event maybe it defaults to task ... maybe we should
// have the editing not be full screen but next to it" (Google Calendar's
// press-empty-slot-drag-down-to-set-duration quick-create).
//
// Scoped to Week/Day views (Month has no time axis, so "drag to expand
// duration" has nothing to measure against there -- it keeps its existing
// click-to-add). Reuses NewEventModal's own anchored-popover positioning
// convention (POPOVER_WIDTH/anchorX/anchorY math) but as a new, much
// smaller QuickCreateTaskPopover -- NewEventModal itself is routine/
// activity-oriented (repeat days, commute, location...), none of which
// applies to a plain one-off task.
//
// snapToQuarterHour/computeQuickCreateRange are real, pure, top-level
// functions shared by WeeklyPlanner's and DayPlanner's own create-drag
// handlers -- unit tested directly. Everything else (the mousedown/
// mousemove wiring, the popover component, the commit shape) is component-
// closure UI, so those are source-level regression guards, same mixed-
// coverage convention this session has used throughout. Run with `npm test`.
const { test, describe } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");
const { loadStudlinModule } = require("./harness.js");

const SOURCE = fs.readFileSync(path.join(__dirname, "..", "studlin-app.jsx"), "utf8");

describe("snapToQuarterHour: clamps to a real day and snaps to 15-minute increments", () => {
  test("snaps down to the nearest quarter hour", () => {
    const { snapToQuarterHour } = loadStudlinModule({ now: "2026-09-11T09:00:00" });
    assert.equal(snapToQuarterHour(127), 120);
  });
  test("snaps up to the nearest quarter hour", () => {
    const { snapToQuarterHour } = loadStudlinModule({ now: "2026-09-11T09:00:00" });
    assert.equal(snapToQuarterHour(128), 135);
  });
  test("never goes below 0 (a drag that starts above the timeline's top edge)", () => {
    const { snapToQuarterHour } = loadStudlinModule({ now: "2026-09-11T09:00:00" });
    assert.equal(snapToQuarterHour(-40), 0);
  });
  test("never exceeds 1439 (a drag past midnight stays on the same day)", () => {
    const { snapToQuarterHour } = loadStudlinModule({ now: "2026-09-11T09:00:00" });
    assert.equal(snapToQuarterHour(3000), 1439);
  });
});

describe("computeQuickCreateRange: the live ghost block while dragging", () => {
  test("dragging downward extends the end time, start stays anchored", () => {
    const { computeQuickCreateRange } = loadStudlinModule({ now: "2026-09-11T09:00:00" });
    const r = computeQuickCreateRange(9 * 60, 10 * 60);
    assert.equal(r.startTime, "09:00");
    assert.equal(r.endTime, "10:00");
  });
  test("dragging upward past the anchor flips start/end so start is always earlier", () => {
    const { computeQuickCreateRange } = loadStudlinModule({ now: "2026-09-11T09:00:00" });
    const r = computeQuickCreateRange(10 * 60, 9 * 60);
    assert.equal(r.startTime, "09:00");
    assert.equal(r.endTime, "10:00", "the anchor becomes the end when dragging upward past it");
  });
  test("a drag that barely moves still gets a real minimum 15-minute duration", () => {
    const { computeQuickCreateRange } = loadStudlinModule({ now: "2026-09-11T09:00:00" });
    const r = computeQuickCreateRange(9 * 60, 9 * 60);
    assert.equal(r.startTime, "09:00");
    assert.equal(r.endTime, "09:15", "no drag movement at all should never collapse to a zero-length block");
  });
});

describe("Source-level regression guards: create-drag wiring exists in both Week and Day views", () => {
  test("WeeklyPlanner's grid background is marked for hit-testing and wired to startCreateDrag", () => {
    const idx = SOURCE.indexOf("function WeeklyPlanner(");
    assert.ok(idx > -1, "WeeklyPlanner should still exist");
    const slice = SOURCE.slice(idx, idx + 50000);
    assert.ok(slice.includes('data-gridbg="1"'), "the day column and hour-line divs must be marked so startCreateDrag can tell empty background from a real event block");
    assert.ok(slice.includes("onMouseDown={e=>startCreateDrag(e,dk)}"), "the day column must start a create-drag on mousedown");
    assert.ok(slice.includes('e.target.dataset&&e.target.dataset.gridbg==="1"'), "startCreateDrag must refuse to start over anything that isn't marked background (an existing event block, the New Event preview, a busy overlay)");
  });

  test("DayPlanner's timeline is marked for hit-testing and wired to startCreateDrag", () => {
    const idx = SOURCE.indexOf("function DayPlanner(");
    assert.ok(idx > -1, "DayPlanner should still exist");
    const slice = SOURCE.slice(idx, idx + 20000);
    assert.ok(slice.includes('data-gridbg="1"'), "the timeline container and hour-line divs must be marked so startCreateDrag can tell empty background from a real event block");
    assert.ok(slice.includes("onMouseDown={startCreateDrag}"), "the timeline must start a create-drag on mousedown");
  });

  test("both views render a dashed ghost block driven by the shared quickCreateDraft prop", () => {
    const weekIdx = SOURCE.indexOf("function WeeklyPlanner(");
    const weekSlice = SOURCE.slice(weekIdx, weekIdx + 50000);
    assert.ok(weekSlice.includes("quickCreateDraft && quickCreateDraft.dateKey===dk"), "Week view's ghost block must match against the column it's rendering");

    const dayIdx = SOURCE.indexOf("function DayPlanner(");
    const daySlice = SOURCE.slice(dayIdx, dayIdx + 20000);
    assert.ok(daySlice.includes("quickCreateDraft && quickCreateDraft.dateKey===selDay"), "Day view's ghost block must match against the currently-selected day");
  });
});

describe("Source-level regression guards: QuickCreateTaskPopover + commit shape", () => {
  test("the popover is a small anchored side panel (not NewEventModal, not full-screen), defaults to a plain task, and offers More options", () => {
    const idx = SOURCE.indexOf("function QuickCreateTaskPopover(");
    assert.ok(idx > -1, "QuickCreateTaskPopover should exist as its own component");
    const slice = SOURCE.slice(idx, idx + 3000);
    assert.ok(slice.includes("anchorX!=null?anchorX"), "must anchor beside the drop point, same convention as NewEventModal's own anchored popover");
    assert.ok(slice.includes("Add a title"), "should be a lightweight title-only quick-create, not the full routine/activity form");
    assert.ok(slice.includes("More options"), "must offer a path to the full Add Task flow for anything needing AI arrange/subject/Attack Block");
  });

  test("commitQuickCreateTask commits a real task: kind study block, isGeneralTask true, userPinned true", () => {
    const idx = SOURCE.indexOf("const commitQuickCreateTask=");
    assert.ok(idx > -1, "commitQuickCreateTask should exist in CalendarTab");
    const slice = SOURCE.slice(idx, idx + 900);
    assert.ok(slice.includes('kind:"study block"'), "a quick-created item must be a real task, matching the existing study-block task shape");
    assert.ok(slice.includes("isGeneralTask:true"), "must be stamped as a plain Task (not an assignment/exam), same marker Add Task's own Task mode uses");
    assert.ok(slice.includes("userPinned:true"), "the user directly picked this exact time by dragging -- it must not be silently reshuffled by Tier 0/rebalance later");
  });

  test("More options hands off to the real Add Task flow with the same date, not a dead link", () => {
    const idx = SOURCE.indexOf("const quickCreateMoreOptions=");
    assert.ok(idx > -1, "quickCreateMoreOptions should exist in CalendarTab");
    const slice = SOURCE.slice(idx, idx + 300);
    assert.ok(slice.includes("openNew(draft.dateKey)"), "must open the real Add Task modal pre-seeded with the dragged date");
  });
});
