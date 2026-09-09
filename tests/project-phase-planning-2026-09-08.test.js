// Projects Redesign (2026-09-08): "lets keep discussing specifically for
// projects" -> phases becomes the one structure, and the active phase can
// get a real multi-session plan from a stated time estimate + target date
// (same backward-planning shape Build Study Plan already uses for exams),
// or have a checklist item schedule itself by claiming one of those
// already-planned sessions instead of stacking a second commitment on top.
//
// buildPhaseSessionPlan and claimOrCreatePhaseSessionForChecklistItem are
// both pure, top-level functions -- real unit tests, same convention as
// buildAssignmentAttackBlockPair/advanceProjectPhase already use. Run with
// `npm test`.
const { test, describe } = require("node:test");
const assert = require("node:assert/strict");
const { loadStudlinModule } = require("./harness.js");

const DEFAULT_PREFS = {
  workStartTime: "09:00", workEndTime: "18:00", bedtime: "23:00",
  taskDifficultyPreference: "NONE", bufferMarginStrategy: "15_MIN",
  weekendEnabled: true, weekendStartTime: "09:00", weekendEndTime: "18:00",
  peakHourBuckets: [],
};

describe("buildPhaseSessionPlan: a real multi-session plan from a stated estimate + target date", () => {
  test("an empty calendar with real runway places every session, tagged back to the right marker/phase", () => {
    const { buildPhaseSessionPlan } = loadStudlinModule({ now: "2026-09-08T09:00:00" });
    const plan = buildPhaseSessionPlan(
      "marker-1", 0, "Research", "History Essay",
      180, "2026-09-20", "2026-09-25", "History", 500, 500,
      [], [], DEFAULT_PREFS, "2026-09-08"
    );
    assert.ok(plan, "a free calendar with real runway must produce a plan, not null");
    assert.ok(plan.sessions.length > 0);
    assert.equal(plan.allPlaced, true, "every requested date should find a slot on an empty calendar");
    for (const s of plan.sessions) {
      assert.equal(s.dueEventId, "marker-1");
      assert.equal(s.projectPhaseIndex, 0);
      assert.equal(s.phaseName, "Research");
      assert.equal(s.projectTitle, "History Essay");
      assert.equal(s.status, "pending");
      assert.ok(s.duration >= 10, "applyHoursTarget's own floor must still apply here");
    }
  });

  test("a target date already in the past returns null instead of scheduling into it", () => {
    const { buildPhaseSessionPlan } = loadStudlinModule({ now: "2026-09-08T09:00:00" });
    const plan = buildPhaseSessionPlan(
      "marker-1", 0, "Research", "History Essay",
      180, "2026-09-01", "2026-09-25", "History", 500, 500,
      [], [], DEFAULT_PREFS, "2026-09-08"
    );
    assert.equal(plan, null);
  });

  test("a totally full calendar (no legal slot anywhere) returns null, not an empty sessions array", () => {
    const { buildPhaseSessionPlan } = loadStudlinModule({ now: "2026-09-08T09:00:00" });
    // Fill every hour of every day in range with a fixed, un-movable event.
    const jam = [];
    for (let d = 8; d <= 20; d++) {
      const date = "2026-09-" + String(d).padStart(2, "0");
      jam.push({ id: "jam-" + d, kind: "fixed", date, time: "00:00", duration: 24 * 60, status: "pending" });
    }
    const plan = buildPhaseSessionPlan(
      "marker-1", 0, "Research", "History Essay",
      180, "2026-09-20", "2026-09-25", "History", 500, 500,
      jam, [], DEFAULT_PREFS, "2026-09-08"
    );
    assert.equal(plan, null);
  });

  test("the total planned minutes actually reflect the stated estimate, not a fixed default", () => {
    const { buildPhaseSessionPlan } = loadStudlinModule({ now: "2026-09-08T09:00:00" });
    const plan = buildPhaseSessionPlan(
      "marker-1", 0, "Research", "History Essay",
      60, "2026-09-20", "2026-09-25", "History", 500, 500,
      [], [], DEFAULT_PREFS, "2026-09-08"
    );
    assert.ok(plan);
    const totalMins = plan.sessions.reduce((s, e) => s + e.duration, 0);
    // applyHoursTarget rounds to the nearest 5 and floors at 10/session --
    // this just needs to be in the right neighborhood of the 60-minute ask,
    // not exact to the minute.
    assert.ok(totalMins >= 30 && totalMins <= 90, "total scheduled minutes ("+totalMins+") should track the 60-minute estimate, not some unrelated fixed amount");
  });
});

describe("claimOrCreatePhaseSessionForChecklistItem: reuse the phase's planned time before creating anything new", () => {
  test("claims an existing unclaimed pending session for the phase instead of creating a second one", () => {
    const { claimOrCreatePhaseSessionForChecklistItem } = loadStudlinModule({ now: "2026-09-08T09:00:00" });
    const existing = { id: "sess-1", dueEventId: "marker-1", projectPhaseIndex: 0, status: "pending", title: "Work on: Research", date: "2026-09-10", time: "16:00", duration: 60 };
    const result = claimOrCreatePhaseSessionForChecklistItem(
      "marker-1", 0, "Find sources", "2026-09-25", "History", 500, 500,
      [existing], [], DEFAULT_PREFS, "2026-09-08"
    );
    assert.ok(result);
    assert.equal(result.scheduledEventId, "sess-1", "must reuse the existing session's id, not mint a new one");
    assert.equal(result.events.length, 1, "no new event should have been added");
    const claimed = result.events.find(e => e.id === "sess-1");
    assert.equal(claimed.checklistItemText, "Find sources");
    assert.equal(claimed.title, "Work on: Find sources");
  });

  test("an already-claimed session is skipped -- a second checklist item never steals the first item's session", () => {
    const { claimOrCreatePhaseSessionForChecklistItem } = loadStudlinModule({ now: "2026-09-08T09:00:00" });
    const claimed = { id: "sess-1", dueEventId: "marker-1", projectPhaseIndex: 0, status: "pending", title: "Work on: Find sources", checklistItemText: "Find sources", date: "2026-09-10", time: "16:00", duration: 60 };
    const result = claimOrCreatePhaseSessionForChecklistItem(
      "marker-1", 0, "Read source 1", "2026-09-25", "History", 500, 500,
      [claimed], [], DEFAULT_PREFS, "2026-09-08"
    );
    assert.ok(result);
    assert.notEqual(result.scheduledEventId, "sess-1", "must not re-claim a session another checklist item already owns");
    assert.equal(result.events.length, 2, "a genuinely new small block should have been created");
  });

  test("no unclaimed session and no room at all returns null", () => {
    const { claimOrCreatePhaseSessionForChecklistItem } = loadStudlinModule({ now: "2026-09-08T09:00:00" });
    const jam = [];
    for (let d = 8; d <= 25; d++) {
      const date = "2026-09-" + String(d).padStart(2, "0");
      jam.push({ id: "jam-" + d, kind: "fixed", date, time: "00:00", duration: 24 * 60, status: "pending" });
    }
    const result = claimOrCreatePhaseSessionForChecklistItem(
      "marker-1", 0, "Find sources", "2026-09-25", "History", 500, 500,
      jam, [], DEFAULT_PREFS, "2026-09-08"
    );
    assert.equal(result, null);
  });
});
