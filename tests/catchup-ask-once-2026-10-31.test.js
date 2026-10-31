// 2026-10-31 user report: Stu asked "N things from over a week ago didn't get
// done" on every visit, only offered Show me / Not now, and Show me jumped
// straight to Studlin's proposed new times. Now: he asks once per missed task,
// Show me is a plain list (Mark complete / Find time per task), and Find time
// is its own button. Nothing moves without the existing confirm step.
const { test, describe } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");

const SOURCE = fs.readFileSync(path.join(__dirname, "..", "studlin-app.jsx"), "utf8").split("\r\n").join("\n");

describe("Stu catch-up prompt", () => {
  test("asks once per missed task: remembers asked keys, only fresh misses bring him back", () => {
    assert.ok(SOURCE.includes('const askedKeys=new Set(lsGet("catchUpAskedKeys",[]));'));
    assert.ok(SOURCE.includes("const freshMissed=missedItems.filter(ev=>!askedKeys.has(missedKey(ev)));"));
    assert.ok(SOURCE.includes("if(catchUpOffered&&freshMissed.length>0){"));
    assert.ok(!SOURCE.includes('lsGet("catchUpBannerDismissedDate",null)!==today){\n      setCatchUpBanner'));
  });

  test("bubble has Show me, Find time and Not now; Show me opens the plain list, Find time the preview", () => {
    assert.ok(SOURCE.includes('{onSecond&&<BtnSm variant="subtle" onClick={()=>{howRef.current="second";setPhase("yes");}} style={{padding:"6px 12px",fontSize:11.5}}>Find time</BtnSm>}'));
    assert.ok(SOURCE.includes("onYes={()=>{openCatchUpList();}} onSecond={()=>{openCatchUpPreview();}}"));
    assert.ok(SOURCE.includes('const go=(howRef.current==="second"&&onSecond)?onSecond:onYes;'));
  });

  test("the list marks tasks complete and offers Find time per task and for all", () => {
    assert.ok(SOURCE.includes('<BtnSm onClick={()=>markCatchUpItemsDone([ev.id])}>Mark complete</BtnSm>'));
    assert.ok(SOURCE.includes("<BtnSm variant=\"subtle\" onClick={()=>openCatchUpPreview(ev.id)}>Find time</BtnSm>"));
    assert.ok(SOURCE.includes("Mark all complete"));
    assert.ok(SOURCE.includes("Find time for all"));
    assert.ok(SOURCE.includes("ids.forEach(id=>markEventDone(id));"));
  });

  test("a single-task Find time only plans that task, and the list itself never proposes a time", () => {
    assert.ok(SOURCE.includes('if(typeof onlyId==="string")plan={moves:plan.moves.filter(m=>m.id===onlyId)'));
    const list = SOURCE.slice(SOURCE.indexOf('title="What you missed"'), SOURCE.indexOf("Rebuild preview -- Part 3"));
    assert.ok(!list.includes("computeCatchUpPlan"));
  });

  test("moving still goes through the confirm step", () => {
    assert.ok(SOURCE.includes("Nothing changes until you accept."));
    assert.ok(SOURCE.includes("onClick={confirmCatchUpRebuild}"));
  });

  test("no em dashes in the new copy", () => {
    const list = SOURCE.slice(SOURCE.indexOf('title="What you missed"'), SOURCE.indexOf("Rebuild preview -- Part 3"));
    assert.ok(!list.includes("\u2014"));
    assert.ok(!SOURCE.includes("Mark them done, or I can find time.\u2014"));
  });
});
