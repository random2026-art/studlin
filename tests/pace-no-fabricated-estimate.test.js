// Regression tests for a 2026-09-07 user report: computeAssignmentPace
// used to fall back to ATTACK_BLOCK_DEFAULT_ESTIMATE_HOURS (3hr) whenever
// an assignment had no real time estimate, then judged the student's
// actual logged minutes against that FABRICATED total -- a "behind pace"
// verdict built on a number Studlin invented, not one it actually knows.
//
// User's own framing, verbatim reasoning: Attack Block's entire point is
// finding the real duration FROM a short probe session specifically so
// Studlin never has to guess up front ("its not supposed to default to
// anything right thats the purpose of the attack block to figure out
// right or wrong"). A pace verdict is a judgment presented as fact, not a
// scheduling bootstrap -- there's no real probe result to correct a
// fabricated verdict with, unlike attackBlockActionableDate's own
// "roughly when to suggest starting" default, which a real probe DOES
// later correct. No real estimate now means no verdict at all.
//
// Two places needed the fix: computeAssignmentPace itself (the actual
// judgment), and buildSyllabusEventBatch (which used to stamp the same
// fabricated default onto a syllabus-scanned assignment's own
// estimatedHours field, defeating computeAssignmentPace's new guard
// before it could even run). attackBlockActionableDate's own scheduling
// bootstrap is untouched -- see its own comment for why that one stays.
// Run with `npm test`.
const { test, describe } = require("node:test");
const assert = require("node:assert/strict");
const { loadStudlinModule } = require("./harness.js");

describe("computeAssignmentPace never fabricates an estimate to judge against", () => {
  const BASE_EV = { id: "ev1", kind: "deadline", status: "pending", checklist: false, date: "2026-10-01", deadline: null };

  test("no estimatedHours at all -> null, not a verdict built on ATTACK_BLOCK_DEFAULT_ESTIMATE_HOURS", () => {
    const m = loadStudlinModule();
    assert.equal(m.computeAssignmentPace({ ...BASE_EV }, [], "2026-09-13"), null);
  });

  test("this is exactly what a plain Attack Block assignment (no syllabus scan, no estimate) looks like -- still null", () => {
    const m = loadStudlinModule();
    // buildAssignmentAttackBlockPair (the manual "I don't know how long
    // this takes" flow) never stamps estimatedHours at all -- this is
    // that exact real-world shape.
    const manualAttackBlockMarker = { id: "ev2", kind: "deadline", status: "pending", checklist: false, date: "2026-10-01", deadline: "2026-10-01", title: "Essay" };
    assert.equal(m.computeAssignmentPace(manualAttackBlockMarker, [], "2026-09-13"), null);
  });
});

describe("buildSyllabusEventBatch never stamps a fabricated estimatedHours either", () => {
  function syllabusItem(overrides) {
    return {
      title: "Problem Set 3", date: "2026-08-05", kind: "deadline", include: true,
      attackBlock: true, proposeSessions: false, noDate: false, detail: "",
      difficulty: 500, ...overrides,
    };
  }

  test("an item with no AI-provided estimatedHours gets no estimatedHours field on its marker at all", () => {
    const { buildSyllabusEventBatch, getWeeklyRoutine, getSchedulePreferences } = loadStudlinModule({ now: "2026-07-20T09:00:00" });
    const { markerEvents } = buildSyllabusEventBatch([], "wiz-noest", "Chemistry", [syllabusItem({ estimatedHours: null })], null, getWeeklyRoutine(), getSchedulePreferences());
    assert.equal(markerEvents.length, 1);
    assert.equal("estimatedHours" in markerEvents[0], false, "no real estimate was ever provided, so the field must be absent, not fabricated");
  });

  test("the scheduling gate (attackStartDate) still gets a real value even with no estimate -- that bootstrap is deliberately unaffected", () => {
    const { buildSyllabusEventBatch, getWeeklyRoutine, getSchedulePreferences } = loadStudlinModule({ now: "2026-07-20T09:00:00" });
    const { markerEvents } = buildSyllabusEventBatch([], "wiz-noest2", "Chemistry", [syllabusItem({ estimatedHours: null, date: "2026-12-01" })], null, getWeeklyRoutine(), getSchedulePreferences());
    assert.ok(markerEvents[0].attackStartDate, "attackBlockActionableDate's own internal default still produces a real scheduling gate");
  });

  test("a real AI-provided estimate is still stamped and used normally -- this only withholds a FABRICATED one", () => {
    const { buildSyllabusEventBatch, getWeeklyRoutine, getSchedulePreferences } = loadStudlinModule({ now: "2026-07-20T09:00:00" });
    const { markerEvents } = buildSyllabusEventBatch([], "wiz-realest", "Chemistry", [syllabusItem({ estimatedHours: 5 })], null, getWeeklyRoutine(), getSchedulePreferences());
    assert.equal(markerEvents[0].estimatedHours, 5);
  });
});
