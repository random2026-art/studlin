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

  test("a couple of completed sessions is not enough sample size to fully trust -- but isn't thrown away either, just blended toward the generic default so one gamed 'Begin then Complete' entry can't single-handedly set the duration", () => {
    const m = loadStudlinModule();
    m.lsSet("events", [doneSession({ id: "s1", timeSpent: 1 }), doneSession({ id: "s2", timeSpent: 1 })]);
    // Below TIER0_MIN_BUCKET_SAMPLE (8), real-but-thin data is graduated
    // toward DURATION_GENERIC_DEFAULT (25) instead of discarded outright
    // (see CLAUDE.md's Certainty & Prediction Rules) -- 2/8 real weight
    // pulls the estimate only modestly off 25, nowhere near the gamed
    // 1-minute entries themselves. Same protection the old null return
    // gave against gaming, just not all-or-nothing about it.
    assert.equal(m.suggestDurationFor("Chemistry", "study block"), 20);
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
    // A stricter minSamples=16 means the same 8 samples are only halfway
    // to full trust (8/16), so the estimate blends toward the generic
    // default instead of being fully trusted OR thrown away -- 45 and 25
    // blended 50/50 lands at 35, not the raw 45.
    assert.equal(m.suggestDurationFor("Chemistry", "study block", undefined, 16), 35, "a stricter caller-supplied minSamples should only partially trust the same 8 samples");
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

  // 2026-08-25: the new "Task" type (Add Task) reuses kind:"study block" so
  // it shares the same scheduling/reflow machinery as a real Study
  // Session, but is stamped isGeneralTask:true so it never pollutes a real
  // subject's duration-learning median -- a subject someone occasionally
  // tags a chore under (e.g. "return library books" under Calculus II)
  // shouldn't have its predicted study duration quietly pulled toward
  // that chore's length.
  test("isGeneralTask completions are excluded from a real subject's duration median", () => {
    const m = loadStudlinModule();
    const realStudySessions = Array.from({ length: 8 }, (_, i) => doneSession({ id: "real-" + i, timeSpent: 30 }));
    const choreTasks = Array.from({ length: 8 }, (_, i) => doneSession({ id: "chore-" + i, timeSpent: 5, isGeneralTask: true }));
    m.lsSet("events", [...realStudySessions, ...choreTasks]);
    assert.equal(m.suggestDurationFor("Chemistry", "study block"), 30, "the 5-minute chore completions must not drag the median down");
  });

  test("isGeneralTask completions alone never produce a duration suggestion, even well past the sample floor", () => {
    const m = loadStudlinModule();
    const choreTasks = Array.from({ length: 8 }, (_, i) => doneSession({ id: "chore-" + i, timeSpent: 20, isGeneralTask: true }));
    m.lsSet("events", choreTasks);
    assert.equal(m.suggestDurationFor("Chemistry", "study block"), null);
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

  describe("below-threshold blending (graduated confidence instead of a null-vs-full-trust cliff)", () => {
    test("reaches exactly the raw median right at minN -- no discontinuity at the old cliff's boundary", () => {
      const m = loadStudlinModule();
      const events = Array.from({ length: 8 }, (_, i) => doneSession({ id: "e-" + i, timeSpent: 50 }));
      m.lsSet("events", events);
      assert.equal(m.suggestDurationFor("Chemistry", "study block"), 50, "at minN, full trust -- same as before");
    });

    test("more real samples (still below minN) trust the data more, moving further from the generic default", () => {
      const two = [doneSession({ id: "a", timeSpent: 60 }), doneSession({ id: "b", timeSpent: 60 })];
      const six = Array.from({ length: 6 }, (_, i) => doneSession({ id: "s" + i, timeSpent: 60 }));
      const mTwo = loadStudlinModule();
      mTwo.lsSet("events", two);
      const mSix = loadStudlinModule();
      mSix.lsSet("events", six);
      const withTwo = mTwo.suggestDurationFor("Chemistry", "study block");
      const withSix = mSix.suggestDurationFor("Chemistry", "study block");
      assert.ok(withSix > withTwo, `6 real samples (${withSix}) should sit closer to the true 60min than 2 samples (${withTwo})`);
      assert.ok(withTwo > 25, "even 2 real samples should move the estimate off the flat generic default");
    });

    test("zero real samples still returns null when the student has no broader history to personalize from either -- caller's own ||25 applies", () => {
      const m = loadStudlinModule();
      m.lsSet("events", []);
      assert.equal(m.suggestDurationFor("Chemistry", "study block"), null);
    });
  });

  describe("personalized fallback (studentBaselineDuration) -- replaces the old flat 25-minute default with this student's own cross-subject pace", () => {
    test("studentBaselineDuration is null below the sample floor, same gate as everything else here", () => {
      const m = loadStudlinModule();
      m.lsSet("events", Array.from({ length: 7 }, (_, i) => doneSession({ id: "e-" + i, subject: "Physics", timeSpent: 90 })));
      assert.equal(m.studentBaselineDuration(), null);
    });

    test("studentBaselineDuration is this student's own median across every subject, once there's enough of it", () => {
      const m = loadStudlinModule();
      const events = Array.from({ length: 8 }, (_, i) => doneSession({ id: "e-" + i, subject: "Physics", timeSpent: 90 }));
      m.lsSet("events", events);
      assert.equal(m.studentBaselineDuration(), 90);
    });

    test("a brand-new subject (zero samples) uses the student's own baseline instead of returning null, when they have one", () => {
      const m = loadStudlinModule();
      // 8 real Physics sessions at 90min establish this student's baseline;
      // Chemistry has never been touched at all.
      const physics = Array.from({ length: 8 }, (_, i) => doneSession({ id: "p-" + i, subject: "Physics", timeSpent: 90 }));
      m.lsSet("events", physics);
      assert.equal(m.suggestDurationFor("Chemistry", "study block"), 90, "a new class should start from what this student is actually like, not a flat platform-wide constant");
    });

    test("below-threshold blending targets the student's own baseline instead of the flat generic default, once they have one", () => {
      const m = loadStudlinModule();
      // 8 Physics sessions at 90min (this student's real baseline, clearly
      // not the old flat 25) + 2 thin real Chemistry sessions at 90min too.
      // If the blend still targeted the flat 25 default, 2/8 real weight on
      // a 90min median would land well below 90; targeting the 90min
      // baseline instead means the blend barely needs to move at all.
      const physics = Array.from({ length: 8 }, (_, i) => doneSession({ id: "p-" + i, subject: "Physics", timeSpent: 90 }));
      const chemistry = [doneSession({ id: "c1", timeSpent: 90 }), doneSession({ id: "c2", timeSpent: 90 })];
      m.lsSet("events", [...physics, ...chemistry]);
      const result = m.suggestDurationFor("Chemistry", "study block");
      assert.ok(result > 60, `blend should land near the 90min personal baseline, not pulled down toward the old flat 25 default, got ${result}`);
    });

    test("a student with no broader history yet still falls all the way back to the flat generic default -- personalization needs real evidence too", () => {
      const m = loadStudlinModule();
      m.lsSet("events", []);
      assert.equal(m.suggestDurationFor("Chemistry", "study block"), null, "no baseline AND no subject data -- null, caller's own ||25 still applies");
    });
  });

  describe("subjectDurationOverride (student-edited Insights tab correction)", () => {
    test("an override wins outright, ignoring real completion history entirely", () => {
      const m = loadStudlinModule();
      const events = Array.from({ length: 8 }, (_, i) => doneSession({ id: "e-" + i, timeSpent: 60 }));
      m.lsSet("events", events);
      m.lsSet("subjectDurationOverride", { Chemistry: 45 });
      assert.equal(m.suggestDurationFor("Chemistry", "study block"), 45);
    });

    test("with zero real history, an override still returns the student's number instead of null", () => {
      const m = loadStudlinModule();
      m.lsSet("events", []);
      m.lsSet("subjectDurationOverride", { Chemistry: 50 });
      assert.equal(m.suggestDurationFor("Chemistry", "study block"), 50);
    });

    test("an override for one subject doesn't touch another subject's real learned duration", () => {
      const m = loadStudlinModule();
      const events = Array.from({ length: 8 }, (_, i) => doneSession({ id: "e-" + i, timeSpent: 60 }));
      m.lsSet("events", events);
      m.lsSet("subjectDurationOverride", { Biology: 20 });
      assert.equal(m.suggestDurationFor("Chemistry", "study block"), 60, "Chemistry has no override, so it should still learn from its own real data");
    });
  });

  describe("timeSpentSource:'self-reported' (the non-timer duration follow-up) counts for less than a timer-measured sample", () => {
    test("a self-reported sample still counts toward the sample-size gate, but is discounted in the median itself", () => {
      const m = loadStudlinModule();
      // 4 real 20min timer sessions + 4 self-reported 60min guesses. An
      // unweighted median of [20,20,20,20,60,60,60,60] would be 40; the
      // self-reported group's halved credit should pull the result below
      // that, toward the timer-measured 20min group instead.
      const timed = Array.from({ length: 4 }, (_, i) => doneSession({ id: "t-" + i, timeSpent: 20 }));
      const selfReported = Array.from({ length: 4 }, (_, i) => doneSession({ id: "sr-" + i, timeSpent: 60, timeSpentSource: "self-reported" }));
      m.lsSet("events", [...timed, ...selfReported]);
      const result = m.suggestDurationFor("Chemistry", "study block");
      assert.ok(result < 40, "self-reported samples should be discounted below an unweighted median of 40, got " + result);
    });

    test("all-timer data of the exact same shape is unaffected by the self-report discount", () => {
      const m = loadStudlinModule();
      const events = [
        ...Array.from({ length: 4 }, (_, i) => doneSession({ id: "a-" + i, timeSpent: 20 })),
        ...Array.from({ length: 4 }, (_, i) => doneSession({ id: "b-" + i, timeSpent: 40 })),
      ];
      m.lsSet("events", events);
      assert.equal(m.suggestDurationFor("Chemistry", "study block"), 30, "identical to the existing untouched-by-self-report-discount test above");
    });
  });
});

describe("durationSampleCountFor (the follow-up question's own trigger gate)", () => {
  function doneSession(overrides) {
    return { id: "s1", subject: "Chemistry", kind: "study block", status: "done", timeSpent: 30, ...overrides };
  }
  test("mirrors suggestDurationFor's own filter -- same exclusions, same count", () => {
    const m = loadStudlinModule();
    const real = Array.from({ length: 3 }, (_, i) => doneSession({ id: "r-" + i }));
    const chores = Array.from({ length: 2 }, (_, i) => doneSession({ id: "c-" + i, isGeneralTask: true }));
    m.lsSet("events", [...real, ...chores]);
    assert.equal(m.durationSampleCountFor("Chemistry", "study block"), 3, "isGeneralTask completions must not inflate the count, same as suggestDurationFor");
  });
  test("zero for a subject/kind with no completions at all", () => {
    const m = loadStudlinModule();
    m.lsSet("events", []);
    assert.equal(m.durationSampleCountFor("Chemistry", "study block"), 0);
  });
});

describe("computeSubjectDurationInsights (Insights tab's duration card)", () => {
  function doneSession(overrides) {
    return { id: "s1", subject: "Chemistry", kind: "study block", status: "done", timeSpent: 30, ...overrides };
  }
  test("a subject with zero data and no override is dropped entirely, not shown as a fake row", () => {
    const m = loadStudlinModule();
    m.lsSet("events", []);
    assert.equal(m.computeSubjectDurationInsights(["Chemistry"]).length, 0);
  });
  test("below the sample floor: shown, but flagged not confident", () => {
    const m = loadStudlinModule();
    m.lsSet("events", [doneSession({ id: "a" }), doneSession({ id: "b" })]);
    const rows = m.computeSubjectDurationInsights(["Chemistry"]);
    assert.equal(rows.length, 1);
    assert.equal(rows[0].isConfident, false);
    assert.equal(rows[0].sampleCount, 2);
  });
  test("at/above the sample floor: flagged confident", () => {
    const m = loadStudlinModule();
    m.lsSet("events", Array.from({ length: 8 }, (_, i) => doneSession({ id: "e-" + i })));
    const rows = m.computeSubjectDurationInsights(["Chemistry"]);
    assert.equal(rows[0].isConfident, true);
  });
  test("an override alone (zero real data) is shown, confident, and flagged as the student's own number", () => {
    const m = loadStudlinModule();
    m.lsSet("events", []);
    m.lsSet("subjectDurationOverride", { Chemistry: 40 });
    const rows = m.computeSubjectDurationInsights(["Chemistry"]);
    assert.equal(rows.length, 1);
    assert.equal(rows[0].minutes, 40);
    assert.equal(rows[0].isOverridden, true);
    assert.equal(rows[0].isConfident, true);
  });
  test("a confident, non-overridden subject carries a real spread range, not just the single point estimate", () => {
    const m = loadStudlinModule();
    const events = [20, 20, 30, 30, 40, 40, 50, 50].map((t, i) => doneSession({ id: "e-" + i, timeSpent: t }));
    m.lsSet("events", events);
    const rows = m.computeSubjectDurationInsights(["Chemistry"]);
    assert.ok(rows[0].range, "a well-sampled subject should carry a range");
    assert.ok(rows[0].range.low < rows[0].range.high, "range should be a real spread, not a single point");
  });
  test("an overridden subject never shows a computed range -- the override IS the number, there's nothing to spread", () => {
    const m = loadStudlinModule();
    m.lsSet("events", Array.from({ length: 8 }, (_, i) => doneSession({ id: "e-" + i, timeSpent: 60 })));
    m.lsSet("subjectDurationOverride", { Chemistry: 45 });
    const rows = m.computeSubjectDurationInsights(["Chemistry"]);
    assert.equal(rows[0].range, null);
  });
  test("a still-thin subject carries no range either -- too few real points for a spread to mean anything", () => {
    const m = loadStudlinModule();
    m.lsSet("events", [doneSession({ id: "a" }), doneSession({ id: "b" })]);
    const rows = m.computeSubjectDurationInsights(["Chemistry"]);
    assert.equal(rows[0].range, null);
  });
});

describe("durationRangeFor (the Insights card's honest spread, not a fake-precise point number)", () => {
  function doneSession(overrides) {
    return { id: "s1", subject: "Chemistry", kind: "study block", status: "done", timeSpent: 30, ...overrides };
  }
  test("null below its own sample floor (4) -- fewer real points aren't a real spread", () => {
    const m = loadStudlinModule();
    m.lsSet("events", [doneSession({ id: "a", timeSpent: 20 }), doneSession({ id: "b", timeSpent: 40 }), doneSession({ id: "c", timeSpent: 60 })]);
    assert.equal(m.durationRangeFor("Chemistry", "study block"), null);
  });
  test("a real 25th-75th percentile spread once there's enough data", () => {
    const m = loadStudlinModule();
    const events = [10, 20, 30, 40, 50, 60, 70, 80].map((t, i) => doneSession({ id: "e-" + i, timeSpent: t }));
    m.lsSet("events", events);
    const range = m.durationRangeFor("Chemistry", "study block");
    assert.ok(range.low < range.high);
    assert.ok(range.low >= 15, "the range floor should never drop below the app-wide 15min minimum");
  });
  test("all-identical durations collapse to a zero-width range, not an error", () => {
    const m = loadStudlinModule();
    const events = Array.from({ length: 4 }, (_, i) => doneSession({ id: "e-" + i, timeSpent: 50 }));
    m.lsSet("events", events);
    const range = m.durationRangeFor("Chemistry", "study block");
    assert.equal(range.low, 50);
    assert.equal(range.high, 50);
  });
});

describe("computeSubjectExamPrepTotals (total study time before an exam, split by quiz vs. major)", () => {
  function examEvent(overrides) {
    return { id: "exam1", subject: "Chemistry", kind: "exam", status: "done", examWeight: "major", ...overrides };
  }
  function prepSession(overrides) {
    return { id: "p1", subject: "Chemistry", kind: "study block", status: "done", isExamPrepSession: true, dueEventId: "exam1", timeSpent: 60, ...overrides };
  }
  test("no exams at all -- empty result, not a fabricated zero", () => {
    const m = loadStudlinModule();
    m.lsSet("events", []);
    assert.equal(m.computeSubjectExamPrepTotals("Chemistry").length, 0);
  });
  test("an exam with a plan but zero completed prep sessions contributes nothing -- it's not evidence either way", () => {
    const m = loadStudlinModule();
    m.lsSet("events", [examEvent({})]);
    assert.equal(m.computeSubjectExamPrepTotals("Chemistry").length, 0);
  });
  test("a still-upcoming (not done) exam is excluded even if it somehow has completed prep sessions", () => {
    const m = loadStudlinModule();
    m.lsSet("events", [examEvent({ status: "pending" }), prepSession({})]);
    assert.equal(m.computeSubjectExamPrepTotals("Chemistry").length, 0);
  });
  test("sums real completed prep time per exam, below its own MIN_EXAMS_FOR_PREP_TOTAL floor it's flagged not confident", () => {
    const m = loadStudlinModule();
    m.lsSet("events", [examEvent({}), prepSession({ id: "p1", timeSpent: 60 }), prepSession({ id: "p2", timeSpent: 40 })]);
    const rows = m.computeSubjectExamPrepTotals("Chemistry");
    assert.equal(rows.length, 1);
    assert.equal(rows[0].minutes, 100, "should sum, not average, the sessions within one exam");
    assert.equal(rows[0].examCount, 1);
    assert.equal(rows[0].isConfident, false, "only one real exam -- below the 2-exam floor");
  });
  test("quiz and major exams are split into separate rows, never averaged together", () => {
    const m = loadStudlinModule();
    m.lsSet("events", [
      examEvent({ id: "quiz1", examWeight: "quiz" }), prepSession({ id: "pq1", dueEventId: "quiz1", timeSpent: 30 }),
      examEvent({ id: "quiz2", examWeight: "quiz" }), prepSession({ id: "pq2", dueEventId: "quiz2", timeSpent: 50 }),
      examEvent({ id: "final1", examWeight: "major" }), prepSession({ id: "pf1", dueEventId: "final1", timeSpent: 600 }),
      examEvent({ id: "final2", examWeight: "major" }), prepSession({ id: "pf2", dueEventId: "final2", timeSpent: 700 }),
    ]);
    const rows = m.computeSubjectExamPrepTotals("Chemistry");
    const quiz = rows.find(r => r.weight === "quiz"), major = rows.find(r => r.weight === "major");
    assert.ok(quiz && major, "both weight buckets should be present");
    assert.ok(quiz.minutes < major.minutes, "a quiz's real total shouldn't be dragged up by a final's, or vice versa");
    assert.equal(quiz.isConfident, true, "2 real quizzes clears MIN_EXAMS_FOR_PREP_TOTAL");
    assert.equal(major.isConfident, true, "2 real finals clears MIN_EXAMS_FOR_PREP_TOTAL");
  });
  test("only counts this exact subject -- a different subject's exams never leak in", () => {
    const m = loadStudlinModule();
    m.lsSet("events", [examEvent({ subject: "Physics" }), prepSession({ subject: "Physics" })]);
    assert.equal(m.computeSubjectExamPrepTotals("Chemistry").length, 0);
  });
});

describe("question-asking dismiss streaks (recordQuestionDismissed/recordQuestionAnswered)", () => {
  test("a skip below the streak limit does not auto-off the toggle", () => {
    const m = loadStudlinModule();
    m.lsSet("settings", { askDurationQuestions: true });
    const r1 = m.recordQuestionDismissed("duration");
    const r2 = m.recordQuestionDismissed("duration");
    assert.equal(r1.autoOff, false);
    assert.equal(r2.autoOff, false);
    assert.equal(m.lsGet("settings", {}).askDurationQuestions, true, "toggle must stay on below the streak limit");
  });

  test("hitting the streak limit auto-flips the matching toggle off and resets the streak", () => {
    const m = loadStudlinModule();
    m.lsSet("settings", { askCheckIns: true });
    m.recordQuestionDismissed("checkIn");
    m.recordQuestionDismissed("checkIn");
    const r3 = m.recordQuestionDismissed("checkIn");
    assert.equal(r3.autoOff, true);
    assert.equal(r3.prefKey, "askCheckIns");
    assert.equal(m.lsGet("settings", {}).askCheckIns, false, "the matching toggle should have been flipped off");
    assert.equal(m.lsGet("questionDismissStreak", {}).checkIn, 0, "streak resets once it fires, so it doesn't refire every subsequent skip");
  });

  test("a real answer resets the streak -- an impatient moment followed by engagement doesn't get punished", () => {
    const m = loadStudlinModule();
    m.lsSet("settings", { askDurationQuestions: true });
    m.recordQuestionDismissed("duration");
    m.recordQuestionDismissed("duration");
    m.recordQuestionAnswered("duration");
    const r3 = m.recordQuestionDismissed("duration");
    assert.equal(r3.autoOff, false, "the streak should have been reset by the real answer in between");
  });

  test("the two kinds track independent streaks", () => {
    const m = loadStudlinModule();
    m.lsSet("settings", { askCheckIns: true, askDurationQuestions: true });
    m.recordQuestionDismissed("checkIn");
    m.recordQuestionDismissed("checkIn");
    m.recordQuestionDismissed("checkIn");
    assert.equal(m.lsGet("settings", {}).askDurationQuestions, true, "dismissing check-ins repeatedly must not touch the separate duration toggle");
  });
});

describe("duration-question per-subject cooldown (isDurationQuestionOnCooldown/dismissDurationQuestion)", () => {
  test("not on cooldown before any dismissal", () => {
    const m = loadStudlinModule();
    assert.equal(m.isDurationQuestionOnCooldown("Chemistry", "study block"), false);
  });
  test("dismissing puts that exact subject+kind on cooldown", () => {
    const m = loadStudlinModule();
    m.dismissDurationQuestion("Chemistry", "study block");
    assert.equal(m.isDurationQuestionOnCooldown("Chemistry", "study block"), true);
  });
  test("cooldown is scoped to the specific subject -- a different subject is unaffected", () => {
    const m = loadStudlinModule();
    m.dismissDurationQuestion("Chemistry", "study block");
    assert.equal(m.isDurationQuestionOnCooldown("Biology", "study block"), false);
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
