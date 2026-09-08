// Regression tests for a 2026-09-07 user report: "went to routine to add
// gym but first off couldnt change color and also it didnt show up on
// calander and studlin needs to let user know where it adds them."
//
// Root cause: ColorSelect's own popover portal used the OLD z-index scheme
// (998/999) -- the exact same bug already found and fixed for CustomSelect
// on 2026-09-04 (bumped to 1998/1999 there, see its own comment), just
// never applied here. Modal's own backdrop sits at zIndex:1000, so any
// ColorSelect opened from inside a Modal (RoutineControlCenterModal's own
// Add Activity form included) had its swatch clicks land on the Modal's
// backdrop underneath instead of the swatch -- explaining both "couldn't
// change color" and, very plausibly, "didn't show up on calendar" (the Add
// flow silently interrupted before Days/Time/Add were ever reached).
//
// Second, separate fix: submitAdd used to close the form and return to the
// list with zero confirmation of what happened -- whether the new
// Activity landed on the calendar with a real schedule, or (a fully
// legitimate, common path -- "Optional -- skip this and drag it onto your
// calendar") saved with no schedule at all. Now shows an inline banner
// naming exactly which happened.
//
// RoutineControlCenterModal is a component closure, so these are
// source-level regression guards, same established precedent as every
// other component-closure fix this session. Run with `npm test`.
const { test, describe } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");

const SOURCE = fs.readFileSync(path.join(__dirname, "..", "studlin-app.jsx"), "utf8");

describe("ColorSelect: popover z-index clears Modal's own backdrop (zIndex:1000)", () => {
  test("ColorSelect's own click-outside catcher and popover are bumped to 1998/1999, matching CustomSelect's already-fixed scheme", () => {
    const idx = SOURCE.indexOf("const ColorSelect=({value,onChange})=>{");
    assert.notEqual(idx, -1, "ColorSelect must exist");
    const body = SOURCE.slice(idx, idx + 3000);
    assert.match(body, /zIndex:1998/, "the click-outside catcher must clear Modal's zIndex:1000");
    assert.match(body, /zIndex:1999/, "the popover itself must clear Modal's zIndex:1000");
    // The old, buggy values must be gone from this component, not just
    // duplicated alongside new ones.
    assert.doesNotMatch(body, /zIndex:998\b/, "the stale pre-fix z-index must not remain in ColorSelect");
    assert.doesNotMatch(body, /zIndex:999\b/, "the stale pre-fix z-index must not remain in ColorSelect");
  });
});

describe("RoutineControlCenterModal: adding an Activity confirms exactly what happened", () => {
  test("submitAdd sets addedSummary before resetForm clears the fields it needs", () => {
    const idx = SOURCE.indexOf("const submitAdd=()=>{");
    assert.notEqual(idx, -1, "submitAdd must exist");
    const body = SOURCE.slice(idx, idx + 1500);
    assert.match(body, /setAddedSummary\(/, "submitAdd must set a real confirmation, not stay silent");
    // Must be captured before resetForm() blanks days/startTime/duration
    // back to their next-add defaults.
    const setIdx = body.indexOf("setAddedSummary(");
    const resetIdx = body.indexOf("resetForm();");
    assert.ok(setIdx !== -1 && resetIdx !== -1 && setIdx < resetIdx, "addedSummary must be computed BEFORE resetForm(), not after");
  });

  test("the confirmation distinguishes a real scheduled outcome from the no-days-picked 'drag onto your calendar' outcome", () => {
    const idx = SOURCE.indexOf("const submitAdd=()=>{");
    const body = SOURCE.slice(idx, idx + 1500);
    assert.match(body, /added to your calendar/, "a real day/time pick must say so");
    assert.match(body, /not on the calendar yet/, "zero days picked must say so honestly, not imply it's already scheduled");
  });

  test("the banner actually renders in the modal body, keyed off addedSummary state", () => {
    const idx = SOURCE.indexOf('function RoutineControlCenterModal(');
    assert.notEqual(idx, -1);
    const body = SOURCE.slice(idx, idx + 24000);
    assert.match(body, /\{addedSummary&&\(/, "the confirmation banner must actually be rendered somewhere in the modal");
  });
});
