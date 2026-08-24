// Regression tests for computeNewSlotCandidates -- the "show 2-3 real
// options instead of one silent pick" engine behind the new NewSlotPickerModal
// (exam session generation and Attack Block/flashcard scheduling). Modeled on
// computeRescheduleCandidates (see its own comment) but for a BRAND NEW
// placement rather than moving something that already exists: today itself
// is a legal candidate (reschedule's whole point is freeing up today, this
// is the opposite), and there's no eviction -- every candidate here is a
// slot findReliableSlotFor already considered genuinely open on its own.
//
// NewSlotPickerModal itself (a React component) isn't exercised directly
// here -- see harness.js's own comment on why stateful components are out of
// scope for this plain-function harness. These tests cover the actual
// candidate-generation logic that feeds it, plus fmtPlacementReason's
// existing "why here" copy which the picker reuses verbatim from
// RescheduleModal's own established pattern.
// Run with `npm test`.
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

function busyBlock(date, overrides) {
  return {
    id: "busy-" + date, title: "Existing", date, time: "09:00",
    subject: "", kind: "study block", notes: "", priority: 5, difficulty: 5,
    deadline: null, duration: 120, status: "pending", timeSpent: 0,
    completedAt: null, ...overrides,
  };
}

describe("computeNewSlotCandidates", () => {
  test("empty calendar -- today, tomorrow, and the day after are all legal candidates (unlike reschedule, today counts)", () => {
    const { computeNewSlotCandidates } = loadStudlinModule({ now: "2026-07-20T08:00:00" });
    const candidates = computeNewSlotCandidates([], [], DEFAULT_PREFS, "2026-07-20", "09:00", 30, null, 500);
    assert.equal(candidates.length, 3, "capped at NEW_PLACEMENT_MAX_CANDIDATES");
    assert.equal(candidates[0].date, "2026-07-20", "today itself is offered, not skipped");
    assert.equal(candidates[1].date, "2026-07-21");
    assert.equal(candidates[2].date, "2026-07-22");
    for (const c of candidates) {
      assert.equal(c.isEmpty, true);
      assert.equal(c.time, "09:00");
      assert.equal(c.reason, null, "no declared peak / no reliability history yet -- no reason claimed");
    }
  });

  test("respects the deadline bound -- never scans past it", () => {
    const { computeNewSlotCandidates } = loadStudlinModule({ now: "2026-07-20T08:00:00" });
    const candidates = computeNewSlotCandidates([], [], DEFAULT_PREFS, "2026-07-20", "09:00", 30, "2026-07-21", 500);
    assert.equal(candidates.length, 2, "only today and tomorrow fall on/before the deadline");
    assert.ok(candidates.every((c) => c.date <= "2026-07-21"));
  });

  test("a day that's fully booked contributes no candidate for itself -- it isn't duplicated on a later day's turn either", () => {
    const { computeNewSlotCandidates } = loadStudlinModule({ now: "2026-07-20T08:00:00" });
    const fullDay = busyBlock("2026-07-20", { duration: 540 }); // the whole 9-6 work window
    const candidates = computeNewSlotCandidates([fullDay], [], DEFAULT_PREFS, "2026-07-20", "09:00", 30, null, 500);
    assert.ok(!candidates.some((c) => c.date === "2026-07-20"), "the full day itself should never appear");
    assert.equal(candidates[0].date, "2026-07-21", "the very next open day takes its place, exactly once");
    const dates = candidates.map((c) => c.date);
    assert.equal(new Set(dates).size, dates.length, "no date repeated");
  });

  test("a partially-busy day still yields a real candidate at a later time on that same day, not skipped", () => {
    const { computeNewSlotCandidates } = loadStudlinModule({ now: "2026-07-20T08:00:00" });
    const partial = busyBlock("2026-07-20"); // 9:00-11:00 only, 6+ hours still open that day
    // Deadline caps the scan to just this one day, so it's the only
    // candidate that could possibly come back -- confirms this case
    // produces a real slot rather than being silently excluded the way a
    // FULLY booked day (previous test) is.
    const candidates = computeNewSlotCandidates([partial], [], DEFAULT_PREFS, "2026-07-20", "09:00", 30, "2026-07-20", 500);
    assert.equal(candidates.length, 1);
    assert.equal(candidates[0].date, "2026-07-20");
    assert.notEqual(candidates[0].time, "09:00", "9am is occupied by the existing block");
    assert.equal(candidates[0].isEmpty, false);
    assert.equal(candidates[0].rawBaseMins, 120);
  });

  test("ranks lightest day first, same tie-break convention as computeRescheduleCandidates", () => {
    const { computeNewSlotCandidates } = loadStudlinModule({ now: "2026-07-20T08:00:00" });
    // Day 0 and day 2 both carry existing load; day 1, 3, 4 are empty --
    // the three empty days should win the top 3 slots over the two busier
    // ones, in day order.
    const events = [busyBlock("2026-07-20"), busyBlock("2026-07-22")];
    const candidates = computeNewSlotCandidates(events, [], DEFAULT_PREFS, "2026-07-20", "09:00", 30, null, 500);
    assert.equal(candidates.length, 3);
    // Not assert.deepEqual against an array literal -- objects/arrays built
    // inside the sandboxed vm realm aren't deepEqual-identical to native
    // ones even with matching contents (same gotcha noted throughout this
    // test suite, e.g. slot-finders-characterization.test.js).
    assert.equal(candidates[0].date, "2026-07-21");
    assert.equal(candidates[1].date, "2026-07-23");
    assert.equal(candidates[2].date, "2026-07-24");
    assert.ok(candidates.every((c) => c.isEmpty));
  });

  test("a declared peak-hour bucket claims a real reason on every candidate day, same reliability engine every single-slot call site already trusts", () => {
    const { computeNewSlotCandidates } = loadStudlinModule({ now: "2026-07-20T08:00:00" });
    const prefsWithPeak = { ...DEFAULT_PREFS, peakHourBuckets: ["afternoon"] };
    const candidates = computeNewSlotCandidates([], [], prefsWithPeak, "2026-07-20", "09:00", 30, null, 500);
    assert.ok(candidates.length > 0);
    for (const c of candidates) {
      assert.equal(c.time, "15:00", "the declared afternoon peak anchor wins over the plain 9am desired time");
      assert.ok(c.reason && c.reason.type === "peak", "expected a declared-peak reason on every candidate, not just the first");
      assert.equal(c.reason.bucket, "afternoon");
    }
  });

  test("no legal slot at all before an already-passed deadline -- returns an empty list, not a fabricated candidate", () => {
    const { computeNewSlotCandidates } = loadStudlinModule({ now: "2026-07-20T08:00:00" });
    const candidates = computeNewSlotCandidates([], [], DEFAULT_PREFS, "2026-07-20", "09:00", 30, "2026-07-19", 500);
    assert.equal(candidates.length, 0);
  });

  test("weekPressure rides along on every candidate (same shape RescheduleModal's cards already read)", () => {
    const { computeNewSlotCandidates } = loadStudlinModule({ now: "2026-07-20T08:00:00" });
    const candidates = computeNewSlotCandidates([], [], DEFAULT_PREFS, "2026-07-20", "09:00", 30, null, 500);
    for (const c of candidates) {
      assert.ok(c.weekPressure && typeof c.weekPressure.isPressured === "boolean");
    }
  });
});

describe("startAttackBlockChain / startPhaseAwareAttackChain / buildAssignmentAttackBlockPair -- forcedSlot", () => {
  test("startAttackBlockChain uses the forced slot verbatim instead of computing its own", () => {
    const { startAttackBlockChain } = loadStudlinModule({ now: "2026-07-20T08:00:00" });
    const forcedSlot = { date: "2026-08-01", time: "16:00", reason: { type: "peak", bucket: "afternoon", tier: "hard" } };
    const task = startAttackBlockChain({ title: "Essay draft", probeMins: 30 }, [], [], DEFAULT_PREFS, "2026-07-20", "09:00", forcedSlot);
    assert.ok(task, "expected a real task");
    assert.equal(task.date, "2026-08-01");
    assert.equal(task.time, "16:00");
    assert.equal(task.placementReason.type, "peak");
  });

  test("omitting forcedSlot keeps the old single-shot behavior unchanged (every existing call site)", () => {
    const { startAttackBlockChain } = loadStudlinModule({ now: "2026-07-20T08:00:00" });
    const task = startAttackBlockChain({ title: "Essay draft", probeMins: 30 }, [], [], DEFAULT_PREFS, "2026-07-20", "09:00");
    assert.ok(task);
    assert.equal(task.date, "2026-07-20");
    assert.equal(task.time, "09:00");
  });

  test("buildAssignmentAttackBlockPair's chain task lands on the forced slot; the due-date marker is unaffected", () => {
    const { buildAssignmentAttackBlockPair } = loadStudlinModule({ now: "2026-07-20T08:00:00" });
    const forcedSlot = { date: "2026-07-25", time: "11:00", reason: null };
    const pair = buildAssignmentAttackBlockPair(
      "marker-1", { title: "Lab report", deadline: "2026-08-01" }, [], [], [], DEFAULT_PREFS, "2026-07-20", "09:00", false, forcedSlot
    );
    assert.ok(pair);
    assert.equal(pair.marker.id, "marker-1");
    assert.equal(pair.task.date, "2026-07-25");
    assert.equal(pair.task.time, "11:00");
    assert.equal(pair.task.dueEventId, "marker-1");
  });

  test("skipTask still short-circuits before forcedSlot is ever consulted (manual-placement path is untouched)", () => {
    const { buildAssignmentAttackBlockPair } = loadStudlinModule({ now: "2026-07-20T08:00:00" });
    const result = buildAssignmentAttackBlockPair(
      "marker-2", { title: "Lab report", deadline: "2026-08-01" }, [], [], [], DEFAULT_PREFS, "2026-07-20", "09:00", true, { date: "2026-07-25", time: "11:00" }
    );
    assert.equal(result.task, null);
    assert.equal(result.marker.id, "marker-2");
  });
});
