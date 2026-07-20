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
    // Pack the whole work window with freely-evictable study blocks (no
    // deadline) so an imminent urgent task has nowhere to go without
    // evicting something.
    const packed = [];
    let t = 9 * 60; // matches DEFAULT_PREFS.workStartTime
    let idx = 0;
    while (t + 30 <= 18 * 60) { // until DEFAULT_PREFS.workEndTime
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
    const tasks = planBrainDumpTasks(items, [], [], prefs);
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
  test("declaring 'morning' as peak actually routes a fresh task there under the default work window", () => {
    const m = loadStudlinModule();
    const prefs = { ...DEFAULT_PREFS, peakHourBuckets: ["morning"] };
    const slot = m.findReliableSlotFor([], [], prefs, "2026-07-20", "16:00", 30, null, 500);
    assert.equal(m.hourBucket(slot.time), "morning");
  });

  test("a declared peak with real inferred data elsewhere still wins on a fresh task (peak is a floor, not just a fallback)", () => {
    const m = loadStudlinModule();
    const log = [];
    for (let i = 0; i < 9; i++) log.push({ bucket: "evening", outcome: "done", t: Date.now() - i * 86400000 });
    log.push({ bucket: "evening", outcome: "missed", t: Date.now() });
    m.localStorage.setItem("studlin-completionLog", JSON.stringify(log));
    const prefs = { ...DEFAULT_PREFS, peakHourBuckets: ["morning"] };
    const slot = m.findReliableSlotFor([], [], prefs, "2026-07-20", "16:00", 30, null, 500);
    assert.equal(m.hourBucket(slot.time), "morning", "declared morning should still win even though evening has strong real completion data, since evening is unreachable under the default window anyway");
  });

  test("Tier 0 reflow (missed task) also reaches a declared morning peak, not just fresh placement", () => {
    const m = loadStudlinModule();
    const prefs = { ...DEFAULT_PREFS, peakHourBuckets: ["morning"] };
    const today = m.dayKey();
    const missed = { id: "t1", title: "Missed", date: "2026-07-01", time: "16:00", kind: "study block", duration: 30, status: "pending", deadline: null, priority: 500, difficulty: 500 };
    const result = m.findTier0Slot(missed, [missed], [], prefs, today);
    assert.ok(result, "should find a placement");
    assert.equal(m.hourBucket(result.placement.time), "morning");
  });

  test("a widened work window (7am start) makes 'morning' reachable where the default 9am start did not", () => {
    const m = loadStudlinModule();
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
