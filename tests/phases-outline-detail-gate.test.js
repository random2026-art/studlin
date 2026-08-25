// Regression test for PhasesOutlineEditor's "Break it into phases?"/"Add a
// step-by-step checklist?" buttons (studlin-app.jsx). Before this fix, both
// fired a real AI call (proposeProjectPhases/proposeOutline) regardless of
// whether item.detail had any real content -- proposeProjectPhases/
// proposeOutline already correctly refuse to invent a fake breakdown from a
// bare title (they come back with an empty array), but that still meant a
// real network call went out, and a gated use got spent (see
// canBreakDownProject/recordProjectBreakdown), for a request that was
// always going to return nothing.
//
// hasEnoughDetailForBreakdown is the pure client-side check now run BEFORE
// either button fires its network call (see PhasesOutlineEditor's own
// suggestPhases/suggestOutline) -- if it comes back false, the call never
// goes out at all. Run with `npm test`.
const { test, describe } = require("node:test");
const assert = require("node:assert/strict");
const { loadStudlinModule } = require("./harness.js");

describe("hasEnoughDetailForBreakdown (Fix 4: skip the AI call when there's nothing to ground it in)", () => {
  test("no detail at all (undefined) is not enough", () => {
    const { hasEnoughDetailForBreakdown } = loadStudlinModule({});
    assert.equal(hasEnoughDetailForBreakdown(undefined), false);
  });

  test("an empty string is not enough", () => {
    const { hasEnoughDetailForBreakdown } = loadStudlinModule({});
    assert.equal(hasEnoughDetailForBreakdown(""), false);
  });

  test("whitespace-only detail is not enough -- trimmed before measuring", () => {
    const { hasEnoughDetailForBreakdown } = loadStudlinModule({});
    assert.equal(hasEnoughDetailForBreakdown("     \n\t  "), false);
  });

  test("a couple of throwaway characters under the minimum length is not enough", () => {
    const { hasEnoughDetailForBreakdown } = loadStudlinModule({});
    assert.equal(hasEnoughDetailForBreakdown("tbd"), false);
  });

  test("a real sentence describing the project is enough", () => {
    const { hasEnoughDetailForBreakdown } = loadStudlinModule({});
    assert.equal(hasEnoughDetailForBreakdown("Build a working demo and present it to the class by the deadline."), true);
  });

  test("leading/trailing whitespace around otherwise-real content doesn't count against it", () => {
    const { hasEnoughDetailForBreakdown } = loadStudlinModule({});
    assert.equal(hasEnoughDetailForBreakdown("   Write a report on climate policy   "), true);
  });
});
