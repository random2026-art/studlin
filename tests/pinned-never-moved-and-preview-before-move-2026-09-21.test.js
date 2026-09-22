// User report, 2026-09-21: a friend had assignments PINNED (the calendar
// literally says "📌 Pinned. Studlin won't move this automatically.") and
// Studlin moved them anyway. Two real leaks, both fixed here:
//   1. findSlotWithEviction's candidate filter had no userPinned check, so a
//      pinned study block on a busy day could be bumped a day to make room
//      for something else (Tier 0 reflow, Catch Me Up, and new-task
//      placement all call it).
//   2. reconcileRoutineConflicts (runs on every app open + every routine
//      edit) only excluded fixed KINDS, never pinned items, so a pinned task
//      overlapping a class/work block was silently relocated.
// Second half of the same request: an unpinned missed task must never move
// until the student sees it and accepts. A single missed item used to be
// relocated silently by Tier 0's own commit loop (the preview only existed
// from 2+ items); now any missed item goes through the Catch Me Up preview.
// Run with `npm test`.
const { test, describe } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");
const { loadStudlinModule } = require("./harness.js");

const SOURCE = fs.readFileSync(path.join(__dirname, "..", "studlin-app.jsx"), "utf8");

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

function hhmm(mins) {
  return `${String(Math.floor(mins / 60)).padStart(2, "0")}:${String(mins % 60).padStart(2, "0")}`;
}

// Same packing the existing eviction tests use: wall-to-wall 30-min study
// blocks from work start through the same-day catch-up window, so an
// imminent task genuinely has nowhere to go without evicting something.
// `firstOverrides` decorates the very first block (the lowest-priority one,
// i.e. the obvious first eviction candidate).
function packedDay(date, firstOverrides) {
  const packed = [];
  let t = 9 * 60;
  let idx = 0;
  while (t + 30 <= 20 * 60) {
    const base = { id: "pack-" + idx, title: "Filler " + idx, date, time: hhmm(t), kind: "study block", duration: 30, status: "pending", deadline: null, priority: 500 };
    packed.push(idx === 0 ? { ...base, id: "target", title: "Assignment session", priority: 10, ...firstOverrides } : base);
    t += 30; idx++;
  }
  return packed;
}

describe("findSlotWithEviction never evicts a pinned task", () => {
  test("control: the same lowest-priority block IS evicted when it is not pinned (proves the test below is meaningful)", () => {
    const m = loadStudlinModule();
    const today = m.dayKey();
    const result = m.findSlotWithEviction(packedDay(today, {}), [], DEFAULT_PREFS, today, "09:00", 30, today);
    const evictedIds = result.events.filter((e) => e.movedByStudlin).map((e) => e.id);
    assert.ok(evictedIds.includes("target"), "the lowest-priority unpinned block is the obvious first eviction candidate");
  });

  test("a pinned block is never evicted, even as the obvious lowest-priority candidate", () => {
    const m = loadStudlinModule();
    const today = m.dayKey();
    const result = m.findSlotWithEviction(packedDay(today, { userPinned: true }), [], DEFAULT_PREFS, today, "09:00", 30, today);
    const target = result.events.find((e) => e.id === "target");
    assert.equal(target.time, "09:00", "a pinned task keeps the exact time the student put it at");
    assert.equal(target.date, today);
    assert.ok(!target.movedByStudlin, "and is never stamped as moved");
  });

  test("a pinned assignment session with a far-out deadline (the shape a student's typed-in assignment time takes) is also safe", () => {
    const m = loadStudlinModule();
    const today = m.dayKey();
    const farDeadline = m.dayKey(new Date(Date.now() + 20 * 86400000));
    const result = m.findSlotWithEviction(
      packedDay(today, { userPinned: true, isAssignment: true, deadline: farDeadline }),
      [], DEFAULT_PREFS, today, "09:00", 30, today
    );
    const target = result.events.find((e) => e.id === "target");
    assert.equal(target.time, "09:00");
    assert.ok(!target.movedByStudlin);
  });
});

describe("Catch Me Up never moves a pinned task", () => {
  test("a pinned overdue block is not in the missed set, so no plan can ever propose moving it", () => {
    const { computeCatchUpPlan } = loadStudlinModule({ now: "2026-07-20T08:00:00" });
    const pinned = { id: "p1", title: "Essay draft", date: "2026-07-19", time: "10:00", kind: "study block", duration: 60, status: "pending", deadline: "2026-07-25", userPinned: true, isAssignment: true };
    const plan = computeCatchUpPlan([pinned], [], DEFAULT_PREFS, "2026-07-20");
    assert.equal(plan.moves.length, 0);
    assert.equal(plan.unplaceable.length, 0);
  });

  test("a pinned block sitting on a packed day is not bumped to make room for a missed unpinned one", () => {
    const m = loadStudlinModule({ now: "2026-07-20T08:00:00" });
    const today = "2026-07-20";
    const packed = packedDay(today, { userPinned: true, deadline: "2026-08-30" });
    const missed = { id: "missed-1", title: "Missed reading", date: "2026-07-19", time: "10:00", kind: "study block", duration: 30, status: "pending", deadline: today, priority: 900 };
    const plan = m.computeCatchUpPlan(packed.concat([missed]), [], DEFAULT_PREFS, today);
    // Whatever the plan does with the missed block, no move may name the pinned one.
    assert.ok(!plan.moves.some((mv) => mv.id === "target"), "the pinned block must never appear as a proposed move");
  });
});

describe("computeCatchUpPlan keeps Tier 0's exam-already-passed guard (single missed items now route through it)", () => {
  const today = "2026-07-17";
  const tomorrow = "2026-07-18";
  const examMarker = { id: "exam-1", title: "Chem Exam", date: today, time: "09:00", kind: "exam", status: "pending", duration: 45 };
  const session = { id: "session-1", title: "Chem review", date: "2026-07-16", time: "16:00", kind: "study block", duration: 45, status: "pending", deadline: today, dueEventId: "exam-1" };

  test("with the current time passed in, a review for an exam that already happened today is proposed for tomorrow, not later today", () => {
    const m = loadStudlinModule({ now: "2026-07-17T10:00:00" });
    const plan = m.computeCatchUpPlan([examMarker, session], [], DEFAULT_PREFS, today, null, 600);
    const move = plan.moves.find((mv) => mv.id === "session-1");
    assert.ok(move, "should still find a legitimate placement, just not today");
    assert.ok(move.to.date >= tomorrow, "must not land on the exam's own date once its time has passed, got " + move.to.date);
    assert.equal(move.deadline, today, "the recorded move keeps the stored event's real deadline, not the extended search one");
  });

  test("without nowMins nothing changes for existing callers (the guard is opt-in, so older call sites stay deterministic)", () => {
    const m = loadStudlinModule({ now: "2026-07-17T08:00:00" });
    const plan = m.computeCatchUpPlan([examMarker, session], [], DEFAULT_PREFS, today);
    assert.equal(plan.moves.length + plan.unplaceable.length, 1);
  });
});

describe("source guards for the component-closure code", () => {
  // 2026-09-22: reconcileRoutineConflicts no longer relocates anything
  // itself -- it computes a plan via the pure computeRoutineConflictPlan
  // and offers it (see pinned-never-moved-and-preview-before-move's sibling
  // 2026-09-22 file for the full preview-before-move coverage). The pin
  // check now lives in that pure function.
  test("computeRoutineConflictPlan skips pinned tasks before it ever searches for a new slot", () => {
    const start = SOURCE.indexOf("function computeRoutineConflictPlan(");
    assert.notEqual(start, -1);
    const body = SOURCE.slice(start, start + 1500);
    const pinIdx = body.indexOf("if(ev.userPinned)return;");
    const searchIdx = body.indexOf("findLegalSlotOrNull(");
    assert.notEqual(pinIdx, -1, "a pinned task must be left alone");
    assert.ok(searchIdx === -1 || pinIdx < searchIdx, "the pin check has to come before any relocation search");
  });

  test("the daily effect no longer commits any missed-task move on its own", () => {
    const start = SOURCE.indexOf('const lastDay=lsGet("lastLoginDay","");');
    const end = SOURCE.indexOf("const dismissCatchUpBanner=()=>{");
    assert.ok(start !== -1 && end > start);
    const body = SOURCE.slice(start, end);
    assert.doesNotMatch(body, /findTier0Slot\(/, "no silent Tier 0 placement in the daily effect");
    assert.doesNotMatch(body, /movedByStudlin/, "nothing in the daily effect may stamp a task as moved");
    assert.doesNotMatch(body, /tier0Enabled/, "the silent-commit kill switch went away with the loop it guarded");
  });

  test("the banner is offered for a single missed item, and the threshold constant says so", () => {
    assert.match(SOURCE, /const CATCHUP_BANNER_THRESHOLD=1;/);
    assert.match(SOURCE, /const catchUpOffered=missedItems\.length>=CATCHUP_BANNER_THRESHOLD;/);
    assert.match(SOURCE, /if\(catchUpOffered&&lsGet\("catchUpBannerDismissedDate",null\)!==today\)\{/);
  });

  test("the rough-week threshold (nudge gating, Dashboard overrun card) is untouched", () => {
    assert.match(SOURCE, /const CATCHUP_RECOVERY_THRESHOLD=2;/);
  });

  test("openCatchUpPreview hands the plan the real current time so the exam-passed guard is live", () => {
    const start = SOURCE.indexOf("const openCatchUpPreview=()=>{");
    const body = SOURCE.slice(start, start + 900);
    assert.match(body, /computeCatchUpPlan\(events,routines,prefs,dayKey\(\),null,now\.getHours\(\)\*60\+now\.getMinutes\(\)\)/);
  });

  test("a single-item preview opens with its Move it myself / Skip / Not this week controls already expanded", () => {
    const start = SOURCE.indexOf("const openCatchUpPreview=()=>{");
    const body = SOURCE.slice(start, start + 1400);
    assert.match(body, /setCatchUpExpandedId\(plan\.moves\.length===1\?plan\.moves\[0\]\.id:null\)/);
  });

  test("the preview still says nothing changes until accepted, and a single item reads 'Move it' with a way out", () => {
    const start = SOURCE.indexOf('<Modal open={catchUpPreviewOpen}');
    const body = SOURCE.slice(start, start + 1300);
    assert.match(body, /Nothing changes until you accept\./);
    assert.match(body, /"Move it"/);
    assert.match(body, /"Not now"/);
  });
});
