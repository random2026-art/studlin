// getRoutineOccurrenceNote/saveRoutineOccurrenceNote -- per-class-meeting
// notes and to-do ("each class might have a different thing to do,"
// clicking a specific day's class on the calendar to add notes for that
// day specifically). Reuses the existing routineOverrides store (same one
// a "just this occurrence" retime/resize already writes to) rather than a
// second parallel store -- these tests exist specifically to prove that
// reuse doesn't let either side silently clobber the other, since that
// was a real bug caught while building this (a note-only override used
// to blank out an occurrence's real time to undefined; a retime/resize
// used to wholesale-replace the day's entry, wiping any note already
// there). Run with `npm test`.
const { test, describe } = require("node:test");
const assert = require("node:assert/strict");
const { loadStudlinModule } = require("./harness.js");

describe("getRoutineOccurrenceNote / saveRoutineOccurrenceNote", () => {
  test("nothing saved yet -> empty, well-formed shape, never throws", () => {
    const m = loadStudlinModule();
    const result = m.getRoutineOccurrenceNote("r1", "2026-09-07");
    assert.equal(result.note, "");
    assert.equal(result.todo.length, 0);
  });

  test("round-trips a real note and to-do list exactly", () => {
    const m = loadStudlinModule();
    m.saveRoutineOccurrenceNote("r1", "2026-09-07", { note: "Worksheet due, covers ch 4", todo: [{ text: "Bring calculator", done: false }] });
    const result = m.getRoutineOccurrenceNote("r1", "2026-09-07");
    assert.equal(result.note, "Worksheet due, covers ch 4");
    assert.equal(result.todo.length, 1);
    assert.equal(result.todo[0].text, "Bring calculator");
  });

  test("a note on one date never leaks onto a different date for the same routine", () => {
    const m = loadStudlinModule();
    m.saveRoutineOccurrenceNote("r1", "2026-09-07", { note: "Monday's note", todo: [] });
    const other = m.getRoutineOccurrenceNote("r1", "2026-09-09");
    assert.equal(other.note, "");
  });

  test("a note on one routine never leaks onto a different routine, same date", () => {
    const m = loadStudlinModule();
    m.saveRoutineOccurrenceNote("r1", "2026-09-07", { note: "Chem note", todo: [] });
    const other = m.getRoutineOccurrenceNote("r2", "2026-09-07");
    assert.equal(other.note, "");
  });

  test("saving a note-only patch does NOT disturb an existing startTime/duration override for the same occurrence", () => {
    const m = loadStudlinModule();
    // Simulate a prior "just this occurrence" retime (same shape
    // applyRoutineDropScope's own write uses).
    m.saveRoutineOverrides({ r1: { "2026-09-07": { startTime: "10:00", duration: 45 } } });
    m.saveRoutineOccurrenceNote("r1", "2026-09-07", { note: "Added later", todo: [] });
    const overrides = m.getRoutineOverrides();
    assert.equal(overrides.r1["2026-09-07"].startTime, "10:00", "the earlier retime must survive a later note save");
    assert.equal(overrides.r1["2026-09-07"].duration, 45);
    assert.equal(overrides.r1["2026-09-07"].note, "Added later");
  });

  test("a note-only override does not corrupt expandRoutineOccurrences' computed time/duration for that occurrence", () => {
    const m = loadStudlinModule();
    m.saveWeeklyRoutine([{ id: "r1", kind: "class", title: "Chem 101", subject: "Chem", days: [0], startTime: "09:00", duration: 50 }]);
    m.saveRoutineOccurrenceNote("r1", "2026-09-07", { note: "Worksheet due", todo: [] });
    const occs = m.expandRoutineOccurrences(m.getWeeklyRoutine(), "2026-09-07", "2026-09-07");
    assert.equal(occs.length, 1);
    assert.equal(occs[0].time, "09:00", "a note-only override must never blank out the real class time");
    assert.equal(occs[0].duration, 50);
    assert.equal(occs[0].dayNote, "Worksheet due");
  });

  test("expandRoutineOccurrences carries dayNote/dayTodo through onto the occurrence object, defaulting to empty when nothing was saved", () => {
    const m = loadStudlinModule();
    m.saveWeeklyRoutine([{ id: "r1", kind: "class", title: "Chem 101", subject: "Chem", days: [0], startTime: "09:00", duration: 50 }]);
    const occs = m.expandRoutineOccurrences(m.getWeeklyRoutine(), "2026-09-07", "2026-09-07");
    assert.equal(occs[0].dayNote, "");
    assert.equal(occs[0].dayTodo.length, 0);
  });

  test("an existing startTime/duration override still works exactly as before -- overridden stays true, time/duration reflect the override", () => {
    const m = loadStudlinModule();
    m.saveWeeklyRoutine([{ id: "r1", kind: "class", title: "Chem 101", subject: "Chem", days: [0], startTime: "09:00", duration: 50 }]);
    m.saveRoutineOverrides({ r1: { "2026-09-07": { startTime: "10:30", duration: 40 } } });
    const occs = m.expandRoutineOccurrences(m.getWeeklyRoutine(), "2026-09-07", "2026-09-07");
    assert.equal(occs[0].time, "10:30");
    assert.equal(occs[0].duration, 40);
    assert.equal(occs[0].overridden, true);
  });

  test("a later retime/resize save preserves a note that was already there (merge, not replace)", () => {
    const m = loadStudlinModule();
    m.saveRoutineOccurrenceNote("r1", "2026-09-07", { note: "Existing note", todo: [{ text: "Item", done: false }] });
    // Simulate applyRoutineDropScope's own "just this one" write, merge style.
    const overrides = m.getRoutineOverrides();
    const forRoutine = { ...(overrides.r1 || {}) };
    forRoutine["2026-09-07"] = { ...(forRoutine["2026-09-07"] || {}), startTime: "11:00", duration: 60 };
    m.saveRoutineOverrides({ ...overrides, r1: forRoutine });
    const result = m.getRoutineOccurrenceNote("r1", "2026-09-07");
    assert.equal(result.note, "Existing note", "the note must survive a subsequent retime write");
    assert.equal(result.todo.length, 1);
  });
});
