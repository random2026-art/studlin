// Phase 7 of the Shovel-inspired redesign: drag-and-drop scheduling, a
// commute-buffer refactor + feature, a Fixed/Free `movable` toggle, and
// recurring per-occurrence edit-scope overrides. Covers the pure-logic
// pieces -- effectiveLeadIn/effectiveTrailOut (the no-op refactor plus its
// new commute terms), isLeadInFixed's new movable override, and
// getRoutineOverrides/expandRoutineOccurrences round-tripping a "just this
// occurrence" retime. The New Event modal / drag-drop wiring itself is
// UI/interaction work, verified live, same as every other UI-heavy phase.
const { test, describe } = require("node:test");
const assert = require("node:assert/strict");
const { loadStudlinModule } = require("./harness.js");

describe("effectiveLeadIn / effectiveTrailOut", () => {
  test("a fixed-kind item gets the global lead-in buffer, an ordinary one doesn't", () => {
    const m = loadStudlinModule();
    assert.equal(m.effectiveLeadIn({ kind: "class" }), 15);
    assert.equal(m.effectiveLeadIn({ kind: "study block" }), 0);
  });

  test("movable:true on a fixed-kind item removes the lead-in buffer (Phase 7b override)", () => {
    const m = loadStudlinModule();
    assert.equal(m.effectiveLeadIn({ kind: "class", movable: true }), 0);
    assert.equal(m.effectiveLeadIn({ kind: "exam", movable: true }), 0);
  });

  test("movable:true does NOT override a co-op study session -- structural, not a preference", () => {
    const m = loadStudlinModule();
    assert.equal(m.isLeadInFixed({ kind: "study block", studySessionId: "abc" }), true);
    assert.equal(m.isLeadInFixed({ kind: "study block", studySessionId: "abc", movable: true }), true);
  });

  test("a custom commuteBefore adds on top of the fixed-kind buffer", () => {
    const m = loadStudlinModule();
    assert.equal(m.effectiveLeadIn({ kind: "class", commuteBefore: 10 }), 25);
    assert.equal(m.effectiveLeadIn({ kind: "study block", commuteBefore: 10 }), 10);
  });

  test("effectiveTrailOut is the existing breathing-room formula plus a custom commuteAfter", () => {
    const m = loadStudlinModule();
    const baseline = m.effectiveTrailOut({ duration: 60 });
    assert.equal(m.effectiveTrailOut({ duration: 60, commuteAfter: 10 }), baseline + 10);
    assert.equal(m.effectiveTrailOut({ duration: 60 }), baseline); // no commuteAfter set -- unchanged
  });
});

describe("routineOverrides / expandRoutineOccurrences (Phase 7e)", () => {
  function classRoutine(overrides) {
    return { id: "rt-1", title: "Chemistry", kind: "class", subject: "Chemistry", days: [0], startTime: "09:00", duration: 50, ...overrides };
  }

  test("with no override, every occurrence uses the rule's own time/duration", () => {
    const m = loadStudlinModule();
    const occ = m.expandRoutineOccurrences([classRoutine()], "2026-08-03", "2026-08-03");
    assert.equal(occ.length, 1);
    assert.equal(occ[0].time, "09:00");
    assert.equal(occ[0].duration, 50);
    assert.equal(!!occ[0].overridden, false);
  });

  test("an override on one specific date changes only that occurrence", () => {
    const m = loadStudlinModule();
    m.saveRoutineOverrides({ "rt-1": { "2026-08-03": { startTime: "10:00", duration: 30 } } });
    const occ = m.expandRoutineOccurrences([classRoutine()], "2026-08-03", "2026-08-03");
    assert.equal(occ[0].time, "10:00");
    assert.equal(occ[0].duration, 30);
    assert.equal(occ[0].overridden, true);
  });

  test("a different occurrence of the same rule (a different Monday) is unaffected", () => {
    const m = loadStudlinModule();
    m.saveRoutineOverrides({ "rt-1": { "2026-08-03": { startTime: "10:00", duration: 30 } } });
    const occ = m.expandRoutineOccurrences([classRoutine()], "2026-08-10", "2026-08-10");
    assert.equal(occ.length, 1);
    assert.equal(occ[0].time, "09:00");
    assert.equal(occ[0].duration, 50);
    assert.equal(!!occ[0].overridden, false);
  });

  test("getRoutineOverrides defaults to an empty object when never set", () => {
    const m = loadStudlinModule();
    assert.equal(Object.keys(m.getRoutineOverrides()).length, 0);
  });
});
