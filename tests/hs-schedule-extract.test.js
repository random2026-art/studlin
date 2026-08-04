// Phase 9 of the Shovel-inspired redesign: a high-schooler pastes (or
// photographs) their weekly schedule, Studlin extracts every class, and
// derives free time by subtracting the extracted classes from the
// student's declared school hours. Covers the two genuinely new pure
// pieces -- deriveFreePeriodsFromPeriods (the free-time deriver, built on
// the existing subtractIntervals gap primitive) and
// getHsSchoolHours/saveHsSchoolHours (a storage pair mirroring the
// existing getSchoolTerm/saveSchoolTerm convention). The AI-calling
// extractors themselves (extractHsScheduleFromText/Image) aren't covered
// here -- they're a real network call to /api/chat, same as every other
// AI-extraction function in this codebase, verified manually instead.
const { test, describe } = require("node:test");
const assert = require("node:assert/strict");
const { loadStudlinModule } = require("./harness.js");

function period(overrides) {
  return { subjectName: "Class", startTime: "08:00", endTime: "09:00", days: [0, 1, 2, 3, 4], ...overrides };
}

describe("deriveFreePeriodsFromPeriods", () => {
  test("three back-to-back classes leave one free gap for the rest of the school day", () => {
    const m = loadStudlinModule();
    const periods = [
      period({ startTime: "08:00", endTime: "09:00" }),
      period({ startTime: "09:00", endTime: "10:00" }),
      period({ startTime: "10:00", endTime: "11:00" }),
    ];
    const free = m.deriveFreePeriodsFromPeriods(periods, "08:00", "15:00");
    assert.equal(free.length, 1);
    assert.equal(free[0].startTime, "11:00");
    assert.equal(free[0].duration, 240); // 11:00 -> 15:00
    assert.equal(JSON.stringify(free[0].days), JSON.stringify([0, 1, 2, 3, 4]));
  });

  test("a gap under the 20-minute floor is dropped, but a larger gap on the same day survives", () => {
    const m = loadStudlinModule();
    const periods = [
      period({ startTime: "08:00", endTime: "09:00", days: [0] }),
      period({ startTime: "09:10", endTime: "10:00", days: [0] }), // 10-minute gap before this -- noise, not a real free period
    ];
    const free = m.deriveFreePeriodsFromPeriods(periods, "08:00", "16:00");
    assert.equal(free.length, 1);
    assert.equal(free[0].startTime, "10:00");
    assert.equal(free[0].duration, 360); // 10:00 -> 16:00, the real gap
  });

  test("identical gaps produced on different days collapse into one row with a combined days[]", () => {
    const m = loadStudlinModule();
    const periods = [
      period({ startTime: "08:00", endTime: "09:00", days: [0] }),
      period({ startTime: "08:00", endTime: "09:00", days: [1] }),
    ];
    const free = m.deriveFreePeriodsFromPeriods(periods, "08:00", "10:00");
    assert.equal(free.length, 1);
    assert.equal(free[0].startTime, "09:00");
    assert.equal(free[0].duration, 60);
    assert.equal(JSON.stringify(free[0].days), JSON.stringify([0, 1]));
  });

  test("a short class leaves one large gap spanning the remainder of the school day", () => {
    const m = loadStudlinModule();
    const periods = [period({ startTime: "08:00", endTime: "08:30", days: [0] })];
    const free = m.deriveFreePeriodsFromPeriods(periods, "08:00", "15:00");
    assert.equal(free.length, 1);
    assert.equal(free[0].startTime, "08:30");
    assert.equal(free[0].duration, 390);
  });

  test("classes that exactly fill the school day return zero free rows", () => {
    const m = loadStudlinModule();
    const periods = [period({ startTime: "08:00", endTime: "15:00", days: [0] })];
    const free = m.deriveFreePeriodsFromPeriods(periods, "08:00", "15:00");
    assert.equal(free.length, 0);
  });

  test("returns nothing when school hours aren't both set", () => {
    const m = loadStudlinModule();
    const periods = [period()];
    assert.equal(m.deriveFreePeriodsFromPeriods(periods, null, "15:00").length, 0);
    assert.equal(m.deriveFreePeriodsFromPeriods(periods, "08:00", null).length, 0);
    assert.equal(m.deriveFreePeriodsFromPeriods(periods, "", "").length, 0);
  });

  test("returns nothing when school hours are an invalid (end not after start) window", () => {
    const m = loadStudlinModule();
    const free = m.deriveFreePeriodsFromPeriods([period()], "15:00", "08:00");
    assert.equal(free.length, 0);
  });
});

describe("getHsSchoolHours / saveHsSchoolHours", () => {
  test("defaults to null when never set", () => {
    const m = loadStudlinModule();
    assert.equal(m.getHsSchoolHours(), null);
  });

  test("round-trips exactly what was saved", () => {
    const m = loadStudlinModule();
    m.saveHsSchoolHours({ start: "08:00", end: "15:00" });
    const hours = m.getHsSchoolHours();
    assert.equal(hours.start, "08:00");
    assert.equal(hours.end, "15:00");
  });
});
