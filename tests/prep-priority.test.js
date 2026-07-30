// Studlin Prep: preparedness bar + dynamic session priority (2026-07-31).
// computeSessionPriority replaces the flat priority:5 every AI-generated
// study session used to get regardless of the real exam behind it.
// computePreparedness is the bar's own number, additive next to
// computeExamReadiness's existing behind/at-risk/on-track state (untouched
// by this work). restampSessionPriorities keeps priority current after a
// confidence check-in, quiz score, or practice-exam attempt -- the exact
// scenario confirmed in discussion: session 1 finishes "solid", sessions
// 2/3 need to actually go down in priority as a result.
const { test, describe } = require("node:test");
const assert = require("node:assert/strict");
const { loadStudlinModule } = require("./harness.js");

function exam(overrides) {
  return {
    id: "exam-1", title: "Chem Final", date: "2026-08-10", time: "09:00",
    subject: "Chemistry", kind: "exam", notes: "", priority: 5, difficulty: 500,
    deadline: null, duration: null, status: "pending", timeSpent: 0,
    completedAt: null, examWeight: "major", confidenceLog: [], ...overrides,
  };
}

function session(overrides) {
  return {
    id: "sess-1", title: "Study: Chem Final", date: "2026-08-05", time: "16:00",
    subject: "Chemistry", kind: "study block", notes: "", priority: 500,
    difficulty: 500, deadline: "2026-08-10", duration: 25, status: "pending",
    timeSpent: 0, completedAt: null, dueEventId: "exam-1", isExamPrepSession: true,
    ...overrides,
  };
}

describe("computeSessionPriority", () => {
  test("major + shaky + near deadline + hard scores high", () => {
    const m = loadStudlinModule({ now: "2026-08-08T12:00:00" });
    const e = exam({ date: "2026-08-10", examWeight: "major", confidenceLog: ["shaky"], difficulty: 900 });
    const p = m.computeSessionPriority(e, "2026-08-08");
    assert.ok(p > 700, "expected a high priority, got " + p);
  });

  test("quiz + solid + far out + easy scores low", () => {
    const m = loadStudlinModule({ now: "2026-08-01T12:00:00" });
    const e = exam({ date: "2026-08-30", examWeight: "quiz", confidenceLog: ["solid"], difficulty: 100 });
    const p = m.computeSessionPriority(e, "2026-08-01");
    assert.ok(p < 300, "expected a low priority, got " + p);
  });

  test("missing examWeight/confidenceLog falls back to neutral defaults without throwing", () => {
    const m = loadStudlinModule();
    const e = { id: "exam-2", date: "2026-08-20", difficulty: 500 };
    assert.doesNotThrow(() => m.computeSessionPriority(e, "2026-08-10"));
    const p = m.computeSessionPriority(e, "2026-08-10");
    assert.ok(p >= 0 && p <= 1000);
  });

  test("null exam returns the neutral default", () => {
    const m = loadStudlinModule();
    assert.equal(m.computeSessionPriority(null, "2026-08-10"), 500);
  });
});

describe("computePreparedness", () => {
  test("zero linked sessions returns score:null", () => {
    const m = loadStudlinModule();
    m.lsSet("events", [exam()]);
    const prep = m.computePreparedness(exam(), [exam()], "2026-08-01");
    assert.equal(prep.score, null);
  });

  test("completion alone (no confidence/quiz data) still produces a valid 0-100", () => {
    const m = loadStudlinModule();
    const e = exam({ confidenceLog: [] });
    const events = [e, session({ status: "done" }), session({ id: "sess-2", status: "pending" })];
    const prep = m.computePreparedness(e, events, "2026-08-01");
    assert.ok(prep.score >= 0 && prep.score <= 100);
    assert.equal(JSON.stringify(prep.breakdown), JSON.stringify(["completion"]));
  });

  test("adding a solid confidence rating raises the score over an otherwise-identical shaky one", () => {
    const m = loadStudlinModule();
    const events = (log) => [
      exam({ confidenceLog: log }),
      session({ status: "done" }),
      session({ id: "sess-2", status: "pending" }),
    ];
    const shaky = m.computePreparedness(exam({ confidenceLog: ["shaky"] }), events(["shaky"]), "2026-08-01");
    const solid = m.computePreparedness(exam({ confidenceLog: ["solid"] }), events(["solid"]), "2026-08-01");
    assert.ok(solid.score > shaky.score, "solid (" + solid.score + ") should exceed shaky (" + shaky.score + ")");
  });

  test("quiz score is included and shifts the score toward the quiz result", () => {
    const m = loadStudlinModule();
    const base = exam({ confidenceLog: [], quizScores: [] });
    const withQuiz = exam({ confidenceLog: [], quizScores: [{ score: 1, total: 10, at: 1 }] });
    const events = [session({ status: "done" }), session({ id: "sess-2", status: "pending" })];
    const noQuiz = m.computePreparedness(base, [base, ...events], "2026-08-01");
    const badQuiz = m.computePreparedness(withQuiz, [withQuiz, ...events], "2026-08-01");
    assert.ok(!noQuiz.breakdown.includes("examScore"));
    assert.ok(badQuiz.breakdown.includes("examScore"));
    assert.ok(badQuiz.score < noQuiz.score, "a bad quiz score should pull preparedness down");
  });

  test("score never exceeds the 0-100 bounds", () => {
    const m = loadStudlinModule();
    const e = exam({ confidenceLog: ["solid", "solid"], quizScores: [{ score: 10, total: 10, at: 1 }] });
    const events = [e, session({ status: "done" }), session({ id: "sess-2", status: "done" })];
    const prep = m.computePreparedness(e, events, "2026-08-01");
    assert.ok(prep.score >= 0 && prep.score <= 100);
  });
});

describe("restampSessionPriorities", () => {
  test("recomputes and updates every pending, auto-managed session for the exam", () => {
    const m = loadStudlinModule({ now: "2026-08-08T12:00:00" });
    const e = exam({ confidenceLog: [], examWeight: "major" });
    const before = m.computeSessionPriority(e, "2026-08-08");
    m.lsSet("events", [
      e,
      session({ id: "sess-2", priority: before, status: "pending" }),
      session({ id: "sess-3", priority: before, status: "pending" }),
    ]);
    // Simulate the confirmed scenario: student checks in "solid" on this exam.
    const updated = { ...e, confidenceLog: ["solid"] };
    const all = m.lsGet("events", []).map(ev => ev.id === e.id ? updated : ev);
    m.lsSet("events", all);
    m.restampSessionPriorities(e.id);
    const after = m.lsGet("events", []);
    const expected = m.computeSessionPriority(updated, "2026-08-08");
    assert.equal(after.find(ev => ev.id === "sess-2").priority, expected);
    assert.equal(after.find(ev => ev.id === "sess-3").priority, expected);
    assert.ok(expected < before, "a 'solid' check-in should lower priority, got before=" + before + " after=" + expected);
  });

  test("leaves a manually-overridden session (priorityAutoManaged:false) untouched", () => {
    const m = loadStudlinModule({ now: "2026-08-08T12:00:00" });
    const e = exam({ confidenceLog: ["solid"] });
    m.lsSet("events", [
      e,
      session({ id: "sess-2", priority: 999, status: "pending", priorityAutoManaged: false }),
      session({ id: "sess-3", priority: 500, status: "pending" }),
    ]);
    m.restampSessionPriorities(e.id);
    const after = m.lsGet("events", []);
    assert.equal(after.find(ev => ev.id === "sess-2").priority, 999, "manually-overridden session must not change");
    assert.notEqual(after.find(ev => ev.id === "sess-3").priority, 500, "auto-managed sibling should still update");
  });

  test("leaves done sessions and other exams' sessions untouched", () => {
    const m = loadStudlinModule({ now: "2026-08-08T12:00:00" });
    const e = exam({ confidenceLog: ["solid"] });
    const other = exam({ id: "exam-2" });
    m.lsSet("events", [
      e, other,
      session({ id: "sess-done", status: "done", priority: 123 }),
      session({ id: "sess-other", dueEventId: "exam-2", priority: 321, status: "pending" }),
    ]);
    m.restampSessionPriorities(e.id);
    const after = m.lsGet("events", []);
    assert.equal(after.find(ev => ev.id === "sess-done").priority, 123);
    assert.equal(after.find(ev => ev.id === "sess-other").priority, 321);
  });

  test("no-ops harmlessly for an unknown exam id", () => {
    const m = loadStudlinModule();
    m.lsSet("events", [session()]);
    assert.doesNotThrow(() => m.restampSessionPriorities("does-not-exist"));
  });
});
