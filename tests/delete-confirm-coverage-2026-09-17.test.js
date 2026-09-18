// Internal audit finding, 2026-09-17: a dedicated enumeration pass over
// every real user-data delete function found three CLAUDE.md violations
// ("Anything that deletes user data... requires a confirm modal first.
// Never delete on a single click"), ranked by blast radius:
//
// [HIGH] deleteRoutineItem was wired directly (no wrapper) as
// onDeleteRoutine at BOTH of its real call sites -- WeeklyPlanner's
// calendar-grid hover-delete icon on a routine block, and
// RoutineControlCenterModal's plain "Delete" button -- permanently
// removing an entire recurring weekly commitment (every future
// occurrence of a class/routine) in one click, no undo. The same
// underlying function already had a real confirm gate elsewhere in the
// file (sidebar Activities list via confirmDeleteActivityId) -- this
// closes the gap at the two spots that bypassed it, via a standalone
// Modal (not inline two-step) since WeeklyPlanner has no existing
// confirm-state plumbing to thread through.
//
// [MED] deleteSession (an exam's own scheduled study session) fired on a
// single click, no confirm -- same inline "Delete -> Confirm/Cancel"
// convention as its sibling assignConfirmDeleteBlockId a few lines above
// it, just extended to this one too.
//
// [LOW] removeAiTimeOfDay (a single inferred AI-memory preference) had
// the same gap as deleteSession -- same fix, mirroring its own siblings
// confirmRemoveFactIdx/confirmClearMemory a few lines above it.
//
// Source-level regression guards -- component-closure UI, same
// mixed-coverage convention this file's other Calendar/Prep features use.
const { test, describe } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");

const SOURCE = fs.readFileSync(path.join(__dirname, "..", "studlin-app.jsx"), "utf8");

describe("[HIGH] routine/class deletion now requires confirming in a real Modal, at both call sites", () => {
  test("both onDeleteRoutine wiring sites pass the confirm-gating setter, not the raw delete function", () => {
    assert.doesNotMatch(SOURCE, /onDeleteRoutine=\{deleteRoutineItem\}/, "the raw, unconfirmed wiring must not survive at any call site");
    const matches = SOURCE.match(/onDeleteRoutine=\{setPendingDeleteRoutineId\}/g) || [];
    assert.equal(matches.length, 2, "both WeeklyPlanner's and RoutineControlCenterModal's wiring must route through the confirm gate");
  });

  test("a real confirm Modal renders, gated on pendingDeleteRoutineId, with Cancel and a real Delete that calls deleteRoutineItem", () => {
    const idx = SOURCE.indexOf('<Modal open={!!pendingDeleteRoutineId}');
    assert.notEqual(idx, -1);
    const body = SOURCE.slice(idx, idx + 700);
    assert.match(body, /title="Delete this routine\?"/);
    assert.match(body, /onClick=\{\(\)=>setPendingDeleteRoutineId\(null\)\}>Cancel<\/Btn>/);
    assert.match(body, /onClick=\{\(\)=>\{deleteRoutineItem\(pendingDeleteRoutineId\);setPendingDeleteRoutineId\(null\);\}\}>Delete<\/Btn>/);
    assert.match(body, /every future occurrence, not just this week's\. This can't be undone\./, "the modal must make clear this deletes the WHOLE recurring rule, not one occurrence -- the actual blast radius");
  });
});

describe("[MED] deleteSession (StudlinPrep exam session) now requires an inline Confirm/Cancel step", () => {
  test("the Delete button is gated behind confirmDeleteSessionId, matching the sibling assignConfirmDeleteBlockId convention", () => {
    const idx = SOURCE.indexOf("const [confirmDeleteSessionId,setConfirmDeleteSessionId]=useState(null);");
    assert.notEqual(idx, -1);
  });

  test("deleteSession is no longer called directly from a bare onClick with no gate", () => {
    assert.doesNotMatch(SOURCE, /onClick=\{\(\)=>\{deleteSession\(s\.id\);closeSession\(\);\}\}/, "the old ungated call must be gone");
    const idx = SOURCE.indexOf("{confirmDeleteSessionId===s.id?(");
    assert.notEqual(idx, -1);
    const body = SOURCE.slice(idx, idx + 700);
    assert.match(body, />Confirm<\/button>/);
    assert.match(body, />Cancel<\/button>/);
    assert.match(body, /deleteSession\(s\.id\);setConfirmDeleteSessionId\(null\);closeSession\(\);/);
  });
});

describe("[LOW] removeAiTimeOfDay (Settings AI memory) now requires an inline Forget/Cancel step", () => {
  test("the Remove button is gated behind confirmRemoveTimeOfDay, matching the sibling confirmRemoveFactIdx/confirmClearMemory convention", () => {
    const idx = SOURCE.indexOf("const [confirmRemoveTimeOfDay,setConfirmRemoveTimeOfDay]=useState(false);");
    assert.notEqual(idx, -1);
  });

  test("removeAiTimeOfDay is no longer called directly from a bare onClick with no gate", () => {
    assert.doesNotMatch(SOURCE, /onClick=\{removeAiTimeOfDay\}/, "the old ungated call must be gone");
    const idx = SOURCE.indexOf("{confirmRemoveTimeOfDay?(<>");
    assert.notEqual(idx, -1);
    const body = SOURCE.slice(idx, idx + 500);
    assert.match(body, />Forget<\/Btn>/);
    assert.match(body, />Cancel<\/Btn>/);
    assert.match(body, /removeAiTimeOfDay\(\);setConfirmRemoveTimeOfDay\(false\);/);
  });
});
