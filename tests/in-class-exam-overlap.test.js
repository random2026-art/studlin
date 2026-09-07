// Regression test for a 2026-09-07 user question ("does Studlin deal with
// an exam held during class systematically") -- confirmed it did not: an
// exam scheduled during its own class's normal meeting time showed a
// false "Overlaps with [class]" warning in Week/Day view, since the
// overlap check that badge is built from only knows "does anything else
// occupy this slot," not why. isExpectedInClassOverlap is the one
// exception -- true only for a real exam/class pair sharing the same
// course, false for every other kind of overlap (which should still
// warn). A real top-level pure function, tested directly via the
// harness. Run with `npm test`.
const { test, describe } = require("node:test");
const assert = require("node:assert/strict");
const { loadStudlinModule } = require("./harness.js");

describe("isExpectedInClassOverlap", () => {
  test("an exam during its own class (matching courseId) is an expected overlap", () => {
    const { isExpectedInClassOverlap } = loadStudlinModule();
    const exam = { kind: "exam", subject: "Biology", courseId: "bio101" };
    const cls = { kind: "class", subject: "Biology", courseId: "bio101", isRoutine: true };
    assert.equal(isExpectedInClassOverlap(exam, cls), true);
    assert.equal(isExpectedInClassOverlap(cls, exam), true, "order-independent -- either argument can be the exam");
  });

  test("courseId match wins even if the subject labels happen to differ (e.g. one side not yet renamed)", () => {
    const { isExpectedInClassOverlap } = loadStudlinModule();
    const exam = { kind: "exam", subject: "Bio", courseId: "bio101" };
    const cls = { kind: "class", subject: "Biology", courseId: "bio101" };
    assert.equal(isExpectedInClassOverlap(exam, cls), true);
  });

  test("falls back to normalized subject label when courseId is missing on either side (older data)", () => {
    const { isExpectedInClassOverlap } = loadStudlinModule();
    const exam = { kind: "exam", subject: "Biology" };
    const cls = { kind: "class", subject: "biology" };
    assert.equal(isExpectedInClassOverlap(exam, cls), true, "normalizeCourseLabel lowercases/trims, so casing alone must still match");
  });

  test("an exam during a DIFFERENT class (different course) is a real conflict, not suppressed", () => {
    const { isExpectedInClassOverlap } = loadStudlinModule();
    const exam = { kind: "exam", subject: "Biology", courseId: "bio101" };
    const cls = { kind: "class", subject: "Chemistry", courseId: "chem101" };
    assert.equal(isExpectedInClassOverlap(exam, cls), false);
  });

  test("two exams overlapping is never suppressed -- that's a real double-booking", () => {
    const { isExpectedInClassOverlap } = loadStudlinModule();
    const a = { kind: "exam", subject: "Biology", courseId: "bio101" };
    const b = { kind: "exam", subject: "Biology", courseId: "bio101" };
    assert.equal(isExpectedInClassOverlap(a, b), false);
  });

  test("two classes overlapping is never suppressed -- that's a real scheduling conflict", () => {
    const { isExpectedInClassOverlap } = loadStudlinModule();
    const a = { kind: "class", subject: "Biology", courseId: "bio101" };
    const b = { kind: "class", subject: "Chemistry", courseId: "chem101" };
    assert.equal(isExpectedInClassOverlap(a, b), false);
  });

  test("an exam overlapping a non-class kind (activity, another study block) is never suppressed", () => {
    const { isExpectedInClassOverlap } = loadStudlinModule();
    const exam = { kind: "exam", subject: "Biology", courseId: "bio101" };
    const activity = { kind: "busy block", subject: "Biology", courseId: "bio101" };
    assert.equal(isExpectedInClassOverlap(exam, activity), false, "only kind==='class' counts -- an activity sharing the same subject label is still a real overlap to flag");
  });

  test("no subject/courseId on either side never crashes and never suppresses", () => {
    const { isExpectedInClassOverlap } = loadStudlinModule();
    assert.equal(isExpectedInClassOverlap({ kind: "exam" }, { kind: "class" }), false);
  });
});

describe("expandRoutineOccurrences: a materialized class occurrence now carries its real courseId", () => {
  test("courseId flows from the routine rule onto every occurrence, same as subject already did", () => {
    const { expandRoutineOccurrences } = loadStudlinModule();
    const routines = [{ id: "r1", kind: "class", title: "Biology", subject: "Biology", courseId: "bio101", days: [0, 1, 2, 3, 4], startTime: "10:00", duration: 50 }];
    const occs = expandRoutineOccurrences(routines, "2030-01-07", "2030-01-07"); // a Monday
    assert.equal(occs.length, 1);
    assert.equal(occs[0].courseId, "bio101");
  });

  test("a routine with no courseId (older data, never backfilled) produces null, not undefined or a crash", () => {
    const { expandRoutineOccurrences } = loadStudlinModule();
    const routines = [{ id: "r1", kind: "class", title: "Biology", subject: "Biology", days: [0], startTime: "10:00", duration: 50 }];
    const occs = expandRoutineOccurrences(routines, "2030-01-07", "2030-01-07");
    assert.equal(occs[0].courseId, null);
  });
});
