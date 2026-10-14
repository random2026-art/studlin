// 2026-10-14: Feedback tab removed; levels and focus hours hidden when the
// timer/smart features are off; imported deadline markers no longer re-trigger
// the "moved, it conflicted with your schedule" toast on every app open.
const { test, describe } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");
const SOURCE = fs.readFileSync(path.join(__dirname, "..", "studlin-app.jsx"), "utf8").replace(/\r\n/g, "\n");

describe("Feedback tab removed", () => {
  test("not in the sidebar or the page map, and the help fallback no longer points to it", () => {
    assert.ok(!SOURCE.includes('{id:"feedback",label:"Feedback"}'));
    assert.ok(!/pages=\{[^}]*feedback:FeedbackPage/.test(SOURCE));
    assert.ok(!SOURCE.includes("use Feedback in the sidebar"));
  });
});

describe("levels and focus hours follow the timer", () => {
  test("Profile hides levels and focus stats when smart features are off", () => {
    assert.match(SOURCE, /const seriousMode=seriousModeProp\|\|!smartFeaturesOn\(\);/);
  });
  test("Weekly Wrapped drops the focus bars and Focus hours row without the timer", () => {
    assert.match(SOURCE, /\{smartFeaturesOn\(\)&&\(\(\)=>\{\s*const barData=/);
    assert.match(SOURCE, /\.\.\.\(smartFeaturesOn\(\)\?\[\{ln:"Focus hours"/);
  });
});

describe("routine reconcile leaves markers and synced items alone", () => {
  test("skips due markers and imported/gcal events before moving anything", () => {
    const i = SOURCE.indexOf("const reconcileRoutineConflicts=(nextRoutines)=>{");
    const body = SOURCE.slice(i, i + 3500);
    assert.match(body, /if\(isDuePill\(ev\)\)return ev;/);
    assert.match(body, /ev\.source==="import"\|\|String\(ev\.id\|\|""\)\.startsWith\("gcal-"\)/);
  });
});
