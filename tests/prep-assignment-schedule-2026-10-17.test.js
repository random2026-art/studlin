// 2026-10-17: Prep assignments get the same flow as exams: hover Schedule / See plan, a page with
// "Schedule" (pick your own time on the calendar) and "I don't know how long this will take"
// (Stu finds a short Attack Block), and a session-card plan once there is one.
const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");
const APP = fs.readFileSync(path.join(__dirname, "..", "studlin-app.jsx"), "utf8").replace(/\r\n/g, "\n");
const pageStart = APP.indexOf("An item that carries its own block (time + duration;");
const page = APP.slice(pageStart - 600, pageStart + 6200);

test("list: Schedule on rows with no plan, See plan on rows that have one, on hover / focus / touch", () => {
  assert.ok(APP.includes("const [hoverAssignId,setHoverAssignId]=useState(null);"));
  assert.ok(APP.includes('const rowHasPlan=allEventsForRow.some(e=>e.dueEventId===a.id)||(!!a.time&&!!a.duration);'));
  assert.ok(APP.includes('{rowHasPlan?"See plan":"Schedule"}'));
  assert.ok(APP.includes('window.matchMedia("(hover: hover)").matches:true;\n                  const rowShowAction'));
  assert.ok(APP.includes("onFocus={()=>setHoverAssignId(a.id)}"));
  assert.ok(APP.includes('["Name","Class","Due","Days","Urgency","Difficulty","Plan",""]'));
});
test("list status reads what is really planned, including blocks the student placed", () => {
  assert.ok(APP.includes('const pending=allEventsForRow.filter(e=>e.dueEventId===a.id&&e.status!=="done");'));
  assert.ok(APP.includes('"no plan yet"):pending.length+" session"'));
});
test("page: Schedule is the primary action and the Attack Block is the quieter second choice", () => {
  assert.ok(page.includes("onClick={goPlaceAssignment}"));
  assert.ok(page.includes("Pick when you'll work on it. Drag a block onto your calendar, as many times as you like."));
  assert.ok(page.includes("I don't know how long this will take"));
  assert.ok(page.includes("onClick={findTimeWithStu}"));
  assert.ok(page.indexOf("goPlaceAssignment") < page.indexOf("findTimeWithStu"), "Schedule comes first");
  assert.ok(page.includes("{canStartAttackBlock&&("), "only offered where an Attack Block is allowed");
});
test("the old centerpiece toggle, typed block form and slot picker are gone", () => {
  assert.ok(!page.includes("Start an Attack Block for this"), "the toggle on the assignment page (the event editor keeps its own)");
  assert.ok(!APP.includes("assignAddManualBlock"), "the typed date/time form on the assignment page");
  assert.ok(!APP.includes("candidates={assignAttackSlotPicker"), "the Attack Block slot picker on the assignment page");
  assert.ok(!APP.includes("assignAttackManual"));
});
test("Stu visibly looks for time, then the calendar opens on what he found", () => {
  assert.ok(page.includes("Looking for time to work on this..."));
  assert.ok(page.includes('<StudMascot size={52} mood="thinking"'));
  assert.ok(APP.includes("const findTimeWithStu=()=>{"));
  assert.ok(APP.includes("},1400);"));
  assert.ok(APP.includes('message:"I found "+(task.duration||assignAttackProbeMins)+" minutes to work on "'));
  assert.ok(APP.includes("returnAssignmentId:selectedAssignment.id,\n              message:"));
  assert.ok(APP.includes('I couldn\'t find room for a short session before the deadline. Try Schedule and pick a time yourself.'));
});
test("Schedule hands the calendar an assignment to place and a way back", () => {
  assert.ok(APP.includes('lsSet("openProjectPlacing",{kind:"assignment",stepId:null,title:"Work on: "+selectedAssignment.title'));
  assert.ok(APP.includes("returnAssignmentId:selectedAssignment.id,withPartners:false"));
});
test("plan: one session card each (shared with exams), own block kept, own block never removable", () => {
  assert.ok(APP.includes("const renderSessionCard=(s,opts)=>{"));
  assert.ok(APP.includes("renderSessionCard(s,{today,deadline:selectedExam.date,onShow:showOnCalendar})"), "exam page uses the shared card");
  assert.ok(page.includes("renderSessionCard(x,{today,deadline:selectedAssignment.deadline||selectedAssignment.date||null,canRemove:x.id!==selectedAssignment.id"));
  assert.ok(page.includes("const ownBlock=!!selectedAssignment.time&&!!selectedAssignment.duration;"));
  assert.ok(page.includes("(ownBlock?[selectedAssignment]:[]).concat(linkedSessions)"));
  assert.ok(APP.includes("{!canRemove?null:confirmDeleteSessionId===s.id?("));
});
test("Mark done on an assignment's session still runs the Attack Block check-in", () => {
  assert.ok(APP.includes("onMarkDone:markLinkedBlockDone,onRemove:deleteLinkedBlock"));
  assert.ok(APP.includes("const markDone=opts.onMarkDone||"));
});
test("completed assignments offer no scheduling; a plan offers See on calendar and + Add time", () => {
  assert.ok(page.includes("if(isCompleted&&!hasPlan)return null;"));
  assert.ok(page.includes("{!isCompleted&&<BtnSm variant=\"ghost\" onClick={goPlaceAssignment}>+ Add time</BtnSm>}"));
  assert.ok(page.includes("showAssignOnCalendar(pendingPlan.map(x=>x.id))"));
});
test("calendar: placing works for assignments (no step id), counts the due day, and a no-date item gets a week", () => {
  assert.ok(APP.includes('placing.stepId?e.stepId===placing.stepId:(e.dueEventId===placing.projectId&&e.status!=="done")'));
  assert.ok(APP.includes("?(placing.deadline>=todayK2?placing.deadline:todayK2)"));
  assert.ok(APP.includes("d.setDate(d.getDate()+7);return dayKey(d);})(); // no due date: the next week"));
  assert.ok(APP.includes("...(placing.stepId?{stepId:placing.stepId,projectStep:true}:{})};"));
});
test("calendar: Done returns to the assignment, and a single found block hides Back / Next", () => {
  assert.ok(APP.includes('else if(backAsg){lsSet("openAssignmentId",backAsg);setActive("prep");}'));
  assert.ok(APP.includes('const asg=lsGet("openAssignmentId",null);'));
  assert.ok(APP.includes("{reviewSessions.length>1&&<BtnSm variant=\"ghost\" disabled={reviewIdx<=0}"));
  assert.ok(APP.includes("Move it anywhere you like: drag the pulsing block"));
});
test("no em dashes in the new copy", () => {
  assert.ok(!page.includes("—"));
});
