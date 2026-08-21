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

describe("defaultSessionCountFor (2026-08-20, corrected: runway drives count, type/importance only sets a ceiling)", () => {
  // First pass at this gave every critical exam a flat 5 sessions no
  // matter what -- real feedback: "dont think finals get 5 sessions
  // whatever its also depends on when the due date is." Runway (days
  // until the exam) is now the actual driver.
  test("no daysUntil -- byte-identical to the original quiz-vs-everything-else split, regardless of importanceLevel", () => {
    const { defaultSessionCountFor } = loadStudlinModule();
    assert.equal(defaultSessionCountFor("quiz"), 2);
    assert.equal(defaultSessionCountFor("exam"), 4);
    assert.equal(defaultSessionCountFor("exam", "critical"), 4, "no date context -- must not silently assume a flat bump");
  });

  test("a final that's only days away gets FEWER sessions than a final with plenty of runway", () => {
    const { defaultSessionCountFor } = loadStudlinModule();
    const soon = defaultSessionCountFor("exam", "critical", 3);
    const farOut = defaultSessionCountFor("exam", "critical", 30);
    assert.ok(farOut > soon, "far-out final (" + farOut + ") should exceed a final only 3 days away (" + soon + ")");
  });

  test("a quiz stays capped low even with a ton of runway -- more time doesn't mean a quiz needs 6 sessions", () => {
    const { defaultSessionCountFor } = loadStudlinModule();
    const quizFarOut = defaultSessionCountFor("quiz", undefined, 60);
    assert.ok(quizFarOut <= 2, "a quiz should never exceed its own low ceiling, got " + quizFarOut);
  });

  test("a critical final CAN exceed a midterm's ceiling, but only when there's enough runway to earn it", () => {
    const { defaultSessionCountFor } = loadStudlinModule();
    const finalFarOut = defaultSessionCountFor("exam", "critical", 30);
    const midtermFarOut = defaultSessionCountFor("exam", "major", 30);
    const finalSoon = defaultSessionCountFor("exam", "critical", 3);
    const midtermSoon = defaultSessionCountFor("exam", "major", 3);
    assert.ok(finalFarOut > midtermFarOut, "with lots of runway, final (" + finalFarOut + ") should exceed midterm (" + midtermFarOut + ")");
    assert.equal(finalSoon, midtermSoon, "with almost no runway, type shouldn't matter -- both are limited by the same lack of time");
  });

  test("session count is never less than 1 even with almost no runway", () => {
    const { defaultSessionCountFor } = loadStudlinModule();
    assert.ok(defaultSessionCountFor("exam", "critical", 0) >= 1);
    assert.ok(defaultSessionCountFor("exam", "critical", -2) >= 1);
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

  test("a couple of completed sessions is not enough sample size to trust -- one gamed 'Begin then Complete' entry can't single-handedly set the duration", () => {
    const m = loadStudlinModule();
    m.lsSet("events", [doneSession({ id: "s1", timeSpent: 1 }), doneSession({ id: "s2", timeSpent: 1 })]);
    assert.equal(m.suggestDurationFor("Chemistry", "study block"), null, "under the TIER0_MIN_BUCKET_SAMPLE floor -- caller's own baseDuration||25 default should apply instead");
  });

  test("falls back to the coarse subject+kind median once there are enough samples (>= TIER0_MIN_BUCKET_SAMPLE)", () => {
    const m = loadStudlinModule();
    const events = Array.from({ length: 4 }, (_, i) => doneSession({ id: "a-" + i, timeSpent: 20 }))
      .concat(Array.from({ length: 4 }, (_, i) => doneSession({ id: "b-" + i, timeSpent: 40 })));
    m.lsSet("events", events);
    assert.equal(m.suggestDurationFor("Chemistry", "study block"), 30);
  });

  test("an explicit minSamples raises the bar further -- e.g. a critical exam requiring extra-confirmed history", () => {
    const m = loadStudlinModule();
    // 8 samples clears the default floor but not a caller-requested 16.
    const events = Array.from({ length: 8 }, (_, i) => doneSession({ id: "c-" + i, timeSpent: 45 }));
    m.lsSet("events", events);
    assert.equal(m.suggestDurationFor("Chemistry", "study block"), 45, "default threshold trusts 8 samples");
    assert.equal(m.suggestDurationFor("Chemistry", "study block", undefined, 16), null, "a stricter caller-supplied minSamples must not trust the same 8 samples");
  });

  test("the historical-duration floor never drops below 15 minutes even if real completions ran shorter", () => {
    const m = loadStudlinModule();
    const events = Array.from({ length: 8 }, (_, i) => doneSession({ id: "d-" + i, timeSpent: 6 }));
    m.lsSet("events", events);
    assert.equal(m.suggestDurationFor("Chemistry", "study block"), 15);
  });

  test("falls back to the coarse median when a difficulty bucket is under the minimum sample size", () => {
    const m = loadStudlinModule();
    // Only 2 "hard" sessions -- well under TIER0_MIN_BUCKET_SAMPLE (8) --
    // must not be trusted on its own even though a difficulty was passed.
    // 6 more untiered sessions bring the overall pool to 8, clearing the
    // top-level sample gate so this actually exercises the tier-vs-coarse
    // fallback instead of both sides degenerating to null.
    const events = [
      doneSession({ id: "hard-1", timeSpent: 60, difficulty: 900 }),
      doneSession({ id: "hard-2", timeSpent: 60, difficulty: 900 }),
      doneSession({ id: "easy-1", timeSpent: 20, difficulty: 100 }),
      doneSession({ id: "easy-2", timeSpent: 20, difficulty: 100 }),
      ...Array.from({ length: 4 }, (_, i) => doneSession({ id: "mid-" + i, timeSpent: 30, difficulty: 500 })),
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

  describe("2026-08-20: quality-weighted by whether the check-in afterward said the time actually worked", () => {
    test("with no completionLog data at all, behaves exactly as before (every sample full weight)", () => {
      const m = loadStudlinModule();
      m.lsSet("events", [doneSession({ id: "s1", timeSpent: 20 }), doneSession({ id: "s2", timeSpent: 20 }), doneSession({ id: "s3", timeSpent: 20 }), doneSession({ id: "s4", timeSpent: 20 }), doneSession({ id: "s5", timeSpent: 40 }), doneSession({ id: "s6", timeSpent: 40 }), doneSession({ id: "s7", timeSpent: 40 }), doneSession({ id: "s8", timeSpent: 40 })]);
      m.lsSet("completionLog", []);
      assert.equal(m.suggestDurationFor("Chemistry", "study block"), 30);
    });

    test("a session rated shaky (weak evidence the duration was enough) counts as partial evidence, pulling the median toward the sessions that actually worked", () => {
      const m = loadStudlinModule();
      // 4 short (20min) sessions that all went "shaky" (weak evidence 20min
      // is enough) vs 4 long (40min) sessions that were never rated
      // (full weight, unrated = 1.0). An unweighted median of all 8 would
      // land at 30; quality-weighting should pull it toward 40.
      const shortShaky = Array.from({ length: 4 }, (_, i) => doneSession({ id: "short-" + i, timeSpent: 20 }));
      const longUnrated = Array.from({ length: 4 }, (_, i) => doneSession({ id: "long-" + i, timeSpent: 40 }));
      m.lsSet("events", [...shortShaky, ...longUnrated]);
      m.lsSet("completionLog", shortShaky.map(e => ({ taskId: e.id, outcome: "done", rating: "shaky" })));
      const unweighted = 30; // sanity check against the plain median of [20,20,20,20,40,40,40,40]
      const weighted = m.suggestDurationFor("Chemistry", "study block");
      assert.ok(weighted > unweighted, "quality-weighted median (" + weighted + ") should exceed the plain median (" + unweighted + ")");
    });

    test("a session rated solid counts full weight, same as unrated -- no different from today's behavior", () => {
      const m = loadStudlinModule();
      const events = [doneSession({ id: "s1", timeSpent: 20 }), doneSession({ id: "s2", timeSpent: 20 }), doneSession({ id: "s3", timeSpent: 20 }), doneSession({ id: "s4", timeSpent: 20 }), doneSession({ id: "s5", timeSpent: 40 }), doneSession({ id: "s6", timeSpent: 40 }), doneSession({ id: "s7", timeSpent: 40 }), doneSession({ id: "s8", timeSpent: 40 })];
      m.lsSet("events", events);
      m.lsSet("completionLog", events.map(e => ({ taskId: e.id, outcome: "done", rating: "solid" })));
      assert.equal(m.suggestDurationFor("Chemistry", "study block"), 30);
    });

    test("only the most recent completionLog row per taskId is used, matching applyCheckInRating's own convention", () => {
      const m = loadStudlinModule();
      // s0..s3 at 10min, s4..s7 at 50min. s0 has two completionLog rows --
      // an earlier "solid" (full weight) followed by a later "shaky" (weak
      // weight). If the join correctly uses the LATEST row (shaky), the
      // 10-minute group's total weight shrinks and the weighted median
      // should land on the 50-minute side; if it wrongly used the first
      // (stale) row instead, the two groups balance evenly and the median
      // would land between them instead. The two outcomes are far enough
      // apart (50 vs 30) that this only passes if the join is really
      // picking the most recent row.
      const low = Array.from({ length: 4 }, (_, i) => doneSession({ id: "low" + i, timeSpent: 10 }));
      const high = Array.from({ length: 4 }, (_, i) => doneSession({ id: "high" + i, timeSpent: 50 }));
      m.lsSet("events", [...low, ...high]);
      m.lsSet("completionLog", [
        { taskId: "low0", outcome: "done", rating: "solid" },
        { taskId: "low0", outcome: "done", rating: "shaky" },
      ]);
      assert.equal(m.suggestDurationFor("Chemistry", "study block"), 50);
    });
  });
});

describe("gradeWeightNudgeFor (shared by computeSessionPriority and computeStudyPlanParams)", () => {
  test("missing gradeWeightPercent is a pure 0 no-op", () => {
    const { gradeWeightNudgeFor } = loadStudlinModule();
    assert.equal(gradeWeightNudgeFor(null), 0);
    assert.equal(gradeWeightNudgeFor(undefined), 0);
  });
  test("centered at 20 -- a percentage right around there is essentially a no-op", () => {
    const { gradeWeightNudgeFor } = loadStudlinModule();
    assert.equal(gradeWeightNudgeFor(20), 0);
  });
  test("a heavier exam nudges positive, a lighter one nudges negative", () => {
    const { gradeWeightNudgeFor } = loadStudlinModule();
    assert.ok(gradeWeightNudgeFor(50) > 0);
    assert.ok(gradeWeightNudgeFor(5) < 0);
  });
  test("clamped to +-0.15 no matter how extreme the percentage", () => {
    const { gradeWeightNudgeFor } = loadStudlinModule();
    assert.equal(gradeWeightNudgeFor(100), 0.15);
    assert.equal(gradeWeightNudgeFor(0), -0.1);
    assert.ok(gradeWeightNudgeFor(1000) <= 0.15);
  });
});

describe("scoreTierFromPercent / SCORE_TIER_LABEL", () => {
  test("buckets a percent into the 3-tier outcome rubric", () => {
    const { scoreTierFromPercent } = loadStudlinModule();
    assert.equal(scoreTierFromPercent(95), "above");
    assert.equal(scoreTierFromPercent(85), "above");
    assert.equal(scoreTierFromPercent(77), "expected");
    assert.equal(scoreTierFromPercent(70), "expected");
    assert.equal(scoreTierFromPercent(55), "below");
  });
  test("every tier has a human label", () => {
    const { SCORE_TIER_LABEL } = loadStudlinModule();
    assert.ok(SCORE_TIER_LABEL.below);
    assert.ok(SCORE_TIER_LABEL.expected);
    assert.ok(SCORE_TIER_LABEL.above);
  });
});

describe("subjectOutcomeNudge (2026-08-20: past exam outcomes for a subject nudge its future duration)", () => {
  test("fewer than 3 scored exams in the subject -- pure 0 no-op", () => {
    const m = loadStudlinModule();
    m.lsSet("events", [
      { id: "e1", kind: "exam", subject: "Chemistry", scoreTier: "below" },
      { id: "e2", kind: "exam", subject: "Chemistry", scoreTier: "below" },
    ]);
    assert.equal(m.subjectOutcomeNudge("Chemistry"), 0);
  });
  test("consistently scoring below expected nudges duration UP (positive)", () => {
    const m = loadStudlinModule();
    m.lsSet("events", [
      { id: "e1", kind: "exam", subject: "Chemistry", scoreTier: "below" },
      { id: "e2", kind: "exam", subject: "Chemistry", scoreTier: "below" },
      { id: "e3", kind: "exam", subject: "Chemistry", scoreTier: "below" },
    ]);
    assert.ok(m.subjectOutcomeNudge("Chemistry") > 0);
  });
  test("consistently scoring above expected nudges duration DOWN (negative)", () => {
    const m = loadStudlinModule();
    m.lsSet("events", [
      { id: "e1", kind: "exam", subject: "Chemistry", scoreTier: "above" },
      { id: "e2", kind: "exam", subject: "Chemistry", scoreTier: "above" },
      { id: "e3", kind: "exam", subject: "Chemistry", scoreTier: "above" },
    ]);
    assert.ok(m.subjectOutcomeNudge("Chemistry") < 0);
  });
  test("a different subject's scores never bleed into this one", () => {
    const m = loadStudlinModule();
    m.lsSet("events", [
      { id: "e1", kind: "exam", subject: "Biology", scoreTier: "below" },
      { id: "e2", kind: "exam", subject: "Biology", scoreTier: "below" },
      { id: "e3", kind: "exam", subject: "Biology", scoreTier: "below" },
    ]);
    assert.equal(m.subjectOutcomeNudge("Chemistry"), 0);
  });
  test("clamped to +-0.15, same cap as every other nudge", () => {
    const m = loadStudlinModule();
    m.lsSet("events", Array.from({ length: 10 }, (_, i) => ({ id: "e" + i, kind: "exam", subject: "Chemistry", scoreTier: "below" })));
    assert.equal(m.subjectOutcomeNudge("Chemistry"), 0.15);
  });
});

describe("computeStudyPlanParams: gradeWeightPercent and shaky-streak (2026-08-20 additions)", () => {
  test("omitting gradeWeightPercent/confidenceLog is byte-identical to before -- pure additive params", () => {
    const { computeStudyPlanParams } = loadStudlinModule();
    const withoutNew = computeStudyPlanParams("exam", 25, "okay", 0, "major", 20);
    const withExplicitUndefined = computeStudyPlanParams("exam", 25, "okay", 0, "major", 20, undefined, undefined);
    assert.deepEqual(withoutNew, withExplicitUndefined);
  });
  test("a heavier gradeWeightPercent increases duration at identical confidence/importance", () => {
    const { computeStudyPlanParams } = loadStudlinModule();
    const light = computeStudyPlanParams("exam", 25, "okay", 0, "major", 20, 5);
    const heavy = computeStudyPlanParams("exam", 25, "okay", 0, "major", 20, 50);
    assert.ok(heavy.sessionDuration > light.sessionDuration, "heavy-weighted exam (" + heavy.sessionDuration + ") should exceed light-weighted (" + light.sessionDuration + ")");
  });
  test("a shaky streak (2+ in a row) increases both session count and duration beyond a single shaky answer", () => {
    const { computeStudyPlanParams } = loadStudlinModule();
    const singleShaky = computeStudyPlanParams("exam", 25, "shaky", 0, "major", 20, undefined, ["okay", "shaky"]);
    const shakyStreak = computeStudyPlanParams("exam", 25, "shaky", 0, "major", 20, undefined, ["shaky", "shaky"]);
    assert.ok(shakyStreak.sessionDuration > singleShaky.sessionDuration, "streak duration (" + shakyStreak.sessionDuration + ") should exceed single-shaky duration (" + singleShaky.sessionDuration + ")");
    assert.ok(shakyStreak.sessionCount >= singleShaky.sessionCount);
  });
  test("a shaky streak only matters when confidenceLevel is currently shaky -- irrelevant to an okay/solid answer", () => {
    const { computeStudyPlanParams } = loadStudlinModule();
    const withStreak = computeStudyPlanParams("exam", 25, "okay", 0, "major", 20, undefined, ["shaky", "shaky"]);
    const withoutStreak = computeStudyPlanParams("exam", 25, "okay", 0, "major", 20, undefined, []);
    assert.deepEqual(withStreak, withoutStreak);
  });
});
