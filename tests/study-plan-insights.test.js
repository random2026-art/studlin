// Studlin Insights -- the new Prep tab (subject x time-of-day reliability,
// attention balance) plus the exam-detail readiness trajectory chart. Only
// the pure data functions are covered here; the chart/grid/bar components
// themselves are presentational and not unit-tested, same convention every
// other UI-only piece this session has followed.
const { test, describe } = require("node:test");
const assert = require("node:assert/strict");
const { loadStudlinModule } = require("./harness.js");

describe("logCompletionOutcome subject stamping", () => {
  test("a real subject gets stamped onto the log entry", () => {
    const m = loadStudlinModule({ now: "2026-09-14T10:00:00" });
    m.logCompletionOutcome("done", "10:00", "medium", "t1", "Chemistry");
    const log = m.lsGet("completionLog", []);
    assert.equal(log.length, 1);
    assert.equal(log[0].subject, "Chemistry");
  });

  test("no subject passed -- entry has no subject field, never throws", () => {
    const m = loadStudlinModule({ now: "2026-09-14T10:00:00" });
    m.logCompletionOutcome("done", "10:00", "medium", "t1");
    const log = m.lsGet("completionLog", []);
    assert.equal(log[0].subject, undefined);
  });
});

describe("computeSubjectHourReliabilityMatrix", () => {
  test("no completion log at all -> empty array", () => {
    const m = loadStudlinModule();
    assert.equal(m.computeSubjectHourReliabilityMatrix(["Chemistry"]).length, 0);
  });

  test("below MATRIX_MIN_SAMPLE for every bucket -> subject dropped entirely, not shown as an all-null row", () => {
    const m = loadStudlinModule();
    const log = [
      { bucket: "morning", subject: "Chemistry", outcome: "done" },
      { bucket: "morning", subject: "Chemistry", outcome: "done" },
    ];
    m.lsSet("completionLog", log);
    const rows = m.computeSubjectHourReliabilityMatrix(["Chemistry"]);
    assert.equal(rows.length, 0);
  });

  test("a real subject/bucket with enough samples -> a real rate, other buckets stay null (not fabricated)", () => {
    const m = loadStudlinModule();
    const log = [];
    for (let i = 0; i < 6; i++) log.push({ bucket: "morning", subject: "Chemistry", outcome: "done" });
    m.lsSet("completionLog", log);
    const rows = m.computeSubjectHourReliabilityMatrix(["Chemistry"]);
    assert.equal(rows.length, 1);
    assert.equal(rows[0].subject, "Chemistry");
    const morning = rows[0].cells.find((c) => c.bucketId === "morning");
    const evening = rows[0].cells.find((c) => c.bucketId === "evening");
    assert.equal(morning.rate, 1);
    assert.equal(evening.rate, null);
  });

  test("a mix of done and missed produces a real partial rate, not just 0 or 1", () => {
    const m = loadStudlinModule();
    const log = [
      { bucket: "evening", subject: "Biology", outcome: "done" },
      { bucket: "evening", subject: "Biology", outcome: "done" },
      { bucket: "evening", subject: "Biology", outcome: "missed" },
      { bucket: "evening", subject: "Biology", outcome: "missed" },
    ];
    m.lsSet("completionLog", log);
    const rows = m.computeSubjectHourReliabilityMatrix(["Biology"]);
    const evening = rows[0].cells.find((c) => c.bucketId === "evening");
    assert.equal(evening.rate, 0.5);
  });

  test("old subject-less log rows are silently excluded, never misattributed", () => {
    const m = loadStudlinModule();
    const log = [
      { bucket: "morning", outcome: "done" },
      { bucket: "morning", outcome: "done" },
      { bucket: "morning", outcome: "done" },
      { bucket: "morning", outcome: "done" },
    ];
    m.lsSet("completionLog", log);
    assert.equal(m.computeSubjectHourReliabilityMatrix(["Chemistry"]).length, 0);
  });
});

describe("computeReadinessTrajectory", () => {
  test("an exam with no linked sessions -> empty array", () => {
    const m = loadStudlinModule({ now: "2026-09-14T08:00:00" });
    const exam = { id: "exam1", kind: "exam", date: "2026-09-20" };
    assert.equal(m.computeReadinessTrajectory(exam, [], "2026-09-14").length, 0);
  });

  test("planned cumulative reaches the full session count by the last session's date", () => {
    const m = loadStudlinModule({ now: "2026-09-14T08:00:00" });
    const exam = { id: "exam1", kind: "exam", date: "2026-09-20" };
    const sessions = [
      { id: "s1", dueEventId: "exam1", date: "2026-09-14", status: "pending" },
      { id: "s2", dueEventId: "exam1", date: "2026-09-16", status: "pending" },
      { id: "s3", dueEventId: "exam1", date: "2026-09-18", status: "pending" },
    ];
    const trajectory = m.computeReadinessTrajectory(exam, sessions, "2026-09-14");
    const last = trajectory[trajectory.length - 1];
    assert.equal(last.plannedCumulative, 3);
  });

  test("a completed session with a real completedAt counts on that day, not its originally scheduled day", () => {
    const m = loadStudlinModule({ now: "2026-09-20T08:00:00" });
    const exam = { id: "exam1", kind: "exam", date: "2026-09-25" };
    const sessions = [
      // Scheduled for the 14th but actually finished on the 16th.
      { id: "s1", dueEventId: "exam1", date: "2026-09-14", status: "done", completedAt: new Date("2026-09-16T09:00:00").getTime() },
    ];
    const trajectory = m.computeReadinessTrajectory(exam, sessions, "2026-09-20");
    const day15 = trajectory.find((p) => p.date === "2026-09-15");
    const day16 = trajectory.find((p) => p.date === "2026-09-16");
    assert.equal(day15.actualCumulative, 0);
    assert.equal(day16.actualCumulative, 1);
  });

  test("a done session missing completedAt (an older path) falls back to its scheduled date instead of vanishing", () => {
    const m = loadStudlinModule({ now: "2026-09-20T08:00:00" });
    const exam = { id: "exam1", kind: "exam", date: "2026-09-25" };
    const sessions = [{ id: "s1", dueEventId: "exam1", date: "2026-09-14", status: "done" }];
    const trajectory = m.computeReadinessTrajectory(exam, sessions, "2026-09-20");
    const day14 = trajectory.find((p) => p.date === "2026-09-14");
    assert.equal(day14.actualCumulative, 1);
  });

  test("a pending (not done) session never counts toward actualCumulative", () => {
    const m = loadStudlinModule({ now: "2026-09-20T08:00:00" });
    const exam = { id: "exam1", kind: "exam", date: "2026-09-25" };
    const sessions = [{ id: "s1", dueEventId: "exam1", date: "2026-09-14", status: "pending" }];
    const trajectory = m.computeReadinessTrajectory(exam, sessions, "2026-09-20");
    assert.ok(trajectory.every((p) => p.actualCumulative === 0));
  });
});

describe("computeAttentionBalance", () => {
  test("no done events with a subject -> empty array", () => {
    const m = loadStudlinModule();
    assert.equal(m.computeAttentionBalance([], "2026-09-14").length, 0);
  });

  test("real timeSpent is used when present, duration is the fallback", () => {
    const m = loadStudlinModule();
    const events = [
      { subject: "Chemistry", status: "done", timeSpent: 45, duration: 30 },
      { subject: "Biology", status: "done", duration: 20 },
    ];
    const rows = m.computeAttentionBalance(events, "2026-09-14");
    const chem = rows.find((r) => r.subject === "Chemistry");
    const bio = rows.find((r) => r.subject === "Biology");
    assert.equal(chem.minutesInvested, 45);
    assert.equal(bio.minutesInvested, 20);
  });

  test("a subject with a real upcoming pending exam gets a real daysUntilExam", () => {
    const m = loadStudlinModule();
    const events = [
      { subject: "Chemistry", status: "done", timeSpent: 60 },
      { id: "exam1", kind: "exam", subject: "Chemistry", status: "pending", date: "2026-09-18" },
    ];
    const rows = m.computeAttentionBalance(events, "2026-09-14");
    assert.equal(rows[0].daysUntilExam, 4);
  });

  test("a subject with no upcoming exam gets null, not a fabricated number", () => {
    const m = loadStudlinModule();
    const events = [{ subject: "Biology", status: "done", timeSpent: 60 }];
    const rows = m.computeAttentionBalance(events, "2026-09-14");
    assert.equal(rows[0].daysUntilExam, null);
  });

  test("rows are sorted by minutes invested, descending", () => {
    const m = loadStudlinModule();
    const events = [
      { subject: "Biology", status: "done", timeSpent: 20 },
      { subject: "Chemistry", status: "done", timeSpent: 90 },
    ];
    const rows = m.computeAttentionBalance(events, "2026-09-14");
    assert.equal(rows[0].subject, "Chemistry");
    assert.equal(rows[1].subject, "Biology");
  });

  test("a subject-less or not-done event is never counted", () => {
    const m = loadStudlinModule();
    const events = [
      { subject: "", status: "done", timeSpent: 100 },
      { subject: "Chemistry", status: "pending", timeSpent: 100 },
    ];
    assert.equal(m.computeAttentionBalance(events, "2026-09-14").length, 0);
  });
});
