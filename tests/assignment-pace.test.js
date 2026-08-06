// computeAssignmentPace -- compares real logged minutes (timeSpent, from
// the Lock-In Timer) against a straight-line pace through the same
// startDate/finishByDate window Attack Block's own gate already computes,
// so this can never disagree with Attack Block about when work "should"
// have started. Concrete numbers below are derived from the real gate
// constants (ATTACK_BLOCK_GATE_PADDING=1.5, FINISH_BUFFER_DAYS=4,
// SUSTAINABLE_WEEKLY_MINS=210) for a 10-hour (600min) estimate:
//   paddedMins = 900, weeksNeeded = ceil(900/210) = 5
//   deadline 2026-10-01 -> finishBy 2026-09-27 -> startDate 2026-08-23
//   (35-day window)
const { test, describe } = require("node:test");
const assert = require("node:assert/strict");
const { loadStudlinModule } = require("./harness.js");

const BASE_EV = {
  id: "ev1", kind: "deadline", status: "pending", checklist: false,
  date: "2026-10-01", deadline: null, estimatedHours: 10,
};

describe("computeAssignmentPace", () => {
  test("null when there's nothing to judge against", () => {
    const m = loadStudlinModule();
    assert.equal(m.computeAssignmentPace(null, [], "2026-09-13"), null);
    assert.equal(m.computeAssignmentPace({ ...BASE_EV, checklist: true }, [], "2026-09-13"), null);
    assert.equal(m.computeAssignmentPace({ ...BASE_EV, status: "done" }, [], "2026-09-13"), null);
    assert.equal(m.computeAssignmentPace({ ...BASE_EV, date: "" }, [], "2026-09-13"), null);
    assert.equal(m.computeAssignmentPace({ ...BASE_EV, kind: "exam" }, [], "2026-09-13"), null);
  });

  test("null before the gate's own start date -- too early to call it behind", () => {
    const m = loadStudlinModule();
    // Gate start is 2026-08-23 for this estimate/deadline -- one day
    // before it, nothing was expected yet.
    assert.equal(m.computeAssignmentPace(BASE_EV, [], "2026-08-22"), null);
  });

  test("behind when logged well under half of the expected-by-now pace", () => {
    const m = loadStudlinModule();
    // 21 of 35 days elapsed (60%) -> expected 360 of 600 min. Nothing
    // logged at all is the clearest possible "behind" case.
    const result = m.computeAssignmentPace(BASE_EV, [], "2026-09-13");
    assert.ok(result);
    assert.equal(result.behind, true);
    assert.equal(Math.round(result.expectedMins), 360);
    assert.equal(result.loggedMins, 0);
    assert.equal(result.gate.startDate, "2026-08-23");
    assert.equal(result.gate.finishByDate, "2026-09-27");
  });

  test("not behind once logged time clears the threshold", () => {
    const m = loadStudlinModule();
    // Same 360min expected-by-now; 400min actually logged across two
    // linked blocks clears the ASSIGNMENT_BEHIND_THRESHOLD (0.5 of 360 = 180).
    const linked = [
      { id: "b1", dueEventId: "ev1", timeSpent: 250 },
      { id: "b2", dueEventId: "ev1", timeSpent: 150 },
      { id: "other", dueEventId: "some-other-ev", timeSpent: 9999 }, // must not count
    ];
    const result = m.computeAssignmentPace(BASE_EV, linked, "2026-09-13");
    assert.ok(result);
    assert.equal(result.behind, false);
    assert.equal(result.loggedMins, 400);
  });

  test("right at the threshold boundary is NOT behind (strict less-than)", () => {
    const m = loadStudlinModule();
    // expectedMins=360, threshold=180 exactly -- logging exactly 180
    // should not trip "behind" (behind is loggedMins < expected*threshold).
    const linked = [{ id: "b1", dueEventId: "ev1", timeSpent: 180 }];
    const result = m.computeAssignmentPace(BASE_EV, linked, "2026-09-13");
    assert.equal(result.behind, false);
  });

  test("clamps expected pace at 100% once past the finish-by date", () => {
    const m = loadStudlinModule();
    // Well past finishByDate (2026-09-27) -- expected should cap at the
    // full 600min estimate, not keep climbing past 100%.
    const result = m.computeAssignmentPace(BASE_EV, [], "2026-12-01");
    assert.equal(Math.round(result.expectedMins), 600);
  });

  test("falls back to ATTACK_BLOCK_DEFAULT_ESTIMATE_HOURS when unset", () => {
    const m = loadStudlinModule();
    const noEstimate = { ...BASE_EV, estimatedHours: null };
    const withDefault = { ...BASE_EV, estimatedHours: m.ATTACK_BLOCK_DEFAULT_ESTIMATE_HOURS };
    // Same gate/expected math either way -- confirms the fallback is
    // actually wired in, not silently producing a different (e.g. null)
    // gate for the unset case.
    const a = m.computeAssignmentPace(noEstimate, [], "2026-09-13");
    const b = m.computeAssignmentPace(withDefault, [], "2026-09-13");
    assert.deepEqual(a, b);
  });

  test("regression: with uniform hours (the default), an explicit prefs arg matches the no-prefs fallback exactly", () => {
    const m = loadStudlinModule();
    const withoutPrefs = m.computeAssignmentPace(BASE_EV, [], "2026-09-13");
    const withDefaultPrefs = m.computeAssignmentPace(BASE_EV, [], "2026-09-13", m.getSchedulePreferences());
    assert.equal(Math.round(withDefaultPrefs.expectedMins), Math.round(withoutPrefs.expectedMins));
    assert.equal(Math.round(withoutPrefs.expectedMins), 360);
  });

  test("regression: a lighter weekend window lowers the expected-by-now bar instead of assuming every day is equally productive", () => {
    const m = loadStudlinModule();
    // Same 35-day gate window (2026-08-23 to 2026-09-27). 2026-08-31 is 8
    // days in -- deliberately NOT a checkpoint that's a whole multiple of 7
    // days (unlike the 21/35 elapsed/total split used elsewhere in this
    // file), because when both the elapsed and total windows are exact
    // week multiples the weekend ratio is identical in each and a
    // capacity-weighted average degenerates back to the flat day-count
    // fraction by coincidence -- this date was chosen specifically to make
    // the elapsed portion more weekend-heavy than the window as a whole,
    // so the two calculations must actually diverge.
    const uniformResult = m.computeAssignmentPace(BASE_EV, [], "2026-08-31", m.getSchedulePreferences());
    const lightWeekendPrefs = { ...m.getSchedulePreferences(), weekendEnabled: true, weekendStartTime: "10:00", weekendEndTime: "12:00" };
    const weightedResult = m.computeAssignmentPace(BASE_EV, [], "2026-08-31", lightWeekendPrefs);
    assert.ok(
      weightedResult.expectedMins < uniformResult.expectedMins,
      `expected weighted (${weightedResult.expectedMins}) < uniform (${uniformResult.expectedMins})`
    );
  });

  test("ahead:true when logged well over the ASSIGNMENT_AHEAD_THRESHOLD multiple of expected-by-now pace", () => {
    const m = loadStudlinModule();
    // expectedMins=360, AHEAD_THRESHOLD=1.5 -> need >540 logged.
    const linked = [{ id: "b1", dueEventId: "ev1", timeSpent: 600 }];
    const result = m.computeAssignmentPace(BASE_EV, linked, "2026-09-13");
    assert.equal(result.ahead, true);
    assert.equal(result.behind, false);
  });

  test("ahead:false when logged is close to expected but under the ahead threshold", () => {
    const m = loadStudlinModule();
    const linked = [{ id: "b1", dueEventId: "ev1", timeSpent: 400 }];
    const result = m.computeAssignmentPace(BASE_EV, linked, "2026-09-13");
    assert.equal(result.ahead, false);
    assert.equal(result.behind, false);
  });

  test("regression: a genuinely behind-pace case is never also reported ahead", () => {
    const m = loadStudlinModule();
    const result = m.computeAssignmentPace(BASE_EV, [], "2026-09-13");
    assert.equal(result.behind, true);
    assert.equal(result.ahead, false);
  });
});

describe("isPaceNudgeDismissed / dismissPaceNudge", () => {
  test("not dismissed until explicitly dismissed", () => {
    const m = loadStudlinModule();
    assert.equal(m.isPaceNudgeDismissed("ev1"), false);
  });

  test("dismissing one assignment doesn't dismiss another", () => {
    const m = loadStudlinModule();
    m.dismissPaceNudge("ev1");
    assert.equal(m.isPaceNudgeDismissed("ev1"), true);
    assert.equal(m.isPaceNudgeDismissed("ev2"), false);
  });
});
