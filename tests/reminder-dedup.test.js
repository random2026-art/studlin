// hasFiredReminder/markReminderFired -- fixes the "desktop notification
// pops up 3 times" user report. The "X starts in N minutes" check used
// to dedupe with an in-memory ref only, which can't protect against
// multiple Studlin tabs/windows each independently firing the identical
// notification for the identical event. Persisted here instead, so
// whichever tab fires first "claims" the key for every other tab.
// Run with `npm test`.
const { test, describe } = require("node:test");
const assert = require("node:assert/strict");
const { loadStudlinModule } = require("./harness.js");

describe("hasFiredReminder / markReminderFired", () => {
  test("a key that's never been marked hasn't fired", () => {
    const m = loadStudlinModule();
    assert.equal(m.hasFiredReminder("ev1-10"), false);
  });

  test("marking a key makes it show as fired", () => {
    const m = loadStudlinModule();
    m.markReminderFired("ev1-10");
    assert.equal(m.hasFiredReminder("ev1-10"), true);
  });

  test("marking one key never affects a different key -- this is the actual cross-tab fix, not a blanket suppression", () => {
    const m = loadStudlinModule();
    m.markReminderFired("ev1-10");
    assert.equal(m.hasFiredReminder("ev1-5"), false);
    assert.equal(m.hasFiredReminder("ev2-10"), false);
  });

  test("simulates two tabs racing to fire the same reminder -- the second tab's check sees it's already claimed", () => {
    const m = loadStudlinModule();
    // Tab A's check() runs first.
    assert.equal(m.hasFiredReminder("ev1-10"), false, "tab A sees nothing fired yet");
    m.markReminderFired("ev1-10");
    // Tab B's check() runs moments later, reading the same persisted store.
    assert.equal(m.hasFiredReminder("ev1-10"), true, "tab B now sees tab A already claimed it, skips its own notification");
  });
});
