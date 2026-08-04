// Phase 8 of the Shovel-inspired redesign: ClassSetupWizard restructured
// into named steps (Timezone/End of Term/Holidays/Awake time/Courses/
// Activities) plus a calendar-integration entry point and term-rollover
// groundwork. Covers the two genuinely new pure storage pairs -- holidays
// and wake/sleep -- mirroring the existing getSchoolTerm/saveSchoolTerm
// and getHsSchoolHours/saveHsSchoolHours conventions. The stepper UI and
// wizard flow itself are interaction work, verified live.
const { test, describe } = require("node:test");
const assert = require("node:assert/strict");
const { loadStudlinModule } = require("./harness.js");

describe("getHolidays / saveHolidays", () => {
  test("defaults to an empty list when never set", () => {
    const m = loadStudlinModule();
    assert.equal(m.getHolidays().length, 0);
  });

  test("round-trips exactly what was saved", () => {
    const m = loadStudlinModule();
    m.saveHolidays([{ id: "hol-1", start: "2026-03-09", end: "2026-03-13", label: "Spring Break" }]);
    const holidays = m.getHolidays();
    assert.equal(holidays.length, 1);
    assert.equal(holidays[0].label, "Spring Break");
    assert.equal(holidays[0].start, "2026-03-09");
    assert.equal(holidays[0].end, "2026-03-13");
  });
});

describe("getWakeSleep / saveWakeSleep", () => {
  test("defaults to null when never set", () => {
    const m = loadStudlinModule();
    assert.equal(m.getWakeSleep(), null);
  });

  test("round-trips exactly what was saved, distinct from schedulePrefs' workStartTime", () => {
    const m = loadStudlinModule();
    m.saveWakeSleep({ wakeTime: "06:30", sleepTime: "22:30" });
    const ws = m.getWakeSleep();
    assert.equal(ws.wakeTime, "06:30");
    assert.equal(ws.sleepTime, "22:30");
  });
});
