// Unified Build/Redo study plan flow (2026-07-31) -- replaces what used to
// be three inconsistent entry points (the confidence-driven modal, "Build
// my study kit," and the inline "Redo the plan" tool) with one. Most of
// this phase is UI/state-machine restructuring verified live (the
// underlying generation calls are all reused verbatim), but the one
// genuinely new pure-logic piece -- the optional "how many hours do you
// want to study" soft cap -- is covered here.
const { test, describe } = require("node:test");
const assert = require("node:assert/strict");
const { loadStudlinModule } = require("./harness.js");

describe("applyHoursTarget (optional hours-target, now genuinely bidirectional)", () => {
  // 2026-08-20: was applyHoursTargetCap, a one-directional soft cap that
  // only ever scaled the plan DOWN -- a real reported bug, since asking
  // for MORE study time than confidence+material alone called for did
  // nothing at all. Now redivides the target across the existing session
  // count either way; sessionCount itself is never touched by this
  // function (the preview screen's own stepper owns that).
  test("no target (blank field, NaN) leaves the calculated plan untouched", () => {
    const m = loadStudlinModule();
    const result = m.applyHoursTarget(4, 30, NaN);
    assert.equal(result.sessionCount, 4);
    assert.equal(result.sessionDuration, 30);
  });

  test("zero or negative target is a no-op, never zeroes out the plan", () => {
    const m = loadStudlinModule();
    assert.deepEqual(JSON.parse(JSON.stringify(m.applyHoursTarget(4, 30, 0))), { sessionCount: 4, sessionDuration: 30 });
    assert.deepEqual(JSON.parse(JSON.stringify(m.applyHoursTarget(4, 30, -2))), { sessionCount: 4, sessionDuration: 30 });
  });

  test("a target ABOVE the calculated total now scales the plan up -- the reported bug", () => {
    const m = loadStudlinModule();
    // 4 sessions * 30 min = 2 hours calculated; student asked for 5 hours.
    // Used to be silently ignored; now each session should genuinely grow.
    const result = m.applyHoursTarget(4, 30, 5);
    assert.equal(result.sessionCount, 4, "this function only ever adjusts duration, not count");
    assert.ok(result.sessionDuration > 30, "duration should grow to actually move toward the 5-hour target, got " + result.sessionDuration);
  });

  test("a target below the calculated total scales the plan down, never below 10 minutes a session", () => {
    const m = loadStudlinModule();
    // 6 sessions * 60 min = 6 hours calculated; student only wants 1 hour total.
    const result = m.applyHoursTarget(6, 60, 1);
    assert.equal(result.sessionCount, 6);
    assert.ok(result.sessionDuration >= 10);
    assert.ok(result.sessionDuration <= 20, "should land close to the 10-min-per-session target for 1hr/6 sessions, got " + result.sessionDuration);
  });

  test("an extreme low target still floors at 10 minutes rather than collapsing to near-zero", () => {
    const m = loadStudlinModule();
    const result = m.applyHoursTarget(6, 60, 0.1);
    assert.equal(result.sessionDuration, 10);
  });
});
