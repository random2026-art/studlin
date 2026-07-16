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
    // workEndTime widened so this doesn't flake depending on what real
    // wall-clock time the suite happens to run at (see the identical note
    // on the peak-hour-bucket test below).
    const prefs = { ...DEFAULT_PREFS, workEndTime: "23:30" };
    const items = [
      { kind: "study", title: "Find bugs", durationMin: 60, immediate: true, chained: false },
      { kind: "study", title: "Paint floor", durationMin: 30, chained: true },
    ];
    const tasks = planBrainDumpTasks(items, [], [], prefs);
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
    // workEndTime widened so this doesn't flake depending on what real
    // wall-clock time the suite happens to run at (planBrainDumpTasks
    // schedules "now"-anchored items against real time, not an injected
    // clock) -- a chained pair must fit regardless of time of day.
    const prefs = { ...DEFAULT_PREFS, peakHourBuckets: ["evening"], workEndTime: "23:30" };
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
