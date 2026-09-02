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

  test("taskKind:exam creates a real exam marker, not a study block", () => {
    const m = loadStudlinModule({ now: "2026-09-14T08:00:00" });
    const prefs = m.getSchedulePreferences();
    const parsed = { title: "Chem Final", dueDate: "2026-09-20", taskKind: "exam" };
    const proposal = m.buildCreateTaskProposal(parsed, [], [], prefs);
    assert.equal(proposal.ok, true);
    assert.equal(proposal.tasks[0].kind, "exam");
    assert.equal(proposal.tasks[0].date, "2026-09-20");
  });

  test("taskKind:event with a real time creates a fixed busy block at that exact time", () => {
    const m = loadStudlinModule({ now: "2026-09-14T08:00:00" });
    const prefs = m.getSchedulePreferences();
    const parsed = { title: "Dentist Appointment", dueDate: "2026-09-15", dueTime: "15:00", taskKind: "event" };
    const proposal = m.buildCreateTaskProposal(parsed, [], [], prefs);
    assert.equal(proposal.ok, true);
    assert.equal(proposal.tasks[0].kind, "busy block");
    assert.equal(proposal.tasks[0].date, "2026-09-15");
    assert.equal(proposal.tasks[0].time, "15:00");
  });

  test("taskKind:reminder creates a reminder, not a scheduled work block", () => {
    const m = loadStudlinModule({ now: "2026-09-14T08:00:00" });
    const prefs = m.getSchedulePreferences();
    const parsed = { title: "Email Professor", dueDate: "2026-09-15", taskKind: "reminder" };
    const proposal = m.buildCreateTaskProposal(parsed, [], [], prefs);
    assert.equal(proposal.ok, true);
    assert.equal(proposal.tasks[0].kind, "reminder");
  });

  test("taskKind:project still produces a real marker even with no phases/outline given, degrading the same way a phase-less Brain Dump project does", () => {
    const m = loadStudlinModule({ now: "2026-09-14T08:00:00" });
    const prefs = m.getSchedulePreferences();
    const parsed = { title: "History Project", dueDate: "2026-09-25", taskKind: "project" };
    const proposal = m.buildCreateTaskProposal(parsed, [], [], prefs);
    assert.equal(proposal.ok, true);
    assert.ok(proposal.tasks.length >= 1);
  });

  test("an unrecognized taskKind defaults to study, never crashes or silently no-ops", () => {
    const m = loadStudlinModule({ now: "2026-09-14T08:00:00" });
    const prefs = m.getSchedulePreferences();
    const parsed = { title: "Something", dueDate: "2026-09-20", taskKind: "bogus" };
    const proposal = m.buildCreateTaskProposal(parsed, [], [], prefs);
    assert.equal(proposal.ok, true);
    assert.equal(proposal.tasks[0].kind, "study block");
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

describe("buildDeleteProposal / delete_task safety", () => {
  test("deletes a real one-off event by name, resolving to the exact matched event object", () => {
    const m = loadStudlinModule({ now: "2026-09-14T08:00:00" });
    const task = { id: "t1", title: "Chem Homework", kind: "study block", status: "pending", date: "2026-09-14", time: "11:00", duration: 30 };
    m.lsSet("events", [task]);
    const parsed = { intent: "delete_task", target: "chem homework", targetDate: "2026-09-14" };
    const proposal = m.buildStudlinAiActionProposal(parsed, [task], [], m.getSchedulePreferences(), null);
    assert.equal(proposal.ok, true);
    assert.equal(proposal.kind, "delete_task");
    assert.equal(proposal.event.id, "t1");
  });

  test("a routine occurrence (recurring class) is never a delete candidate -- only a real one-off event", () => {
    const m = loadStudlinModule({ now: "2026-09-14T08:00:00" });
    const dow = (new Date("2026-09-14T12:00:00").getDay() + 6) % 7;
    const routine = { id: "r1", title: "Chem Lecture", kind: "class", days: [dow], startTime: "10:00", duration: 50, subject: "" };
    m.saveWeeklyRoutine([routine]);
    m.lsSet("events", []);
    const parsed = { intent: "delete_task", target: "chem lecture", targetDate: "2026-09-14" };
    const proposal = m.buildStudlinAiActionProposal(parsed, [], [routine], m.getSchedulePreferences(), null);
    assert.equal(proposal.ok, false);
    assert.equal(proposal.noMatch, true);
  });

  test("an ambiguous title returns disambiguate and never auto-picks a candidate to delete", () => {
    const m = loadStudlinModule({ now: "2026-09-14T08:00:00" });
    const events = [
      { id: "d1", title: "Draft", kind: "study block", status: "pending", date: "2026-09-14", time: "09:00", duration: 30 },
      { id: "d2", title: "Draft", kind: "study block", status: "pending", date: "2026-09-14", time: "14:00", duration: 30 },
    ];
    m.lsSet("events", events);
    const parsed = { intent: "delete_task", target: "draft", targetDate: "2026-09-14" };
    const proposal = m.buildStudlinAiActionProposal(parsed, events, [], m.getSchedulePreferences(), null);
    assert.equal(proposal.ok, false);
    assert.equal(proposal.disambiguate.length, 2);
  });

  test("a forcedId re-entry resolves to the exact chosen event", () => {
    const m = loadStudlinModule({ now: "2026-09-14T08:00:00" });
    const events = [
      { id: "d1", title: "Draft", kind: "study block", status: "pending", date: "2026-09-14", time: "09:00", duration: 30 },
      { id: "d2", title: "Draft", kind: "study block", status: "pending", date: "2026-09-14", time: "14:00", duration: 30 },
    ];
    m.lsSet("events", events);
    const parsed = { intent: "delete_task", target: "draft", targetDate: "2026-09-14" };
    const proposal = m.buildStudlinAiActionProposal(parsed, events, [], m.getSchedulePreferences(), "d2");
    assert.equal(proposal.ok, true);
    assert.equal(proposal.event.id, "d2");
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

describe("canUseStudlinAiQna (Q&A's Pro gate, closing the Phase 1 gap)", () => {
  test("Free has no access at all, same as every other AI feature in this app", () => {
    const m = loadStudlinModule();
    m.setPlanLS("Free");
    assert.equal(m.canUseStudlinAiQna(), false);
    assert.equal(m.canUseStudlinAiQnaReason(), "free-tier");
  });
  test("Pro has access up to its own monthly cap", () => {
    const m = loadStudlinModule();
    m.setPlanLS("Pro");
    assert.equal(m.canUseStudlinAiQna(), true);
  });
  test("recordStudlinAiQnaUsage advances the monthly counter that the gate reads", () => {
    const m = loadStudlinModule();
    m.setPlanLS("Pro");
    assert.equal(m.getStudlinAiQnaUsage().count, 0);
    m.recordStudlinAiQnaUsage();
    assert.equal(m.getStudlinAiQnaUsage().count, 1);
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

  test("commitStudlinAiPeakHours replaces peakHourBuckets with exactly the one requested bucket", () => {
    const m = loadStudlinModule();
    const prefs = { ...m.getSchedulePreferences(), peakHourBuckets: ["morning", "afternoon"] };
    const next = m.commitStudlinAiPeakHours(prefs, "evening");
    assert.equal(next.peakHourBuckets.length, 1);
    assert.equal(next.peakHourBuckets[0], "evening");
    const persisted = m.getSchedulePreferences().peakHourBuckets;
    assert.equal(persisted.length, 1);
    assert.equal(persisted[0], "evening");
  });
});

describe("buildSetPeakHoursProposal", () => {
  test("a valid, reachable bucket produces a real proposal with no warning", () => {
    const m = loadStudlinModule();
    const prefs = m.getSchedulePreferences(); // default work hours 10:00-18:00
    const proposal = m.buildSetPeakHoursProposal({ peakHours: "midday" }, prefs);
    assert.equal(proposal.ok, true);
    assert.equal(proposal.kind, "set_peak_hours");
    assert.equal(proposal.bucketId, "midday");
    assert.doesNotMatch(proposal.label, /heads up/);
  });

  test("a bucket outside the declared work window is still allowed, but warns rather than silently pretending it's usable", () => {
    const m = loadStudlinModule();
    const prefs = m.getSchedulePreferences(); // evening (6-10pm) starts exactly at the default 18:00 work-end, so it doesn't overlap
    const proposal = m.buildSetPeakHoursProposal({ peakHours: "evening" }, prefs);
    assert.equal(proposal.ok, true);
    assert.match(proposal.label, /heads up/);
  });

  test("already-set to exactly the requested bucket is a no-op, not a pointless proposal", () => {
    const m = loadStudlinModule();
    const prefs = { ...m.getSchedulePreferences(), peakHourBuckets: ["midday"] };
    const proposal = m.buildSetPeakHoursProposal({ peakHours: "midday" }, prefs);
    assert.equal(proposal.ok, false);
    assert.match(proposal.label, /already set/);
  });

  test("an invalid/unrecognized bucket id never crashes, just fails cleanly", () => {
    const m = loadStudlinModule();
    const proposal = m.buildSetPeakHoursProposal({ peakHours: "overnight" }, m.getSchedulePreferences());
    assert.equal(proposal.ok, false);
  });
});

describe("deriveStudlinAiProactiveSignal", () => {
  test("neither offer active -> null", () => {
    const m = loadStudlinModule();
    assert.equal(m.deriveStudlinAiProactiveSignal(null, null), null);
  });
  test("only peakInsightOffer active -> kind:peak_hours, carries its fields through", () => {
    const m = loadStudlinModule();
    const offer = { currentBucket: "morning", currentPct: 0.4, suggestedBucket: "evening", suggestedPct: 0.8 };
    const signal = m.deriveStudlinAiProactiveSignal(null, offer);
    assert.equal(signal.kind, "peak_hours");
    assert.equal(signal.suggestedBucket, "evening");
  });
  test("only strugglingBucketOffer active -> kind:struggling_bucket, carries its fields through", () => {
    const m = loadStudlinModule();
    const offer = { strugglingBucket: "afternoon", suggestedBucket: "morning", recentMissedCount: 4, recentWindow: 5 };
    const signal = m.deriveStudlinAiProactiveSignal(offer, null);
    assert.equal(signal.kind, "struggling_bucket");
    assert.equal(signal.recentMissedCount, 4);
  });
  test("both active -> struggling_bucket wins, matching the app's own existing precedence", () => {
    const m = loadStudlinModule();
    const strugglingOffer = { strugglingBucket: "afternoon", suggestedBucket: "morning", recentMissedCount: 4, recentWindow: 5 };
    const peakOffer = { currentBucket: "morning", currentPct: 0.4, suggestedBucket: "evening", suggestedPct: 0.8 };
    const signal = m.deriveStudlinAiProactiveSignal(strugglingOffer, peakOffer);
    assert.equal(signal.kind, "struggling_bucket");
  });
});
