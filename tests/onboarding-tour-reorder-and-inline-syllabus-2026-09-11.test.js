// User report, 2026-09-11, with two screenshots: the quick-demo tour ran
// BEFORE onboarding, over a completely empty calendar, dimmed almost to
// black; and reviewing a class during onboarding had no way to scan that
// specific class's syllabus inline, only a "you can add a syllabus for
// this class anytime from Courses" deferral.
//
// Two fixes, all component-closure UI (ClassSetupWizard/CalendarTab/
// TourStep), so these are source-level regression guards, same convention
// this session has used throughout for this exact file. Run with `npm test`.
const { test, describe } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");

const SOURCE = fs.readFileSync(path.join(__dirname, "..", "studlin-app.jsx"), "utf8");

describe("Tour now runs AFTER onboarding, not before", () => {
  test("classSetupOpen's initial state no longer excludes a fresh account", () => {
    const idx = SOURCE.indexOf("const [classSetupOpen,setClassSetupOpen]=useState(");
    assert.ok(idx > -1, "classSetupOpen should still exist");
    const line = SOURCE.slice(idx, idx + 400);
    assert.ok(line.includes('useState(()=>!lsGet("subjects-configured",false)&&!lsGet("hasConfiguredRoutine",false)'), "must open for ANY unconfigured account (fresh or not), not defer for fresh accounts specifically");
    assert.equal(line.includes("isFreshAccount"), false, "the old fresh-account exclusion must be gone");
  });

  test("calTourStep no longer auto-starts on mount for a fresh account", () => {
    const idx = SOURCE.indexOf("const [calTourStep,setCalTourStep]=useState(");
    assert.ok(idx > -1);
    const line = SOURCE.slice(idx, idx + 60);
    assert.ok(line.includes("useState(-1)"), "must always start hidden (-1), not isFreshAccount?0:-1");
  });

  test("advanceCalTour/skipCalTour no longer open the wizard themselves -- that used to be the ONLY place it opened for a fresh account", () => {
    const idx = SOURCE.indexOf("const advanceCalTour=()=>{");
    assert.ok(idx > -1);
    const body = SOURCE.slice(idx, SOURCE.indexOf("const skipCalTour=()=>{", idx) + 200);
    assert.equal(body.includes("setClassSetupOpen(true)"), false, "the tour finishing must no longer be what opens the wizard -- the wizard now opens first");
  });

  test("finishClassSetup starts the tour once onboarding finishes, only for a fresh account that hasn't seen it", () => {
    const idx = SOURCE.indexOf("const finishClassSetup=(newIds)=>{");
    assert.ok(idx > -1);
    const body = SOURCE.slice(idx, idx + 700);
    assert.ok(body.includes('if(isFreshAccount&&!lsGet("seenCalendarTour",false))setCalTourStep(0);'), "must kick off the tour here, using the pre-wizard isFreshAccount snapshot");
  });
});

describe("Tour dimming is lighter -- the calendar underneath should stay visible", () => {
  test("TourStep's anchored (spotlight) surround is no longer near-opaque black", () => {
    const idx = SOURCE.indexOf("function TourStep(");
    assert.ok(idx > -1);
    const body = SOURCE.slice(idx, idx + 4200);
    assert.equal(body.includes("rgba(0,0,0,0.92)"), false, "the old 0.92 alpha blackout must be gone");
    assert.ok(body.includes("rgba(0,0,0,0.45)"), "must use a lighter surround so the populated calendar stays legible");
  });
  test("TourStep's non-anchored (centered) overlay is lighter and no longer blurs the calendar", () => {
    const idx = SOURCE.indexOf("function TourStep(");
    const body = SOURCE.slice(idx, idx + 4200);
    assert.equal(body.includes("rgba(8,12,10,0.75)"), false, "the old 0.75 alpha must be gone");
    assert.equal(body.includes("backdropFilter"), false, "the blur must be gone too -- it made an already-dim calendar unreadable");
    assert.ok(body.includes("rgba(8,12,10,0.4)"));
  });
});

describe("Inline per-class syllabus scan during onboarding review", () => {
  test("the items review step offers '+ Add syllabus for this class', not just a deferral to Courses", () => {
    const idx = SOURCE.indexOf('Assignments, exams &amp; projects</div>');
    assert.ok(idx > -1, "the assignments/exams/projects section should still exist");
    const body = SOURCE.slice(idx, idx + 1800);
    assert.ok(body.includes("+ Add syllabus for this class"), "must offer an inline scan action");
    assert.ok(body.includes('setAddMode("scanForThisClass")'), "the button must open the new inline-scan addMode");
    assert.ok(body.includes("None found yet — scan this class's syllabus below"), "the empty-state copy must point at the new inline action, not just describe the old Courses deferral");
  });

  test("mergeExtractionIntoReview merges into review.items instead of replacing the review", () => {
    const idx = SOURCE.indexOf("const mergeExtractionIntoReview=(result,sourceText)=>{");
    assert.ok(idx > -1, "mergeExtractionIntoReview should exist");
    const body = SOURCE.slice(idx, idx + 700);
    assert.ok(body.includes("items:[...r.items,...mapDeadlinesToReviewItems(result.deadlines,"), "must APPEND to the existing items, not overwrite them");
    assert.ok(body.includes("setReview(r=>({"), "must use the functional setReview form to read the review already in progress");
    assert.ok(body.includes('setAddMode("review");'), "must return to the review screen once merged");
  });

  test("mapDeadlinesToReviewItems is shared by both buildReviewFromExtraction (fresh) and mergeExtractionIntoReview (merge), with collision-safe ids for the merge case", () => {
    const idx = SOURCE.indexOf("const mapDeadlinesToReviewItems=(deadlines,idPrefix)=>{");
    assert.ok(idx > -1, "the shared mapper should exist");
    const buildIdx = SOURCE.indexOf("const buildReviewFromExtraction=(result,sourceText)=>{");
    // 2300 (was 2000): 2026-09-29 added a pickedCourseId/effectiveCourseId
    // lookup (scanPicker's own real-course signal) just above this.
    const buildBody = SOURCE.slice(buildIdx, buildIdx + 2300);
    assert.ok(buildBody.includes('mapDeadlinesToReviewItems(result.deadlines,"cd")'), "a fresh review's items should still use the plain 'cd' prefix");
    const mergeIdx = SOURCE.indexOf("const mergeExtractionIntoReview=(result,sourceText)=>{");
    const mergeBody = SOURCE.slice(mergeIdx, mergeIdx + 700);
    assert.ok(mergeBody.includes('mapDeadlinesToReviewItems(result.deadlines,"cd-"+Date.now())'), "a merge must use a unique-per-scan id prefix so its items never collide with whatever's already in review.items");
  });

  test("handleScanFile/handlePasteScan accept a merge option and route to mergeExtractionIntoReview instead of buildReviewFromExtraction", () => {
    const idx = SOURCE.indexOf("const handleScanFile=async(e,{merge}={})=>{");
    assert.ok(idx > -1, "handleScanFile must accept the new merge option");
    const body = SOURCE.slice(idx, idx + 3200);
    assert.ok(body.includes("if(merge)mergeExtractionIntoReview(result);else buildReviewFromExtraction(result);"), "image scan branch must route on merge");
    assert.ok(body.includes("if(merge)mergeExtractionIntoReview(result,text);else buildReviewFromExtraction(result,text);"), "file/text scan branch must route on merge");

    const pasteIdx = SOURCE.indexOf("const handlePasteScan=async({merge}={})=>{");
    assert.ok(pasteIdx > -1, "handlePasteScan must accept the new merge option");
    const pasteBody = SOURCE.slice(pasteIdx, pasteIdx + 900);
    assert.ok(pasteBody.includes("if(merge)mergeExtractionIntoReview(result,pasteText);else buildReviewFromExtraction(result,pasteText);"));
  });

  test("the scanForThisClass addMode reuses the same scan UI, wired to merge:true, with its own inline Cancel back to the review", () => {
    const idx = SOURCE.indexOf('addMode==="scanForThisClass"');
    assert.ok(idx > -1, "the new addMode should be checked somewhere");
    const blockIdx = SOURCE.indexOf('{step==="classes"&&(addMode==="scan"||addMode==="scanForThisClass")&&(()=>{');
    assert.ok(blockIdx > -1, "the scan step block must be shared between both addModes, not duplicated");
    const body = SOURCE.slice(blockIdx, blockIdx + 4000);
    assert.ok(body.includes("handleScanFile(e,{merge:forThisClass})"));
    assert.ok(body.includes("handlePasteScan({merge:forThisClass})"));
    assert.ok(body.includes('setAddMode("review");setReviewSub("items");'), "Cancel must return to the in-progress review, not the wizard's normal choose/back flow");
  });
});
