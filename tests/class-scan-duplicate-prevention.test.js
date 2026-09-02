// Tests for the class-scan duplicate-prevention fix.
//
// Real reported bug: re-scanning a class you already had (a second
// onboarding pass, or running "Scan syllabus" again later) always minted
// a brand-new subject AND brand-new weekly class routine rows, stacking
// on top of the old ones with zero check for whether they already
// existed. One real account showed a single class scanned 4 separate
// times ending up as 4 sidebar course entries with 4 overlapping
// calendar blocks -- confirmed directly from screenshots (two "Applied
// Engineering" blocks back to back, two overlapping "Principles of
// Economics" blocks 5 minutes apart, from two scan passes reading the
// same real meeting slightly differently: "7:55-9:10am" vs "8-9am").
//
// routineMeetingsOverlap/newMeetingTimesForCourse are the new pure
// prevention primitives (used by commitAllToCalendar/commitHsSchedule,
// both component-internal closures not reachable from this harness);
// dedupCourseClassRoutines is the cleanup pass added to the existing
// mergeCourses (Settings' "Merge duplicates" button), for accounts that
// already accumulated duplicates before this fix existed.
const { test, describe } = require("node:test");
const assert = require("node:assert/strict");
const { loadStudlinModule } = require("./harness.js");

function classRow(overrides) {
  return { id: "rt-1", title: "Chem", kind: "class", subject: "Chem", courseId: "subj-1", days: [0, 2], startTime: "10:00", duration: 50, ...overrides };
}

describe("routineMeetingsOverlap", () => {
  test("same day, overlapping time -> true", () => {
    const { routineMeetingsOverlap } = loadStudlinModule();
    assert.equal(routineMeetingsOverlap({ days: [0], startTime: "08:00", duration: 60 }, { days: [0], startTime: "08:30", duration: 30 }), true);
  });
  test("same day, back-to-back (end === start) -> false, not an overlap", () => {
    const { routineMeetingsOverlap } = loadStudlinModule();
    assert.equal(routineMeetingsOverlap({ days: [0], startTime: "08:00", duration: 60 }, { days: [0], startTime: "09:00", duration: 60 }), false);
  });
  test("disjoint days, same time -> false", () => {
    const { routineMeetingsOverlap } = loadStudlinModule();
    assert.equal(routineMeetingsOverlap({ days: [0], startTime: "08:00", duration: 60 }, { days: [1], startTime: "08:00", duration: 60 }), false);
  });
  test("multi-day arrays with one shared day and overlapping time -> true", () => {
    const { routineMeetingsOverlap } = loadStudlinModule();
    assert.equal(routineMeetingsOverlap({ days: [0, 2, 4], startTime: "08:00", duration: 60 }, { days: [2], startTime: "08:15", duration: 30 }), true);
  });
  test("OCR-noise near-times for what's really the same meeting -> true", () => {
    const { routineMeetingsOverlap } = loadStudlinModule();
    // The real reported case: one scan read "7:55-9:10am", another read "8-9am".
    assert.equal(routineMeetingsOverlap({ days: [0], startTime: "07:55", duration: 75 }, { days: [0], startTime: "08:00", duration: 60 }), true);
  });
});

describe("newMeetingTimesForCourse", () => {
  test("an exact-duplicate meeting time for the course is filtered out", () => {
    const { newMeetingTimesForCourse } = loadStudlinModule();
    const routine = [classRow({ courseId: "subj-1", days: [0], startTime: "08:00", duration: 60 })];
    const fresh = newMeetingTimesForCourse("subj-1", "Chem", [{ days: [0], startTime: "08:00", duration: 60 }], routine);
    assert.equal(fresh.length, 0);
  });
  test("an OCR-noise near-duplicate is also filtered out, not just an exact match", () => {
    const { newMeetingTimesForCourse } = loadStudlinModule();
    const routine = [classRow({ courseId: "subj-1", days: [0], startTime: "07:55", duration: 75 })];
    const fresh = newMeetingTimesForCourse("subj-1", "Chem", [{ days: [0], startTime: "08:00", duration: 60 }], routine);
    assert.equal(fresh.length, 0);
  });
  test("a genuinely new day pattern (a lab added in a later scan) is kept", () => {
    const { newMeetingTimesForCourse } = loadStudlinModule();
    const routine = [classRow({ courseId: "subj-1", days: [0, 2], startTime: "08:00", duration: 60 })];
    const fresh = newMeetingTimesForCourse("subj-1", "Chem", [{ days: [3], startTime: "09:00", duration: 60 }], routine);
    assert.equal(fresh.length, 1);
  });
  test("a genuinely non-overlapping new time on an already-met day is kept, not treated as a duplicate", () => {
    const { newMeetingTimesForCourse } = loadStudlinModule();
    const routine = [classRow({ courseId: "subj-1", days: [0], startTime: "08:00", duration: 60 })];
    const fresh = newMeetingTimesForCourse("subj-1", "Chem", [{ days: [0], startTime: "14:00", duration: 60 }], routine);
    assert.equal(fresh.length, 1);
  });
  test("a legacy courseId-less row is still recognized via label match", () => {
    const { newMeetingTimesForCourse } = loadStudlinModule();
    const routine = [classRow({ courseId: null, subject: "Chem", days: [0], startTime: "08:00", duration: 60 })];
    const fresh = newMeetingTimesForCourse("subj-1", "Chem", [{ days: [0], startTime: "08:00", duration: 60 }], routine);
    assert.equal(fresh.length, 0);
  });
});

describe("mergeCourses: now also deduplicates overlapping class routine rows, not just relabels", () => {
  test("merging two subjects each with an overlapping class-time row collapses to one subject, one class row, oldest id survives", () => {
    const m = loadStudlinModule();
    m.saveSubjects([
      { id: "subj-1", label: "Chem" },
      { id: "subj-2", label: "Chem" },
    ]);
    m.saveWeeklyRoutine([
      classRow({ id: "rt-1", courseId: "subj-1", days: [0], startTime: "08:00", duration: 60 }),
      classRow({ id: "rt-2", courseId: "subj-2", days: [0], startTime: "07:55", duration: 75 }),
    ]);
    const result = m.mergeCourses("subj-1", ["subj-2"]);
    assert.ok(result);
    const subjects = m.getSubjects();
    assert.equal(subjects.length, 1);
    assert.equal(subjects[0].id, "subj-1");
    const routine = m.getWeeklyRoutine();
    const classRows = routine.filter((r) => r.kind === "class");
    assert.equal(classRows.length, 1, "the two overlapping duplicate meeting-time rows should collapse to one");
    assert.equal(classRows[0].id, "rt-1", "oldest id survives");
  });

  test("a legitimately distinct second meeting time on either merged subject survives the merge untouched", () => {
    const m = loadStudlinModule();
    m.saveSubjects([
      { id: "subj-1", label: "Chem" },
      { id: "subj-2", label: "Chem" },
    ]);
    m.saveWeeklyRoutine([
      classRow({ id: "rt-1", courseId: "subj-1", days: [0], startTime: "08:00", duration: 60 }),
      classRow({ id: "rt-2", courseId: "subj-2", days: [0], startTime: "08:00", duration: 60 }),
      classRow({ id: "rt-3", courseId: "subj-2", days: [3], startTime: "09:00", duration: 60 }),
    ]);
    m.mergeCourses("subj-1", ["subj-2"]);
    const classRows = m.getWeeklyRoutine().filter((r) => r.kind === "class");
    assert.equal(classRows.length, 2, "the overlapping pair collapses, but the genuinely distinct Thursday meeting survives");
    assert.ok(classRows.some((r) => r.id === "rt-3"));
  });

  test("existing events-array reassignment behavior is unchanged (regression guard)", () => {
    const m = loadStudlinModule();
    m.saveSubjects([
      { id: "subj-1", label: "Chem" },
      { id: "subj-2", label: "Chem" },
    ]);
    m.lsSet("events", [{ id: "ev-1", courseId: "subj-2", subject: "Chem", title: "Midterm", kind: "exam", status: "pending" }]);
    m.mergeCourses("subj-1", ["subj-2"]);
    const events = m.lsGet("events", []);
    assert.equal(events[0].courseId, "subj-1");
    assert.equal(events[0].subject, "Chem");
  });

  test("real reproduction: a class scanned 4 times (4 subjects, 4 overlapping class rows) collapses to exactly 1 subject, 1 class row", () => {
    const m = loadStudlinModule();
    m.saveSubjects([
      { id: "subj-1", label: "Introductory Physics I" },
      { id: "subj-2", label: "Introductory Physics I" },
      { id: "subj-3", label: "Introductory Physics I" },
      { id: "subj-4", label: "Introductory Physics I" },
    ]);
    m.saveWeeklyRoutine([
      classRow({ id: "rt-1", courseId: "subj-1", title: "Introductory Physics I", subject: "Introductory Physics I", days: [0, 2], startTime: "11:00", duration: 60 }),
      classRow({ id: "rt-2", courseId: "subj-2", title: "Introductory Physics I", subject: "Introductory Physics I", days: [0, 2], startTime: "11:00", duration: 60 }),
      classRow({ id: "rt-3", courseId: "subj-3", title: "Introductory Physics I", subject: "Introductory Physics I", days: [0, 2], startTime: "10:45", duration: 50 }),
      classRow({ id: "rt-4", courseId: "subj-4", title: "Introductory Physics I", subject: "Introductory Physics I", days: [0, 2], startTime: "11:00", duration: 60 }),
    ]);
    const groups = m.findDuplicateCourseGroups();
    assert.equal(groups.length, 1);
    assert.equal(groups[0].length, 4);
    const ids = groups[0].map((s) => s.id);
    const keepId = ids.sort()[0];
    const mergeIds = ids.filter((id) => id !== keepId);
    m.mergeCourses(keepId, mergeIds);
    assert.equal(m.getSubjects().length, 1);
    assert.equal(m.getWeeklyRoutine().filter((r) => r.kind === "class").length, 1);
  });
});
