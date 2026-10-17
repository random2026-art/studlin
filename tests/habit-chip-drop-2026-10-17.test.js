// 2026-10-17: dropping a habit chip (Gym) from the sidebar onto the calendar must
// place a visible block, not silently add a weekday to an invisible pattern.
const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");
const APP = fs.readFileSync(path.join(__dirname, "..", "studlin-app.jsx"), "utf8").replace(/\r\n/g, "\n");
const i = APP.indexOf('(routines.find(r=>r.id===routineId)||{}).kind==="habit"){');
const body = APP.slice(i, i + 2200);

test("a dedicated habit branch runs before the generic activity branch", () => {
  assert.ok(i > 0);
  const generic = APP.indexOf('}else if(chipKind==="activity"&&routineId){');
  assert.ok(generic > i, "habit branch comes first");
});
test("it creates a real, pinned event at the dropped date and time, tied to the habit", () => {
  assert.ok(body.includes('id:existing?existing.id:"habit-"+rule.id+"-"+date'));
  assert.ok(body.includes("date,title:rule.title") || body.includes("title:rule.title,date,time:startTime"));
  assert.ok(body.includes("routineId:rule.id,...(rule.isGeneralTask"));
  assert.ok(!body.includes("userPinned"), "a habit stays flexible so reflow can still move it");
  assert.ok(body.includes("lsSet(\"events\",nextEvents);setEvents(nextEvents)"));
});
test("dropping onto a day that already has this habit updates it instead of duplicating", () => {
  assert.ok(body.includes("e.routineId===rule.id&&e.date===date"));
});
test("the habit's repeat days only change when a repeat was chosen, and the drop confirms with a toast", () => {
  assert.ok(body.includes('if(repeat!=="none"&&repeatDays&&repeatDays.length>0)'));
  assert.ok(body.includes("setPlacementToast(rule.title+\" added"));
});
test("no em dashes in the new code", () => {
  assert.ok(!body.includes("—"));
});

const { describe } = require("node:test");
const { loadStudlinModule } = require("./harness.js");

describe("skipping one day of a habit", () => {
  const gym = { id: "rt-gym", title: "Gym", kind: "habit", days: [0, 1, 2, 3, 4, 5, 6], duration: 60, subject: "None" };
  test("a skipped day is not re-created, other days still are", () => {
    const m = loadStudlinModule({ now: "2026-10-19T09:00:00" });
    m.lsSet("weeklyRoutine", [gym]);
    m.setHabitDaySkipped("rt-gym", "2026-10-21", true);
    assert.equal(m.materializeHabitsForDate("2026-10-21", []).length, 0, "skipped day stays empty");
    const other = m.materializeHabitsForDate("2026-10-22", []);
    assert.equal(other.length, 1, "next day is unaffected");
    assert.equal(other[0].subject, "", "the 'None' placeholder never leaks into the event");
  });
  test("un-skipping brings the day back", () => {
    const m = loadStudlinModule({ now: "2026-10-19T09:00:00" });
    m.lsSet("weeklyRoutine", [gym]);
    m.setHabitDaySkipped("rt-gym", "2026-10-21", true);
    m.setHabitDaySkipped("rt-gym", "2026-10-21", false);
    assert.equal(m.materializeHabitsForDate("2026-10-21", []).length, 1);
    assert.equal(JSON.stringify(m.getRoutineSkips()), "{}", "no empty leftovers");
  });
  test("only a habit's block counts as a habit instance", () => {
    const m = loadStudlinModule({ now: "2026-10-19T09:00:00" });
    const cls = { id: "rt-c", title: "Calc", kind: "class", days: [0], startTime: "09:00", duration: 50 };
    m.lsSet("weeklyRoutine", [gym, cls]);
    assert.ok(m.habitInstanceRoutine({ routineId: "rt-gym" }));
    assert.equal(m.habitInstanceRoutine({ routineId: "rt-c" }), null);
    assert.equal(m.habitInstanceRoutine({ title: "plain task" }), null);
  });
});

test("deleting a habit block skips that day with an undo, and the menu says so", () => {
  assert.ok(APP.includes("if(habit)setHabitDaySkipped(habit.id,ev.date,true);"));
  assert.ok(APP.includes('`Skipped "${ev.title}" for this day`'));
  assert.ok(APP.includes("if(event&&habitInstanceRoutine(event,routines))setHabitDaySkipped(event.routineId,event.date,false);"));
  assert.ok(APP.includes('habitInstanceRoutine(ev,routines)?"Skip this day":"Delete"'));
  assert.ok(APP.includes("setHabitDaySkipped(rule.id,date,false); // placing it again un-skips that day"));
});
