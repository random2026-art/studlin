// detectUnscheduledDueSoon -- the third Studlin AI proactive signal
// ("3 things due Thursday, 2 unscheduled -- want me to fix that?").
//
// Verified against buildSyllabusEventBatch before writing these: a
// due-date marker's own `time` field is NOT a reliable "has this been
// scheduled" signal -- every real (non-noDate) deadline marker gets
// time:"23:59" as a fixed placeholder regardless of whether any real
// work session exists for it. "Unscheduled" is really "no linked,
// still-pending session exists" (dueEventId), not a bare !ev.time check.
// Run with `npm test`.
const { test, describe } = require("node:test");
const assert = require("node:assert/strict");
const { loadStudlinModule } = require("./harness.js");

// Matches buildSyllabusEventBatch's real shape for a plain (non-noDate,
// non-exam) deadline marker: time:"23:59", duration:null, checklist
// undefined (not explicitly true).
function marker(overrides) {
  return {
    id: "m1", title: "Essay", date: "2026-09-06", time: "23:59",
    subject: "English", kind: "deadline", deadline: "2026-09-06",
    duration: null, status: "pending", ...overrides,
  };
}
function session(overrides) {
  return {
    id: "s1", title: "Essay session", date: "2026-09-05", time: "14:00",
    subject: "English", kind: "study block", duration: 30, status: "pending",
    dueEventId: "m1", isExamPrepSession: false, ...overrides,
  };
}

describe("detectUnscheduledDueSoon", () => {
  test("a real assignment due soon with no linked session at all gets flagged", () => {
    const m = loadStudlinModule();
    const result = m.detectUnscheduledDueSoon([marker()], "2026-09-04");
    assert.ok(result, "should flag the unscheduled essay");
    assert.equal(result.count, 1);
    assert.equal(result.ids[0], "m1");
    assert.equal(result.nearestDate, "2026-09-06");
  });

  test("does NOT flag an item that already has a real linked pending session", () => {
    const m = loadStudlinModule();
    const result = m.detectUnscheduledDueSoon([marker(), session()], "2026-09-04");
    assert.equal(result, null, "a session already exists for this marker -- it's not actually unscheduled");
  });

  test("a linked session that's already done still counts as unscheduled going forward (work isn't finished just because one session was)", () => {
    const m = loadStudlinModule();
    const doneSession = session({ status: "done" });
    const result = m.detectUnscheduledDueSoon([marker(), doneSession], "2026-09-04");
    assert.ok(result, "a done session doesn't mean there's real future work time reserved");
  });

  test("does NOT flag an explicit checklist:true item (student asked not to schedule time for it)", () => {
    const m = loadStudlinModule();
    const todo = marker({ id: "m2", checklist: true });
    const result = m.detectUnscheduledDueSoon([todo], "2026-09-04");
    assert.equal(result, null);
  });

  test("does NOT flag a project marker (phases/outline) -- projects have their own tracking surface", () => {
    const m = loadStudlinModule();
    const project = marker({ id: "m3", phases: [{ name: "Research", status: "active" }] });
    const result = m.detectUnscheduledDueSoon([project], "2026-09-04");
    assert.equal(result, null);
  });

  test("does NOT flag something due outside the 3-day window", () => {
    const m = loadStudlinModule();
    const farOut = marker({ id: "m4", date: "2026-09-20", deadline: "2026-09-20" });
    const result = m.detectUnscheduledDueSoon([farOut], "2026-09-04");
    assert.equal(result, null);
  });

  test("does NOT flag something already overdue (before today)", () => {
    const m = loadStudlinModule();
    const overdue = marker({ id: "m5", date: "2026-09-01", deadline: "2026-09-01" });
    const result = m.detectUnscheduledDueSoon([overdue], "2026-09-04");
    assert.equal(result, null);
  });

  test("does NOT flag a non-deadline kind (e.g. a real study block or exam)", () => {
    const m = loadStudlinModule();
    const exam = marker({ id: "m6", kind: "exam" });
    const result = m.detectUnscheduledDueSoon([exam], "2026-09-04");
    assert.equal(result, null);
  });

  test("multiple qualifying items are sorted soonest-first and all counted", () => {
    const m = loadStudlinModule();
    const later = marker({ id: "m7", date: "2026-09-07", deadline: "2026-09-07", title: "Lab report" });
    const sooner = marker({ id: "m8", date: "2026-09-05", deadline: "2026-09-05", title: "Reading response" });
    const result = m.detectUnscheduledDueSoon([later, sooner], "2026-09-04");
    assert.equal(result.count, 2);
    assert.equal(result.nearestDate, "2026-09-05");
    assert.equal(result.titles[0], "Reading response");
  });

  test("dismissUnscheduledDueSoon suppresses re-flagging for its cooldown window", () => {
    const m = loadStudlinModule();
    assert.ok(m.detectUnscheduledDueSoon([marker()], "2026-09-04"), "should flag before dismissal");
    m.dismissUnscheduledDueSoon();
    assert.equal(m.detectUnscheduledDueSoon([marker()], "2026-09-04"), null, "should stay quiet right after dismissal");
  });

  test("no candidates at all -> null, not an empty-but-truthy object", () => {
    const m = loadStudlinModule();
    assert.equal(m.detectUnscheduledDueSoon([], "2026-09-04"), null);
  });
});
