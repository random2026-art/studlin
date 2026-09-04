// fmtTimeRange was CalendarTab-local (part of the Google Calendar-inspired
// polish pass) -- promoted to module scope 2026-09-04 so Dashboard's
// Today's Plan could share it (show "7:55 - 8:45AM" instead of a bare
// start time with no sense of how long a class actually runs). Untestable
// before the promotion (component-local); this is its first real coverage.
const { test, describe } = require("node:test");
const assert = require("node:assert/strict");
const { loadStudlinModule } = require("./harness.js");

describe("fmtTimeRange", () => {
  test("no start time returns the em dash placeholder", () => {
    const m = loadStudlinModule();
    assert.equal(m.fmtTimeRange(null, 60), "—");
    assert.equal(m.fmtTimeRange("", 60), "—");
  });

  test("a whole-hour range within the same AM/PM half shows the suffix only once, at the end", () => {
    const m = loadStudlinModule();
    assert.equal(m.fmtTimeRange("16:00", 60), "4 - 5 PM");
  });

  test("a range crossing from AM to PM shows both suffixes", () => {
    const m = loadStudlinModule();
    assert.equal(m.fmtTimeRange("11:30", 60), "11:30 AM - 12:30 PM");
  });

  test("non-whole-hour minutes are kept, zero-padded", () => {
    const m = loadStudlinModule();
    assert.equal(m.fmtTimeRange("07:55", 50), "7:55 - 8:45 AM");
  });

  test("a missing/undefined duration is treated as 0 -- start and end land on the same minute", () => {
    const m = loadStudlinModule();
    assert.equal(m.fmtTimeRange("17:00", undefined), "5 - 5 PM");
  });

  test("clamps the end time at 23:59 rather than rolling into the next day (both ends are PM, so the suffix shows once)", () => {
    const m = loadStudlinModule();
    assert.equal(m.fmtTimeRange("23:30", 120), "11:30 - 11:59 PM");
  });
});
