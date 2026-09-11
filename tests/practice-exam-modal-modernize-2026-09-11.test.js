// User report, 2026-09-11, with a screenshot: the standalone "Add
// Practice Exam" modal (Studlin Prep) had a wrapped row of Subject chips
// that turns into a visual mess once a student has more than a few
// classes, a fixed manual question-count picker with no "auto" option
// (unlike Flashcards' own sibling "Create a deck" modal, which already
// has one), and a dead genLoading state that was set but never actually
// rendered anywhere.
//
// Investigation found scaledQuizCount already existed and was already
// used by FIVE other practice-exam generation entry points (exam-linked
// generation, Build Study Plan, the AI chat flow) -- this standalone
// modal was the only one still using a fixed count, real evidence it had
// simply never been migrated when the others adopted auto-scaling.
//
// scaledQuizCount/scaledFlashcardCount are real, exported, pure functions
// -- tested with real invocations. The modal's own UI wiring and the
// genLoading cleanup are component-closure, so those are source-level
// regression guards, same mixed-coverage convention this session has
// used throughout. Run with `npm test`.
const { test, describe } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");
const { loadStudlinModule } = require("./harness.js");

const SOURCE = fs.readFileSync(path.join(__dirname, "..", "studlin-app.jsx"), "utf8");

describe("scaledQuizCount: real question-count scaling already used elsewhere in the app", () => {
  test("no material at all falls back to a sensible flat default", () => {
    const { scaledQuizCount } = loadStudlinModule({ now: "2026-09-11T09:00:00" });
    assert.equal(scaledQuizCount(0), 8);
    assert.equal(scaledQuizCount(null), 8);
  });
  test("scales up with more real material, capped at a sane maximum", () => {
    const { scaledQuizCount } = loadStudlinModule({ now: "2026-09-11T09:00:00" });
    assert.equal(scaledQuizCount(16200), 9); // 16200/1800 = 9
    assert.equal(scaledQuizCount(100000), 25);
  });
  test("never drops below the flat minimum even for a tiny amount of material", () => {
    const { scaledQuizCount } = loadStudlinModule({ now: "2026-09-11T09:00:00" });
    assert.equal(scaledQuizCount(50), 8);
  });
});

describe("Add Practice Exam modal: Subject is now a dropdown, not a wrapped chip row", () => {
  test("uses CustomSelect, matching every other 'pick one class' field in the app", () => {
    const idx = SOURCE.indexOf('Field label="Subject (optional)"');
    assert.ok(idx > -1, "the Subject field should still exist");
    const body = SOURCE.slice(idx, idx + 400);
    assert.ok(body.includes("<CustomSelect boxed value={peSubject} onChange={setPeSubject}"), "must render as a CustomSelect dropdown");
    assert.equal(body.includes('.map(s=>(\n              <button'), false, "the old per-option chip button loop must be gone");
  });
});

describe("Add Practice Exam modal: question count now offers Auto, defaulting to it", () => {
  test("peQuestionCount's initial state and reset both default to \"auto\"", () => {
    assert.match(SOURCE, /const \[peQuestionCount,setPeQuestionCount\]=useState\("auto"\);/);
    const idx = SOURCE.indexOf("const resetPeForm=()=>{");
    assert.ok(idx > -1);
    const body = SOURCE.slice(idx, idx + 300);
    assert.ok(body.includes('setPeQuestionCount("auto")'), "resetting the form must restore the auto default, not the old fixed 8");
  });

  test("the picker includes an Auto option alongside the manual counts, with an explanatory hint when selected", () => {
    const idx = SOURCE.indexOf('Field label="Number of questions"');
    assert.ok(idx > -1);
    const body = SOURCE.slice(idx, idx + 900);
    assert.ok(body.includes('[5,8,10,12,"auto"]'), "Auto must be a real option alongside the existing manual counts");
    assert.ok(body.includes('hint={peQuestionCount==="auto"?"Studlin decides based on how much material there is.":undefined}'), "must explain what Auto does, same as Flashcards' own identical concept");
  });

  test("generateStandalonePE resolves \"auto\" via scaledQuizCount instead of passing the literal string to the AI call", () => {
    const idx = SOURCE.indexOf("const generateStandalonePE=async()=>{");
    assert.ok(idx > -1);
    const body = SOURCE.slice(idx, idx + 500);
    assert.ok(body.includes('const count=peQuestionCount==="auto"?scaledQuizCount(peMaterialText.length):peQuestionCount;'));
    assert.ok(body.includes("generateQuizFromText(peMaterialText,subj||\"this material\",count)"), "must pass the RESOLVED count, not peQuestionCount directly");
  });
});

describe("Dead genLoading state removed (was set, never read/rendered anywhere)", () => {
  test("genLoading is completely gone from the source, not just unused", () => {
    assert.equal(/\bgenLoading\b/.test(SOURCE.replace(/\/\/.*$/gm, "")), false, "no live code should reference genLoading anymore (comments referencing the old name for context are fine)");
  });

  test("doGenDeckForExam/doGenPracticeExamForExam still work without it -- their real loading feedback is buildPlanLoading's ExtractionProgress, unaffected by this cleanup", () => {
    const idx = SOURCE.indexOf("const commitBuildPlan=async()=>{");
    assert.ok(idx > -1);
    const body = SOURCE.slice(idx, idx + 3000);
    assert.ok(body.includes("genDeck=await doGenDeckForExam();"));
    assert.ok(body.includes("genPE=await doGenPracticeExamForExam();"));
    const loadingIdx = SOURCE.indexOf('{buildPlanLoading?(');
    assert.ok(loadingIdx > -1, "the real loading UI for this operation must still exist");
    const loadingBody = SOURCE.slice(loadingIdx, loadingIdx + 700);
    assert.ok(loadingBody.includes("ExtractionProgress"), "must still show the real progress UI, not a plain disabled-button label");
  });
});
