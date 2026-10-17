// 2026-10-17: Create plan opens on two clear choices; Let Stu plan it is one tap.
const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");
const APP = fs.readFileSync(path.join(__dirname, "..", "studlin-app.jsx"), "utf8").replace(/\r\n/g, "\n");
const i = APP.indexOf('buildPlanStep==="choice"&&(()=>{');
const block = APP.slice(i, i + 2600);

test("the choice step is Let Stu plan it / I'll pick the days, plus an optional notes link", () => {
  assert.ok(i > 0);
  assert.ok(block.includes("Let Stu plan it"));
  assert.ok(block.includes("I'll pick the days"));
  assert.ok(block.includes("Add notes, flashcards or a practice exam first"));
  assert.ok(!APP.includes(">Studlin generates<"));
});
test("Let Stu plan it generates immediately, with no calibration form in between", () => {
  assert.ok(block.includes("onClick={generatePreview}"));
  assert.ok(block.includes("onClick={openManualSessions}"));
  assert.ok(block.includes('onClick={()=>setBuildPlanStep("confidence")}'), "the long form stays available, one link away");
});
test("the Free-tier gate is untouched (generatePreview still checks canBuildExamPlan first)", () => {
  const g = APP.slice(APP.indexOf("const generatePreview=async()=>{"));
  assert.ok(g.slice(0, 900).includes("if(!canBuildExamPlan()){"));
});
test("no em dashes in the new copy", () => {
  assert.ok(!block.includes("—"));
});
