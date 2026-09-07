// isZeroDurationTimedReminder -- backs the thin-line calendar marker for
// reminders (2026-09-06 user request: a reminder is a nudge at an instant,
// it shouldn't render as an ordinary-looking short block). Only a reminder
// with a real, CONFIRMED time qualifies -- one with no confirmed time is
// already handled elsewhere as a due-pill (see isDuePill), and this must
// never double-claim that case.
// Bug fix, same day: this originally also required !ev.duration, but a
// reminder saved through the New Task form keeps whatever evDuration
// happened to default to (60) -- that form only hides the End Time field
// for kind==="reminder", it never resets the value to 0. Only a reminder
// built by Studlin AI/brain-dump actually stores duration:0. The fixed
// version ignores duration entirely so BOTH kinds of reminder get the
// marker, matching what's actually in a real student's data. Run with
// `npm test`.
const { test, describe } = require("node:test");
const assert = require("node:assert/strict");
const { loadStudlinModule } = require("./harness.js");

describe("isZeroDurationTimedReminder", () => {
  test("a reminder with a real time and no duration is a marker", () => {
    const m = loadStudlinModule();
    assert.equal(m.isZeroDurationTimedReminder({ kind: "reminder", time: "09:00" }), true);
  });

  test("a reminder with a real time AND a stored duration is STILL a marker -- this is the actual bug fix", () => {
    const m = loadStudlinModule();
    // This is what a reminder saved through the New Task form actually
    // looks like (evDuration defaults to 60 and is never reset for this
    // kind) -- the original version of this function missed every one of
    // these because it also required !ev.duration.
    assert.equal(m.isZeroDurationTimedReminder({ kind: "reminder", time: "09:00", duration: 60 }), true);
  });

  test("a reminder with no confirmed time is NOT a marker -- that's isDuePill's case instead", () => {
    const m = loadStudlinModule();
    assert.equal(m.isZeroDurationTimedReminder({ kind: "reminder", time: "09:00", timeUnconfirmed: true }), false);
  });

  test("a checklist item is never a marker even if it looks like a reminder", () => {
    const m = loadStudlinModule();
    assert.equal(m.isZeroDurationTimedReminder({ kind: "reminder", time: "09:00", checklist: true }), false);
  });

  test("a non-reminder kind (deadline, exam, study block) is never a marker", () => {
    const m = loadStudlinModule();
    assert.equal(m.isZeroDurationTimedReminder({ kind: "deadline", time: "09:00" }), false);
    assert.equal(m.isZeroDurationTimedReminder({ kind: "exam", time: "09:00" }), false);
    assert.equal(m.isZeroDurationTimedReminder({ kind: "study block", time: "09:00", duration: 0 }), false);
  });

  test("a reminder with no time at all is never a marker -- nothing to draw a line at", () => {
    const m = loadStudlinModule();
    assert.equal(m.isZeroDurationTimedReminder({ kind: "reminder" }), false);
  });

  test("never both a due-pill and a marker for the same event -- mutually exclusive", () => {
    const m = loadStudlinModule();
    const confirmedTimeReminder = { kind: "reminder", time: "09:00", duration: 60 };
    const unconfirmedTimeReminder = { kind: "reminder", time: "09:00", timeUnconfirmed: true };
    assert.equal(m.isDuePill(confirmedTimeReminder), false);
    assert.equal(m.isZeroDurationTimedReminder(confirmedTimeReminder), true);
    assert.equal(m.isDuePill(unconfirmedTimeReminder), true);
    assert.equal(m.isZeroDurationTimedReminder(unconfirmedTimeReminder), false);
  });
});
