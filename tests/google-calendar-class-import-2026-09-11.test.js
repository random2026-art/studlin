// User idea, 2026-09-11: "if a user adds their entire schedule or enters
// manually... wouldnt it be cool if you could add syllabus for each
// class"... follow-up discussion: "but does that also mean... if your
// gonna use whats on google calendar you wont be able to use the
// different perks of having class on studlin." Agreed direction (Option
// B, confirmed "yeah, that's the right call"): a ONE-TIME COPY into a
// real Studlin course, not a live link -- a live link would mean teaching
// the otherwise fully read-only Google sync system to partially not be
// read-only anymore, real complexity this app has deliberately avoided
// everywhere else Google sync touches (see EventDetailModal's own
// isGoogleSynced comment).
//
// Two real gaps this closes:
//  1. No way to turn an already-synced Google Calendar class into a real
//     Studlin course at all -- it was just a permanently read-only block
//     with no subject/courseId, so it could never get a syllabus scan,
//     assignments, or Courses/Prep tracking.
//  2. The unavoidable follow-up bug importing would otherwise create:
//     without exclusion, the SAME class would show up twice forever --
//     once as the freshly imported real course, once as the original
//     read-only Google block, which never stops syncing back in on its
//     own. applyGoogleEvents now excludes any already-imported recurring
//     series permanently (importedGoogleRecurringIds), not just at the
//     moment of import.
//
// detectGoogleClassCandidates/applyGoogleEvents are real, exported,
// side-effect-light functions -- tested with real invocations (fsdb/
// firebase are never reached by either, confirmed by these tests actually
// running clean). The wizard's own UI wiring (the "Import from Google
// Calendar" button, the picker screen, confirmGoogleImport) is component-
// closure, so those are source-level regression guards, same mixed-
// coverage convention this session has used throughout. Run with
// `npm test`.
const { test, describe } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");
const { loadStudlinModule } = require("./harness.js");

const SOURCE = fs.readFileSync(path.join(__dirname, "..", "studlin-app.jsx"), "utf8");

function gcalEv(id, date, time, title, recurId, duration) {
  return { id: "gcal-" + id, date, time, duration: duration || 50, title, googleRecurringId: recurId || null };
}

describe("detectGoogleClassCandidates: conservative, opt-in suggestions only", () => {
  test("a recurring weekly event seen 3 times becomes a candidate with the right days/time", () => {
    const { detectGoogleClassCandidates } = loadStudlinModule({ now: "2026-09-11T09:00:00" });
    const events = [
      gcalEv("1", "2026-09-08", "10:00", "Biology 101", "series-1"), // Tue
      gcalEv("2", "2026-09-10", "10:00", "Biology 101", "series-1"), // Thu
      gcalEv("3", "2026-09-15", "10:00", "Biology 101", "series-1"), // Tue
    ];
    const candidates = detectGoogleClassCandidates(events, []);
    assert.equal(candidates.length, 1);
    assert.equal(candidates[0].title, "Biology 101");
    assert.equal(candidates[0].occurrenceCount, 3);
    assert.equal(candidates[0].startTime, "10:00");
    // JSON.stringify, not assert.deepEqual -- the harness runs the module
    // in a separate vm realm with its own Array constructor, so a
    // structurally-identical array from there fails deepEqual's
    // reference-equality-flavored checks. See architecture memory: Test
    // Harness: No deepEqual.
    assert.equal(JSON.stringify(candidates[0].days), JSON.stringify([1, 3])); // Mon-first: Tue=1, Thu=3
  });

  test("a single sighting is not enough to suggest -- requires 2+ occurrences", () => {
    const { detectGoogleClassCandidates } = loadStudlinModule({ now: "2026-09-11T09:00:00" });
    const events = [gcalEv("1", "2026-09-08", "10:00", "One-off Meeting", "series-2")];
    assert.equal(detectGoogleClassCandidates(events, []).length, 0);
  });

  test("a plain one-off event with no googleRecurringId at all is never a candidate", () => {
    const { detectGoogleClassCandidates } = loadStudlinModule({ now: "2026-09-11T09:00:00" });
    const events = [gcalEv("1", "2026-09-08", "14:00", "Dentist", null)];
    assert.equal(detectGoogleClassCandidates(events, []).length, 0);
  });

  test("a class already added by any path (label match) is excluded from suggestions", () => {
    const { detectGoogleClassCandidates } = loadStudlinModule({ now: "2026-09-11T09:00:00" });
    const events = [
      gcalEv("1", "2026-09-08", "10:00", "Calc II", "series-3"),
      gcalEv("2", "2026-09-10", "10:00", "Calc II", "series-3"),
    ];
    assert.equal(detectGoogleClassCandidates(events, ["Calc II"]).length, 0);
  });

  test("two separate recurring series produce two separate candidates", () => {
    const { detectGoogleClassCandidates } = loadStudlinModule({ now: "2026-09-11T09:00:00" });
    const events = [
      gcalEv("1", "2026-09-08", "10:00", "Biology 101", "series-a"),
      gcalEv("2", "2026-09-10", "10:00", "Biology 101", "series-a"),
      gcalEv("3", "2026-09-08", "15:00", "History 201", "series-b"),
      gcalEv("4", "2026-09-10", "15:00", "History 201", "series-b"),
    ];
    const candidates = detectGoogleClassCandidates(events, []);
    assert.equal(candidates.length, 2);
  });
});

describe("applyGoogleEvents: an already-imported class never comes back as a duplicate on a later sync", () => {
  test("a fresh sync with no imports keeps all events, unaffected", () => {
    const { applyGoogleEvents, lsGet } = loadStudlinModule({ now: "2026-09-11T09:00:00" });
    applyGoogleEvents([gcalEv("1", "2026-09-15", "10:00", "Biology 101", "series-1")]);
    const events = lsGet("events", []);
    assert.equal(events.some(e => e.id === "gcal-1"), true);
  });

  test("a recurring series already recorded as imported is excluded from this and every future sync", () => {
    const { applyGoogleEvents, lsGet, lsSet } = loadStudlinModule({ now: "2026-09-11T09:00:00" });
    lsSet("importedGoogleRecurringIds", ["series-1"]);
    applyGoogleEvents([
      gcalEv("1", "2026-09-15", "10:00", "Biology 101", "series-1"),
      gcalEv("2", "2026-09-15", "14:00", "History 201", "series-2"),
    ]);
    const events = lsGet("events", []);
    assert.equal(events.some(e => e.id === "gcal-1"), false, "the imported series must be excluded");
    assert.equal(events.some(e => e.id === "gcal-2"), true, "an unrelated, never-imported series must still sync normally");
  });
});

describe("Source-level regression guards: the wizard's Import from Google Calendar flow", () => {
  test("the classes chooser offers Import from Google Calendar, wired to openGoogleImport", () => {
    const idx = SOURCE.indexOf('{step==="classes"&&addMode==="choose"&&(<>');
    assert.ok(idx > -1);
    const body = SOURCE.slice(idx, idx + 5000);
    assert.ok(body.includes("Import from Google Calendar"));
    assert.ok(body.includes("onClick={openGoogleImport}"));
  });

  test("openGoogleImport connects first if not already linked, then runs detection against existing labels", () => {
    const idx = SOURCE.indexOf("const openGoogleImport=async()=>{");
    assert.ok(idx > -1);
    const body = SOURCE.slice(idx, idx + 900);
    assert.ok(body.includes("if(!wizGoogleLinked){"));
    assert.ok(body.includes("await connectGoogleCalendar()"));
    assert.ok(body.includes("detectGoogleClassCandidates(lsGet(\"events\",[]),existingLabels)"));
  });

  test("confirmGoogleImport records imported recurring ids, purges this session's own duplicates immediately, and queues the picks through the normal review flow", () => {
    const idx = SOURCE.indexOf("const confirmGoogleImport=()=>{");
    assert.ok(idx > -1);
    const body = SOURCE.slice(idx, idx + 2000);
    assert.ok(body.includes('lsSet("importedGoogleRecurringIds"'), "must persist so applyGoogleEvents excludes these series on future syncs too");
    assert.ok(body.includes('e.id.startsWith("gcal-")&&e.googleRecurringId&&recurIds.has(e.googleRecurringId)'), "must purge THIS session's already-synced duplicates immediately, not just block future ones");
    assert.ok(body.includes("startClassQueue("), "must reuse the same one-at-a-time review queue a whole-schedule scan feeds, not a separate commit path");
  });

  test("applyGoogleEvents filters out already-imported recurring series before ever reaching reconcileFixedEventConflicts", () => {
    const idx = SOURCE.indexOf("function applyGoogleEvents(gcalEvents){");
    assert.ok(idx > -1);
    const body = SOURCE.slice(idx, idx + 1500);
    assert.ok(body.includes('lsGet("importedGoogleRecurringIds",[])'));
    assert.ok(body.includes("reconcileFixedEventConflicts(filtered)"), "must reconcile the FILTERED batch, not the raw one");
  });
});
