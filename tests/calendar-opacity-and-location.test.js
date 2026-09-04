// Two independent calendar-grid fixes, both from direct user reports on
// 2026-09-04:
// 1. blendOverBg -- class/activity blocks used real alpha transparency
//    over the week/day grid's own hour-line borders, so the lines
//    visibly bled through the "color." This flattens a semi-transparent
//    tint into one equivalent solid hex against a real background,
//    keeping the exact same perceived color without being see-through.
// 2. expandRoutineOccurrences -- location saved on a recurring routine
//    never made it onto the rendered calendar block (same class of bug
//    already caught once for commuteBefore/commuteAfter, just missed for
//    this field).
// Run with `npm test`.
const { test, describe } = require("node:test");
const assert = require("node:assert/strict");
const { loadStudlinModule } = require("./harness.js");

describe("blendOverBg", () => {
  test("alpha 0 returns exactly the background color -- fully see-through collapses to the backdrop", () => {
    const m = loadStudlinModule();
    assert.equal(m.blendOverBg("#FF0000", 0, "#FFFFFF"), "#ffffff");
  });

  test("alpha 1 returns exactly the foreground color -- fully opaque ignores the backdrop entirely", () => {
    const m = loadStudlinModule();
    assert.equal(m.blendOverBg("#FF0000", 1, "#FFFFFF"), "#ff0000");
  });

  test("a known 50/50 blend of red over white lands on the correct midpoint", () => {
    const m = loadStudlinModule();
    // red(255,0,0) at 0.5 over white(255,255,255) -> (255,128,128)
    assert.equal(m.blendOverBg("#FF0000", 0.5, "#FFFFFF"), "#ff8080");
  });

  test("the real 0x1E (~11.76%) tint used on calendar blocks, blended over white, is close to white but not equal to it", () => {
    const m = loadStudlinModule();
    const result = m.blendOverBg("#9EC83D", 0.1176, "#FFFFFF");
    assert.notEqual(result, "#ffffff", "should still carry a visible tint of the subject color");
    assert.equal(result.length, 7, "always a real 6-digit hex, never a partial/short code");
  });

  test("blending a color against itself returns that same color, regardless of alpha", () => {
    const m = loadStudlinModule();
    assert.equal(m.blendOverBg("#336699", 0.3, "#336699"), "#336699");
  });

  test("returns a well-formed lowercase 6-digit hex string every time", () => {
    const m = loadStudlinModule();
    const result = m.blendOverBg("#ABCDEF", 0.42, "#123456");
    assert.match(result, /^#[0-9a-f]{6}$/);
  });
});

describe("expandRoutineOccurrences -- location carries through to the rendered block", () => {
  test("a location saved on the routine rule appears on every expanded occurrence", () => {
    const m = loadStudlinModule();
    const routines = [{ id: "r1", kind: "class", title: "Chem 101", subject: "Chem", days: [0], startTime: "09:00", duration: 50, location: "Room 204" }];
    const occs = m.expandRoutineOccurrences(routines, "2026-09-07", "2026-09-07");
    assert.equal(occs.length, 1);
    assert.equal(occs[0].location, "Room 204");
  });

  test("no location set on the rule -> empty string, never undefined (keeps the block's own ev.location && check simple)", () => {
    const m = loadStudlinModule();
    const routines = [{ id: "r1", kind: "class", title: "Chem 101", subject: "Chem", days: [0], startTime: "09:00", duration: 50 }];
    const occs = m.expandRoutineOccurrences(routines, "2026-09-07", "2026-09-07");
    assert.equal(occs[0].location, "");
  });

  test("commuteBefore/commuteAfter still carry through unaffected -- the earlier fix for those isn't disturbed by this one", () => {
    const m = loadStudlinModule();
    const routines = [{ id: "r1", kind: "class", title: "Chem 101", subject: "Chem", days: [0], startTime: "09:00", duration: 50, commuteBefore: 15, commuteAfter: 10, location: "Room 204" }];
    const occs = m.expandRoutineOccurrences(routines, "2026-09-07", "2026-09-07");
    assert.equal(occs[0].commuteBefore, 15);
    assert.equal(occs[0].commuteAfter, 10);
    assert.equal(occs[0].location, "Room 204");
  });

  test("a multi-day routine carries the same location onto every one of its occurrences", () => {
    const m = loadStudlinModule();
    const routines = [{ id: "r1", kind: "class", title: "Chem 101", subject: "Chem", days: [0, 2], startTime: "09:00", duration: 50, location: "Room 204" }];
    const occs = m.expandRoutineOccurrences(routines, "2026-09-07", "2026-09-09");
    assert.equal(occs.length, 2);
    occs.forEach(o => assert.equal(o.location, "Room 204"));
  });
});
