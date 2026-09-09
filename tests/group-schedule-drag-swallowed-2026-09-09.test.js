// Schedule with Friends follow-up (2026-09-09 user report + screenshot):
// "the drag onto calendar doesn't work" -- the floating "place it" panel is
// position:fixed at the bottom of the screen and visually covers a real
// chunk of the calendar (evening slots especially), the exact same failure
// mode already documented and fixed once before for EventDetailModal's own
// "+Add my own time block" drag ("the modal's own backdrop would otherwise
// sit on top of the grid and swallow the drop" -- see MANUAL_BLOCK_DRAG_MIME's
// comment). That fix closed the whole modal on dragstart since it was a
// one-shot action; this panel has to stay open and usable AFTER the drop
// (to preview/resize/click Done), so it can't just unmount. Instead it goes
// pointer-events:none for the duration of the drag so a drop landing on the
// panel's own footprint passes through to the calendar cell underneath.
//
// Separately: the Done button looked identically clickable whether gsDraft
// was set or not (Btn's disabled state only changes cursor, not the solid
// lime fill), so "I keep hitting Done" and nothing happening had no visible
// explanation. Dimmed specifically for this button.
//
// Source-level regression guards (component-closure UI) -- same
// mixed-coverage convention this session uses elsewhere. Run with `npm test`.
const { test, describe } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");

const SOURCE = fs.readFileSync(path.join(__dirname, "..", "studlin-app.jsx"), "utf8");

describe("Schedule with Friends 'place it' panel lets drops pass through to the calendar during a drag", () => {
  test("the floating panel goes pointer-events:none (and dims) while a chip drag is in flight", () => {
    const idx = SOURCE.indexOf("{gsOpen&&gsStep===\"place\"&&(");
    assert.notEqual(idx, -1);
    const body = SOURCE.slice(idx, idx + 400);
    assert.match(body, /pointerEvents:gsChipDragging\?"none":"auto"/);
  });

  test("both the Meeting and Study Session chips set gsChipDragging true on dragstart and clear it on dragend", () => {
    const meetingIdx = SOURCE.indexOf('title:"Meeting",kind:"groupSession"');
    assert.notEqual(meetingIdx, -1);
    const meetingBody = SOURCE.slice(meetingIdx - 200, meetingIdx + 200);
    assert.match(meetingBody, /setGsChipDragging\(true\)/);
    assert.match(meetingBody, /setGsChipDragging\(false\)/);

    const studyIdx = SOURCE.indexOf('title:"Study Session",kind:"groupSession"');
    assert.notEqual(studyIdx, -1);
    const studyBody = SOURCE.slice(studyIdx - 200, studyIdx + 200);
    assert.match(studyBody, /setGsChipDragging\(true\)/);
    assert.match(studyBody, /setGsChipDragging\(false\)/);
  });

  test("closing the flow also resets gsChipDragging so a cancelled drag never leaves the panel permanently inert", () => {
    const idx = SOURCE.indexOf("const closeGroupSchedule=()=>{");
    assert.notEqual(idx, -1);
    const body = SOURCE.slice(idx, idx + 150);
    assert.match(body, /setGsChipDragging\(false\)/);
  });
});

describe("Schedule with Friends Done button visibly looks disabled until something is actually placed", () => {
  test("Done dims when gsDraft is null or a send is already in flight, not just a cursor change", () => {
    const idx = SOURCE.indexOf("<Btn onClick={postGroupSchedule}");
    assert.notEqual(idx, -1);
    const body = SOURCE.slice(idx, idx + 250);
    assert.match(body, /disabled=\{!gsDraft\|\|gsSending\}/);
    assert.match(body, /opacity:0\.45/);
  });

  test("Btn forwards a title attribute so a disabled button can explain itself", () => {
    const idx = SOURCE.indexOf("const Btn = (");
    assert.notEqual(idx, -1);
    const body = SOURCE.slice(idx, idx + 700);
    assert.match(body, /title/);
  });
});
