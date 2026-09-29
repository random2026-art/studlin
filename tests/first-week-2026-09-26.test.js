// Persona audit 2026-09-25 (Wave 3, chunk 9): a first week that isn't empty.
// UI closures, so source-level guards.
const { test, describe } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");
const SOURCE = fs.readFileSync(path.join(__dirname, "..", "studlin-app.jsx"), "utf8");

describe("9a: Activities can be given days and a time inside setup", () => {
  test("RosterList shows day chips, time and length when withSchedule is on, and the Activities step turns it on", () => {
    assert.match(SOURCE, /function RosterList\(\{items,setItems,makeNewItem,addLabel,withSchedule\}\)/);
    assert.match(SOURCE, /<RosterList items=\{activities\} setItems=\{setActivities\} addLabel="Activity" withSchedule/);
    assert.match(SOURCE, /aria-pressed=\{on\} onClick=\{\(\)=>toggleDay\(r,d\)\}/);
  });
  test("picking a first day fills a start time and length, clearing days clears them", () => {
    const i = SOURCE.indexOf("const toggleDay=(r,d)=>{");
    const body = SOURCE.slice(i, i + 500);
    assert.match(body, /if\(!r\.startTime\)patch\.startTime="16:00"/);
    assert.match(body, /if\(!r\.duration\)patch\.duration=60/);
    assert.match(body, /patch\.startTime=null;patch\.duration=null/);
  });
});

describe("9b: first-time setup can be paused and resumed", () => {
  test("a draft is saved as the student goes, restored on open (14 days), and cleared on finish", () => {
    assert.match(SOURCE, /lsSet\("classSetupDraft",\{step,status,termStart,termEnd,wakeTime,sleepTime,activities,savedAt:Date\.now\(\)\}\)/);
    assert.match(SOURCE, /const draft=lsGet\("classSetupDraft",null\);/);
    assert.match(SOURCE, /14\*86400000/);
    assert.ok(SOURCE.split('lsSet("classSetupDraft",null);').length - 1 >= 2, "cleared both when the wizard commits and when setup finishes");
  });
  test("the onboarding wizard has a Save and finish later exit that just closes it", () => {
    assert.match(SOURCE, /\{!quickScan&&onSkip&&\(/);
    assert.match(SOURCE, />Save and finish later<\/button>/);
    assert.ok(SOURCE.includes("<ClassSetupWizard open={classSetupOpen} termRollover={classSetupRollover} firstRun={isFreshAccount} initialStatus={getProfile().status} onSkip={()=>{lsSet(\"classSetupDeferredUntil\",Date.now()+86400000);setClassSetupOpen(false);setClassSetupRollover(false);if(isFreshAccount)setTheme(\"dark\");}}"));
  });
});

describe("9d: an empty Coming up card offers a free way to add something", () => {
  test("Dashboard sets a one-shot flag that Calendar turns into an open add form", () => {
    assert.match(SOURCE, /lsSet\("pendingAddTask",true\);setActive\("calendar"\);/);
    assert.match(SOURCE, /if\(!lsGet\("pendingAddTask",false\)\)return;[\s\S]{0,140}setNewOpen\(true\);/);
  });
});
