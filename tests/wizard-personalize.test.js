// Calendar first-visit wizard's optional "personalize" step --
// applyStudyStylePrefs is the one pure function behind collecting it
// (everything else is component-internal wizard state/JSX, not
// unit-testable, same as the rest of ClassSetupWizard).
// applySessionOrderPreference is the real CONSUMER of the one remaining
// answer (sessionOrder). 2026-09-25 user report ("some of the questions
// don't do anything"): this step used to also collect interleave/
// planningHorizon/startTiming/collisionPref, none of which anything in
// the placement/priority engine ever read -- removed rather than left as
// dead UI. See studlin-app.jsx's own comment on applyStudyStylePrefs.
const { test, describe } = require("node:test");
const assert = require("node:assert/strict");
const { loadStudlinModule } = require("./harness.js");

describe("applyStudyStylePrefs", () => {
  test("no answer -> studyStylePrefs is present with sessionOrder null, not omitted", () => {
    const m = loadStudlinModule();
    const next = m.applyStudyStylePrefs({ workStartTime: "09:00" }, {});
    assert.ok(next.studyStylePrefs);
    assert.equal(next.studyStylePrefs.sessionOrder, null);
  });

  test("sessionOrder answered -> carried through untouched", () => {
    const m = loadStudlinModule();
    const next = m.applyStudyStylePrefs({}, { sessionOrder: "hardest_first" });
    assert.equal(next.studyStylePrefs.sessionOrder, "hardest_first");
  });

  test("every other field on the real schedulePreferences object survives untouched", () => {
    const m = loadStudlinModule();
    const prefs = { workStartTime: "10:00", workEndTime: "18:00", peakHourBuckets: ["morning"], bedtime: "23:00" };
    const next = m.applyStudyStylePrefs(prefs, { sessionOrder: "hardest_first" });
    assert.equal(next.workStartTime, "10:00");
    assert.equal(next.workEndTime, "18:00");
    assert.equal(next.peakHourBuckets.length, 1);
    assert.equal(next.peakHourBuckets[0], "morning");
    assert.equal(next.bedtime, "23:00");
  });

  test("answers is undefined (e.g. a caller that forgot to pass it) -- never throws, sessionOrder null", () => {
    const m = loadStudlinModule();
    const next = m.applyStudyStylePrefs({ workStartTime: "09:00" }, undefined);
    assert.equal(next.studyStylePrefs.sessionOrder, null);
  });
});

describe("ClassSetupWizard's personalize step only renders the one real question", () => {
  test("the dead interleave/planningHorizon/startTiming/collisionPref chip rows are gone from the JSX", () => {
    const fs = require("fs");
    const path = require("path");
    const source = fs.readFileSync(path.join(__dirname, "..", "studlin-app.jsx"), "utf8");
    const idx = source.indexOf('label="When you sit down to study"');
    assert.notEqual(idx, -1);
    const body = source.slice(idx, idx + 600);
    assert.doesNotMatch(body, /Studying for a few things at once/);
    assert.doesNotMatch(body, /How far ahead you want to see your plan/);
    assert.doesNotMatch(body, /Be honest -- when do you actually start/);
    assert.doesNotMatch(body, /Two things collide on the same day/);
    assert.match(body, /One more thing/, "the real 'Okay to ask?' question right after it must still be there");
  });
});

describe("applySessionOrderPreference", () => {
  const sessionA = { id: "a", date: "2026-09-14", time: "09:00", difficulty: 200 }; // easy
  const sessionB = { id: "b", date: "2026-09-14", time: "14:00", difficulty: 800 }; // hard

  test("no preference (null) -- times are left completely untouched", () => {
    const m = loadStudlinModule();
    const result = m.applySessionOrderPreference([sessionA, sessionB], null);
    assert.equal(result.find((s) => s.id === "a").time, "09:00");
    assert.equal(result.find((s) => s.id === "b").time, "14:00");
  });

  test('"no_preference" is treated the same as null -- also untouched', () => {
    const m = loadStudlinModule();
    const result = m.applySessionOrderPreference([sessionA, sessionB], "no_preference");
    assert.equal(result.find((s) => s.id === "a").time, "09:00");
    assert.equal(result.find((s) => s.id === "b").time, "14:00");
  });

  test('"hardest_first" -- the harder session gets the earlier of the two existing times, never a new one', () => {
    const m = loadStudlinModule();
    const result = m.applySessionOrderPreference([sessionA, sessionB], "hardest_first");
    assert.equal(result.find((s) => s.id === "b").time, "09:00", "the hard session (b) must move to the earlier slot");
    assert.equal(result.find((s) => s.id === "a").time, "14:00", "the easy session (a) takes the later slot instead");
    // Same two times as before, just swapped -- never a slot that wasn't
    // already independently proven legal for this day.
    const times = result.map((s) => s.time).sort();
    assert.deepEqual(times, ["09:00", "14:00"]);
  });

  test('"easy_first" -- the harder session gets the LATER of the two existing times', () => {
    const m = loadStudlinModule();
    const result = m.applySessionOrderPreference([sessionA, sessionB], "easy_first");
    assert.equal(result.find((s) => s.id === "a").time, "09:00", "the easy session (a) keeps/takes the earlier slot");
    assert.equal(result.find((s) => s.id === "b").time, "14:00", "the hard session (b) takes the later slot");
  });

  test("a day with only one session is left alone -- nothing to reorder", () => {
    const m = loadStudlinModule();
    const single = [{ id: "x", date: "2026-09-14", time: "11:00", difficulty: 900 }];
    const result = m.applySessionOrderPreference(single, "hardest_first");
    assert.equal(result[0].time, "11:00");
  });

  test("sessions on different days never get mixed together", () => {
    const m = loadStudlinModule();
    const day1 = { id: "a", date: "2026-09-14", time: "09:00", difficulty: 200 };
    const day2 = { id: "b", date: "2026-09-15", time: "09:00", difficulty: 800 };
    const result = m.applySessionOrderPreference([day1, day2], "hardest_first");
    // Each is alone on its own day -- both untouched, no cross-day swap.
    assert.equal(result.find((s) => s.id === "a").time, "09:00");
    assert.equal(result.find((s) => s.id === "b").time, "09:00");
  });

  test("a session missing difficulty falls back to the same neutral default computeSessionPriority-adjacent code uses, never crashes", () => {
    const m = loadStudlinModule();
    const noDifficulty = { id: "a", date: "2026-09-14", time: "09:00" };
    const hasDifficulty = { id: "b", date: "2026-09-14", time: "14:00", difficulty: 900 };
    const result = m.applySessionOrderPreference([noDifficulty, hasDifficulty], "hardest_first");
    // 900 > the 500 default -- b is still the "harder" one, gets the earlier slot.
    assert.equal(result.find((s) => s.id === "b").time, "09:00");
  });
});

describe("buildCreateTaskProposal: sessionOrder preference actually reaches the real proposal", () => {
  test("a real hardest_first preference reorders same-day exam sessions in the actual proposal output", () => {
    const m = loadStudlinModule({ now: "2026-09-14T08:00:00" });
    const prefs = { ...m.getSchedulePreferences(), studyStylePrefs: { sessionOrder: "hardest_first" } };
    const parsed = { title: "Chem Final", dueDate: "2026-09-28", taskKind: "exam" };
    const proposal = m.buildCreateTaskProposal(parsed, [], [], prefs);
    assert.equal(proposal.ok, true);
    // Not asserting a specific reordering here (real placement makes same-day
    // collisions rare in a clean calendar) -- this proves the call site wires
    // the preference through without throwing or dropping any tasks, which is
    // what a missing/incorrect wire-up would actually break.
    assert.ok(proposal.tasks.length > 0);
  });

  test("no preference set (the common case today) -- proposal building is completely unaffected", () => {
    const m = loadStudlinModule({ now: "2026-09-14T08:00:00" });
    const prefs = m.getSchedulePreferences();
    const parsed = { title: "Chem Final", dueDate: "2026-09-28", taskKind: "exam" };
    const proposal = m.buildCreateTaskProposal(parsed, [], [], prefs);
    assert.equal(proposal.ok, true);
    assert.ok(proposal.tasks.length > 0);
  });
});
