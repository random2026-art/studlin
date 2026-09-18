// User report, 2026-09-18 (screenshot): "why is it that this question is
// like on every task shouldnt it be for exams or assignments not for
// tasks etc its very annoying" -- the "How did that session go?" /
// "How do you feel about the exam so far?" confidence check-in used to
// fire for ANY completed kind:"study block" item other than a routine
// habit or a co-op session. A plain generic Task (isGeneralTask:true,
// created with no linked exam/assignment at all) also resolves to
// kind:"study block" -- "how'd it go, how confident do you feel" has no
// real meaning for "buy textbook" or "email professor."
//
// Fix: both trigger points (handleTaskCompleted's checkbox-completion
// path, and the Lock-In Timer completion path) now also require
// task.dueEventId -- the same field the check-in Modal's own title
// already branches on ("the exam" vs. a plain session), just now also
// used to gate whether the modal shows at all, not only how it's worded.
// This directly supersedes an earlier, deliberate decision (see the
// "not just exam-prep sessions anymore" comment this replaced) based on
// fresh direct user feedback that the broadened version was actively
// annoying.
//
// Source-level regression guards -- component-closure UI, same
// mixed-coverage convention this file's other completion-flow fixes use.
const { test, describe } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");

const SOURCE = fs.readFileSync(path.join(__dirname, "..", "studlin-app.jsx"), "utf8");

describe("Exam/assignment check-in no longer fires for plain generic tasks", () => {
  test("handleTaskCompleted's checkbox-completion path requires task.dueEventId, not just kind+!routineId", () => {
    const idx = SOURCE.indexOf("const handleTaskCompleted=(taskId)=>{");
    assert.notEqual(idx, -1);
    const body = SOURCE.slice(idx, idx + 1400);
    assert.match(body, /else if\(task\.kind==="study block"&&!task\.routineId&&task\.dueEventId\)\{/);
    assert.doesNotMatch(body, /else if\(task\.kind==="study block"&&!task\.routineId\)\{/, "the old, too-broad condition must not survive as a stray leftover");
  });

  test("the Lock-In Timer completion path requires timerTask.dueEventId too, mirroring the same fix", () => {
    const idx = SOURCE.indexOf('if(timerTask.kind==="study block"&&!timerTask.routineId&&!timerTask.studySessionId&&timerTask.dueEventId){');
    assert.notEqual(idx, -1, "the fixed condition must exist");
    assert.doesNotMatch(SOURCE, /if\(timerTask\.kind==="study block"&&!timerTask\.routineId&&!timerTask\.studySessionId\)\{/, "the old, too-broad condition must not survive anywhere else in the file");
  });

  test("the check-in Modal's own title logic (which this fix reuses as its gating signal) is unchanged", () => {
    const idx = SOURCE.indexOf("<Modal open={!!examCheckIn}");
    assert.notEqual(idx, -1);
    const body = SOURCE.slice(idx, idx + 250);
    assert.match(body, /title=\{examCheckIn&&examCheckIn\.dueEventId\?"How do you feel about the exam so far\?":"How did that session go\?"\}/);
  });

  test("startDiagnosticQuiz's own fallback-to-check-in path is untouched -- it's only ever reached after a dueEventId-backed examEvent lookup already succeeded, so it was never the source of the bug", () => {
    const idx = SOURCE.indexOf("const startDiagnosticQuiz=async(task,examEvent,materialText)=>{");
    assert.notEqual(idx, -1);
    const body = SOURCE.slice(idx, idx + 1100);
    assert.match(body, /setDiagnosticQuiz\(null\);setExamCheckIn\(task\);return;/);
  });
});
