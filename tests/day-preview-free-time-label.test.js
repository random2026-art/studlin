// Regression test for a 2026-08-27 fix requested directly by the user:
// DayPreviewModal's free-time gaps used to be marked with a dashed line
// spanning the whole gap -- reported as distracting and unclear what it
// meant at a glance. Replaced with a plain, centered label stating the
// actual time range and duration, no line at all.
//
// This lives inside a top-level presentational component
// (DayPreviewModal), but its render body isn't reachable as pure data in
// vs data out -- same source-level regression guard approach used for
// every other JSX-shape fix this session.
const { test, describe } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");

const SOURCE = fs.readFileSync(path.join(__dirname, "..", "studlin-app.jsx"), "utf8");

describe("DayPreviewModal free-time gaps: label instead of a dashed line", () => {
  test("the dashed border that used to span the whole free-time gap is gone", () => {
    assert.doesNotMatch(SOURCE, /borderTop:`1\.5px dashed \$\{T\.faint\}`/,
      "a lingering dashed-border style would mean the distracting line reported by the user is still there");
  });

  test("the free-time label states both the time range and the actual duration, using the existing fmtH duration formatter (not a new one-off formatter)", () => {
    assert.match(SOURCE, /\{fmtGapLabel\(g\.start\)\}–\{fmtGapLabel\(g\.end\)\} free · \{fmtH\(g\.end-g\.start\)\}/);
  });

  test("the label is centered within its own gap space rather than left-anchored against a line that no longer exists", () => {
    const idx = SOURCE.indexOf("{freeGaps.map((g,i)=>(");
    const snippet = SOURCE.slice(idx, idx + 400);
    assert.match(snippet, /justifyContent:"center"/);
  });
});
