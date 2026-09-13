// User report, 2026-09-13: after fixing the busyWindows republish gap,
// Schedule with Friends' "Drag onto an open slot" step still didn't work --
// clicking and holding the Meeting/Study Session chip did nothing at all.
// Root cause: those chips used native HTML5 `draggable`/onDragStart, which
// depends on the browser recognizing a genuine OS-level drag gesture --
// something plenty of trackpads (this user's included) never reliably
// trigger, unlike a plain mousedown. WeeklyPlanner/DayPlanner already have
// their own proven-reliable drag idiom (document-level mousedown/mousemove/
// mouseup -- see previewDragRef/createDragRef), so the chip drag was
// rewritten to use the same pattern instead of native DnD, resolving the
// day/time cell under the cursor via elementFromPoint + a data-daykey
// attribute rather than reaching into either grid component's internal
// refs.
//
// Source-level regression guards (component-closure UI), same convention
// as the other Schedule with Friends test files. Run with `npm test`.
const { test, describe } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");

const SOURCE = fs.readFileSync(path.join(__dirname, "..", "studlin-app.jsx"), "utf8");

describe("Schedule with Friends chip drag no longer depends on native HTML5 drag-and-drop", () => {
  test("the Meeting and Study Session chips are not native draggable elements", () => {
    const meetingIdx = SOURCE.indexOf('title:"Meeting",kind:"groupSession"');
    assert.notEqual(meetingIdx, -1);
    const meetingLine = SOURCE.slice(meetingIdx - 300, meetingIdx + 50);
    assert.doesNotMatch(meetingLine, /\bdraggable\b/, "the chip should no longer rely on the native draggable attribute");
    assert.doesNotMatch(meetingLine, /onDragStart=/, "chip drag now starts on mousedown, not a native dragstart");
  });

  test("gsChipPointToDayTime resolves the cell under the cursor via elementFromPoint + data-daykey", () => {
    const idx = SOURCE.indexOf("const gsChipPointToDayTime=(x,y)=>{");
    assert.notEqual(idx, -1);
    const body = SOURCE.slice(idx, idx + 500);
    assert.match(body, /document\.elementFromPoint\(x,y\)/);
    assert.match(body, /closest\('\[data-daykey\]'\)/);
  });

  test("WeeklyPlanner's day column carries a data-daykey attribute matching its own date key", () => {
    const idx = SOURCE.indexOf('ref={el => { wkColRefs.current[dk] = el; }}');
    assert.notEqual(idx, -1);
    const body = SOURCE.slice(idx, idx + 200);
    assert.match(body, /data-daykey=\{dk\}/);
  });

  test("DayPlanner's single-day timeline carries a data-daykey attribute matching the selected day", () => {
    const idx = SOURCE.indexOf("ref={timelineRef} data-gridbg=\"1\"");
    assert.notEqual(idx, -1);
    const body = SOURCE.slice(idx, idx + 100);
    assert.match(body, /data-daykey=\{selDay\}/);
  });

  test("the drag keeps the block's duration fixed while moving, only fixing it on first placement", () => {
    const anchorIdx = SOURCE.indexOf("if(info.duration==null){");
    assert.notEqual(anchorIdx, -1);
    const body = SOURCE.slice(anchorIdx, anchorIdx + 400);
    assert.match(body, /placeGroupScheduleChip\(info\.chip,hit\.dateKey,hit\.startTime\)/);
    assert.match(body, /gsPreviewMove\(hit\.dateKey,hit\.startTime,minutesToTime/);
  });
});
