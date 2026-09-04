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
    const body = SOURCE.slice(idx, idx + 900);
    assert.match(body, /<Modal open=\{deleteConfirmOpen\} onClose=\{\(\)=>setDeleteConfirmOpen\(false\)\} title="Delete this\?"/);
    assert.match(body, /<Btn variant="danger" onClick=\{\(\)=>\{setDeleteConfirmOpen\(false\);onDelete\(ev\);onClose\(\);\}\}>Delete<\/Btn>/);
  });

  test("the confirm modal's cancel path (Never mind) only closes the confirm, it never calls onDelete", () => {
    const idx = SOURCE.indexOf("<Modal open={deleteConfirmOpen}");
    const body = SOURCE.slice(idx, idx + 900);
    assert.match(body, /<Btn variant="subtle" onClick=\{\(\)=>setDeleteConfirmOpen\(false\)\}>Never mind<\/Btn>/);
  });

  // 2026-09-04 bug fix: a Google Calendar recurring event (weekly office
  // hours, say) syncs in as one independent Studlin event per occurrence,
  // with no indication anywhere that it repeats, and no way to delete the
  // whole series at once -- real user report. googleRecurringId (added
  // server-side, api/_lib/google-calendar.js) is the same id Google
  // stamps on every occurrence of one recurring event.
  describe("googleRecurringId: real 'delete all occurrences' for a synced recurring event", () => {
    test("a plain (non-synced) event's delete confirm still shows just one Delete button, not the two-button choice", () => {
      const idx = SOURCE.indexOf("<Modal open={deleteConfirmOpen}");
      const body = SOURCE.slice(idx, idx + 900);
      assert.match(body, /footer=\{ev\.googleRecurringId\?\(<>/);
    });

    test("a recurring synced event's confirm modal offers 'Just this one' and 'All occurrences', wired to onDelete with different args", () => {
      const idx = SOURCE.indexOf("<Modal open={deleteConfirmOpen}");
      const body = SOURCE.slice(idx, idx + 900);
      assert.match(body, /<Btn variant="danger" onClick=\{\(\)=>\{setDeleteConfirmOpen\(false\);onDelete\(ev\);onClose\(\);\}\}>Just this one<\/Btn>/);
      assert.match(body, /<Btn variant="danger" onClick=\{\(\)=>\{setDeleteConfirmOpen\(false\);onDelete\(ev,\{allOccurrences:true\}\);onClose\(\);\}\}>All occurrences<\/Btn>/);
    });

    test("a real notice explains the repeat + delete-all option, only when googleRecurringId is set", () => {
      const idx = SOURCE.indexOf("<Modal open={deleteConfirmOpen}");
      const body = SOURCE.slice(idx, idx + 1400);
      assert.match(body, /\{ev\.googleRecurringId&&\(/);
      assert.match(body, /This repeats on your Google Calendar/);
    });
  });
});

describe("App(): delete-with-undo wiring for EventDetailModal (mirrors CalendarTab's proven deleteEventWithUndo pattern)", () => {
  test("deleteEventFromDetail removes the event from storage and syncs CalendarTab's own local state via calendarSetEventsRef", () => {
    assert.match(SOURCE, /const deleteEventFromDetail=\(ev,opts\)=>\{\s*const events=lsGet\("events",\[\]\);\s*const isExam=ev\.kind==="exam";[\s\S]*?const next=\(cleanup\?cleanup\.events:events\)\.filter\(e=>!idsToRemove\.has\(e\.id\)\);\s*lsSet\("events",next\);if\(calendarSetEventsRef\.current\)calendarSetEventsRef\.current\(next\);/);
  });

  // 2026-09-03 bug fix: deleting an exam used to leave every linked prep
  // session/deck/practice exam permanently dangling -- see removeEvent's
  // own identical fix in CalendarTab for the full rationale.
  // applyExamTypeSwitchCleanup already existed for exactly this cleanup,
  // previously only wired to the "switch Type away from Exam" path.
  test("an exam delete runs applyExamTypeSwitchCleanup before removing the event, and writes the resulting decks/practiceExams back to storage", () => {
    const idx = SOURCE.indexOf("const deleteEventFromDetail=");
    const body = SOURCE.slice(idx, idx + 900);
    assert.match(body, /const isExam=ev\.kind==="exam";/);
    assert.match(body, /const cleanup=isExam\?applyExamTypeSwitchCleanup\(events,ev\.id,prevDecks,prevPracticeExams\):null;/);
    assert.match(body, /if\(cleanup\)\{lsSet\("decks",cleanup\.decks\);lsSet\("practiceExams",cleanup\.practiceExams\);\}/);
  });

  test("a non-exam delete is unaffected -- isExam is false, cleanup stays null, next just filters the plain events array", () => {
    const idx = SOURCE.indexOf("const deleteEventFromDetail=");
    const body = SOURCE.slice(idx, idx + 900);
    assert.match(body, /const prevDecks=isExam\?lsGet\("decks",\[\]\):null;/);
    assert.match(body, /const prevPracticeExams=isExam\?lsGet\("practiceExams",\[\]\):null;/);
  });

  test("deleting shows an undo toast that clears itself after 5 seconds, same timing as the calendar grid's own delete-undo", () => {
    const idx = SOURCE.indexOf("const deleteEventFromDetail=");
    const body = SOURCE.slice(idx, idx + 1500);
    assert.match(body, /setEventDeleteUndoSnapshot\(\{event:ev,\.\.\.\(\(cleanup\|\|deleteAllOccurrences\)\?\{prevEvents:events,prevDecks,prevPracticeExams\}:\{\}\)\}\);/);
    assert.match(body, /setEventDeleteUndoToast\(deleteAllOccurrences\?`Deleted all \$\{idsToRemove\.size\} occurrences of "\$\{ev\.title\}"`:`Deleted "\$\{ev\.title\}"`\);/);
    assert.match(body, /setTimeout\(\(\)=>\{setEventDeleteUndoToast\(""\);setEventDeleteUndoSnapshot\(null\);\},5000\);/);
  });

  describe("googleRecurringId: 'delete all occurrences' logic", () => {
    test("deleteAllOccurrences only ever true when opts.allOccurrences AND ev.googleRecurringId are both truthy", () => {
      const idx = SOURCE.indexOf("const deleteEventFromDetail=");
      const body = SOURCE.slice(idx, idx + 300);
      assert.match(body, /const deleteAllOccurrences=!!\(opts&&opts\.allOccurrences&&ev\.googleRecurringId\);/);
    });

    test("idsToRemove is every event sharing the same googleRecurringId when deleting all, or just the one clicked id otherwise", () => {
      const idx = SOURCE.indexOf("const deleteEventFromDetail=");
      const body = SOURCE.slice(idx, idx + 400);
      assert.match(body, /const idsToRemove=deleteAllOccurrences\s*\?new Set\(events\.filter\(e=>e\.googleRecurringId===ev\.googleRecurringId\)\.map\(e=>e\.id\)\)\s*:new Set\(\[ev\.id\]\);/);
    });
  });

  test("undoEventDeleteFromDetail restores the exact deleted event back into storage when there's no exam cleanup to reverse", () => {
    const idx = SOURCE.indexOf("const undoEventDeleteFromDetail=");
    const body = SOURCE.slice(idx, idx + 700);
    assert.match(body, /const \{event,prevEvents,prevDecks,prevPracticeExams\}=eventDeleteUndoSnapshot;/);
    assert.match(body, /const next=\[\.\.\.lsGet\("events",\[\]\),event\];\s*lsSet\("events",next\);if\(calendarSetEventsRef\.current\)calendarSetEventsRef\.current\(next\);/);
  });

  test("undoEventDeleteFromDetail does a full restore (events + decks + practiceExams) when the delete cleaned up an exam's linked prep data", () => {
    const idx = SOURCE.indexOf("const undoEventDeleteFromDetail=");
    const body = SOURCE.slice(idx, idx + 700);
    assert.match(body, /if\(prevEvents\)\{\s*lsSet\("events",prevEvents\);if\(calendarSetEventsRef\.current\)calendarSetEventsRef\.current\(prevEvents\);\s*lsSet\("decks",prevDecks\);lsSet\("practiceExams",prevPracticeExams\);/);
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
