// 2026-10-14: manual-first. New accounts default smart features OFF; a missing
// key means ON so existing users keep today's behaviour.
const { test, describe } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");
const { loadStudlinModule } = require("./harness.js");

const APP = fs.readFileSync(path.join(__dirname, "..", "studlin-app.jsx"), "utf8").replace(/\r\n/g, "\n");
const NOW = { now: "2026-10-14T09:00:00" };
const study = { id: "e1", kind: "study block", duration: 30, time: "10:00", date: "2026-10-14" };

describe("smartFeaturesOn and what follows it", () => {
  test("missing key is on, false is off", () => {
    const { smartFeaturesOn, lsSet } = loadStudlinModule(NOW);
    assert.equal(smartFeaturesOn(), true);
    lsSet("settings", { smartFeatures: false });
    assert.equal(smartFeaturesOn(), false);
    lsSet("settings", { smartFeatures: true });
    assert.equal(smartFeaturesOn(), true);
  });
  test("nudgesAllowed is false when smartFeatures is false even if nudgesMaster is true", () => {
    const { nudgesAllowed, lsSet } = loadStudlinModule(NOW);
    lsSet("settings", { smartFeatures: false, nudgesMaster: true });
    assert.equal(nudgesAllowed(), false);
    lsSet("settings", { nudgesMaster: true });
    assert.equal(nudgesAllowed(), true);
  });
  test("isTimerEligible is false when smart features are off", () => {
    const { isTimerEligible, lsSet } = loadStudlinModule(NOW);
    assert.equal(isTimerEligible(study), true);
    lsSet("settings", { smartFeatures: false });
    assert.equal(isTimerEligible(study), false);
  });
  test("logCompletionOutcome records nothing when off", () => {
    const { logCompletionOutcome, lsGet, lsSet } = loadStudlinModule(NOW);
    lsSet("settings", { smartFeatures: false });
    logCompletionOutcome("done", "10:00", 0, "t1", "Math");
    assert.equal((lsGet("completionLog", []) || []).length, 0);
  });
});

describe("source guards", () => {
  test("every Begin button sits behind isTimerEligible or smartFeaturesOn", () => {
    const lines = APP.split("\n");
    lines.forEach((ln, i) => {
      if (!/>Begin</.test(ln)) return;
      const ctx = lines.slice(Math.max(0, i - 8), i + 1).join("\n");
      assert.ok(/isTimerEligible|canBegin|smartFeaturesOn/.test(ctx), "ungated Begin near line " + (i + 1));
    });
    assert.ok(APP.includes("const canBegin = !isDone && isTimerEligible(ev);"));
  });
  test("Stu heads-up (the Begin offer) is skipped when off", () => {
    assert.ok(APP.includes("if(!smartFeaturesOn())return; // manual-first: the heads-up only offers Begin/timer"));
  });
  test("New Task defaults to manual when off", () => {
    assert.ok(APP.includes('useState(()=>smartFeaturesOn()?"ai":"manual")'));
    assert.ok(APP.includes('setTaskMode(smartFeaturesOn()?"ai":"manual")'));
    assert.ok(APP.includes('{id:"ai",label:"Studlin finds the time"}'));
  });
  test("wizard writes smartFeatures only for a brand-new account", () => {
    assert.ok(APP.includes('setQuestionAskPref("smartFeatures",learn)'));
    assert.ok(APP.includes('lsGet("settings",{}).smartFeatures===undefined'));
    assert.ok(APP.includes("Do you want Studlin to learn how you work?"));
    assert.ok(APP.includes("Studlin can time your sessions and suggest better hours. Off by default. You can turn it on anytime in Settings."));
  });
  test("permissions step is in WIZARD_STEP_ORDER right after personalize", () => {
    assert.match(APP, /const WIZARD_STEP_ORDER=\[[^\]]*"personalize","permissions","activities"/);
    for (const k of ["notifMaster", "sysPush", "mascotReminders", "mascotCheers", "mascotBedtime"]) {
      assert.ok(APP.includes('"' + k + '"'), k);
    }
  });
  test("Settings has the switch and defaults it on for existing users", () => {
    assert.ok(APP.includes('k="smartFeatures"'));
    assert.ok(APP.includes("smartFeatures:true,mascotReminders:true"));
  });
  test("cloud sync never pushes a missing key and pulls booleans", () => {
    assert.ok(APP.includes('typeof lsGet("settings",{}).smartFeatures==="boolean"'));
    assert.ok(APP.includes('typeof data.smartFeatures==="boolean"'));
  });
  test("new copy has no em dash", () => {
    for (const s of ["Do you want Studlin to learn how you work?", "What can Studlin do?", "Learn how I work (timers", "Tap Add Task and pick when it happens"]) {
      const i = APP.indexOf(s);
      assert.ok(i > 0, s);
      assert.ok(!APP.slice(i, i + 300).includes("—"), s);
    }
  });
});
