// Regression tests for calendar/work-shift import: the .ics feed parser
// (api/cal-proxy.js) and the merge/dedup logic that reconciles a fresh
// fetch against what's already in the student's calendar
// (mergeImportedEvents, studlin-app.jsx). Run with `npm test`.
const { test, describe } = require("node:test");
const assert = require("node:assert/strict");
const { loadStudlinModule } = require("./harness.js");
const { parseICS, normalizeCalendarUrl } = require("../api/cal-proxy.js");

function pad(n) { return String(n).padStart(2, "0"); }
// Builds an ICS timestamp for N days from now at a fixed hour, so fixtures
// stay "upcoming" no matter when the test suite actually runs.
function icsTimestamp(daysFromNow, hour, minute) {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${pad(hour)}${pad(minute)}00`;
}
function icsDateOnly(daysFromNow) {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}`;
}

describe("parseICS (api/cal-proxy.js)", () => {
  test("parses UID and computes duration from DTSTART/DTEND", () => {
    const ics = [
      "BEGIN:VCALENDAR",
      "BEGIN:VEVENT",
      "UID:shift-123@whenIwork.com",
      "SUMMARY:Closing shift",
      `DTSTART:${icsTimestamp(2, 17, 0)}`,
      `DTEND:${icsTimestamp(2, 21, 30)}`,
      "END:VEVENT",
      "END:VCALENDAR",
    ].join("\r\n");
    const { events, skippedAllDay } = parseICS(ics);
    assert.equal(events.length, 1);
    assert.equal(skippedAllDay, 0);
    assert.equal(events[0].uid, "shift-123@whenIwork.com");
    assert.equal(events[0].duration, 270);
    assert.equal(events[0].kind, "busy block");
  });

  test("defaults duration to 60 when DTEND is missing", () => {
    const ics = [
      "BEGIN:VCALENDAR",
      "BEGIN:VEVENT",
      "UID:no-end@example.com",
      "SUMMARY:Untimed meeting",
      `DTSTART:${icsTimestamp(3, 9, 0)}`,
      "END:VEVENT",
      "END:VCALENDAR",
    ].join("\r\n");
    const { events } = parseICS(ics);
    assert.equal(events.length, 1);
    assert.equal(events[0].duration, 60);
  });

  test("skips all-day (date-only) entries instead of treating them as a full-day blocker, and reports the count", () => {
    const ics = [
      "BEGIN:VCALENDAR",
      "BEGIN:VEVENT",
      "UID:spring-break@example.com",
      "SUMMARY:Spring Break",
      `DTSTART;VALUE=DATE:${icsDateOnly(5)}`,
      "END:VEVENT",
      "BEGIN:VEVENT",
      "UID:real-shift@example.com",
      "SUMMARY:Morning shift",
      `DTSTART:${icsTimestamp(5, 8, 0)}`,
      `DTEND:${icsTimestamp(5, 12, 0)}`,
      "END:VEVENT",
      "END:VCALENDAR",
    ].join("\r\n");
    const { events, skippedAllDay } = parseICS(ics);
    assert.equal(events.length, 1);
    assert.equal(events[0].uid, "real-shift@example.com");
    assert.equal(skippedAllDay, 1);
  });

  test("filters out events already in the past", () => {
    const ics = [
      "BEGIN:VCALENDAR",
      "BEGIN:VEVENT",
      "UID:old@example.com",
      "SUMMARY:Last week's shift",
      `DTSTART:${icsTimestamp(-7, 9, 0)}`,
      `DTEND:${icsTimestamp(-7, 12, 0)}`,
      "END:VEVENT",
      "END:VCALENDAR",
    ].join("\r\n");
    const { events } = parseICS(ics);
    assert.equal(events.length, 0);
  });
});

describe("normalizeCalendarUrl (regression: iCloud's own Public Calendar link defaults to webcal://, which the HTTP client can't fetch as-is)", () => {
  test("rewrites a webcal:// iCloud link to https://", () => {
    assert.equal(
      normalizeCalendarUrl("webcal://p01-calendars.icloud.com/published/2/abc123"),
      "https://p01-calendars.icloud.com/published/2/abc123"
    );
  });

  test("leaves an already-https:// link untouched", () => {
    assert.equal(
      normalizeCalendarUrl("https://calendar.google.com/calendar/ical/foo/basic.ics"),
      "https://calendar.google.com/calendar/ical/foo/basic.ics"
    );
  });

  test("is case-insensitive on the scheme", () => {
    assert.equal(
      normalizeCalendarUrl("WEBCAL://p01-calendars.icloud.com/published/2/abc123"),
      "https://p01-calendars.icloud.com/published/2/abc123"
    );
  });
});

describe("mergeImportedEvents (regression: reconciling an imported calendar must never duplicate, and must never touch other data)", () => {
  const fetched = [
    { uid: "u1", title: "Closing shift", date: "2026-08-01", time: "17:00", duration: 240 },
    { uid: "u2", title: "Opening shift", date: "2026-08-02", time: "08:00", duration: 180 },
  ];

  test("first import creates real, occupied 'busy block' events tagged with the subscription", () => {
    const { mergeImportedEvents } = loadStudlinModule();
    const result = mergeImportedEvents([], "sub-1", fetched);
    assert.equal(result.length, 2);
    for (const ev of result) {
      assert.equal(ev.kind, "busy block");
      assert.equal(ev.importSubId, "sub-1");
      assert.equal(ev.status, "pending");
    }
    assert.ok(result.some((e) => e.externalUid === "u1" && e.title === "Closing shift"));
  });

  test("re-syncing an unchanged feed creates no duplicates", () => {
    const { mergeImportedEvents } = loadStudlinModule();
    const first = mergeImportedEvents([], "sub-1", fetched);
    const second = mergeImportedEvents(first, "sub-1", fetched);
    assert.equal(second.length, 2);
  });

  test("a shift removed from the feed disappears from Studlin on resync", () => {
    const { mergeImportedEvents } = loadStudlinModule();
    const first = mergeImportedEvents([], "sub-1", fetched);
    const onlyOneLeft = [fetched[0]]; // u2's shift got cancelled upstream
    const second = mergeImportedEvents(first, "sub-1", onlyOneLeft);
    assert.equal(second.length, 1);
    assert.equal(second[0].externalUid, "u1");
  });

  test("a shift's time changing in the feed updates the existing event instead of duplicating it", () => {
    const { mergeImportedEvents } = loadStudlinModule();
    const first = mergeImportedEvents([], "sub-1", fetched);
    const moved = [{ ...fetched[0], time: "19:00" }, fetched[1]];
    const second = mergeImportedEvents(first, "sub-1", moved);
    assert.equal(second.length, 2);
    const u1 = second.find((e) => e.externalUid === "u1");
    assert.equal(u1.time, "19:00");
    // Same event identity preserved across the update, not a fresh row.
    assert.equal(u1.id, first.find((e) => e.externalUid === "u1").id);
  });

  test("never touches events from another subscription or a manually-created event", () => {
    const { mergeImportedEvents } = loadStudlinModule();
    const other = { id: "other-sub-event", title: "Other job", date: "2026-08-01", time: "10:00", duration: 60, kind: "busy block", status: "pending", importSubId: "sub-2", externalUid: "z1" };
    const manual = { id: "manual-1", title: "Dentist", date: "2026-08-01", time: "14:00", duration: 30, kind: "busy block", status: "pending" };
    const result = mergeImportedEvents([other, manual], "sub-1", fetched);
    assert.equal(result.length, 4);
    assert.ok(result.some((e) => e.id === "other-sub-event"));
    assert.ok(result.some((e) => e.id === "manual-1"));
  });
});
