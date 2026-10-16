// 2026-10-16: an all-day Google event ("Liz visiting") must not become an
// assignment (kind "deadline"); timed events stay plain busy blocks.
const { test, describe } = require("node:test");
const assert = require("node:assert/strict");
const { googleItemToEvent } = require("../api/_lib/google-calendar.js");
const { loadStudlinModule } = require("./harness.js");

describe("googleItemToEvent kinds", () => {
  test("all-day event is a reminder marker, never a deadline", () => {
    const e = googleItemToEvent({ id: "a1", summary: "Meet up with Liz", start: { date: "2026-10-20" }, end: { date: "2026-10-21" } });
    assert.equal(e.kind, "reminder");
    assert.notEqual(e.kind, "deadline");
    assert.equal(e.timeUnconfirmed, true);
    assert.equal(e.duration, null);
    assert.equal(e.date, "2026-10-20");
  });
  test("timed event stays a busy block with its real time and duration", () => {
    const e = googleItemToEvent({ id: "t1", summary: "Coffee with Liz", start: { dateTime: "2026-10-20T15:00:00-04:00" }, end: { dateTime: "2026-10-20T16:30:00-04:00" } });
    assert.equal(e.kind, "busy block");
    assert.equal(e.time, "15:00");
    assert.equal(e.duration, 90);
    assert.equal(e.timeUnconfirmed, undefined);
  });
});

describe("all-day markers do not trigger conflicts", () => {
  test("reconcileFixedEventConflicts ignores an unconfirmed reminder", () => {
    const m = loadStudlinModule({ now: "2026-10-16T09:00:00" });
    m.lsSet("events", [{ id: "s1", title: "Study", date: "2026-10-20", time: "23:30", duration: 60, kind: "study block", status: "pending" }]);
    const r = m.reconcileFixedEventConflicts([{ id: "gcal-x", title: "Liz visiting", date: "2026-10-20", time: "23:59", duration: null, kind: "reminder", timeUnconfirmed: true }]);
    assert.equal(r.moved.length, 0);
    assert.equal(r.needsAttention.length, 0);
  });
});
