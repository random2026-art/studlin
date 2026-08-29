// Regression test for the 2026-08-28 EventDetailModal delete fix.
//
// User report: clicking an exam sometimes opens a popup for a different,
// similarly-titled item -- traced to near-duplicate events (e.g. a syllabus
// scan's "Midterm 1" vs Canvas's own "Midterm Exam 1" for the same real
// exam) that the old exact-string dedup never caught (see cal-import.test.js
// and scheduling.test.js for that half of the fix). The user then asked:
// "in case duplication does occur make sure easy fix for that deletion" --
// but EventDetailModal, the single shared detail/edit surface used by
// Dashboard and the Upcoming sidebar, had no delete button at all, forcing
// a multi-step detour (close modal, find the day on the calendar, use a
// different delete button there) just to remove a duplicate.
//
// This adds a Delete button + confirm modal to EventDetailModal itself,
// wired through a new onDelete prop to an App()-level delete-with-undo
// handler (mirroring CalendarTab's own proven deleteEventWithUndo pattern,
// duplicated here rather than shared because App() and CalendarTab are
// separate top-level components with no shared local state).
//
// EventDetailModal and App() are both component closures, so these are
// source-level regression guards -- same established precedent as every
// other component-closure fix this session. Run with `npm test`.
const { test, describe } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");

const SOURCE = fs.readFileSync(path.join(__dirname, "..", "studlin-app.jsx"), "utf8");

describe("EventDetailModal: Delete button + confirm modal", () => {
  test("accepts an onDelete prop, defaulting to a no-op so every pre-existing caller stays byte-safe", () => {
    assert.match(SOURCE, /function EventDetailModal\(\{eventId,onClose,commit,onToast,setActive,setPricingOpen=\(\)=>\{\},onDelete=\(\)=>\{\}\}\)\{/);
  });

  test("has its own deleteConfirmOpen state, independent of the pre-existing cancelConfirmOpen state", () => {
    const idx = SOURCE.indexOf("function EventDetailModal(");
    const body = SOURCE.slice(idx, idx + 40000);
    assert.match(body, /const \[deleteConfirmOpen,setDeleteConfirmOpen\]=useState\(false\);/);
  });

  test("the main modal footer has a Delete button that opens the confirm modal, not an immediate delete", () => {
    const idx = SOURCE.indexOf("function EventDetailModal(");
    const body = SOURCE.slice(idx, idx + 40000);
    assert.match(body, /<Btn variant="danger" onClick=\{\(\)=>setDeleteConfirmOpen\(true\)\}>Delete<\/Btn>/);
  });

  test("a second, separate confirm modal gates the real delete -- no single click deletes real data", () => {
    const idx = SOURCE.indexOf("<Modal open={deleteConfirmOpen}");
    assert.notEqual(idx, -1, "EventDetailModal's own delete-confirm modal must exist (distinct from the pre-existing, unrelated deleteConfirm modal elsewhere in the file)");
    const body = SOURCE.slice(idx, idx + 400);
    assert.match(body, /<Modal open=\{deleteConfirmOpen\} onClose=\{\(\)=>setDeleteConfirmOpen\(false\)\} title="Delete this\?"/);
    assert.match(body, /<Btn variant="danger" onClick=\{\(\)=>\{setDeleteConfirmOpen\(false\);onDelete\(ev\);onClose\(\);\}\}>Delete<\/Btn>/);
  });

  test("the confirm modal's cancel path (Never mind) only closes the confirm, it never calls onDelete", () => {
    const idx = SOURCE.indexOf("<Modal open={deleteConfirmOpen}");
    const body = SOURCE.slice(idx, idx + 400);
    assert.match(body, /<Btn variant="subtle" onClick=\{\(\)=>setDeleteConfirmOpen\(false\)\}>Never mind<\/Btn>/);
  });
});

describe("App(): delete-with-undo wiring for EventDetailModal (mirrors CalendarTab's proven deleteEventWithUndo pattern)", () => {
  test("deleteEventFromDetail removes the event from storage and syncs CalendarTab's own local state via calendarSetEventsRef", () => {
    assert.match(SOURCE, /const deleteEventFromDetail=\(ev\)=>\{\s*const next=lsGet\("events",\[\]\)\.filter\(e=>e\.id!==ev\.id\);\s*lsSet\("events",next\);if\(calendarSetEventsRef\.current\)calendarSetEventsRef\.current\(next\);/);
  });

  test("deleting shows an undo toast that clears itself after 5 seconds, same timing as the calendar grid's own delete-undo", () => {
    const idx = SOURCE.indexOf("const deleteEventFromDetail=");
    const body = SOURCE.slice(idx, idx + 700);
    assert.match(body, /setEventDeleteUndoSnapshot\(ev\);/);
    assert.match(body, /setEventDeleteUndoToast\(`Deleted "\$\{ev\.title\}"`\);/);
    assert.match(body, /setTimeout\(\(\)=>\{setEventDeleteUndoToast\(""\);setEventDeleteUndoSnapshot\(null\);\},5000\);/);
  });

  test("undoEventDeleteFromDetail restores the exact deleted event back into storage", () => {
    assert.match(SOURCE, /const undoEventDeleteFromDetail=\(\)=>\{\s*if\(!eventDeleteUndoSnapshot\)return;\s*const next=\[\.\.\.lsGet\("events",\[\]\),eventDeleteUndoSnapshot\];\s*lsSet\("events",next\);if\(calendarSetEventsRef\.current\)calendarSetEventsRef\.current\(next\);/);
  });

  test("EventDetailModal's render site passes the real handler, not the default no-op", () => {
    const idx = SOURCE.indexOf("<EventDetailModal eventId={detailEventId}");
    assert.notEqual(idx, -1, "EventDetailModal render site must exist");
    const body = SOURCE.slice(idx, idx + 400);
    assert.match(body, /onDelete=\{deleteEventFromDetail\}/);
  });

  test("the undo toast renders with a visible Undo action wired to undoEventDeleteFromDetail", () => {
    const idx = SOURCE.indexOf("{eventDeleteUndoToast&&(");
    assert.notEqual(idx, -1, "undo toast render block must exist");
    const body = SOURCE.slice(idx, idx + 700);
    assert.match(body, /<span>\{eventDeleteUndoToast\}<\/span>/);
    assert.match(body, /<button onClick=\{undoEventDeleteFromDetail\}/);
  });
});
