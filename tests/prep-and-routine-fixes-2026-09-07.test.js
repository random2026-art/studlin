// Regression tests for a batch of 2026-09-07 user reports (screenshots +
// direct feedback), all in studlin-app.jsx:
//
// 1. CRITICAL REGRESSION (yesterday's own taxonomy fix): the Type picker's
//    "Assignment" value changed from "deadline" to "assignment", but
//    typeChoice's fallback still returned the raw kind string for anything
//    without the new isAssignment flag -- exactly what a syllabus-scanned
//    assignment (or any pre-existing deadline item) looks like. Nothing
//    showed as selected in the Type picker at all.
// 2. A new Habit never auto-scheduled itself the same day it was created
//    -- materializeHabitsForDate only ever ran from App()'s once-a-day
//    tick, already gated shut by the time a student mid-session creates
//    one.
// 3. A brand-new routine's Color field was gated on editRoutine, so it
//    never rendered at all during creation (only once you came back to
//    edit), and its default was always the same hardcoded swatch instead
//    of an unused one.
// 4. The per-course "Import syllabus" scan still showed the old plain
//    "Reading your syllabus…" text while its sibling entry points already
//    show real incremental progress.
// 5. A syllabus-deferred assignment (prepPending) had no visible control
//    anywhere in Studlin Prep to start its Attack Block early or decline
//    it -- only a transient banner that's easy to miss.
//
// StudlinPrep/CalendarTab/NewEventModal/RoutineControlCenterModal are all
// component closures, so these are source-level regression guards, same
// established precedent as every other component-closure fix this
// session. Run with `npm test`.
const { test, describe } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");

const SOURCE = fs.readFileSync(path.join(__dirname, "..", "studlin-app.jsx"), "utf8");

describe("EventDetailModal: typeChoice falls back to 'assignment' for a plain deadline-kind item, not the raw kind string", () => {
  test("kind===\"deadline\" with no UI-level flags set resolves to the real 'assignment' Type option", () => {
    const idx = SOURCE.indexOf("const typeChoice=asProject?");
    assert.notEqual(idx, -1);
    const line = SOURCE.slice(idx, idx + 250);
    assert.match(line, /asChecklist\?"todo":kind==="deadline"\?"assignment":kind/, "a syllabus-scanned or otherwise pre-existing deadline-kind item must show as Assignment, never nothing selected");
  });
});

describe("CalendarTab: a new Habit materializes onto the calendar immediately on save, not just on the next full page load", () => {
  test("commitNewEvent calls materializeHabitsForDate right after persistRoutines for kind===\"habit\"", () => {
    const idx = SOURCE.indexOf("const commitNewEvent=(payload)=>{");
    assert.notEqual(idx, -1, "commitNewEvent must exist");
    const body = SOURCE.slice(idx, idx + 12000);
    assert.match(body, /if\(kind==="habit"\)\{\s*const createdHabits=materializeHabitsForDate\(dayKey\(\),events\);/);
  });
});

describe("NewEventModal: a brand-new routine's Color field is no longer gated on editRoutine", () => {
  test("the Color field render no longer requires editRoutine to be truthy", () => {
    const idx = SOURCE.indexOf('evKind!=="class"&&<Field label="Color"><ColorSelect value={routineColor} onChange={setRoutineColor} /></Field>');
    assert.notEqual(idx, -1, "the Color field must render for a new (non-editRoutine) routine too");
    // The OLD, buggy gate must be gone, not just duplicated alongside a new one.
    assert.equal(SOURCE.includes('editRoutine&&evKind!=="class"&&<Field label="Color">'), false);
  });

  test("a new routine's default color comes from nextAvailableSubjectColor, not a hardcoded T.lime", () => {
    assert.match(SOURCE, /setRoutineColor\(nextAvailableSubjectColor\(\[\.\.\.getSubjects\(\)\.map\(s=>s\.color\),\.\.\.\(routines\|\|\[\]\)\.filter\(r=>r\.color\)\.map\(r=>r\.color\)\]\)\);/);
  });
});

describe("RoutineControlCenterModal: a new Activity/Habit's color avoids every color already in use", () => {
  test("initial color state uses nextAvailableSubjectColor, not a hardcoded SUBJECT_COLORS[0]", () => {
    const idx = SOURCE.indexOf("const usedRoutineAndSubjectColors=()=>");
    assert.notEqual(idx, -1);
    const body = SOURCE.slice(idx, idx + 400);
    assert.match(body, /const \[color,setColor\]=useState\(\(\)=>nextAvailableSubjectColor\(usedRoutineAndSubjectColors\(\)\)\);/);
  });

  test("resetForm also re-derives an unused color instead of resetting to the same hardcoded swatch", () => {
    const idx = SOURCE.indexOf("const resetForm=()=>{setTitle(\"\")");
    assert.notEqual(idx, -1);
    const line = SOURCE.slice(idx, idx + 250);
    assert.match(line, /setColor\(nextAvailableSubjectColor\(usedRoutineAndSubjectColors\(\)\)\)/);
    assert.equal(line.includes("setColor(SUBJECT_COLORS[0])"), false, "the old hardcoded reset must be gone");
  });
});

describe("ClassSetupWizard: the per-course syllabus scan shows real extraction progress, not the old static text", () => {
  test("the 'scan' addMode's loading state renders ExtractionProgress like its sibling entry points", () => {
    // 2026-09-11: this step's condition grew a sibling addMode
    // ("scanForThisClass", see the inline-onboarding-syllabus fix) --
    // anchored on this block's own unique comment instead of the exact
    // addMode condition text, which now has different parenthesization.
    const idx = SOURCE.indexOf("Bug fix, 2026-09-07 user report: this was the one syllabus-");
    assert.notEqual(idx, -1);
    const body = SOURCE.slice(idx, idx + 1200);
    assert.match(body, /<ExtractionProgress fileName="Your syllabus" stage="analyze" analyzeLabel="Finding assignments and exam dates\.\.\." \/>/);
    assert.equal(body.includes("Reading your syllabus"), false, "the old plain-text loading state must be gone");
  });
});

describe("StudlinPrep: a prepPending assignment gets a real, always-visible Start now / Not needed control", () => {
  test("StudlinPrep accepts onStartPrepNow/onDeclinePrep props", () => {
    // onTaskCompleted (2026-09-10) added alongside these -- see
    // prep-attack-block-checkin-2026-09-10.test.js for that fix's own
    // coverage; unrelated to what this test itself checks.
    assert.match(SOURCE, /function StudlinPrep\(\{setActive=\(\)=>\{\},setDetailEventId=\(\)=>\{\},onStartPrepNow=\(\)=>\{\},onDeclinePrep=\(\)=>\{\},onTaskCompleted=\(\)=>\{\},onShowOnCalendar=null\}=\{\}\)\{/);
  });

  test("App() wires the real acceptPrepPrompt/declinePrepPrompt functions into StudlinPrep -- one implementation, not a second copy", () => {
    assert.match(SOURCE, /<StudlinPrep setActive=\{setActive\} setDetailEventId=\{setDetailEventId\} onStartPrepNow=\{acceptPrepPrompt\} onDeclinePrep=\{declinePrepPrompt\} onTaskCompleted=\{handleTaskCompleted\} onShowOnCalendar=/);
  });

  test("the Assignments row shows the prepPending control instead of the plain status label, with stopPropagation so it never also opens the detail modal", () => {
    const idx = SOURCE.indexOf("{a.prepPending?(");
    assert.notEqual(idx, -1);
    const body = SOURCE.slice(idx, idx + 1400);
    assert.match(body, /onStartPrepNow\(\{id:a\.id,title:a\.title,date:a\.date,noteId:a\.noteId,priority:a\.priority,difficulty:a\.difficulty,phases:a\.phases\?a\.phases\.map\(p=>p\.name\):null\}\)/);
    assert.match(body, /onDeclinePrep\(\{id:a\.id\}\)/);
    assert.match(body, /e\.stopPropagation\(\)/);
  });
});
