// User request, 2026-09-30: a persistent Dashboard setup-progress checklist
// ("add your classes" -> "get real assignments/exams in for every class")
// that must detect completion ACCURATELY regardless of which flow a student
// used -- scan whole schedule, Canvas, Google Calendar, or manual entry --
// and must never claim a class is done just because Canvas/Google got
// connected (sync can silently miss classes). computeSetupChecklist/
// liveClassItems are the pure functions behind it; this file is the real
// functional coverage classNeedsSyllabus's own source-pattern tests don't
// give it (this is live, stateful detection, not a one-shot pure check).
const { test, describe } = require("node:test");
const assert = require("node:assert/strict");
const { loadStudlinModule } = require("./harness");

describe("liveClassItems: matches events to a subject by courseId OR label", () => {
  test("matches by courseId when present", () => {
    const m = loadStudlinModule();
    const subject = { id: "s1", label: "Calc II" };
    const events = [{ id: "e1", courseId: "s1", kind: "assignment" }, { id: "e2", courseId: "other", kind: "assignment" }];
    const items = m.liveClassItems(subject, events);
    assert.equal(items.length, 1);
    assert.equal(items[0].id, "e1");
  });
  test("falls back to label match when courseId is absent (older data)", () => {
    const m = loadStudlinModule();
    const subject = { id: "s1", label: "Calc II" };
    const events = [{ id: "e1", subject: "Calc II", kind: "assignment" }, { id: "e2", subject: "Bio", kind: "assignment" }];
    const items = m.liveClassItems(subject, events);
    assert.equal(items.length, 1);
    assert.equal(items[0].id, "e1");
  });
});

describe("computeSetupChecklist: accurate regardless of flow, never fooled by a stale stored flag", () => {
  test("no classes at all -> not done, nothing to act on", () => {
    const m = loadStudlinModule();
    const r = m.computeSetupChecklist([], [], false, false, []);
    assert.equal(r.hasClasses, false);
    assert.equal(r.overallDone, false);
    assert.equal(r.classesNeedingSyllabus.length, 0);
  });

  test("classes exist but none have real assignment/project items -> needs syllabus, not done", () => {
    const m = loadStudlinModule();
    const subjects = [{ id: "s1", label: "Calc II", needsSyllabus: false }]; // stored flag says false (stale)
    const events = [{ id: "e1", courseId: "s1", kind: "deadline" }]; // a checklist/reminder item, not assignment/project
    const r = m.computeSetupChecklist(subjects, events, false, false, []);
    assert.equal(r.hasClasses, true);
    assert.equal(r.classesNeedingSyllabus.length, 1);
    assert.equal(r.classesNeedingSyllabus[0].id, "s1");
    assert.equal(r.assignmentsStepDone, false);
    assert.equal(r.overallDone, false);
  });

  test("a class's own stored needsSyllabus=true is ignored when real events already show assignment items (manual entry, never ran the wizard)", () => {
    const m = loadStudlinModule();
    const subjects = [{ id: "s1", label: "Calc II", needsSyllabus: true }]; // stored flag says true (stale -- never updated)
    const events = [{ id: "e1", courseId: "s1", kind: "assignment" }];
    const r = m.computeSetupChecklist(subjects, events, false, false, []);
    assert.equal(r.classesNeedingSyllabus.length, 0, "live detection must override the stale stored flag");
    assert.equal(r.assignmentsStepDone, true);
    assert.equal(r.overallDone, true);
  });

  test("a class with a real project item (not just assignment) also counts as satisfied", () => {
    const m = loadStudlinModule();
    const subjects = [{ id: "s1", label: "Hist" }];
    const events = [{ id: "e1", courseId: "s1", kind: "project", title: "Group project" }];
    const r = m.computeSetupChecklist(subjects, events, false, false, []);
    assert.equal(r.classesNeedingSyllabus.length, 0);
  });

  // User report, 2026-09-30: "it's not just assignments, it's also exams
  // and projects." A class graded purely on exams (no homework at all) has
  // real data about the student's actual workload and shouldn't be nagged
  // forever -- this is the whole reason computeSetupChecklist uses
  // classHasRealWorkItems instead of reusing classNeedsSyllabus verbatim
  // (that one deliberately excludes exam-only, for a different question --
  // see its own comment).
  test("a class with ONLY exam items (no assignment or project at all) also counts as satisfied", () => {
    const m = loadStudlinModule();
    const subjects = [{ id: "s1", label: "Organic Chem" }];
    const events = [
      { id: "e1", courseId: "s1", kind: "exam", title: "Midterm 1" },
      { id: "e2", courseId: "s1", kind: "exam", title: "Final" },
    ];
    const r = m.computeSetupChecklist(subjects, events, false, false, []);
    assert.equal(r.classesNeedingSyllabus.length, 0, "real exam dates are real workload data, not a reason to keep nagging");
    assert.equal(r.overallDone, true);
  });

  test("mixed classes report an accurate partial count, not an all-or-nothing boolean", () => {
    const m = loadStudlinModule();
    const subjects = [{ id: "s1", label: "Calc II" }, { id: "s2", label: "Bio" }, { id: "s3", label: "Art" }];
    const events = [
      { id: "e1", courseId: "s1", kind: "assignment" },
      { id: "e2", courseId: "s2", kind: "exam" }, // exam-only -- satisfied (classHasRealWorkItems), s3 has nothing at all
    ];
    const r = m.computeSetupChecklist(subjects, events, false, false, []);
    assert.equal(r.totalClasses, 3);
    assert.equal(r.classesWithSyllabus, 2);
    assert.equal(r.classesNeedingSyllabus.map(s => s.id).sort().join(","), "s3");
    assert.equal(r.assignmentsStepDone, false);
  });

  test("LMS/Google connected alone never marks a class done -- only real items do (the exact gap reported live)", () => {
    const m = loadStudlinModule();
    const subjects = [{ id: "s1", label: "Chem" }];
    const events = []; // LMS "connected" but this class's sync came back empty
    const r = m.computeSetupChecklist(subjects, events, true, true, []);
    assert.equal(r.lmsConnected, true);
    assert.equal(r.googleConnected, true);
    assert.equal(r.classesNeedingSyllabus.length, 1, "a connected integration must not paper over a class with zero real items");
    assert.equal(r.overallDone, false);
  });

  test("a skipped class is excluded from both the needing-list and the done calculation", () => {
    const m = loadStudlinModule();
    const subjects = [{ id: "s1", label: "Calc II" }, { id: "s2", label: "Pass/Fail Seminar" }];
    const events = [{ id: "e1", courseId: "s1", kind: "assignment" }];
    const r = m.computeSetupChecklist(subjects, events, false, false, ["s2"]);
    assert.equal(r.trackedClasses, 1);
    assert.equal(r.classesNeedingSyllabus.length, 0, "skipped class must not block completion");
    assert.equal(r.overallDone, true);
  });

  test("all classes satisfied -> overallDone true", () => {
    const m = loadStudlinModule();
    const subjects = [{ id: "s1", label: "Calc II" }, { id: "s2", label: "Bio" }];
    const events = [
      { id: "e1", courseId: "s1", kind: "assignment" },
      { id: "e2", courseId: "s2", kind: "project" },
    ];
    const r = m.computeSetupChecklist(subjects, events, false, false, []);
    assert.equal(r.assignmentsStepDone, true);
    assert.equal(r.overallDone, true);
  });
});

// Regression guard, 2026-09-30 (caught live): the Dashboard detection line
// originally checked only sourceType==="Canvas", which would wrongly tell a
// Schoology/Blackboard/Moodle school's student that nothing was connected
// even after they connected their actual (non-Canvas) LMS. Source-pattern,
// not functional -- this is about which REAL function Dashboard calls, not
// computeSetupChecklist's own logic (already covered above).
describe("Dashboard's LMS-connected detection recognizes every real LMS, not just Canvas", () => {
  test("uses isAcademicCalendarSource (Canvas/Schoology/Blackboard/Moodle), not a Canvas-only check", () => {
    const fs = require("fs");
    const path = require("path");
    const SOURCE = fs.readFileSync(path.join(__dirname, "..", "studlin-app.jsx"), "utf8");
    const idx = SOURCE.indexOf("const lmsConnectedFlag=");
    assert.notEqual(idx, -1, "Dashboard must compute a generic lmsConnectedFlag, not a Canvas-specific one");
    const line = SOURCE.slice(idx, idx + 200);
    assert.match(line, /isAcademicCalendarSource\(c\.sourceType\)/);
    assert.doesNotMatch(line, /sourceType===["']Canvas["']/, "must not regress to checking only Canvas");
  });
  test("isAcademicCalendarSource itself still covers all four real LMS platforms", () => {
    const m = loadStudlinModule();
    assert.equal(m.isAcademicCalendarSource("Canvas"), true);
    assert.equal(m.isAcademicCalendarSource("Schoology"), true);
    assert.equal(m.isAcademicCalendarSource("Blackboard"), true);
    assert.equal(m.isAcademicCalendarSource("Moodle"), true);
    assert.equal(m.isAcademicCalendarSource("SomeRandomThing"), false);
  });
});
