// 2026-10-16: manual study plan = tap days, auto-picked free times, one button.
const { test, describe } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");
const { loadStudlinModule } = require("./harness.js");
const APP = fs.readFileSync(path.join(__dirname, "..", "studlin-app.jsx"), "utf8").replace(/\r\n/g, "\n");

const PREFS = { workStartTime: "09:00", workEndTime: "21:00", bedtime: "23:00", taskDifficultyPreference: "NONE", bufferMarginStrategy: "15_MIN", weekendEnabled: true, weekendStartTime: "09:00", weekendEndTime: "21:00" };

describe("slot logic the day picker relies on", () => {
  const m = loadStudlinModule({ now: "2026-10-16T09:00:00" });
  test("a free afternoon gives a same-day slot, not a rolled-forward one", () => {
    const slot = m.findLegalSlotOrNull([], [], PREFS, "2026-10-19", "16:00", 45, "2026-10-21");
    assert.ok(slot);
    assert.equal(slot.date, "2026-10-19");
    assert.equal(slot.time, "16:00");
  });
  test("a day booked solid reports no room, so the UI can flag it", () => {
    const busy = [{ id: "b1", title: "All day", date: "2026-10-19", time: "09:00", duration: 720, kind: "busy block", status: "pending" }];
    assert.equal(m.dayHasRoomFor(busy, [], PREFS, "2026-10-19", 45), false);
    const slot = m.findLegalSlotOrNull(busy, [], PREFS, "2026-10-19", "16:00", 45, "2026-10-19");
    assert.equal(slot, null, "nothing legal before the deadline day");
  });
  test("a nearly full day still finds the one gap", () => {
    const evs = [{ id: "b1", title: "Class", date: "2026-10-19", time: "09:00", duration: 420, kind: "class", status: "pending" }];
    const slot = m.findLegalSlotOrNull(evs, [], PREFS, "2026-10-19", "16:00", 45, "2026-10-21");
    assert.ok(slot && slot.date === "2026-10-19");
    assert.ok(m.timeToMinutes(slot.time) >= 16 * 60 + 0);
  });
});

describe("source guards", () => {
  test("old blank form and separate review step are gone", () => {
    assert.ok(!APP.includes("manual-preview"));
    assert.ok(!APP.includes("addManualSessionRow"));
    assert.ok(!APP.includes("What do you want to study each session?"));
  });
  test("day chips toggle rows keyed by date and suggest a time", () => {
    assert.ok(APP.includes("const toggleManualDay=(dk)=>"));
    assert.ok(APP.includes("const suggestManualSlot=(dk,duration)=>"));
    assert.ok(APP.includes("slot&&slot.date===dk"), "same-day only");
    assert.ok(APP.includes('aria-label="Study days"'));
  });
  test("one confirm button with a count, focus text is optional", () => {
    assert.ok(APP.includes('"Add "+manualSessionRows.length+" session"'));
    assert.ok(APP.includes('placeholder="What to study (optional)"'));
    const commit = APP.slice(APP.indexOf("const commitManualSessions=()=>{"), APP.indexOf("const commitManualSessions=()=>{") + 2600);
    assert.ok(!commit.includes("filter(r=>r.text.trim())"), "rows no longer need text to count");
    assert.ok(commit.includes("findLegalSlotOrNull("), "still validates the chosen time before placing");
    assert.ok(commit.includes("setSyllabusToast("), "success feedback");
  });
  test("full days are flagged but still selectable, and an empty state is shown", () => {
    assert.ok(APP.includes("Pretty full, you can still add it"));
    assert.ok(APP.includes("No days picked yet."));
    assert.ok(APP.includes("No free time that day."));
  });
  test("no em dashes in the new copy", () => {
    const i = APP.indexOf("2026-10-16 redesign: the manual plan");
    const j = APP.indexOf("const openManualSessions=()=>{");
    const k = APP.indexOf('buildPlanStep==="manual"&&(()=>{');
    const ui = APP.slice(k, k + 6500);
    assert.ok(!APP.slice(i, j).includes("—"));
    assert.ok(!ui.includes("—"));
  });
});
