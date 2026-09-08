// Regression tests for two 2026-09-08 user reports, both confirmed live
// against the user's real account via browser inspection before being
// fixed:
//
// 1. "when i created a project it never showed up for project in studlin
//    prep" -- confirmed via live localStorage inspection: the created
//    "IBE MID PROJECT" event had kind:"deadline", a real notes field, and
//    a real deadline, but NO phases and NO outline at all.
//    isProjectMarker (phases.length>0||outline.length>0) never fired, so
//    it silently saved as a plain deadline instead of a project anywhere
//    in the app. Root cause: PhasesOutlineEditor's own "Break it into
//    phases?"/"Add a step-by-step checklist?" suggestion buttons are
//    entirely optional/click-to-generate -- nothing ever required using
//    either one before a Project could be saved.
//
// 2. "it has scheduled date as due date" -- the SAME event above had
//    date:"2026-09-08" (today, where its one manually-scheduled work
//    session landed) and deadline:"2026-10-08" (the real due date a month
//    out), but the Calendar sidebar's "Due Today"/"Overdue"/date-grouped
//    sections all bucketed strictly by `.date`, showing it as "Due Today"
//    while its real deadline was ignored.
//
// Both fixes live inside component closures (NewEventModal/
// EventDetailModal/CalendarTab), not exported pure functions, hence
// source-level regression guards -- same established precedent as every
// other component-closure fix this session. Run with `npm test`.
const { test, describe } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");

const SOURCE = fs.readFileSync(path.join(__dirname, "..", "studlin-app.jsx"), "utf8");

describe("A Project can no longer be saved with no real phases/outline breakdown", () => {
  test("saveManual blocks with a clear message when neither phases nor outline exist yet", () => {
    const idx = SOURCE.indexOf("const projectMissingBreakdown=()=>");
    assert.notEqual(idx, -1, "the shared guard helper must exist");
    const idx2 = SOURCE.indexOf("const saveManual=()=>{");
    const body = SOURCE.slice(idx2, idx2 + 600);
    assert.match(body, /if\(projectMissingBreakdown\(\)\)\{setEvDetailErr\(/, "saveManual must call the guard before building the task");
  });

  test("aiArrange has the same guard", () => {
    const idx = SOURCE.indexOf("const aiArrange=async()=>{");
    assert.notEqual(idx, -1);
    const body = SOURCE.slice(idx, idx + 1200);
    assert.match(body, /if\(projectMissingBreakdown\(\)\)\{setEvDetailErr\(/);
  });

  test("placeAssignmentManually has the same guard", () => {
    const idx = SOURCE.indexOf("const placeAssignmentManually=()=>{");
    assert.notEqual(idx, -1);
    const body = SOURCE.slice(idx, idx + 400);
    assert.match(body, /if\(projectMissingBreakdown\(\)\)\{setEvDetailErr\(/);
  });

  test("EventDetailModal's own save (switching an existing item's Type to Project) has the equivalent guard", () => {
    const idx = SOURCE.indexOf("function EventDetailModal(");
    assert.notEqual(idx, -1);
    const saveIdx = SOURCE.indexOf("const save=()=>{", idx);
    const body = SOURCE.slice(saveIdx, saveIdx + 1400);
    assert.match(body, /if\(requiresProjectDetail&&!\(projectPlan\.phases&&projectPlan\.phases\.length>0\)&&!\(projectPlan\.outline&&projectPlan\.outline\.length>0\)\)\{setDetailErr\(/);
  });
});

describe("Calendar sidebar's Due Today/Overdue/date-groups use the real deadline, not the scheduled work-session date", () => {
  test("dueKeyOf falls back to .date only when there's no separate deadline", () => {
    assert.match(SOURCE, /const dueKeyOf=\(item\)=>item\.deadline\|\|item\.date;/);
  });

  test("the raw upcoming-items sort also uses dueKeyOf, so same-due-date items stay adjacent for the grouping pass below", () => {
    const idx = SOURCE.indexOf("const sidebarUpcomingItems=(()=>{");
    const body = SOURCE.slice(idx, idx + 1600);
    assert.match(body, /\.sort\(\(a,b\)=>\{const ka=dueKeyOf\(a\),kb=dueKeyOf\(b\);/, "sorting by raw .date while grouping by dueKeyOf would split one due-date group into multiple non-adjacent runs");
  });

  test("Due Today, Overdue, and the future date-groups all key off dueKeyOf consistently", () => {
    assert.match(SOURCE, /const sidebarOverdueItems=sidebarUpcomingItems\.filter\(item=>dueKeyOf\(item\)<todayK\);/);
    assert.match(SOURCE, /const sidebarDueTodayItems=sidebarUpcomingItems\.filter\(item=>dueKeyOf\(item\)===todayK\);/);
    assert.match(SOURCE, /sidebarUpcomingItems\.filter\(item=>dueKeyOf\(item\)>todayK\)\.forEach\(item=>\{\s*const label=dueDateLabel\(dueKeyOf\(item\)\);/);
  });
});
