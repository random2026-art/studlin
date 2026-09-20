// Gap-audit fix (2026-09-18): completionLog (peak-hour learning) was
// local-only -- it never left the device, unlike duration learning
// (suggestDurationFor, derived from the already-synced `events` array).
// Same "gets smarter the more you use it" pitch, two different real
// guarantees. Fixed by mirroring aiMemory's own single-owner-doc sync
// pattern for completionLog, schedulePrefs, and the onboarding
// "configured" flags, plus reusing the existing 5-collection
// createCollectionSync factory as-is for weeklyRoutine/user-subjects (both
// already id-array shaped, exactly the shape that factory expects).
//
// None of this exercises real Firestore (this repo has no fetch/Firestore
// mocking pattern -- same reasoning studlin-ai-actions.test.js gives for
// not exercising classifyStudlinAiMessage's real API call). What's covered
// here is the pure, synchronous, testable half: the trim function
// (completionLog's own new unbounded-growth fix) and a structural smoke
// test confirming the two new DataStore collections are wired the same
// way the existing five already are.
const { test, describe } = require("node:test");
const assert = require("node:assert/strict");
const { loadStudlinModule } = require("./harness.js");

describe("trimCompletionLog", () => {
  test("an array under the cap is returned unchanged", () => {
    const m = loadStudlinModule();
    const log = Array.from({ length: 10 }, (_, i) => ({ bucket: "morning", outcome: "done", t: i }));
    const trimmed = m.trimCompletionLog(log);
    assert.equal(trimmed.length, 10);
    assert.equal(trimmed[0].t, 0);
  });

  test("an array over the cap keeps only the most recent COMPLETION_LOG_CAP entries", () => {
    const m = loadStudlinModule();
    const log = Array.from({ length: m.COMPLETION_LOG_CAP + 50 }, (_, i) => ({ bucket: "morning", outcome: "done", t: i }));
    const trimmed = m.trimCompletionLog(log);
    assert.equal(trimmed.length, m.COMPLETION_LOG_CAP);
    // oldest entries (t: 0..49) are the ones evicted -- the first surviving
    // entry is exactly the 50th one written, not an arbitrary cut point.
    assert.equal(trimmed[0].t, 50);
    assert.equal(trimmed[trimmed.length - 1].t, m.COMPLETION_LOG_CAP + 49);
  });

  test("COMPLETION_LOG_CAP is comfortably above the real consumers' own sample-size gate (8), not an arbitrary small number that would starve them", () => {
    const m = loadStudlinModule();
    assert.ok(m.COMPLETION_LOG_CAP >= 100);
  });
});

describe("DataStore: weeklyRoutine/user-subjects sync (gap-audit fix)", () => {
  // Structural smoke test only -- confirms the two new collections are
  // wired through the exact same createCollectionSync factory the existing
  // five (events/decks/notes/practiceExams/timerLogs) already use, and
  // expose the same {onLocalWrite, hydrateOnAuth} shape every call site
  // (the sign-in sequence, syncWriteHooks) depends on. Doesn't exercise a
  // real Firestore round-trip -- see this file's own top comment.
  test("DataStore.routines and DataStore.subjects exist with the same shape as the existing synced collections", () => {
    const m = loadStudlinModule();
    for (const key of ["events", "decks", "notes", "practiceExams", "timerLogs", "routines", "subjects"]) {
      assert.ok(m.DataStore[key], "DataStore." + key + " should exist");
      assert.equal(typeof m.DataStore[key].onLocalWrite, "function");
      assert.equal(typeof m.DataStore[key].hydrateOnAuth, "function");
    }
  });

  test("writing weeklyRoutine/user-subjects through lsSet doesn't throw -- the syncWriteHooks wiring is reachable, not just present", () => {
    const m = loadStudlinModule();
    assert.doesNotThrow(() => m.lsSet("weeklyRoutine", [{ id: "rt-1", title: "Chem", kind: "class", days: [0], startTime: "09:00", duration: 50 }]));
    assert.doesNotThrow(() => m.lsSet("user-subjects", [{ id: "subj-1", label: "Chem", color: "#000" }]));
  });

  test("writing schedulePrefs/subjects-configured/hasConfiguredRoutine through lsSet doesn't throw -- the lighter single-doc push path is reachable too", () => {
    const m = loadStudlinModule();
    assert.doesNotThrow(() => m.lsSet("schedulePrefs", m.getSchedulePreferences()));
    assert.doesNotThrow(() => m.lsSet("subjects-configured", true));
    assert.doesNotThrow(() => m.lsSet("hasConfiguredRoutine", true));
  });
});
