// 2026-10-15: selected routine blocks delete via Backspace/Delete (no corner
// button), and the calendar's bottom-center toasts are portaled to <body>.
const { test, describe } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");
const APP = fs.readFileSync(path.join(__dirname, "..", "studlin-app.jsx"), "utf8").replace(/\r\n/g, "\n");

describe("routine delete shortcut", () => {
  test("no on-block Delete button for a selected routine occurrence", () => {
    assert.ok(!APP.includes('title="Delete (asks you to confirm)"'));
  });
  test("Backspace/Delete on a selected routine opens the confirm via onDeleteRoutine", () => {
    const i = APP.indexOf("Same shortcut for a selected recurring (routine) block");
    assert.ok(i > 0);
    const body = APP.slice(i, i + 900);
    assert.ok(body.includes('e.key!=="Backspace"&&e.key!=="Delete"'));
    assert.ok(body.includes("onDeleteRoutine(String(selectedRoutineKey).split(\"|\")[0])"));
    assert.ok(body.includes('el.tagName==="INPUT"'), "never fires while typing");
    assert.ok(APP.includes('title="Delete this routine?"'), "confirm modal still guards the delete");
  });
});

describe("toast centering", () => {
  test("BodyPortal exists and wraps the calendar toast groups", () => {
    assert.ok(APP.includes("const BodyPortal = "));
    assert.ok((APP.match(/<BodyPortal>/g) || []).length >= 2);
    const i = APP.indexOf("{reconcileToast&&(");
    const before = APP.lastIndexOf("<BodyPortal>", i);
    const closeBefore = APP.lastIndexOf("</BodyPortal>", i);
    assert.ok(before > closeBefore, "reconcileToast sits inside a BodyPortal");
  });
});
