// Regression tests for a 2026-08-27 batch of fixes requested directly by
// the user, all circling the same underlying theme: too many ways to get
// the same class/assignment data into Studlin (whole-schedule scan,
// per-class syllabus scan, connecting an LMS calendar like Canvas/
// Schoology/Moodle), with real risk of duplicate or mismatched-name data
// as a result.
//
// 1. ClassSetupWizard's "Import syllabus" quick-scan for an ALREADY
//    EXISTING course (targetCourseId set) used to pre-fill the review
//    screen's class name/color from whatever the AI guessed off the
//    syllabus header (e.g. "Calculus 2"), not the course's real,
//    already-established name/color (e.g. "Calc II") -- and that guessed
//    name then got stamped onto every new assignment/exam event's own
//    `subject` field (see commitSyllabusEvents' tag param), silently
//    mismatching the class everywhere else in the app even though the
//    underlying courseId was already correct.
// 2. Connecting a calendar (Canvas/Schoology/Moodle/Blackboard) reported
//    "N events synced" using the count of everything the student reviewed
//    and left checked -- not what actually landed. mergeImportedEvents'
//    own order-independent dedup (recognizing an item already created by
//    an earlier syllabus/whole-schedule scan) silently drops those before
//    they ever reach the calendar, so a student who'd already scanned a
//    syllabus saw an inflated "23 events synced" toast, then couldn't
//    find most of them -- not because anything was missing, but because
//    Studlin correctly already had them. Live report: "when i connected
//    coursesite it didnt give all assignments."
// 3. The AI classification pass for a large calendar import capped its
//    batch at 120 events without sorting first -- on a feed mixing
//    recurring class-meeting occurrences with standalone assignment/exam
//    VEVENTs (parseICS never sorts), the cap could classify a stack of
//    distant lecture occurrences ahead of a near-term assignment purely
//    by raw feed order.
//
// buildReviewFromExtraction and confirmImportCalendar are inside
// ClassSetupWizard/CalendarTab component closures -- source-level
// regression guards, same established precedent as every other
// component-closure fix this session. classifyImportedCalendarEvents is a
// real top-level function but network-dependent (authFetch) with no mock
// harness for it (same reasoning as extractFileText's own untested-before
// state) -- also covered by a source-level guard. Run with `npm test`.
const { test, describe } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");

const SOURCE = fs.readFileSync(path.join(__dirname, "..", "studlin-app.jsx"), "utf8");

describe("Fix 1: importing a syllabus for an existing course reuses its real name/color", () => {
  test("buildReviewFromExtraction looks up the target course before falling back to the AI's own guess", () => {
    assert.match(SOURCE, /const existingCourse=targetCourseId\?getSubjects\(\)\.find\(s=>s\.id===targetCourseId\):null;/);
  });

  test("subjectName prefers the existing course's real label, not result.subject.name, whenever targetCourseId is set", () => {
    assert.match(SOURCE, /subjectName:existingCourse\?existingCourse\.label:\(\(result\.subject&&result\.subject\.name\)\|\|""\),/);
  });

  test("color prefers the existing course's real color too, not a freshly assigned one", () => {
    assert.match(SOURCE, /color:existingCourse\?existingCourse\.color:nextColor\(\),/);
  });
});

describe("Fix 2: the calendar-import \"synced\" toast reports what actually landed, not what was merely reviewed", () => {
  test("the toast count is newIds.length (post-merge, post-dedup), not fetched.length (pre-merge)", () => {
    assert.match(SOURCE, /const skippedCount=fetched\.length-newIds\.length;/);
    assert.match(SOURCE, /showToast\(newIds\.length\+" new event"\+\(newIds\.length!==1\?"s":""\)\+" synced from "\+label/);
  });

  test("the toast names the gap instead of hiding it, whenever anything was recognized as already present", () => {
    const idx = SOURCE.indexOf("const skippedCount=fetched.length-newIds.length;");
    const snippet = SOURCE.slice(idx, idx + 400);
    assert.match(snippet, /skippedCount>0\?" \("\+skippedCount\+" already on your calendar\)":""/);
  });

  test("the old inflated fetched.length-based toast text is gone", () => {
    assert.doesNotMatch(SOURCE, /showToast\(fetched\.length\+" event"\+\(fetched\.length!==1\?"s":""\)\+" synced from "\+label\+reconcileToastSuffix\(result\)\);/);
  });
});

describe("Fix 3: calendar-import classification sorts soonest-first before capping at 120", () => {
  test("events are sorted by date before the cap is applied", () => {
    assert.match(SOURCE, /const sorted=\[\.\.\.events\]\.sort\(\(a,b\)=>\(a\.date\|\|"9999"\)\.localeCompare\(b\.date\|\|"9999"\)\);/);
    assert.match(SOURCE, /const capped=sorted\.slice\(0,120\);/);
  });

  test("the raw unsorted slice is gone", () => {
    assert.doesNotMatch(SOURCE, /const capped=events\.slice\(0,120\);/);
  });
});
