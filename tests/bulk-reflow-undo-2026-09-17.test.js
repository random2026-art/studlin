// Internal audit finding, 2026-09-17: "Bulk pause-plan actions
// (shift/clear_day/clear_week) have preview+confirm but no undo after
// committing -- unlike single-event deletes. confirmPausePlan writes the
// whole batch straight to events/routineSkips and shows a plain success
// toast, with no deleteEventWithUndo-style rollback affordance. shift can
// move everything from today onward by up to 14 days in one action. If
// the reslotting result is bad, the user's only recovery is manually
// fixing each displaced item one at a time. The blast radius here is much
// larger than the single-item deletes that DO get undo -- the safety net
// was inverted relative to the risk."
//
// Same finding applies to confirmWeekBalance ("Balance my week"), which
// shares the exact same preview-then-commit-with-no-undo shape. Both now
// share one bulkReflowUndoSnapshot/bulkReflowUndoToast pair (same
// component, mutually exclusive in time, same snapshot+toast+5s-window
// convention deleteEventWithUndo/undoDelete already established).
//
// Source-level regression guards -- component-closure UI, same
// mixed-coverage convention this file's other Calendar features use.
const { test, describe } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");

const SOURCE = fs.readFileSync(path.join(__dirname, "..", "studlin-app.jsx"), "utf8");

describe("bulkReflowUndoSnapshot/undoBulkReflow: shared undo for both bulk-reflow commit points", () => {
  test("undoBulkReflow restores both events and routineSkips (when the snapshot carries them), then clears itself", () => {
    const idx = SOURCE.indexOf("const undoBulkReflow=()=>{");
    assert.notEqual(idx, -1);
    const body = SOURCE.slice(idx, idx + 500);
    assert.match(body, /setEvents\(prevEvents\);lsSet\("events",prevEvents\);/);
    assert.match(body, /if\(prevRoutineSkips\)lsSet\("routineSkips",prevRoutineSkips\);/);
    assert.match(body, /setBulkReflowUndoSnapshot\(null\);setBulkReflowUndoToast\(""\);/);
  });

  test("confirmWeekBalance snapshots the pre-commit events before overwriting them, with an undo-capable toast (not the old fire-and-forget one)", () => {
    const idx = SOURCE.indexOf("const confirmWeekBalance=()=>{");
    assert.notEqual(idx, -1);
    const body = SOURCE.slice(idx, idx + 800);
    assert.match(body, /setBulkReflowUndoSnapshot\(\{prevEvents:all,prevRoutineSkips:null\}\);/);
    assert.match(body, /setTimeout\(\(\)=>\{setBulkReflowUndoToast\(""\);setBulkReflowUndoSnapshot\(null\);\},5000\);/);
  });

  test("confirmPausePlan captures routineSkips BEFORE any of its own mutations, since two separate branches (routineMoves, skipRoutine) can each touch it in the same commit", () => {
    const idx = SOURCE.indexOf("const confirmPausePlan=()=>{");
    assert.notEqual(idx, -1);
    const body = SOURCE.slice(idx, idx + 300);
    assert.match(body, /const originalRoutineSkips=getRoutineSkips\(\);/, "must be captured at the very top, before routineMoves/skipRoutine branches run");
  });

  test("confirmPausePlan's undo snapshot only carries routineSkips when a branch that actually changes them ran this time", () => {
    const idx = SOURCE.indexOf("const confirmPausePlan=()=>{");
    const body = SOURCE.slice(idx, idx + 3400);
    assert.match(body, /const routineSkipsChanged=routineMoves\.length>0\|\|!!pausePreview\.skipRoutine;/);
    assert.match(body, /setBulkReflowUndoSnapshot\(\{prevEvents:all,prevRoutineSkips:routineSkipsChanged\?originalRoutineSkips:null\}\);/);
  });

  test("the old fire-and-forget generic toast (setToast(true) for pause-plan, the standalone weekBalanceToast state for week-balance) is gone -- both routes now go through the undo-capable toast", () => {
    const idx = SOURCE.indexOf("const confirmPausePlan=()=>{");
    const body = SOURCE.slice(idx, idx + 3400);
    assert.doesNotMatch(body, /setToast\(true\);setTimeout\(\(\)=>setToast\(false\)/, "confirmPausePlan must no longer use the plain boolean toast");
    assert.doesNotMatch(SOURCE, /const \[weekBalanceToast,setWeekBalanceToast\]=useState\(""\);/, "the old single-purpose weekBalanceToast state should be fully retired, not left dangling alongside the new shared one");
  });

  test("the undo toast renders with a real Undo button wired to undoBulkReflow, same convention as deleteUndoToast/undoDelete", () => {
    const idx = SOURCE.indexOf("{bulkReflowUndoToast&&(");
    assert.notEqual(idx, -1);
    const body = SOURCE.slice(idx, idx + 400);
    assert.match(body, /<button onClick=\{undoBulkReflow\}/);
    assert.match(body, />Undo<\/button>/);
  });
});
