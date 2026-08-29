// Regression test for the 2026-08-28 Fixed/Free label-confusion fix.
//
// User report: NewEventModal's "is this event fixed or free" control was a
// single on/off toggle whose own label swapped text with its state --
// "Fixed" while OFF, "Free" while ON. Users read the OFF+"Fixed" pairing as
// "flip this on to make it Fixed" -- backwards from what OFF already meant
// (movable defaults to false, i.e. Fixed by default). Replaced the toggle
// with two selectable chips (reusing the existing SelectChip component,
// same one already used for this modal's own Type/Subject fields) so the
// current choice is shown by which chip is highlighted, with no on/off
// state to misread.
//
// NewEventModal is a component closure, so this is a source-level
// regression guard -- same established precedent as every other
// component-closure fix this session. Run with `npm test`.
const { test, describe } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");

const SOURCE = fs.readFileSync(path.join(__dirname, "..", "studlin-app.jsx"), "utf8");

describe("NewEventModal: Fixed/Free is two selectable chips, not an on/off toggle with a swapping label", () => {
  test("the old swapping-label toggle div is gone", () => {
    assert.doesNotMatch(SOURCE, /\{movable\?"Free":"Fixed"\}/, "the old label that read 'Fixed' while the toggle was OFF must not remain");
  });

  test("a SelectChip with both Fixed and Free as their own always-visible options replaces it", () => {
    assert.match(SOURCE, /<SelectChip size="sm" options=\{\[\{value:false,label:"Fixed \(won't move\)"\},\{value:true,label:"Free \(can move\)"\}\]\} value=\{movable\} onChange=\{setMovable\}\s*\/>/);
  });

  test("movable still defaults to false (Fixed), unchanged default behavior for every existing event", () => {
    assert.match(SOURCE, /const \[movable,setMovable\]=useState\(false\);/);
  });
});
