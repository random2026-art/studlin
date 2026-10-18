// 2026-10-17: Prep exams list gets a hover Create plan, the exam page loses the
// BEHIND tag / prepared bar / pace chart and gets session cards with Stu's help.
const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");
const APP = fs.readFileSync(path.join(__dirname, "..", "studlin-app.jsx"), "utf8").replace(/\r\n/g, "\n");

test("exams list: Prep column gone, Create plan / View plan appears on hover, focus or touch", () => {
  assert.ok(!APP.includes('"Sessions","Prep"]'));
  assert.ok(APP.includes('"Sessions",""].map((h,i)=>('));
  assert.ok(APP.includes('const [hoverExamId,setHoverExamId]=useState(null);'));
  assert.ok(APP.includes('{has?"View plan":"Create plan"}'));
  assert.ok(APP.includes('window.matchMedia("(hover: hover)").matches'), "always visible where there is no hover");
  assert.ok(APP.includes("onFocus={()=>setHoverExamId(ex.id)}"), "keyboard users get it too");
  assert.ok(APP.includes("if(has)viewPlan(ex);else openBuildPlan(ex);"));
});
test("exam page: no BEHIND pill, prepared bar or pace chart", () => {
  const i = APP.indexOf('tab==="exams"&&selectedExam&&(()=>{');
  const page = APP.slice(i, i + 40000);
  assert.ok(!page.includes("<ReadinessTrajectoryChart"));
  assert.ok(!page.includes("% prepared"));
  assert.ok(!page.includes("readiness.state.toUpperCase()"));
  assert.ok(page.includes("sessions done</span>"), "one calm progress line instead");
});
test("session cards are editable in place", () => {
  assert.ok(APP.includes('aria-label="Session date"'));
  assert.ok(APP.includes('aria-label="Shorter"') && APP.includes('aria-label="Longer"'));
  assert.ok(APP.includes("patchEventById(s.id,{duration:Math.max(5,dur-5)})"));
  assert.ok(APP.includes("patchEventById(s.id,{date:e.target.value})"));
});
test("Stu flags an overlap on the card and offers shorten / move / show me", () => {
  assert.ok(APP.includes("is at {fmtRolloverClock(minutesToTime(conflict.start))} that day, so this overlaps."));
  assert.ok(APP.includes("Shorten to {shortenTo} min"));
  assert.ok(APP.includes("Move to {fmtRolloverClock(moveTo)}"));
  assert.ok(APP.includes("Show me on the calendar"));
  assert.ok(APP.includes('<StudMascot size={30} mood="thinking" {...stuPalette()} />'));
});
test("See on calendar opens a session review on the calendar (not just a highlight)", () => {
  assert.ok(APP.includes('lsSet("openSessionReview",{title:selectedExam.title,ids,examId:selectedExam.id,setAt:Date.now()});'));
  assert.ok(APP.includes("showOnCalendar(upcomingScheduled.map(x=>x.id))"));
  assert.ok(APP.includes("onShow([s.id])"));
});
test("no em dashes in the new comments or copy", () => {
  const i = APP.indexOf("2026-10-17: the BEHIND tag");
  assert.ok(!APP.slice(i, i + 600).includes("—"));
});
