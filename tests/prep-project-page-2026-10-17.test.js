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
  assert.ok(page.includes('aria-label="Add a step"'));
});
test("removing a step also removes its pending calendar blocks", () => {
  assert.ok(page.includes('blocks.filter(x=>x.stepId===it.id&&x.status!=="done")'));
});
test("edits on a shared project go to the partners", () => {
  assert.ok(page.includes("if(hasPhases&&p.sharedProjectId)pushSharedProjectUpdate(p.sharedProjectId,nextRaw);"));
  assert.ok(page.includes("Shared with your partners. Changes you make here go to them."));
});
test("Schedule goes straight to the weekly calendar's placing mode", () => {
  assert.ok(page.includes('lsSet("openProjectPlacing",{stepId,title:it.text'));
  assert.ok(page.includes("returnProjectId:p.id"));
  assert.ok(page.includes("if(p.sharedProjectId){setProjPopStepId(projPopStepId===key?null:key);return;}"));
  assert.ok(page.includes("goPlace(it,false);"));
  assert.ok(!page.includes("suggestSlots"), "suggestions live on the calendar now");
});
test("a shared project asks: with my partners, or just me", () => {
  assert.ok(page.includes("Schedule it with your partners, or just for you?"));
  assert.ok(page.includes("goPlace(it,true)"));
  assert.ok(page.includes("With my partners"));
  assert.ok(page.includes(">Just me<"));
});
test("a step can have several blocks; each shows its time and comes off the calendar", () => {
  assert.ok(page.includes("bs.slice(0,3).map(blk=>("));
  assert.ok(page.includes("unscheduleStep(blk)"));
  assert.ok(page.includes('bs.length>0?"+ Add time":"Schedule"'));
});
test("calendar placing mode: pulsing chip, repeatable drops, Stu's suggestions, Done returns to the project", () => {
  assert.ok(APP.includes('const q=lsGet("openProjectPlacing",null);'));
  assert.ok(APP.includes('setCalView("weekly");setWeekOffset(0);setCalSidebarCollapsedState(false);'));
  assert.ok(APP.includes('kind:"projectStepPlacing"'));
  assert.ok(APP.includes('if(info.draft.kind==="projectStepPlacing"){placeStepAt(hit.dateKey,hit.startTime);return;}'), "the chip is never consumed, so it can be dropped again");
  assert.ok(APP.includes("studlinChipPulse"));
  assert.ok(APP.includes("Drag the pulsing block onto your calendar"), "first-time Stu instructions");
  assert.ok(APP.includes('lsSet("stuPlacingTipSeen",true);'));
  assert.ok(APP.includes("const placingSuggestions=useMemo(()=>{"));
  assert.ok(APP.includes("placeSuggestions={placing?placingSuggestions:null}"));
  assert.ok(APP.includes("STU SUGGESTS"));
  assert.ok(APP.includes('if(back){lsSet("openProjectId",back);setActive("prep");}'));
  assert.ok(APP.includes('const q=lsGet("openProjectId",null);'), "Prep reopens the project on return");
});
test("partners: their busy times are fetched, shaded and avoided, and unshared partners are named", () => {
  assert.ok(APP.includes("fetchFriendsBusyIntervals(friendUidList)"));
  assert.ok(APP.includes("res.byDate.forEach((intervals,date)=>{busyObj[date]=intervals;});"), "Map converted to a plain object");
  assert.ok(APP.includes('gsBusyByDate={gsOpen&&gsStep==="place"?gsBusyByDate:(placing&&placing.withPartners&&placingPartner.busy?placingPartner.busy:null)}'));
  assert.ok(APP.includes("const clash=(busyBy[k]||[]).some(iv=>st<iv.e&&iv.s<st+45);"));
  assert.ok(APP.includes("so I can't block"));
  assert.ok(APP.includes('pushSharedProjectUpdate(placing.sharedProjectId,(marker&&marker.phases)||[]'));
});
test("no em dashes in the new copy", () => {
  assert.ok(!page.includes("\u2014"));
});
