// Tests for the Prep redesign Part C calibration engine:
// computeStudyPlanParams/materialVolumeBonus/STUDY_PLAN_CONFIDENCE_LEVELS.
const { test, describe } = require("node:test");
const assert = require("node:assert/strict");
const { loadStudlinModule } = require("./harness.js");

describe("materialVolumeBonus", () => {
  test("no material -- no bonus", () => {
    const { materialVolumeBonus } = loadStudlinModule();
    assert.equal(materialVolumeBonus(0), 0);
    assert.equal(materialVolumeBonus(null), 0);
  });

  test("a little material -- no bonus (confidence is the primary lever)", () => {
    const { materialVolumeBonus } = loadStudlinModule();
    assert.equal(materialVolumeBonus(3000), 0);
  });

  test("a lot of material -- a modest bonus, never a reduction", () => {
    const { materialVolumeBonus } = loadStudlinModule();
    assert.ok(materialVolumeBonus(10000) > 0);
    assert.ok(materialVolumeBonus(25000) >= materialVolumeBonus(10000));
  });
});

describe("computeStudyPlanParams", () => {
  test("shaky gets more sessions than okay, which gets more than solid", () => {
    const { computeStudyPlanParams } = loadStudlinModule();
    const shaky = computeStudyPlanParams("exam", 25, "shaky", 0);
    const okay = computeStudyPlanParams("exam", 25, "okay", 0);
    const solid = computeStudyPlanParams("exam", 25, "solid", 0);
    assert.ok(shaky.sessionCount > okay.sessionCount, "shaky should propose more sessions than okay");
    assert.ok(okay.sessionCount > solid.sessionCount, "okay should propose more sessions than solid");
  });

  test("shaky gets longer sessions than solid", () => {
    const { computeStudyPlanParams } = loadStudlinModule();
    const shaky = computeStudyPlanParams("exam", 25, "shaky", 0);
    const solid = computeStudyPlanParams("exam", 25, "solid", 0);
    assert.ok(shaky.sessionDuration > solid.sessionDuration);
  });

  test("session count never exceeds the curve's own 6-session ceiling", () => {
    const { computeStudyPlanParams } = loadStudlinModule();
    const result = computeStudyPlanParams("exam", 25, "shaky", 50000); // max confidence bump + max material bonus
    assert.ok(result.sessionCount <= 6);
  });

  test("session count is never less than 1", () => {
    const { computeStudyPlanParams } = loadStudlinModule();
    const result = computeStudyPlanParams("quiz", 25, "solid", 0);
    assert.ok(result.sessionCount >= 1);
  });

  test("a quiz gets fewer sessions than an exam at the same confidence level", () => {
    const { computeStudyPlanParams } = loadStudlinModule();
    const quiz = computeStudyPlanParams("quiz", 25, "okay", 0);
    const exam = computeStudyPlanParams("exam", 25, "okay", 0);
    assert.ok(quiz.sessionCount < exam.sessionCount);
  });

  test("difficultyValue maps confidence onto the existing 0-1000 Easy/Hard scale, feeding Catch Me Up's compression parameter", () => {
    const { computeStudyPlanParams } = loadStudlinModule();
    const shaky = computeStudyPlanParams("exam", 25, "shaky", 0);
    const okay = computeStudyPlanParams("exam", 25, "okay", 0);
    const solid = computeStudyPlanParams("exam", 25, "solid", 0);
    assert.equal(okay.difficultyValue, 500, "okay should be the neutral midpoint, same as every other difficulty default in this file");
    assert.ok(shaky.difficultyValue > okay.difficultyValue, "shaky reads as harder-for-the-student, higher on the scale");
    assert.ok(solid.difficultyValue < okay.difficultyValue);
  });

  test("an unrecognized confidence level falls back to okay rather than throwing", () => {
    const { computeStudyPlanParams } = loadStudlinModule();
    assert.doesNotThrow(() => computeStudyPlanParams("exam", 25, "bogus", 0));
    const fallback = computeStudyPlanParams("exam", 25, "bogus", 0);
    const okay = computeStudyPlanParams("exam", 25, "okay", 0);
    assert.deepEqual(fallback, okay);
  });

  test("characterization: omitting importanceLevel is byte-identical to before this parameter existed", () => {
    const { computeStudyPlanParams } = loadStudlinModule();
    const withoutParam = computeStudyPlanParams("exam", 25, "okay", 0);
    const explicitUndefined = computeStudyPlanParams("exam", 25, "okay", 0, undefined);
    assert.deepEqual(withoutParam, explicitUndefined);
    assert.equal(withoutParam.sessionDuration, 25, "sanity check against the known pre-existing output for these inputs");
  });

  test("a critical exam gets longer sessions than a minor one at identical confidence", () => {
    const { computeStudyPlanParams } = loadStudlinModule();
    const minor = computeStudyPlanParams("exam", 25, "okay", 0, "minor");
    const critical = computeStudyPlanParams("exam", 25, "okay", 0, "critical");
    assert.ok(critical.sessionDuration > minor.sessionDuration, "importance should now scale duration, not just session count");
  });

  test("moderate importance is a no-op on duration (multiplier 1.0)", () => {
    const { computeStudyPlanParams } = loadStudlinModule();
    const noImportance = computeStudyPlanParams("exam", 25, "okay", 0);
    const moderate = computeStudyPlanParams("exam", 25, "okay", 0, "moderate");
    assert.equal(moderate.sessionDuration, noImportance.sessionDuration);
  });

  test("an unrecognized importanceLevel is a safe no-op rather than throwing", () => {
    const { computeStudyPlanParams } = loadStudlinModule();
    assert.doesNotThrow(() => computeStudyPlanParams("exam", 25, "okay", 0, "not-a-real-level"));
  });
});

describe("suggestDurationFor (historical duration learning)", () => {
  function doneSession(overrides) {
    return {
      id: "s1", subject: "Chemistry", kind: "study block", status: "done",
      timeSpent: 30, difficulty: 500, ...overrides,
    };
  }

  test("returns null with no completed sessions for that subject+kind", () => {
    const m = loadStudlinModule();
    m.lsSet("events", []);
    assert.equal(m.suggestDurationFor("Chemistry", "study block"), null);
  });

  test("falls back to the coarse subject+kind median when no difficulty is passed", () => {
    const m = loadStudlinModule();
    m.lsSet("events", [doneSession({ id: "s1", timeSpent: 20 }), doneSession({ id: "s2", timeSpent: 40 })]);
    assert.equal(m.suggestDurationFor("Chemistry", "study block"), 30);
  });

  test("falls back to the coarse median when a difficulty bucket is under the minimum sample size", () => {
    const m = loadStudlinModule();
    // Only 2 "hard" sessions -- well under TIER0_MIN_BUCKET_SAMPLE (8) --
    // must not be trusted on its own even though a difficulty was passed.
    const events = [
      doneSession({ id: "hard-1", timeSpent: 60, difficulty: 900 }),
      doneSession({ id: "hard-2", timeSpent: 60, difficulty: 900 }),
      doneSession({ id: "easy-1", timeSpent: 20, difficulty: 100 }),
      doneSession({ id: "easy-2", timeSpent: 20, difficulty: 100 }),
    ];
    m.lsSet("events", events);
    const coarseMedian = m.suggestDurationFor("Chemistry", "study block");
    const withDifficulty = m.suggestDurationFor("Chemistry", "study block", 900);
    assert.equal(withDifficulty, coarseMedian, "under-sampled bucket must fall back to the coarse median, not trust 2 samples");
  });

  test("uses the finer difficulty-tier median once the bucket has enough samples", () => {
    const m = loadStudlinModule();
    const hardSessions = Array.from({ length: 8 }, (_, i) => doneSession({ id: "hard-" + i, timeSpent: 60, difficulty: 900 }));
    const easySessions = Array.from({ length: 8 }, (_, i) => doneSession({ id: "easy-" + i, timeSpent: 15, difficulty: 100 }));
    m.lsSet("events", [...hardSessions, ...easySessions]);
    assert.equal(m.suggestDurationFor("Chemistry", "study block", 900), 60, "well-sampled hard bucket should win over the mixed coarse median");
    assert.equal(m.suggestDurationFor("Chemistry", "study block", 100), 15, "well-sampled easy bucket should win too");
  });
});
