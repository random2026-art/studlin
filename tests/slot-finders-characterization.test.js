// Characterization tests for the four slot-finder functions
// (findFixedEventSlot, findOpenSlotFor, findTier0Slot, findReliableSlotFor)
// -- written during Catch Me Up (Part 1.3) specifically so a future merge
// of these four is safe to attempt, not because they're being merged now.
// These pin CURRENT behavior on shared scenarios (conflicts, full days,
// pinned items) rather than asserting what "should" happen -- if a future
// refactor changes one of these values, that's a signal to look, not
// necessarily a bug.
//
// Compares returned {date,time} objects field-by-field rather than via
// assert.deepEqual -- objects built inside the sandboxed vm context aren't
// deepEqual-identical to native-realm objects even with matching contents
// (same gotcha noted in scheduling.test.js's own sort-order test).
const { test, describe } = require("node:test");
const assert = require("node:assert/strict");
const { loadStudlinModule } = require("./harness.js");

const DEFAULT_PREFS = {
  workStartTime: "09:00",
  workEndTime: "18:00",
  bedtime: "23:00",
  taskDifficultyPreference: "NONE",
  bufferMarginStrategy: "15_MIN",
  weekendEnabled: false,
  weekendStartTime: "09:00",
  weekendEndTime: "18:00",
  peakHourBuckets: [],
};

function classEvent(overrides) {
  return {
    id: "class-1", title: "Bio lecture", date: "2026-07-20", time: "10:00",
    subject: "Biology", kind: "class", notes: "", priority: null, difficulty: null,
    deadline: null, duration: 60, status: "pending", timeSpent: 0,
    completedAt: null, ...overrides,
  };
}

function studyBlock(overrides) {
  return {
    id: "study-1", title: "Study chem", date: "2026-07-20", time: "10:00",
    subject: "Chemistry", kind: "study block", notes: "", priority: 5, difficulty: 5,
    deadline: null, duration: 30, status: "pending", timeSpent: 0,
    completedAt: null, ...overrides,
  };
}

describe("findFixedEventSlot", () => {
  test("desired time is open -- returns it verbatim", () => {
    const { findFixedEventSlot } = loadStudlinModule({ now: "2026-07-20T08:00:00" });
    const slot = findFixedEventSlot([], [], DEFAULT_PREFS, "2026-07-20", "10:00", 60);
    assert.equal(slot.date, "2026-07-20");
    assert.equal(slot.time, "10:00");
  });

  // Distinctive, easy-to-miss behavior: unlike findOpenSlotFor (which scans
  // forward from the desired time, bounded to work hours), findFixedEventSlot's
  // fallback scans the WHOLE day from midnight and returns the first open
  // 15-min slot anywhere in it -- not the first one at or after desiredTime,
  // and not bounded to work hours. A merge that assumed these two search the
  // same way would silently start placing fixed events overnight.
  test("conflict at desired time -- fallback scans from midnight, not forward from desired time", () => {
    const { findFixedEventSlot } = loadStudlinModule({ now: "2026-07-20T08:00:00" });
    const existing = classEvent({ id: "existing", time: "10:00", duration: 60 });
    const slot = findFixedEventSlot([existing], [], DEFAULT_PREFS, "2026-07-20", "10:00", 30);
    assert.equal(slot.date, "2026-07-20");
    assert.equal(slot.time, "00:00", "midnight is open, and the scan starts at 0 -- verified, not assumed");
  });

  test("whole day fully booked (24h) -- desired time on the NEXT day is checked first and succeeds", () => {
    const { findFixedEventSlot } = loadStudlinModule({ now: "2026-07-20T08:00:00" });
    const fullDay = [classEvent({ id: "allday", time: "00:00", duration: 1440 })];
    const slot = findFixedEventSlot(fullDay, [], DEFAULT_PREFS, "2026-07-20", "10:00", 30);
    // Each day iteration re-checks the exact desired time first before ever
    // falling to the midnight scan -- day 2 is wide open, so it lands right
    // back at 10:00 rather than at day-2 midnight.
    assert.equal(slot.date, "2026-07-21");
    assert.equal(slot.time, "10:00");
  });
});

describe("findOpenSlotFor", () => {
  test("desired time is open -- returns it verbatim", () => {
    const { findOpenSlotFor } = loadStudlinModule({ now: "2026-07-20T08:00:00" });
    const slot = findOpenSlotFor([], [], DEFAULT_PREFS, "2026-07-20", "10:00", 30);
    assert.equal(slot.date, "2026-07-20");
    assert.equal(slot.time, "10:00");
  });

  test("conflict at desired time -- scans forward within work hours", () => {
    const { findOpenSlotFor } = loadStudlinModule({ now: "2026-07-20T08:00:00" });
    const existing = studyBlock({ id: "existing", time: "10:00", duration: 30 });
    const slot = findOpenSlotFor([existing], [], DEFAULT_PREFS, "2026-07-20", "10:00", 30);
    assert.equal(slot.date, "2026-07-20");
    // A flexible (non-fixed) block gets no lead-in buffer, only its own
    // proportional trailing breathing room.
    assert.notEqual(slot.time, "10:00");
  });

  test("work hours fully booked -- rolls to the next day's work window", () => {
    const { findOpenSlotFor } = loadStudlinModule({ now: "2026-07-19T08:00:00" });
    const fullDay = studyBlock({ id: "allday", date: "2026-07-20", time: "09:00", duration: 540 }); // 9am-6pm
    const slot = findOpenSlotFor([fullDay], [], DEFAULT_PREFS, "2026-07-20", "09:00", 30);
    assert.equal(slot.date, "2026-07-21");
    assert.equal(slot.time, "09:00");
  });

  test("deadline caps the scan -- same-day-full-with-deadline-today falls back to the raw desired slot, never null", () => {
    const { findOpenSlotFor } = loadStudlinModule({ now: "2026-07-19T08:00:00" });
    const fullDay = studyBlock({ id: "allday", date: "2026-07-20", time: "09:00", duration: 540 });
    const slot = findOpenSlotFor([fullDay], [], DEFAULT_PREFS, "2026-07-20", "09:00", 30, "2026-07-20");
    assert.equal(slot.date, "2026-07-20");
    assert.equal(slot.time, "09:00");
  });
});

describe("findReliableSlotFor", () => {
  test("desired time is open -- returns it verbatim with a null reason (no reliability data yet)", () => {
    const { findReliableSlotFor } = loadStudlinModule({ now: "2026-07-20T08:00:00" });
    const slot = findReliableSlotFor([], [], DEFAULT_PREFS, "2026-07-20", "10:00", 30, null, 500);
    assert.equal(slot.date, "2026-07-20");
    assert.equal(slot.time, "10:00");
  });

  test("never changes the DAY findOpenSlotFor already picked -- only refines time-of-day", () => {
    const { findReliableSlotFor, findOpenSlotFor } = loadStudlinModule({ now: "2026-07-19T08:00:00" });
    const fullDay = studyBlock({ id: "allday", date: "2026-07-20", time: "09:00", duration: 540 });
    const openSlot = findOpenSlotFor([fullDay], [], DEFAULT_PREFS, "2026-07-20", "09:00", 30);
    const reliableSlot = findReliableSlotFor([fullDay], [], DEFAULT_PREFS, "2026-07-20", "09:00", 30, null, 500);
    assert.equal(reliableSlot.date, openSlot.date);
  });

  test("conflict at desired time -- still lands within work hours same day", () => {
    const { findReliableSlotFor } = loadStudlinModule({ now: "2026-07-20T08:00:00" });
    const existing = studyBlock({ id: "existing", time: "10:00", duration: 30 });
    const slot = findReliableSlotFor([existing], [], DEFAULT_PREFS, "2026-07-20", "10:00", 30, null, 500);
    assert.equal(slot.date, "2026-07-20");
    assert.notEqual(slot.time, "10:00");
  });

  // Unlike findOpenSlotFor (which always hands back *something*, even a
  // stale/illegal fallback), findReliableSlotFor can genuinely return null:
  // when its own reliability-anchor scan finds zero legal candidates (the
  // target day is fully booked), it re-validates through
  // findLegalSlotOrNull, which returns null once the only thing left to
  // offer sits past the deadline. This is exactly the path
  // CalendarTab's addManualPlacementSession ("+ Add a session" in the
  // manual-placement flow, studlin-app.jsx) now has to handle since it
  // switched from findOpenSlotFor to findReliableSlotFor -- a caller that
  // assumed a slot object back unconditionally would build a task at an
  // undefined date/time here instead.
  test("day fully booked AND already past its deadline -- returns null, not a stale fallback slot", () => {
    const { findReliableSlotFor } = loadStudlinModule({ now: "2026-07-10T08:00:00" });
    const fullDay = studyBlock({ id: "allday", date: "2026-07-20", time: "09:00", duration: 540 }); // 9am-6pm, the whole work window
    const slot = findReliableSlotFor([fullDay], [], DEFAULT_PREFS, "2026-07-20", "09:00", 30, "2026-07-15", 500);
    assert.equal(slot, null);
  });
});

describe("findTier0Slot", () => {
  test("open slot, no reliability history -- places at the task's own desired time today", () => {
    const { findTier0Slot } = loadStudlinModule({ now: "2026-07-20T08:00:00" });
    const task = studyBlock({ id: "missed-1", date: "2026-07-19", time: "10:00", duration: 30 });
    const result = findTier0Slot(task, [], [], DEFAULT_PREFS, "2026-07-20");
    assert.ok(result, "expected a legal placement");
    assert.equal(result.placement.date, "2026-07-20");
    assert.equal(result.reason, null, "no declared peak / no completion history yet -- no reason claimed");
  });

  test("deadline before today -- no legal candidate, returns null", () => {
    const { findTier0Slot } = loadStudlinModule({ now: "2026-07-20T08:00:00" });
    const task = studyBlock({ id: "missed-2", date: "2026-07-15", time: "10:00", duration: 30, deadline: "2026-07-18" });
    const result = findTier0Slot(task, [], [], DEFAULT_PREFS, "2026-07-20");
    assert.equal(result, null);
  });

  test("declared peak hour bucket -- claims a peak-type reason", () => {
    const { findTier0Slot } = loadStudlinModule({ now: "2026-07-20T08:00:00" });
    const prefsWithPeak = { ...DEFAULT_PREFS, peakHourBuckets: ["morning"] };
    const task = studyBlock({ id: "missed-3", date: "2026-07-19", time: "07:00", duration: 30 });
    const result = findTier0Slot(task, [], [], prefsWithPeak, "2026-07-20");
    assert.ok(result, "expected a legal placement");
    assert.ok(result.reason && result.reason.type === "peak", "expected a declared-peak reason");
  });

  test("userPinned item nearby is still treated as occupied (isFixedItem doesn't affect occupied-interval computation, only missed-detection)", () => {
    const { findTier0Slot } = loadStudlinModule({ now: "2026-07-20T08:00:00" });
    // A pinned block from 09:00-09:30 today -- pinned only means "isTier0Missed
    // skips it as a MOVE candidate," it doesn't stop occupying the calendar.
    const pinned = studyBlock({ id: "pinned-1", date: "2026-07-20", time: "09:00", duration: 30, userPinned: true });
    const task = studyBlock({ id: "missed-4", date: "2026-07-19", time: "09:00", duration: 30 });
    const result = findTier0Slot(task, [pinned], [], DEFAULT_PREFS, "2026-07-20");
    assert.ok(result, "expected a legal placement");
    assert.notEqual(result.placement.time, "09:00", "the pinned block's own slot must still be respected as occupied");
  });
});
