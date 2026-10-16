// 2026-10-16: two-finger horizontal swipe changes the week in Week view.
const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");
const APP = fs.readFileSync(path.join(__dirname, "..", "studlin-app.jsx"), "utf8").replace(/\r\n/g, "\n");

test("week view listens for horizontal wheel and steps one week per swipe", () => {
  const i = APP.indexOf("const swipeRef=useRef(");
  assert.ok(i > 0);
  const body = APP.slice(i, i + 1500);
  assert.ok(body.includes('document.addEventListener("wheel",onWheel,{passive:false})'));
  assert.ok(body.includes("setWeekOffset(o=>o+(s.acc>0?1:-1))"));
  assert.ok(body.includes("s.locked"), "momentum tail is ignored after one step");
  assert.ok(body.includes('removeEventListener("wheel",onWheel)'), "listener is cleaned up when leaving Week view");
});
test("only swipes over the week header or grid count, vertical scroll is untouched", () => {
  assert.ok(APP.includes('t.closest("[data-wk-hdr],[data-wk-grid]")'));
  assert.ok(APP.includes('data-wk-grid="1"'));
  assert.ok(APP.includes("overscrollBehaviorX:\"contain\""), "browser back/forward swipe is not triggered");
});
