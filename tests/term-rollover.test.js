// Term rollover (Phase 8 follow-up, 2026-07-29): detects when today's date
// has passed the configured term's end, so CalendarTab can show a one-time,
// dismissible prompt to set up next term instead of silently going stale.
// Courses/Activities term-tagging and the "Past terms" sidebar section are
// UI/data-shape work, verified live -- this covers the pure detection and
// dismiss-tracking logic.
const { test, describe } = require("node:test");
const assert = require("node:assert/strict");
const { loadStudlinModule } = require("./harness.js");

describe("isTermRolloverDue", () => {
  test("false when no term is configured", () => {
    const m = loadStudlinModule();
    assert.equal(m.isTermRolloverDue(null, "2026-08-01"), false);
  });

  test("false when term has no end date", () => {
    const m = loadStudlinModule();
    assert.equal(m.isTermRolloverDue({ start: "2026-01-01" }, "2026-08-01"), false);
  });

  test("false while today is still within the term", () => {
    const m = loadStudlinModule();
    const term = { start: "2026-01-10", end: "2026-05-20" };
    assert.equal(m.isTermRolloverDue(term, "2026-05-20"), false);
    assert.equal(m.isTermRolloverDue(term, "2026-03-01"), false);
  });

  test("true once today is past the term's end", () => {
    const m = loadStudlinModule();
    const term = { start: "2026-01-10", end: "2026-05-20" };
    assert.equal(m.isTermRolloverDue(term, "2026-05-21"), true);
    assert.equal(m.isTermRolloverDue(term, "2026-08-01"), true);
  });
});

describe("getTermRolloverDismissedFor / dismissTermRollover", () => {
  test("defaults to null when never dismissed", () => {
    const m = loadStudlinModule();
    assert.equal(m.getTermRolloverDismissedFor(), null);
  });

  test("remembers exactly the term-end that was dismissed", () => {
    const m = loadStudlinModule();
    m.dismissTermRollover("2026-05-20");
    assert.equal(m.getTermRolloverDismissedFor(), "2026-05-20");
  });

  test("a dismissal for an older term doesn't suppress a newer term's prompt", () => {
    const m = loadStudlinModule();
    m.dismissTermRollover("2026-05-20");
    const dismissed = m.getTermRolloverDismissedFor();
    const newTerm = { start: "2026-09-01", end: "2026-12-15" };
    // The caller's own gate (dismissed !== term.end) is what re-arms the
    // prompt for a later term -- this just confirms the stored value is
    // exactly the old term's end, not something that would accidentally
    // match a new one.
    assert.notEqual(dismissed, newTerm.end);
  });
});
