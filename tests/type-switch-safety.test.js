// Regression tests for EventDetailModal's Type switcher (onTypeChange/save/
// finishSave in studlin-app.jsx) -- changing an existing event's Type used
// to only flip kind/asProject/asChecklist, leaving every exam-only field
// (confidenceLog, examWeight, examType, importanceLevel, gradeWeightPercent,
// scoreTier, scorePercent, quizScores) and Project-only field (phases,
// outline, sharedProjectId) silently riding along on the stored event no
// matter what Type it got switched to, and never cleaning up (or even
// warning about) an exam's real linked prep sessions/flashcard deck/
// practice exam before switching it away from "exam".
//
// The fix pulls the actual decision logic out into four small pure
// functions so it's testable without rendering EventDetailModal itself
// (which the harness's fake React stub can't exercise interactively -- see
// harness.js's own comment on what its React stub is for):
//   - examTypeSwitchFieldPatch(oldKind,newKind) -- which exam-only scalar
//     fields get cleared/initialized this save
//   - examLinkedPrepData(examId,events,decks,practiceExams) -- what real
//     prep work (pending sessions/deck/practice exam) an exam has, used
//     both to decide whether EventDetailModal's save() needs to show the
//     "Switch away from Exam?" confirm first, and to know what to clean up
//   - applyExamTypeSwitchCleanup(events,examId,decks,practiceExams) -- the
//     actual cleanup, reusing the same deck-unlink-or-delete/practice-exam-
//     delete/removeGenericExamPrepSessions logic Studlin Prep's own study-
//     plan regeneration already uses
//   - projectDropFieldPatch(wasProject,isProjectNow) -- phases/outline/
//     sharedProjectId clearing when a Project gets switched to something else
//
// Run with `npm test`.
const { test, describe } = require("node:test");
const assert = require("node:assert/strict");
const { loadStudlinModule } = require("./harness.js");

describe("examTypeSwitchFieldPatch (Fix 1: exam-only fields on a Type switch)", () => {
  test("switching AWAY from exam clears every exam-only scalar field", () => {
    const { examTypeSwitchFieldPatch } = loadStudlinModule({});
    const { switchedAwayFromExam, switchedToExam, patch } = examTypeSwitchFieldPatch("exam", "deadline");
    assert.equal(switchedAwayFromExam, true);
    assert.equal(switchedToExam, false);
    assert.equal(patch.confidenceLog, undefined);
    assert.equal(patch.examWeight, undefined);
    assert.equal(patch.examType, undefined);
    assert.equal(patch.importanceLevel, undefined);
    assert.equal(patch.gradeWeightPercent, undefined);
    assert.equal(patch.scoreTier, undefined);
    assert.equal(patch.scorePercent, undefined);
    assert.equal(patch.quizScores, undefined);
    // Every one of the 8 fields is an OWN property of the patch (so
    // spreading it onto the stored event actually overwrites a real prior
    // value with undefined) -- not just absent from the object, which
    // would silently leave the old value in place after {...e,...patch}.
    for (const k of ["confidenceLog", "examWeight", "examType", "importanceLevel", "gradeWeightPercent", "scoreTier", "scorePercent", "quizScores"]) {
      assert.equal(Object.prototype.hasOwnProperty.call(patch, k), true, k + " must be an explicit own key, not just missing");
    }
  });

  test("switching AWAY from exam does NOT touch sourceMaterials/referenceLinks -- not exam-exclusive (a Project can carry them too)", () => {
    const { examTypeSwitchFieldPatch } = loadStudlinModule({});
    const { patch } = examTypeSwitchFieldPatch("exam", "deadline");
    assert.equal(Object.prototype.hasOwnProperty.call(patch, "sourceMaterials"), false);
    assert.equal(Object.prototype.hasOwnProperty.call(patch, "referenceLinks"), false);
  });

  test("switching TO exam initializes confidenceLog to a real empty array, same default shape a freshly-created exam gets", () => {
    const { examTypeSwitchFieldPatch } = loadStudlinModule({});
    const { switchedAwayFromExam, switchedToExam, patch } = examTypeSwitchFieldPatch("deadline", "exam");
    assert.equal(switchedToExam, true);
    assert.equal(switchedAwayFromExam, false);
    // Cross-realm note: harness.js runs the app in a separate vm context,
    // so assert.deepEqual against a plain object/array literal always
    // false-fails here (see tests/harness.js's own comment) -- compared
    // via JSON.stringify and an explicit key count instead.
    assert.equal(Object.keys(patch).length, 1);
    assert.equal(JSON.stringify(patch.confidenceLog), "[]");
  });

  test("staying on exam (no Type change at all) touches nothing", () => {
    const { examTypeSwitchFieldPatch } = loadStudlinModule({});
    const { switchedAwayFromExam, switchedToExam, patch } = examTypeSwitchFieldPatch("exam", "exam");
    assert.equal(switchedAwayFromExam, false);
    assert.equal(switchedToExam, false);
    assert.equal(Object.keys(patch).length, 0);
  });

  test("a 'boring' switch with nothing exam-related on either side (assignment <-> reminder) stays exactly as simple as before -- empty patch, no flags, no ceremony", () => {
    const { examTypeSwitchFieldPatch } = loadStudlinModule({});
    const a = examTypeSwitchFieldPatch("deadline", "reminder");
    assert.equal(a.switchedAwayFromExam, false);
    assert.equal(a.switchedToExam, false);
    assert.equal(Object.keys(a.patch).length, 0);
    const b = examTypeSwitchFieldPatch("reminder", "study block");
    assert.equal(b.switchedAwayFromExam, false);
    assert.equal(b.switchedToExam, false);
    assert.equal(Object.keys(b.patch).length, 0);
  });
});

describe("examLinkedPrepData (Fix 1: what real prep work an exam has)", () => {
  test("an exam with nothing linked reports hasData:false and every list empty", () => {
    const { examLinkedPrepData } = loadStudlinModule({});
    const r = examLinkedPrepData("exam-1", [{ id: "exam-1", kind: "exam" }], [], []);
    assert.equal(r.hasData, false);
    assert.equal(r.pendingPrepSessions.length, 0);
    assert.equal(r.linkedDecks.length, 0);
    assert.equal(r.linkedPracticeExams.length, 0);
  });

  test("a pending, plain (non-kit) exam-prep session counts as real linked prep work", () => {
    const { examLinkedPrepData } = loadStudlinModule({});
    const events = [
      { id: "exam-1", kind: "exam" },
      { id: "s1", dueEventId: "exam-1", status: "pending", isExamPrepSession: true },
    ];
    const r = examLinkedPrepData("exam-1", events, [], []);
    assert.equal(r.hasData, true);
    assert.equal(r.pendingPrepSessions.length, 1);
    assert.equal(r.pendingPrepSessions[0].id, "s1");
  });

  test("an already-completed prep session is real history, not counted -- matches Cancel-sessions' own pending-only rule", () => {
    const { examLinkedPrepData } = loadStudlinModule({});
    const events = [
      { id: "exam-1", kind: "exam" },
      { id: "s1", dueEventId: "exam-1", status: "done", isExamPrepSession: true },
    ];
    const r = examLinkedPrepData("exam-1", events, [], []);
    assert.equal(r.hasData, false);
    assert.equal(r.pendingPrepSessions.length, 0);
  });

  test("a deck-review session (carries deckId, no interleavedReview) is NOT itself counted as a generic pending session -- it's covered via linkedDecks instead", () => {
    const { examLinkedPrepData } = loadStudlinModule({});
    const events = [
      { id: "exam-1", kind: "exam" },
      { id: "s1", dueEventId: "exam-1", status: "pending", isExamPrepSession: true, deckId: "deck-1" },
    ];
    const decks = [{ id: "deck-1", examEventId: "exam-1" }];
    const r = examLinkedPrepData("exam-1", events, decks, []);
    assert.equal(r.pendingPrepSessions.length, 0, "deck-linked session excluded from the generic count");
    assert.equal(r.linkedDecks.length, 1);
    assert.equal(r.hasData, true, "still real linked prep work overall, via the deck");
  });

  test("an interleaved review session (deckId AND interleavedReview) IS counted as real prep work directly", () => {
    const { examLinkedPrepData } = loadStudlinModule({});
    const events = [
      { id: "exam-1", kind: "exam" },
      { id: "s1", dueEventId: "exam-1", status: "pending", isExamPrepSession: true, deckId: "deck-1", interleavedReview: true },
    ];
    const decks = [{ id: "deck-1", examEventId: "exam-1" }];
    const r = examLinkedPrepData("exam-1", events, decks, []);
    assert.equal(r.pendingPrepSessions.length, 1);
  });

  test("a deck shared with a DIFFERENT exam is still found via examEventIds (the multi-exam-linkable shape)", () => {
    const { examLinkedPrepData } = loadStudlinModule({});
    const decks = [{ id: "deck-1", examEventId: "exam-1", examEventIds: ["exam-1", "exam-2"] }];
    const r = examLinkedPrepData("exam-2", [], decks, []);
    assert.equal(r.linkedDecks.length, 1);
    assert.equal(r.hasData, true);
  });

  test("a linked practice exam counts as real linked prep work", () => {
    const { examLinkedPrepData } = loadStudlinModule({});
    const pes = [{ id: "pe-1", examEventId: "exam-1" }];
    const r = examLinkedPrepData("exam-1", [], [], pes);
    assert.equal(r.linkedPracticeExams.length, 1);
    assert.equal(r.hasData, true);
  });
});

describe("applyExamTypeSwitchCleanup (Fix 1: the actual cleanup on switch-away)", () => {
  test("removes pending generic prep sessions but leaves completed ones alone", () => {
    const { applyExamTypeSwitchCleanup } = loadStudlinModule({});
    const events = [
      { id: "exam-1", kind: "exam" },
      { id: "s1", dueEventId: "exam-1", status: "pending", isExamPrepSession: true },
      { id: "s2", dueEventId: "exam-1", status: "done", isExamPrepSession: true },
    ];
    const r = applyExamTypeSwitchCleanup(events, "exam-1", [], []);
    const ids = r.events.map(e => e.id);
    assert.equal(ids.includes("s1"), false, "pending prep session removed");
    assert.equal(ids.includes("s2"), true, "completed prep session stays -- real history, not touched");
    assert.equal(ids.includes("exam-1"), true, "the exam marker itself is untouched by this function -- field clearing is examTypeSwitchFieldPatch's job");
  });

  test("a deck linked to ONLY this exam is deleted outright, along with its review sessions for this exam", () => {
    const { applyExamTypeSwitchCleanup } = loadStudlinModule({});
    const events = [
      { id: "exam-1", kind: "exam" },
      { id: "rev1", dueEventId: "exam-1", deckId: "deck-1", status: "pending" },
      { id: "rev2", dueEventId: "exam-1", deckId: "deck-1", status: "done" },
    ];
    const decks = [{ id: "deck-1", examEventId: "exam-1", examEventIds: ["exam-1"] }];
    const r = applyExamTypeSwitchCleanup(events, "exam-1", decks, []);
    assert.equal(r.decks.length, 0, "deck fully deleted -- it wasn't shared with any other exam");
    const ids = r.events.map(e => e.id);
    assert.equal(ids.includes("rev1"), false);
    assert.equal(ids.includes("rev2"), false, "even a completed deck-review session is removed -- matches Studlin Prep's own deleteDeckAndSessions behavior");
  });

  test("a deck shared with another exam is only UNLINKED from this one, not deleted -- the other exam's own link and sessions are untouched", () => {
    const { applyExamTypeSwitchCleanup } = loadStudlinModule({});
    const events = [
      { id: "exam-1", kind: "exam" }, { id: "exam-2", kind: "exam" },
      { id: "rev1", dueEventId: "exam-1", deckId: "deck-1", status: "pending" },
      { id: "rev2", dueEventId: "exam-2", deckId: "deck-1", status: "pending" },
    ];
    const decks = [{ id: "deck-1", examEventId: "exam-1", examEventIds: ["exam-1", "exam-2"] }];
    const r = applyExamTypeSwitchCleanup(events, "exam-1", decks, []);
    assert.equal(r.decks.length, 1, "deck itself survives -- still linked to exam-2");
    assert.equal(r.decks[0].examEventIds.includes("exam-1"), false);
    assert.equal(r.decks[0].examEventIds.includes("exam-2"), true);
    assert.equal(r.decks[0].examEventId, "exam-2", "the singular legacy field is repointed at whatever's left");
    const ids = r.events.map(e => e.id);
    assert.equal(ids.includes("rev1"), false, "exam-1's own review session for this deck is removed");
    assert.equal(ids.includes("rev2"), true, "exam-2's review session for the SAME deck must survive untouched");
  });

  test("a linked practice exam is deleted along with its sessions", () => {
    const { applyExamTypeSwitchCleanup } = loadStudlinModule({});
    const events = [
      { id: "exam-1", kind: "exam" },
      { id: "peSession", practiceExamId: "pe-1", dueEventId: "exam-1", status: "pending" },
    ];
    const pes = [{ id: "pe-1", examEventId: "exam-1" }];
    const r = applyExamTypeSwitchCleanup(events, "exam-1", [], pes);
    assert.equal(r.practiceExams.length, 0);
    assert.equal(r.events.some(e => e.id === "peSession"), false);
  });

  test("events completely unrelated to this exam are never touched", () => {
    const { applyExamTypeSwitchCleanup } = loadStudlinModule({});
    const events = [
      { id: "exam-1", kind: "exam" },
      { id: "other-task", title: "Unrelated homework", status: "pending" },
      { id: "other-exam-session", dueEventId: "some-other-exam", status: "pending", isExamPrepSession: true },
    ];
    const r = applyExamTypeSwitchCleanup(events, "exam-1", [], []);
    const ids = r.events.map(e => e.id);
    assert.equal(ids.includes("other-task"), true);
    assert.equal(ids.includes("other-exam-session"), true);
  });

  test("an exam with nothing linked at all is a complete no-op", () => {
    const { applyExamTypeSwitchCleanup } = loadStudlinModule({});
    const events = [{ id: "exam-1", kind: "exam" }, { id: "unrelated", status: "pending" }];
    const r = applyExamTypeSwitchCleanup(events, "exam-1", [{ id: "d1", examEventId: "some-other-exam" }], [{ id: "pe1", examEventId: "some-other-exam" }]);
    assert.equal(r.events.length, 2);
    assert.equal(r.decks.length, 1);
    assert.equal(r.practiceExams.length, 1);
  });
});

describe("projectDropFieldPatch (Fix 1: Project-only fields on a Type switch)", () => {
  test("switching AWAY from an existing real project clears phases, outline, AND sharedProjectId", () => {
    const { projectDropFieldPatch } = loadStudlinModule({});
    const patch = projectDropFieldPatch(true, false);
    assert.equal(Object.keys(patch).length, 3);
    assert.equal(Object.prototype.hasOwnProperty.call(patch, "phases"), true);
    assert.equal(Object.prototype.hasOwnProperty.call(patch, "outline"), true);
    assert.equal(Object.prototype.hasOwnProperty.call(patch, "sharedProjectId"), true);
    assert.equal(patch.phases, undefined);
    assert.equal(patch.outline, undefined);
    assert.equal(patch.sharedProjectId, undefined);
  });

  test("an already-existing project staying a project is untouched", () => {
    const { projectDropFieldPatch } = loadStudlinModule({});
    assert.equal(Object.keys(projectDropFieldPatch(true, true)).length, 0);
  });

  test("a plain (never-project) item switching between non-project types is untouched", () => {
    const { projectDropFieldPatch } = loadStudlinModule({});
    assert.equal(Object.keys(projectDropFieldPatch(false, false)).length, 0);
  });

  test("newly turning Project ON is not this function's job -- it stays a no-op here (phases/outline are built separately, only once real detail is provided)", () => {
    const { projectDropFieldPatch } = loadStudlinModule({});
    assert.equal(Object.keys(projectDropFieldPatch(false, true)).length, 0);
  });
});
