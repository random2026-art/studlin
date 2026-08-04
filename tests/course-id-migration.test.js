// Phase 1 of the Shovel-inspired redesign: migrating courses from
// label-string matching to stable ids. Covers the three genuinely new
// pieces -- courseIdForLabel (the resolver used at every creation point),
// backfillCourseIds (one-time, additive, idempotent), and
// deleteCourseWithCascade/undoCourseDelete (the one real behavior change:
// deleting a course used to silently orphan its routines/events).
const { test, describe } = require("node:test");
const assert = require("node:assert/strict");
const { loadStudlinModule } = require("./harness.js");

function subject(overrides) {
  return { id: "subj-1", label: "Chemistry", color: "#D9806B", ...overrides };
}

function classRoutine(overrides) {
  return {
    id: "rt-1", title: "Chemistry", kind: "class", subject: "Chemistry",
    days: [0, 2], startTime: "09:00", duration: 50, ...overrides,
  };
}

function courseEvent(overrides) {
  return {
    id: "syl-1", title: "Problem Set 3", date: "2026-08-01", time: "23:59",
    subject: "Chemistry", kind: "deadline", notes: "", priority: 5, difficulty: 5,
    deadline: "2026-08-01", duration: null, status: "pending", timeSpent: 0,
    completedAt: null, ...overrides,
  };
}

describe("courseIdForLabel", () => {
  test("resolves a real subject's id from its label", () => {
    const m = loadStudlinModule();
    m.saveSubjects([subject()]);
    assert.equal(m.courseIdForLabel("Chemistry"), "subj-1");
  });

  test("returns null for a label matching no real subject (free-typed text)", () => {
    const m = loadStudlinModule();
    m.saveSubjects([subject()]);
    assert.equal(m.courseIdForLabel("Some random text"), null);
    assert.equal(m.courseIdForLabel(""), null);
  });
});

describe("backfillCourseIds", () => {
  test("fills courseId on a routine and event that match a subject by label", () => {
    const m = loadStudlinModule();
    m.saveSubjects([subject()]);
    m.saveWeeklyRoutine([classRoutine()]);
    m.lsSet("events", [courseEvent()]);
    m.backfillCourseIds();
    assert.equal(m.getWeeklyRoutine()[0].courseId, "subj-1");
    assert.equal(m.lsGet("events", [])[0].courseId, "subj-1");
  });

  test("never overwrites an already-set courseId, even a stale one", () => {
    const m = loadStudlinModule();
    m.saveSubjects([subject()]);
    m.saveWeeklyRoutine([classRoutine({ courseId: "some-other-id" })]);
    m.backfillCourseIds();
    assert.equal(m.getWeeklyRoutine()[0].courseId, "some-other-id");
  });

  test("leaves a routine/event with no matching subject untouched", () => {
    const m = loadStudlinModule();
    m.saveSubjects([subject()]);
    m.saveWeeklyRoutine([classRoutine({ subject: "Biology" })]);
    m.backfillCourseIds();
    assert.equal(m.getWeeklyRoutine()[0].courseId, undefined);
  });

  test("is idempotent -- running it twice produces the same result and doesn't re-scan", () => {
    const m = loadStudlinModule();
    m.saveSubjects([subject()]);
    m.saveWeeklyRoutine([classRoutine()]);
    m.backfillCourseIds();
    const firstPass = m.getWeeklyRoutine();
    // Simulate a routine that appeared AFTER the flag was already set (e.g.
    // manually seeded in a later test step) -- a second call must be a
    // total no-op once the gate flag is set, not just "no change" by luck.
    m.saveWeeklyRoutine([...firstPass, classRoutine({ id: "rt-2", subject: "Chemistry" })]);
    m.backfillCourseIds();
    const secondPass = m.getWeeklyRoutine();
    assert.equal(secondPass.find(r => r.id === "rt-2").courseId, undefined);
  });
});

describe("deleteCourseWithCascade", () => {
  test("removes the subject, its matching routines, and its matching events", () => {
    const m = loadStudlinModule();
    m.saveSubjects([subject()]);
    m.saveWeeklyRoutine([classRoutine({ courseId: "subj-1" })]);
    m.lsSet("events", [courseEvent({ courseId: "subj-1" })]);
    const snapshot = m.deleteCourseWithCascade("subj-1");
    assert.equal(m.getSubjects().length, 0);
    assert.equal(m.getWeeklyRoutine().length, 0);
    assert.equal(m.lsGet("events", []).length, 0);
    assert.equal(snapshot.subject.id, "subj-1");
    assert.equal(snapshot.routines.length, 1);
    assert.equal(snapshot.events.length, 1);
  });

  test("falls back to label matching for pre-backfill data with no courseId", () => {
    const m = loadStudlinModule();
    m.saveSubjects([subject()]);
    m.saveWeeklyRoutine([classRoutine()]); // no courseId -- legacy row
    m.lsSet("events", [courseEvent()]); // no courseId -- legacy row
    const snapshot = m.deleteCourseWithCascade("subj-1");
    assert.equal(m.getWeeklyRoutine().length, 0);
    assert.equal(m.lsGet("events", []).length, 0);
    assert.equal(snapshot.routines.length, 1);
  });

  test("leaves unrelated routines/events untouched", () => {
    const m = loadStudlinModule();
    m.saveSubjects([subject(), subject({ id: "subj-2", label: "Biology" })]);
    m.saveWeeklyRoutine([
      classRoutine({ courseId: "subj-1" }),
      classRoutine({ id: "rt-2", subject: "Biology", courseId: "subj-2" }),
    ]);
    m.deleteCourseWithCascade("subj-1");
    const remaining = m.getWeeklyRoutine();
    assert.equal(remaining.length, 1);
    assert.equal(remaining[0].id, "rt-2");
    assert.equal(m.getSubjects().length, 1);
    assert.equal(m.getSubjects()[0].id, "subj-2");
  });

  test("returns null and changes nothing for a courseId that doesn't resolve to a real subject", () => {
    const m = loadStudlinModule();
    m.saveSubjects([subject()]);
    m.saveWeeklyRoutine([classRoutine({ courseId: "subj-1" })]);
    const snapshot = m.deleteCourseWithCascade("no-such-id");
    assert.equal(snapshot, null);
    assert.equal(m.getSubjects().length, 1);
    assert.equal(m.getWeeklyRoutine().length, 1);
  });
});

describe("undoCourseDelete", () => {
  test("restores exactly the subject, routines, and events a cascade delete removed", () => {
    const m = loadStudlinModule();
    m.saveSubjects([subject()]);
    m.saveWeeklyRoutine([classRoutine({ courseId: "subj-1" })]);
    m.lsSet("events", [courseEvent({ courseId: "subj-1" })]);
    const snapshot = m.deleteCourseWithCascade("subj-1");
    m.undoCourseDelete(snapshot);
    assert.equal(m.getSubjects().length, 1);
    assert.equal(m.getSubjects()[0].id, "subj-1");
    assert.equal(m.getWeeklyRoutine().length, 1);
    assert.equal(m.lsGet("events", []).length, 1);
  });

  test("is a no-op given a null snapshot (the not-a-real-course case)", () => {
    const m = loadStudlinModule();
    m.saveSubjects([subject()]);
    m.undoCourseDelete(null);
    assert.equal(m.getSubjects().length, 1);
  });
});
