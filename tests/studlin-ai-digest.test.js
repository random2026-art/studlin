// Studlin AI Phase 1's digest-assembly and question-routing functions.
// All scenarios below were first verified by directly calling the harness
// (not hand-derived), then pinned as fixed expectations here -- same
// empirical-then-pin approach tests/assignment-pace.test.js's own comment
// already documents for this exact gate-window math.
const { test, describe } = require("node:test");
const assert = require("node:assert/strict");
const { loadStudlinModule } = require("./harness.js");

describe("assembleStudlinAiDigest", () => {
  test("empty events/routines still returns a full 14-day window, all light/zero", () => {
    const m = loadStudlinModule();
    const digest = m.assembleStudlinAiDigest([], [], m.getSchedulePreferences(), "2026-09-13");
    assert.equal(digest.todayKey, "2026-09-13");
    assert.equal(digest.windowEndKey, "2026-09-26");
    assert.equal(digest.windowDays.length, m.STUDLIN_AI_DIGEST_DAYS);
    assert.ok(digest.windowDays.every(d => d.workloadMinutes === 0 && d.tier === "light" && d.items.length === 0));
    assert.equal(digest.busiestDay, null);
    assert.equal(digest.lightestDay, null);
    assert.equal(digest.heavyDayKeys.length, 0);
    assert.equal(digest.overdue.length, 0);
    assert.equal(digest.attackBlockRisks.length, 0);
    assert.equal(digest.assignmentPace.length, 0);
  });

  test("a past, still-pending item shows up as overdue with the right staleness label", () => {
    const m = loadStudlinModule();
    const events = [{ id: "missed1", title: "Old Reading", kind: "study block", status: "pending", date: "2026-09-10", time: "09:00", duration: 30, checklist: false }];
    const digest = m.assembleStudlinAiDigest(events, [], m.getSchedulePreferences(), "2026-09-13");
    assert.equal(digest.overdue.length, 1);
    assert.equal(digest.overdue[0].title, "Old Reading");
    assert.equal(digest.overdue[0].staleDays, 3);
    assert.equal(digest.overdue[0].staleLabel, "the last 3 days");
  });

  test("a class routine materializes into the right day of the window, merged with real events", () => {
    const m = loadStudlinModule();
    // 2026-09-13 is a Sunday -- Monday-first day index 6.
    const routines = [{ id: "r1", title: "Chem Lecture", kind: "class", days: [6], startTime: "10:00", duration: 50, subject: "Chemistry" }];
    const digest = m.assembleStudlinAiDigest([], routines, m.getSchedulePreferences(), "2026-09-13");
    assert.equal(digest.windowDays[0].date, "2026-09-13");
    assert.equal(digest.windowDays[0].items.length, 1);
    assert.equal(digest.windowDays[0].items[0].title, "Chem Lecture");
    assert.equal(digest.windowDays[0].workloadMinutes, 50);
    assert.equal(digest.windowDays[0].tier, "light");
  });

  test("busiest/lightest day and heavy-day flagging reflect real relative workload", () => {
    const m = loadStudlinModule();
    const events = [
      { id: "e1", title: "Big Study Day", kind: "study block", status: "pending", date: "2026-09-15", time: "09:00", duration: 400, checklist: false },
      { id: "e2", title: "Light Task", kind: "study block", status: "pending", date: "2026-09-16", time: "09:00", duration: 20, checklist: false },
    ];
    const digest = m.assembleStudlinAiDigest(events, [], m.getSchedulePreferences(), "2026-09-13");
    assert.equal(digest.busiestDay.date, "2026-09-15");
    assert.equal(digest.busiestDay.workloadMinutes, 400);
    assert.equal(digest.lightestDay.date, "2026-09-16");
    assert.equal(digest.lightestDay.workloadMinutes, 20);
    assert.equal(digest.heavyDayKeys.length, 1);
    assert.equal(digest.heavyDayKeys[0], "2026-09-15");
  });

  test("an Attack Block chain genuinely over capacity shows up as a risk", () => {
    const m = loadStudlinModule();
    const events = [{ id: "ab1", title: "Term Paper", isAttackBlock: true, attackChainId: "chain1", deadline: "2026-09-14", duration: 600, status: "pending" }];
    const digest = m.assembleStudlinAiDigest(events, [], m.getSchedulePreferences(), "2026-09-13");
    assert.equal(digest.attackBlockRisks.length, 1);
    assert.equal(digest.attackBlockRisks[0].title, "Term Paper");
    assert.equal(digest.attackBlockRisks[0].pendingMins, 600);
  });

  test("an assignment genuinely behind pace, due inside the window, shows up in assignmentPace", () => {
    const m = loadStudlinModule();
    const events = [{ id: "ev1", title: "Chem Paper", kind: "deadline", status: "pending", checklist: false, date: "2026-09-20", deadline: null, estimatedHours: 10 }];
    const digest = m.assembleStudlinAiDigest(events, [], m.getSchedulePreferences(), "2026-09-13");
    assert.equal(digest.assignmentPace.length, 1);
    assert.equal(digest.assignmentPace[0].title, "Chem Paper");
    assert.equal(digest.assignmentPace[0].behind, true);
    assert.equal(digest.assignmentPace[0].ahead, false);
  });

  test("an assignment due outside the 14-day window is excluded from assignmentPace, even if pace would flag it", () => {
    const m = loadStudlinModule();
    // Same shape as the in-window case above, just due well past the
    // window end (2026-09-26) -- the digest must not reach past its own
    // stated window just because pace data happens to exist for it.
    const events = [{ id: "ev1", title: "Far-off Paper", kind: "deadline", status: "pending", checklist: false, date: "2026-11-01", deadline: null, estimatedHours: 10 }];
    const digest = m.assembleStudlinAiDigest(events, [], m.getSchedulePreferences(), "2026-09-13");
    assert.equal(digest.assignmentPace.length, 0);
  });
});

describe("routeStudlinAiQuestion", () => {
  test("a workload question routes to needsWorkload only", () => {
    const m = loadStudlinModule();
    const flags = m.routeStudlinAiQuestion("which day next week is busiest?", ["Chemistry", "Biology"]);
    assert.equal(flags.needsWorkload, true);
    assert.equal(flags.needsOverdue, false);
    assert.equal(flags.needsStreak, false);
  });

  test("a peak-hours question routes to needsPeakHours only", () => {
    const m = loadStudlinModule();
    const flags = m.routeStudlinAiQuestion("when am I most productive", []);
    assert.equal(flags.needsPeakHours, true);
    assert.equal(flags.needsWorkload, false);
  });

  test("a question naming a known subject sets subject and needsSubjectTrend", () => {
    const m = loadStudlinModule();
    const flags = m.routeStudlinAiQuestion("how am I doing in Chemistry", ["Chemistry", "Biology"]);
    assert.equal(flags.subject, "Chemistry");
    assert.equal(flags.needsSubjectTrend, true);
  });

  test("naming a subject without trend-shaped phrasing sets subject but not needsSubjectTrend", () => {
    const m = loadStudlinModule();
    const flags = m.routeStudlinAiQuestion("when is my next Chemistry class", ["Chemistry", "Biology"]);
    assert.equal(flags.subject, "Chemistry");
    assert.equal(flags.needsSubjectTrend, false);
  });

  test("nothing matches confidently -> falls back to the baseline digest, not an empty one", () => {
    const m = loadStudlinModule();
    const flags = m.routeStudlinAiQuestion("should I go to the gym tomorrow", ["Chemistry", "Biology"]);
    assert.equal(flags.needsWorkload, true);
    assert.equal(flags.needsOverdue, true);
    assert.equal(flags.needsStreak, true);
    assert.equal(flags.subject, null);
  });

  test("empty/undefined question text still falls back to the baseline rather than throwing", () => {
    const m = loadStudlinModule();
    assert.doesNotThrow(() => m.routeStudlinAiQuestion(undefined, []));
    const flags = m.routeStudlinAiQuestion("", []);
    assert.equal(flags.needsWorkload, true);
  });
});
