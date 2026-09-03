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

  test("characterization: an exam with no importanceLevel computes byte-identically to before this field existed", () => {
    const m = loadStudlinModule({ now: "2026-08-08T12:00:00" });
    const e = exam({ date: "2026-08-10", examWeight: "major", confidenceLog: ["shaky"], difficulty: 900 });
    assert.equal(e.importanceLevel, undefined, "sanity check -- this fixture predates importanceLevel");
    const p = m.computeSessionPriority(e, "2026-08-08");
    assert.ok(p > 700, "must still fall back to the legacy examWeight table unchanged");
  });

  test("importanceLevel, when present, is used instead of examWeight -- critical outranks major even with the same examWeight", () => {
    const m = loadStudlinModule({ now: "2026-08-08T12:00:00" });
    const majorLevel = exam({ date: "2026-08-10", examWeight: "major", importanceLevel: "major", confidenceLog: ["okay"], difficulty: 500 });
    const criticalLevel = exam({ date: "2026-08-10", examWeight: "major", importanceLevel: "critical", confidenceLog: ["okay"], difficulty: 500 });
    const pMajor = m.computeSessionPriority(majorLevel, "2026-08-08");
    const pCritical = m.computeSessionPriority(criticalLevel, "2026-08-08");
    assert.ok(pCritical > pMajor, "critical (impact 1.0) should score higher than major (impact 0.8) despite identical examWeight");
  });

  test("an unrecognized importanceLevel falls back to major's impact, not a crash", () => {
    const m = loadStudlinModule();
    const e = exam({ importanceLevel: "not-a-real-level" });
    assert.doesNotThrow(() => m.computeSessionPriority(e, "2026-08-08"));
  });
});

describe("computeSessionPriority + gradeWeightPercent (regression: P5 -- collected in 3 places, stored on the exam, but never actually read anywhere)", () => {
  test("no gradeWeightPercent set computes byte-identically to before this field existed", () => {
    const m = loadStudlinModule({ now: "2026-08-08T12:00:00" });
    const e = exam({ date: "2026-08-10", examWeight: "major", confidenceLog: ["okay"], difficulty: 500 });
    assert.equal(e.gradeWeightPercent, undefined, "sanity check -- this fixture predates the field");
    const withField = { ...e, gradeWeightPercent: null };
    assert.equal(m.computeSessionPriority(e, "2026-08-08"), m.computeSessionPriority(withField, "2026-08-08"));
  });

  test("a high percentage (worth a lot of the grade) outranks the same importance at a low percentage", () => {
    const m = loadStudlinModule({ now: "2026-08-08T12:00:00" });
    const heavy = exam({ date: "2026-08-10", importanceLevel: "major", gradeWeightPercent: 40, confidenceLog: ["okay"], difficulty: 500 });
    const light = exam({ date: "2026-08-10", importanceLevel: "major", gradeWeightPercent: 5, confidenceLog: ["okay"], difficulty: 500 });
    const pHeavy = m.computeSessionPriority(heavy, "2026-08-08");
    const pLight = m.computeSessionPriority(light, "2026-08-08");
    assert.ok(pHeavy > pLight, "a 40%-of-grade exam should outrank a 5%-of-grade exam with the same self-reported importance");
  });

  test("a typical/baseline percentage (~20%) barely nudges the score at all", () => {
    const m = loadStudlinModule({ now: "2026-08-08T12:00:00" });
    const noField = exam({ date: "2026-08-10", importanceLevel: "major", confidenceLog: ["okay"], difficulty: 500 });
    const baseline = exam({ date: "2026-08-10", importanceLevel: "major", gradeWeightPercent: 20, confidenceLog: ["okay"], difficulty: 500 });
    assert.equal(m.computeSessionPriority(noField, "2026-08-08"), m.computeSessionPriority(baseline, "2026-08-08"));
  });

  test("an extreme percentage never blows past the score's own 0-1000 bounds", () => {
    const m = loadStudlinModule({ now: "2026-08-08T12:00:00" });
    const e = exam({ date: "2026-08-10", importanceLevel: "critical", gradeWeightPercent: 100, confidenceLog: ["shaky"], difficulty: 1000 });
    const p = m.computeSessionPriority(e, "2026-08-08");
    assert.ok(p >= 0 && p <= 1000, "got " + p);
  });

  test("a zero percentage never crashes or goes negative", () => {
    const m = loadStudlinModule();
    const e = exam({ importanceLevel: "minor", gradeWeightPercent: 0 });
    assert.doesNotThrow(() => m.computeSessionPriority(e, "2026-08-08"));
    const p = m.computeSessionPriority(e, "2026-08-08");
    assert.ok(p >= 0);
  });
});

describe("richer exam importance (examType -> importanceLevel -> legacy examWeight)", () => {
  test("EXAM_TYPE_TO_IMPORTANCE covers every exam type with a sane default", () => {
    const m = loadStudlinModule();
    assert.equal(m.EXAM_TYPE_TO_IMPORTANCE.quiz, "moderate");
    assert.equal(m.EXAM_TYPE_TO_IMPORTANCE.midterm, "major");
    assert.equal(m.EXAM_TYPE_TO_IMPORTANCE.final, "critical");
    assert.equal(m.EXAM_TYPE_TO_IMPORTANCE.project, "major");
    assert.equal(m.EXAM_TYPE_TO_IMPORTANCE.other, "moderate");
  });

  test("examWeightFromImportance collapses minor/moderate to quiz, major/critical to major", () => {
    const m = loadStudlinModule();
    assert.equal(m.examWeightFromImportance("minor"), "quiz");
    assert.equal(m.examWeightFromImportance("moderate"), "quiz");
    assert.equal(m.examWeightFromImportance("major"), "major");
    assert.equal(m.examWeightFromImportance("critical"), "major");
  });

  test("withDerivedExamImportance derives importanceLevel + legacy examWeight from an AI-extracted examType", () => {
    const m = loadStudlinModule();
    const it = m.withDerivedExamImportance({ title: "Final Exam", kind: "exam", examType: "final" });
    assert.equal(it.importanceLevel, "critical");
    assert.equal(it.examWeight, "major");
  });

  test("withDerivedExamImportance is a no-op for non-exam items and items missing examType", () => {
    const m = loadStudlinModule();
    const deadline = { title: "Problem Set", kind: "deadline" };
    assert.deepEqual(m.withDerivedExamImportance(deadline), deadline);
    const noType = { title: "Some Exam", kind: "exam" };
    assert.deepEqual(m.withDerivedExamImportance(noType), noType);
  });
});

describe("performance-grounded confidence (transparent, dismissible suggestion)", () => {
  test("derivePerformanceConfidence returns null with no quiz/practice-exam data at all", () => {
    const m = loadStudlinModule();
    const e = exam({ quizScores: [] });
    m.lsSet("practiceExams", []);
    assert.equal(m.derivePerformanceConfidence(e), null);
  });

  test("derivePerformanceConfidence maps a bad quiz score to shaky", () => {
    const m = loadStudlinModule();
    const e = exam({ quizScores: [{ score: 2, total: 10, at: 1 }] });
    assert.equal(m.derivePerformanceConfidence(e), "shaky");
  });

  test("derivePerformanceConfidence maps a strong score to solid", () => {
    const m = loadStudlinModule();
    const e = exam({ quizScores: [{ score: 9, total: 10, at: 1 }] });
    assert.equal(m.derivePerformanceConfidence(e), "solid");
  });

  test("performanceConfidenceSuggestion flags a genuine divergence (performance worse than last self-report)", () => {
    const m = loadStudlinModule();
    const e = exam({ confidenceLog: ["solid"], quizScores: [{ score: 1, total: 10, at: 1 }] });
    const suggestion = m.performanceConfidenceSuggestion(e);
    assert.ok(suggestion, "expected a suggestion since performance (shaky) is worse than the last self-report (solid)");
    assert.equal(suggestion.suggested, "shaky");
    assert.equal(suggestion.current, "solid");
  });

  test("performanceConfidenceSuggestion stays silent when performance matches or beats the last self-report", () => {
    const m = loadStudlinModule();
    const e = exam({ confidenceLog: ["shaky"], quizScores: [{ score: 9, total: 10, at: 1 }] });
    assert.equal(m.performanceConfidenceSuggestion(e), null, "performance is better than self-reported, nothing to flag");
  });

  test("performanceConfidenceSuggestion never fires with no self-reported baseline to diverge from", () => {
    const m = loadStudlinModule();
    const e = exam({ confidenceLog: [], quizScores: [{ score: 1, total: 10, at: 1 }] });
    assert.equal(m.performanceConfidenceSuggestion(e), null);
  });

  test("dismissPerformanceConfidence suppresses the suggestion until the cooldown passes", () => {
    const m = loadStudlinModule();
    const e = exam({ id: "exam-cooldown", confidenceLog: ["solid"], quizScores: [{ score: 1, total: 10, at: 1 }] });
    assert.ok(m.performanceConfidenceSuggestion(e), "sanity check -- should flag before dismissal");
    m.dismissPerformanceConfidence(e.id);
    assert.equal(m.performanceConfidenceSuggestion(e), null, "must stay quiet immediately after being dismissed");
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

describe("examClusterNudgeFor + computeSessionPriority's 3rd arg (\"banana\" fix -- exam-clustering-aware priority)", () => {
  test("examClusterNudgeFor is 0 with no nearby exams", () => {
    const m = loadStudlinModule();
    assert.equal(m.examClusterNudgeFor(0), 0);
    assert.equal(m.examClusterNudgeFor(undefined), 0);
  });

  test("examClusterNudgeFor grows with more nearby exams, capped at 0.15 -- same cap urgencyNudge/gradeWeightNudge use", () => {
    const m = loadStudlinModule();
    assert.ok(m.examClusterNudgeFor(1) > 0);
    assert.ok(m.examClusterNudgeFor(2) > m.examClusterNudgeFor(1));
    assert.equal(m.examClusterNudgeFor(10), 0.15);
  });

  test("computeSessionPriority omitting the 3rd arg computes byte-identically to before this fix", () => {
    const m = loadStudlinModule({ now: "2026-08-08T12:00:00" });
    const e = exam({ date: "2026-08-10", examWeight: "major", confidenceLog: ["shaky"], difficulty: 900 });
    const withoutArg = m.computeSessionPriority(e, "2026-08-08");
    const withZero = m.computeSessionPriority(e, "2026-08-08", 0);
    assert.equal(withoutArg, withZero);
  });

  test("a nonzero nearbyExamCount raises priority over the same exam with none nearby", () => {
    const m = loadStudlinModule({ now: "2026-08-08T12:00:00" });
    const e = exam({ date: "2026-08-10", examWeight: "major", confidenceLog: ["okay"], difficulty: 500 });
    const isolated = m.computeSessionPriority(e, "2026-08-08", 0);
    const clustered = m.computeSessionPriority(e, "2026-08-08", 2);
    assert.ok(clustered > isolated, "an exam with 2 nearby competing exams should score higher than the same exam alone");
  });

  test("EXAM_CLUSTER_WINDOW_DAYS is 3", () => {
    const m = loadStudlinModule();
    assert.equal(m.EXAM_CLUSTER_WINDOW_DAYS, 3);
  });
});

describe("restampSessionPriorities picks up exam clustering from live events", () => {
  test("an exam 2 days from another pending exam gets a higher restamped priority than one with nothing nearby", () => {
    const m = loadStudlinModule({ now: "2026-08-01T12:00:00" });
    const clustered = exam({ id: "exam-clustered", date: "2026-08-10", examWeight: "major", confidenceLog: ["okay"] });
    const neighbor = exam({ id: "exam-neighbor", date: "2026-08-12", examWeight: "major", confidenceLog: ["okay"] });
    m.lsSet("events", [
      clustered, neighbor,
      session({ id: "sess-clustered", dueEventId: "exam-clustered", status: "pending" }),
    ]);
    m.restampSessionPriorities("exam-clustered");
    const clusteredPriority = m.lsGet("events", []).find(e => e.id === "sess-clustered").priority;

    const isolated = exam({ id: "exam-isolated", date: "2026-08-10", examWeight: "major", confidenceLog: ["okay"] });
    m.lsSet("events", [
      isolated,
      session({ id: "sess-isolated", dueEventId: "exam-isolated", status: "pending" }),
    ]);
    m.restampSessionPriorities("exam-isolated");
    const isolatedPriority = m.lsGet("events", []).find(e => e.id === "sess-isolated").priority;

    assert.ok(clusteredPriority > isolatedPriority, "clustered=" + clusteredPriority + " should exceed isolated=" + isolatedPriority);
  });

  test("a done neighboring exam and a >3-day-away exam don't count as clustering", () => {
    const m = loadStudlinModule({ now: "2026-08-01T12:00:00" });
    const e = exam({ id: "exam-main", date: "2026-08-10", examWeight: "major", confidenceLog: ["okay"] });
    const farAway = exam({ id: "exam-far", date: "2026-08-20", examWeight: "major" });
    const doneNearby = exam({ id: "exam-done", date: "2026-08-11", examWeight: "major", status: "done" });
    m.lsSet("events", [
      e, farAway, doneNearby,
      session({ id: "sess-main", dueEventId: "exam-main", status: "pending" }),
    ]);
    m.restampSessionPriorities("exam-main");
    const withNoise = m.lsGet("events", []).find(ev => ev.id === "sess-main").priority;
    const expected = m.computeSessionPriority(e, "2026-08-01", 0);
    assert.equal(withNoise, expected, "a far-away exam and a done exam must not contribute to the cluster nudge");
  });
});
