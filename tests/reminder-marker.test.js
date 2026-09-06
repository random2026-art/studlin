// isZeroDurationTimedReminder -- backs the new thin-line calendar marker
// for reminders (2026-09-06 user request: a reminder has no real duration,
// it shouldn't render as an ordinary-looking short block). Only a reminder
// with a real, CONFIRMED time qualifies -- one with no confirmed time is
// already handled elsewhere as a due-pill (see isDuePill), and this must
// never double-claim that case. Run with `npm test`.
const { test, describe } = require("node:test");
const assert = require("node:assert/strict");
const { loadStudlinModule } = require("./harness.js");

describe("isZeroDurationTimedReminder", () => {
  test("a reminder with a real time and no duration is a marker", () => {
    const m = loadStudlinModule();
    assert.equal(m.isZeroDurationTimedReminder({ kind: "reminder", time: "09:00" }), true);
  });

  test("a reminder with no confirmed time is NOT a marker -- that's isDuePill's case instead", () => {
    const m = loadStudlinModule();
    assert.equal(m.isZeroDurationTimedReminder({ kind: "reminder", time: "09:00", timeUnconfirmed: true }), false);
  });

  test("a reminder with a real duration renders normally, not as a marker", () => {
    const m = loadStudlinModule();
    assert.equal(m.isZeroDurationTimedReminder({ kind: "reminder", time: "09:00", duration: 15 }), false);
  });

  test("a checklist item is never a marker even if it looks like a zero-duration reminder", () => {
    const m = loadStudlinModule();
    assert.equal(m.isZeroDurationTimedReminder({ kind: "reminder", time: "09:00", checklist: true }), false);
  });

  test("a non-reminder kind (deadline, exam, study block) is never a marker", () => {
    const m = loadStudlinModule();
    assert.equal(m.isZeroDurationTimedReminder({ kind: "deadline", time: "09:00" }), false);
    assert.equal(m.isZeroDurationTimedReminder({ kind: "exam", time: "09:00" }), false);
    assert.equal(m.isZeroDurationTimedReminder({ kind: "study block", time: "09:00" }), false);
  });

  test("a reminder with no time at all is never a marker -- nothing to draw a line at", () => {
    const m = loadStudlinModule();
    assert.equal(m.isZeroDurationTimedReminder({ kind: "reminder" }), false);
  });

  test("never both a due-pill and a marker for the same event -- mutually exclusive", () => {
    const m = loadStudlinModule();
    const confirmedTimeReminder = { kind: "reminder", time: "09:00" };
    const unconfirmedTimeReminder = { kind: "reminder", time: "09:00", timeUnconfirmed: true };
    assert.equal(m.isDuePill(confirmedTimeReminder), false);
    assert.equal(m.isZeroDurationTimedReminder(confirmedTimeReminder), true);
    assert.equal(m.isDuePill(unconfirmedTimeReminder), true);
    assert.equal(m.isZeroDurationTimedReminder(unconfirmedTimeReminder), false);
  });
});
