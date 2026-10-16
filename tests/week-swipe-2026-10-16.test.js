// 2026-10-16: the week view is a continuous horizontal scroller (3 weeks of
// columns, silently re-centered), not a step-per-swipe handler.
const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");
const APP = fs.readFileSync(path.join(__dirname, "..", "studlin-app.jsx"), "utf8").replace(/\r\n/g, "\n");
const i = APP.indexOf("const WK_STRIP_DAYS=21;");
const block = APP.slice(i, i + 5200);

test("week grid renders a 21-day strip: previous, current and next week", () => {
  assert.ok(i > 0);
  assert.ok(APP.includes("(weekOffset - 1) * 7 + i") || APP.includes("(weekOffset - 1) * 7);"));
  assert.ok(APP.includes("Array.from({length: WK_STRIP_DAYS}"));
  assert.ok(APP.includes("repeat(${WK_STRIP_DAYS},${wkColW}px)"));
});
test("scrolling past a week boundary silently shifts weekOffset and compensates scrollLeft", () => {
  assert.ok(block.includes("if(pos<3)k=-Math.ceil((3-pos)/7)"));
  assert.ok(block.includes("else if(pos>11)k=Math.ceil((pos-11)/7)"));
  assert.ok(block.includes("setWeekOffset(o=>o+k)"));
  assert.ok(block.includes("el.scrollLeft=el.scrollLeft-delta*7*c"), "same dates stay under the same pixels");
  assert.ok(block.includes("wkInternalShiftRef.current"), "guards against double-shifting while a shift is pending");
});
test("prev/next/Today slide to the new week and pause the recenter logic while sliding", () => {
  assert.ok(block.includes('el.scrollTo({left:7*c,behavior:"smooth"})'));
  assert.ok(block.includes("wkProgrammaticRef.current=true"));
});
test("a pause after scrolling snaps to the nearest day column", () => {
  assert.ok(block.includes("Math.round(e2.scrollLeft/c2)*c2"));
});
test("single scroller with sticky day header and sticky time gutter, no browser back-swipe", () => {
  assert.ok(APP.includes('data-wk-grid="1" onScroll={onWkScroll}'));
  assert.ok(APP.includes('overscrollBehaviorX:"contain"'));
  assert.ok(APP.includes('position:"sticky",top:0,zIndex:8'), "day header stays visible while scrolling down");
  assert.ok(APP.includes('zIndex:7,position:"sticky",left:0'), "time gutter stays visible while scrolling sideways");
});
test("day names come from the real date, not the column index", () => {
  assert.ok(APP.includes("{DAY_NAMES[d.getDay()]}"));
  assert.ok(!APP.includes("{DAY_NAMES[i]}"));
});
