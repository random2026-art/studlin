// User report + screenshot, 2026-09-09: a friend manually added a "class"
// (Type picker in the general New Task modal, or by switching an existing
// item's Type in EventDetailModal/"Edit task") and it silently became a
// permanently broken, non-repeating one-off events[] entry -- neither modal
// has any concept of a recurring weekly rule for anything but Task's own
// Repeat field, so there was never a way to make it actually meet on
// specific days like a real class does. Editing it afterward opened
// EventDetailModal (not the routine day-picker) because it genuinely isn't
// a routine -- confirming, not just describing, the underlying bug.
//
// A real class can only come out correctly through Courses' own "+ Add
// new" -> ClassSetupWizard, which builds a real routine (multi-day, term-
// aware). Investigation also found a partially-working escape hatch in the
// New Task modal ("Save to my Weekly Routine", shown for Exam/Class/
// Activity) that does build a real routine -- but it's opt-in, unchecked
// by default, only captures ONE day per use, and has no equivalent in
// EventDetailModal, so a mistake there could never be fixed in place.
// Removed "class" as a Type option from both general-purpose modals rather
// than leave a trap with no reliable way to use it correctly.
//
// Source-level regression guards (component-closure UI) -- same
// mixed-coverage convention this session uses elsewhere. Run with `npm test`.
const { test, describe } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");

const SOURCE = fs.readFileSync(path.join(__dirname, "..", "studlin-app.jsx"), "utf8");

describe("'class' is no longer a selectable Type in either general-purpose task modal", () => {
  test("EventDetailModal's ('Edit task') Type row no longer offers 'class'", () => {
    const idx = SOURCE.indexOf('<Field label="Type"><SelectChip options={[{value:"assignment",label:"Assignment"},{value:"study block",label:"Study Session"}');
    assert.notEqual(idx, -1, "EventDetailModal's Type SelectChip should still exist");
    const body = SOURCE.slice(idx, idx + 400);
    assert.doesNotMatch(body, /"class"/, "class must not be a pickable Type here -- this modal has no recurring-rule concept at all");
    assert.match(body, /"exam"/, "other real one-off kinds must still be selectable");
  });

  test("the New Task modal's Type row no longer offers 'class'", () => {
    const idx = SOURCE.indexOf('<SelectChip options={[{value:"assignment",label:"Assignment"},{value:"studySession",label:"Study Session"}');
    assert.notEqual(idx, -1, "New Task modal's Type SelectChip should still exist");
    const body = SOURCE.slice(idx, idx + 300);
    assert.doesNotMatch(body, /"class"/, "class must not be a pickable Type here -- its own Repeat field is hard-scoped to Type Task only, so a class made here could never actually repeat weekly");
    assert.match(body, /"exam"/, "other real one-off kinds must still be selectable");
  });

  test("the routine editor (NewEventModal, used for actually editing a real Class/Activity/Habit routine) is untouched and still offers class", () => {
    const idx = SOURCE.indexOf('<Field label="Type"><SelectChip options={[{value:"class",label:"Class"}');
    assert.notEqual(idx, -1, "the real routine-editing Type picker must still exist and still include class -- only the two broken general-purpose entry points were fixed");
  });
});
