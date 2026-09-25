// User report, 2026-09-25 (screenshot of the "Study style" wizard step):
// 1. "some of the questions don't do anything" -- see
//    wizard-personalize.test.js for the dead-question removal itself.
// 2. "when i select something when i scroll down it takes me back up" --
//    root cause: TitleSub and PrefChipRow were defined INSIDE
//    ClassSetupWizard's own render body, so picking any chip anywhere in
//    the wizard redefined them as a new function identity every render,
//    forcing React to unmount+remount that subtree (used on every single
//    step via TitleSub, not just this one) instead of an in-place update
//    -- that remount is what was actually causing the scroll jump. Fixed
//    by hoisting both to module scope for a stable identity.
// 3. "some of the bubbles have cream color... i would rather it be
//    white" -- wizardStatusChipStyle (the High School/College buttons)
//    used T.card2, the light theme's cream/off-white card tone, which
//    reads dirty against this wizard's own white (T.card) modal. Same
//    bug classSetupChoiceStyle's own comment already documents fixing
//    once before (2026-09-09), just missed on this one chip style.
//
// Source-level regression guards -- component-closure UI, same
// convention this file's neighbors use. Run with `npm test`.
const { test, describe } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");

const SOURCE = fs.readFileSync(path.join(__dirname, "..", "studlin-app.jsx"), "utf8");

describe("TitleSub and PrefChipRow are module-scope components, not redefined every render", () => {
  test("both are declared at module scope, immediately before ClassSetupWizard, not inside its render body", () => {
    const wizardIdx = SOURCE.indexOf("function ClassSetupWizard(");
    assert.notEqual(wizardIdx, -1);
    const titleSubIdx = SOURCE.indexOf("const TitleSub=({title,sub})=>(");
    const prefChipIdx = SOURCE.indexOf("const PrefChipRow=({label,value,onChange,options})=>(");
    assert.notEqual(titleSubIdx, -1);
    assert.notEqual(prefChipIdx, -1);
    assert.ok(titleSubIdx < wizardIdx, "TitleSub must be declared before ClassSetupWizard starts, not inside it");
    assert.ok(prefChipIdx < wizardIdx, "PrefChipRow must be declared before ClassSetupWizard starts, not inside it");
  });

  test("neither definition is duplicated inside ClassSetupWizard's own body (the actual old bug)", () => {
    const wizardIdx = SOURCE.indexOf("function ClassSetupWizard(");
    const nextFnIdx = SOURCE.indexOf("\nfunction DayPlanner(", wizardIdx);
    assert.notEqual(nextFnIdx, -1, "DayPlanner must still be the next top-level function after ClassSetupWizard -- if this fails the wizard's own boundary moved and this test needs a new anchor");
    const wizardBody = SOURCE.slice(wizardIdx, nextFnIdx);
    assert.doesNotMatch(wizardBody, /const TitleSub=/, "TitleSub must not be redeclared inside the wizard's render body");
    assert.doesNotMatch(wizardBody, /const PrefChipRow=/, "PrefChipRow must not be redeclared inside the wizard's render body");
  });
});

describe("wizardStatusChipStyle: the High School/College chips are white, not cream, inside the white wizard modal", () => {
  test("unselected background is T.card (white), not T.card2 (cream)", () => {
    const idx = SOURCE.indexOf("const wizardStatusChipStyle=(sel)=>(");
    assert.notEqual(idx, -1);
    const body = SOURCE.slice(idx, idx + 300);
    assert.match(body, /background:sel\?T\.lime\+"14":T\.card,/, "unselected must be T.card, not T.card2");
    assert.doesNotMatch(body, /background:sel\?T\.lime\+"14":T\.card2/);
  });
});
