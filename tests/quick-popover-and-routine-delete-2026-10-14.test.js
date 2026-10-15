// 2026-10-14: "More options" keeps title/time/duration/date; a selected
// routine block shows a Delete button that goes through the confirm modal.
const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");
const SRC = fs.readFileSync(path.join(__dirname, "..", "studlin-app.jsx"), "utf8");
test("More options passes the popover's title and colour", () => {
  assert.ok(SRC.includes("onClick={()=>onMoreOptions(draft,title,color)}"));
});
test("handoff seeds title, time, duration and date into the full form", () => {
  const i = SRC.indexOf("const quickCreateMoreOptions=(draft,title,color)=>{");
  assert.notEqual(i, -1);
  const body = SRC.slice(i, i + 700);
  for (const t of ["setEvTitle(","setEvTime(draft.startTime)","setEvDuration(duration)","setEvDurationTouched(true)","setEvDate(draft.dateKey)"]) assert.ok(body.includes(t), t);
});
test("selected routine block shows Delete that opens the confirm modal", () => {
  assert.ok(SRC.includes("isRoutine&&!editRoutineMode&&isRoutineSelected&&onDeleteRoutine&&("));
  assert.ok(SRC.includes("onDeleteRoutine={setPendingDeleteRoutineId}"));
});
