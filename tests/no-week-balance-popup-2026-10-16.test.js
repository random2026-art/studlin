// 2026-10-16: the automatic "your week's a bit lopsided" pop-up is gone; the
// manual "Balance my week" flow is untouched.
const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");
const APP = fs.readFileSync(path.join(__dirname, "..", "studlin-app.jsx"), "utf8").replace(/\r\n/g, "\n");

test("no automatic lopsided-week pop-up", () => {
  assert.ok(!APP.includes("Your week's a bit lopsided"));
  assert.ok(!APP.includes("setWeekBalanceNudge"));
  assert.ok(!APP.includes("acceptWeekBalanceNudge"));
});
test("manual Balance my week is still reachable", () => {
  assert.ok(APP.includes("const openWeekBalance=()=>{"));
  assert.ok(APP.includes("const confirmWeekBalance=()=>{"));
  assert.ok(/openWeekBalance/.test(APP.slice(APP.indexOf("const confirmWeekBalance=()=>{"))));
});
