// 2026-10-17: dropping a habit chip (Gym) from the sidebar onto the calendar must
// place a visible block, not silently add a weekday to an invisible pattern.
const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");
const APP = fs.readFileSync(path.join(__dirname, "..", "studlin-app.jsx"), "utf8").replace(/\r\n/g, "\n");
const i = APP.indexOf('(routines.find(r=>r.id===routineId)||{}).kind==="habit"){');
const body = APP.slice(i, i + 2200);

test("a dedicated habit branch runs before the generic activity branch", () => {
  assert.ok(i > 0);
  const generic = APP.indexOf('}else if(chipKind==="activity"&&routineId){');
  assert.ok(generic > i, "habit branch comes first");
});
test("it creates a real, pinned event at the dropped date and time, tied to the habit", () => {
  assert.ok(body.includes('id:existing?existing.id:"habit-"+rule.id+"-"+date'));
  assert.ok(body.includes("date,title:rule.title") || body.includes("title:rule.title,date,time:startTime"));
  assert.ok(body.includes("routineId:rule.id,userPinned:true"));
  assert.ok(body.includes("lsSet(\"events\",nextEvents);setEvents(nextEvents)"));
});
test("dropping onto a day that already has this habit updates it instead of duplicating", () => {
  assert.ok(body.includes("e.routineId===rule.id&&e.date===date"));
});
test("the habit's repeat days only change when a repeat was chosen, and the drop confirms with a toast", () => {
  assert.ok(body.includes('if(repeat!=="none"&&repeatDays&&repeatDays.length>0)'));
  assert.ok(body.includes("setPlacementToast(rule.title+\" added"));
});
test("no em dashes in the new code", () => {
  assert.ok(!body.includes("—"));
});
