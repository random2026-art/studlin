// 2026-10-14: Week and Month views start on Sunday (like Google Calendar).
// Routine day indices stay Monday-first (data model untouched).
const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");
const SRC = fs.readFileSync(path.join(__dirname, "..", "studlin-app.jsx"), "utf8");

test("week grid starts on Sunday with matching header names", () => {
  assert.ok(SRC.includes('const DAY_NAMES = ["SUN","MON","TUE","WED","THU","FRI","SAT"];'));
  assert.ok(SRC.includes("const diff = -day; // weeks start on Sunday"));
});
test("month grid leads with Sunday and header matches", () => {
  assert.ok(SRC.includes("const lead=new Date(ym.y,ym.m,1).getDay();"));
  assert.ok(SRC.includes('{["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map((d,i)=><div key={i} data-month-hdr="1"'));
});
test("toolbar range label and jump-to-session use the same Sunday start", () => {
  assert.ok(SRC.includes("const day=d.getDay();const diff=-day;"));
  assert.ok(SRC.includes("const diff=-day;"));
  assert.ok(SRC.includes("const tDiff=-tDay;"));
});
test("school-hours mask follows real weekdays, not column index", () => {
  assert.ok(SRC.includes("schoolWindow && day.getDay()>=1 && day.getDay()<=5 &&"));
  assert.ok(!SRC.includes("colIdx<5"));
});
