// 2026-10-17: a real Prep project page: editable steps, schedule one step with Stu's
// free times or by hand on the calendar (drag into a gap, press Done).
const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");
const APP = fs.readFileSync(path.join(__dirname, "..", "studlin-app.jsx"), "utf8").replace(/\r\n/g, "\n");
const i = APP.indexOf("const renderProjectPage=(p)=>{");
const page = APP.slice(i, APP.indexOf("const selProject=selectedProjectId", i));

test("project rows open the page, the edit modal stays one click away", () => {
  assert.ok(i > 0);
  assert.ok(APP.includes("if(selProject)return renderProjectPage(selProject);"));
  assert.ok(APP.includes("onClick={()=>setSelectedProjectId(p.id)}"));
  assert.ok(page.includes('onClick={()=>setDetailEventId(p.id)}>Edit details'));
});
test("steps can be added, renamed, checked and removed in place (outline or phases)", () => {
  assert.ok(page.includes("const hasPhases=!!(p.phases&&p.phases.length>0);"));
  assert.ok(page.includes("const addStep=()=>{"));
  assert.ok(page.includes("const renameStep=(it,text)=>{"));
  assert.ok(page.includes("const toggleStep=(it)=>"));
  assert.ok(page.includes("const removeStep=(it)=>{"));
  assert.ok(page.includes("rawSteps.length<=1"), "never remove the last step, it would stop being a project");
  assert.ok(page.includes("aria-label=\"Add a step\""));
});
test("removing a step also removes its pending calendar block", () => {
  assert.ok(page.includes("blocks.filter(x=>x.stepId===it.id&&x.status!==\"done\")"));
});
test("Schedule offers Stu's free times (same-day slots only) and 'Pick my own time'", () => {
  assert.ok(page.includes("const suggestSlots=()=>{"));
  assert.ok(page.includes("slot&&slot.date===k"));
  assert.ok(page.includes("out.length<3"));
  assert.ok(page.includes("Pick my own time"));
  assert.ok(page.includes("Free times I found:"));
});
test("a scheduled step shows its time and can come back off the calendar", () => {
  assert.ok(page.includes("unscheduleStep(blk)"));
  assert.ok(page.includes("dueEventId:p.id,stepId,projectStep:true"));
});
test("Pick my own time hands the calendar a project step and a way back", () => {
  assert.ok(page.includes('lsSet("openManualPlacement",{kind:"projectStep"'));
  assert.ok(page.includes("returnProjectId:p.id"));
});
test("calendar: the step's block is added on arrival and Done returns to the project", () => {
  assert.ok(APP.includes('manualPlacement.kind!=="projectStep"||projectStepAutoPlacedRef.current'));
  assert.ok(APP.includes('if(back){lsSet("openProjectId",back);setActive("prep");}'));
  assert.ok(APP.includes("into a free gap in your calendar. Resize it to change the length, then press Done."));
  assert.ok(APP.includes('isExamPrepSession:manualPlacement.kind!=="attack"&&manualPlacement.kind!=="projectStep"'), "a step is not exam prep");
  assert.ok(APP.includes('const q=lsGet("openProjectId",null);'), "Prep reopens the project on return");
});
test("no em dashes in the new copy", () => {
  assert.ok(!page.includes("—"));
});
