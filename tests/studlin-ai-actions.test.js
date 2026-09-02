// Studlin AI Phase 2's action-proposal builders and commit helpers --
// classifyStudlinAiMessage itself is a real /api/chat call and isn't
// exercised here (this repo has no fetch-mocking pattern, same reasoning
// tests/chat-studlin-ai-format.test.js gives for testing api/chat.js's
// pure pricing/prompt functions directly instead of the handler). Every
// pure decision downstream of it -- the actual placement/move safety
// logic -- is covered here instead.
const { test, describe } = require("node:test");
const assert = require("node:assert/strict");
const { loadStudlinModule } = require("./harness.js");

describe("buildCreateTaskProposal", () => {
  test("a study task with room on the calendar lands on a real, scheduled slot", () => {
    const m = loadStudlinModule({ now: "2026-09-14T08:00:00" });
    const prefs = m.getSchedulePreferences();
    const parsed = { title: "Chem Essay", dueDate: "2026-09-20", durationMin: 30, taskKind: "study" };
    const proposal = m.buildCreateTaskProposal(parsed, [], [], prefs);
    assert.equal(proposal.ok, true);
    assert.equal(proposal.kind, "create_task");
    assert.equal(proposal.tasks.length, 1);
    assert.equal(proposal.tasks[0].title, "Chem Essay");
    assert.equal(proposal.tasks[0].checklist, undefined);
    assert.ok(proposal.tasks[0].time);
    assert.doesNotMatch(proposal.label, /added as a to-do instead/);
  });

  test("taskKind:todo skips scheduling entirely, same as Brain Dump's own To-do path", () => {
    const m = loadStudlinModule({ now: "2026-09-14T08:00:00" });
    const prefs = m.getSchedulePreferences();
    const parsed = { title: "Track lab report due date", dueDate: "2026-09-25", durationMin: null, taskKind: "todo" };
    const proposal = m.buildCreateTaskProposal(parsed, [], [], prefs);
    assert.equal(proposal.ok, true);
    assert.equal(proposal.tasks[0].checklist, true);
    assert.equal(proposal.tasks[0].time, "");
    assert.equal(proposal.tasks[0].deadline, "2026-09-25");
  });

  test("a study task with zero room before its own deadline degrades to a to-do instead of vanishing or violating the deadline", () => {
    const m = loadStudlinModule({ now: "2026-09-14T08:00:00" });
    const prefs = m.getSchedulePreferences();
    // Blocks the entire day (and, since the deadline is today, there is no
    // later day the reliability engine could ever legally fall back to).
    const blocker = { id: "blocker", title: "All Day Block", kind: "class", status: "pending", date: "2026-09-14", time: "00:00", duration: 1440 };
    const parsed = { title: "Chem Essay", dueDate: "2026-09-14", durationMin: 30, taskKind: "study" };
    const proposal = m.buildCreateTaskProposal(parsed, [blocker], [], prefs);
    assert.equal(proposal.ok, true);
    assert.equal(proposal.tasks.length, 1);
    assert.equal(proposal.tasks[0].checklist, true);
    assert.match(proposal.label, /added as a to-do instead/);
  });
});

describe("describeCreateProposal", () => {
  test("a scheduled task reads date, time, and duration", () => {
    const m = loadStudlinModule();
    const label = m.describeCreateProposal({ title: "Chem Essay", date: "2026-09-20", time: "14:00", duration: 30 });
    assert.equal(label, 'Add "Chem Essay" -- 2026-09-20 14:00 (30 min)?');
  });
  test("a due-date-only task reads just the date", () => {
    const m = loadStudlinModule();
    const label = m.describeCreateProposal({ title: "Lab Report", date: "2026-09-25", time: "" });
    assert.equal(label, 'Add "Lab Report" -- due 2026-09-25?');
  });
});

describe("buildMoveFlexTaskProposal / move_flex_task safety", () => {
  const flexTask = { id: "t1", title: "Chem Homework", kind: "study block", status: "pending", date: "2026-09-14", time: "11:00", duration: 30, deadline: "2026-09-20" };

  // matchEventByTitle (called internally by buildMoveFlexTaskProposal, same
  // as computePausePlan's own move_event/retime_event branches) always
  // reads the live lsGet("events") pool, not a passed-in array -- the real
  // app satisfies this for free since StudlinAiDrawer always reads fresh
  // from localStorage immediately before calling. Tests need to seed the
  // same store explicitly, same pattern tests/scheduling.test.js already
  // uses for computePausePlan itself.
  test("moves a flexible task to an open slot on the requested day", () => {
    const m = loadStudlinModule({ now: "2026-09-14T08:00:00" });
    const prefs = m.getSchedulePreferences();
    m.lsSet("events", [flexTask]);
    const parsed = { intent: "move_flex_task", target: "chem homework", targetDate: "2026-09-14", destDate: "2026-09-15" };
    const proposal = m.buildStudlinAiActionProposal(parsed, [flexTask], [], prefs, null);
    assert.equal(proposal.ok, true);
    assert.equal(proposal.kind, "move_flex_task");
    assert.equal(proposal.moved[0].id, "t1");
    assert.equal(proposal.moved[0].newDate, "2026-09-15");
  });

  test("never returns a slot past the task's own deadline -- the core safety property", () => {
    const m = loadStudlinModule({ now: "2026-09-14T08:00:00" });
    const prefs = m.getSchedulePreferences();
    const nearDeadlineTask = { ...flexTask, deadline: "2026-09-14" };
    m.lsSet("events", [nearDeadlineTask]);
    const parsed = { intent: "move_flex_task", target: "chem homework", targetDate: "2026-09-14", destDate: "2026-09-16" };
    const proposal = m.buildStudlinAiActionProposal(parsed, [nearDeadlineTask], [], prefs, null);
    assert.equal(proposal.ok, false);
    assert.equal(proposal.disambiguate, undefined);
  });

  test("never returns a bad slot when the destination day is completely full and is also the task's own deadline -- ok:false, not a conflicting placement or a deadline violation", () => {
    const m = loadStudlinModule({ now: "2026-09-14T08:00:00" });
    const prefs = m.getSchedulePreferences();
    // Destination day is fully booked AND is the task's own deadline, so
    // there's no legal answer at all: today's the only day that could
    // still be on-time, and it's full. A slot finder that rolled forward
    // to a later (empty) day here would silently violate the deadline;
    // one that landed on the full day itself would silently double-book.
    const tightDeadlineTask = { ...flexTask, deadline: "2026-09-15" };
    const fullDay = { id: "blocker", title: "All Day Block", kind: "class", status: "pending", date: "2026-09-15", time: "00:00", duration: 1440 };
    m.lsSet("events", [tightDeadlineTask, fullDay]);
    const parsed = { intent: "move_flex_task", target: "chem homework", targetDate: "2026-09-14", destDate: "2026-09-15" };
    const proposal = m.buildStudlinAiActionProposal(parsed, [tightDeadlineTask, fullDay], [], prefs, null);
    assert.equal(proposal.ok, false);
  });

  test("a fixed, non-qualifying item (a class) is never offered as a flexible-task match", () => {
    const m = loadStudlinModule({ now: "2026-09-14T08:00:00" });
    const prefs = m.getSchedulePreferences();
    const fixedClass = { id: "c1", title: "Chem Lecture", kind: "class", status: "pending", date: "2026-09-14", time: "10:00", duration: 50 };
    m.lsSet("events", [fixedClass]);
    const parsed = { intent: "move_flex_task", target: "chem lecture", targetDate: "2026-09-14", destDate: "2026-09-15" };
    const proposal = m.buildStudlinAiActionProposal(parsed, [fixedClass], [], prefs, null);
    assert.equal(proposal.ok, false);
    assert.equal(proposal.noMatch, true);
  });
});

describe("buildMoveFixedProposal / move_event dispatch", () => {
  test("an ambiguous title returns disambiguate and never auto-picks or writes", () => {
    const m = loadStudlinModule({ now: "2026-09-14T08:00:00" });
    const prefs = m.getSchedulePreferences();
    const events = [
      { id: "g1", title: "Gym", kind: "busy block", status: "pending", date: "2026-09-14", time: "09:00", duration: 60 },
      { id: "g2", title: "Gym", kind: "busy block", status: "pending", date: "2026-09-14", time: "18:00", duration: 60 },
    ];
    m.lsSet("events", events);
    const parsed = { intent: "move_event", target: "gym", targetDate: "2026-09-14", destDate: "2026-09-15" };
    const proposal = m.buildStudlinAiActionProposal(parsed, events, [], prefs, null);
    assert.equal(proposal.ok, false);
    assert.equal(proposal.disambiguate.length, 2);
  });

  test("a forcedId re-entry resolves to the exact chosen candidate", () => {
    const m = loadStudlinModule({ now: "2026-09-14T08:00:00" });
    const prefs = m.getSchedulePreferences();
    const events = [
      { id: "g1", title: "Gym", kind: "busy block", status: "pending", date: "2026-09-14", time: "09:00", duration: 60 },
      { id: "g2", title: "Gym", kind: "busy block", status: "pending", date: "2026-09-14", time: "18:00", duration: 60 },
    ];
    m.lsSet("events", events);
    const parsed = { intent: "move_event", target: "gym", targetDate: "2026-09-14", destDate: "2026-09-15" };
    const proposal = m.buildStudlinAiActionProposal(parsed, events, [], prefs, "g1");
    assert.equal(proposal.ok, true);
    assert.equal(proposal.kind, "move_fixed");
    assert.equal(proposal.pausePreview.moved[0].id, "g1");
  });
});

describe("commit helpers", () => {
  test("commitStudlinAiTasks adds the new task(s) and persists them", () => {
    const m = loadStudlinModule({ now: "2026-09-14T08:00:00" });
    m.lsSet("events", []);
    const task = { id: "nt1", title: "New Task", date: "2026-09-14", time: "11:00", duration: 30, kind: "study block", status: "pending" };
    const next = m.commitStudlinAiTasks([task]);
    assert.equal(next.length, 1);
    assert.equal(next[0].id, "nt1");
    assert.equal(m.lsGet("events", []).length, 1);
  });

  test("commitStudlinAiFlexMove only mutates the targeted event's date/time", () => {
    const m = loadStudlinModule({ now: "2026-09-14T08:00:00" });
    const other = { id: "other", title: "Untouched", date: "2026-09-14", time: "09:00", duration: 30, kind: "study block", status: "pending" };
    const target = { id: "t1", title: "Chem Homework", date: "2026-09-14", time: "11:00", duration: 30, kind: "study block", status: "pending" };
    m.lsSet("events", [other, target]);
    const next = m.commitStudlinAiFlexMove([{ id: "t1", newDate: "2026-09-15", newTime: "14:00" }]);
    const nextOther = next.find(e => e.id === "other");
    const nextTarget = next.find(e => e.id === "t1");
    assert.equal(nextOther.date, "2026-09-14");
    assert.equal(nextOther.time, "09:00");
    assert.equal(nextTarget.date, "2026-09-15");
    assert.equal(nextTarget.time, "14:00");
  });
});
