// Calendar first-visit wizard's new optional "personalize" step --
// applyStudyStylePrefs is the one pure function behind it (everything
// else is component-internal wizard state/JSX, not unit-testable, same
// as the rest of ClassSetupWizard). See studlin-app.jsx's own comment
// above the function for why this is collection-only for now (nothing in
// the placement/priority engine reads studyStylePrefs yet).
const { test, describe } = require("node:test");
const assert = require("node:assert/strict");
const { loadStudlinModule } = require("./harness.js");

describe("applyStudyStylePrefs", () => {
  test("no answers at all -> studyStylePrefs is present with every field null, not omitted", () => {
    const m = loadStudlinModule();
    const next = m.applyStudyStylePrefs({ workStartTime: "09:00" }, {});
    assert.ok(next.studyStylePrefs);
    assert.equal(next.studyStylePrefs.sessionOrder, null);
    assert.equal(next.studyStylePrefs.interleave, null);
    assert.equal(next.studyStylePrefs.planningHorizon, null);
    assert.equal(next.studyStylePrefs.startTiming, null);
    assert.equal(next.studyStylePrefs.collisionPref, null);
  });

  test("all 5 answered -> each real value carried through untouched", () => {
    const m = loadStudlinModule();
    const answers = {
      sessionOrder: "hardest_first",
      interleave: "mix_it_up",
      planningHorizon: "this_week",
      startTiming: "a_few_days_before",
      collisionPref: "split_time",
    };
    const next = m.applyStudyStylePrefs({}, answers);
    assert.equal(next.studyStylePrefs.sessionOrder, "hardest_first");
    assert.equal(next.studyStylePrefs.interleave, "mix_it_up");
    assert.equal(next.studyStylePrefs.planningHorizon, "this_week");
    assert.equal(next.studyStylePrefs.startTiming, "a_few_days_before");
    assert.equal(next.studyStylePrefs.collisionPref, "split_time");
  });

  test("a partial skip -- some answered, some not -- keeps the real ones and nulls the rest", () => {
    const m = loadStudlinModule();
    const next = m.applyStudyStylePrefs({}, { sessionOrder: "easy_first", collisionPref: "finish_one_first" });
    assert.equal(next.studyStylePrefs.sessionOrder, "easy_first");
    assert.equal(next.studyStylePrefs.collisionPref, "finish_one_first");
    assert.equal(next.studyStylePrefs.interleave, null);
    assert.equal(next.studyStylePrefs.planningHorizon, null);
    assert.equal(next.studyStylePrefs.startTiming, null);
  });

  test("every other field on the real schedulePreferences object survives untouched", () => {
    const m = loadStudlinModule();
    const prefs = { workStartTime: "10:00", workEndTime: "18:00", peakHourBuckets: ["morning"], bedtime: "23:00" };
    const next = m.applyStudyStylePrefs(prefs, { sessionOrder: "hardest_first" });
    assert.equal(next.workStartTime, "10:00");
    assert.equal(next.workEndTime, "18:00");
    assert.equal(next.peakHourBuckets.length, 1);
    assert.equal(next.peakHourBuckets[0], "morning");
    assert.equal(next.bedtime, "23:00");
  });

  test("answers is undefined (e.g. a caller that forgot to pass it) -- never throws, everything null", () => {
    const m = loadStudlinModule();
    const next = m.applyStudyStylePrefs({ workStartTime: "09:00" }, undefined);
    assert.equal(next.studyStylePrefs.sessionOrder, null);
    assert.equal(next.studyStylePrefs.collisionPref, null);
  });
});
