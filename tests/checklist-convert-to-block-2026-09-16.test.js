// User request, 2026-09-16: "have it an option maybe ... next to each
// checklist to convert to actual block where you can say that and drag and
// drop anywhere." Discussed the two halves of the ask separately -- a
// per-day-scoped checklist was pushed back on (redundant with Tasks, which
// already support a due date with no time; would fragment into a third
// parallel todo system) and the user agreed to skip it. This is just the
// "convert to a real draggable block" half.
//
// Reuses CalendarTab's own "To place" drag tray (unplacedTaskDrafts,
// see new-task-drag-drop-2026-09-09.test.js) rather than inventing a
// second drag mechanism -- Dashboard and CalendarTab are separate
// components with no shared closure, so this writes the exact same draft
// shape addUnplacedTaskDraft would directly to the same localStorage key,
// the established interop convention every other cross-tab feature in
// this file already uses (see `events` itself).
//
// Source-level regression guards only -- component-closure UI, same
// mixed-coverage convention this file's other Dashboard/Calendar features
// use. Run with `npm test`.
const { test, describe } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");

const SOURCE = fs.readFileSync(path.join(__dirname, "..", "studlin-app.jsx"), "utf8");

describe("convertChecklistItemToBlock: turns a checklist to-do into a real draggable draft", () => {
  test("writes the exact same draft shape addUnplacedTaskDraft produces, to the same unplacedTaskDrafts localStorage key", () => {
    const idx = SOURCE.indexOf("const convertChecklistItemToBlock=(item)=>{");
    assert.notEqual(idx, -1);
    const body = SOURCE.slice(idx, idx + 900);
    assert.match(body, /kind:"study block"/, "a checklist item has no real deadline semantics -- \"spend focused time on this\" (study block) is the right shape, not \"deadline\"");
    assert.match(body, /isGeneralTask:true/, "matches what dragNewTaskPayload produces for a plain Task");
    assert.match(body, /id:"draft-"\+Date\.now\(\)/, "same id-prefix convention addUnplacedTaskDraft itself uses");
    assert.match(body, /lsGet\("unplacedTaskDrafts",\[\]\)/);
    assert.match(body, /lsSet\("unplacedTaskDrafts",\[\.\.\.drafts,draft\]\)/);
  });

  test("removes the original checklist item from events rather than leaving a duplicate behind", () => {
    const idx = SOURCE.indexOf("const convertChecklistItemToBlock=(item)=>{");
    const body = SOURCE.slice(idx, idx + 900);
    assert.match(body, /lsSet\("events",all\.filter\(ev=>ev\.id!==item\.id\)\)/);
  });

  test("shows a toast naming the item and where it went, not a silent update -- CLAUDE.md's async-confirmation guardrail", () => {
    const idx = SOURCE.indexOf("const convertChecklistItemToBlock=(item)=>{");
    const body = SOURCE.slice(idx, idx + 900);
    assert.match(body, /setChecklistConvertToast\(`Added "\$\{item\.title\}" to Calendar's "To place" tray/);
  });
});

describe("checklist row: the convert action is reachable but never on a completed item", () => {
  test("the button only renders when the item isn't done, and stops click propagation so it doesn't also toggle the checkbox", () => {
    const idx = SOURCE.indexOf("{item.status!==\"done\"&&(");
    assert.notEqual(idx, -1, "couldn't find the conditional convert-button wrapper");
    const body = SOURCE.slice(idx, idx + 400);
    assert.match(body, /onClick=\{\(e\)=>\{e\.stopPropagation\(\);convertChecklistItemToBlock\(item\);\}\}/);
    assert.match(body, />To calendar<\/button>/);
  });
});
