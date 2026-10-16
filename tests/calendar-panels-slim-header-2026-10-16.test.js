// 2026-10-16: Courses/Upcoming side panels stretch to the calendar's full
// height (no fixed 100vh-150px, no white gap), and the week day header is slimmer.
const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");
const APP = fs.readFileSync(path.join(__dirname, "..", "studlin-app.jsx"), "utf8").replace(/\r\n/g, "\n");

test("side panels stretch to the calendar column instead of a fixed viewport height", () => {
  assert.ok(!APP.includes('position:"relative",height:"calc(100vh - 150px)"'));
  assert.equal((APP.match(/position:"relative",alignSelf:"stretch"/g) || []).length, 2, "left and right panel wrappers");
  assert.ok(APP.includes('width:196,paddingRight:20,height:0,minHeight:"100%",overflowY:"auto"'));
  assert.ok(APP.includes('width:220,marginLeft:34,height:0,minHeight:"100%",overflowY:"auto",paddingBottom:96,boxSizing:"border-box"'));
});
test("week header puts day name and date on one line and keeps the due pill", () => {
  assert.ok(APP.includes("same info, same click targets") || APP.includes("Same info, same click targets"));
  assert.ok(APP.includes('width:24,height:24,borderRadius:"50%"'));
  assert.ok(APP.includes('padding:"5px 4px 6px"'));
  assert.ok(APP.includes("{duePills.length} due"));
  assert.ok(APP.includes("DAY_NAMES[d.getDay()]"));
});
