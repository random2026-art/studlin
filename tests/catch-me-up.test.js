// Tests for the Catch Me Up engine: computeCatchUpMissedItems,
// computeCatchUpPlan, catchUpReasonFor, compressExamPrepForRoom.
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

function studyBlock(overrides) {
  return {
    id: "study-1", title: "Study chem", date: "2026-07-19", time: "10:00",
    subject: "Chemistry", kind: "study block", notes: "", priority: 5, difficulty: 5,
    deadline: null, duration: 30, status: "pending", timeSpent: 0,
    completedAt: null, ...overrides,
  };
}

function classEvent(overrides) {
  return {
    id: "class-1", title: "Bio lecture", date: "2026-07-20", time: "10:00",
    subject: "Biology", kind: "class", notes: "", priority: null, difficulty: null,
    deadline: null, duration: 60, status: "pending", timeSpent: 0,
    completedAt: null, ...overrides,
  };
}

function examEvent(overrides) {
  return {
    id: "exam-1", title: "Quiz 5", date: "2026-07-23", time: "09:00",
    subject: "Chemistry", kind: "exam", notes: "", priority: null, difficulty: null,
    deadline: null, duration: 45, status: "pending", timeSpent: 0,
    completedAt: null, ...overrides,
  };
}

describe("computeCatchUpMissedItems", () => {
  test("includes a plain overdue study block", () => {
    const { computeCatchUpMissedItems } = loadStudlinModule();
    const missed = computeCatchUpMissedItems([studyBlock()], "2026-07-20");
    assert.equal(missed.length, 1);
  });

  test("excludes fixed items (class/exam/reminder/busy block)", () => {
    const { computeCatchUpMissedItems } = loadStudlinModule();
    const overdueClass = classEvent({ date: "2026-07-19" });
    const missed = computeCatchUpMissedItems([overdueClass], "2026-07-20");
    assert.equal(missed.length, 0, "a fixed-kind item must never be offered for rebuild, same predicate Tier 0 already uses");
  });

  test("excludes truly userPinned items", () => {
    const { computeCatchUpMissedItems } = loadStudlinModule();
    const pinned = studyBlock({ userPinned: true });
    const missed = computeCatchUpMissedItems([pinned], "2026-07-20");
    assert.equal(missed.length, 0);
  });

  test("includes an auto-generated exam-prep session (the userPinned fix from Part 1.1)", () => {
    const { computeCatchUpMissedItems } = loadStudlinModule();
    const session = studyBlock({ isExamPrepSession: true, dueEventId: "exam-1" });
    const missed = computeCatchUpMissedItems([session], "2026-07-20");
    assert.equal(missed.length, 1, "an exam-prep session must be relocatable, not silently pinned");
  });

  test("excludes items not yet overdue (date >= today)", () => {
    const { computeCatchUpMissedItems } = loadStudlinModule();
    const notYetDue = studyBlock({ date: "2026-07-20" });
    const missed = computeCatchUpMissedItems([notYetDue], "2026-07-20");
    assert.equal(missed.length, 0);
  });

  test("excludes checklist items", () => {
    const { computeCatchUpMissedItems } = loadStudlinModule();
    const checklistItem = studyBlock({ checklist: true });
    const missed = computeCatchUpMissedItems([checklistItem], "2026-07-20");
    assert.equal(missed.length, 0);
  });
});

describe("computeCatchUpPlan", () => {
  test("places a single missed item and gives it a real reason", () => {
    const { computeCatchUpPlan } = loadStudlinModule({ now: "2026-07-20T08:00:00" });
    const missed = studyBlock({ id: "missed-1", date: "2026-07-19", deadline: "2026-07-22" });
    const plan = computeCatchUpPlan([missed], [], DEFAULT_PREFS, "2026-07-20");
    assert.equal(plan.moves.length, 1);
    assert.equal(plan.unplaceable.length, 0);
    assert.equal(plan.moves[0].id, "missed-1");
    assert.notEqual(plan.moves[0].from.date, plan.moves[0].to.date, "an overdue item must actually move forward, not stay on its missed date");
  });

  test("an exam-prep session close to its exam gets an intervalPreserve reason naming the exam", () => {
    const { computeCatchUpPlan } = loadStudlinModule({ now: "2026-07-20T08:00:00" });
    const exam = examEvent({ id: "exam-1", date: "2026-07-23" });
    const session = studyBlock({ id: "session-1", date: "2026-07-19", isExamPrepSession: true, dueEventId: "exam-1", deadline: "2026-07-23" });
    const plan = computeCatchUpPlan([exam, session], [], DEFAULT_PREFS, "2026-07-20");
    const move = plan.moves.find((m) => m.id === "session-1");
    assert.ok(move, "expected the session to be placed");
    assert.ok(move.reason && move.reason.type === "intervalPreserve", "exam is only 3 days out -- expected an urgency-framed reason");
    assert.equal(move.reason.examTitle, "Quiz 5");
  });

  test("an exam-prep session far from its exam gets an examSlack reason", () => {
    const { computeCatchUpPlan } = loadStudlinModule({ now: "2026-07-20T08:00:00" });
    const exam = examEvent({ id: "exam-1", date: "2026-08-15" });
    const session = studyBlock({ id: "session-1", date: "2026-07-19", isExamPrepSession: true, dueEventId: "exam-1", deadline: "2026-08-15" });
    const plan = computeCatchUpPlan([exam, session], [], DEFAULT_PREFS, "2026-07-20");
    const move = plan.moves.find((m) => m.id === "session-1");
    assert.ok(move, "expected the session to be placed");
    assert.ok(move.reason && move.reason.type === "examSlack", "exam is nearly a month out -- expected a can-wait reason, not urgency framing");
  });

  test("a plain overdue item with a deadline gets a deadlineDriven reason when its day wasn't full", () => {
    const { computeCatchUpPlan } = loadStudlinModule({ now: "2026-07-20T08:00:00" });
    const missed = studyBlock({ id: "missed-1", date: "2026-07-19", deadline: "2026-07-24" });
    const plan = computeCatchUpPlan([missed], [], DEFAULT_PREFS, "2026-07-20");
    const move = plan.moves[0];
    assert.ok(move.reason && move.reason.type === "deadlineDriven");
  });

  test("never proposes a slot on or after the linked exam's own date", () => {
    const { computeCatchUpPlan } = loadStudlinModule({ now: "2026-07-20T08:00:00" });
    const exam = examEvent({ id: "exam-1", date: "2026-07-21" });
    const session = studyBlock({ id: "session-1", date: "2026-07-19", isExamPrepSession: true, dueEventId: "exam-1", deadline: "2026-07-21" });
    const plan = computeCatchUpPlan([exam, session], [], DEFAULT_PREFS, "2026-07-20");
    const move = plan.moves.find((m) => m.id === "session-1");
    if (move) assert.ok(move.to.date < "2026-07-21", "a prep session must never land on/after its own exam");
  });
});

describe("compressExamPrepForRoom", () => {
  test("drops the sibling farthest from the exam first (compress count before length)", () => {
    const { compressExamPrepForRoom, findLegalSlotOrNull } = loadStudlinModule({ now: "2026-07-20T08:00:00" });
    const exam = examEvent({ id: "exam-1", date: "2026-07-25" });
    // Two sibling sessions already placed, one on 7/21 (closer to exam) and
    // one on 7/20 (farther from exam) -- both real, both still pending.
    const farSibling = studyBlock({ id: "far", date: "2026-07-20", time: "09:00", duration: 480, isExamPrepSession: true, dueEventId: "exam-1" });
    const closeSibling = studyBlock({ id: "close", date: "2026-07-21", time: "09:00", duration: 30, isExamPrepSession: true, dueEventId: "exam-1" });
    const stuck = studyBlock({ id: "stuck", date: "2026-07-19", time: "09:00", duration: 30, isExamPrepSession: true, dueEventId: "exam-1", deadline: "2026-07-25" });
    const working = [exam, farSibling, closeSibling, stuck];
    const result = compressExamPrepForRoom(stuck, working, [], DEFAULT_PREFS, "2026-07-20", null);
    assert.ok(result, "expected compression to find room by dropping a sibling");
    assert.equal(result.droppedId, "far", "the farther-from-exam sibling should be dropped, not the closer one");
    assert.equal(result.shortenedId, null);
  });

  test("returns null (no compression possible) when there are no siblings to compress", () => {
    const { compressExamPrepForRoom } = loadStudlinModule({ now: "2026-07-20T08:00:00" });
    const exam = examEvent({ id: "exam-1", date: "2026-07-25" });
    const stuck = studyBlock({ id: "stuck", date: "2026-07-19", isExamPrepSession: true, dueEventId: "exam-1", deadline: "2026-07-25" });
    const result = compressExamPrepForRoom(stuck, [exam, stuck], [], DEFAULT_PREFS, "2026-07-20", null);
    assert.equal(result, null);
  });

  test("never engages for a non-exam-prep item", () => {
    const { compressExamPrepForRoom } = loadStudlinModule({ now: "2026-07-20T08:00:00" });
    const plain = studyBlock({ id: "plain-1" });
    const result = compressExamPrepForRoom(plain, [plain], [], DEFAULT_PREFS, "2026-07-20", null);
    assert.equal(result, null);
  });
});

describe("logCatchUpEvent", () => {
  test("is a safe no-op when posthog isn't loaded (ad blockers, offline) -- never throws", () => {
    const { logCatchUpEvent } = loadStudlinModule();
    assert.doesNotThrow(() => logCatchUpEvent("rebuild_confirmed", { moveCount: 3 }));
  });
});

describe("computeCatchUpPlan never hits findFixedEventSlot's midnight-scan fallback", () => {
  // findFixedEventSlot's fallback (see slot-finders-characterization.test.js)
  // scans from midnight and can return an absurd time like 00:00 -- real
  // concern for a rebuild preview, since a proposed 3am study session would
  // look broken and kill trust in the feature. Confirmed by code reading
  // that computeCatchUpPlan's call graph (findTier0Slot -> findSlotWithEviction
  // -> findLegalSlotOrNull -> findOpenSlotFor, plus its own direct
  // findLegalSlotOrNull/compressExamPrepForRoom fallbacks) never calls
  // findFixedEventSlot at all -- that function has exactly one caller
  // anywhere in the file (computePausePlan's move_event, an unrelated
  // "Studlin Reschedule" flow for relocating a single fixed event by
  // explicit request). This test backs that reading with a real run: pack
  // every day solid for three weeks with no deadline forcing a give-up, and
  // confirm the engine never proposes a pre-dawn time -- either it finds a
  // legal daytime slot, or (more likely here) gives up and reports the item
  // unplaceable rather than fabricating a bad one.
  test("a fully-booked 3-week window with no deadline never proposes an off-hours time", () => {
    const { computeCatchUpPlan } = loadStudlinModule({ now: "2026-07-20T08:00:00" });
    const blockers = [];
    for (let i = 0; i < 25; i++) {
      const d = new Date("2026-07-20T12:00:00");
      d.setDate(d.getDate() + i);
      const dk = d.toISOString().slice(0, 10);
      blockers.push(studyBlock({ id: "blocker-" + i, date: dk, time: "00:00", duration: 1440 }));
    }
    const missed = studyBlock({ id: "missed-1", date: "2026-07-19", time: "10:00", duration: 30 });
    const plan = computeCatchUpPlan([...blockers, missed], [], DEFAULT_PREFS, "2026-07-20");
    const move = plan.moves.find((m) => m.id === "missed-1");
    if (move) {
      const mins = +move.to.time.split(":")[0] * 60 + +move.to.time.split(":")[1];
      const workStartMins = 9 * 60;
      assert.ok(mins >= workStartMins, "must never propose a pre-work-hours time like the midnight fallback would (" + move.to.time + ")");
    } else {
      assert.ok(plan.unplaceable.some((u) => u.id === "missed-1"), "expected the item to be reported unplaceable rather than given a bad slot");
    }
  });
});
