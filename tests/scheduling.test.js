// Regression tests for the scheduling engine -- the part of the app
// identified as both the real differentiator and the part where two
// due-date-corruption bugs were found and fixed by hand this session.
// These exist so the next regression like that gets caught automatically
// instead of by manual audit. Run with `npm test`.
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

// A syllabus-scanned due-date marker: no real duration, the exact shape
// commitSyllabusEvents/commitBrainDump produce for "this is due" facts.
function dueDateMarker(overrides) {
  return {
    id: "marker-1", title: "Problem Set 3", date: "2026-07-20", time: "23:59",
    subject: "Chemistry", kind: "deadline", notes: "", priority: 5, difficulty: 5,
    deadline: "2026-07-20", duration: null, status: "pending", timeSpent: 0,
    completedAt: null, ...overrides,
  };
}

function realTask(overrides) {
  return {
    id: "task-1", title: "Study chem", date: "2026-07-20", time: "10:00",
    subject: "Chemistry", kind: "study block", notes: "", priority: 5, difficulty: 5,
    deadline: null, duration: 30, status: "pending", timeSpent: 0,
    completedAt: null, ...overrides,
  };
}

describe("rebalanceDay", () => {
  test("never repositions a duration-less due-date marker", () => {
    const { rebalanceDay } = loadStudlinModule();
    const marker = dueDateMarker();
    const events = [marker, realTask({ id: "task-1" }), realTask({ id: "task-2", time: "10:00" })];
    const next = rebalanceDay("2026-07-20", events, [], DEFAULT_PREFS);
    const markerAfter = next.find((e) => e.id === "marker-1");
    assert.equal(markerAfter.date, "2026-07-20");
    assert.equal(markerAfter.time, "23:59");
  });

  test("still reshuffles real overlapping study blocks on the same day", () => {
    const { rebalanceDay } = loadStudlinModule();
    const events = [
      realTask({ id: "task-1", time: "10:00", priority: 800 }),
      realTask({ id: "task-2", time: "10:00", priority: 200 }),
    ];
    const next = rebalanceDay("2026-07-20", events, [], DEFAULT_PREFS);
    const t1 = next.find((e) => e.id === "task-1");
    const t2 = next.find((e) => e.id === "task-2");
    assert.notEqual(t1.time, t2.time, "two same-time real tasks should no longer overlap after rebalancing");
  });
});

describe("computePausePlan (Studlin Reschedule)", () => {
  test("never moves a duration-less due-date marker's actual due date", () => {
    // computePausePlan reads events from localStorage directly, not a param.
    const m = loadStudlinModule();
    const marker = dueDateMarker({ date: "2026-07-15" }); // inside the shift/clear window
    const task = realTask({ id: "task-1", date: "2026-07-15" });
    m.localStorage.setItem("studlin-events", JSON.stringify([marker, task]));
    const result = m.computePausePlan({ intent: "shift", days: 3 });
    const touchedIds = [...result.moved, ...result.couldntMove].map((x) => x.id);
    assert.ok(!touchedIds.includes("marker-1"), "the due-date marker must never appear in moved or couldntMove");
  });

  test("clear_week also excludes duration-less markers but includes real tasks", () => {
    const m = loadStudlinModule();
    const marker = dueDateMarker({ date: "2026-07-16" });
    const task = realTask({ id: "task-1", date: "2026-07-16" });
    m.localStorage.setItem("studlin-events", JSON.stringify([marker, task]));
    const result = m.computePausePlan({ intent: "clear_week" });
    const touchedIds = [...result.moved, ...result.couldntMove].map((x) => x.id);
    assert.ok(!touchedIds.includes("marker-1"));
    assert.ok(touchedIds.includes("task-1"), "a real study block should still be eligible to move");
  });

  test("a real assignment (kind:deadline WITH a real duration) is still reschedulable", () => {
    const m = loadStudlinModule();
    const realDeadlineTask = dueDateMarker({ id: "real-deadline-1", date: "2026-07-16", duration: 45, time: "14:00" });
    m.localStorage.setItem("studlin-events", JSON.stringify([realDeadlineTask]));
    const result = m.computePausePlan({ intent: "clear_day", date: "2026-07-16" });
    const touchedIds = [...result.moved, ...result.couldntMove].map((x) => x.id);
    assert.ok(touchedIds.includes("real-deadline-1"), "a deadline-kind item WITH a real duration must not be caught by the marker carve-out");
  });
});

describe("isTier0Missed", () => {
  test("a missed real study block is eligible for reflow", () => {
    const { isTier0Missed } = loadStudlinModule();
    const ev = realTask({ date: "2026-07-10", status: "pending" });
    assert.equal(isTier0Missed(ev, "2026-07-14"), true);
  });

  test("an exam marker is never eligible, even if its date has passed", () => {
    const { isTier0Missed } = loadStudlinModule();
    const ev = dueDateMarker({ kind: "exam", date: "2026-07-10", deadline: null, time: "09:00" });
    assert.equal(isTier0Missed(ev, "2026-07-14"), false);
  });

  test("a duration-less deadline marker is never eligible", () => {
    const { isTier0Missed } = loadStudlinModule();
    const ev = dueDateMarker({ date: "2026-07-10", deadline: "2026-07-10" });
    assert.equal(isTier0Missed(ev, "2026-07-14"), false);
  });

  test("a checklist item is never eligible", () => {
    const { isTier0Missed } = loadStudlinModule();
    const ev = realTask({ date: "2026-07-10", checklist: true });
    assert.equal(isTier0Missed(ev, "2026-07-14"), false);
  });

  test("a completed task is never eligible", () => {
    const { isTier0Missed } = loadStudlinModule();
    const ev = realTask({ date: "2026-07-10", status: "done" });
    assert.equal(isTier0Missed(ev, "2026-07-14"), false);
  });
});

describe("computeReviewOffsets / computeReviewDates", () => {
  test("returns nothing when there's less than 2 days of runway", () => {
    const { computeReviewOffsets } = loadStudlinModule();
    // Arrays built inside the sandboxed vm context aren't deepEqual-identical
    // to native-realm arrays even with matching contents (a vm quirk, not a
    // source bug) -- checking length sidesteps that entirely.
    assert.equal(computeReviewOffsets(1, 4).length, 0);
  });

  test("respects a student-chosen count, clamped to 1-6", () => {
    const { computeReviewOffsets } = loadStudlinModule();
    assert.ok(computeReviewOffsets(90, 2).length <= 2);
    assert.ok(computeReviewOffsets(90, 999).length <= 6, "count above 6 must be clamped");
  });

  test("every offset lands strictly before the target date", () => {
    const { computeReviewOffsets } = loadStudlinModule();
    const offsets = computeReviewOffsets(10, 4);
    assert.ok(offsets.every((o) => o < 10 && o >= 1));
  });

  test("computeReviewDates returns ascending dates, all before the exam", () => {
    const { computeReviewDates } = loadStudlinModule();
    const dates = Array.from(computeReviewDates("2026-08-13", "2026-07-14", 4));
    assert.ok(dates.length > 0);
    for (let i = 1; i < dates.length; i++) {
      assert.ok(dates[i] >= dates[i - 1], "dates should already be in ascending order");
    }
    assert.ok(dates.every((d) => d < "2026-08-13"));
  });
});

describe("findOpenSlotFor / findLegalSlotOrNull", () => {
  test("places a task at the requested time on an empty calendar", () => {
    const { findOpenSlotFor } = loadStudlinModule();
    const slot = findOpenSlotFor([], [], DEFAULT_PREFS, "2026-07-21", "10:00", 30, null);
    assert.equal(slot.date, "2026-07-21");
    assert.equal(slot.time, "10:00");
  });

  test("findLegalSlotOrNull refuses a slot that would land after the deadline", () => {
    const { findLegalSlotOrNull } = loadStudlinModule();
    // Desired date is already past the deadline -- no legal placement exists.
    const slot = findLegalSlotOrNull([], [], DEFAULT_PREFS, "2026-07-25", "10:00", 30, "2026-07-20");
    assert.equal(slot, null);
  });

  test("findLegalSlotOrNull succeeds when the desired date is within the deadline", () => {
    const { findLegalSlotOrNull } = loadStudlinModule();
    const slot = findLegalSlotOrNull([], [], DEFAULT_PREFS, "2026-07-18", "10:00", 30, "2026-07-25");
    assert.notEqual(slot, null);
    assert.ok(slot.date <= "2026-07-25");
  });
});

// planBrainDumpTasks always schedules against the real "today" (it calls
// dayKey() internally, same as the app does live), so these tests deliberately
// avoid asserting any specific absolute time -- only the RELATIONSHIP between
// items, which holds no matter what day/time the test happens to run.
function minutesOf(timeStr) {
  const [h, m] = timeStr.split(":").map(Number);
  return h * 60 + m;
}
// Chained placement goes through the same breathing-room buffer and 15-min
// grid quantization every other placement does, so it won't land at the
// *exact* end of the previous item -- just very shortly after. This is the
// upper bound on "shortly": comfortably wider than breathing room + one grid
// step, but far, far tighter than "hours later at a peak-hour bucket," which
// is the actual regression these tests guard against.
const MAX_CHAIN_GAP_MINS = 30;

describe("planBrainDumpTasks (Brain Dump placement)", () => {
  test("two timeless items (no stated clock time) never land at overlapping times", () => {
    // Regression test for the 2026-07-15 bug: "Chill" and "Gym" both had no
    // stated time and silently collapsed onto the same hardcoded 9am fallback.
    const { planBrainDumpTasks } = loadStudlinModule();
    const items = [
      { kind: "event", title: "Chill", durationMin: 60, dueTime: null, dueDate: null },
      { kind: "event", title: "Gym", durationMin: 60, dueTime: null, dueDate: null },
    ];
    const tasks = planBrainDumpTasks(items, [], [], DEFAULT_PREFS);
    const chill = tasks.find((t) => t.title === "Chill");
    const gym = tasks.find((t) => t.title === "Gym");
    assert.ok(chill && gym);
    if (chill.date === gym.date) {
      const chillStart = minutesOf(chill.time), chillEnd = chillStart + chill.duration;
      const gymStart = minutesOf(gym.time), gymEnd = gymStart + gym.duration;
      const overlap = chillStart < gymEnd && gymStart < chillEnd;
      assert.equal(overlap, false, "Chill and Gym landed at overlapping times");
    }
  });

  test("a chained item lands immediately after the previous item, not wherever's independently best", () => {
    // Regression test for the 2026-07-15 bug: a same-day "then"-sequenced
    // dump ("find bugs, THEN paint the floor") got scheduled out of order,
    // since each item was independently slotted with no concept of sequence.
    const { planBrainDumpTasks } = loadStudlinModule();
    const items = [
      { kind: "study", title: "Find bugs", durationMin: 60, immediate: true, chained: false },
      { kind: "study", title: "Paint floor", durationMin: 30, chained: true },
    ];
    const tasks = planBrainDumpTasks(items, [], [], DEFAULT_PREFS);
    const bugs = tasks.find((t) => t.title === "Find bugs");
    const paint = tasks.find((t) => t.title === "Paint floor");
    assert.ok(bugs && paint);
    assert.equal(paint.date, bugs.date);
    const gap = minutesOf(paint.time) - (minutesOf(bugs.time) + bugs.duration);
    assert.ok(gap >= 0 && gap <= MAX_CHAIN_GAP_MINS, `expected paint to start shortly after bugs ended, gap was ${gap}min`);
  });

  test("a chained item stays chained even when a declared peak-hour bucket would otherwise pull it elsewhere", () => {
    // The reliability/peak-hour engine is exactly what pushed "now" tasks
    // hours away in the original bug report -- chaining must override it.
    const { planBrainDumpTasks } = loadStudlinModule();
    const prefs = { ...DEFAULT_PREFS, peakHourBuckets: ["evening"] };
    const items = [
      { kind: "study", title: "First", durationMin: 60, immediate: false, chained: false },
      { kind: "study", title: "Second", durationMin: 30, chained: true },
    ];
    const tasks = planBrainDumpTasks(items, [], [], prefs);
    const first = tasks.find((t) => t.title === "First");
    const second = tasks.find((t) => t.title === "Second");
    assert.ok(first && second);
    assert.equal(second.date, first.date);
    const gap = minutesOf(second.time) - (minutesOf(first.time) + first.duration);
    assert.ok(gap >= 0 && gap <= MAX_CHAIN_GAP_MINS, `expected second to stay chained to first instead of jumping to the evening bucket, gap was ${gap}min`);
  });
});
