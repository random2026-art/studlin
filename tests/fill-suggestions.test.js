// computeFillSuggestions -- the post-delete "Freed up Xmin at Y, fill it
// with something?" prompt. Regression coverage for the wall-clock bug:
// deleting a task earlier today (e.g. 8am while it's actually 6pm) used to
// still offer to fill that already-elapsed slot.
const { test, describe } = require("node:test");
const assert = require("node:assert/strict");
const { loadStudlinModule } = require("./harness.js");

function seedQualifyingTask(m, date, time, duration) {
  m.lsSet("events", [
    { id: "t1", title: "Read chapter 4", kind: "study block", status: "pending", date, time, duration },
  ]);
}

describe("computeFillSuggestions", () => {
  test("suppresses a same-day slot whose time has already elapsed", () => {
    // Frozen "now" = 2026-07-28 18:00. Freed slot was 08:00-09:00 the same day.
    const m = loadStudlinModule({ now: "2026-07-28T18:00:00" });
    seedQualifyingTask(m, "2026-07-28", "10:00", 30);
    // Length check, not deepEqual against a literal [] -- the vm sandbox's
    // Array is a different realm than this test file's, so a cross-realm
    // empty array fails deepStrictEqual's prototype-identity check even
    // though it's structurally empty.
    const suggestions = m.computeFillSuggestions("2026-07-28", "08:00", 60);
    assert.equal(suggestions.length, 0);
  });

  test("still offers a same-day slot whose time has not yet arrived", () => {
    // Frozen "now" = 2026-07-28 12:00. Freed slot is 14:00 the same day -- still ahead.
    const m = loadStudlinModule({ now: "2026-07-28T12:00:00" });
    seedQualifyingTask(m, "2026-07-28", "14:30", 30);
    const suggestions = m.computeFillSuggestions("2026-07-28", "14:00", 60);
    assert.equal(suggestions.length, 1);
    assert.equal(suggestions[0].id, "t1");
  });

  test("still offers a same-day slot exactly ending at the current minute (not yet elapsed)", () => {
    // freedTime 08:00 + 60min duration ends exactly at 09:00 -- "now" is 09:00 itself,
    // one minute earlier than truly elapsed, so this is the boundary: should NOT suppress
    // since strictly greater-than is what makes a slot "already gone."
    const m = loadStudlinModule({ now: "2026-07-28T08:59:00" });
    seedQualifyingTask(m, "2026-07-28", "09:30", 30);
    const suggestions = m.computeFillSuggestions("2026-07-28", "08:00", 60);
    assert.equal(suggestions.length, 1);
  });

  test("a future-dated freed slot is always offered regardless of the current clock", () => {
    // "Now" is late evening, well past 08:00, but the freed slot is TOMORROW's 08:00 --
    // clock time is irrelevant for a different day.
    const m = loadStudlinModule({ now: "2026-07-28T23:00:00" });
    seedQualifyingTask(m, "2026-07-29", "10:00", 30);
    const suggestions = m.computeFillSuggestions("2026-07-29", "08:00", 60);
    assert.equal(suggestions.length, 1);
  });

  // 2026-08-25 regression: deleting a stale leftover task still sitting on
  // an EARLIER day (not just an earlier time today) offered to fill that
  // already-past day's freed slot -- "Freed up 1h 25m at 10:00 AM on Mon,
  // Aug 24" while it was actually Tuesday the 25th. The elapsed-time check
  // above only ever compared same-day clock time; it never considered
  // freedDate could be an entirely past day to begin with.
  test("suppresses a freed slot on a day that's already fully in the past, not just an elapsed time today", () => {
    const m = loadStudlinModule({ now: "2026-08-25T21:00:00" });
    seedQualifyingTask(m, "2026-08-25", "12:00", 30);
    const suggestions = m.computeFillSuggestions("2026-08-24", "10:00", 60);
    assert.equal(suggestions.length, 0);
  });

  test("still offers a freed slot on a genuinely past day's morning if today itself is that day (not literally in the past yet)", () => {
    // Sanity check the new freedDate<today guard doesn't overreach: TODAY's
    // own already-elapsed check is still what governs same-day, exactly as
    // the tests above already cover -- this just confirms the new
    // strictly-before-today guard doesn't also swallow today itself.
    const m = loadStudlinModule({ now: "2026-08-25T08:00:00" });
    seedQualifyingTask(m, "2026-08-25", "14:00", 30);
    const suggestions = m.computeFillSuggestions("2026-08-25", "10:00", 60);
    assert.equal(suggestions.length, 1);
  });
});
