// User idea, 2026-09-11: "since the class schedule or syllabus might
// include start and end term we should ask for that before asking for
// start and end term... thats less stuff for the user to have to fill
// out." Confirmed direction: "yes like its supposed to autofill... but
// user could edit it."
//
// Two parts:
//  1. Extraction prompts (CLASS_SYLLABUS_JSON_CONTRACT/
//     COLLEGE_SCHEDULE_JSON_CONTRACT) now ask for termStart/termEnd when
//     the source explicitly states them, and the four extract* functions
//     validate the shape (looksLikeDateString) before trusting it.
//  2. ClassSetupWizard's step order moved Courses ahead of End of Term
//     (WIZARD_STEP_ORDER/WIZARD_STEPPER + the actual forward-nav chain),
//     and any scan that finds real term dates pre-fills the still-fully-
//     editable End of Term step via applyExtractedTermDates (first value
//     found wins; never overwrites a value the student already has).
//
// looksLikeDateString is real/exported/pure -- tested with real
// invocations. Everything else is component-closure UI (ClassSetupWizard)
// or a prompt string with no live AI call to test against, so those are
// source-level regression guards, same mixed-coverage convention this
// session has used throughout. Run with `npm test`.
const { test, describe } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");
const { loadStudlinModule } = require("./harness.js");

const SOURCE = fs.readFileSync(path.join(__dirname, "..", "studlin-app.jsx"), "utf8");

describe("looksLikeDateString: shape guard before a scan-extracted term date reaches a DateField", () => {
  test("accepts a real YYYY-MM-DD string", () => {
    const { looksLikeDateString } = loadStudlinModule({ now: "2026-09-11T09:00:00" });
    assert.equal(looksLikeDateString("2026-12-12"), true);
  });
  test("rejects malformed or non-date strings", () => {
    const { looksLikeDateString } = loadStudlinModule({ now: "2026-09-11T09:00:00" });
    assert.equal(looksLikeDateString("December 12, 2026"), false);
    assert.equal(looksLikeDateString("2026-12"), false);
    assert.equal(looksLikeDateString(""), false);
  });
  test("rejects non-string values (null, undefined, a number) without throwing", () => {
    const { looksLikeDateString } = loadStudlinModule({ now: "2026-09-11T09:00:00" });
    assert.equal(looksLikeDateString(null), false);
    assert.equal(looksLikeDateString(undefined), false);
    assert.equal(looksLikeDateString(20261212), false);
  });
});

describe("Extraction prompts ask for term dates, only when explicitly stated", () => {
  test("CLASS_SYLLABUS_JSON_CONTRACT includes termStart/termEnd in its JSON shape and never-infer guidance", () => {
    const idx = SOURCE.indexOf("const CLASS_SYLLABUS_JSON_CONTRACT=");
    assert.ok(idx > -1);
    const body = SOURCE.slice(idx, idx + 2000);
    // Source is a JS string literal with escaped quotes (\" not ") --
    // String.raw matches those literal backslash-quote pairs as they
    // actually appear in the file text, not the JSON value they encode.
    assert.ok(body.includes(String.raw`\"termStart\":\"2026-08-25\",\"termEnd\":\"2026-12-12\"`), "the JSON shape example must include term dates");
    assert.ok(body.includes("ONLY when the source explicitly states them"), "must never guess a term date from unrelated content");
  });

  test("COLLEGE_SCHEDULE_JSON_CONTRACT puts termStart/termEnd at the top level, not per-class", () => {
    const idx = SOURCE.indexOf("const COLLEGE_SCHEDULE_JSON_CONTRACT=");
    assert.ok(idx > -1);
    const body = SOURCE.slice(idx, idx + 2600);
    const termIdx = body.indexOf(String.raw`\"termStart\":\"2026-08-25\",\"termEnd\":\"2026-12-12\"`);
    const classesIdx = body.indexOf(String.raw`\"classes\":[{\"subject\"`);
    assert.ok(termIdx > -1, "the JSON shape example must include term dates");
    assert.ok(classesIdx > -1 && termIdx < classesIdx, "term dates must appear before the classes array, i.e. top-level");
    assert.ok(body.includes("top-level, ONE pair for the whole schedule, not per-class"), "must be explicit that this isn't a per-class field");
  });

  test("all four extraction functions validate termStart/termEnd with looksLikeDateString before returning them", () => {
    ["extractClassSyllabusText","extractClassSyllabusImage","extractCollegeScheduleText","extractCollegeScheduleImage"].forEach(fnName=>{
      const idx = SOURCE.indexOf("async function "+fnName+"(");
      assert.ok(idx > -1, fnName+" should still exist");
      const body = SOURCE.slice(idx, idx + 3600);
      assert.ok(body.includes("looksLikeDateString(parsed&&parsed.termStart)"), fnName+" must validate termStart before trusting it");
      assert.ok(body.includes("looksLikeDateString(parsed&&parsed.termEnd)"), fnName+" must validate termEnd before trusting it");
    });
  });
});

describe("applyExtractedTermDates: first real value wins, stays editable, skipped for quickScan", () => {
  test("only sets a field when it's currently empty -- never overwrites an already-set value", () => {
    const idx = SOURCE.indexOf("const applyExtractedTermDates=(result)=>{");
    assert.ok(idx > -1);
    const body = SOURCE.slice(idx, idx + 400);
    assert.ok(body.includes("if(result.termStart&&!termStart)setTermStart(result.termStart);"));
    assert.ok(body.includes("if(result.termEnd&&!termEnd)setTermEnd(result.termEnd);"));
    assert.ok(body.includes("if(quickScan)return;"), "quickScan (importing one more class post-onboarding) never shows a term step at all -- must not touch it");
  });

  test("called from every scan path that can discover term dates: single-class build/merge, and both whole-schedule handlers", () => {
    const buildIdx = SOURCE.indexOf("const buildReviewFromExtraction=(result,sourceText)=>{");
    assert.ok(SOURCE.slice(buildIdx, buildIdx + 200).includes("applyExtractedTermDates(result);"));

    const mergeIdx = SOURCE.indexOf("const mergeExtractionIntoReview=(result,sourceText)=>{");
    assert.ok(SOURCE.slice(mergeIdx, mergeIdx + 200).includes("applyExtractedTermDates(result);"));

    const fileIdx = SOURCE.indexOf("const handleCollegeScheduleFile=async(e)=>{");
    const fileBody = SOURCE.slice(fileIdx, fileIdx + 3000);
    assert.ok(fileBody.includes("applyExtractedTermDates(result);"), "handleCollegeScheduleFile must call it (checked across both its image and text branches)");
    assert.equal((fileBody.match(/applyExtractedTermDates\(result\);/g)||[]).length, 2, "both the image branch and the text branch must call it");

    const pasteIdx = SOURCE.indexOf("const handleCollegeSchedulePaste=async()=>{");
    const pasteBody = SOURCE.slice(pasteIdx, pasteIdx + 700);
    assert.ok(pasteBody.includes("applyExtractedTermDates(result);"));
  });
});

describe("Courses now runs before End of Term in the wizard's actual step order", () => {
  test("WIZARD_STEP_ORDER has status/classes ahead of term", () => {
    assert.match(SOURCE, /const WIZARD_STEP_ORDER=\["status","classes","term","awake","personalize","activities","calendarSync","finalReview"\];/);
  });

  test("WIZARD_STEPPER (the visible progress labels) matches the new order", () => {
    const idx = SOURCE.indexOf("const WIZARD_STEPPER=[");
    const body = SOURCE.slice(idx, idx + 400);
    const statusIdx = body.indexOf('{key:"status"');
    const classesIdx = body.indexOf('{key:"classes"');
    const termIdx = body.indexOf('{key:"term"');
    assert.ok(statusIdx > -1 && classesIdx > -1 && termIdx > -1);
    assert.ok(statusIdx < classesIdx && classesIdx < termIdx, "stepper must list Courses (status+classes) before End of Term");
  });

  test("a fresh account (term unknown) starts at status if status is also unknown, or classes directly if status is already known", () => {
    const idx = SOURCE.indexOf('setStep(quickScan?"classes":((term&&term.start&&term.end)?"classes":(knowsStatus?"classes":"status")));');
    assert.ok(idx > -1, "the mount-effect initial-step logic must reflect the new order");
  });

  test("the status step's HS/College choice goes straight to classes, not awake", () => {
    assert.match(SOURCE, /setStatus\("highschool"\);setStep\("classes"\);/);
    assert.match(SOURCE, /setStatus\("college"\);setStep\("classes"\);/);
  });

  test("finishing the classes step goes to term next (or skips to awake if term is already configured), not activities", () => {
    const idx = SOURCE.indexOf('quickScan?setStep("finalReview"):setStep(knowsTerm?"awake":"term")');
    assert.ok(idx > -1, "classes' own Done/Skip button must route to term (or skip it) instead of the old activities target");
  });

  test("the term step's own Continue/Skip goes to awake unconditionally now (status is always already resolved by the time term is reached)", () => {
    // Anchored on this fix's own comment, not the bare "{step===..." guard,
    // which also matches an earlier, unrelated render further up the file.
    const idx = SOURCE.indexOf("status is guaranteed already resolved by");
    assert.ok(idx > -1, "the term footer's own explanatory comment should still be there");
    const body = SOURCE.slice(idx, idx + 400);
    assert.ok(body.includes('setStep("awake")'));
    assert.equal(body.includes('knowsStatus?"awake":"status"'), false, "the old status-uncertain branch must be gone -- status can no longer be unresolved by the time term is reached");
  });

  test("personalize now advances to activities, not classes (classes moved earlier in the order)", () => {
    // Same anchoring issue -- "{step==="personalize"..." also matches the
    // earlier main-content render, not just this footer block -- take the
    // SECOND occurrence specifically.
    const firstIdx = SOURCE.indexOf('{step==="personalize"&&(<>');
    assert.ok(firstIdx > -1);
    const idx = SOURCE.indexOf('{step==="personalize"&&(<>', firstIdx + 1);
    assert.ok(idx > -1, "the personalize footer block should still exist");
    const body = SOURCE.slice(idx, idx + 200);
    assert.ok(body.includes('setStep("activities")'));
  });
});
