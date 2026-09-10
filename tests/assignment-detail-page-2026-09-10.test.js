// User request, 2026-09-10: "the assignments [section of Studlin Prep] is
// lacking... instead of hitting on assignments and it giving you option to
// edit it, [it should take] you to that assignment page similar to exam
// where you can schedule an attack block... it gives you smart optimized
// plan which you can view in that assignment... something like mark as
// completed." Also: "think of all the ways a user could add an assignment,
// make sure they all connect and work well with each other."
//
// Investigation found a real, confirmed gap along the way: "Assignment"
// has always meant two different underlying shapes depending on which
// entry point created it --
//   (a) kind:"deadline" (a real due-date marker, 0+ linked sessions via
//       dueEventId) -- written by Add Task when Studlin picks the time,
//       by a syllabus scan, or by the EventDetailModal Attack Block toggle.
//   (b) kind:"study block" + isAssignment:true (the item IS its own one
//       already-scheduled block, no marker at all) -- written by Add Task
//       when the STUDENT picks the exact time (resolveAssignmentKind), and
//       by Brain Dump / Studlin AI chat's create_task as their default for
//       a plain "study" item (both routed through the shared
//       planBrainDumpTasks) whenever the Attack Block toggle wasn't
//       explicitly used.
// upcomingAssignments() only ever matched shape (a), so every assignment
// created through any "you pick the time" or default Brain Dump/chat path
// was completely invisible in Studlin Prep -- not just missing a plan,
// absent from the list entirely, with no pace tracking and no completion
// toggle. Fixed by broadening upcomingAssignments() (read-side only,
// nothing about how any entry point WRITES events) to include both real
// shapes; the new Assignment detail page (selectedAssignmentId, in
// StudlinPrep) handles both gracefully.
//
// upcomingAssignments/upcomingProjects/computeAssignmentPace are pure,
// exported functions -- tested with real invocations. The new detail
// page/navigation wiring is StudlinPrep component-closure code (not
// exported), covered by source-level regression guards, same established
// precedent as friend-request-notification-badge.test.js. Run with
// `npm test`.
const { test, describe } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");
const { loadStudlinModule } = require("./harness.js");

const APP_SOURCE = fs.readFileSync(path.join(__dirname, "..", "studlin-app.jsx"), "utf8");

describe("upcomingAssignments() now surfaces both real assignment shapes (real invocations)", () => {
  test("a real kind:deadline marker (the shape it always supported) is still included", () => {
    const m = loadStudlinModule({ now: "2026-09-10T08:00:00" });
    m.lsSet("events", [{ id: "a1", title: "Essay", kind: "deadline", date: "2026-09-15", status: "pending" }]);
    const list = m.upcomingAssignments();
    assert.equal(list.length, 1);
    assert.equal(list[0].id, "a1");
  });

  test("a legacy kind:'study block'+isAssignment:true item (Add Task manual-mode / Brain Dump / Studlin AI chat's default) is now included too", () => {
    const m = loadStudlinModule({ now: "2026-09-10T08:00:00" });
    m.lsSet("events", [{ id: "a2", title: "Problem set", kind: "study block", isAssignment: true, date: "2026-09-12", time: "16:00", duration: 45, status: "pending" }]);
    const list = m.upcomingAssignments();
    assert.equal(list.length, 1);
    assert.equal(list[0].id, "a2");
  });

  test("a plain 'study block' WITHOUT isAssignment (a real Study Session or general Task) is still excluded -- this is not a blanket include-everything change", () => {
    const m = loadStudlinModule({ now: "2026-09-10T08:00:00" });
    m.lsSet("events", [
      { id: "s1", title: "Study session", kind: "study block", date: "2026-09-12", time: "16:00", status: "pending" },
      { id: "t1", title: "General task", kind: "study block", isGeneralTask: true, date: "2026-09-12", time: "17:00", status: "pending" },
    ]);
    assert.equal(m.upcomingAssignments().length, 0);
  });

  test("a project marker is still excluded from assignments regardless of which shape it uses", () => {
    const m = loadStudlinModule({ now: "2026-09-10T08:00:00" });
    m.lsSet("events", [{ id: "p1", title: "Group project", kind: "deadline", date: "2026-09-20", status: "pending", phases: [{ name: "Research", status: "active" }] }]);
    assert.equal(m.upcomingAssignments().length, 0);
    assert.equal(m.upcomingProjects().length, 1);
  });

  test("a subject-less checklist to-do (no class attached) is still excluded, same exclusion as before this fix", () => {
    const m = loadStudlinModule({ now: "2026-09-10T08:00:00" });
    m.lsSet("events", [{ id: "c1", title: "Buy notebook", kind: "deadline", checklist: true, date: "", status: "pending" }]);
    assert.equal(m.upcomingAssignments().length, 0);
  });
});

describe("computeAssignmentPace already anticipated both shapes (real invocation, confirms the fix aligns with existing design intent)", () => {
  test("pace tracking already accepted kind:'study block' assignments before this fix -- it just never got fed any, since Prep hid them", () => {
    const m = loadStudlinModule({ now: "2026-09-10T08:00:00" });
    const ev = { id: "a2", title: "Problem set", kind: "study block", isAssignment: true, date: "2026-09-20", status: "pending", estimatedHours: 3 };
    const result = m.computeAssignmentPace(ev, [ev], "2026-09-10");
    assert.notEqual(result, undefined);
  });
});

describe("Assignment detail page navigation wiring (source-level regression guards -- component closure, see this file's own top comment)", () => {
  test("StudlinPrep gains its own selectedAssignmentId state, same one-shot deep-link idiom as selectedExamId", () => {
    assert.match(APP_SOURCE, /const \[selectedAssignmentId,setSelectedAssignmentId\]=useState\(\(\)=>\{\s*\n\s*const pending=lsGet\("openPrepAssignmentId",null\);/);
  });

  test("clicking an assignment's name/status cell opens the new page instead of the shared edit modal", () => {
    assert.match(APP_SOURCE, /onClick=\{\(\)=>setSelectedAssignmentId\(a\.id\)\}/g);
    const matches = APP_SOURCE.match(/onClick=\{\(\)=>setSelectedAssignmentId\(a\.id\)\}/g) || [];
    assert.equal(matches.length, 2, "expected both the name cell and the status cell to route to the new page");
  });

  test("the assignments list is hidden while the detail page is open, and vice versa", () => {
    assert.match(APP_SOURCE, /\{tab==="assignments"&&!selectedAssignment&&\(\(\)=>\{/);
    assert.match(APP_SOURCE, /\{tab==="assignments"&&selectedAssignment&&\(\(\)=>\{/);
  });

  test("switching tabs resets both selectedExamId and selectedAssignmentId", () => {
    assert.match(APP_SOURCE, /setTab\(v\.id\);setSelectedExamId\(null\);setSelectedAssignmentId\(null\);/);
  });

  test("the toolbar (Group By/class/search) is hidden on the assignment detail page too, same as the exam one", () => {
    assert.match(APP_SOURCE, /const showTabToolbar=!\(tab==="exams"&&selectedExam\)&&!\(tab==="assignments"&&selectedAssignment\)&&tab!=="insights";/);
  });
});

describe("Assignment detail page's Attack Block eligibility mirrors EventDetailModal's canAddAttackBlock (source-level regression guard)", () => {
  test("both real shapes (deadline marker, legacy study-block item) qualify, and an item already linked to something else never does", () => {
    assert.match(APP_SOURCE, /const canStartAttackBlock=\(selectedAssignment\.kind==="deadline"\|\|isLegacyBlock\)&&!selectedAssignment\.isAttackBlock&&!selectedAssignment\.dueEventId&&!selectedAssignment\.deckId&&!selectedAssignment\.practiceExamId&&!selectedAssignment\.isExamPrepSession&&linkedSessions\.length===0;/);
  });

  test("the retroactive conversion reuses buildAssignmentAttackBlockPair with the assignment's own id as the marker id, same convention EventDetailModal's save() already established", () => {
    assert.match(APP_SOURCE, /const pair=buildAssignmentAttackBlockPair\(selectedAssignment\.id,fields,\[\],allEvents,routines,prefs,desiredDate,prefs\.workStartTime,false\);/);
  });
});
