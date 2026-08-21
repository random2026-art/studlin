// Tests for the routine-duplicate-fragment repair (2026-08-20) --
// findFragmentedRoutineGroups/mergeFragmentedRoutineGroup/mergeDuplicateRoutines.
// Real reported bug: a routine edited before the groupId-preservation fix
// (commit 1c3eb76) shipped could split into several separate routine
// objects under different groupIds, each showing as its own "Morning
// Routine" row in the sidebar instead of one. The fix stops NEW
// fragmentation; these functions are the one-time repair for routines that
// were already split apart before it landed.
const { test, describe } = require("node:test");
const assert = require("node:assert/strict");
const { loadStudlinModule } = require("./harness.js");

function fragment(overrides) {
  return { id: "rt-1", title: "Morning Routine", kind: "busy", subject: "", startTime: "08:00", duration: 60, days: [0], groupId: "rt-1", ...overrides };
}

describe("findFragmentedRoutineGroups", () => {
  test("finds a real fragment cluster -- same title/kind/time, different groupIds, no overlapping days", () => {
    const { findFragmentedRoutineGroups } = loadStudlinModule();
    const routines = [
      fragment({ id: "rt-1", groupId: "rt-1", days: [0] }),
      fragment({ id: "rt-2", groupId: "rt-2", days: [1] }),
      fragment({ id: "rt-3", groupId: "rt-3", days: [2] }),
    ];
    const groups = findFragmentedRoutineGroups(routines);
    assert.equal(groups.length, 1);
    assert.equal(groups[0].length, 3);
  });

  test("a routine already sharing one real groupId (a legitimate multi-placement) is left alone", () => {
    const { findFragmentedRoutineGroups } = loadStudlinModule();
    const routines = [
      fragment({ id: "rt-1", groupId: "shared", days: [0] }),
      fragment({ id: "rt-2", groupId: "shared", days: [3] }),
    ];
    assert.equal(findFragmentedRoutineGroups(routines).length, 0);
  });

  test("a single routine (no duplicates at all) is never flagged", () => {
    const { findFragmentedRoutineGroups } = loadStudlinModule();
    assert.equal(findFragmentedRoutineGroups([fragment()]).length, 0);
  });

  test("two different activities that happen to share a title but differ in time are NOT merged", () => {
    const { findFragmentedRoutineGroups } = loadStudlinModule();
    const routines = [
      fragment({ id: "rt-1", groupId: "rt-1", startTime: "08:00", days: [0] }),
      fragment({ id: "rt-2", groupId: "rt-2", startTime: "20:00", days: [0] }),
    ];
    assert.equal(findFragmentedRoutineGroups(routines).length, 0, "different times are a real distinction, not a fragment split");
  });

  test("a different subject breaks the match too", () => {
    const { findFragmentedRoutineGroups } = loadStudlinModule();
    const routines = [
      fragment({ id: "rt-1", groupId: "rt-1", subject: "Chemistry", days: [0] }),
      fragment({ id: "rt-2", groupId: "rt-2", subject: "History", days: [1] }),
    ];
    assert.equal(findFragmentedRoutineGroups(routines).length, 0);
  });

  test("class routines are never touched -- legitimately distinct per-period meetings", () => {
    const { findFragmentedRoutineGroups } = loadStudlinModule();
    const routines = [
      fragment({ id: "rt-1", groupId: "rt-1", kind: "class", days: [0] }),
      fragment({ id: "rt-2", groupId: "rt-2", kind: "class", days: [1] }),
    ];
    assert.equal(findFragmentedRoutineGroups(routines).length, 0);
  });

  test("habit routines are never touched -- real per-day completion history may reference a specific fragment's id", () => {
    const { findFragmentedRoutineGroups } = loadStudlinModule();
    const routines = [
      fragment({ id: "rt-1", groupId: "rt-1", kind: "habit", days: [0] }),
      fragment({ id: "rt-2", groupId: "rt-2", kind: "habit", days: [1] }),
    ];
    assert.equal(findFragmentedRoutineGroups(routines).length, 0);
  });

  test("overlapping days between two same-signature fragments is left alone -- genuinely conflicting data, not a clean split", () => {
    const { findFragmentedRoutineGroups } = loadStudlinModule();
    const routines = [
      fragment({ id: "rt-1", groupId: "rt-1", days: [0, 1] }),
      fragment({ id: "rt-2", groupId: "rt-2", days: [1, 2] }),
    ];
    assert.equal(findFragmentedRoutineGroups(routines).length, 0);
  });

  test("an unscheduled (no days) routine is never treated as a fragment of anything", () => {
    const { findFragmentedRoutineGroups } = loadStudlinModule();
    const routines = [
      fragment({ id: "rt-1", groupId: "rt-1", days: [] }),
      fragment({ id: "rt-2", groupId: "rt-2", days: [] }),
    ];
    assert.equal(findFragmentedRoutineGroups(routines).length, 0);
  });

  test("multiple independent fragment clusters are each found separately", () => {
    const { findFragmentedRoutineGroups } = loadStudlinModule();
    const routines = [
      fragment({ id: "rt-1", groupId: "rt-1", title: "Morning Routine", days: [0] }),
      fragment({ id: "rt-2", groupId: "rt-2", title: "Morning Routine", days: [1] }),
      fragment({ id: "rt-3", groupId: "rt-3", title: "Workout", days: [0] }),
      fragment({ id: "rt-4", groupId: "rt-4", title: "Workout", days: [2] }),
    ];
    assert.equal(findFragmentedRoutineGroups(routines).length, 2);
  });
});

describe("mergeFragmentedRoutineGroup", () => {
  test("keeps the oldest (lexicographically smallest) id as the surviving one", () => {
    const { mergeFragmentedRoutineGroup } = loadStudlinModule();
    const merged = mergeFragmentedRoutineGroup([
      fragment({ id: "rt-300", groupId: "rt-300", days: [2] }),
      fragment({ id: "rt-100", groupId: "rt-100", days: [0] }),
      fragment({ id: "rt-200", groupId: "rt-200", days: [1] }),
    ]);
    assert.equal(merged.id, "rt-100");
    assert.equal(merged.groupId, "rt-100");
  });

  test("combines every fragment's days into one sorted, deduplicated array", () => {
    const { mergeFragmentedRoutineGroup } = loadStudlinModule();
    const merged = mergeFragmentedRoutineGroup([
      fragment({ id: "rt-1", days: [0] }),
      fragment({ id: "rt-2", days: [2] }),
      fragment({ id: "rt-3", days: [4] }),
    ]);
    assert.deepEqual([...merged.days].sort(), [0, 2, 4]);
  });

  test("preserves the shared title/kind/subject/time from the surviving fragment", () => {
    const { mergeFragmentedRoutineGroup } = loadStudlinModule();
    const merged = mergeFragmentedRoutineGroup([
      fragment({ id: "rt-1", title: "Morning Routine", startTime: "08:00", duration: 60, days: [0] }),
      fragment({ id: "rt-2", title: "Morning Routine", startTime: "08:00", duration: 60, days: [1] }),
    ]);
    assert.equal(merged.title, "Morning Routine");
    assert.equal(merged.startTime, "08:00");
    assert.equal(merged.duration, 60);
  });
});

describe("mergeDuplicateRoutines", () => {
  test("no-op with an empty or clean routine list", () => {
    const { mergeDuplicateRoutines } = loadStudlinModule();
    const result = mergeDuplicateRoutines([fragment({ id: "rt-1", groupId: "rt-1" })]);
    assert.equal(result.mergedCount, 0);
    assert.equal(result.routines.length, 1);
  });

  test("collapses a 3-way fragment cluster down to 1 routine, reports mergedCount: 1", () => {
    const { mergeDuplicateRoutines } = loadStudlinModule();
    const routines = [
      fragment({ id: "rt-1", groupId: "rt-1", days: [0] }),
      fragment({ id: "rt-2", groupId: "rt-2", days: [1] }),
      fragment({ id: "rt-3", groupId: "rt-3", days: [2] }),
    ];
    const result = mergeDuplicateRoutines(routines);
    assert.equal(result.mergedCount, 1);
    assert.equal(result.routines.length, 1);
    assert.deepEqual([...result.routines[0].days].sort(), [0, 1, 2]);
  });

  test("leaves unrelated, non-fragmented routines completely untouched", () => {
    const { mergeDuplicateRoutines } = loadStudlinModule();
    const routines = [
      fragment({ id: "rt-1", groupId: "rt-1", title: "Morning Routine", days: [0] }),
      fragment({ id: "rt-2", groupId: "rt-2", title: "Morning Routine", days: [1] }),
      fragment({ id: "rt-9", groupId: "rt-9", title: "Dinner", days: [0, 1, 2, 3, 4] }),
    ];
    const result = mergeDuplicateRoutines(routines);
    assert.equal(result.mergedCount, 1);
    assert.equal(result.routines.length, 2, "the merged Morning Routine + the untouched Dinner");
    assert.ok(result.routines.some(r => r.id === "rt-9" && r.title === "Dinner"));
  });

  test("real-world reproduction: 5 identical Mon-Fri 8-9am fragments collapse into one Mon-Fri routine", () => {
    const { mergeDuplicateRoutines } = loadStudlinModule();
    const routines = [0, 1, 2, 3, 4].map(d => fragment({ id: "rt-" + d, groupId: "rt-" + d, days: [d] }));
    const result = mergeDuplicateRoutines(routines);
    assert.equal(result.mergedCount, 1);
    assert.equal(result.routines.length, 1);
    assert.deepEqual([...result.routines[0].days].sort(), [0, 1, 2, 3, 4]);
  });
});
