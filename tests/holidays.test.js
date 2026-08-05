// Holidays used to be captured and displayed during onboarding but never
// actually consulted by the scheduling engine -- the onboarding copy
// promised "Studlin won't plan study sessions during these" while the code
// silently did nothing with them. These tests cover the fix: a holiday date
// range is now treated the same as a fully-booked day by the core
// auto-placement paths (findOpenSlotFor, findTier0Slot, dayHasRoomFor).
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

describe("isHoliday", () => {
  test("false with no holidays saved", () => {
    const m = loadStudlinModule();
    assert.equal(m.isHoliday("2026-08-10"), false);
  });

  test("true for a date inside a saved range, inclusive of both ends", () => {
    const m = loadStudlinModule();
    m.saveHolidays([{ id: "h1", start: "2026-08-10", end: "2026-08-17", label: "Spring break" }]);
    assert.equal(m.isHoliday("2026-08-09"), false);
    assert.equal(m.isHoliday("2026-08-10"), true);
    assert.equal(m.isHoliday("2026-08-13"), true);
    assert.equal(m.isHoliday("2026-08-17"), true);
    assert.equal(m.isHoliday("2026-08-18"), false);
  });

  test("true when any of several saved ranges match", () => {
    const m = loadStudlinModule();
    m.saveHolidays([
      { id: "h1", start: "2026-08-10", end: "2026-08-17", label: "Spring break" },
      { id: "h2", start: "2026-12-20", end: "2027-01-02", label: "Winter break" },
    ]);
    assert.equal(m.isHoliday("2026-12-25"), true);
    assert.equal(m.isHoliday("2026-09-01"), false);
  });

  test("ignores a malformed entry missing start/end instead of throwing", () => {
    const m = loadStudlinModule();
    m.saveHolidays([{ id: "h1", label: "no dates" }]);
    assert.equal(m.isHoliday("2026-08-10"), false);
  });
});

describe("findOpenSlotFor respects holidays", () => {
  test("skips a holiday day entirely and lands on the next open day", () => {
    const m = loadStudlinModule({ now: "2026-08-08T09:00:00" });
    m.saveHolidays([{ id: "h1", start: "2026-08-10", end: "2026-08-11", label: "Long weekend" }]);
    const slot = m.findOpenSlotFor([], [], DEFAULT_PREFS, "2026-08-10", "10:00", 30, null);
    assert.equal(slot.date, "2026-08-12");
  });

  test("with no holidays saved, behavior is unchanged -- lands on the desired day", () => {
    const m = loadStudlinModule({ now: "2026-08-08T09:00:00" });
    const slot = m.findOpenSlotFor([], [], DEFAULT_PREFS, "2026-08-10", "10:00", 30, null);
    assert.equal(slot.date, "2026-08-10");
  });

  test("a deadline that falls entirely inside a holiday range still returns something, never throws", () => {
    const m = loadStudlinModule({ now: "2026-08-08T09:00:00" });
    m.saveHolidays([{ id: "h1", start: "2026-08-09", end: "2026-08-29", label: "Long break" }]);
    assert.doesNotThrow(() => m.findOpenSlotFor([], [], DEFAULT_PREFS, "2026-08-10", "10:00", 30, "2026-08-15"));
  });
});

describe("findTier0Slot respects holidays", () => {
  test("never places a Tier 0 session on a holiday day", () => {
    const m = loadStudlinModule({ now: "2026-08-08T09:00:00" });
    m.saveHolidays([{ id: "h1", start: "2026-08-08", end: "2026-08-09", label: "Break" }]);
    const task = { id: "t1", kind: "study block", duration: 30, date: "2026-08-08", time: "10:00" };
    const result = m.findTier0Slot(task, [task], [], DEFAULT_PREFS, "2026-08-08");
    assert.ok(result && result.placement, "expected a legal placement to be found");
    assert.ok(result.placement.date > "2026-08-09", `expected a date after the holiday, got ${result.placement.date}`);
  });
});

describe("dayHasRoomFor respects holidays", () => {
  test("returns false for a holiday day even with a fully open window", () => {
    const m = loadStudlinModule();
    m.saveHolidays([{ id: "h1", start: "2026-08-10", end: "2026-08-10", label: "Day off" }]);
    assert.equal(m.dayHasRoomFor([], [], DEFAULT_PREFS, "2026-08-10", 30, "10:00"), false);
  });

  test("returns true for the same otherwise-open day once the holiday is removed", () => {
    const m = loadStudlinModule();
    assert.equal(m.dayHasRoomFor([], [], DEFAULT_PREFS, "2026-08-10", 30, "10:00"), true);
  });
});
