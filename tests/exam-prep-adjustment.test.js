// Tests for isConfidenceStreak and evaluateExamPrepAdjustment's shaky-streak
// escalation (2026-08-20) -- "okay" already got a 3-in-a-row plateau
// escalation and "solid" a 2-in-a-row one, but "shaky" (the zone that
// actually needs it most) had no streak handling at all: a second or third
// shaky in a row used to get the exact same single-instance response as the
// very first one. Reuses the exact "extend" mechanism/shape the okay branch
// already had, just triggered for shaky at the same 2-in-a-row bar solid
// uses, with shaky's own 1.25x multiplier instead of okay's 1.15x.
const { test, describe } = require("node:test");
const assert = require("node:assert/strict");
const { loadStudlinModule } = require("./harness.js");

describe("isConfidenceStreak", () => {
  test("true only when the last N entries are all the same zone", () => {
    const { isConfidenceStreak } = loadStudlinModule();
    assert.equal(isConfidenceStreak(["shaky", "shaky"], "shaky", 2), true);
    assert.equal(isConfidenceStreak(["okay", "shaky"], "shaky", 2), false);
  });
  test("false when the log is shorter than N", () => {
    const { isConfidenceStreak } = loadStudlinModule();
    assert.equal(isConfidenceStreak(["shaky"], "shaky", 2), false);
    assert.equal(isConfidenceStreak([], "shaky", 3), false);
  });
  test("only looks at the last N -- an older non-matching entry doesn't break a recent streak", () => {
    const { isConfidenceStreak } = loadStudlinModule();
    assert.equal(isConfidenceStreak(["solid", "shaky", "shaky"], "shaky", 2), true);
  });
  test("handles a null/undefined log without throwing", () => {
    const { isConfidenceStreak } = loadStudlinModule();
    assert.doesNotThrow(() => isConfidenceStreak(null, "shaky", 2));
    assert.equal(isConfidenceStreak(null, "shaky", 2), false);
  });
  test("works with the numeric 1-5 check-in scale too, via confidenceZoneOf", () => {
    const { isConfidenceStreak } = loadStudlinModule();
    assert.equal(isConfidenceStreak([1, 2], "shaky", 2), true, "1 and 2 both bucket to shaky");
    assert.equal(isConfidenceStreak([1, 3], "shaky", 2), false, "3 buckets to okay, breaks the streak");
  });
});

describe("evaluateExamPrepAdjustment: okay/solid streak behavior unchanged (regression, refactored to use isConfidenceStreak)", () => {
  function pendingSession(overrides) {
    return { id: "sess-1", dueEventId: "exam-1", status: "pending", date: "2026-09-05", duration: 30, ...overrides };
  }
  function exam(confidenceLog, overrides) {
    return { id: "exam-1", title: "Chemistry Final", date: "2026-09-10", examWeight: "quiz", confidenceLog, ...overrides };
  }

  test("okay plateau still requires exactly 3 in a row, extends by 1.15x", () => {
    const m = loadStudlinModule();
    const prefs = m.getSchedulePreferences();
    const result = m.evaluateExamPrepAdjustment(exam(["okay", "okay", "okay"]), [pendingSession()], prefs);
    assert.equal(result.type, "extend");
    assert.equal(result.newDuration, Math.max(15, Math.round((30 * 1.15) / 5) * 5));
  });

  test("only 2 okay in a row is NOT a plateau -- no adjustment forced from that alone", () => {
    const m = loadStudlinModule();
    const prefs = m.getSchedulePreferences();
    const result = m.evaluateExamPrepAdjustment(exam(["okay", "okay"]), [pendingSession()], prefs);
    assert.notEqual(result && result.type, "extend");
  });

  test("solid twice in a row on a major exam still shortens by 0.6x", () => {
    const m = loadStudlinModule();
    const prefs = m.getSchedulePreferences();
    const result = m.evaluateExamPrepAdjustment(exam(["solid", "solid"], { examWeight: "major" }), [pendingSession()], prefs);
    assert.equal(result.type, "shorten");
    assert.equal(result.newDuration, Math.max(15, Math.round((30 * 0.6) / 5) * 5));
  });
});

describe("evaluateExamPrepAdjustment: NEW shaky-streak escalation (2026-08-20)", () => {
  function pendingSession(overrides) {
    return { id: "sess-1", dueEventId: "exam-1", status: "pending", date: "2026-09-05", duration: 30, ...overrides };
  }
  function exam(confidenceLog, overrides) {
    return { id: "exam-1", title: "Chemistry Final", date: "2026-09-10", examWeight: "quiz", confidenceLog, ...overrides };
  }

  test("a single shaky (no streak) still gets the original pull-closer response, not extend", () => {
    const m = loadStudlinModule();
    const prefs = m.getSchedulePreferences();
    const result = m.evaluateExamPrepAdjustment(exam(["shaky"]), [pendingSession()], prefs);
    assert.equal(result.type, "pull-closer");
  });

  test("two shaky in a row now escalates to extend, using shaky's own 1.25x multiplier", () => {
    const m = loadStudlinModule();
    const prefs = m.getSchedulePreferences();
    const result = m.evaluateExamPrepAdjustment(exam(["shaky", "shaky"]), [pendingSession()], prefs);
    assert.equal(result.type, "extend");
    assert.equal(result.newDuration, Math.max(15, Math.round((30 * 1.25) / 5) * 5));
    assert.ok(result.newDuration > 30);
  });

  test("three shaky in a row also escalates (2-in-a-row bar is a floor, not an exact match)", () => {
    const m = loadStudlinModule();
    const prefs = m.getSchedulePreferences();
    const result = m.evaluateExamPrepAdjustment(exam(["okay", "shaky", "shaky"]), [pendingSession()], prefs);
    assert.equal(result.type, "extend");
  });

  test("no remaining sessions -- last-session response wins regardless of streak", () => {
    const m = loadStudlinModule();
    const prefs = m.getSchedulePreferences();
    const result = m.evaluateExamPrepAdjustment(exam(["shaky", "shaky"]), [], prefs);
    assert.equal(result.type, "last-session");
  });

});
