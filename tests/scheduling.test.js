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

describe("chunkTasksWithBreaks (Today's Plan chunking, regression: was dead code -- isFlexible was read but never set anywhere)", () => {
  test("a >90min task splits into 45-min chunks + 15-min breaks anchored at its own committed time", () => {
    const { chunkTasksWithBreaks } = loadStudlinModule();
    const task = realTask({ id: "long-1", time: "10:00", duration: 120 });
    const rows = chunkTasksWithBreaks([task]);
    const chunks = rows.filter((r) => r.isChunk);
    const breaks = rows.filter((r) => r.isBreak);
    assert.equal(chunks.length, 3);
    assert.equal(breaks.length, 2);
    assert.equal(chunks[0].time, "10:00");
    assert.equal(chunks[0].duration, 45);
    assert.equal(breaks[0].time, "10:45");
    assert.equal(chunks[1].time, "11:00");
    assert.equal(chunks[1].duration, 45);
    assert.equal(breaks[1].time, "11:45");
    assert.equal(chunks[2].time, "12:00");
    assert.equal(chunks[2].duration, 30);
  });

  test("only the first chunk keeps the real event id -- later chunks/breaks never point at a real events[] entry", () => {
    const { chunkTasksWithBreaks } = loadStudlinModule();
    const task = realTask({ id: "long-1", time: "10:00", duration: 120 });
    const rows = chunkTasksWithBreaks([task]);
    const chunks = rows.filter((r) => r.isChunk);
    assert.equal(chunks[0].id, "long-1");
    assert.notEqual(chunks[1].id, "long-1");
    assert.notEqual(chunks[2].id, "long-1");
  });

  test("every chunk carries the real session's full duration separately from its own slice (regression: Reschedule must search for room for the whole session, not just one 45-min piece)", () => {
    const { chunkTasksWithBreaks } = loadStudlinModule();
    const task = realTask({ id: "long-1", time: "10:00", duration: 120 });
    const rows = chunkTasksWithBreaks([task]);
    const chunks = rows.filter((r) => r.isChunk);
    assert.equal(chunks[0].duration, 45, "the chunk's own slice length");
    assert.equal(chunks[0].fullDuration, 120, "the real session's total length, for Reschedule");
  });

  test("a task with no anchor time is left unchunked -- there's nothing to anchor sub-times to", () => {
    const { chunkTasksWithBreaks } = loadStudlinModule();
    const task = realTask({ id: "no-time", time: "", duration: 120 });
    const rows = chunkTasksWithBreaks([task]);
    assert.equal(rows.length, 1);
    assert.equal(rows[0].id, "no-time");
  });

  test("a <=90min task is left as a single row", () => {
    const { chunkTasksWithBreaks } = loadStudlinModule();
    const task = realTask({ id: "short-1", time: "10:00", duration: 90 });
    const rows = chunkTasksWithBreaks([task]);
    assert.equal(rows.length, 1);
    assert.equal(rows[0].id, "short-1");
  });
});

describe("advancedSchedulePlanner / todaysPlan (Today's Plan, regression: isFlexible was dead code)", () => {
  test("a real >90min study block's chunks stay anchored at its own committed time -- Today's Plan can never disagree with Calendar", () => {
    const { advancedSchedulePlanner } = loadStudlinModule({ now: "2026-07-20T08:00:00" });
    const block = realTask({ id: "real-block", time: "14:00", duration: 120 });
    const plan = advancedSchedulePlanner([block]);
    const primary = plan.find((t) => t.id === "real-block");
    assert.ok(primary, "the primary (first-chunk) row should keep the real event id");
    assert.equal(primary.time, "14:00", "a real committed time must never be re-derived");
    const continuation = plan.filter((t) => t.parentId === "real-block" && t.id !== "real-block");
    assert.ok(continuation.length > 0, "a >90min block should still get chunked for display");
  });

  test("a fixed-kind block (busy block/class/exam/reminder) is never chunked even if long", () => {
    const { advancedSchedulePlanner } = loadStudlinModule({ now: "2026-07-20T08:00:00" });
    const busy = realTask({ id: "busy-1", kind: "busy block", time: "09:00", duration: 180 });
    const plan = advancedSchedulePlanner([busy]);
    assert.equal(plan.length, 1);
    assert.equal(plan[0].id, "busy-1");
    assert.equal(plan[0].time, "09:00");
    assert.equal(plan[0].duration, 180);
  });

  test("a userPinned study block is treated as fixed -- never chunked or reordered", () => {
    const { advancedSchedulePlanner } = loadStudlinModule({ now: "2026-07-20T08:00:00" });
    const pinned = realTask({ id: "pinned-1", time: "13:00", duration: 150, userPinned: true });
    const plan = advancedSchedulePlanner([pinned]);
    assert.equal(plan.length, 1);
    assert.equal(plan[0].id, "pinned-1");
    assert.equal(plan[0].time, "13:00");
  });

  test("a done study block is never chunked", () => {
    const { advancedSchedulePlanner } = loadStudlinModule({ now: "2026-07-20T08:00:00" });
    const done = realTask({ id: "done-1", time: "13:00", duration: 150, status: "done" });
    const plan = advancedSchedulePlanner([done]);
    assert.equal(plan.length, 1);
    assert.equal(plan[0].done, true);
  });

  test("when two timeless due-today items compete for one slot, the higher-priority one gets placed", () => {
    const { advancedSchedulePlanner, setSchedulePreferences } = loadStudlinModule({ now: "2026-07-20T08:00:00" });
    setSchedulePreferences({ ...DEFAULT_PREFS, workStartTime: "10:00", workEndTime: "14:00" });
    const highPri = dueDateMarker({ id: "high-pri", time: "", kind: "study block", duration: 200, priority: 900 });
    const lowPri = dueDateMarker({ id: "low-pri", time: "", kind: "study block", duration: 200, priority: 100 });
    const plan = advancedSchedulePlanner([highPri, lowPri]);
    const placedHigh = plan.find((t) => t.id === "high-pri" || t.parentId === "high-pri");
    const placedLow = plan.find((t) => t.id === "low-pri" || t.parentId === "low-pri");
    assert.ok(placedHigh && placedHigh.time, "the higher-priority item should win the only slot that fits");
    assert.ok(!placedLow || !placedLow.time, "the lower-priority item should be left unplaced, not silently overlapped");
  });

  test("the returned plan is sorted by actual start time regardless of hard/flexible origin", () => {
    const { advancedSchedulePlanner } = loadStudlinModule({ now: "2026-07-20T08:00:00" });
    const lateFixed = realTask({ id: "late-fixed", kind: "busy block", time: "16:00", duration: 30 });
    const earlyFlexible = realTask({ id: "early-flex", time: "09:30", duration: 30 });
    const plan = advancedSchedulePlanner([lateFixed, earlyFlexible]);
    const times = plan.filter((t) => t.time).map((t) => t.time);
    // Arrays built inside the sandboxed vm context aren't deepEqual-identical
    // to native-realm arrays even with matching contents (see the identical
    // note on computeReviewOffsets' tests above) -- comparing pairwise via
    // .length/indexing sidesteps that entirely.
    for (let i = 1; i < times.length; i++) {
      assert.ok(times[i - 1] <= times[i], `expected ${times[i - 1]} to sort before ${times[i]}`);
    }
    assert.equal(plan[0].id, "early-flex");
  });
});

describe("finalizeExtractedText (study-material size cap + empty-file detection)", () => {
  test("text under the cap passes through untouched", () => {
    const { finalizeExtractedText } = loadStudlinModule();
    const result = finalizeExtractedText("a normal amount of lecture notes");
    assert.equal(result.text, "a normal amount of lecture notes");
    assert.equal(result.truncated, false);
    assert.equal(result.empty, false);
  });

  test("text over the cap is trimmed and flagged, regression: an unbounded upload must never reach the AI prompt whole", () => {
    const { finalizeExtractedText, MATERIAL_TEXT_CAP } = loadStudlinModule();
    const huge = "x".repeat(MATERIAL_TEXT_CAP + 5000);
    const result = finalizeExtractedText(huge);
    assert.equal(result.text.length, MATERIAL_TEXT_CAP);
    assert.equal(result.truncated, true);
  });

  test("a blank or near-blank extraction (e.g. a scanned image-only PDF) is flagged empty", () => {
    const { finalizeExtractedText } = loadStudlinModule();
    assert.equal(finalizeExtractedText("").empty, true);
    assert.equal(finalizeExtractedText("   \n\n  ").empty, true);
    assert.equal(finalizeExtractedText("short").empty, true);
    assert.equal(finalizeExtractedText("this is definitely long enough to count as real content").empty, false);
  });
});

describe("buildSyllabusEventBatch / commitSyllabusEvents (Class Setup Wizard's event builder)", () => {
  function syllabusItem(overrides) {
    return {
      title: "Problem Set 3", date: "2026-08-05", kind: "deadline", include: true,
      attackBlock: true, proposeSessions: false, noDate: false, detail: "",
      estimatedHours: 3, difficulty: 500, ...overrides,
    };
  }

  test("a normal deadline item gets a marker and an Attack Block chain on an empty calendar", () => {
    const { buildSyllabusEventBatch, getWeeklyRoutine, getSchedulePreferences } = loadStudlinModule({ now: "2026-07-20T09:00:00" });
    const { markerEvents, attackEvents } = buildSyllabusEventBatch([], "wiz-1", "Chemistry", [syllabusItem()], null, getWeeklyRoutine(), getSchedulePreferences());
    assert.equal(markerEvents.length, 1);
    assert.equal(markerEvents[0].kind, "deadline");
    assert.ok(attackEvents.length > 0, "an Attack Block chain should have been scheduled");
  });

  test("regression: a fully-packed calendar must not throw or double-book when no legal Attack Block slot exists", () => {
    const { buildSyllabusEventBatch, getWeeklyRoutine, getSchedulePreferences } = loadStudlinModule({ now: "2026-07-20T09:00:00" });
    let existing = [];
    for (let d = 0; d < 25; d++) {
      const dt = new Date(); dt.setDate(dt.getDate() + d);
      const dk = dt.toISOString().slice(0, 10);
      for (let m = 0; m < 1440; m += 30) {
        const hh = String(Math.floor(m / 60)).padStart(2, "0"), mm = String(m % 60).padStart(2, "0");
        existing.push({ id: "pk-" + dk + "-" + m, date: dk, time: hh + ":" + mm, duration: 30, kind: "busy block", status: "pending" });
      }
    }
    let result;
    try {
      result = buildSyllabusEventBatch(existing, "wiz-2", "Chemistry", [syllabusItem({ date: "2026-08-20" })], null, getWeeklyRoutine(), getSchedulePreferences());
    } catch (e) {
      assert.fail("threw: " + e.message);
    }
    assert.equal(result.markerEvents.length, 1, "the due-date fact itself must still exist");
    assert.equal(result.attackEvents.length, 0, "no legal slot existed, so no session should have been fabricated");
  });

  test("an exam item's own materialFiles/materialLinks merge with the class-level sourceMaterial fallback as one combined list", () => {
    const { buildSyllabusEventBatch, getWeeklyRoutine, getSchedulePreferences } = loadStudlinModule({ now: "2026-07-20T09:00:00" });
    const examItem = syllabusItem({
      kind: "exam", proposeSessions: false,
      materialFiles: [{ name: "notes.pdf", text: "my own pasted notes" }],
      materialLinks: [{ label: "Flashcards", url: "https://example.com/notes" }, { label: "", url: "https://example.com/slides" }],
    });
    const { markerEvents } = buildSyllabusEventBatch([], "wiz-3", "Chemistry", [examItem], "whole syllabus raw text", getWeeklyRoutine(), getSchedulePreferences());
    assert.equal(markerEvents[0].sourceMaterials.length, 2, "the whole-syllabus text plus the one explicit file");
    assert.equal(markerEvents[0].sourceMaterials[0].name, "From your syllabus");
    assert.equal(markerEvents[0].sourceMaterials[1].name, "notes.pdf");
    assert.equal(markerEvents[0].referenceLinks.length, 2);
    assert.equal(markerEvents[0].referenceLinks[0].label, "Flashcards");
    assert.equal(markerEvents[0].referenceLinks[0].url, "https://example.com/notes");
    assert.equal(markerEvents[0].referenceLinks[1].url, "https://example.com/slides");
  });

  test("an exam with no explicit material still gets the class-level sourceMaterial as its one entry", () => {
    const { buildSyllabusEventBatch, getWeeklyRoutine, getSchedulePreferences } = loadStudlinModule({ now: "2026-07-20T09:00:00" });
    const examItem = syllabusItem({ kind: "exam", proposeSessions: false });
    const { markerEvents } = buildSyllabusEventBatch([], "wiz-3b", "Chemistry", [examItem], "whole syllabus raw text", getWeeklyRoutine(), getSchedulePreferences());
    assert.equal(markerEvents[0].sourceMaterials.length, 1);
    assert.equal(markerEvents[0].sourceMaterials[0].text, "whole syllabus raw text");
    assert.equal(markerEvents[0].referenceLinks, undefined);
  });

  test("regression: an exam with a real per-item detail uses that instead of dumping the whole syllabus in as 'material'", () => {
    const { buildSyllabusEventBatch, getWeeklyRoutine, getSchedulePreferences } = loadStudlinModule({ now: "2026-07-20T09:00:00" });
    const examItem = syllabusItem({ kind: "exam", proposeSessions: false, detail: "Covers chapters 4-6, closed book" });
    const { markerEvents } = buildSyllabusEventBatch([], "wiz-3c", "Chemistry", [examItem], "whole syllabus raw text -- grading policy, every class's dates, etc.", getWeeklyRoutine(), getSchedulePreferences());
    assert.equal(markerEvents[0].sourceMaterials.length, 1, "the specific detail, not also the whole syllabus dump");
    assert.equal(markerEvents[0].sourceMaterials[0].text, "Covers chapters 4-6, closed book");
  });

  test("commitSyllabusEvents (the real, persisting wrapper) still produces the same events buildSyllabusEventBatch would, and writes them to storage", () => {
    const sandbox = loadStudlinModule({ now: "2026-07-20T09:00:00" });
    const { commitSyllabusEvents, lsGet } = sandbox;
    const result = commitSyllabusEvents("wiz-4", "Chemistry", [syllabusItem()], null);
    assert.equal(result.length, 2, "one marker + one Attack Block session");
    const stored = lsGet("events", []);
    assert.equal(stored.length, 2);
  });
});

describe("buildPendingSchedulePreview (Class Setup Wizard's multi-class drill-down review)", () => {
  function pendingClass(overrides) {
    return {
      id: "pend-1", name: "Chemistry", color: "#7BACDF", meetingTimes: [],
      items: [{
        id: "cd-1", title: "Midterm", date: "2026-08-10", kind: "exam",
        include: true, noDate: false, proposeSessions: true, sessionCount: 2,
        difficulty: 500,
      }],
      sourceText: "", ...overrides,
    };
  }

  test("never touches real storage -- a pure preview, not a commit", () => {
    const sandbox = loadStudlinModule({ now: "2026-07-20T09:00:00" });
    const { buildPendingSchedulePreview, getWeeklyRoutine, getSchedulePreferences, lsGet } = sandbox;
    buildPendingSchedulePreview([pendingClass()], getWeeklyRoutine(), getSchedulePreferences());
    assert.deepEqual(lsGet("events", []), []);
  });

  test("zips each item back up with its own marker and scheduled sessions", () => {
    const { buildPendingSchedulePreview, getWeeklyRoutine, getSchedulePreferences } = loadStudlinModule({ now: "2026-07-20T09:00:00" });
    const preview = buildPendingSchedulePreview([pendingClass()], getWeeklyRoutine(), getSchedulePreferences());
    assert.equal(preview.length, 1);
    assert.equal(preview[0].items.length, 1);
    assert.equal(preview[0].items[0].item.title, "Midterm");
    assert.ok(preview[0].items[0].sessions.length > 0, "exam sessions should have been placed");
  });

  test("a second pending class's preview sees the first class's sessions as already occupying time", () => {
    const { buildPendingSchedulePreview, getWeeklyRoutine, getSchedulePreferences, setSchedulePreferences } = loadStudlinModule({ now: "2026-07-20T09:00:00" });
    // A narrow window so two same-day exam sessions genuinely can't both fit
    // without the second class's preview seeing the first's already-placed load.
    setSchedulePreferences({ workStartTime: "10:00", workEndTime: "10:45", weekendEnabled: false, weekendStartTime: "10:00", weekendEndTime: "18:00", peakHourBuckets: [] });
    const classA = pendingClass({ id: "pend-a", name: "Chemistry", items: [{ id: "a1", title: "Exam A", date: "2026-08-10", kind: "exam", include: true, noDate: false, proposeSessions: true, sessionCount: 1, difficulty: 500 }] });
    const classB = pendingClass({ id: "pend-b", name: "Physics", items: [{ id: "b1", title: "Exam B", date: "2026-08-10", kind: "exam", include: true, noDate: false, proposeSessions: true, sessionCount: 1, difficulty: 500 }] });
    const preview = buildPendingSchedulePreview([classA, classB], getWeeklyRoutine(), getSchedulePreferences());
    const sessionsA = preview[0].items[0].sessions;
    const sessionsB = preview[1].items[0].sessions;
    if (sessionsA.length > 0 && sessionsB.length > 0) {
      const overlap = sessionsA.some((sa) => sessionsB.some((sb) => sa.date === sb.date && sa.time === sb.time));
      assert.equal(overlap, false, "class B's preview must not land on top of class A's already-previewed session");
    }
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
    const today = m.dayKey(); // clear_week's window is relative to the real clock, not a fixed past literal
    const marker = dueDateMarker({ date: today });
    const task = realTask({ id: "task-1", date: today });
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

  test("never assigns a checklist item a clock time (regression: 'push everything back' used to schedule plain to-dos)", () => {
    const m = loadStudlinModule();
    const today = m.dayKey(); // shift's window is ev.date>=today, so this must track the real clock, not a fixed past literal
    const checklistItem = realTask({ id: "checklist-1", date: today, time: null, duration: null, checklist: true });
    const task = realTask({ id: "task-1", date: today });
    m.localStorage.setItem("studlin-events", JSON.stringify([checklistItem, task]));
    const result = m.computePausePlan({ intent: "shift", days: 3 });
    const touchedIds = [...result.moved, ...result.couldntMove].map((x) => x.id);
    assert.ok(!touchedIds.includes("checklist-1"), "a checklist item must never be caught up in a bulk reschedule and given a fake time");
    assert.ok(touchedIds.includes("task-1"), "a real study block should still be eligible to move");
  });

  test("move_event relocates a one-off fixed event to the requested day", () => {
    const m = loadStudlinModule();
    const gym = { id: "gym-1", title: "Gym", date: "2026-07-20", time: "19:15", subject: "", kind: "busy block", notes: "", priority: null, difficulty: null, deadline: null, duration: 60, status: "pending", timeSpent: 0, completedAt: null };
    m.localStorage.setItem("studlin-events", JSON.stringify([gym]));
    const result = m.computePausePlan({ intent: "move_event", target: "gym", targetDate: "2026-07-20", destDate: "2026-07-21" });
    assert.equal(result.moved.length, 1);
    assert.equal(result.moved[0].id, "gym-1");
    assert.equal(result.moved[0].newDate, "2026-07-21");
    assert.equal(result.moved[0].isRoutine, false);
  });

  test("move_event matches a recurring routine occurrence and flags it for a one-off override", () => {
    const m = loadStudlinModule();
    const dow = (new Date("2026-07-20T12:00:00").getDay() + 6) % 7; // app's Monday-first convention
    const routine = { id: "routine-gym", title: "Gym", kind: "busy", days: [dow], startTime: "19:15", duration: 60, subject: "" };
    m.localStorage.setItem("studlin-weeklyRoutine", JSON.stringify([routine]));
    m.localStorage.setItem("studlin-events", JSON.stringify([]));
    const result = m.computePausePlan({ intent: "move_event", target: "gym", targetDate: "2026-07-20", destDate: "2026-07-21" });
    assert.equal(result.moved.length, 1);
    assert.equal(result.moved[0].isRoutine, true);
    assert.equal(result.moved[0].routineId, "routine-gym");
    assert.equal(result.moved[0].oldDate, "2026-07-20");
  });

  test("move_event on a routine that also recurs on the destination day doesn't self-collide and land at midnight (regression)", () => {
    const m = loadStudlinModule();
    // Recurs every day, so the destination day (tomorrow) also has an
    // active occurrence of the same rule -- this used to self-collide and
    // fall through to the last-resort full-day scan, landing at 00:00.
    const routine = { id: "routine-band", title: "Band", kind: "class", days: [0, 1, 2, 3, 4, 5, 6], startTime: "15:00", duration: 60, subject: "" };
    m.localStorage.setItem("studlin-weeklyRoutine", JSON.stringify([routine]));
    m.localStorage.setItem("studlin-events", JSON.stringify([]));
    const result = m.computePausePlan({ intent: "move_event", target: "band", targetDate: "2026-07-20", destDate: "2026-07-21" });
    assert.equal(result.moved.length, 1);
    assert.notEqual(result.moved[0].newTime, "00:00", "must not fall through to the midnight last-resort slot");
    assert.equal(result.moved[0].newTime, "15:00", "the exact original time-of-day should be free once the self-collision is fixed");
  });

  test("retime_event reslots a study block that now collides with the new time", () => {
    const m = loadStudlinModule();
    const practice = { id: "practice-1", title: "Track practice", date: "2026-07-20", time: "18:00", subject: "", kind: "busy block", notes: "", priority: null, difficulty: null, deadline: null, duration: 60, status: "pending", timeSpent: 0, completedAt: null };
    const study = realTask({ id: "study-1", date: "2026-07-20", time: "19:15", duration: 60 });
    m.localStorage.setItem("studlin-events", JSON.stringify([practice, study]));
    // New window 19:00-21:00 now overlaps the study block that used to sit safely after the old 18:00-19:00 practice.
    const result = m.computePausePlan({ intent: "retime_event", target: "track practice", targetDate: "2026-07-20", newStart: "19:00", newDuration: 120 });
    const practiceMoved = result.moved.find((x) => x.id === "practice-1");
    const studyMoved = result.moved.find((x) => x.id === "study-1");
    assert.ok(practiceMoved, "the retimed event itself should be in moved");
    assert.equal(practiceMoved.newTime, "19:00");
    assert.ok(studyMoved, "the colliding study block should be reslotted");
    assert.notEqual(studyMoved.newTime, "19:15", "must not stay inside the new 19:00-21:00 window");
  });

  test("retime_event leaves non-colliding tasks untouched", () => {
    const m = loadStudlinModule();
    const practice = { id: "practice-1", title: "Track practice", date: "2026-07-20", time: "18:00", subject: "", kind: "busy block", notes: "", priority: null, difficulty: null, deadline: null, duration: 60, status: "pending", timeSpent: 0, completedAt: null };
    const morningStudy = realTask({ id: "study-1", date: "2026-07-20", time: "10:00", duration: 30 });
    m.localStorage.setItem("studlin-events", JSON.stringify([practice, morningStudy]));
    const result = m.computePausePlan({ intent: "retime_event", target: "track practice", targetDate: "2026-07-20", newStart: "19:00", newDuration: 120 });
    const touchedIds = result.moved.map((x) => x.id);
    assert.ok(!touchedIds.includes("study-1"), "a task nowhere near the new time window should not move");
  });

  test("returns noMatch when nothing on the calendar resembles the named target", () => {
    const m = loadStudlinModule();
    m.localStorage.setItem("studlin-events", JSON.stringify([]));
    const result = m.computePausePlan({ intent: "move_event", target: "gym", targetDate: "2026-07-20", destDate: "2026-07-21" });
    assert.equal(result.noMatch, true);
    assert.equal(result.moved.length, 0);
  });

  test("returns a disambiguation list when the target phrase matches more than one item, and a forced id resolves it", () => {
    const m = loadStudlinModule();
    const a = { id: "p1", title: "Track practice", date: "2026-07-20", time: "17:00", subject: "", kind: "busy block", notes: "", priority: null, difficulty: null, deadline: null, duration: 60, status: "pending", timeSpent: 0, completedAt: null };
    const b = { id: "p2", title: "Piano practice", date: "2026-07-20", time: "19:00", subject: "", kind: "busy block", notes: "", priority: null, difficulty: null, deadline: null, duration: 30, status: "pending", timeSpent: 0, completedAt: null };
    m.localStorage.setItem("studlin-events", JSON.stringify([a, b]));
    const intent = { intent: "move_event", target: "practice", targetDate: "2026-07-20", destDate: "2026-07-21" };
    const ambiguous = m.computePausePlan(intent);
    assert.equal(ambiguous.disambiguate.length, 2);
    const resolved = m.computePausePlan(intent, "p1");
    assert.equal(resolved.moved[0].id, "p1");
  });
});

describe("matchEventByTitle", () => {
  test("returns no matches when nothing on that date resembles the phrase", () => {
    const m = loadStudlinModule();
    m.localStorage.setItem("studlin-events", JSON.stringify([realTask({ id: "t1", date: "2026-07-20", title: "Chem homework" })]));
    const result = m.matchEventByTitle("gym", "2026-07-20");
    assert.equal(result.matches.length, 0);
  });

  test("returns exactly one match for an unambiguous title", () => {
    const m = loadStudlinModule();
    const gym = { id: "gym-1", title: "Gym", date: "2026-07-20", time: "19:15", kind: "busy block", duration: 60, status: "pending" };
    m.localStorage.setItem("studlin-events", JSON.stringify([gym]));
    const result = m.matchEventByTitle("gym", "2026-07-20");
    assert.equal(result.matches.length, 1);
    assert.equal(result.matches[0].id, "gym-1");
  });

  test("returns every candidate when the phrase is ambiguous", () => {
    const m = loadStudlinModule();
    const a = { id: "p1", title: "Track practice", date: "2026-07-20", time: "17:00", kind: "busy block", duration: 60, status: "pending" };
    const b = { id: "p2", title: "Piano practice", date: "2026-07-20", time: "19:00", kind: "busy block", duration: 30, status: "pending" };
    m.localStorage.setItem("studlin-events", JSON.stringify([a, b]));
    const result = m.matchEventByTitle("practice", "2026-07-20");
    assert.equal(result.matches.length, 2);
  });

  test("matches a recurring routine occurrence expanded for that date", () => {
    const m = loadStudlinModule();
    const dow = (new Date("2026-07-20T12:00:00").getDay() + 6) % 7;
    const routine = { id: "routine-gym", title: "Gym", kind: "busy", days: [dow], startTime: "19:15", duration: 60, subject: "" };
    m.localStorage.setItem("studlin-weeklyRoutine", JSON.stringify([routine]));
    m.localStorage.setItem("studlin-events", JSON.stringify([]));
    const result = m.matchEventByTitle("gym", "2026-07-20");
    assert.equal(result.matches.length, 1);
    assert.equal(result.matches[0].isRoutine, true);
  });
});

describe("materializeHabitsForDate (flexible daily habits)", () => {
  const dow = (new Date("2026-07-20T12:00:00").getDay() + 6) % 7; // app's Monday-first convention

  test("materializes a due habit into a real, concretely-timed event", () => {
    const m = loadStudlinModule();
    const habit = { id: "habit-gym", title: "Gym", kind: "habit", days: [dow], duration: 45, subject: "" };
    m.localStorage.setItem("studlin-weeklyRoutine", JSON.stringify([habit]));
    const created = m.materializeHabitsForDate("2026-07-20", []);
    assert.equal(created.length, 1);
    assert.equal(created[0].routineId, "habit-gym");
    assert.equal(created[0].date, "2026-07-20");
    assert.equal(created[0].kind, "study block");
    assert.ok(created[0].time >= "10:00" && created[0].time < "23:00", "should land within workStartTime-bedtime");
  });

  test("is idempotent — a second call for the same date creates nothing new", () => {
    const m = loadStudlinModule();
    const habit = { id: "habit-gym", title: "Gym", kind: "habit", days: [dow], duration: 45, subject: "" };
    m.localStorage.setItem("studlin-weeklyRoutine", JSON.stringify([habit]));
    const first = m.materializeHabitsForDate("2026-07-20", []);
    const second = m.materializeHabitsForDate("2026-07-20", first);
    assert.equal(second.length, 0);
  });

  test("does not duplicate when the caller passes state where the instance was already moved elsewhere the same date (regression: Tier 0 moving yesterday's instance forward must not race a fresh materialization)", () => {
    const m = loadStudlinModule();
    const habit = { id: "habit-gym", title: "Gym", kind: "habit", days: [dow], duration: 45, subject: "" };
    m.localStorage.setItem("studlin-weeklyRoutine", JSON.stringify([habit]));
    // Simulate: yesterday's materialized instance just got Tier-0-reflowed
    // forward onto today, in memory, by the caller -- BEFORE
    // materializeHabitsForDate is asked about today.
    const alreadyMovedInstance = { id: "habit-gym-2026-07-19", routineId: "habit-gym", title: "Gym", date: "2026-07-20", time: "11:00", kind: "study block", duration: 45, status: "pending" };
    const created = m.materializeHabitsForDate("2026-07-20", [alreadyMovedInstance]);
    assert.equal(created.length, 0, "must see the already-moved instance via workingEvents and not create a second one");
  });

  test("skips gracefully when the whole day is already booked, without throwing", () => {
    const m = loadStudlinModule();
    const habit = { id: "habit-gym", title: "Gym", kind: "habit", days: [dow], duration: 30, subject: "" };
    const packed = { id: "packed-1", title: "Packed", date: "2026-07-20", time: "10:00", kind: "busy block", duration: 780, status: "pending" };
    m.localStorage.setItem("studlin-weeklyRoutine", JSON.stringify([habit]));
    const created = m.materializeHabitsForDate("2026-07-20", [packed]);
    assert.equal(created.length, 0, "a fully booked day should skip the habit, not throw or double-book");
  });

  test("two routine records sharing the same id (data corruption / import collision) never materialize two events with the same id (regression: used to silently produce duplicate-id events)", () => {
    const m = loadStudlinModule();
    const h1 = { id: "h1", title: "Gym", kind: "habit", days: [dow], duration: 30, subject: "" };
    const h2 = { id: "h1", title: "Gym Duplicate", kind: "habit", days: [dow], duration: 30, subject: "" };
    m.localStorage.setItem("studlin-weeklyRoutine", JSON.stringify([h1, h2]));
    const created = m.materializeHabitsForDate("2026-07-20", []);
    assert.equal(created.length, 1, "only one event should be materialized for one shared routine id");
  });

  test("skips a habit not scheduled for that weekday", () => {
    const m = loadStudlinModule();
    const otherDow = (dow + 1) % 7;
    const habit = { id: "habit-gym", title: "Gym", kind: "habit", days: [otherDow], duration: 30, subject: "" };
    m.localStorage.setItem("studlin-weeklyRoutine", JSON.stringify([habit]));
    const created = m.materializeHabitsForDate("2026-07-20", []);
    assert.equal(created.length, 0);
  });

  test("respects a later weekend start time instead of the weekday start (regression: used to ignore weekendStartTime entirely)", () => {
    const m = loadStudlinModule();
    // Find the next Saturday so getWorkWindowMinsFor's weekend branch engages.
    let d = new Date("2026-07-20T12:00:00");
    while (d.getDay() !== 6) d.setDate(d.getDate() + 1);
    const saturday = d.toISOString().slice(0, 10);
    const satDow = (d.getDay() + 6) % 7;
    const habit = { id: "habit-gym", title: "Gym", kind: "habit", days: [satDow], duration: 30, subject: "" };
    m.localStorage.setItem("studlin-weeklyRoutine", JSON.stringify([habit]));
    m.localStorage.setItem("studlin-schedulePrefs", JSON.stringify({
      workStartTime: "07:00", workEndTime: "18:00", bedtime: "23:00",
      weekendEnabled: true, weekendStartTime: "11:00", weekendEndTime: "20:00",
    }));
    const created = m.materializeHabitsForDate(saturday, []);
    assert.equal(created.length, 1);
    assert.ok(created[0].time >= "11:00", "must respect the 11:00 weekend start, not the 07:00 weekday start");
  });

  test("a habit routine is never virtually expanded (no fixed time to expand)", () => {
    const m = loadStudlinModule();
    const habit = { id: "habit-gym", title: "Gym", kind: "habit", days: [dow], duration: 30, subject: "" };
    m.localStorage.setItem("studlin-weeklyRoutine", JSON.stringify([habit]));
    const occurrences = m.getRoutineOccurrencesForDate("2026-07-20");
    assert.equal(occurrences.length, 0, "habits must be excluded from expandRoutineOccurrences, not given a fake time");
  });
});

describe("school term awareness (class routines suppressed outside term dates)", () => {
  const dow = (new Date("2026-07-20T12:00:00").getDay() + 6) % 7;

  test("a class routine still expands normally when no term is set (regression: must be opt-in, default behavior unchanged)", () => {
    const m = loadStudlinModule();
    const routine = { id: "r-chem", title: "Chemistry", kind: "class", days: [dow], startTime: "08:00", duration: 50, subject: "Chemistry" };
    m.localStorage.setItem("studlin-weeklyRoutine", JSON.stringify([routine]));
    const occurrences = m.getRoutineOccurrencesForDate("2026-07-20");
    assert.equal(occurrences.length, 1, "no schoolTerm configured means no change from today's always-on behavior");
  });

  test("a class routine does not expand on a date outside the configured term (e.g. summer break)", () => {
    const m = loadStudlinModule();
    const routine = { id: "r-chem", title: "Chemistry", kind: "class", days: [dow], startTime: "08:00", duration: 50, subject: "Chemistry" };
    m.localStorage.setItem("studlin-weeklyRoutine", JSON.stringify([routine]));
    m.saveSchoolTerm({ start: "2026-09-01", end: "2026-12-15" });
    const occurrences = m.getRoutineOccurrencesForDate("2026-07-20"); // mid-summer, before the term starts
    assert.equal(occurrences.length, 0);
  });

  test("a class routine expands normally on a date inside the configured term", () => {
    const m = loadStudlinModule();
    const dowInSept = (new Date("2026-09-14T12:00:00").getDay() + 6) % 7;
    const routine = { id: "r-chem", title: "Chemistry", kind: "class", days: [dowInSept], startTime: "08:00", duration: 50, subject: "Chemistry" };
    m.localStorage.setItem("studlin-weeklyRoutine", JSON.stringify([routine]));
    m.saveSchoolTerm({ start: "2026-09-01", end: "2026-12-15" });
    const occurrences = m.getRoutineOccurrencesForDate("2026-09-14");
    assert.equal(occurrences.length, 1);
  });

  test("busy and habit routines are unaffected by term dates — only class-kind is governed by the school calendar", () => {
    const m = loadStudlinModule();
    const busyRoutine = { id: "r-job", title: "Part-time job", kind: "busy", days: [dow], startTime: "17:00", duration: 120, subject: "" };
    const habitRoutine = { id: "r-run", title: "Run", kind: "habit", days: [dow], duration: 30, subject: "" };
    m.localStorage.setItem("studlin-weeklyRoutine", JSON.stringify([busyRoutine, habitRoutine]));
    m.saveSchoolTerm({ start: "2026-09-01", end: "2026-12-15" });
    const occurrences = m.getRoutineOccurrencesForDate("2026-07-20"); // mid-summer
    assert.ok(occurrences.some((o) => o.routineId === "r-job"), "a job or activity shouldn't be silently hidden just because it's summer");
    // Habits never virtually expand at all (materialized separately), so
    // just confirm the class-only scoping didn't accidentally start
    // affecting them via some other path.
    const habitCreated = m.materializeHabitsForDate("2026-07-20", []);
    assert.equal(habitCreated.length, 1, "a habit should still materialize during summer break");
  });
});

describe("findFixedEventSlot (regression: silently double-booked a fixed event when the short search horizon ran out)", () => {
  test("still lands on a genuinely free day when the desired day, and many days after it, are fully booked", () => {
    const m = loadStudlinModule();
    // Pack 30 straight days solid (well past the old 21-day search horizon)
    // with all-day busy blocks so the old code's fallback -- "give up and
    // hand back the original desired slot" -- would land on day 1, which
    // this test proves is still occupied.
    const packed = [];
    let cursor = new Date("2026-07-20T12:00:00");
    for (let i = 0; i < 30; i++) {
      const dk = m.dayKey(cursor);
      packed.push({ id: "pack-" + i, date: dk, time: "00:00", duration: 24 * 60, kind: "busy block", status: "pending" });
      cursor.setDate(cursor.getDate() + 1);
    }
    const slot = m.findFixedEventSlot(packed, [], DEFAULT_PREFS, "2026-07-20", "19:00", 60);
    const sameDayBlock = packed.find((e) => e.date === slot.date);
    assert.ok(!sameDayBlock, `findFixedEventSlot returned a slot on ${slot.date}, which is one of the 30 fully-booked days -- it silently double-booked the moved event instead of searching past the packed range`);
  });

  test("a single fully-booked day still rolls forward to the very next (empty) day, unchanged behavior", () => {
    const m = loadStudlinModule();
    const packed = [{ id: "wall-to-wall", date: "2026-07-20", time: "00:00", duration: 24 * 60, kind: "busy block", status: "pending" }];
    const slot = m.findFixedEventSlot(packed, [], DEFAULT_PREFS, "2026-07-20", "19:00", 60);
    assert.equal(slot.date, "2026-07-21");
    assert.equal(slot.time, "19:00");
  });
});

describe("findSlotWithEviction", () => {
  test("evicted tasks are stamped movedByStudlin/movedFrom (regression: they used to move with no flag, no banner entry, no undo)", () => {
    const m = loadStudlinModule();
    const today = m.dayKey();
    // Pack the whole work window PLUS the same-day catch-up window (see
    // dayHasRoomFor's own catch-up allowance) with freely-evictable study
    // blocks (no deadline), so an imminent urgent task genuinely has
    // nowhere to go -- including the 2-hour catch-up buffer -- without
    // evicting something. Packing only through workEndTime used to be
    // enough to force eviction, but now that dayHasRoomFor also sees the
    // catch-up window, leaving it open would let the task land there
    // instead of evicting anything, same as findOpenSlotFor already would.
    const packed = [];
    let t = 9 * 60; // matches DEFAULT_PREFS.workStartTime
    let idx = 0;
    while (t + 30 <= 20 * 60) { // through workEndTime (18:00) + the 2hr catch-up window
      packed.push({ id: "pack-" + idx, title: "Filler " + idx, date: today, time: `${String(Math.floor(t / 60)).padStart(2, "0")}:${String(t % 60).padStart(2, "0")}`, kind: "study block", duration: 30, status: "pending", deadline: null });
      t += 30; idx++;
    }
    // deadlineKey === today => daysOut 0 => the eviction path engages.
    const result = m.findSlotWithEviction(packed, [], DEFAULT_PREFS, today, "09:00", 30, today);
    const evicted = result.events.filter((e) => e.movedByStudlin);
    assert.ok(evicted.length >= 1, "at least one task should have been evicted to make room");
    evicted.forEach((e) => {
      assert.ok(e.movedFrom && e.movedFrom.date && e.movedFrom.time, "an evicted task must carry movedFrom so the badge and undoTier0Move work for it too");
    });
  });

  test("still evicts and lands on the target day when the only free gap sits BEFORE the requested time (regression: dayHasRoomFor scanned the whole day while findOpenSlotFor's day-0 scan never looks before desiredTime, so eviction skipped itself thinking there was already room)", () => {
    const m = loadStudlinModule();
    // Tomorrow, not today -- findOpenSlotFor floors today's own scan to the
    // real current clock time, which would make a fixed "10:00" desiredTime
    // flaky depending on what time this test happens to run. daysOut from
    // real "today" is still 1 (<=3), so the eviction path still engages.
    const target = m.dayKey(new Date(Date.now() + 86400000));
    // Free 09:00-10:00 (before desiredTime), then wall-to-wall evictable
    // filler from 10:00 through the 18:00 work end -- nothing at or after
    // 10:00 is open at all.
    const packed = [];
    let t = 10 * 60;
    let idx = 0;
    while (t + 30 <= 18 * 60) {
      packed.push({ id: "pack-" + idx, title: "Filler " + idx, date: target, time: `${String(Math.floor(t / 60)).padStart(2, "0")}:${String(t % 60).padStart(2, "0")}`, kind: "study block", duration: 30, status: "pending", deadline: null });
      t += 30; idx++;
    }
    const result = m.findSlotWithEviction(packed, [], DEFAULT_PREFS, target, "10:00", 30, target);
    assert.ok(result.placement, "an imminent task should still be placeable on the target day by evicting filler at/after the requested time");
    assert.equal(result.placement.date, target, "the fix should let eviction engage and keep this on the desired (imminent) day instead of silently rolling to a later day");
  });

  test("never leaves a relocated evicted task double-booked when its own relocation search is fully exhausted (regression: the evicted-task relocation call used raw findOpenSlotFor, which falls back to an unvalidated, possibly-conflicting slot instead of null)", () => {
    const m = loadStudlinModule();
    const target = m.dayKey(new Date(Date.now() + 86400000)); // see note above -- avoid today's now-floor
    // Pack the target day with evictable filler (forces eviction to engage
    // for the imminent primary task) ...
    const packed = [];
    let t = 9 * 60;
    let idx = 0;
    while (t + 30 <= 18 * 60) {
      packed.push({ id: "pack-" + idx, title: "Filler " + idx, date: target, time: `${String(Math.floor(t / 60)).padStart(2, "0")}:${String(t % 60).padStart(2, "0")}`, kind: "study block", duration: 30, status: "pending", deadline: null });
      t += 30; idx++;
    }
    // ...and pack every day for the next 25 days solid with an unmovable
    // 24hr block, so relocating an evicted filler task (which searches
    // starting the day after the target) can never find room anywhere
    // within findOpenSlotFor's own 21-day horizon.
    let cursor = new Date(target + "T12:00:00");
    for (let i = 1; i <= 25; i++) {
      cursor.setDate(cursor.getDate() + 1);
      const dk = m.dayKey(cursor);
      packed.push({ id: "wall-" + i, date: dk, time: "00:00", duration: 24 * 60, kind: "busy block", status: "pending" });
    }
    const result = m.findSlotWithEviction(packed, [], DEFAULT_PREFS, target, "09:00", 30, target);
    // Whatever the function decides (placing today by evicting, or giving
    // up entirely), it must never leave two events on the same date
    // overlapping in the returned events array -- that's the actual
    // double-booking this regression guards against.
    const minsOf = (timeStr) => { const [h, mm] = timeStr.split(":").map(Number); return h * 60 + mm; };
    const byDate = new Map();
    result.events.forEach((e) => {
      if (!e.time) return;
      if (!byDate.has(e.date)) byDate.set(e.date, []);
      byDate.get(e.date).push({ id: e.id, start: minsOf(e.time), end: minsOf(e.time) + (e.duration || 30) });
    });
    byDate.forEach((intervals, dk) => {
      for (let i = 0; i < intervals.length; i++) {
        for (let j = i + 1; j < intervals.length; j++) {
          const a = intervals[i], b = intervals[j];
          const overlap = a.start < b.end && b.start < a.end;
          assert.ok(!overlap, `events ${a.id} and ${b.id} overlap on ${dk} -- an evicted task was silently double-booked instead of the eviction attempt being abandoned`);
        }
      }
    });
    // The returned placement itself (if any) must also not overlap
    // anything in the returned events array.
    if (result.placement) {
      const dayIntervals = byDate.get(result.placement.date) || [];
      const pStart = minsOf(result.placement.time);
      const pEnd = pStart + 30;
      dayIntervals.forEach((iv) => {
        const overlap = pStart < iv.end && iv.start < pEnd;
        assert.ok(!overlap, `placement at ${result.placement.date} ${result.placement.time} overlaps event ${iv.id}`);
      });
    }
  });
});

describe("undoTier0Move (regression: restored a task to its original slot with no re-check, silently overlapping anything that had since landed there)", () => {
  test("restores a moved task cleanly when the original slot is still free", () => {
    const m = loadStudlinModule();
    const moved = realTask({ id: "t1", date: "2026-07-21", time: "14:00", movedByStudlin: true, movedFrom: { date: "2026-07-20", time: "10:00" }, movedAt: 123 });
    m.localStorage.setItem("studlin-events", JSON.stringify([moved]));
    const result = m.undoTier0Move("t1");
    assert.equal(result.blocked, false);
    const restored = result.events.find((e) => e.id === "t1");
    assert.equal(restored.date, "2026-07-20");
    assert.equal(restored.time, "10:00");
    assert.equal(restored.movedByStudlin, undefined, "marker fields should be stripped once restored");
  });

  test("refuses to restore (and leaves the task where it currently is) when something else now occupies the original slot", () => {
    const m = loadStudlinModule();
    const moved = realTask({ id: "t1", date: "2026-07-21", time: "14:00", movedByStudlin: true, movedFrom: { date: "2026-07-20", time: "10:00" }, movedAt: 123 });
    // Something else has since landed exactly on the original slot.
    const interloper = realTask({ id: "t2", date: "2026-07-20", time: "10:00" });
    m.localStorage.setItem("studlin-events", JSON.stringify([moved, interloper]));
    const result = m.undoTier0Move("t1");
    assert.equal(result.blocked, true, "undo must refuse rather than silently overlap the interloper");
    const stillMoved = result.events.find((e) => e.id === "t1");
    assert.equal(stillMoved.date, "2026-07-21", "the task should stay exactly where it currently is, not get corrupted mid-undo");
    assert.equal(stillMoved.time, "14:00");
    assert.equal(stillMoved.movedByStudlin, true, "since the restore didn't happen, the moved marker should still be present");
  });

  test("no-ops harmlessly for a task that was never moved by Studlin", () => {
    const m = loadStudlinModule();
    const plain = realTask({ id: "t1" });
    m.localStorage.setItem("studlin-events", JSON.stringify([plain]));
    const result = m.undoTier0Move("t1");
    assert.equal(result.blocked, false);
    // JSON round-trip on both sides -- the sandboxed module runs in a
    // separate vm realm, so its returned plain object has a different
    // Object prototype than one built in this test file; deepStrictEqual
    // would fail on that alone even with identical own-property values.
    assert.equal(JSON.stringify(result.events.find((e) => e.id === "t1")), JSON.stringify(plain));
  });
});

describe("examAlreadyPassedToday / exam-day-itself reflow (regression: review sessions scheduled after the exam already happened)", () => {
  test("true when the linked exam is today and its time has already passed", () => {
    const m = loadStudlinModule();
    const linkedDue = { date: "2026-07-17", time: "09:00" };
    assert.equal(m.examAlreadyPassedToday(linkedDue, "2026-07-17", 600), true); // 10:00am, after a 9am exam
  });

  test("false when the linked exam is today but hasn't happened yet", () => {
    const m = loadStudlinModule();
    const linkedDue = { date: "2026-07-17", time: "14:00" };
    assert.equal(m.examAlreadyPassedToday(linkedDue, "2026-07-17", 600), false); // 10:00am, before a 2pm exam
  });

  test("false when there's no linked due event", () => {
    const m = loadStudlinModule();
    assert.equal(m.examAlreadyPassedToday(null, "2026-07-17", 600), false);
  });

  test("false when the linked due event isn't today", () => {
    const m = loadStudlinModule();
    const linkedDue = { date: "2026-07-18", time: "09:00" };
    assert.equal(m.examAlreadyPassedToday(linkedDue, "2026-07-17", 600), false);
  });

  test("end-to-end: a review session for a same-day already-passed exam gets placed tomorrow, not later today", () => {
    const m = loadStudlinModule();
    const today = "2026-07-17";
    const tomorrow = "2026-07-18";
    const yesterday = "2026-07-16";
    const examMarker = { id: "exam-1", title: "Chem Exam", date: today, time: "09:00", kind: "exam", status: "pending" };
    const session = { id: "session-1", title: "Chem review", date: yesterday, time: "16:00", kind: "study block", duration: 45, status: "pending", deadline: today, dueEventId: "exam-1" };
    const nowMins = 600; // 10:00am — after the 9am exam
    const passed = m.examAlreadyPassedToday(examMarker, today, nowMins);
    assert.equal(passed, true);
    const searchTask = { ...session, deadline: tomorrow };
    const result = m.findTier0Slot(searchTask, [examMarker, session], [], DEFAULT_PREFS, tomorrow);
    assert.ok(result, "should still find a legitimate placement, just not today");
    assert.equal(result.placement.date, tomorrow, "must not land on the exam's own date once its time has passed");
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
  test("an exam that already passed gets no review sessions", () => {
    const { computeReviewOffsets } = loadStudlinModule();
    assert.equal(computeReviewOffsets(-1, 4).length, 0);
  });

  test("an exam tomorrow still gets one cram session today, not zero (regression: daysUntil<2 used to return nothing at all)", () => {
    const { computeReviewOffsets } = loadStudlinModule();
    // Arrays built inside the sandboxed vm context aren't deepEqual-identical
    // to native-realm arrays even with matching contents (a vm quirk, not a
    // source bug) -- checking length/contents via .length and indexing
    // sidesteps that entirely.
    const offsets = computeReviewOffsets(1, 4);
    assert.equal(offsets.length, 1);
    assert.equal(offsets[0], 1, "one session, one day out (today)");
  });

  test("an exam happening today gets one session at offset 0", () => {
    const { computeReviewOffsets } = loadStudlinModule();
    const offsets = computeReviewOffsets(0, 4);
    assert.equal(offsets.length, 1);
    assert.equal(offsets[0], 0);
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

  test("findLegalSlotOrNull refuses findOpenSlotFor's raw out-of-window fallback (regression: a deadline forcing an early break, before any day was scanned, let a before-work-hours time slip through as 'legal')", () => {
    const { findOpenSlotFor, findLegalSlotOrNull } = loadStudlinModule();
    // deadlineKey is already before desiredDate, so findOpenSlotFor's loop
    // breaks on its very first iteration (dk > deadlineKey) without ever
    // scanning a real day -- exactly the documented "before any day was
    // even scanned" fallback trigger. desiredTime (06:00) sits before
    // DEFAULT_PREFS.workStartTime (09:00).
    const rawFallback = findOpenSlotFor([], [], DEFAULT_PREFS, "2026-08-01", "06:00", 30, "2026-07-01");
    // Prove the fallback really is the bad, unclamped slot this test guards
    // against -- if findOpenSlotFor's own behavior ever changes, this test
    // should fail loudly here rather than silently stop testing anything.
    assert.equal(rawFallback.time, "06:00", "findOpenSlotFor's raw fallback should hand back the unclamped desired time verbatim");
    const legal = findLegalSlotOrNull([], [], DEFAULT_PREFS, "2026-08-01", "06:00", 30, "2026-07-01");
    assert.equal(legal, null, "findLegalSlotOrNull must reject a fallback slot that falls outside the student's work-hour window");
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
    const { tasks } = planBrainDumpTasks(items, [], [], DEFAULT_PREFS);
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
    // planBrainDumpTasks schedules "now"-anchored items against the real
    // wall clock, so this needs a genuinely frozen clock, not just a wider
    // window -- t.mock.timers.enable({apis:["Date"]}) looked like it did
    // that but never actually reached the sandboxed module (it only
    // patches the outer Node process's Date; loadStudlinModule runs in its
    // own vm realm with its own separate, real Date), so this test spent
    // a while silently running against the real clock and only failed the
    // moment real "now" happened to cross a day boundary mid-run. Passing
    // {now} into loadStudlinModule (see harness.js's makeFrozenDateClass)
    // actually reaches the sandbox.
    const { planBrainDumpTasks } = loadStudlinModule({ now: "2026-07-16T09:00:00" });
    const items = [
      { kind: "study", title: "Find bugs", durationMin: 60, immediate: true, chained: false },
      { kind: "study", title: "Paint floor", durationMin: 30, chained: true },
    ];
    const { tasks } = planBrainDumpTasks(items, [], [], DEFAULT_PREFS);
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
    // Clock frozen via loadStudlinModule's {now} option (see the identical
    // note on the test above -- t.mock.timers never actually reached the
    // sandboxed module) so declaring "evening" as the peak bucket reliably
    // differs from "now" regardless of when the suite actually runs.
    const { planBrainDumpTasks } = loadStudlinModule({ now: "2026-07-16T09:00:00" });
    const prefs = { ...DEFAULT_PREFS, peakHourBuckets: ["evening"] };
    const items = [
      { kind: "study", title: "First", durationMin: 60, immediate: false, chained: false },
      { kind: "study", title: "Second", durationMin: 30, chained: true },
    ];
    const { tasks } = planBrainDumpTasks(items, [], [], prefs);
    const first = tasks.find((t) => t.title === "First");
    const second = tasks.find((t) => t.title === "Second");
    assert.ok(first && second);
    assert.equal(second.date, first.date);
    const gap = minutesOf(second.time) - (minutesOf(first.time) + first.duration);
    assert.ok(gap >= 0 && gap <= MAX_CHAIN_GAP_MINS, `expected second to stay chained to first instead of jumping to the evening bucket, gap was ${gap}min`);
  });
});

describe("Lock-In timer checkpoint + recovery (regression: a real session was lost when the tab backgrounded mid-timer with no trace)", () => {
  test("checkpointTimerSession writes a record that getTimerCheckpoint reads back", () => {
    const { checkpointTimerSession, getTimerCheckpoint } = loadStudlinModule();
    assert.equal(getTimerCheckpoint(), null);
    checkpointTimerSession("task-1", "Study chem", 30, 300, "focus2");
    const cp = getTimerCheckpoint();
    assert.equal(cp.taskId, "task-1");
    assert.equal(cp.focusElapsedSecs, 300);
    assert.equal(cp.phase, "focus2");
  });

  test("clearTimerCheckpoint removes the record", () => {
    const { checkpointTimerSession, clearTimerCheckpoint, getTimerCheckpoint } = loadStudlinModule();
    checkpointTimerSession("task-1", "Study chem", 30, 300, "focus2");
    clearTimerCheckpoint();
    assert.equal(getTimerCheckpoint(), null);
  });

  test("resolveOrphanedCheckpoint returns null when there's no checkpoint", () => {
    const { resolveOrphanedCheckpoint } = loadStudlinModule();
    assert.equal(resolveOrphanedCheckpoint(null, [realTask()]), null);
  });

  test("resolveOrphanedCheckpoint returns null when the checkpointed task no longer exists (deleted mid-session)", () => {
    const { resolveOrphanedCheckpoint } = loadStudlinModule();
    const cp = { taskId: "gone", totalMins: 30, focusElapsedSecs: 300 };
    assert.equal(resolveOrphanedCheckpoint(cp, [realTask()]), null);
  });

  test("resolveOrphanedCheckpoint returns null when the task was already completed through another path (e.g. plain checkbox while the modal was backgrounded)", () => {
    const { resolveOrphanedCheckpoint } = loadStudlinModule();
    const cp = { taskId: "task-1", totalMins: 30, focusElapsedSecs: 300 };
    assert.equal(resolveOrphanedCheckpoint(cp, [realTask({ status: "done" })]), null);
  });

  test("resolveOrphanedCheckpoint recovers a still-pending task with the checkpointed elapsed minutes", () => {
    const { resolveOrphanedCheckpoint } = loadStudlinModule();
    const cp = { taskId: "task-1", totalMins: 30, focusElapsedSecs: 300 };
    const resolved = resolveOrphanedCheckpoint(cp, [realTask()]);
    assert.ok(resolved);
    assert.equal(resolved.task.id, "task-1");
    assert.equal(resolved.elapsedMins, 5);
  });

  test("resolveOrphanedCheckpoint never credits more than the task's own planned duration (No-Lie cap, regression: must not extrapolate forward past the last real checkpoint)", () => {
    const { resolveOrphanedCheckpoint } = loadStudlinModule();
    // Checkpoint claims 90 elapsed minutes on a task only ever planned for 30.
    const cp = { taskId: "task-1", totalMins: 30, focusElapsedSecs: 90 * 60 };
    const resolved = resolveOrphanedCheckpoint(cp, [realTask({ duration: 30 })]);
    assert.equal(resolved.elapsedMins, 30);
  });
});

describe("checkManualStudyTime (manually-picked shared-study time, regression: the propose-a-time flow used to only offer AI-suggested slots)", () => {
  test("reports no conflicts on a genuinely empty day", () => {
    const m = loadStudlinModule();
    m.localStorage.setItem("studlin-events", JSON.stringify([]));
    const result = m.checkManualStudyTime("2026-07-20", "14:00", 60);
    assert.equal(result.conflicts.length, 0);
    assert.equal(result.date, "2026-07-20");
    assert.equal(result.time, "14:00");
    assert.equal(result.duration, 60);
  });

  test("names a real overlapping event as a conflict, not just flags busy", () => {
    const m = loadStudlinModule();
    const lecture = realTask({ id: "ev-1", title: "Chem Lecture", date: "2026-07-20", time: "14:00", duration: 75 });
    m.localStorage.setItem("studlin-events", JSON.stringify([lecture]));
    // Proposed 2:30-3:30pm overlaps the 2:00-3:15pm lecture.
    const result = m.checkManualStudyTime("2026-07-20", "14:30", 60);
    assert.equal(result.conflicts.length, 1);
    assert.equal(result.conflicts[0].title, "Chem Lecture");
  });

  test("a non-overlapping event on the same day is not reported as a conflict", () => {
    const m = loadStudlinModule();
    const lecture = realTask({ id: "ev-1", title: "Chem Lecture", date: "2026-07-20", time: "09:00", duration: 60 });
    m.localStorage.setItem("studlin-events", JSON.stringify([lecture]));
    const result = m.checkManualStudyTime("2026-07-20", "14:00", 60);
    assert.equal(result.conflicts.length, 0);
  });

  test("a recurring routine occurrence on that weekday counts as a conflict too, not just literal events", () => {
    const m = loadStudlinModule();
    const dow = (new Date("2026-07-20T12:00:00").getDay() + 6) % 7; // app's Monday-first convention
    const routine = { id: "routine-gym", title: "Gym", kind: "busy", days: [dow], startTime: "19:15", duration: 60, subject: "" };
    m.localStorage.setItem("studlin-weeklyRoutine", JSON.stringify([routine]));
    m.localStorage.setItem("studlin-events", JSON.stringify([]));
    const result = m.checkManualStudyTime("2026-07-20", "19:30", 60);
    assert.equal(result.conflicts.length, 1);
    assert.equal(result.conflicts[0].title, "Gym");
  });
});

describe("scoreTask difficulty preference (regression: read a dead prefs key, so Settings' Hard First / Easy First did nothing)", () => {
  const easyTask = { priority: 500, difficulty: 100, deadline: null };
  const hardTask = { priority: 500, difficulty: 900, deadline: null };

  test("'hardFirst' (the real Settings value) scores a hard task above an otherwise-identical easy one", () => {
    const { scoreTask } = loadStudlinModule();
    const prefs = { ...DEFAULT_PREFS, difficultyPreference: "hardFirst" };
    assert.ok(scoreTask(hardTask, prefs, 0) > scoreTask(easyTask, prefs, 0));
  });

  test("'easyFirst' scores an easy task above an otherwise-identical hard one", () => {
    const { scoreTask } = loadStudlinModule();
    const prefs = { ...DEFAULT_PREFS, difficultyPreference: "easyFirst" };
    assert.ok(scoreTask(easyTask, prefs, 0) > scoreTask(hardTask, prefs, 0));
  });

  test("'balanced' (and no preference at all) stays neutral — same score regardless of difficulty", () => {
    const { scoreTask } = loadStudlinModule();
    const balanced = scoreTask(easyTask, { ...DEFAULT_PREFS, difficultyPreference: "balanced" }, 0) === scoreTask(hardTask, { ...DEFAULT_PREFS, difficultyPreference: "balanced" }, 0);
    const unset = scoreTask(easyTask, DEFAULT_PREFS, 0) === scoreTask(hardTask, DEFAULT_PREFS, 0);
    assert.ok(balanced && unset);
  });

  test("end-to-end: rebalanceDay actually reorders two same-priority, same-time tasks by declared difficulty", () => {
    const m = loadStudlinModule();
    const prefs = { ...DEFAULT_PREFS, difficultyPreference: "hardFirst" };
    const easy = realTask({ id: "easy-1", time: "10:00", priority: 500, difficulty: 100 });
    const hard = realTask({ id: "hard-1", time: "10:00", priority: 500, difficulty: 900 });
    const result = m.rebalanceDay("2026-07-20", [easy, hard], [], prefs);
    const easyAfter = result.find((e) => e.id === "easy-1");
    const hardAfter = result.find((e) => e.id === "hard-1");
    assert.ok(hardAfter.time < easyAfter.time, "the hard task should win the earlier slot under an explicit Hard First preference");
  });
});

describe("Peak-hour bucket reachability (regression: 'Morning'/'Evening' had zero overlap with the app's own default 9am-6pm window, so declaring either did nothing)", () => {
  // Frozen to 8am on the target day (well inside the 6-11am "morning"
  // bucket) -- these tests place same-day slots, and findOpenSlotFor's
  // "now floor" won't schedule in the past. Left on the real wall clock,
  // this flaked for real whenever the suite happened to run late enough in
  // the morning that under half an hour of the bucket remained (e.g. a run
  // starting at 10:32am leaves only 10:32-11:00 -- not enough room for a
  // 30-min block, so it silently fell through to the desired 16:00
  // "afternoon" slot instead and the assertion failed on the actual time
  // of day the tests happened to run, not on real scheduler behavior).
  const NOW = "2026-07-20T08:00:00";

  test("declaring 'morning' as peak actually routes a fresh task there under the default work window", () => {
    const m = loadStudlinModule({ now: NOW });
    const prefs = { ...DEFAULT_PREFS, peakHourBuckets: ["morning"] };
    const slot = m.findReliableSlotFor([], [], prefs, "2026-07-20", "16:00", 30, null, 500);
    assert.equal(m.hourBucket(slot.time), "morning");
  });

  test("a declared peak with real inferred data elsewhere still wins on a fresh task (peak is a floor, not just a fallback)", () => {
    const m = loadStudlinModule({ now: NOW });
    const log = [];
    for (let i = 0; i < 9; i++) log.push({ bucket: "evening", outcome: "done", t: Date.now() - i * 86400000 });
    log.push({ bucket: "evening", outcome: "missed", t: Date.now() });
    m.localStorage.setItem("studlin-completionLog", JSON.stringify(log));
    const prefs = { ...DEFAULT_PREFS, peakHourBuckets: ["morning"] };
    const slot = m.findReliableSlotFor([], [], prefs, "2026-07-20", "16:00", 30, null, 500);
    assert.equal(m.hourBucket(slot.time), "morning", "declared morning should still win even though evening has strong real completion data, since evening is unreachable under the default window anyway");
  });

  test("Tier 0 reflow (missed task) also reaches a declared morning peak, not just fresh placement", () => {
    const m = loadStudlinModule({ now: NOW });
    const prefs = { ...DEFAULT_PREFS, peakHourBuckets: ["morning"] };
    const today = m.dayKey();
    const missed = { id: "t1", title: "Missed", date: "2026-07-01", time: "16:00", kind: "study block", duration: 30, status: "pending", deadline: null, priority: 500, difficulty: 500 };
    const result = m.findTier0Slot(missed, [missed], [], prefs, today);
    assert.ok(result, "should find a placement");
    assert.equal(m.hourBucket(result.placement.time), "morning");
  });

  test("a widened work window (7am start) makes 'morning' reachable where the default 9am start did not", () => {
    const m = loadStudlinModule({ now: NOW });
    const narrowPrefs = { ...DEFAULT_PREFS, peakHourBuckets: ["morning"] }; // default 09:00 start
    const widePrefs = { ...DEFAULT_PREFS, workStartTime: "07:00", peakHourBuckets: ["morning"] };
    const narrowSlot = m.findReliableSlotFor([], [], narrowPrefs, "2026-07-20", "16:00", 30, null, 500);
    const wideSlot = m.findReliableSlotFor([], [], widePrefs, "2026-07-20", "16:00", 30, null, 500);
    assert.equal(m.hourBucket(narrowSlot.time), "morning", "even the default 9am start now clamps into the morning bucket");
    assert.equal(m.hourBucket(wideSlot.time), "morning");
  });
});

describe("findTier0Slot reasoning + exam-prep interval tolerance", () => {
  test("a winning candidate landing in a declared peak bucket carries a 'peak' reason", () => {
    const m = loadStudlinModule();
    const prefs = { ...DEFAULT_PREFS, peakHourBuckets: ["morning"] };
    const today = m.dayKey();
    const missed = { id: "t1", title: "Missed", date: "2026-07-01", time: "16:00", kind: "study block", duration: 30, status: "pending", deadline: null, priority: 500, difficulty: 500 };
    const result = m.findTier0Slot(missed, [missed], [], prefs, today);
    assert.ok(result.reason, "should carry a reason since it landed in a declared peak bucket");
    assert.equal(result.reason.type, "peak");
    assert.equal(result.reason.bucket, "morning");
  });

  test("exam-prep session: a reflow candidate more than the tolerance from the original date is rejected -- declines to move rather than collapsing the spacing", () => {
    const m = loadStudlinModule();
    const examPrepTask = {
      id: "t1", title: "Review 2 of 4", date: "2026-07-15", time: "16:00", kind: "study block",
      duration: 30, status: "pending", deadline: null, priority: 500, difficulty: 500,
      isExamPrepSession: true, dueEventId: "exam-1",
    };
    // today is 5 days after the task's own original date -- every
    // reachable candidate day (today..+3) is well outside +/-1 day.
    const result = m.findTier0Slot(examPrepTask, [examPrepTask], [], DEFAULT_PREFS, "2026-07-20");
    assert.equal(result, null, "should decline to reflow rather than collapse the spacing to the neighboring session");
  });

  test("exam-prep session: a reflow candidate within the tolerance window is accepted", () => {
    const m = loadStudlinModule();
    const examPrepTask = {
      id: "t1", title: "Review 2 of 4", date: "2026-07-15", time: "16:00", kind: "study block",
      duration: 30, status: "pending", deadline: null, priority: 500, difficulty: 500,
      isExamPrepSession: true, dueEventId: "exam-1",
    };
    // today is exactly 1 day after the original date -- right at the
    // default TIER0_EXAM_PREP_TOLERANCE_DAYS boundary.
    const result = m.findTier0Slot(examPrepTask, [examPrepTask], [], DEFAULT_PREFS, "2026-07-16");
    assert.ok(result, "should still find a legal placement within tolerance");
    const gap = Math.round((new Date(result.placement.date + "T12:00:00") - new Date(examPrepTask.date + "T12:00:00")) / 86400000);
    assert.ok(Math.abs(gap) <= m.TIER0_EXAM_PREP_TOLERANCE_DAYS);
  });

  test("the same far-from-original scenario succeeds for a PLAIN study block -- the tolerance is exam-prep-specific, not a general Tier 0 rule", () => {
    const m = loadStudlinModule();
    const plainTask = {
      id: "t1", title: "Regular homework", date: "2026-07-15", time: "16:00", kind: "study block",
      duration: 30, status: "pending", deadline: null, priority: 500, difficulty: 500,
    };
    const result = m.findTier0Slot(plainTask, [plainTask], [], DEFAULT_PREFS, "2026-07-20");
    assert.ok(result, "a non-exam-prep task should reflow normally across the full candidate window");
  });
});

describe("fmtMovedReasonSuffix (surfaces Tier 0's own placement reasoning on the moved-block tooltip)", () => {
  test("returns a leading-space-prefixed sentence when the event carries a movedReason", () => {
    const m = loadStudlinModule();
    const ev = { time: "18:00", movedReason: { type: "peak", bucket: "evening", tier: "hard" } };
    const suffix = m.fmtMovedReasonSuffix(ev);
    assert.ok(suffix.startsWith(" "), "must be directly appendable after a sentence ending in a period");
    assert.ok(suffix.includes("peak"));
  });

  test("returns an empty string when there's no movedReason", () => {
    const m = loadStudlinModule();
    assert.equal(m.fmtMovedReasonSuffix({ time: "18:00" }), "");
    assert.equal(m.fmtMovedReasonSuffix(null), "");
  });
});

describe("detectStrugglingBucket (proactive miss-pattern nudge)", () => {
  function seedLog(m, bucket, doneCount, missedCount) {
    const log = [];
    for (let i = 0; i < missedCount; i++) log.push({ bucket, outcome: "missed", t: Date.now() - i * 3600000 });
    for (let i = 0; i < doneCount; i++) log.push({ bucket, outcome: "done", t: Date.now() - (missedCount + i) * 3600000 });
    m.localStorage.setItem("studlin-completionLog", JSON.stringify(log));
  }

  test("flags a bucket with 4 of its last 5 entries missed", () => {
    const m = loadStudlinModule();
    seedLog(m, "evening", 1, 4);
    const result = m.detectStrugglingBucket(DEFAULT_PREFS);
    assert.ok(result, "should detect evening as struggling");
    assert.equal(result.strugglingBucket, "evening");
  });

  test("does not flag with only 3 of 5 recent misses (below the threshold)", () => {
    const m = loadStudlinModule();
    seedLog(m, "evening", 2, 3);
    assert.equal(m.detectStrugglingBucket(DEFAULT_PREFS), null);
  });

  test("does not flag with fewer than 5 recent entries (not enough data yet)", () => {
    const m = loadStudlinModule();
    seedLog(m, "evening", 0, 3);
    assert.equal(m.detectStrugglingBucket(DEFAULT_PREFS), null);
  });

  test("suggested alternative is reachable under the student's actual work hours, never the struggling bucket itself", () => {
    const m = loadStudlinModule();
    seedLog(m, "evening", 1, 4); // evening (18:00-22:00) barely overlaps the 09:00-18:00 default window
    const result = m.detectStrugglingBucket(DEFAULT_PREFS);
    assert.ok(result);
    assert.notEqual(result.suggestedBucket, "evening");
    assert.ok(["morning", "midday", "afternoon"].includes(result.suggestedBucket), "must suggest one of the buckets that actually overlaps 09:00-18:00");
  });

  test("no candidate at all when the only other reachable bucket is also struggling", () => {
    const m = loadStudlinModule();
    const log = [];
    ["evening", "morning", "midday", "afternoon"].forEach((bucket) => {
      for (let i = 0; i < 4; i++) log.push({ bucket, outcome: "missed", t: Date.now() - i * 3600000 });
      log.push({ bucket, outcome: "done", t: Date.now() - 4 * 3600000 });
    });
    m.localStorage.setItem("studlin-completionLog", JSON.stringify(log));
    // Every bucket is struggling -- the detector should still return a real
    // suggestion (the least-bad reachable option) rather than throwing.
    const result = m.detectStrugglingBucket(DEFAULT_PREFS);
    assert.ok(result === null || typeof result.suggestedBucket === "string");
  });

  test("dismissStrugglingBucket suppresses re-flagging the same bucket immediately after", () => {
    const m = loadStudlinModule();
    seedLog(m, "evening", 1, 4);
    assert.ok(m.detectStrugglingBucket(DEFAULT_PREFS), "should flag before dismissal");
    m.dismissStrugglingBucket("evening");
    assert.equal(m.detectStrugglingBucket(DEFAULT_PREFS), null, "should stay quiet right after a 'Not now'");
  });

  test("a clean track record (mostly done) never gets flagged", () => {
    const m = loadStudlinModule();
    seedLog(m, "morning", 5, 0);
    assert.equal(m.detectStrugglingBucket(DEFAULT_PREFS), null);
  });
});

describe("detectPeakHourInsight (all-time gap between declared peak and actual reliability)", () => {
  function seedLog(m, bucket, doneCount, missedCount) {
    const log = JSON.parse(m.localStorage.getItem("studlin-completionLog") || "[]");
    for (let i = 0; i < missedCount; i++) log.push({ bucket, outcome: "missed", t: Date.now() - i * 3600000 });
    for (let i = 0; i < doneCount; i++) log.push({ bucket, outcome: "done", t: Date.now() - (missedCount + i) * 3600000 });
    m.localStorage.setItem("studlin-completionLog", JSON.stringify(log));
  }

  test("returns null when nothing is declared -- nothing to correct", () => {
    const m = loadStudlinModule();
    seedLog(m, "morning", 1, 7);
    seedLog(m, "afternoon", 7, 1);
    assert.equal(m.detectPeakHourInsight({ ...DEFAULT_PREFS, peakHourBuckets: [] }), null);
  });

  test("returns null when the declared bucket has no data yet -- not a fair baseline", () => {
    const m = loadStudlinModule();
    seedLog(m, "afternoon", 8, 0); // only the non-declared bucket has data
    assert.equal(m.detectPeakHourInsight({ ...DEFAULT_PREFS, peakHourBuckets: ["morning"] }), null);
  });

  test("returns null when the gap is real but below the meaningful-difference margin", () => {
    const m = loadStudlinModule();
    seedLog(m, "morning", 6, 2); // 75%
    seedLog(m, "afternoon", 7, 1); // 87.5% -- only a 12.5pt gap, under the 15pt bar
    assert.equal(m.detectPeakHourInsight({ ...DEFAULT_PREFS, peakHourBuckets: ["morning"] }), null);
  });

  test("suggests switching when a non-declared bucket meaningfully beats the declared one", () => {
    const m = loadStudlinModule();
    seedLog(m, "morning", 3, 5); // 37.5%
    seedLog(m, "afternoon", 7, 1); // 87.5%
    const result = m.detectPeakHourInsight({ ...DEFAULT_PREFS, peakHourBuckets: ["morning"] });
    assert.ok(result, "a 50pt gap should surface a suggestion");
    assert.equal(result.currentBucket, "morning");
    assert.equal(result.suggestedBucket, "afternoon");
    assert.equal(Math.round(result.currentPct * 100), 38);
    assert.equal(Math.round(result.suggestedPct * 100), 88);
  });

  test("never suggests a bucket outside the student's actual work hours, even with a huge gap", () => {
    const m = loadStudlinModule();
    seedLog(m, "morning", 0, 8); // 0%
    seedLog(m, "evening", 8, 0); // 100%, but 18:00-22:00 barely overlaps the default 09:00-18:00 window
    const result = m.detectPeakHourInsight({ ...DEFAULT_PREFS, peakHourBuckets: ["morning"] });
    assert.equal(result, null, "evening isn't reachable under the default work window, so there's nothing legal to suggest");
  });

  test("dismissPeakHourInsight suppresses re-suggesting the same bucket right after", () => {
    const m = loadStudlinModule();
    seedLog(m, "morning", 3, 5);
    seedLog(m, "afternoon", 7, 1);
    const prefs = { ...DEFAULT_PREFS, peakHourBuckets: ["morning"] };
    const first = m.detectPeakHourInsight(prefs);
    assert.ok(first, "should suggest before dismissal");
    m.dismissPeakHourInsight(first.suggestedBucket);
    assert.equal(m.detectPeakHourInsight(prefs), null, "should stay quiet right after a 'Not now'");
  });
});

describe("getBucketReliability + applyCheckInRating (session-quality signal, regression: a 'shaky' self-rated completion used to count identically to a great one)", () => {
  test("a rated 'shaky' completion counts as partial credit, not full credit like an unrated or 'solid' one", () => {
    const m = loadStudlinModule();
    const log = [];
    // 8 samples, 4 rated 'shaky', 4 unrated -- all outcome 'done'.
    for (let i = 0; i < 4; i++) log.push({ bucket: "morning", outcome: "done", t: Date.now() - i * 1000, rating: "shaky" });
    for (let i = 4; i < 8; i++) log.push({ bucket: "morning", outcome: "done", t: Date.now() - i * 1000 });
    m.localStorage.setItem("studlin-completionLog", JSON.stringify(log));
    // 4 unrated (1.0 each) + 4 shaky (0.5 each) = 6/8 = 0.75, not 1.0.
    assert.equal(m.getBucketReliability("morning", undefined), 0.75);
  });

  test("all-unrated or all-'solid' data scores exactly as before (no regression for existing/historical entries)", () => {
    const m = loadStudlinModule();
    const log = [];
    for (let i = 0; i < 6; i++) log.push({ bucket: "morning", outcome: "done", t: Date.now() - i * 1000 });
    for (let i = 0; i < 2; i++) log.push({ bucket: "morning", outcome: "missed", t: Date.now() - i * 1000 });
    m.localStorage.setItem("studlin-completionLog", JSON.stringify(log));
    assert.equal(m.getBucketReliability("morning", undefined), 0.75); // 6/8, unchanged formula
  });

  test("applyCheckInRating upgrades this session's own log row instead of appending a new one (regression: would have double-counted the same completion)", () => {
    const m = loadStudlinModule();
    m.localStorage.setItem("studlin-completionLog", JSON.stringify([
      { bucket: "morning", outcome: "done", t: 1000, taskId: "t1" },
    ]));
    m.applyCheckInRating("t1", "shaky");
    const log = JSON.parse(m.localStorage.getItem("studlin-completionLog"));
    assert.equal(log.length, 1, "must upgrade the existing row, not append a second one");
    assert.equal(log[0].rating, "shaky");
  });

  test("applyCheckInRating targets the most recent matching row when a task was completed more than once (uncrossed and redone)", () => {
    const m = loadStudlinModule();
    m.localStorage.setItem("studlin-completionLog", JSON.stringify([
      { bucket: "morning", outcome: "done", t: 1000, taskId: "t1" },
      { bucket: "afternoon", outcome: "done", t: 2000, taskId: "t1" },
    ]));
    m.applyCheckInRating("t1", "shaky");
    const log = JSON.parse(m.localStorage.getItem("studlin-completionLog"));
    assert.equal(log[0].rating, undefined, "the older row for this task must be left alone");
    assert.equal(log[1].rating, "shaky", "the most recent row for this task should get the rating");
  });

  test("applyCheckInRating no-ops harmlessly when no matching row exists", () => {
    const m = loadStudlinModule();
    m.localStorage.setItem("studlin-completionLog", JSON.stringify([{ bucket: "morning", outcome: "done", t: 1000, taskId: "other-task" }]));
    m.applyCheckInRating("nonexistent", "shaky");
    const log = JSON.parse(m.localStorage.getItem("studlin-completionLog"));
    assert.equal(log.length, 1);
    assert.equal(log[0].rating, undefined);
  });
});

describe("computeExamReadiness (fuses days-to-exam + linked review-session completion + confidence trend into one signal)", () => {
  const TODAY = "2026-07-20";
  function exam(overrides) {
    return { id: "exam-1", title: "Chem Midterm", date: "2026-07-27", kind: "exam", confidenceLog: [], ...overrides };
  }
  function session(overrides) {
    return { id: "s1", kind: "study block", dueEventId: "exam-1", status: "pending", date: "2026-07-21", ...overrides };
  }

  test("returns null for a non-exam event", () => {
    const m = loadStudlinModule();
    assert.equal(m.computeExamReadiness(session({ kind: "study block" }), [], TODAY), null);
  });

  test("returns null once the exam date has already passed -- readiness is a before-the-exam question", () => {
    const m = loadStudlinModule();
    assert.equal(m.computeExamReadiness(exam({ date: "2026-07-19" }), [], TODAY), null);
  });

  test("'no-data' when nothing is linked to this exam yet", () => {
    const m = loadStudlinModule();
    const result = m.computeExamReadiness(exam(), [], TODAY);
    assert.equal(result.state, "no-data");
  });

  test("'behind' when a linked review session is overdue and still pending", () => {
    const m = loadStudlinModule();
    const events = [session({ id: "s1", date: "2026-07-18", status: "pending" })]; // before TODAY, never done
    const result = m.computeExamReadiness(exam(), events, TODAY);
    assert.equal(result.state, "behind");
  });

  test("'at-risk' when the most recent confidence rating is 'shaky' and the exam is close", () => {
    const m = loadStudlinModule();
    const events = [session({ id: "s1", date: "2026-07-19", status: "done" })]; // done, not overdue-missed
    const result = m.computeExamReadiness(exam({ date: "2026-07-22", confidenceLog: ["solid", "shaky"] }), events, TODAY);
    assert.equal(result.state, "at-risk");
  });

  test("'behind' when completion is under 50% with the exam approaching, even with no bad confidence signal", () => {
    const m = loadStudlinModule();
    const events = [
      session({ id: "s1", date: "2026-07-19", status: "done" }), // 1/3 done, none overdue (today is 07-20)
      session({ id: "s2", date: "2026-07-21", status: "pending" }),
      session({ id: "s3", date: "2026-07-22", status: "pending" }),
    ];
    const result = m.computeExamReadiness(exam({ date: "2026-07-23" }), events, TODAY);
    assert.equal(result.state, "behind");
  });

  test("'on-track' when most (>=80%) linked sessions are done", () => {
    const m = loadStudlinModule();
    const events = [
      session({ id: "s1", date: "2026-07-15", status: "done" }),
      session({ id: "s2", date: "2026-07-17", status: "done" }),
      session({ id: "s3", date: "2026-07-19", status: "done" }),
      session({ id: "s4", date: "2026-07-21", status: "pending" }),
    ];
    const result = m.computeExamReadiness(exam(), events, TODAY);
    assert.equal(result.state, "on-track");
    assert.equal(result.sessionsDone, 3);
    assert.equal(result.sessionsTotal, 4);
  });

  test("on-track sentence mentions feeling solid when the most recent rating is 'solid'", () => {
    const m = loadStudlinModule();
    const events = [session({ id: "s1", date: "2026-07-15", status: "done" })];
    const result = m.computeExamReadiness(exam({ confidenceLog: ["solid"] }), events, TODAY);
    assert.equal(result.state, "on-track");
    assert.ok(result.sentence.toLowerCase().includes("solid"));
  });

  test("folds the most recent practice-quiz score into the sentence without changing the state", () => {
    const m = loadStudlinModule();
    // Same 'behind' fixture as above -- a single quiz score must not
    // override a pattern already established by completion/confidence.
    const events = [session({ id: "s1", date: "2026-07-18", status: "pending" })];
    const withoutQuiz = m.computeExamReadiness(exam(), events, TODAY);
    const withQuiz = m.computeExamReadiness(exam({ quizScores: [{ score: 2, total: 10, at: 1 }] }), events, TODAY);
    assert.equal(withoutQuiz.state, "behind");
    assert.equal(withQuiz.state, "behind", "one quiz score should never override the completion/confidence-driven state");
    assert.ok(withQuiz.sentence.includes("2/10"));
    assert.equal(withQuiz.quizScore.score, 2);
  });

  test("nudges toward taking a practice quiz when the exam is close and none has been taken", () => {
    const m = loadStudlinModule();
    const events = [session({ id: "s1", date: "2026-07-15", status: "done" })];
    const result = m.computeExamReadiness(exam({ date: "2026-07-22" }), events, TODAY); // 2 days out
    assert.ok(result.sentence.toLowerCase().includes("no practice quiz"));
  });

  test("does not nudge about a missing practice quiz when the exam is still far off", () => {
    const m = loadStudlinModule();
    const events = [session({ id: "s1", date: "2026-07-15", status: "done" })];
    const result = m.computeExamReadiness(exam(), events, TODAY); // default date is 7 days out
    assert.ok(!result.sentence.toLowerCase().includes("no practice quiz"));
  });
});

describe("canGenQuiz / recordQuizGen (free-tier practice-quiz limit)", () => {
  test("Free plan can generate up to QUIZ_GEN_LIMIT quizzes this month, then is blocked", () => {
    const m = loadStudlinModule();
    m.setPlanLS("Free");
    for (let i = 0; i < m.QUIZ_GEN_LIMIT; i++) {
      assert.equal(m.canGenQuiz(), true, `should allow generation #${i + 1}`);
      m.recordQuizGen();
    }
    assert.equal(m.canGenQuiz(), false, "should block once the monthly limit is reached");
  });

  test("Pro/Max plans are never limited", () => {
    const m = loadStudlinModule();
    m.setPlanLS("Pro");
    for (let i = 0; i < m.QUIZ_GEN_LIMIT + 5; i++) {
      assert.equal(m.canGenQuiz(), true);
      m.recordQuizGen();
    }
  });
});

describe("weekPrepLoad weekend capacity (regression: disabled weekend counted as 0 capacity here but full weekday hours in the real scheduler, so this warning could contradict what the scheduler would actually do)", () => {
  test("a disabled weekend still counts as real capacity, matching getWorkWindowMinsFor", () => {
    const m = loadStudlinModule();
    const MONDAY = "2026-09-07"; // Mon-Fri 2026-09-07..11, Sat/Sun 09-12/13
    const examEvent = { id: "exam-x", date: "2026-09-20" };
    // Old bug: weekday-only capacity = 5 * 540min = 2700min -> 1900/2700 = 0.704 (pressured).
    // Fixed: weekend counts as full 540min/day too = 7*540 = 3780min -> 1900/3780 = 0.503 (not pressured).
    const events = ["2026-09-07", "2026-09-08", "2026-09-09", "2026-09-10", "2026-09-11"].map((dk, i) => ({
      id: "load-" + i, date: dk, time: "09:00", kind: "study block", duration: 380, status: "pending",
    }));
    const result = m.weekPrepLoad(MONDAY, examEvent, events, DEFAULT_PREFS);
    assert.equal(result.isPressured, false, "with weekend hours correctly counted as real capacity, this load should read as comfortably under the pressure threshold");
  });
});

describe("shouldShowWeekBalanceNudge / dismissWeekBalanceNudge (proactive 'Balance my week' banner cooldown)", () => {
  test("shows by default with no prior dismissal", () => {
    const m = loadStudlinModule();
    assert.equal(m.shouldShowWeekBalanceNudge(), true);
  });

  test("stays quiet right after a dismissal", () => {
    const m = loadStudlinModule();
    m.dismissWeekBalanceNudge();
    assert.equal(m.shouldShowWeekBalanceNudge(), false);
  });
});

describe("computeBusyWindowsPayload (privacy-scoped shared free/busy for Studlin Match)", () => {
  test("only ever emits busy time intervals, never titles/kinds/subjects (the whole privacy promise of the feature)", () => {
    const m = loadStudlinModule();
    const events = [realTask({ id: "t1", date: "2026-07-21", time: "14:00", title: "Secret therapy appointment", subject: "Personal" })];
    const payload = m.computeBusyWindowsPayload(events, [], DEFAULT_PREFS, "2026-07-20");
    const entry = payload.find((iv) => iv.date === "2026-07-21");
    assert.ok(entry, "the busy interval should exist");
    const keys = Object.keys(entry).sort();
    assert.deepEqual(keys, ["date", "e", "s"], "must never carry title/subject/kind or any other identifying field");
  });

  test("covers exactly BUSY_WINDOW_DAYS_AHEAD days starting today, matching what findSharedStudyWindow can actually search", () => {
    const m = loadStudlinModule();
    const farOut = m.dayKey(new Date(Date.parse("2026-07-20") + (m.BUSY_WINDOW_DAYS_AHEAD + 2) * 86400000));
    const events = [realTask({ id: "t1", date: farOut, time: "14:00" })];
    const payload = m.computeBusyWindowsPayload(events, [], DEFAULT_PREFS, "2026-07-20");
    assert.equal(payload.find((iv) => iv.date === farOut), undefined, "a task past the published window shouldn't appear in the payload");
  });

  test("produces no intervals at all on a genuinely empty calendar", () => {
    const m = loadStudlinModule();
    const payload = m.computeBusyWindowsPayload([], [], DEFAULT_PREFS, "2026-07-20");
    assert.equal(payload.length, 0);
  });
});

describe("layoutDayEvents (Weekly grid same-day column layout)", () => {
  test("two genuinely back-to-back items (no real time gap) land in the same column, not split side-by-side", () => {
    const m = loadStudlinModule();
    const a = realTask({ id: "a", time: "10:00", duration: 30 });
    const b = realTask({ id: "b", time: "10:30", duration: 30 });
    const laidOut = m.layoutDayEvents([a, b]);
    const la = laidOut.find((x) => x.ev.id === "a");
    const lb = laidOut.find((x) => x.ev.id === "b");
    assert.equal(la.totalCols, 1);
    assert.equal(lb.totalCols, 1);
  });

  test("two genuinely overlapping items split into separate columns", () => {
    const m = loadStudlinModule();
    const a = realTask({ id: "a", time: "10:00", duration: 30 });
    const b = realTask({ id: "b", time: "10:15", duration: 30 });
    const laidOut = m.layoutDayEvents([a, b]);
    const la = laidOut.find((x) => x.ev.id === "a");
    const lb = laidOut.find((x) => x.ev.id === "b");
    assert.equal(la.totalCols, 2);
    assert.notEqual(la.col, lb.col);
  });
});

describe("computeEventBlockHeightPx (Weekly grid block height, regression: a short block's minimum-visibility floor could visually overlap the next block stacked right after it)", () => {
  const PX_PER_HR = 48;

  test("with no next-item constraint, a short block still gets the minimum-visibility floor", () => {
    const m = loadStudlinModule();
    // 10 minutes at 48px/hr is 8px, well under the 22px floor.
    assert.equal(m.computeEventBlockHeightPx(10, null, PX_PER_HR), 22);
  });

  test("a duration long enough to already exceed the floor is left untouched when there's room", () => {
    const m = loadStudlinModule();
    assert.equal(m.computeEventBlockHeightPx(60, 90, PX_PER_HR), 48); // 60min = 48px, well under the 90min gap
  });

  test("the exact regression from the screenshot: a 10-min block 15 minutes before the next item no longer bleeds into it", () => {
    const m = loadStudlinModule();
    // Real bug: "Work on Studlin" 7:15pm/10m, "Look at college transfer
    // option" 7:30pm/20m -- a 15-minute real gap. Old code always used the
    // 22px floor (924px-946px), overlapping the next block's 936px top.
    const heightPx = m.computeEventBlockHeightPx(10, 15, PX_PER_HR);
    assert.equal(heightPx, 12, "should be capped to the real 15-minute gap (12px), not the 22px floor");
    assert.ok(heightPx <= 15 * (PX_PER_HR / 60), "rendered height must never exceed the real gap to the next block");
  });

  test("never collapses to zero or negative height even with almost no gap", () => {
    const m = loadStudlinModule();
    const heightPx = m.computeEventBlockHeightPx(10, 1, PX_PER_HR);
    assert.ok(heightPx >= 4, "should still render a thin sliver, not disappear entirely");
  });
});

describe("computeDayViewScale (Day view's smart viewport: fit the whole day, scroll to the first task)", () => {
  const WORK_WINDOW = { start: 9 * 60, end: 18 * 60 };

  test("no events falls back to the plain work-hours window", () => {
    const m = loadStudlinModule();
    const r = m.computeDayViewScale([], WORK_WINDOW, 700);
    assert.equal(r.spanStart, WORK_WINDOW.start - 30);
    assert.equal(r.spanEnd, WORK_WINDOW.end + 30);
  });

  test("an event earlier than the work window widens the span to include it", () => {
    const m = loadStudlinModule();
    const r = m.computeDayViewScale([{ time: "06:00", duration: 30 }], WORK_WINDOW, 700);
    assert.equal(r.spanStart, 6 * 60 - 30);
  });

  test("an event later than the work window widens the span to include it", () => {
    const m = loadStudlinModule();
    const r = m.computeDayViewScale([{ time: "22:00", duration: 60 }], WORK_WINDOW, 700);
    assert.equal(r.spanEnd, 23 * 60 + 30);
  });

  test("pxPerHr is computed to fit the whole span in the given viewport height", () => {
    const m = loadStudlinModule();
    const r = m.computeDayViewScale([], WORK_WINDOW, 700);
    const spanHrs = (r.spanEnd - r.spanStart) / 60;
    assert.equal(Math.round(r.pxPerHr * spanHrs), 700);
  });

  test("pxPerHr never drops below the legibility floor even for a very short viewport", () => {
    const m = loadStudlinModule();
    const r = m.computeDayViewScale([{ time: "10:00", duration: 30 }], WORK_WINDOW, 50);
    assert.equal(r.pxPerHr, m.DAY_VIEW_MIN_PX_HR);
  });

  test("pxPerHr never exceeds the max even for a very tall viewport with a short day", () => {
    const m = loadStudlinModule();
    const r = m.computeDayViewScale([], WORK_WINDOW, 5000);
    assert.equal(r.pxPerHr, m.DAY_VIEW_MAX_PX_HR);
  });

  test("scrollToMin lands 30 minutes before the first real task, not at the very edge of the span", () => {
    const m = loadStudlinModule();
    const r = m.computeDayViewScale([{ time: "10:00", duration: 30 }, { time: "14:00", duration: 60 }], WORK_WINDOW, 700);
    assert.equal(r.scrollToMin, 10 * 60 - 30);
  });

  test("with no events, scrollToMin is just the span start -- nothing to scroll ahead to", () => {
    const m = loadStudlinModule();
    const r = m.computeDayViewScale([], WORK_WINDOW, 700);
    assert.equal(r.scrollToMin, r.spanStart);
  });

  test("events with no time (checklist-style) are ignored for span/scroll purposes", () => {
    const m = loadStudlinModule();
    const r = m.computeDayViewScale([{ time: "", duration: 30 }, { duration: 30 }], WORK_WINDOW, 700);
    assert.equal(r.spanStart, WORK_WINDOW.start - 30);
    assert.equal(r.scrollToMin, r.spanStart);
  });
});

describe("Studlin Prep data layer (practice exams: persisted/retakeable question sets, unlike the old throwaway quiz overlays)", () => {
  test("createPracticeExam persists a new set linked to an exam", () => {
    const m = loadStudlinModule();
    const pe = m.createPracticeExam("Ch. 4-6 Quiz", "Chemistry", "exam-1", [
      { q: "q1", choices: ["a", "b", "c", "d"], answerIndex: 0, topic: "Bonding" },
    ]);
    assert.equal(pe.examEventId, "exam-1");
    assert.equal(pe.attempts.length, 0);
    const all = JSON.parse(m.localStorage.getItem("studlin-practiceExams"));
    assert.equal(all.length, 1);
    assert.equal(all[0].id, pe.id);
  });

  test("multiple practice exams accumulate rather than overwrite", () => {
    const m = loadStudlinModule();
    m.createPracticeExam("Quiz A", "Chemistry", "exam-1", []);
    m.createPracticeExam("Quiz B", "Chemistry", "exam-1", []);
    const all = JSON.parse(m.localStorage.getItem("studlin-practiceExams"));
    assert.equal(all.length, 2);
  });

  test("recordPracticeExamAttempt appends an attempt without touching the question set", () => {
    const m = loadStudlinModule();
    const pe = m.createPracticeExam("Ch. 4-6 Quiz", "Chemistry", "exam-1", [
      { q: "q1", choices: ["a", "b", "c", "d"], answerIndex: 0, topic: "Bonding" },
    ]);
    const updated = m.recordPracticeExamAttempt(pe.id, 7, 10, ["Bonding"]);
    assert.equal(updated.attempts.length, 1);
    assert.equal(updated.attempts[0].score, 7);
    assert.equal(updated.questions.length, 1, "retaking should never mutate the underlying question set");
  });

  test("a second attempt on the same set accumulates attempt history, doesn't replace it", () => {
    const m = loadStudlinModule();
    const pe = m.createPracticeExam("Ch. 4-6 Quiz", "Chemistry", "exam-1", []);
    m.recordPracticeExamAttempt(pe.id, 5, 10, []);
    const updated = m.recordPracticeExamAttempt(pe.id, 8, 10, []);
    assert.equal(updated.attempts.length, 2);
  });

  test("wrongTopicsFor returns only the topics of missed questions", () => {
    const m = loadStudlinModule();
    const questions = [
      { q: "q1", answerIndex: 0, topic: "Bonding" },
      { q: "q2", answerIndex: 1, topic: "Thermo" },
      { q: "q3", answerIndex: 2, topic: "Kinetics" },
    ];
    // Missed q1 (answered 1, wanted 0) and q3 (answered 0, wanted 2); got q2 right.
    const result = m.wrongTopicsFor(questions, [1, 1, 0]);
    assert.equal(JSON.stringify(result), JSON.stringify(["Bonding", "Kinetics"]));
  });

  test("wrongTopicsFor deduplicates repeated topics, first-missed order preserved", () => {
    const m = loadStudlinModule();
    const questions = [
      { q: "q1", answerIndex: 0, topic: "Bonding" },
      { q: "q2", answerIndex: 0, topic: "Thermo" },
      { q: "q3", answerIndex: 0, topic: "Bonding" },
    ];
    const result = m.wrongTopicsFor(questions, [1, 1, 1]);
    assert.equal(JSON.stringify(result), JSON.stringify(["Bonding", "Thermo"]));
  });

  test("wrongTopicsFor returns an empty list for a perfect score", () => {
    const m = loadStudlinModule();
    const questions = [{ q: "q1", answerIndex: 0, topic: "Bonding" }];
    assert.equal(JSON.stringify(m.wrongTopicsFor(questions, [0])), "[]");
  });
});

describe("buildSpacedSessionPreviews (shared by deck reviews and practice-exam scheduling)", () => {
  test("returns one preview per requested session, sorted ascending toward the exam date", () => {
    const m = loadStudlinModule({ now: "2026-07-20T09:00:00" });
    const sessions = m.buildSpacedSessionPreviews("2026-08-15", "Chemistry", 4);
    assert.equal(sessions.length, 4);
    for (let i = 1; i < sessions.length; i++) {
      assert.ok(sessions[i].date >= sessions[i - 1].date);
    }
    assert.ok(sessions[sessions.length - 1].date < "2026-08-15", "last session should still land before the exam itself");
  });

  test("an explicit duration overrides the suggestDurationFor/default fallback", () => {
    const m = loadStudlinModule({ now: "2026-07-20T09:00:00" });
    const sessions = m.buildSpacedSessionPreviews("2026-08-15", "Chemistry", 2, 45);
    assert.ok(sessions.every(s => s.duration === 45));
  });
});

describe("reoptimizeAttackChain (Dashboard Master List's 're-optimize' action)", () => {
  test("removes pending sessions and reschedules the same total minutes fresh", () => {
    const m = loadStudlinModule({ now: "2026-07-20T09:00:00" });
    const events = [
      { id: "a", attackChainId: "c1", title: "Term Paper", deadline: "2026-09-28", priority: 5, difficulty: 5, status: "done", duration: 90, timeSpent: 90 },
      { id: "b", attackChainId: "c1", title: "Term Paper", deadline: "2026-09-28", priority: 5, difficulty: 5, status: "pending", duration: 90, date: "2026-07-25", time: "10:00" },
      { id: "c", attackChainId: "c1", title: "Term Paper", deadline: "2026-09-28", priority: 5, difficulty: 5, status: "pending", duration: 60, date: "2026-07-26", time: "10:00" },
    ];
    m.localStorage.setItem("studlin-events", JSON.stringify(events));
    const result = m.reoptimizeAttackChain("c1");
    assert.equal(result, true);
    const after = JSON.parse(m.localStorage.getItem("studlin-events"));
    assert.equal(after.find(e => e.id === "a").status, "done", "already-done sessions must never be touched");
    const pending = after.filter(e => e.attackChainId === "c1" && e.status === "pending");
    assert.equal(pending.reduce((s, e) => s + e.duration, 0), 150, "total pending minutes should be preserved across the reschedule");
    assert.ok(!pending.some(e => e.id === "b" || e.id === "c"), "old pending sessions should be replaced, not left in place alongside new ones");
  });

  test("a chain with nothing pending (fully done) is a no-op, returns false", () => {
    const m = loadStudlinModule();
    m.localStorage.setItem("studlin-events", JSON.stringify([{ id: "a", attackChainId: "c1", status: "done", duration: 90 }]));
    assert.equal(m.reoptimizeAttackChain("c1"), false);
  });

  test("a chain id that matches nothing is also a no-op, not a crash", () => {
    const m = loadStudlinModule();
    m.localStorage.setItem("studlin-events", JSON.stringify([{ id: "a", attackChainId: "c1", status: "pending", duration: 90 }]));
    assert.equal(m.reoptimizeAttackChain("ghost-chain"), false);
  });
});

describe("computeOutlineRemainingMins (outline-scoped extrapolation -- checked items are the primary signal)", () => {
  test("no outline (or an empty one) returns null, so callers fall back to the original whole-task percent mechanic", () => {
    const m = loadStudlinModule();
    assert.equal(m.computeOutlineRemainingMins(null, 30, 50), null);
    assert.equal(m.computeOutlineRemainingMins(undefined, 30, 50), null);
    assert.equal(m.computeOutlineRemainingMins([], 30, 50), null);
  });

  test("more checked-off items means less estimated remaining time for the same elapsed minutes", () => {
    const m = loadStudlinModule();
    const fewDone = [{ done: true }, { done: false }, { done: false }, { done: false }];
    const moreDone = [{ done: true }, { done: true }, { done: true }, { done: false }];
    const a = m.computeOutlineRemainingMins(fewDone, 60, 50);
    const b = m.computeOutlineRemainingMins(moreDone, 60, 50);
    assert.ok(b < a, "having 3 of 4 items checked off should extrapolate less remaining work than having 1 of 4");
  });

  test("a higher current-item percent (same checked count) also lowers the remaining estimate", () => {
    const m = loadStudlinModule();
    const outline = [{ done: true }, { done: false }, { done: false }];
    const low = m.computeOutlineRemainingMins(outline, 60, 10);
    const high = m.computeOutlineRemainingMins(outline, 60, 90);
    assert.ok(high < low);
  });

  test("everything checked off still returns the minimum floor, not zero -- a small wrap-up block, same floor the original mechanic already used", () => {
    const m = loadStudlinModule();
    const outline = [{ done: true }, { done: true }];
    assert.equal(m.computeOutlineRemainingMins(outline, 40, 50), 10);
  });

  test("result is always clamped within [10,90], same bounds as the original whole-task mechanic", () => {
    const m = loadStudlinModule();
    const barelyStarted = [{ done: false }, { done: false }, { done: false }, { done: false }, { done: false }];
    const result = m.computeOutlineRemainingMins(barelyStarted, 45, 2);
    assert.ok(result >= 10 && result <= 90);
  });

  test("rounds to the nearest 5 minutes", () => {
    const m = loadStudlinModule();
    const outline = [{ done: true }, { done: false }, { done: false }];
    const result = m.computeOutlineRemainingMins(outline, 47, 33);
    assert.equal(result % 5, 0);
  });
});

describe("One-tap block actions: findLaterTodaySlot / findNotTodaySlot (Friction & Control Pass rule 3)", () => {
  const PREFS = { workStartTime: "09:00", workEndTime: "18:00" };
  const task = (overrides) => ({ id: "t1", title: "Study", date: "2026-07-20", time: "16:00", duration: 30, deadline: null, ...overrides });

  test("findLaterTodaySlot finds a legal slot later the same day", () => {
    const m = loadStudlinModule({ now: "2026-07-20T10:00:00" });
    const t = task();
    const slot = m.findLaterTodaySlot(t, [t], [], PREFS, "2026-07-20", 10 * 60);
    assert.ok(slot, "should find a slot");
    assert.equal(slot.date, "2026-07-20", "must stay on the same day -- that's the whole point of 'later today'");
  });

  test("findLaterTodaySlot returns null (not tomorrow) when today genuinely has no room left", () => {
    // 19:50 is inside the same-day catch-up window (workEndTime 18:00 + 2hr
    // buffer = 20:00), not just past normal work hours -- dayHasRoomFor now
    // considers that window too (same allowance findOpenSlotFor already
    // had), so the "genuinely no room" case has to exhaust the catch-up
    // window as well, not just workEndTime, to still prove this returns
    // null instead of quietly using catch-up time that doesn't exist.
    const m = loadStudlinModule({ now: "2026-07-20T19:50:00" });
    const t = task();
    const slot = m.findLaterTodaySlot(t, [t], [], PREFS, "2026-07-20", 19 * 60 + 50);
    assert.equal(slot, null, "must never silently roll into tomorrow -- that's what 'Not today' is for, not a fallback here");
  });

  test("findNotTodaySlot places the task on a future day, never today", () => {
    const m = loadStudlinModule({ now: "2026-07-20T10:00:00" });
    const t = task();
    const slot = m.findNotTodaySlot(t, [t], [], PREFS, "2026-07-20");
    assert.ok(slot, "should find a slot");
    assert.ok(slot.date > "2026-07-20", "must never land back on today");
  });

  test("findNotTodaySlot respects the task's own deadline -- returns null rather than blow past it", () => {
    const m = loadStudlinModule({ now: "2026-07-20T10:00:00" });
    const t = task({ deadline: "2026-07-20" });
    const slot = m.findNotTodaySlot(t, [t], [], PREFS, "2026-07-20");
    assert.equal(slot, null, "moving to tomorrow would blow a deadline that's today -- must refuse, not silently violate it");
  });

  test("both actions exclude the task's own current event from the conflict check (rescheduling itself shouldn't collide with itself)", () => {
    const m = loadStudlinModule({ now: "2026-07-20T10:00:00" });
    const t = task();
    // Only event in the list is the task itself -- if it weren't excluded
    // from the occupied-slot check, it would collide with its own current
    // slot and findLaterTodaySlot/findNotTodaySlot would come back null.
    assert.ok(m.findLaterTodaySlot(t, [t], [], PREFS, "2026-07-20", 10 * 60) !== null);
    assert.ok(m.findNotTodaySlot(t, [t], [], PREFS, "2026-07-20") !== null);
  });
});

describe("isTimerEligible (regression: the missed-task nudge fired for fixed commitments like Gym that have no Begin/Lock-In flow at all, so it could never be satisfied)", () => {
  test("a real study block with a duration is eligible", () => {
    const m = loadStudlinModule();
    assert.equal(m.isTimerEligible(realTask({ kind: "study block", duration: 30 })), true);
  });

  test("a duration-bearing deadline (a real assignment block) is eligible", () => {
    const m = loadStudlinModule();
    assert.equal(m.isTimerEligible(dueDateMarker({ duration: 45 })), true);
  });

  test("a fixed commitment (busy block, e.g. Gym) is never eligible -- this is the actual regression", () => {
    const m = loadStudlinModule();
    assert.equal(m.isTimerEligible(realTask({ title: "Gym", kind: "busy block", duration: 60 })), false);
  });

  test("class, exam, and reminder kinds are never eligible", () => {
    const m = loadStudlinModule();
    assert.equal(m.isTimerEligible(realTask({ kind: "class", duration: 50 })), false);
    assert.equal(m.isTimerEligible(realTask({ kind: "exam", duration: 60 })), false);
    assert.equal(m.isTimerEligible(realTask({ kind: "reminder", duration: 5 })), false);
  });

  test("a duration-less due-date marker (a syllabus-scanned fact, not an appointment) is never eligible", () => {
    const m = loadStudlinModule();
    assert.equal(m.isTimerEligible(dueDateMarker({ duration: null })), false);
  });

  test("a checklist item is never eligible even if it somehow carries a duration", () => {
    const m = loadStudlinModule();
    assert.equal(m.isTimerEligible(realTask({ checklist: true, duration: 30 })), false);
  });
});

describe("computeAttackBlockStartDate (Attack Block gate: backward-schedule the latest responsible start, not 'probe now regardless of deadline distance')", () => {
  test("returns null when either input is missing -- nothing to compute against", () => {
    const m = loadStudlinModule();
    assert.equal(m.computeAttackBlockStartDate(null, 600, "2026-07-20"), null);
    assert.equal(m.computeAttackBlockStartDate("2026-09-01", null, "2026-07-20"), null);
    assert.equal(m.computeAttackBlockStartDate("2026-09-01", 0, "2026-07-20"), null);
  });

  test("a genuinely far-off deadline with real effort produces a start date well before the deadline, not today", () => {
    const m = loadStudlinModule();
    // A ~20-hour paper (1200 min), due in 10 weeks.
    const result = m.computeAttackBlockStartDate("2026-09-28", 1200, "2026-07-20");
    assert.ok(result.startDate > "2026-07-20", "should not start today for a deadline this far out");
    assert.ok(result.startDate < "2026-09-28", "should still start well before the deadline");
    assert.equal(result.compressed, false);
  });

  test("finishByDate sits ATTACK_BLOCK_FINISH_BUFFER_DAYS before the real deadline, not on it", () => {
    const m = loadStudlinModule();
    const result = m.computeAttackBlockStartDate("2026-09-28", 1200, "2026-07-20");
    const gap = Math.round((new Date("2026-09-28T12:00:00") - new Date(result.finishByDate + "T12:00:00")) / 86400000);
    assert.equal(gap, m.ATTACK_BLOCK_FINISH_BUFFER_DAYS);
  });

  test("a large estimate needing more weeks than the deadline allows clamps to today, honestly, instead of a start date already in the past", () => {
    const m = loadStudlinModule();
    // A 40-hour project (2400 min) due in only 10 days -- the padded,
    // paced plan mathematically can't fit before the deadline.
    const result = m.computeAttackBlockStartDate("2026-07-30", 2400, "2026-07-20");
    assert.equal(result.startDate, "2026-07-20");
    assert.equal(result.compressed, true, "should honestly flag that there's no real runway left, not silently propose a past date");
  });

  test("a small estimate close to its deadline starts essentially right away", () => {
    const m = loadStudlinModule();
    // A 2-hour reading response (120 min) due in 5 days.
    const result = m.computeAttackBlockStartDate("2026-07-25", 120, "2026-07-20");
    assert.equal(result.startDate, "2026-07-20");
  });

  test("a bigger estimate needs a start date further back than a smaller one for the same deadline", () => {
    const m = loadStudlinModule();
    const smallProject = m.computeAttackBlockStartDate("2026-10-01", 300, "2026-07-20"); // 5 hours
    const bigProject = m.computeAttackBlockStartDate("2026-10-01", 1800, "2026-07-20"); // 30 hours
    assert.ok(bigProject.startDate < smallProject.startDate, "more work should push the responsible start date earlier");
  });
});

describe("computeAttackBlockRampOffsets (Attack Block follow-up pacing: back-weighted ramp, not pack-from-today)", () => {
  test("a single chunk always targets today (offset 0) -- nothing to ramp with only one session", () => {
    const m = loadStudlinModule();
    assert.equal(JSON.stringify(m.computeAttackBlockRampOffsets(1, 30)), "[0]");
    assert.equal(JSON.stringify(m.computeAttackBlockRampOffsets(1, null)), "[0]");
  });

  test("no runway (no deadline) falls back to tight day-by-day packing", () => {
    const m = loadStudlinModule();
    assert.equal(JSON.stringify(m.computeAttackBlockRampOffsets(4, null)), "[0,1,2,3]");
  });

  test("a runway too tight to give every chunk its own day falls back to tight packing", () => {
    const m = loadStudlinModule();
    assert.equal(JSON.stringify(m.computeAttackBlockRampOffsets(5, 3)), "[0,1,2,3,4]");
    assert.equal(JSON.stringify(m.computeAttackBlockRampOffsets(5, 5)), "[0,1,2,3,4]");
  });

  test("with real runway, offsets start at 0 and end at the last available day", () => {
    const m = loadStudlinModule();
    const offsets = m.computeAttackBlockRampOffsets(5, 30);
    assert.equal(offsets[0], 0);
    assert.equal(offsets[offsets.length - 1], 29);
  });

  test("offsets are strictly increasing -- no two chunks ever collapse onto the same day", () => {
    const m = loadStudlinModule();
    const offsets = m.computeAttackBlockRampOffsets(6, 20);
    for (let i = 1; i < offsets.length; i++) {
      assert.ok(offsets[i] > offsets[i - 1], `offset ${i} (${offsets[i]}) should exceed offset ${i - 1} (${offsets[i - 1]})`);
    }
  });

  test("gaps shrink toward the deadline -- the back-weighted ramp, not even spacing", () => {
    const m = loadStudlinModule();
    const offsets = m.computeAttackBlockRampOffsets(5, 30);
    const gaps = [];
    for (let i = 1; i < offsets.length; i++) gaps.push(offsets[i] - offsets[i - 1]);
    // Each later gap should be no bigger than the one before it, and the
    // first gap (today -> next chunk) should clearly be the widest --
    // that's the whole point: early chunks are spread apart, late chunks
    // tighten up as the deadline actually starts to feel close.
    for (let i = 1; i < gaps.length; i++) {
      assert.ok(gaps[i] <= gaps[i - 1], `gap ${i} (${gaps[i]}) should not exceed gap ${i - 1} (${gaps[i - 1]})`);
    }
    assert.ok(gaps[0] > gaps[gaps.length - 1], "first gap should be wider than the last gap");
  });
});

describe("isPhaseDecompositionCandidate (gates whether a project is 'large' enough to offer phase breakdown)", () => {
  test("a genuinely large project (big estimate, far-off deadline) is a candidate", () => {
    const m = loadStudlinModule();
    assert.equal(m.isPhaseDecompositionCandidate(20, "2026-09-28", "2026-07-20"), true);
  });

  test("a small item (short estimate) is never a candidate, regardless of how far off the deadline is", () => {
    const m = loadStudlinModule();
    assert.equal(m.isPhaseDecompositionCandidate(2, "2026-09-28", "2026-07-20"), false);
  });

  test("eligibility reflects the work's inherent size, not squeezed runway -- a big estimate crammed into a few days is still a candidate", () => {
    const m = loadStudlinModule();
    // Same 20-hour estimate as the "genuinely large" case above, just with
    // almost no runway left -- still fundamentally a multi-phase-shaped
    // project; the runway squeeze itself is the needs-attention card's job
    // to catch, not this gate's.
    assert.equal(m.isPhaseDecompositionCandidate(20, "2026-07-25", "2026-07-20"), true);
  });

  test("missing an estimate or a deadline is never a candidate -- nothing to compute against", () => {
    const m = loadStudlinModule();
    assert.equal(m.isPhaseDecompositionCandidate(null, "2026-09-28", "2026-07-20"), false);
    assert.equal(m.isPhaseDecompositionCandidate(20, null, "2026-07-20"), false);
  });

  test("eligibility and the start-date gate never disagree, since both read the same weeksNeeded", () => {
    const m = loadStudlinModule();
    const gate = m.computeAttackBlockStartDate("2026-10-15", 20 * 60, "2026-07-20");
    assert.equal(m.isPhaseDecompositionCandidate(20, "2026-10-15", "2026-07-20"), gate.weeksNeeded >= m.PHASE_DECOMPOSITION_MIN_WEEKS);
  });
});

describe("commitSyllabusEvents phase wiring (only phase 0 ever gets a real chain)", () => {
  const phasedItem = (overrides) => ({
    title: "Term Paper", date: "2026-07-22", kind: "deadline", confidence: "high",
    estimatedHours: 20, include: true, attackBlock: true,
    phases: ["Research & sources", "Outline", "Draft", "Revise & cite"], ...overrides,
  });

  test("the marker event stores the full phase plan, phase 0 active and the rest pending", () => {
    const m = loadStudlinModule({ now: "2026-07-20T09:00:00" });
    const result = m.commitSyllabusEvents("note-1", "History", [phasedItem()]);
    const marker = result.find(e => e.kind === "deadline");
    assert.equal(marker.phases.length, 4);
    assert.equal(marker.phases[0].name, "Research & sources");
    assert.equal(marker.phases[0].status, "active");
    assert.ok(marker.phases.slice(1).every(p => p.status === "pending"));
  });

  test("when actionable now, exactly one Attack Block chain is created, for phase 0 only", () => {
    const m = loadStudlinModule({ now: "2026-07-20T09:00:00" });
    const result = m.commitSyllabusEvents("note-1", "History", [phasedItem()]);
    const chainEvents = result.filter(e => e.isAttackBlock);
    assert.equal(chainEvents.length, 1);
    assert.equal(chainEvents[0].projectPhaseIndex, 0);
    assert.equal(chainEvents[0].phaseName, "Research & sources");
    assert.equal(chainEvents[0].projectTitle, "Term Paper");
    assert.equal(chainEvents[0].title, "Term Paper: Research & sources");
    assert.equal(chainEvents[0].dueEventId, "syl-note-1-0");
  });

  test("a far-off deadline stays prepPending with its phase plan intact, but schedules no chain yet", () => {
    const m = loadStudlinModule({ now: "2026-07-20T09:00:00" });
    const result = m.commitSyllabusEvents("note-1", "History", [phasedItem({ date: "2026-09-28" })]);
    assert.equal(result.filter(e => e.isAttackBlock).length, 0);
    const marker = result.find(e => e.kind === "deadline");
    assert.equal(marker.prepPending, true);
    assert.equal(marker.phases.length, 4);
  });

  test("no phases proposed (empty array) behaves exactly like the original flat Attack Block flow", () => {
    const m = loadStudlinModule({ now: "2026-07-20T09:00:00" });
    const result = m.commitSyllabusEvents("note-1", "History", [phasedItem({ phases: [] })]);
    const marker = result.find(e => e.kind === "deadline");
    assert.equal(Object.prototype.hasOwnProperty.call(marker, "phases"), false);
    const chain = result.find(e => e.isAttackBlock);
    assert.equal(chain.title, "Term Paper");
    assert.equal(Object.prototype.hasOwnProperty.call(chain, "projectPhaseIndex"), false);
  });

  test("an item with no phases field at all (never offered/accepted) is unaffected", () => {
    const m = loadStudlinModule({ now: "2026-07-20T09:00:00" });
    const result = m.commitSyllabusEvents("note-1", "History", [phasedItem({ phases: undefined })]);
    const chain = result.find(e => e.isAttackBlock);
    assert.equal(chain.title, "Term Paper");
    assert.equal(Object.prototype.hasOwnProperty.call(chain, "projectPhaseIndex"), false);
  });
});

describe("startPhaseAwareAttackChain (shared phase-0 tagging used by every scheduling entry point)", () => {
  test("with no phases, behaves identically to startAttackBlockChain", () => {
    const m = loadStudlinModule({ now: "2026-07-20T09:00:00" });
    const task = m.startPhaseAwareAttackChain({ title: "Reading Response", deadline: "2026-07-25", priority: 500, difficulty: 500 }, null, [], [], DEFAULT_PREFS, "2026-07-20", "16:00");
    assert.equal(task.title, "Reading Response");
    assert.equal(Object.prototype.hasOwnProperty.call(task, "projectPhaseIndex"), false);
  });

  test("with phases, tags the task with phase 0 and prefixes the title", () => {
    const m = loadStudlinModule({ now: "2026-07-20T09:00:00" });
    const task = m.startPhaseAwareAttackChain({ title: "Term Paper", deadline: "2026-09-28", priority: 500, difficulty: 500 }, ["Research", "Outline", "Draft"], [], [], DEFAULT_PREFS, "2026-07-20", "16:00");
    assert.equal(task.title, "Term Paper: Research");
    assert.equal(task.projectPhaseIndex, 0);
    assert.equal(task.phaseName, "Research");
    assert.equal(task.projectTitle, "Term Paper");
  });
});

describe("buildAssignmentAttackBlockPair (Add/Edit Task's Attack Block entry point)", () => {
  test("a Project's phases survive as a real marker, not just baked into phase 0's title", () => {
    const m = loadStudlinModule({ now: "2026-07-20T09:00:00" });
    const pair = m.buildAssignmentAttackBlockPair("due-proj-1", { title: "Science Fair Board", deadline: "2026-09-28", priority: 500, difficulty: 500 }, ["Research", "Build", "Write-up"], [], [], DEFAULT_PREFS, "2026-07-20", "16:00");
    assert.ok(pair, "should find a legal slot");
    assert.equal(pair.marker.id, "due-proj-1");
    assert.equal(pair.marker.kind, "deadline");
    assert.equal(pair.marker.phases.length, 3);
    assert.equal(pair.marker.phases[0].name, "Research");
    assert.equal(pair.marker.phases[0].status, "active");
    assert.equal(pair.marker.phases[1].name, "Build");
    assert.equal(pair.marker.phases[1].status, "pending");
    assert.equal(pair.marker.phases[2].name, "Write-up");
    assert.equal(pair.marker.phases[2].status, "pending");
    assert.equal(pair.task.title, "Science Fair Board: Research");
    assert.equal(pair.task.dueEventId, "due-proj-1");
    assert.equal(pair.task.projectPhaseIndex, 0);
  });

  test("a regression check: without this, advanceProjectPhase silently no-ops once phase 0 finishes -- with it, phase 2 actually gets scheduled", () => {
    const m = loadStudlinModule({ now: "2026-07-20T09:00:00" });
    const pair = m.buildAssignmentAttackBlockPair("due-proj-2", { title: "Science Fair Board", deadline: "2026-09-28", priority: 500, difficulty: 500 }, ["Research", "Build", "Write-up"], [], [], DEFAULT_PREFS, "2026-07-20", "16:00");
    const events = [pair.marker, pair.task];
    const result = m.advanceProjectPhase(pair.task, events, [], DEFAULT_PREFS, "2026-07-21");
    const updatedMarker = result.find(e => e.id === "due-proj-2");
    assert.equal(updatedMarker.phases[0].status, "done");
    assert.equal(updatedMarker.phases[1].status, "active");
    const nextChain = result.find(e => e.projectPhaseIndex === 1);
    assert.ok(nextChain, "phase 2 (Build) should have been scheduled -- this is exactly what was silently broken before buildAssignmentAttackBlockPair existed");
    assert.equal(nextChain.title, "Science Fair Board: Build");
    assert.equal(nextChain.dueEventId, "due-proj-2");
  });

  test("a plain Assignment (no phases) gets a marker with no phases field, still dueEventId-linked", () => {
    const m = loadStudlinModule({ now: "2026-07-20T09:00:00" });
    const pair = m.buildAssignmentAttackBlockPair("due-asn-1", { title: "Chem lab report", deadline: "2026-07-25", priority: 500, difficulty: 500 }, [], [], [], DEFAULT_PREFS, "2026-07-20", "16:00");
    assert.equal(pair.marker.kind, "deadline");
    assert.equal(Object.prototype.hasOwnProperty.call(pair.marker, "phases"), false);
    assert.equal(pair.task.dueEventId, "due-asn-1");
    assert.equal(pair.task.title, "Chem lab report");
  });

  test("no legal slot for the chain -- returns null, same as startAttackBlockChain would", () => {
    const m = loadStudlinModule({ now: "2026-07-20T09:00:00" });
    const packedDay = { date: "2026-07-20", time: DEFAULT_PREFS.workStartTime, duration: 24 * 60, kind: "study block", status: "pending" };
    const pair = m.buildAssignmentAttackBlockPair("due-asn-2", { title: "Impossible task", deadline: "2026-07-20", priority: 500, difficulty: 500 }, [], [packedDay], [], DEFAULT_PREFS, "2026-07-20", "16:00");
    assert.equal(pair, null);
  });
});

describe("advanceProjectPhase (phase advancement on 'Yes, I'm finished', not on an extended session)", () => {
  const marker = (phases) => ({
    id: "due-1", title: "Term Paper", deadline: "2026-09-28", priority: 5, difficulty: 5, noteId: "note-1", phases,
  });
  const completedTask = (overrides) => ({ id: "t1", dueEventId: "due-1", projectPhaseIndex: 0, isAttackBlock: true, ...overrides });

  test("marks the just-finished phase done and starts the next phase's own chain immediately", () => {
    const m = loadStudlinModule({ now: "2026-07-20T09:00:00" });
    const events = [
      marker([{ name: "Research", status: "active" }, { name: "Outline", status: "pending" }, { name: "Draft", status: "pending" }]),
      completedTask(),
    ];
    const result = m.advanceProjectPhase(completedTask(), events, [], DEFAULT_PREFS, "2026-07-20");
    const updatedMarker = result.find(e => e.id === "due-1");
    assert.equal(updatedMarker.phases[0].status, "done");
    assert.equal(updatedMarker.phases[1].status, "active");
    assert.equal(updatedMarker.phases[2].status, "pending");
    const nextChain = result.find(e => e.isAttackBlock && e.id !== "t1");
    assert.ok(nextChain, "should have scheduled a new chain for the next phase");
    assert.equal(nextChain.title, "Term Paper: Outline");
    assert.equal(nextChain.projectPhaseIndex, 1);
    assert.equal(nextChain.phaseName, "Outline");
    assert.equal(nextChain.dueEventId, "due-1");
  });

  test("no gate delay for the next phase -- it's scheduled starting today, not backward-scheduled again", () => {
    const m = loadStudlinModule({ now: "2026-07-20T09:00:00" });
    const events = [
      marker([{ name: "Research", status: "active" }, { name: "Outline", status: "pending" }]),
      completedTask(),
    ];
    const result = m.advanceProjectPhase(completedTask(), events, [], DEFAULT_PREFS, "2026-07-20");
    const nextChain = result.find(e => e.isAttackBlock && e.id !== "t1");
    assert.equal(nextChain.date, "2026-07-20");
  });

  test("finishing the last phase just marks it done -- no new chain, nothing left to advance to", () => {
    const m = loadStudlinModule({ now: "2026-07-20T09:00:00" });
    const events = [
      marker([{ name: "Research", status: "done" }, { name: "Outline", status: "active" }]),
      completedTask({ projectPhaseIndex: 1 }),
    ];
    const result = m.advanceProjectPhase(completedTask({ projectPhaseIndex: 1 }), events, [], DEFAULT_PREFS, "2026-07-20");
    assert.equal(result.filter(e => e.isAttackBlock).length, 1, "no new chain should be added");
    const updatedMarker = result.find(e => e.id === "due-1");
    assert.equal(updatedMarker.phases[1].status, "done");
  });

  test("a non-phased Attack Block task (no projectPhaseIndex) is a complete no-op", () => {
    const m = loadStudlinModule();
    const events = [{ id: "t2", isAttackBlock: true, attackChainId: "chain-x" }];
    const result = m.advanceProjectPhase(events[0], events, [], DEFAULT_PREFS, "2026-07-20");
    assert.equal(result, events, "should return the exact same array reference when there's nothing to advance");
  });

  test("a dueEventId that doesn't resolve to any marker (deleted/malformed) is also a no-op, not a crash", () => {
    const m = loadStudlinModule();
    const events = [completedTask({ dueEventId: "ghost-event" })];
    const result = m.advanceProjectPhase(completedTask({ dueEventId: "ghost-event" }), events, [], DEFAULT_PREFS, "2026-07-20");
    assert.equal(result, events);
  });
});

describe("detectAttackBlockOverruns (needs-attention: pending chain work no longer fits its own runway)", () => {
  const chainEvent = (overrides) => ({
    id: "ev-" + Math.random(), isAttackBlock: true, attackChainId: "chain-1", title: "Big Paper",
    deadline: "2026-09-01", status: "pending", duration: 90, ...overrides,
  });

  test("a chain with plenty of runway left is not an overrun", () => {
    const m = loadStudlinModule();
    const events = [chainEvent({ duration: 400 })];
    // Deadline over a month out -- 400 pending minutes fits easily.
    assert.equal(JSON.stringify(m.detectAttackBlockOverruns(events, "2026-07-20")), "[]");
  });

  test("a chain whose pending work exceeds what the remaining runway can sustainably hold is an overrun", () => {
    const m = loadStudlinModule();
    const events = [chainEvent({ duration: 400, deadline: "2026-09-01" })];
    // Right at the finish-by buffer -- essentially zero runway left for 400 pending minutes.
    const result = m.detectAttackBlockOverruns(events, "2026-08-28");
    assert.equal(result.length, 1);
    assert.equal(result[0].chainId, "chain-1");
    assert.equal(result[0].pendingMins, 400);
  });

  test("done sessions don't count toward pending minutes, only what's still scheduled", () => {
    const m = loadStudlinModule();
    const events = [
      chainEvent({ duration: 90, status: "done" }),
      chainEvent({ duration: 90, status: "done" }),
    ];
    assert.equal(JSON.stringify(m.detectAttackBlockOverruns(events, "2026-08-31")), "[]");
  });

  test("a chain with no deadline is never flagged -- nothing to be overrun against", () => {
    const m = loadStudlinModule();
    const events = [chainEvent({ duration: 400, deadline: null })];
    assert.equal(JSON.stringify(m.detectAttackBlockOverruns(events, "2026-08-31")), "[]");
  });

  test("non-Attack-Block events are ignored entirely", () => {
    const m = loadStudlinModule();
    const events = [{ id: "x", title: "Regular task", deadline: "2026-09-01", status: "pending", duration: 400 }];
    assert.equal(JSON.stringify(m.detectAttackBlockOverruns(events, "2026-08-31")), "[]");
  });

  test("two separate chains are reported independently", () => {
    const m = loadStudlinModule();
    const events = [
      chainEvent({ attackChainId: "chain-a", title: "Paper A", deadline: "2026-08-30", duration: 500 }),
      chainEvent({ attackChainId: "chain-b", title: "Paper B", deadline: "2026-12-01", duration: 90 }),
    ];
    const result = m.detectAttackBlockOverruns(events, "2026-08-28");
    assert.equal(result.length, 1);
    assert.equal(result[0].chainId, "chain-a");
  });
});

describe("Attack Block overrun dismissal (dismiss-until-tomorrow, not a multi-day cooldown)", () => {
  test("a chain is not dismissed until it's been explicitly dismissed", () => {
    const m = loadStudlinModule();
    assert.equal(m.isAttackOverrunDismissedToday("chain-1"), false);
  });

  test("dismissing a chain suppresses it for today", () => {
    const m = loadStudlinModule();
    m.dismissAttackOverrunToday("chain-1");
    assert.equal(m.isAttackOverrunDismissedToday("chain-1"), true);
  });

  test("dismissing one chain doesn't suppress a different chain", () => {
    const m = loadStudlinModule();
    m.dismissAttackOverrunToday("chain-1");
    assert.equal(m.isAttackOverrunDismissedToday("chain-2"), false);
  });
});

describe("Phase-aware follow-ups and overrun detection (cross-system consistency for multi-phase projects)", () => {
  test("scheduleAttackBlockFollowUp carries phase tags forward onto every new chunk, not just the probe", () => {
    const m = loadStudlinModule({ now: "2026-07-20T09:00:00" });
    const task = {
      id: "t1", title: "Term Paper: Outline", attackChainId: "chain-1", attackIndex: 1, deadline: "2026-09-28",
      priority: 5, difficulty: 5, dueEventId: "due-1", projectPhaseIndex: 1, phaseName: "Outline", projectTitle: "Term Paper",
    };
    m.scheduleAttackBlockFollowUp(task, 60);
    const events = JSON.parse(m.localStorage.getItem("studlin-events"));
    assert.equal(events.length, 1);
    assert.equal(events[0].projectPhaseIndex, 1);
    assert.equal(events[0].phaseName, "Outline");
    assert.equal(events[0].projectTitle, "Term Paper");
    assert.equal(events[0].dueEventId, "due-1");
  });

  test("an ordinary (non-phased) follow-up still carries no phase tags -- the carry-forward is conditional, not always-on", () => {
    const m = loadStudlinModule({ now: "2026-07-20T09:00:00" });
    const task = { id: "t1", title: "Reading Response", attackChainId: "chain-1", attackIndex: 1, deadline: "2026-07-25", priority: 5, difficulty: 5 };
    m.scheduleAttackBlockFollowUp(task, 60);
    const events = JSON.parse(m.localStorage.getItem("studlin-events"));
    assert.equal(Object.prototype.hasOwnProperty.call(events[0], "projectPhaseIndex"), false);
  });

  test("each phase gets its own attackChainId, so the overrun detector naturally scopes to whichever phase is currently active", () => {
    const m = loadStudlinModule();
    const events = [
      // Phase 0, already fully done -- shouldn't contribute any pending minutes.
      { id: "p0", isAttackBlock: true, attackChainId: "chain-phase0", title: "Term Paper: Research", deadline: "2026-09-01", status: "done", duration: 300, projectPhaseIndex: 0, dueEventId: "due-1" },
      // Phase 1, currently active with real pending work.
      { id: "p1", isAttackBlock: true, attackChainId: "chain-phase1", title: "Term Paper: Draft", deadline: "2026-09-01", status: "pending", duration: 500, projectPhaseIndex: 1, dueEventId: "due-1" },
    ];
    const overruns = m.detectAttackBlockOverruns(events, "2026-08-25");
    assert.equal(overruns.length, 1, "only the active phase's chain should be flagged, not the already-finished one");
    assert.equal(overruns[0].chainId, "chain-phase1");
    assert.equal(overruns[0].pendingMins, 500);
  });

  test("overrun capacity is computed against the real shared project deadline, so a phase that runs long correctly shrinks what's left for the next one", () => {
    const m = loadStudlinModule();
    // Same project deadline for both phases (as advanceProjectPhase always
    // passes marker.deadline through) -- phase 2 starting late in the
    // runway should see a small capacity, not a fresh full allowance.
    const latePhase = [
      { id: "p2", isAttackBlock: true, attackChainId: "chain-phase2", title: "Term Paper: Revise", deadline: "2026-09-01", status: "pending", duration: 400, projectPhaseIndex: 2, dueEventId: "due-1" },
    ];
    const earlyResult = m.detectAttackBlockOverruns(latePhase, "2026-07-01");
    const lateResult = m.detectAttackBlockOverruns(latePhase, "2026-08-28");
    assert.equal(earlyResult.length, 0, "plenty of runway left in July -- not an overrun yet");
    assert.equal(lateResult.length, 1, "almost no runway left by late August -- now it is");
  });
});

describe("Attack Block self-report grants zero XP (by construction, not by convention)", () => {
  // XP/leaderboard minutes come from exactly one place: getTotalMinutesFocused
  // summing the "sessions" store, which only logSession(mins, mode) ever
  // writes to -- and that signature has no slot for a percentage at all, only
  // a plain minutes number. The self-report step (the "how far along are
  // you?" slider) only ever feeds scheduleAttackBlockFollowUp, which places
  // new pending events -- it has no path to "sessions" whatsoever.
  const followUpTask = (overrides) => ({
    id: "t1", title: "Term Paper", subject: "History", notes: "",
    priority: 500, difficulty: 500, deadline: "2026-09-01",
    attackChainId: "chain-xyz", attackIndex: 1, dueEventId: "due-1", ...overrides,
  });

  test("scheduling a follow-up from a self-report never touches the sessions store", () => {
    const m = loadStudlinModule({ now: "2026-07-20T09:00:00" });
    m.scheduleAttackBlockFollowUp(followUpTask(), 200);
    assert.equal(m.localStorage.getItem("studlin-sessions"), null);
    assert.equal(m.getTotalMinutesFocused(), 0);
  });

  test("total focused minutes (the XP source) is unchanged no matter how large the self-reported remainder is", () => {
    const m = loadStudlinModule({ now: "2026-07-20T09:00:00" });
    const before = m.getTotalMinutesFocused();
    // A student self-reporting "5% done" produces a huge extrapolated
    // nextMins -- still shouldn't grant a single minute of XP on its own.
    m.scheduleAttackBlockFollowUp(followUpTask(), 480);
    assert.equal(m.getTotalMinutesFocused(), before);
  });

  test("scheduling a follow-up does create real pending events -- it's not a no-op, it just isn't an XP source", () => {
    const m = loadStudlinModule({ now: "2026-07-20T09:00:00" });
    m.scheduleAttackBlockFollowUp(followUpTask(), 200);
    const events = JSON.parse(m.localStorage.getItem("studlin-events"));
    assert.ok(events.length > 0, "should have scheduled at least one follow-up chunk");
    assert.ok(events.every(e => e.status === "pending"), "newly scheduled chunks start pending, not completed/credited");
  });

  test("starting a fresh Attack Block chain (also self-report-adjacent) likewise never touches sessions", () => {
    const m = loadStudlinModule({ now: "2026-07-20T09:00:00" });
    m.startAttackBlockChain({ title: "New Project", deadline: "2026-09-01", priority: 500, difficulty: 500 }, [], [], DEFAULT_PREFS, "2026-07-20", "16:00");
    assert.equal(m.localStorage.getItem("studlin-sessions"), null);
    assert.equal(m.getTotalMinutesFocused(), 0);
  });

  test("logSession's own signature has no percentage/self-report parameter -- only ever a plain minutes number", () => {
    const m = loadStudlinModule();
    // logSession fires an unawaited upsertProfile() call that reaches
    // firebase.auth().currentUser -- stubbed here purely so that fire-
    // and-forget call resolves to "no signed-in user" instead of throwing
    // on the undefined firebase global this sandbox otherwise leaves in
    // place; nothing about the actual assertions below depends on it.
    m.firebase = { auth: () => ({ currentUser: null }) };
    m.logSession(25, "Task: Term Paper");
    const sessions = JSON.parse(m.localStorage.getItem("studlin-sessions"));
    assert.equal(sessions.length, 1);
    assert.equal(sessions[0].m, 25);
    assert.equal(Object.prototype.hasOwnProperty.call(sessions[0], "pct"), false);
    assert.equal(Object.prototype.hasOwnProperty.call(sessions[0], "percent"), false);
    assert.equal(m.getTotalMinutesFocused(), 25);
  });
});

describe("logSuggestionDecision (append-only decision log for every accept/dismiss on a Studlin suggestion)", () => {
  test("appends one row with kind, action, context, and a timestamp", () => {
    const m = loadStudlinModule();
    m.logSuggestionDecision("peakHourInsight", "accepted", { currentBucket: "morning", suggestedBucket: "evening" });
    const log = JSON.parse(m.localStorage.getItem("studlin-suggestionLog"));
    assert.equal(log.length, 1);
    assert.equal(log[0].kind, "peakHourInsight");
    assert.equal(log[0].action, "accepted");
    assert.equal(log[0].context.currentBucket, "morning");
    assert.ok(typeof log[0].t === "number");
  });

  test("multiple decisions accumulate rather than overwrite", () => {
    const m = loadStudlinModule();
    m.logSuggestionDecision("weekBalanceNudge", "accepted", {});
    m.logSuggestionDecision("weekBalancePlan", "dismissed", { moveCount: 3 });
    const log = JSON.parse(m.localStorage.getItem("studlin-suggestionLog"));
    assert.equal(log.length, 2);
    assert.equal(log[1].context.moveCount, 3);
  });

  test("defaults to an empty context object when none is passed", () => {
    const m = loadStudlinModule();
    m.logSuggestionDecision("strugglingBucket", "dismissed");
    const log = JSON.parse(m.localStorage.getItem("studlin-suggestionLog"));
    assert.deepEqual(log[0].context, {});
  });
});

describe("examPrepIntervalPosition (session N of M + days-to-exam, for logging exam-prep pacing decisions)", () => {
  const TODAY = "2026-07-20";
  function exam(overrides) {
    return { id: "exam-1", title: "Chem Midterm", date: "2026-07-27", kind: "exam", ...overrides };
  }
  function session(overrides) {
    return { id: "s1", kind: "study block", dueEventId: "exam-1", isExamPrepSession: true, date: "2026-07-21", ...overrides };
  }

  test("returns null when there's no exam event", () => {
    const m = loadStudlinModule();
    assert.equal(m.examPrepIntervalPosition(null, "s1", [], TODAY), null);
  });

  test("finds the session's 1-based position among the exam's own sessions, sorted by date", () => {
    const m = loadStudlinModule();
    const events = [
      session({ id: "s1", date: "2026-07-21" }),
      session({ id: "s2", date: "2026-07-23" }),
      session({ id: "s3", date: "2026-07-25" }),
    ];
    const result = m.examPrepIntervalPosition(exam(), "s2", events, TODAY);
    assert.equal(result.sessionPosition, "2 of 3");
  });

  test("computes days-to-exam from the real exam date, not the session date", () => {
    const m = loadStudlinModule();
    const events = [session({ id: "s1", date: "2026-07-21" })];
    const result = m.examPrepIntervalPosition(exam({ date: "2026-07-27" }), "s1", events, TODAY);
    assert.equal(result.daysToExam, 7);
  });

  test("sessionPosition is null when the given sessionId isn't among this exam's own sessions", () => {
    const m = loadStudlinModule();
    const events = [session({ id: "s1" })];
    const result = m.examPrepIntervalPosition(exam(), "not-a-real-session", events, TODAY);
    assert.equal(result.sessionPosition, null);
  });

  test("only counts isExamPrepSession sessions linked to this exact exam, not other events sharing the same dueEventId shape", () => {
    const m = loadStudlinModule();
    const events = [
      session({ id: "s1", date: "2026-07-21" }),
      session({ id: "s2", date: "2026-07-22", dueEventId: "other-exam" }), // different exam
      { id: "s3", kind: "study block", dueEventId: "exam-1", isExamPrepSession: false, date: "2026-07-23" }, // not a real prep session
    ];
    const result = m.examPrepIntervalPosition(exam(), "s1", events, TODAY);
    assert.equal(result.sessionPosition, "1 of 1");
  });
});

describe("computeWeekBalancePlan (manually-triggered 'Balance my week')", () => {
  // A Monday with real dates so daysUntilDeadline math (which reads the
  // real clock) behaves predictably -- far enough in the future that
  // "more than 7 days out" deadlines used below stay comfortably true
  // regardless of when this suite actually runs.
  const MONDAY = "2026-09-07";
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(MONDAY + "T12:00:00");
    d.setDate(d.getDate() + i);
    return d.toISOString().slice(0, 10);
  });

  test("a heavy day sheds load onto lighter days, never overlapping anything", () => {
    const m = loadStudlinModule();
    const heavy = Array.from({ length: 5 }, (_, i) => realTask({ id: "h" + i, date: days[0], time: `${9 + i}:00`, duration: 60, deadline: null }));
    const result = m.computeWeekBalancePlan(heavy, [], DEFAULT_PREFS, MONDAY);
    assert.ok(result.moves.length > 0, "should propose at least one move off the packed day");
    // Reconstruct the post-move state and confirm zero overlaps anywhere.
    const final = heavy.map((t) => {
      const mv = result.moves.find((x) => x.id === t.id);
      return mv ? { ...t, date: mv.toDate, time: mv.toTime } : t;
    });
    for (let i = 0; i < final.length; i++) for (let j = i + 1; j < final.length; j++) {
      if (final[i].date !== final[j].date) continue;
      const aS = minutesOf(final[i].time), aE = aS + final[i].duration;
      const bS = minutesOf(final[j].time), bE = bS + final[j].duration;
      assert.ok(aE <= bS || bE <= aS, `${final[i].id} and ${final[j].id} overlap after balancing`);
    }
  });

  test("an already-even week proposes no moves", () => {
    const m = loadStudlinModule();
    const even = days.map((d, i) => realTask({ id: "e" + i, date: d, time: "10:00", duration: 30, deadline: null }));
    const result = m.computeWeekBalancePlan(even, [], DEFAULT_PREFS, MONDAY);
    assert.equal(result.moves.length, 0);
  });

  test("never moves a task with an imminent deadline (within 7 days)", () => {
    const m = loadStudlinModule();
    const soonDeadline = m.dayKey(new Date(Date.now() + 3 * 86400000));
    const heavy = [
      realTask({ id: "imminent", date: days[0], time: "09:00", duration: 60, deadline: soonDeadline }),
      realTask({ id: "h1", date: days[0], time: "10:00", duration: 60, deadline: null }),
      realTask({ id: "h2", date: days[0], time: "11:00", duration: 60, deadline: null }),
      realTask({ id: "h3", date: days[0], time: "12:00", duration: 60, deadline: null }),
    ];
    const result = m.computeWeekBalancePlan(heavy, [], DEFAULT_PREFS, MONDAY);
    assert.ok(!result.moves.some((mv) => mv.id === "imminent"), "a task due in 3 days must never be swept into the rebalance");
  });

  test("never moves a fixed-kind event (exam/class/busy block) or a pinned task", () => {
    const m = loadStudlinModule();
    const heavy = [
      { id: "fixed-1", title: "Exam", date: days[0], time: "09:00", kind: "exam", duration: 60, status: "pending", deadline: null },
      realTask({ id: "pinned-1", date: days[0], time: "10:00", duration: 60, deadline: null, userPinned: true }),
      realTask({ id: "h1", date: days[0], time: "11:00", duration: 60, deadline: null }),
      realTask({ id: "h2", date: days[0], time: "12:00", duration: 60, deadline: null }),
    ];
    const result = m.computeWeekBalancePlan(heavy, [], DEFAULT_PREFS, MONDAY);
    assert.ok(!result.moves.some((mv) => mv.id === "fixed-1" || mv.id === "pinned-1"));
  });

  test("perDay reports both before and after minute totals for every day in the window", () => {
    const m = loadStudlinModule();
    const heavy = Array.from({ length: 4 }, (_, i) => realTask({ id: "h" + i, date: days[0], time: `${9 + i}:00`, duration: 60, deadline: null }));
    const result = m.computeWeekBalancePlan(heavy, [], DEFAULT_PREFS, MONDAY);
    assert.equal(result.perDay.length, 7);
    assert.equal(result.perDay[0].date, days[0]);
    assert.equal(result.perDay[0].minutesBefore, 240);
    assert.ok(result.perDay[0].minutesAfter < result.perDay[0].minutesBefore, "the heavy day's own total should drop after balancing");
  });

  test("a day with nothing safely movable (everything imminent) is left alone without throwing", () => {
    const m = loadStudlinModule();
    const soonDeadline = m.dayKey(new Date(Date.now() + 2 * 86400000));
    const heavy = Array.from({ length: 5 }, (_, i) => realTask({ id: "h" + i, date: days[0], time: `${9 + i}:00`, duration: 60, deadline: soonDeadline }));
    const result = m.computeWeekBalancePlan(heavy, [], DEFAULT_PREFS, MONDAY);
    assert.equal(result.moves.length, 0);
  });
});
