// Regression tests for the 2026-08-22 intelligence-audit batch-1 fixes --
// 7 small, independently-scoped bugs found across the personalization/
// scheduling engine during a 100-scenario audit: a completion-quality
// signal that silently dropped for checkbox completions, exam-stakes-blind
// rescheduling, misleading upgrade copy for already-Pro students, a stale
// grade-weight re-score trigger, reliability learning from the wrong clock,
// assignments invisible to week-pressure detection, and flashcard
// generation that ignored known weak spots. Run with `npm test`.
//
// Two of these (Fix 4's patchExam trigger list and Fix 5's Lock-In
// onComplete handler) live inside component closures the vm harness can't
// invoke directly -- those tests assert against the real source text for
// the specific literal this fix changed (matching the codebase's existing
// precedent for closure-only logic, see tests/prep-exam-detail-render.test.js's
// own note on why loadStudlinModule can't reach that class of code) AND
// exercise the real, exported pure functions the changed literal actually
// feeds into, so a revert of either half would fail a test here.
const { test, describe } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");
const { loadStudlinModule } = require("./harness.js");

const SOURCE = fs.readFileSync(path.join(__dirname, "..", "studlin-app.jsx"), "utf8");

const PREFS_TIGHT = {
  workStartTime: "09:00", workEndTime: "10:00",
  weekendEnabled: false, weekendStartTime: "09:00", weekendEndTime: "10:00",
  bedtime: "23:00", taskDifficultyPreference: "NONE", bufferMarginStrategy: "15_MIN",
  peakHourBuckets: [],
};
const PREFS_ZERO = {
  workStartTime: "09:00", workEndTime: "09:00",
  weekendEnabled: false, weekendStartTime: "09:00", weekendEndTime: "09:00",
  bedtime: "23:00", taskDifficultyPreference: "NONE", bufferMarginStrategy: "15_MIN",
  peakHourBuckets: [],
};
const PREFS_NORMAL = {
  workStartTime: "09:00", workEndTime: "18:00",
  weekendEnabled: false, weekendStartTime: "09:00", weekendEndTime: "18:00",
  bedtime: "23:00", taskDifficultyPreference: "NONE", bufferMarginStrategy: "15_MIN",
  peakHourBuckets: [],
};

describe("Fix 1: checkbox completions now stamp taskId onto completionLog, same as the Lock-In Timer path", () => {
  test("markEventDone (Dashboard/Calendar checkbox) stamps the task's own id so a later confidence check-in can find and rate it", () => {
    const m = loadStudlinModule();
    const task = { id: "t1", title: "Study bio", date: "2026-07-20", time: "10:00", subject: "Biology", kind: "study block", notes: "", priority: 500, difficulty: 500, deadline: null, duration: 30, status: "pending", timeSpent: 0, completedAt: null };
    m.localStorage.setItem("studlin-events", JSON.stringify([task]));
    m.markEventDone("t1");
    const log = m.lsGet("completionLog", []);
    assert.equal(log.length, 1);
    assert.equal(log[0].taskId, "t1", "checkbox completion must stamp the task's own id, matching the timer path's existing 4-arg call shape");
    // This is the actual bug: applyCheckInRating searches completionLog by
    // taskId. Without the id above, this call would silently no-op --
    // getBucketReliability/suggestDurationFor's quality-weighting would
    // never see the student's real "how'd it go" answer.
    m.applyCheckInRating("t1", "solid");
    const logAfter = m.lsGet("completionLog", []);
    assert.equal(logAfter[0].rating, "solid", "the check-in rating must actually attach now that the row can be found by taskId");
  });

  test("a rating submitted for a task that was never stamped (regression guard) correctly still no-ops rather than corrupting an unrelated row", () => {
    const m = loadStudlinModule();
    m.localStorage.setItem("studlin-completionLog", JSON.stringify([{ bucket: "morning", outcome: "done", t: 1 }]));
    m.applyCheckInRating("nonexistent-id", "shaky");
    const log = m.lsGet("completionLog", []);
    assert.equal(log[0].rating, undefined, "a rating call for an id with no matching row must not attach to some other row");
  });
});

describe("Fix 2: Reschedule (computePausePlan) is now exam-stakes-aware", () => {
  test("a critical, urgent exam's prep session now wins a scarce slot over a low-stakes item that was simply earlier on the clock (regression: this exact scenario used to let the low-stakes item win)", () => {
    const m = loadStudlinModule({ now: "2026-07-15T08:00:00" });
    m.setSchedulePreferences(PREFS_TIGHT);
    const clearDate = "2026-08-01";
    const destDate = "2026-08-02"; // clear_day's computeNewDate = date + 1
    // Fills most of destDate's 09:00-10:00 window, leaving room for only
    // ONE of the two 25-min items below once real breathing-room buffers
    // are counted -- a genuine either/or, not just "everything fits".
    const occupier = { id: "occ-1", date: destDate, time: "09:00", subject: "", kind: "study block", notes: "", priority: 500, difficulty: 500, deadline: null, duration: 10, status: "pending", timeSpent: 0, completedAt: null };
    // Low-stakes: no exam link, scheduled EARLIER in the day than the
    // high-stakes item below -- under the old date/time-only sort this is
    // exactly what let it win the slot race.
    const lowPriority = { id: "low-1", title: "Flashcard review", date: clearDate, time: "07:00", subject: "", kind: "study block", notes: "", priority: 1, difficulty: 1, deadline: destDate, duration: 25, status: "pending", timeSpent: 0, completedAt: null, dueEventId: null, isExamPrepSession: false };
    const examA = { id: "examA", title: "Final Exam", date: "2026-07-17", kind: "exam", importanceLevel: "critical", status: "pending", time: "12:00", priority: 500 };
    const highPriority = { id: "high-1", title: "Final exam prep", date: clearDate, time: "08:00", subject: "", kind: "study block", notes: "", priority: 500, difficulty: 500, deadline: destDate, duration: 25, status: "pending", timeSpent: 0, completedAt: null, dueEventId: "examA", isExamPrepSession: true };
    m.localStorage.setItem("studlin-events", JSON.stringify([occupier, lowPriority, examA, highPriority]));
    const result = m.computePausePlan({ intent: "clear_day", date: clearDate });
    const movedIds = result.moved.map((x) => x.id);
    const couldntMoveIds = result.couldntMove.map((x) => x.id);
    assert.ok(movedIds.includes("high-1"), "the critical exam's prep session must claim the scarce slot");
    assert.ok(couldntMoveIds.includes("low-1"), "the low-stakes item must be the one left without a slot, not the other way around");
  });

  test("an unreschedulable session linked to a critical/soon exam gets a distinct, specifically-worded warning; a plain unlinked item does not", () => {
    const m = loadStudlinModule({ now: "2026-07-15T08:00:00" });
    m.setSchedulePreferences(PREFS_ZERO); // zero-width window -- nothing can ever fit
    const clearDate = "2026-08-01";
    const destDate = "2026-08-02";
    const examA = { id: "examA", title: "Final Exam", date: "2026-07-19", kind: "exam", importanceLevel: "critical", status: "pending" };
    const highPriority = { id: "high-1", title: "Final exam prep", date: clearDate, time: "09:00", kind: "study block", duration: 25, deadline: destDate, status: "pending", dueEventId: "examA", isExamPrepSession: true, priority: 500, difficulty: 500 };
    const lowPriority = { id: "low-1", title: "Flashcard review", date: clearDate, time: "09:00", kind: "study block", duration: 25, deadline: destDate, status: "pending", dueEventId: null, priority: 500, difficulty: 500 };
    m.localStorage.setItem("studlin-events", JSON.stringify([examA, highPriority, lowPriority]));
    const result = m.computePausePlan({ intent: "clear_day", date: clearDate });
    const highEntry = result.couldntMove.find((x) => x.id === "high-1");
    const lowEntry = result.couldntMove.find((x) => x.id === "low-1");
    assert.ok(highEntry, "the exam-linked session must be in couldntMove (zero-capacity window)");
    assert.ok(lowEntry, "the plain item must also be in couldntMove");
    assert.ok(highEntry.examWarning, "a critical exam's stranded prep session must carry a distinct warning the student sees before confirming");
    assert.equal(highEntry.examWarning.examTitle, "Final Exam");
    assert.equal(highEntry.examWarning.daysUntilExam, 4);
    assert.ok(!lowEntry.examWarning, "a plain, non-exam-linked item must not be flagged with an exam warning");
  });
});

describe("Fix 3: Pro users hitting a usage cap see honest copy, not \"upgrade to Pro\"", () => {
  const monthKey = () => new Date().toISOString().slice(0, 7);

  test("Free plan -> reason is free-tier, and the original boolean gate is completely unchanged", () => {
    const m = loadStudlinModule();
    m.setPlanLS("Free");
    assert.equal(m.canGenQuizReason(), "free-tier");
    assert.equal(m.canGenQuiz(), false, "this fix must not touch the underlying gate's pass/fail result");
  });

  test("Pro, under every cap -> reason is falsy (allowed), gate is true", () => {
    const m = loadStudlinModule();
    m.setPlanLS("Pro");
    assert.ok(!m.canGenQuizReason());
    assert.equal(m.canGenQuiz(), true);
  });

  test("Pro but over the shared AI-spend ceiling -> spend-ceiling, not free-tier", () => {
    const m = loadStudlinModule();
    m.setPlanLS("Pro");
    m.localStorage.setItem("studlin-aiSpendMills", JSON.stringify({ month: monthKey(), count: 4000 })); // > PRO_MONTHLY_AI_SPEND_CEILING*1000 (3500)
    assert.equal(m.canGenQuizReason(), "spend-ceiling");
    assert.equal(m.canGenQuiz(), false, "still correctly blocked -- only the reported reason changes, never the gate");
  });

  test("Pro, under the spend ceiling, but over this feature's own monthly cap -> feature-cap", () => {
    const m = loadStudlinModule();
    m.setPlanLS("Pro");
    m.localStorage.setItem("studlin-quizGens", JSON.stringify({ month: monthKey(), count: 9999 }));
    assert.equal(m.canGenQuizReason(), "feature-cap");
    assert.equal(m.canGenQuiz(), false);
  });

  test("the same three-reason contract holds for the other two siblings named in the audit (canScanSyllabus/canScanScreenshot)", () => {
    const m = loadStudlinModule();
    m.setPlanLS("Free");
    assert.equal(m.canScanSyllabusReason(), "free-tier");
    assert.equal(m.canScanScreenshotReason(), "free-tier");
    m.setPlanLS("Pro");
    assert.ok(!m.canScanSyllabusReason());
    assert.ok(!m.canScanScreenshotReason());
    m.localStorage.setItem("studlin-syllabusScans", JSON.stringify({ month: monthKey(), count: 9999 }));
    assert.equal(m.canScanSyllabusReason(), "feature-cap");
    assert.ok(!m.canScanScreenshotReason(), "one feature's cap must never bleed into a sibling feature's own reason");
  });
});

describe("One free syllabus scan for Free-plan accounts (2026-08-26: syllabus scan used to block every Free user outright with zero access ever; the very first scan is free now, tracked as a lifetime flag rather than a monthly allowance since -- unlike a flat-cost schedule/grid scan -- a syllabus scan is per-class and shouldn't scale free access with course load)", () => {
  test("a fresh Free account can scan once", () => {
    const m = loadStudlinModule();
    m.setPlanLS("Free");
    assert.equal(m.canScanSyllabus(), true);
  });

  test("recordSyllabusScan on a Free account spends the one-time flag, not the Pro monthly counter", () => {
    const m = loadStudlinModule();
    m.setPlanLS("Free");
    m.recordSyllabusScan();
    assert.equal(m.canScanSyllabus(), false, "the free scan is spent");
    assert.equal(m.getSyllabusScanUsage().count, 0, "a Free account's free scan must never consume the Pro monthly pool");
  });

  test("a Free account that's used its free scan still reports free-tier as the block reason -- same upgrade copy as before this change", () => {
    const m = loadStudlinModule();
    m.setPlanLS("Free");
    m.recordSyllabusScan();
    assert.equal(m.canScanSyllabusReason(), "free-tier");
  });

  test("upgrading to Pro after spending the free scan grants the full, untouched Pro monthly allowance", () => {
    const m = loadStudlinModule();
    m.setPlanLS("Free");
    m.recordSyllabusScan();
    m.setPlanLS("Pro");
    assert.equal(m.canScanSyllabus(), true);
    assert.equal(m.getSyllabusScanUsage().count, 0, "the Free lifetime flag and the Pro monthly counter must be entirely separate pools");
  });
});

describe("Fix 4: editing an exam's gradeWeightPercent alone now re-scores its already-scheduled sessions", () => {
  test("patchExam's restamp-trigger field list includes gradeWeightPercent (source-level regression guard -- this literal lives inside a component closure the harness can't call directly)", () => {
    const match = SOURCE.match(/if\(\[([^\]]*)\]\.some\(k=>k in patch\)\)restampSessionPriorities\(examId\);/);
    assert.ok(match, "patchExam's restamp-trigger array literal must still exist in its expected shape");
    assert.ok(match[1].includes('"gradeWeightPercent"'), "gradeWeightPercent must be in the trigger list, or a grade-weight-only edit silently leaves sessions stale until something else happens to re-trigger a restamp");
  });

  test("restampSessionPriorities (the real, exported function this trigger calls) actually produces a higher score once a heavy gradeWeightPercent is added -- proves the pipeline the trigger fires into does something real", () => {
    const m = loadStudlinModule();
    const examNoWeight = { id: "examA", title: "Final", date: "2026-08-20", kind: "exam", importanceLevel: "moderate", status: "pending" };
    const session = { id: "s1", title: "Study", date: "2026-08-10", time: "10:00", kind: "study block", status: "pending", isExamPrepSession: true, dueEventId: "examA", priority: 500, duration: 30 };
    m.localStorage.setItem("studlin-events", JSON.stringify([examNoWeight, session]));
    m.restampSessionPriorities("examA");
    const priorityBefore = m.lsGet("events", []).find((e) => e.id === "s1").priority;

    const examWithWeight = { ...examNoWeight, gradeWeightPercent: 45 }; // a real, heavily-weighted exam
    const eventsAfterEdit = m.lsGet("events", []).map((e) => (e.id === "examA" ? examWithWeight : e));
    m.localStorage.setItem("studlin-events", JSON.stringify(eventsAfterEdit));
    m.restampSessionPriorities("examA");
    const priorityAfter = m.lsGet("events", []).find((e) => e.id === "s1").priority;

    assert.ok(priorityAfter > priorityBefore, "a heavily-weighted grade must nudge priority up once restampSessionPriorities is actually called");
  });
});

describe("Fix 5: reliability now learns from when a Lock-In session actually happened, not its scheduled time", () => {
  test("the Lock-In onComplete handler derives the bucket from Date.now() minus elapsed minutes, not timerTask.time (source-level regression guard -- this closure can't be invoked directly)", () => {
    assert.ok(SOURCE.includes('const actualStart=new Date(Date.now()-mins*60000);'), "onComplete must derive the real session start from the clock, not the scheduled time");
    assert.ok(SOURCE.includes('logCompletionOutcome("done",actualStartTime,difficultyTierOf(timerTask),timerTask.id);'), "the timer completion path must log the derived actual-start bucket, not timerTask.time");
    // The other three completion paths (checkbox, checklist, manual-minutes
    // entry) have no real elapsed-time data to derive an actual start from
    // -- they must keep using the event's own scheduled time, unchanged.
    assert.ok(SOURCE.includes('if(target&&target.time)logCompletionOutcome("done",target.time,difficultyTierOf(target),target.id);'), "markEventDone (checkbox) must still use the event's scheduled time");
    assert.ok(SOURCE.includes('if(evTime)logCompletionOutcome("done",evTime,difficultyTierOf(target),taskId);'), "completeTaskWithMinutes must still use the scheduled time, unchanged by this fix");
  });

  test("the actual-start formula this fix uses correctly crosses into a different hour bucket than the scheduled time would have (proves the derivation is meaningful, not a no-op)", () => {
    // Session scheduled for 09:00 (the "morning" bucket) but the student
    // actually procrastinated and ran a 20-minute Lock-In session ending
    // right now (15:00) -- the real work happened in "midday", not
    // "morning". This is exactly the discrepancy the fix closes.
    const m = loadStudlinModule({ now: "2026-07-20T15:00:00" });
    const mins = 20;
    // Matches the "now" the harness froze INSIDE the vm -- the outer test
    // process has its own separate, real Date, so this recomputes the same
    // literal timestamp directly rather than reaching for a bare Date.now()
    // here (which would read the outer process's real wall clock instead).
    const frozenNowMs = new Date("2026-07-20T15:00:00").getTime();
    const actualStart = new Date(frozenNowMs - mins * 60000);
    const actualStartTime = String(actualStart.getHours()).padStart(2, "0") + ":" + String(actualStart.getMinutes()).padStart(2, "0");
    assert.equal(actualStartTime, "14:40");
    assert.equal(m.hourBucket(actualStartTime), "midday");
    assert.equal(m.hourBucket("09:00"), "morning", "the scheduled time alone would have (wrongly) credited the morning bucket");
    assert.notEqual(m.hourBucket(actualStartTime), m.hourBucket("09:00"), "actual start and scheduled time must land in genuinely different buckets for this fix to matter");
  });
});

describe("Fix 6: a week full of assignments now registers as real pressure, not zero", () => {
  test("an assignment's duration now counts toward the week's used capacity (regression: used to be filtered out entirely, only \"study block\" counted)", () => {
    const m = loadStudlinModule();
    const weekDate = "2026-08-03";
    const examEvent = { id: "examA" };
    const before = m.weekPrepLoad(weekDate, examEvent, [], PREFS_NORMAL);
    assert.equal(before.ratio, 0, "sanity: an empty week has zero load");
    const assignment = { id: "hw1", title: "Essay draft", date: weekDate, status: "pending", duration: 2500, kind: "assignment" };
    const after = m.weekPrepLoad(weekDate, examEvent, [assignment], PREFS_NORMAL);
    assert.ok(after.ratio > before.ratio, "an assignment's duration must now count toward used capacity");
    assert.equal(after.isPressured, true, "a week this loaded with assignment work alone must register as pressured");
  });

  test("an assignment can now be named as the week's competing item, same as an exam/deadline already could", () => {
    const m = loadStudlinModule();
    const weekDate = "2026-08-03";
    const examEvent = { id: "examA" };
    const assignment = { id: "hw1", title: "Essay draft", date: weekDate, status: "pending", duration: 60, kind: "assignment", priority: 900 };
    const result = m.weekPrepLoad(weekDate, examEvent, [assignment], PREFS_NORMAL);
    assert.equal(result.competingTitle, "Essay draft", "an assignment must be eligible to be named as the week's competing item");
  });

  test("a study block by itself is still recognized exactly as before this fix (no regression to the existing kind)", () => {
    const m = loadStudlinModule();
    const weekDate = "2026-08-03";
    const examEvent = { id: "examA" };
    const studyBlock = { id: "sb1", title: "Review chem", date: weekDate, status: "pending", duration: 2500, kind: "study block", dueEventId: "some-other-exam" };
    const result = m.weekPrepLoad(weekDate, examEvent, [studyBlock], PREFS_NORMAL);
    assert.equal(result.isPressured, true);
  });
});

describe("Fix 7: flashcard generation can now target known weak spots from a prior practice-exam attempt", () => {
  test("latestWrongTopicsForExam returns the MOST RECENT attempt's wrongTopics for that exam, not an earlier one", () => {
    const m = loadStudlinModule();
    const pe = {
      id: "pe1", examEventId: "examA",
      attempts: [
        { score: 2, total: 5, at: 1000, wrongTopics: ["Photosynthesis"] },
        { score: 4, total: 5, at: 2000, wrongTopics: ["Cell membrane transport"] },
      ],
    };
    m.localStorage.setItem("studlin-practiceExams", JSON.stringify([pe]));
    const topics = m.latestWrongTopicsForExam("examA");
    assert.equal(JSON.stringify(topics), JSON.stringify(["Cell membrane transport"]));
  });

  test("returns an empty array when the exam has no practice-exam attempts yet (a brand-new exam must be unaffected)", () => {
    const m = loadStudlinModule();
    m.localStorage.setItem("studlin-practiceExams", JSON.stringify([]));
    assert.equal(m.latestWrongTopicsForExam("examA").length, 0);
  });

  test("generateFlashcardsFromText threads a focus list into the actual AI prompt, targeting known weak spots", async () => {
    const m = loadStudlinModule();
    let capturedBody = null;
    m.fetch = async (url, opts) => {
      capturedBody = JSON.parse(opts.body);
      return { json: async () => ({ reply: JSON.stringify([{ q: "Q1", a: "A1" }]) }) };
    };
    const cards = await m.generateFlashcardsFromText("some material", "Biology", 10, "Photosynthesis, Cell membrane transport");
    assert.equal(cards.length, 1);
    const prompt = capturedBody.messages[0].t;
    assert.ok(prompt.includes("Photosynthesis, Cell membrane transport"), "the weak-spot topics must actually reach the AI prompt");
  });

  test("omitting focus leaves the prompt completely unaffected -- every existing caller that doesn't pass one must see zero behavior change", async () => {
    const m = loadStudlinModule();
    let capturedBody = null;
    m.fetch = async (url, opts) => {
      capturedBody = JSON.parse(opts.body);
      return { json: async () => ({ reply: JSON.stringify([{ q: "Q1", a: "A1" }]) }) };
    };
    await m.generateFlashcardsFromText("some material", "Biology", 10);
    const prompt = capturedBody.messages[0].t;
    assert.ok(!prompt.includes("gotten wrong before"), "no focus instruction text should appear when focus is omitted");
  });
});
