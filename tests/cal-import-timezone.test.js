// Regression tests for the 2026-09-07 UTC-timestamp import bug (user
// report with screenshot: Course Site/Moodle items landing at the wrong
// clock time, e.g. everything defaulting near 3am).
//
// Root cause: parseDt (api/cal-proxy.js) reads the hour/minute straight
// out of the raw ICS digits with zero regard for whether the timestamp is
// a real UTC instant (RFC 5545's trailing "Z") or already local/floating
// time. A feed that exports real times in UTC had every one silently
// misread as if it were already the viewer's own local time, off by
// whatever the UTC offset happens to be.
//
// Fix: parseICS now accepts an optional targetTz; any DTSTART/DTEND this
// parser actually saw end in "Z" gets converted from that real UTC
// instant to targetTz's wall-clock time via native Intl.DateTimeFormat
// (no timezone library, handles DST automatically). A value with no
// trailing Z (floating/local, or TZID-qualified -- TZID conversion is a
// deliberately out-of-scope follow-up, see convertUtcToLocal's own
// comment) passes through completely unchanged, exactly like before this
// fix, so every existing caller that never passes a timezone (the cron
// resync in api/me.js) keeps its exact current behavior. Run with
// `npm test`.
const { test, describe } = require("node:test");
const assert = require("node:assert/strict");
const { parseICS } = require("../api/cal-proxy.js");

function icsWith(dtstart, dtend) {
  return [
    "BEGIN:VCALENDAR",
    "BEGIN:VEVENT",
    "UID:tz-test-1@example.com",
    "SUMMARY:Test event",
    `DTSTART:${dtstart}`,
    ...(dtend ? [`DTEND:${dtend}`] : []),
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
}

describe("parseICS: UTC ('Z'-suffixed) timestamps convert to the student's real local time when a targetTz is given", () => {
  test("the exact reported shape: 8am UTC in winter (EST, UTC-5) lands at 3am local, not 8am", () => {
    // 2030-01-15 is deliberately a plain winter date -- no DST ambiguity,
    // so the -5h offset is exact and unambiguous.
    const ics = icsWith("20300115T080000Z");
    const { events } = parseICS(ics, { targetTz: "America/New_York" });
    assert.equal(events.length, 1);
    assert.equal(events[0].date, "2030-01-15");
    assert.equal(events[0].time, "03:00", "8am UTC minus the 5-hour EST offset is 3am local -- this is the literal bug reproduced and fixed");
  });

  test("without a targetTz, a UTC value is left exactly as parsed -- unconverted, same as before this fix (the cron resync path)", () => {
    const ics = icsWith("20300115T080000Z");
    const { events } = parseICS(ics); // no opts at all, matching api/me.js's cron call
    assert.equal(events[0].date, "2030-01-15");
    assert.equal(events[0].time, "08:00", "no timezone info available -- must NOT guess one, exactly today's existing behavior");
  });

  test("a value with no trailing Z (floating/local time) is never converted, even when a targetTz is given", () => {
    const ics = icsWith("20300115T080000"); // no Z
    const { events } = parseICS(ics, { targetTz: "America/New_York" });
    assert.equal(events[0].time, "08:00", "floating time is assumed already-local -- converting it would introduce a NEW wrong time, not fix one");
  });

  test("a bogus/unrecognized targetTz never crashes -- falls back to the unconverted value", () => {
    const ics = icsWith("20300115T080000Z");
    const { events } = parseICS(ics, { targetTz: "Not/A/Real/Zone" });
    assert.equal(events[0].time, "08:00");
  });

  test("DTEND is converted the same way as DTSTART when both are UTC-flagged", () => {
    const ics = icsWith("20300115T080000Z", "20300115T093000Z");
    const { events } = parseICS(ics, { targetTz: "America/New_York" });
    assert.equal(events[0].time, "03:00");
    // Duration must still be exactly 90 minutes -- shifting both endpoints
    // by the identical real-world offset never changes their difference.
    assert.equal(events[0].duration, 90);
  });

  test("a summer date correctly uses the DST offset (EDT, UTC-4), not a hardcoded -5", () => {
    // 2030-07-15 -- clearly within US DST.
    const ics = icsWith("20300715T080000Z");
    const { events } = parseICS(ics, { targetTz: "America/New_York" });
    assert.equal(events[0].time, "04:00", "8am UTC minus the 4-hour EDT offset is 4am local -- confirms real DST-aware conversion, not a fixed offset");
  });

  test("works for a non-US timezone too -- this isn't hardcoded to America/New_York", () => {
    const ics = icsWith("20300115T080000Z");
    const { events } = parseICS(ics, { targetTz: "Asia/Tokyo" }); // UTC+9, no DST
    assert.equal(events[0].date, "2030-01-15");
    assert.equal(events[0].time, "17:00");
  });

  test("date-only (all-day) entries are never touched by the conversion -- RFC 5545 date-only values never carry a Z anyway", () => {
    const ics = [
      "BEGIN:VCALENDAR",
      "BEGIN:VEVENT",
      "UID:allday-1@example.com",
      "SUMMARY:All-day marker",
      "DTSTART;VALUE=DATE:20300115",
      "END:VEVENT",
      "END:VCALENDAR",
    ].join("\r\n");
    const { events } = parseICS(ics, { includeAllDay: true, targetTz: "America/New_York" });
    assert.equal(events.length, 1);
    assert.equal(events[0].date, "2030-01-15");
    assert.equal(events[0].time, null);
  });
});
