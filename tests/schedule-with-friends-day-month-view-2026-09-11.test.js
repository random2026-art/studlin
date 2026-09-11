// Full-feature audit, 2026-09-11 ("Schedule with Friends doesn't work"):
// found that the entire "place" step -- busy overlay, the recommended-time
// ghost block, and the draggable draft the student places -- was wired
// into WeeklyPlanner ONLY. calView is a persisted per-device setting
// (defaults to "weekly" but sticks once changed), so any student on Day or
// Month view got a drag that silently updated internal state
// (CalendarTab's gsDraft) with nothing ever rendered to confirm it --
// indistinguishable from the drag doing nothing at all.
//
// All of this is component-closure UI (DayPlanner/CalendarTab), so these
// are source-level regression guards, same convention this file already
// uses elsewhere. Run with `npm test`.
const { test, describe } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");

const SOURCE = fs.readFileSync(path.join(__dirname, "..", "studlin-app.jsx"), "utf8");

describe("DayPlanner now receives and renders Schedule with Friends' gsDraft/busy overlay", () => {
  test("DayPlanner's signature accepts the new gs props", () => {
    const idx = SOURCE.indexOf("function DayPlanner(");
    assert.ok(idx > -1);
    const sig = SOURCE.slice(idx, idx + 700);
    assert.ok(sig.includes("gsBusyByDate"));
    assert.ok(sig.includes("gsRecommended"));
    assert.ok(sig.includes("gsDraft"));
    assert.ok(sig.includes("onGsPreviewMove"));
    assert.ok(sig.includes("onGsPreviewResize"));
  });

  test("DayPlanner renders the busy overlay from gsBusyByDate merged with its own occupied intervals", () => {
    const idx = SOURCE.indexOf("function DayPlanner(");
    const body = SOURCE.slice(idx, idx + 30000);
    const overlayIdx = body.indexOf("gsBusyByDate&&(gsBusyByDate[selDay]||[]).concat(getDayOccupiedIntervals(selDay))");
    assert.ok(overlayIdx > -1, "must merge friends' busy time with this day's own occupied intervals, same as WeeklyPlanner");
  });

  test("DayPlanner renders the recommended-time ghost block for the currently selected day", () => {
    const idx = SOURCE.indexOf("function DayPlanner(");
    const body = SOURCE.slice(idx, idx + 30000);
    assert.ok(body.includes('gsRecommended&&gsRecommended.date===selDay'));
    assert.ok(body.includes("STUDLIN RECOMMENDS"));
  });

  test("DayPlanner renders gsDraft as a real, visible, draggable block -- not just silently updating state", () => {
    const idx = SOURCE.indexOf("function DayPlanner(");
    const body = SOURCE.slice(idx, idx + 30000);
    const draftIdx = body.indexOf('gsDraft&&gsDraft.date===selDay');
    assert.ok(draftIdx > -1);
    const draftBody = body.slice(draftIdx, draftIdx + 1800);
    assert.ok(draftBody.includes("onMouseDown={startMove}"), "must be movable, not a static confirmation only");
    assert.ok(draftBody.includes("onGsPreviewResize"), "must support the same resize handle WeeklyPlanner's draft block has");
  });

  test("gsDraft move/resize state is scoped per-day (no cross-day search) -- Day view can only change time, never date", () => {
    const idx = SOURCE.indexOf("const gsDraftDragRef=useRef(null);");
    assert.ok(idx > -1);
    const body = SOURCE.slice(idx, idx + 1600);
    assert.ok(body.includes("onGsPreviewMove(selDay,"), "a move in Day view must always resolve back onto the day currently open, never a different date");
  });
});

describe("CalendarTab wires the new gs props into DayPlanner, scoped to the 'place' step only", () => {
  test("DayPlanner's render call passes gsBusyByDate/gsRecommended/gsDraft/onGsPreviewMove/onGsPreviewResize", () => {
    const idx = SOURCE.indexOf('{calView==="daily"&&(');
    assert.ok(idx > -1);
    const body = SOURCE.slice(idx, idx + 1400);
    assert.ok(body.includes('gsBusyByDate={gsOpen&&gsStep==="place"?gsBusyByDate:null}'));
    assert.ok(body.includes('gsRecommended={gsOpen&&gsStep==="place"?gsRecommended:null}'));
    assert.ok(body.includes('gsDraft={gsOpen&&gsStep==="place"?gsDraft:null}'));
    assert.ok(body.includes('onGsPreviewMove={gsOpen&&gsStep==="place"?gsPreviewMove:undefined}'));
    assert.ok(body.includes('onGsPreviewResize={gsOpen&&gsStep==="place"?gsPreviewResize:undefined}'));
  });
});

describe("Month view no longer silently commits a Schedule with Friends proposal at a hardcoded 9:00 AM", () => {
  test("dropping a groupSession chip on a month cell redirects to Day/Week instead of placing it", () => {
    const idx = SOURCE.indexOf('onDragOver={e=>e.preventDefault()} onDrop={e=>{');
    assert.ok(idx > -1);
    const body = SOURCE.slice(idx, idx + 1400);
    const guardIdx = body.indexOf('sidebarDragChip&&sidebarDragChip.kind==="groupSession"');
    assert.ok(guardIdx > -1, "must special-case a groupSession chip before the generic 09:00 placement branch");
    const guardBody = body.slice(guardIdx, guardIdx + 300);
    assert.ok(guardBody.includes("Switch to Day or Week view"));
    assert.ok(guardBody.includes("setSidebarDragChip(null)"), "must still clear the drag state so it doesn't get stuck armed");
    // The generic placement branch must come AFTER the groupSession guard,
    // not before it (order matters -- an earlier plain `if(sidebarDragChip)`
    // would shadow the more specific check and this fix would never run).
    const genericIdx = body.indexOf('else if(sidebarDragChip){openNewEventForDrop');
    assert.ok(genericIdx > guardIdx, "the groupSession guard must be checked before the generic drop branch");
  });
});
