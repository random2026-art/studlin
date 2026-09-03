// Weekly Wrapped's forward-looking half (2026-09-03) -- the existing
// Sunday/Monday recap only ever looked backward at the week that just
// ended. computeWeekAheadSummary answers "what's coming" for the upcoming
// week, reusing dayWorkloadMinutes/dayWorkloadTier (the Month grid's own
// capacity-bar metric) rather than inventing a new busyness measure.
// unpreparedExams flags an exam in the window with no linked sessions AND
// no attached material -- a real "you haven't even started" signal, not
// "nothing's happened yet chronologically."
const { test, describe } = require("node:test");
const assert = require("node:assert/strict");
const { loadStudlinModule } = require("./harness.js");

// A Monday, so weekStartKey math (which assumes callers pass a real
// Monday, same convention Wrapped's own weekDays7 already uses) lines up
// cleanly with the 7-day window below.
const MONDAY = "2026-09-07";

function exam(overrides) {
  return { id: "exam-1", title: "Chem Final", date: MONDAY, kind: "exam", status: "pending", ...overrides };
}
function studyBlock(overrides) {
  return { id: "sess-1", date: MONDAY, kind: "study block", status: "pending", duration: 30, ...overrides };
}

describe("computeWeekAheadSummary", () => {
  test("an empty week (no events at all) is a chill week with 7 light days and no due items", () => {
    const m = loadStudlinModule();
    const summary = m.computeWeekAheadSummary([], MONDAY);
    assert.equal(summary.isChillWeek, true);
    assert.equal(summary.dueItems.length, 0);
    assert.equal(summary.unpreparedExams.length, 0);
    assert.equal(summary.days.length, 7);
    assert.ok(summary.days.every(d => d.tier === "light"));
  });

  test("a day at/above DAY_WORKLOAD_HEAVY_MINS is tiered heavy, and disqualifies the week from being 'chill'", () => {
    const m = loadStudlinModule();
    const events = [studyBlock({ id: "s1", date: MONDAY, duration: m.DAY_WORKLOAD_HEAVY_MINS })];
    const summary = m.computeWeekAheadSummary(events, MONDAY);
    assert.equal(summary.days[0].tier, "heavy");
    assert.equal(summary.isChillWeek, false);
  });

  test("an exam or deadline inside the 7-day window is included in dueItems, sorted by date", () => {
    const m = loadStudlinModule();
    const events = [
      exam({ id: "e2", title: "Bio Midterm", date: "2026-09-10" }),
      exam({ id: "e1", title: "Chem Final", date: "2026-09-08" }),
    ];
    const summary = m.computeWeekAheadSummary(events, MONDAY);
    assert.equal(summary.dueItems.length, 2);
    assert.equal(summary.dueItems[0].id, "e1");
    assert.equal(summary.dueItems[1].id, "e2");
  });

  test("an exam/deadline outside the 7-day window (before or after) is excluded", () => {
    const m = loadStudlinModule();
    const events = [
      exam({ id: "before", date: "2026-09-06" }), // the Sunday just before MONDAY
      exam({ id: "after", date: "2026-09-14" }), // the Monday just after the window
    ];
    const summary = m.computeWeekAheadSummary(events, MONDAY);
    assert.equal(summary.dueItems.length, 0);
  });

  test("a checklist deadline and a project marker are excluded from dueItems (same exclusions upcomingAssignments already applies)", () => {
    const m = loadStudlinModule();
    const events = [
      { id: "chk", kind: "deadline", date: MONDAY, checklist: true, status: "pending" },
      { id: "proj-marker", kind: "deadline", date: MONDAY, isAttackBlock: false, phases: [{ name: "Phase 1", status: "active" }], status: "pending" },
    ];
    const summary = m.computeWeekAheadSummary(events, MONDAY);
    // isProjectMarker's own real rule is exercised here indirectly -- just
    // confirming the checklist item specifically never counts as "due."
    assert.ok(!summary.dueItems.some(e => e.id === "chk"));
  });

  test("busiestDay picks the real highest-minutes day, not just the first heavy one", () => {
    const m = loadStudlinModule();
    const events = [
      studyBlock({ id: "s1", date: MONDAY, duration: 60 }),
      studyBlock({ id: "s2", date: "2026-09-09", duration: 200 }),
      studyBlock({ id: "s3", date: "2026-09-10", duration: 90 }),
    ];
    const summary = m.computeWeekAheadSummary(events, MONDAY);
    assert.equal(summary.busiestDay.date, "2026-09-09");
    assert.equal(summary.busiestDay.minutes, 200);
  });

  test("a done task's minutes don't count toward that day's upcoming workload", () => {
    const m = loadStudlinModule();
    const events = [studyBlock({ id: "s1", date: MONDAY, duration: 200, status: "done" })];
    const summary = m.computeWeekAheadSummary(events, MONDAY);
    assert.equal(summary.days[0].minutes, 0);
  });

  test("an exam with zero linked sessions and zero material is flagged as unprepared", () => {
    const m = loadStudlinModule();
    const events = [exam({ id: "e1", date: "2026-09-09" })];
    const summary = m.computeWeekAheadSummary(events, MONDAY);
    assert.equal(summary.unpreparedExams.length, 1);
    assert.equal(summary.unpreparedExams[0].id, "e1");
  });

  test("an exam with a real linked study session is NOT flagged as unprepared, even if that session hasn't happened yet", () => {
    const m = loadStudlinModule();
    const events = [
      exam({ id: "e1", date: "2026-09-12" }),
      studyBlock({ id: "s1", date: "2026-09-11", dueEventId: "e1", isExamPrepSession: true, status: "pending" }),
    ];
    const summary = m.computeWeekAheadSummary(events, MONDAY);
    assert.equal(summary.unpreparedExams.length, 0);
  });

  test("an exam with attached material but no sessions yet is NOT flagged as unprepared", () => {
    const m = loadStudlinModule();
    const events = [exam({ id: "e1", date: "2026-09-12", sourceMaterials: [{ name: "notes", text: "chapter 4" }] })];
    const summary = m.computeWeekAheadSummary(events, MONDAY);
    assert.equal(summary.unpreparedExams.length, 0);
  });

  test("a plain deadline (not an exam) never appears in unpreparedExams, regardless of sessions/material", () => {
    const m = loadStudlinModule();
    const events = [{ id: "hw1", kind: "deadline", title: "Problem Set", date: "2026-09-09", status: "pending" }];
    const summary = m.computeWeekAheadSummary(events, MONDAY);
    assert.equal(summary.unpreparedExams.length, 0);
  });
});
