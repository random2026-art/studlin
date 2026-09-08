// Part C of the approved 2026-09-08 plan ("Attack Block Transparency,
// Collaborator Search, and Phase-Level Work Tracking"): "right now it
// says first part is active but how am i supposed to work on it how am i
// supposed to indicate we finished that part. thats why it should have
// option where when you hit on that specific one you can create more
// specific checkable parts in each part that you can add time to work on
// each of them."
//
// C1: a sub-checklist per phase (phases[i].checklist -- additive, same
// optional-field convention as outline itself), expandable only on the
// ACTIVE row.
// C2: an optional per-phase time estimate (phases[i].probeMins) that
// advanceProjectPhase now forwards to that phase's own session instead of
// silently reusing the generic default for every phase after the first.
// C3: an explicit line explaining the real "finish the timer session"
// mechanism, plus a manual "Mark phase done" escape hatch running the
// exact same advanceProjectPhase transition.
//
// EventDetailModal is a component closure and advanceProjectPhase is a
// pure top-level function -- mixed coverage: real unit tests for the
// pure logic, source-level regression guards for the component-closure
// UI, same established precedent as every other fix this session. Run
// with `npm test`.
const { test, describe } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");
const { loadStudlinModule } = require("./harness.js");

const SOURCE = fs.readFileSync(path.join(__dirname, "..", "studlin-app.jsx"), "utf8");

const DEFAULT_PREFS = {
  workStartTime: "09:00", workEndTime: "18:00", bedtime: "23:00",
  taskDifficultyPreference: "NONE", bufferMarginStrategy: "15_MIN",
  weekendEnabled: false, weekendStartTime: "09:00", weekendEndTime: "18:00",
  peakHourBuckets: [],
};

describe("C2: advanceProjectPhase respects a real per-phase time estimate instead of always using the generic default", () => {
  function markerWithPhases(phases) {
    return {
      id: "marker-1", title: "Startup Project", kind: "deadline", date: "2026-10-08", deadline: "2026-10-08",
      priority: 500, difficulty: 500, status: "pending", duration: null, timeSpent: 0, completedAt: null,
      phases,
    };
  }

  test("a phase with a real probeMins set gets that exact duration on its own session, not the bare default", () => {
    const { advanceProjectPhase } = loadStudlinModule({ now: "2026-09-08T09:00:00" });
    const marker = markerWithPhases([
      { name: "Startup Ideation", status: "active" },
      { name: "Market Research", status: "pending", probeMins: 45 },
    ]);
    const completedTask = { dueEventId: marker.id, projectPhaseIndex: 0 };
    const next = advanceProjectPhase(completedTask, [marker], [], DEFAULT_PREFS, "2026-09-08");
    const nextSession = next.find(e => e.projectPhaseIndex === 1);
    assert.ok(nextSession, "phase 2's session must be created");
    assert.equal(nextSession.duration, 45, "must use the real per-phase estimate, not a generic default");
  });

  test("a phase with no probeMins set still falls back to the existing default behavior unchanged", () => {
    const { advanceProjectPhase, ATTACK_BLOCK_DEFAULT_PROBE_MINS } = loadStudlinModule({ now: "2026-09-08T09:00:00" });
    const marker = markerWithPhases([
      { name: "Startup Ideation", status: "active" },
      { name: "Market Research", status: "pending" },
    ]);
    const completedTask = { dueEventId: marker.id, projectPhaseIndex: 0 };
    const next = advanceProjectPhase(completedTask, [marker], [], DEFAULT_PREFS, "2026-09-08");
    const nextSession = next.find(e => e.projectPhaseIndex === 1);
    assert.ok(nextSession);
    assert.equal(nextSession.duration, ATTACK_BLOCK_DEFAULT_PROBE_MINS, "an unset estimate must still behave exactly as before this fix");
  });

  test("the completed phase is marked done and the next phase becomes active either way", () => {
    const { advanceProjectPhase } = loadStudlinModule({ now: "2026-09-08T09:00:00" });
    const marker = markerWithPhases([
      { name: "Startup Ideation", status: "active" },
      { name: "Market Research", status: "pending", probeMins: 20 },
    ]);
    const completedTask = { dueEventId: marker.id, projectPhaseIndex: 0 };
    const next = advanceProjectPhase(completedTask, [marker], [], DEFAULT_PREFS, "2026-09-08");
    const updatedMarker = next.find(e => e.id === marker.id);
    assert.equal(updatedMarker.phases[0].status, "done");
    assert.equal(updatedMarker.phases[1].status, "active");
  });
});

describe("C1/C3: EventDetailModal's Phases section (component closure, source-level guards)", () => {
  test("a phase's checklist field is additive -- reading it never assumes it exists", () => {
    const idx = SOURCE.indexOf("{ev.phases.map((ph,pi)=>{");
    assert.notEqual(idx, -1);
    const body = SOURCE.slice(idx, idx + 600);
    assert.match(body, /const checklist=ph\.checklist\|\|\[\];/, "an existing phase with no checklist yet must not throw or need a migration");
  });

  test("the checklist expand affordance only renders for the active phase, never a pending one", () => {
    const idx = SOURCE.indexOf("const isActive=ph.status===\"active\";");
    assert.notEqual(idx, -1);
    const body = SOURCE.slice(idx, idx + 900);
    assert.match(body, /const isExpanded=isActive&&expandedPhaseIdx===pi;/, "a pending phase's sub-detail isn't relevant yet, per the plan's own scoping");
  });

  test("markPhaseDone runs the exact same advanceProjectPhase transition finishing the Lock-In Timer does, not a second parallel implementation", () => {
    const idx = SOURCE.indexOf("const markPhaseDone=()=>{");
    assert.notEqual(idx, -1, "markPhaseDone must exist");
    const body = SOURCE.slice(idx, idx + 900);
    assert.match(body, /advanceProjectPhase\(\{dueEventId:ev\.id,projectPhaseIndex:activeIdx\}/,
      "must call the shared advanceProjectPhase function, not duplicate its phase-transition logic");
  });

  test("markPhaseDone also closes out any already-scheduled pending session for that phase, so it doesn't linger as a dangling duplicate", () => {
    const idx = SOURCE.indexOf("const markPhaseDone=()=>{");
    const body = SOURCE.slice(idx, idx + 900);
    assert.match(body, /e\.dueEventId===ev\.id&&e\.projectPhaseIndex===activeIdx&&e\.status==="pending"\)\?\{\.\.\.e,status:"done"/);
  });

  test("the modal explains the real mechanism and offers the manual escape hatch, both visible whenever a phase is active", () => {
    const idx = SOURCE.indexOf("Finish the active phase's session in the Lock-In Timer");
    assert.notEqual(idx, -1, "the explanatory line must actually render");
    const body = SOURCE.slice(idx, idx + 700);
    assert.match(body, /ev\.phases\.some\(p=>p\.status==="active"\)&&/);
    assert.match(body, />Mark phase done</);
  });

  test("the per-phase time estimate field only shows for a pending (not-yet-active) phase, and clearing it means 'let Studlin figure it out' rather than 0 minutes", () => {
    const idx = SOURCE.indexOf('About how long?');
    assert.notEqual(idx, -1, "the estimate field must render");
    const body = SOURCE.slice(Math.max(0, idx - 700), idx + 700);
    assert.match(body, /ph\.status==="pending"&&/);
    assert.match(body, /v\|\|undefined/, "clearing the field must remove probeMins entirely, not store a falsy 0/null that could still reach startAttackBlockChain as a real duration");
  });
});
