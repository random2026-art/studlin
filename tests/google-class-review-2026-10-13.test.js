// 2026-10-13: "are these your classes?" review. Heuristics only GUESS what
// looks like a class (everything stays visible/toggleable); import creates
// real colored courses + class meetings and retires the gcal- duplicates.
const { test, describe } = require("node:test");
const assert = require("node:assert/strict");
const { loadStudlinModule } = require("./harness.js");

const mk = (title, days, time, duration, n) => ({ recurringId: "r-" + title + time, title, days, startTime: time, duration, occurrenceCount: n || 4 });
const gcal = (id, date, time, title, recurId, duration) => ({ id: "gcal-" + id, date, time, duration: duration || 50, title, googleRecurringId: recurId });

describe("looksLikeGoogleClass", () => {
  const { looksLikeGoogleClass } = loadStudlinModule({ now: "2026-10-13T09:00:00" });
  test("course-code titles on weekdays look like classes", () => {
    assert.equal(looksLikeGoogleClass(mk("MATH 101", [0, 2, 4], "10:00", 50)), true);
    assert.equal(looksLikeGoogleClass(mk("Organic Chemistry Lecture", [1, 3], "09:30", 75)), true);
  });
  test("gym, work shifts and meals never look like classes", () => {
    assert.equal(looksLikeGoogleClass(mk("Gym", [0, 2, 4], "17:00", 60)), false);
    assert.equal(looksLikeGoogleClass(mk("Work shift", [5, 6], "09:00", 240)), false);
    assert.equal(looksLikeGoogleClass(mk("Dinner with roommates", [2], "18:00", 60)), false);
  });
  test("weekend-only or very short events are not guessed as classes", () => {
    assert.equal(looksLikeGoogleClass(mk("Hangout", [5], "12:00", 15, 2)), false);
  });
});

describe("groupGoogleClassCandidates", () => {
  const { groupGoogleClassCandidates } = loadStudlinModule({ now: "2026-10-13T09:00:00" });
  test("series with the same title merge into one course with several meeting times", () => {
    const groups = groupGoogleClassCandidates([
      mk("MATH 101", [0, 2], "10:00", 50),
      mk("MATH 101", [4], "11:00", 50),
      mk("Gym", [1], "17:00", 60),
    ]);
    assert.equal(groups.length, 2);
    assert.equal(groups[0].title, "MATH 101");
    assert.equal(groups[0].meetingTimes.length, 2);
    assert.equal(groups[0].recurringIds.length, 2);
    assert.equal(groups[0].likely, true);
    assert.equal(groups[1].likely, false, "non-classes sort after likely ones");
  });
  test("same start time and duration merge their days into one meeting", () => {
    const groups = groupGoogleClassCandidates([mk("BIO 110", [0], "10:00", 50), mk("BIO 110", [2], "10:00", 50)]);
    assert.equal(groups[0].meetingTimes.length, 1);
    assert.equal(JSON.stringify(groups[0].meetingTimes[0].days), JSON.stringify([0, 2]));
  });
});

describe("importGoogleClassGroups", () => {
  test("creates a colored course + class routine and retires the gcal- duplicates", () => {
    const { importGoogleClassGroups, getSubjects, getWeeklyRoutine, lsGet, lsSet } = loadStudlinModule({ now: "2026-10-13T09:00:00" });
    lsSet("events", [gcal("1", "2026-10-06", "10:00", "MATH 101", "s1"), gcal("2", "2026-10-08", "10:00", "MATH 101", "s1"), gcal("3", "2026-10-07", "17:00", "Gym", "s2")]);
    const created = importGoogleClassGroups([{ title: "MATH 101", color: "#7BACDF", recurringIds: ["s1"], meetingTimes: [{ days: [0, 2], startTime: "10:00", duration: 50 }] }]);
    assert.equal(created.length, 1);
    const subj = getSubjects();
    assert.equal(subj.length, 1);
    assert.equal(subj[0].label, "MATH 101");
    assert.equal(subj[0].color, "#7BACDF");
    const routine = getWeeklyRoutine();
    assert.equal(routine.length, 1);
    assert.equal(routine[0].kind, "class");
    assert.equal(routine[0].courseId, subj[0].id);
    const remaining = lsGet("events", []);
    assert.equal(remaining.length, 1, "only the un-imported Gym event is left");
    assert.equal(remaining[0].title, "Gym");
    assert.ok(lsGet("importedGoogleRecurringIds", []).includes("s1"));
  });
  test("an existing course is reused, not duplicated", () => {
    const { importGoogleClassGroups, getSubjects, saveSubjects } = loadStudlinModule({ now: "2026-10-13T09:00:00" });
    saveSubjects([{ id: "subj-x", label: "Math 101", color: "#D9806B" }]);
    importGoogleClassGroups([{ title: "MATH 101", color: "#7BACDF", recurringIds: ["s1"], meetingTimes: [{ days: [0], startTime: "10:00", duration: 50 }] }]);
    assert.equal(getSubjects().length, 1);
  });
});
