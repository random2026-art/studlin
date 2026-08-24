// Regression tests for "Schedule with Friends"-adjacent feature: after
// adding a class or confirming a calendar import, Studlin jumps to the
// Calendar tab and briefly highlights exactly what just landed. Two
// pieces of that pipeline are pure/testable in isolation without a live
// React tree:
//   1. resolveCalendarHighlightFlag -- the one-shot localStorage flag's
//      decision logic (CalendarTab reads+clears the raw flag, then hands
//      it to this function to decide whether it's still usable).
//   2. The exact "which ids are actually new" filter confirmImportCalendar/
//      resyncCalendar use on top of mergeImportedEvents's return value,
//      and commitSyllabusEvents's return value (which commitAllToCalendar
//      collects ids from directly).
// CalendarTab/SettingsTab/ClassSetupWizard themselves are stateful React
// components, not pure functions, so they aren't exercised directly here
// (see harness.js's own comment on why that's out of scope for this
// harness) -- these tests cover the actual data logic feeding them.
// Run with `npm test`.
const { test, describe } = require("node:test");
const assert = require("node:assert/strict");
const { loadStudlinModule } = require("./harness.js");

describe("resolveCalendarHighlightFlag (one-shot calendar-highlight flag)", () => {
  test("a fresh flag with real ids is used", () => {
    const { resolveCalendarHighlightFlag } = loadStudlinModule();
    const now = 1_000_000;
    const ids = resolveCalendarHighlightFlag({ ids: ["a", "b"], setAt: now - 1000 }, now);
    assert.equal(ids.length, 2);
    assert.equal(ids[0], "a");
    assert.equal(ids[1], "b");
  });

  test("no flag at all (nothing was ever set) resolves to null", () => {
    const { resolveCalendarHighlightFlag } = loadStudlinModule();
    assert.equal(resolveCalendarHighlightFlag(null, Date.now()), null);
  });

  test("a flag with an empty ids array resolves to null", () => {
    const { resolveCalendarHighlightFlag } = loadStudlinModule();
    assert.equal(resolveCalendarHighlightFlag({ ids: [], setAt: Date.now() }, Date.now()), null);
  });

  test("a malformed flag (ids not an array) resolves to null instead of throwing", () => {
    const { resolveCalendarHighlightFlag } = loadStudlinModule();
    assert.equal(resolveCalendarHighlightFlag({ ids: "not-an-array", setAt: Date.now() }, Date.now()), null);
  });

  test("a flag missing setAt entirely is treated as unusable, not as fresh", () => {
    const { resolveCalendarHighlightFlag } = loadStudlinModule();
    assert.equal(resolveCalendarHighlightFlag({ ids: ["a"] }, Date.now()), null);
  });

  test("a stale flag (tab sat open in the background past the max age) is ignored", () => {
    const { resolveCalendarHighlightFlag, CALENDAR_HIGHLIGHT_MAX_AGE_MS } = loadStudlinModule();
    const now = 10_000_000;
    const staleSetAt = now - CALENDAR_HIGHLIGHT_MAX_AGE_MS - 1;
    assert.equal(resolveCalendarHighlightFlag({ ids: ["a"], setAt: staleSetAt }, now), null);
  });

  test("a flag right at the max-age boundary is still fresh", () => {
    const { resolveCalendarHighlightFlag, CALENDAR_HIGHLIGHT_MAX_AGE_MS } = loadStudlinModule();
    const now = 10_000_000;
    const boundarySetAt = now - CALENDAR_HIGHLIGHT_MAX_AGE_MS;
    const ids = resolveCalendarHighlightFlag({ ids: ["a"], setAt: boundarySetAt }, now);
    assert.equal(ids.length, 1);
  });

  test("round-trips through the real lsGet/lsSet storage helpers, matching CalendarTab's own read-then-clear sequence", () => {
    const { lsGet, lsSet, resolveCalendarHighlightFlag } = loadStudlinModule();
    lsSet("calendarHighlightIds", { ids: ["ev-1", "ev-2"], setAt: Date.now() });
    const flag = lsGet("calendarHighlightIds", null);
    lsSet("calendarHighlightIds", null);
    const ids = resolveCalendarHighlightFlag(flag, Date.now());
    assert.equal(ids.length, 2);
    assert.equal(ids[0], "ev-1");
    assert.equal(ids[1], "ev-2");
    // Consumed -- a later read (e.g. a later Calendar visit) sees nothing,
    // exactly like CalendarTab's own effect clearing it immediately after
    // reading, so the highlight is genuinely one-shot rather than
    // repeating on every future visit.
    const secondRead = lsGet("calendarHighlightIds", null);
    assert.equal(resolveCalendarHighlightFlag(secondRead, Date.now()), null);
  });
});

describe("commitSyllabusEvents ids match what actually gets persisted (commitAllToCalendar collects highlight ids straight from this return value)", () => {
  test("every id in the return value is present in storage after the commit", () => {
    const { commitSyllabusEvents, lsGet } = loadStudlinModule();
    const items = [
      { kind: "deadline", title: "Problem set 1", date: "2026-09-01" },
      { kind: "deadline", title: "Problem set 2", date: "2026-09-08" },
      { kind: "exam", title: "Midterm", date: "2026-09-10" },
    ];
    const committed = commitSyllabusEvents("wiz-course-1", "Biology", items, "", "course-1");
    assert.equal(committed.length, 3, "one marker event per item, none of these opt into an Attack Block chain or spaced exam sessions");
    const stored = lsGet("events", []);
    assert.equal(stored.length, 3);
    for (const ev of committed) {
      assert.ok(stored.some((e) => e.id === ev.id), `committed id ${ev.id} should be findable in real storage`);
    }
  });
});

describe("\"which ids are actually new\" filter (same pattern confirmImportCalendar/resyncCalendar use on top of mergeImportedEvents)", () => {
  test("a brand-new subscription (no prior externalUids) treats every fetched item as new", () => {
    const { mergeImportedEvents } = loadStudlinModule();
    const fetched = [
      { uid: "u1", title: "HW1", date: "2026-09-01", time: "23:59", duration: 30 },
      { uid: "u2", title: "HW2", date: "2026-09-05", time: "23:59", duration: 30 },
    ];
    const existingUidsForSub = new Set(); // fresh subId, nothing existed before
    const merged = mergeImportedEvents([], "cal-new", fetched, undefined);
    const newIds = merged.filter((e) => e.importSubId === "cal-new" && !existingUidsForSub.has(e.externalUid)).map((e) => e.id);
    assert.equal(newIds.length, 2);
  });

  test("a reconnect-in-place (fixed subId, e.g. Canvas token) only flags the genuinely new item, not the one already on the calendar", () => {
    const { mergeImportedEvents } = loadStudlinModule();
    const existingEvents = [
      { id: "import-canvas-token-u1-abc", importSubId: "canvas-token", externalUid: "u1", title: "HW1", date: "2026-09-01", time: "23:59", duration: null, kind: "deadline", status: "pending" },
    ];
    const fetched = [
      { uid: "u1", title: "HW1", date: "2026-09-01", time: "23:59", duration: 30 }, // already on the calendar
      { uid: "u2", title: "HW2 (new)", date: "2026-09-06", time: "23:59", duration: 30 }, // genuinely new
    ];
    const existingUidsForSub = new Set(existingEvents.filter((e) => e.importSubId === "canvas-token").map((e) => e.externalUid));
    assert.equal(existingUidsForSub.size, 1, "sanity check on the fixture itself");
    const merged = mergeImportedEvents(existingEvents, "canvas-token", fetched, undefined);
    const newIds = merged.filter((e) => e.importSubId === "canvas-token" && !existingUidsForSub.has(e.externalUid)).map((e) => e.id);
    assert.equal(newIds.length, 1);
    const newEvent = merged.find((e) => e.id === newIds[0]);
    assert.equal(newEvent.externalUid, "u2");
  });
});
