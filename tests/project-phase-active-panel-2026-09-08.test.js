// Projects Redesign (2026-09-08): source-level regression guards for the
// active-phase panel in EventDetailModal -- the two-choice screen, the
// "plan it myself" form wired to buildPhaseSessionPlan, checklist-complete
// auto-advance, per-item scheduling, and the shared-project sync push.
// This is all component-closure UI (not pure functions), so these are
// regression guards rather than unit tests, same mixed-coverage
// convention every other component-closure feature this session has used.
// Real unit-test coverage for the pure logic these call into lives in
// project-phase-planning-2026-09-08.test.js. Run with `npm test`.
const { test, describe } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");

const SOURCE = fs.readFileSync(path.join(__dirname, "..", "studlin-app.jsx"), "utf8");

describe("Two-choice screen: 'Let Studlin handle it' vs 'I want to plan this myself'", () => {
  test("the choice only shows while scheduleMode is unset, not every time the phase is reopened", () => {
    const idx = SOURCE.indexOf("{!ph.scheduleMode&&!formOpen?(");
    assert.notEqual(idx, -1, "the two-choice branch must exist");
    const body = SOURCE.slice(idx, idx + 900);
    assert.match(body, /Let Studlin handle it/);
    assert.match(body, />I want to plan this myself/);
  });

  test("'Let Studlin handle it' only sets scheduleMode, it never fabricates a session on its own", () => {
    const idx = SOURCE.indexOf("const chooseAuto=()=>{");
    assert.notEqual(idx, -1);
    const body = SOURCE.slice(idx, idx + 300);
    assert.match(body, /scheduleMode:"auto"/);
    assert.doesNotMatch(body, /buildPhaseSessionPlan/, "choosing the default must not itself generate a plan -- the phase's session already exists via advanceProjectPhase");
  });
});

describe("savePlanForm: the 'plan it myself' form wired to buildPhaseSessionPlan", () => {
  test("a real estimate + target date calls buildPhaseSessionPlan against the phase's OWN pending sessions stripped out first", () => {
    const idx = SOURCE.indexOf("const savePlanForm=()=>{");
    assert.notEqual(idx, -1);
    const body = SOURCE.slice(idx, idx + 3400);
    assert.match(body, /withoutStalePending=allEvents\.filter\(e=>!\(e\.dueEventId===ev\.id&&e\.projectPhaseIndex===pi&&e\.status==="pending"\)\)/, "must strip this phase's own stale pending sessions before replanning, or the old default probe lingers alongside the new plan");
    assert.match(body, /buildPhaseSessionPlan\(ev\.id,pi,ph\.name,ev\.title,estimateMins,f\.targetDate/);
  });

  test("a null plan (no legal slot before the target date) shows a real error and does not silently save nothing", () => {
    const idx = SOURCE.indexOf("const savePlanForm=()=>{");
    const body = SOURCE.slice(idx, idx + 3400);
    assert.match(body, /if\(!plan\)\{setDetailErr\("Couldn't find room for a plan before "/);
  });

  test("manual mode never calls buildPhaseSessionPlan -- it creates one direct block instead", () => {
    const idx = SOURCE.indexOf("const savePlanForm=()=>{");
    const body = SOURCE.slice(idx, idx + 900);
    assert.match(body, /if\(f\.manual\)\{/);
    assert.doesNotMatch(body.slice(0, body.indexOf("if(f.manual)")), /buildPhaseSessionPlan/);
  });

  test("leaving everything blank falls back to exactly the default behavior instead of scheduling nothing", () => {
    const idx = SOURCE.indexOf("const savePlanForm=()=>{");
    const body = SOURCE.slice(idx, idx + 3400);
    assert.match(body, /if\(!\(estimateMins>0&&f\.targetDate\)\)\{/);
  });
});

describe("Checklist auto-advance: finishing every item runs the same transition markPhaseDone does", () => {
  test("writePhaseChecklist detects a fully-checked list and calls advanceProjectPhase directly, not a second parallel implementation", () => {
    const idx = SOURCE.indexOf("const writePhaseChecklist=(next)=>{");
    assert.notEqual(idx, -1);
    const body = SOURCE.slice(idx, idx + 1700);
    assert.match(body, /next\.length>0&&next\.every\(c=>c\.done\)/);
    assert.match(body, /advanceProjectPhase\(\{dueEventId:ev\.id,projectPhaseIndex:pi\}/);
  });

  test("the phase's own pending session is closed out before advancing, same as markPhaseDone's own dangling-session guard", () => {
    const idx = SOURCE.indexOf("const writePhaseChecklist=(next)=>{");
    const body = SOURCE.slice(idx, idx + 1700);
    assert.match(body, /e\.dueEventId===ev\.id&&e\.projectPhaseIndex===pi&&e\.status==="pending"\)return \{\.\.\.e,status:"done"/);
  });
});

describe("Per-item scheduling: reuses claimOrCreatePhaseSessionForChecklistItem, never a separate implementation", () => {
  test("confirmChecklistSchedule's default path calls the shared claim-or-create helper", () => {
    const idx = SOURCE.indexOf("const confirmChecklistSchedule=async(ci)=>{");
    assert.notEqual(idx, -1);
    const body = SOURCE.slice(idx, idx + 2200);
    assert.match(body, /claimOrCreatePhaseSessionForChecklistItem\(ev\.id,pi,item\.text/);
  });

  test("the manual and shared paths both write scheduledEventId back onto the checklist item, so 'Scheduled' shows regardless of which path was used", () => {
    const idx = SOURCE.indexOf("const confirmChecklistSchedule=async(ci)=>{");
    const body = SOURCE.slice(idx, idx + 2800);
    const matches = body.match(/scheduledEventId:/g) || [];
    assert.ok(matches.length >= 3, "manual, shared, and the default claim-or-create path should each set scheduledEventId");
  });

  test("'Find a time with others' only lists collaborators who are also friends -- the documented gap #2 limitation", () => {
    const idx = SOURCE.indexOf("const openSharedTimeFinder=async()=>{");
    assert.notEqual(idx, -1);
    const body = SOURCE.slice(idx, idx + 1600);
    assert.match(body, /candidateUids=memberUids\.filter\(uid=>friendUids\.includes\(uid\)\)/);
  });

  test("the shared-time picker reuses findSharedStudyWindow, not a second mutual-availability implementation", () => {
    const idx = SOURCE.indexOf("const findSharedTimes=async()=>{");
    assert.notEqual(idx, -1);
    const body = SOURCE.slice(idx, idx + 500);
    assert.match(body, /findSharedStudyWindow\(/);
    assert.match(body, /fetchFriendsBusyIntervals\(/);
  });
});

describe("Shared-project sync: phase edits actually push to the shared doc now", () => {
  test("writePhaseChecklist pushes to Firestore when the project is shared", () => {
    const idx = SOURCE.indexOf("const writePhaseChecklist=(next)=>{");
    const body = SOURCE.slice(idx, idx + 1900);
    assert.match(body, /if\(ev\.sharedProjectId\)pushSharedProjectUpdate/);
  });

  test("savePlanForm pushes to Firestore on every branch (manual, fallback-to-default, and a real generated plan)", () => {
    const idx = SOURCE.indexOf("const savePlanForm=()=>{");
    const body = SOURCE.slice(idx, idx + 3400);
    const matches = body.match(/if\(ev\.sharedProjectId\)pushSharedProjectUpdate/g) || [];
    assert.ok(matches.length >= 3, "all three save paths (manual/fallback/real-plan) should sync to collaborators, not just one");
  });
});
