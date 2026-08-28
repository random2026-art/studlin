// Regression tests for the 2026-08-27 Reschedule modal fix, requested
// directly from a live screenshot: every "Currently free" candidate day
// showed the exact same generic line ("Leaves 4 other fully free days
// coming up"), which told the student nothing that differed between the
// three options they were looking at. Replaced with two real, measured
// numbers per candidate, both built on primitives the scheduler itself
// already trusts rather than anything fabricated for display:
//
// 1. Buffer/breathing-room shrink -- getWorkWindowMinsFor (the day's real
//    work-hour capacity) minus computeOccupiedIntervals (what's genuinely
//    blocked off, lead-in/trail-out included), computed once against the
//    day as it stands today and once against this candidate's placement.
// 2. Week workload push -- weekPrepLoad's own ratio (already used
//    elsewhere for exam-prep pressure warnings), computed once against
//    the untouched events (this week's load without the move) and once
//    against the relocated events (with it), for the SAME week (the
//    candidate day's own Monday-Sunday) both times -- an honest before/
//    after on one week, not today's week vs. some other week.
//
// computeRescheduleCandidates is a real top-level pure function, tested
// directly via the harness. Run with `npm test`.
const { test, describe } = require("node:test");
const assert = require("node:assert/strict");
const { loadStudlinModule } = require("./harness.js");

const DEFAULT_PREFS = {
  workStartTime: "09:00",
  workEndTime: "18:00",
  bedtime: "23:00",
  taskDifficultyPreference: "NONE",
  bufferMarginStrategy: "15_MIN",
  weekendEnabled: false,
  weekendStartTime: "09:00",
  weekendEndTime: "18:00",
  peakHourBuckets: [],
};
const WINDOW_MINS = 540; // 09:00-18:00

function task(overrides) {
  return {
    id: "task-1", title: "Test Task", date: "2026-07-25", time: "14:00",
    kind: "assignment", subject: "", notes: "", priority: 5, difficulty: 5,
    deadline: null, duration: 300, status: "pending", timeSpent: 0,
    completedAt: null, ...overrides,
  };
}

describe("Buffer/breathing-room accounting: a real measured shrink, not a guess", () => {
  test("an empty candidate day starts with the full work-window as its buffer", () => {
    const { computeRescheduleCandidates } = loadStudlinModule({ now: "2026-07-25T08:00:00" });
    const t = task({ duration: 60 });
    const { candidates } = computeRescheduleCandidates(t, [t], [], DEFAULT_PREFS);
    for (const c of candidates) {
      assert.equal(c.bufferBeforeMins, WINDOW_MINS, "no events exist yet on any candidate day, so its pre-move buffer must equal the full work window");
    }
  });

  test("placing the task shrinks that day's buffer by at least its own duration", () => {
    const { computeRescheduleCandidates } = loadStudlinModule({ now: "2026-07-25T08:00:00" });
    const t = task({ duration: 60 });
    const { candidates } = computeRescheduleCandidates(t, [t], [], DEFAULT_PREFS);
    for (const c of candidates) {
      assert.ok(c.bufferAfterMins < c.bufferBeforeMins, "placing a real task must always cost some buffer");
      assert.ok(c.bufferBeforeMins - c.bufferAfterMins >= 60, "the shrink must be at least the task's own raw duration (lead-in/trail-out only ever add to it, never subtract)");
    }
  });

  test("a longer task shrinks the buffer by more than a shorter one on an otherwise identical empty day", () => {
    const { computeRescheduleCandidates: withShort } = loadStudlinModule({ now: "2026-07-25T08:00:00" });
    const short = task({ duration: 30 });
    const { candidates: shortCandidates } = withShort(short, [short], [], DEFAULT_PREFS);

    const { computeRescheduleCandidates: withLong } = loadStudlinModule({ now: "2026-07-25T08:00:00" });
    const long = task({ duration: 240 });
    const { candidates: longCandidates } = withLong(long, [long], [], DEFAULT_PREFS);

    const shortShrink = shortCandidates[0].bufferBeforeMins - shortCandidates[0].bufferAfterMins;
    const longShrink = longCandidates[0].bufferBeforeMins - longCandidates[0].bufferAfterMins;
    assert.ok(longShrink > shortShrink, "a 240-minute task must eat noticeably more buffer than a 30-minute one");
  });
});

describe("Week workload push: an honest before/after on the SAME week, not today's week vs. a different one", () => {
  // 2026-07-25 is a Saturday, so day-offset 1 (Sun 7/26) is still the tail
  // of THIS week (Mon 7/20-Sun 7/26, same week the task already sits in
  // today), while day-offset 2+ (Mon 7/27 onward) falls in the NEXT week
  // (Mon 7/27-Sun 8/2) -- a week the task was never part of before moving.
  test("a same-week candidate shows no artificial week-workload increase -- the task was already counted in that week either way", () => {
    const { computeRescheduleCandidates } = loadStudlinModule({ now: "2026-07-25T08:00:00" });
    const t = task({ duration: 300 });
    const { candidates } = computeRescheduleCandidates(t, [t], [], DEFAULT_PREFS);
    const sameWeekCandidate = candidates.find(c => c.date === "2026-07-26");
    assert.ok(sameWeekCandidate, "Sunday 7/26 should be a candidate");
    assert.equal(Math.round(sameWeekCandidate.weekPressureBefore.ratio * 1000), Math.round(sameWeekCandidate.weekPressure.ratio * 1000),
      "moving the task to a different day within the SAME week it already belonged to must not change that week's total load");
  });

  test("a next-week candidate correctly shows the real increase -- the task genuinely wasn't part of that week's load before the move", () => {
    const { computeRescheduleCandidates } = loadStudlinModule({ now: "2026-07-25T08:00:00" });
    const t = task({ duration: 300 });
    const { candidates } = computeRescheduleCandidates(t, [t], [], DEFAULT_PREFS);
    const nextWeekCandidate = candidates.find(c => c.date === "2026-07-27");
    assert.ok(nextWeekCandidate, "Monday 7/27 should be a candidate");
    assert.equal(nextWeekCandidate.weekPressureBefore.ratio, 0, "next week had zero other load before the move");
    // totalCapacity = 7 days * 540 min (weekendEnabled:false -> every day
    // gets full weekday hours) = 3780; the task is the only load, so ratio
    // should land at exactly 300/3780.
    assert.ok(Math.abs(nextWeekCandidate.weekPressure.ratio - (300 / 3780)) < 0.001,
      "after the move, that week's ratio should reflect exactly this task's own minutes against its real total capacity");
    assert.ok(nextWeekCandidate.weekPressure.ratio > nextWeekCandidate.weekPressureBefore.ratio, "the push must be visible: after > before");
  });
});
