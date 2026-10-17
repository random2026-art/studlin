// 2026-10-17: the project-step chip sits under Activities, always pulses, keeps its name even
// for oddly-saved projects, and the instructions only show the first time.
const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");
const APP = fs.readFileSync(path.join(__dirname, "..", "studlin-app.jsx"), "utf8").replace(/\r\n/g, "\n");

test("the chip is rendered after the Activities section, not at the top of the sidebar", () => {
  const act = APP.indexOf('letterSpacing:"0.05em"}}>Activities</span>');
  const chip = APP.indexOf('id="placing-chip"');
  const courses = APP.indexOf('letterSpacing:"0.05em"}}>Courses</span>');
  assert.ok(act > 0 && chip > 0 && courses > 0);
  assert.ok(chip > act, "under Activities");
  assert.ok(courses < act && chip > courses);
  assert.equal((APP.match(/id="placing-chip"/g) || []).length, 1, "only one chip");
});
test("the chip always pulses, honors reduced motion, and is scrolled into view", () => {
  assert.ok(APP.includes('animation:"studlinChipPulse 1.5s ease-in-out infinite"'));
  assert.ok(!APP.includes('animation:placingCount>0?"none"'));
  assert.ok(APP.includes(".studlin-chip-pulse{animation:none!important}"));
  assert.ok(APP.includes('document.getElementById("placing-chip")'));
});
test("a step with no name still gets a title (never a blank chip or a 'New task' block)", () => {
  assert.ok(APP.includes('title:(q.title||"").trim()||"Study block"'));
  assert.ok(APP.includes('{placing.title||"Study block"}'));
});
test("project steps read whichever shape the project was saved in", () => {
  assert.ok(APP.includes("const phasesAreStrings=rawPhases.length>0&&rawPhases.every(r=>typeof r===\"string\");"));
  assert.ok(APP.includes("const hasPhases=phasesAreObjects||(phasesAreStrings&&!(p.outline&&p.outline.length>0));"));
  assert.ok(APP.includes('rawPhases.map(n=>({name:n,status:"pending"}))'));
});
test("the full instructions appear only the first time; afterwards a slim bar with Done", () => {
  const i = APP.indexOf("The full walk-through shows once");
  const b = APP.slice(i, i + 4200);
  assert.ok(b.includes('const firstTime=!lsGet("stuPlacingTipSeen",false);'));
  assert.ok(b.includes("if(!firstTime)return ("));
  const slimStart = b.indexOf("if(!firstTime)return (");
  const full = b.indexOf("Drag the pulsing block onto your calendar");
  assert.ok(full > slimStart, "the long version comes after the early return for repeat visits");
  const slim = b.slice(slimStart, full);
  assert.ok(slim.includes("Placing <strong>{placing.title}</strong>"));
  assert.ok(slim.includes("onClick={finishPlacing}>Done</BtnSm>"));
  assert.ok(!slim.includes("Drag it again"), "no instructions in the slim bar");
});
test("no em dashes in the new copy", () => {
  const i = APP.indexOf("The full walk-through shows once");
  assert.ok(!APP.slice(i, i + 4200).includes("—"));
});
