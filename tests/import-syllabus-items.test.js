// buildImportSyllabusItemsProposal -- the new Studlin AI chat capability
// for "add these quizzes and dates to my econ class" (multiple distinct
// graded items pasted at once, e.g. copied from a syllabus). Only the
// pure proposal builder is tested here; extractSyllabusItemsFromChatText
// is an async/network AI call, matching this session's established
// precedent of not unit-testing those directly (extractSyllabusDeadlines,
// pushAiMemory, etc. aren't either).
// Run with `npm test`.
const { test, describe } = require("node:test");
const assert = require("node:assert/strict");
const { loadStudlinModule } = require("./harness.js");

describe("buildImportSyllabusItemsProposal", () => {
  test("no real items (empty array) -> a clear ok:false, no crash", () => {
    const m = loadStudlinModule();
    const result = m.buildImportSyllabusItemsProposal({ subject: "econ" }, []);
    assert.equal(result.ok, false);
    assert.ok(result.label.length > 0);
  });

  test("items missing a title or date are filtered out before counting", () => {
    const m = loadStudlinModule();
    const items = [
      { title: "First Quiz", date: "2026-09-21", kind: "exam" },
      { title: "", date: "2026-10-01", kind: "deadline" },
      { title: "No date item", date: "", kind: "deadline" },
    ];
    const result = m.buildImportSyllabusItemsProposal({ subject: "econ" }, items);
    assert.equal(result.ok, true);
    assert.equal(result.items.length, 1);
    assert.equal(result.items[0].title, "First Quiz");
  });

  test("a real multi-item batch is accepted, one entry per real item, in order", () => {
    const m = loadStudlinModule();
    const items = [
      { title: "First Quiz", date: "2026-09-21", kind: "exam", examType: "quiz", gradeWeightPercent: 20 },
      { title: "Second Quiz", date: "2026-10-27", kind: "exam", examType: "quiz", gradeWeightPercent: 25 },
      { title: "Final Exam", date: "2026-12-15", kind: "exam", examType: "final", gradeWeightPercent: 35 },
    ];
    const result = m.buildImportSyllabusItemsProposal({ subject: "econ" }, items);
    assert.equal(result.ok, true);
    assert.equal(result.items.length, 3);
    assert.equal(result.subject, "econ");
    assert.equal(result.kind, "import_syllabus_items");
  });

  test("the label names the subject and lists every item with a human date and weight when given", () => {
    const m = loadStudlinModule();
    const items = [{ title: "First Quiz", date: "2026-09-21", kind: "exam", gradeWeightPercent: 20 }];
    const result = m.buildImportSyllabusItemsProposal({ subject: "econ" }, items);
    assert.ok(result.label.includes("econ"));
    assert.ok(result.label.includes("First Quiz"));
    assert.ok(result.label.includes("20%"));
    assert.ok(!/\d{4}-\d{2}-\d{2}/.test(result.label), "should never show the raw ISO date to the student");
  });

  test("no subject at all still builds a valid proposal (subject null), just an unlabeled item list", () => {
    const m = loadStudlinModule();
    const items = [{ title: "First Quiz", date: "2026-09-21", kind: "exam" }];
    const result = m.buildImportSyllabusItemsProposal({ subject: null }, items);
    assert.equal(result.ok, true);
    assert.equal(result.subject, null);
    assert.ok(!result.label.includes("to null"));
  });

  test("a deadline (non-exam) item defaults to attackBlock:true, real prep time gets scheduled", () => {
    const m = loadStudlinModule();
    const items = [{ title: "Problem Set 3", date: "2026-09-22", kind: "deadline" }];
    const result = m.buildImportSyllabusItemsProposal({ subject: "econ" }, items);
    assert.equal(result.items[0].attackBlock, true);
  });

  test("an exam item defaults to attackBlock:false -- exams don't get an Attack Block chain", () => {
    const m = loadStudlinModule();
    const items = [{ title: "Final Exam", date: "2026-12-15", kind: "exam" }];
    const result = m.buildImportSyllabusItemsProposal({ subject: "econ" }, items);
    assert.equal(result.items[0].attackBlock, false);
  });

  test("every item defaults proposeSessions:false -- spaced review sessions stay opt-in, never silently scheduled", () => {
    const m = loadStudlinModule();
    const items = [
      { title: "Final Exam", date: "2026-12-15", kind: "exam" },
      { title: "Problem Set 3", date: "2026-09-22", kind: "deadline" },
    ];
    const result = m.buildImportSyllabusItemsProposal({ subject: "econ" }, items);
    assert.equal(result.items[0].proposeSessions, false);
    assert.equal(result.items[1].proposeSessions, false);
  });

  test("kind normalizes anything that isn't literally \"exam\" to \"deadline\"", () => {
    const m = loadStudlinModule();
    const items = [{ title: "Reading response", date: "2026-09-22", kind: "assignment" }];
    const result = m.buildImportSyllabusItemsProposal({ subject: "econ" }, items);
    assert.equal(result.items[0].kind, "deadline");
  });

  test("gradeWeightPercent of 0 is preserved, not treated as missing (falsy-but-real)", () => {
    const m = loadStudlinModule();
    const items = [{ title: "Extra credit quiz", date: "2026-09-21", kind: "exam", gradeWeightPercent: 0 }];
    const result = m.buildImportSyllabusItemsProposal({ subject: "econ" }, items);
    assert.equal(result.items[0].gradeWeightPercent, 0);
  });

  test("parsed with no subject key at all (undefined, not null) doesn't throw", () => {
    const m = loadStudlinModule();
    const items = [{ title: "First Quiz", date: "2026-09-21", kind: "exam" }];
    const result = m.buildImportSyllabusItemsProposal({}, items);
    assert.equal(result.ok, true);
    assert.equal(result.subject, null);
  });
});

// duringClass: the "these worksheets are done during class" feature --
// 2026-09-07 is a real Monday and 2026-09-08 a real Tuesday (verified
// against the actual calendar, matching the user's own Canvas screenshot
// showing W4 due Monday Sep 7). Monday-first day indexing: Mon=0, Tue=1,
// Wed=2 -- matches expandRoutineOccurrences' own dow computation.
describe("buildImportSyllabusItemsProposal -- duringClass lecture-day check", () => {
  test("duringClass:false (the default/ordinary case) never flags anything, even for a date the class doesn't meet on", () => {
    const m = loadStudlinModule();
    m.saveSubjects([{ id: "s1", label: "chem", color: "#fff" }]);
    m.saveWeeklyRoutine([{ id: "r1", kind: "class", courseId: "s1", days: [0, 2], startTime: "09:00", duration: 50 }]);
    const items = [{ title: "W-Tuesday", date: "2026-09-08", kind: "deadline" }]; // a Tuesday
    const result = m.buildImportSyllabusItemsProposal({ subject: "chem", duringClass: false }, items, m.getWeeklyRoutine());
    assert.equal(result.items[0].dayMismatch, false);
    assert.equal(result.mismatchCount, 0);
  });

  test("duringClass:true and the date lands on a real meeting day -- no mismatch", () => {
    const m = loadStudlinModule();
    m.saveSubjects([{ id: "s1", label: "chem", color: "#fff" }]);
    m.saveWeeklyRoutine([{ id: "r1", kind: "class", courseId: "s1", days: [0, 2], startTime: "09:00", duration: 50 }]);
    const items = [{ title: "W4", date: "2026-09-07", kind: "deadline" }]; // a Monday, class meets Mon/Wed
    const result = m.buildImportSyllabusItemsProposal({ subject: "chem", duringClass: true }, items, m.getWeeklyRoutine());
    assert.equal(result.items[0].dayMismatch, false);
    assert.equal(result.mismatchCount, 0);
    assert.ok(!result.label.includes("double check"));
  });

  test("duringClass:true and the date does NOT land on a real meeting day -- flagged, surfaced in the label", () => {
    const m = loadStudlinModule();
    m.saveSubjects([{ id: "s1", label: "chem", color: "#fff" }]);
    m.saveWeeklyRoutine([{ id: "r1", kind: "class", courseId: "s1", days: [0, 2], startTime: "09:00", duration: 50 }]); // Mon/Wed only
    const items = [{ title: "Weird Worksheet", date: "2026-09-08", kind: "deadline" }]; // a Tuesday
    const result = m.buildImportSyllabusItemsProposal({ subject: "chem", duringClass: true }, items, m.getWeeklyRoutine());
    assert.equal(result.items[0].dayMismatch, true);
    assert.equal(result.mismatchCount, 1);
    assert.ok(result.label.includes("double check"));
  });

  test("a mixed batch only flags the actual mismatched items, not the whole batch", () => {
    const m = loadStudlinModule();
    m.saveSubjects([{ id: "s1", label: "chem", color: "#fff" }]);
    m.saveWeeklyRoutine([{ id: "r1", kind: "class", courseId: "s1", days: [0, 2], startTime: "09:00", duration: 50 }]);
    const items = [
      { title: "W4", date: "2026-09-07", kind: "deadline" }, // Monday -- fine
      { title: "Weird one", date: "2026-09-08", kind: "deadline" }, // Tuesday -- mismatch
    ];
    const result = m.buildImportSyllabusItemsProposal({ subject: "chem", duringClass: true }, items, m.getWeeklyRoutine());
    assert.equal(result.items[0].dayMismatch, false);
    assert.equal(result.items[1].dayMismatch, true);
    assert.equal(result.mismatchCount, 1);
  });

  test("duringClass:true but the course has no class routine on file at all -- nothing to check against, so nothing is flagged", () => {
    const m = loadStudlinModule();
    m.saveSubjects([{ id: "s1", label: "chem", color: "#fff" }]);
    m.saveWeeklyRoutine([]); // no routine data for this class
    const items = [{ title: "W4", date: "2026-09-08", kind: "deadline" }];
    const result = m.buildImportSyllabusItemsProposal({ subject: "chem", duringClass: true }, items, m.getWeeklyRoutine());
    assert.equal(result.items[0].dayMismatch, false);
    assert.equal(result.mismatchCount, 0);
  });

  test("duringClass:true with no subject at all -- can't resolve a course, so nothing is flagged", () => {
    const m = loadStudlinModule();
    const items = [{ title: "W4", date: "2026-09-08", kind: "deadline" }];
    const result = m.buildImportSyllabusItemsProposal({ subject: null, duringClass: true }, items, []);
    assert.equal(result.items[0].dayMismatch, false);
  });

  test("routines param omitted entirely (undefined) never throws -- existing callers stay safe", () => {
    const m = loadStudlinModule();
    const items = [{ title: "First Quiz", date: "2026-09-21", kind: "exam" }];
    const result = m.buildImportSyllabusItemsProposal({ subject: "econ", duringClass: true }, items);
    assert.equal(result.ok, true);
    assert.equal(result.items[0].dayMismatch, false);
  });

  test("a fuzzy/near-duplicate class name (no exact subject match, no courseId) still matches via normalized-label fallback, same as newMeetingTimesForCourse's own pattern", () => {
    const m = loadStudlinModule();
    // No courseId on the routine row -- legacy-style data, matched by
    // normalized subject label instead (mirrors real pre-courseId rows).
    m.saveWeeklyRoutine([{ id: "r1", kind: "class", subject: "Chem", days: [0, 2], startTime: "09:00", duration: 50 }]);
    const items = [{ title: "Weird one", date: "2026-09-08", kind: "deadline" }]; // Tuesday
    const result = m.buildImportSyllabusItemsProposal({ subject: "chem", duringClass: true }, items, m.getWeeklyRoutine());
    assert.equal(result.items[0].dayMismatch, true, "should still match Chem's routine via label fallback and flag the Tuesday date");
  });
});
