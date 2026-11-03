// Server-side closed-app reminders (api/_lib/reminders-core.js). Pure logic,
// no Firebase. 2026-10-31 is a Saturday (routine dow 5, Monday-first).
const { test, describe } = require("node:test");
const assert = require("node:assert/strict");
const C = require("../api/_lib/reminders-core");

const NY = "America/New_York";
const at = (date, time, tz) => C.wallClockToMs(date, time, tz);
const base = { tz: NY, notifMaster: true, classReminders: true, sysPush: true };
const ev = (o) => Object.assign({ id: "e1", title: "Chem quiz", date: "2026-10-31", time: "09:00", kind: "task" }, o);

describe("dueReminders", () => {
  test("fires at 10 and 5 minutes, not outside the window", () => {
    const start = at("2026-10-31", "09:00", NY);
    const run = (minsBefore, fired) => C.dueReminders({ events: [ev()], routines: [], prefs: base, nowMs: start - minsBefore * 60000, firedKeys: fired || [] });
    assert.equal(run(10).length, 1);
    assert.equal(run(10)[0].lead, 10);
    assert.equal(run(5)[0].lead, 5);
    assert.equal(run(5)[0].title, "Chem quiz");
    assert.equal(run(20).length, 0);
    assert.equal(run(7).length, 1);
    assert.equal(run(7)[0].lead, 10);
    assert.equal(run(7)[0].mins, 7);
    assert.equal(run(11).length, 0);
    assert.equal(run(2)[0].lead, 5);
    assert.equal(run(-1).length, 0);
  });
  test("never twice once the key is fired", () => {
    const start = at("2026-10-31", "09:00", NY);
    const first = C.dueReminders({ events: [ev()], routines: [], prefs: base, nowMs: start - 10 * 60000, firedKeys: [] });
    assert.equal(first.length, 1);
    const again = C.dueReminders({ events: [ev()], routines: [], prefs: base, nowMs: start - 9.5 * 60000, firedKeys: [first[0].key] });
    assert.equal(again.length, 0);
  });
  test("timezone: same wall clock is a different instant in UTC vs New York", () => {
    const start = at("2026-10-31", "09:00", NY);
    const asUtc = at("2026-10-31", "09:00", "UTC");
    assert.equal((start - asUtc) / 3600000, 4); // EDT, UTC-4
    const nowMs = start - 10 * 60000;
    assert.equal(C.dueReminders({ events: [ev()], routines: [], prefs: base, nowMs, firedKeys: [] }).length, 1);
    assert.equal(C.dueReminders({ events: [ev()], routines: [], prefs: Object.assign({}, base, { tz: "UTC" }), nowMs, firedKeys: [] }).length, 0);
  });
  test("timezone: correct across the Nov 1 DST end (EDT to EST)", () => {
    const before = at("2026-11-01", "00:30", NY); // still EDT
    const after = at("2026-11-02", "00:30", NY); // EST
    assert.equal((after - before) / 3600000, 25);
    assert.equal(at("2026-11-02", "09:00", NY) - at("2026-11-02", "09:00", "UTC"), 5 * 3600000);
    const e = ev({ date: "2026-11-02", time: "09:00" });
    const nowMs = at("2026-11-02", "08:50", NY);
    assert.equal(C.dueReminders({ events: [e], routines: [], prefs: base, nowMs, firedKeys: [] }).length, 1);
  });
  test("routine fires on the right weekday only", () => {
    const routine = { id: "r1", title: "Bio lecture", days: [5], startTime: "10:00", kind: "class" };
    const sat = at("2026-10-31", "09:50", NY);
    const fri = at("2026-10-30", "09:50", NY);
    const due = C.dueReminders({ events: [], routines: [routine], prefs: base, nowMs: sat, firedKeys: [] });
    assert.equal(due.length, 1);
    assert.equal(due[0].title, "Bio lecture");
    assert.equal(C.dueReminders({ events: [], routines: [routine], prefs: base, nowMs: fri, firedKeys: [] }).length, 0);
  });
  test("routine honors skipped dates, overrides and school term", () => {
    const routine = { id: "r1", title: "Bio", days: [5], startTime: "10:00", kind: "class" };
    const nowMs = at("2026-10-31", "09:50", NY);
    const run = (extra) => C.dueReminders({ events: [], routines: [routine], prefs: Object.assign({}, base, extra), nowMs, firedKeys: [] }).length;
    assert.equal(run({ routineSkips: { "2026-10-31": ["r1"] } }), 0);
    assert.equal(run({ schoolTerm: { start: "2026-01-01", end: "2026-05-01" } }), 0);
    assert.equal(run({ schoolTerm: { start: "2026-09-01", end: "2026-12-15" } }), 1);
    assert.equal(run({ routineOverrides: { r1: { "2026-10-31": { startTime: "14:00" } } } }), 0);
  });
  test("classReminders off suppresses routines but not events", () => {
    const routine = { id: "r1", title: "Bio", days: [5], startTime: "10:00", kind: "class" };
    const prefs = Object.assign({}, base, { classReminders: false });
    assert.equal(C.dueReminders({ events: [], routines: [routine], prefs, nowMs: at("2026-10-31", "09:50", NY), firedKeys: [] }).length, 0);
    assert.equal(C.dueReminders({ events: [ev()], routines: [], prefs, nowMs: at("2026-10-31", "08:50", NY), firedKeys: [] }).length, 1);
  });
  test("notifMaster off suppresses everything", () => {
    const prefs = Object.assign({}, base, { notifMaster: false });
    assert.equal(C.dueReminders({ events: [ev()], routines: [], prefs, nowMs: at("2026-10-31", "08:50", NY), firedKeys: [] }).length, 0);
  });
  test("done, checklist, untimed and deleted items are skipped; deadline gate", () => {
    const nowMs = at("2026-10-31", "08:50", NY);
    const run = (e, prefs) => C.dueReminders({ events: [e], routines: [], prefs: prefs || base, nowMs, firedKeys: [] }).length;
    assert.equal(run(ev({ status: "done" })), 0);
    assert.equal(run(ev({ checklist: [{}] })), 0);
    assert.equal(run(ev({ time: "" })), 0);
    assert.equal(run(ev({ deletedAt: 1 })), 0);
    assert.equal(run(ev({ kind: "exam" }), Object.assign({}, base, { deadline: false })), 0);
    assert.equal(run(ev({ kind: "exam" })), 1);
  });
  test("midnight-crossing lead: 00:05 tomorrow reminds at 23:55 tonight", () => {
    const e = ev({ date: "2026-11-01", time: "00:05" });
    const nowMs = at("2026-10-31", "23:55", NY);
    const due = C.dueReminders({ events: [e], routines: [], prefs: base, nowMs, firedKeys: [] });
    assert.equal(due.length, 1);
    assert.equal(due[0].lead, 10);
  });
  test("invalid or missing timezone sends nothing", () => {
    const nowMs = at("2026-10-31", "08:50", NY);
    assert.equal(C.dueReminders({ events: [ev()], routines: [], prefs: { classReminders: true }, nowMs, firedKeys: [] }).length, 0);
    assert.equal(C.dueReminders({ events: [ev()], routines: [], prefs: { tz: "Nope/Zone" }, nowMs, firedKeys: [] }).length, 0);
  });
});

describe("per-task reminder time (remindMins)", () => {
  const core = require("../api/_lib/reminders-core");
  const prefs = { tz: "UTC", notifMaster: true, deadline: true, classReminders: false };
  // 2026-11-02 12:00 UTC; the task starts at 12:20 UTC
  const nowAt = (min) => Date.UTC(2026, 10, 2, 12, 0) + min * 60000;
  const ev = (extra) => Object.assign({ id: "t1", title: "Read ch 4", date: "2026-11-02", time: "12:20", status: "pending", kind: "study block" }, extra);

  test("remindMins 20 fires 20 minutes before and not at the default 10/5", () => {
    const e = ev({ remindMins: 20 });
    assert.equal(core.dueReminders({ events: [e], routines: [], prefs, nowMs: nowAt(0), firedKeys: [] }).length, 1);
    assert.equal(core.dueReminders({ events: [e], routines: [], prefs, nowMs: nowAt(0), firedKeys: [] })[0].lead, 20);
    assert.equal(core.dueReminders({ events: [e], routines: [], prefs, nowMs: nowAt(10), firedKeys: [] }).length, 0);
    assert.equal(core.dueReminders({ events: [e], routines: [], prefs, nowMs: nowAt(15), firedKeys: [] }).length, 0);
  });

  test("remindMins 0 means no reminder at all for that task", () => {
    const e = ev({ remindMins: 0 });
    [0, 10, 15].forEach((m) => assert.equal(core.dueReminders({ events: [e], routines: [], prefs, nowMs: nowAt(m), firedKeys: [] }).length, 0));
  });

  test("no remindMins keeps the default 10 and 5", () => {
    const e = ev({});
    assert.equal(core.dueReminders({ events: [e], routines: [], prefs, nowMs: nowAt(10), firedKeys: [] }).length, 1);
    assert.equal(core.dueReminders({ events: [e], routines: [], prefs, nowMs: nowAt(15), firedKeys: [] }).length, 1);
  });
});
