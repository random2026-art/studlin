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

describe("applyHoursTargetCap (optional hours-target soft cap on the confidence-driven plan)", () => {
  test("no target (blank field, NaN) leaves the calculated plan untouched", () => {
    const m = loadStudlinModule();
    const result = m.applyHoursTargetCap(4, 30, NaN);
    assert.equal(result.sessionCount, 4);
    assert.equal(result.sessionDuration, 30);
  });

  test("zero or negative target is a no-op, never zeroes out the plan", () => {
    const m = loadStudlinModule();
    assert.deepEqual(JSON.parse(JSON.stringify(m.applyHoursTargetCap(4, 30, 0))), { sessionCount: 4, sessionDuration: 30 });
    assert.deepEqual(JSON.parse(JSON.stringify(m.applyHoursTargetCap(4, 30, -2))), { sessionCount: 4, sessionDuration: 30 });
  });

  test("a target the calculated plan already fits under is left unchanged (never pads up)", () => {
    const m = loadStudlinModule();
    // 4 sessions * 30 min = 120 min = 2 hours; asking for 5 hours is way
    // more than the confidence-driven plan calls for -- must not inflate
    // session count/duration just because the student said they have time.
    const result = m.applyHoursTargetCap(4, 30, 5);
    assert.equal(result.sessionCount, 4);
    assert.equal(result.sessionDuration, 30);
  });

  test("a target below the calculated total scales the plan down, never below 1 session or 10 minutes", () => {
    const m = loadStudlinModule();
    // 6 sessions * 60 min = 360 min = 6 hours calculated; student only
    // wants to spend 1 hour total.
    const result = m.applyHoursTargetCap(6, 60, 1);
    const totalMins = result.sessionCount * result.sessionDuration;
    assert.ok(totalMins <= 90, "capped total should be reasonably close to the 60-minute target, got " + totalMins);
    assert.ok(result.sessionCount >= 1);
    assert.ok(result.sessionDuration >= 10);
  });
});
