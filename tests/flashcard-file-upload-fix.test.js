// Regression tests for a 2026-08-27 fix reported live: a student's photo/
// screenshot in Downloads didn't even show up in Flashcards' file picker
// when creating a deck "From file." Investigation found two separate real
// bugs, both fixed here:
//
// 1. Flashcards' file-based deck creation was silently broken for EVERY
//    file type, not just images. Its handleFile destructured
//    {text,truncated,empty} from extractFileText's return value, but a
//    stale, component-local `const extractFileText` (predating the real
//    top-level extractFileText's {text,truncated,empty} object shape)
//    shadowed the correct, shared, already-working function that Studlin
//    Prep's own two upload paths use correctly. Destructuring an object
//    shape off a plain string return value made `text` (and every other
//    field) `undefined` for every upload -- the AI was receiving the
//    literal string "undefined" as material, not real file content, for
//    every deck ever built this way. Deleting the shadow fixes this for
//    every existing file type immediately, with no other code change.
//
// 2. No file-upload path anywhere in the app (Flashcards, Studlin Prep's
//    exam-material upload, its practice-exam upload, or MaterialEditor)
//    could read a photo/screenshot at all -- only PDF/Word/plain text.
//    A photo saved in Downloads is a completely normal way for a student
//    to have their notes, and depending on the browser, a file that
//    doesn't match an <input accept> list can fail to even appear in the
//    picker, which is what the live report actually looked like from the
//    outside.
//
// extractFileText/extractStudyTextFromImage are both fundamentally
// browser/network-dependent (FileReader, window.mammoth, window._pdfjs,
// authFetch) -- this file's own extractFileText had zero prior test
// coverage for the exact same reason (no File/FileReader/mammoth stubs
// exist in this suite's harness), so these are source-level regression
// guards, consistent with how the rest of this session's untestable-
// component-and-network logic has been covered. canScanScreenshot/
// recordScreenshotScan themselves (reused here, not reimplemented) already
// have real test coverage elsewhere (intelligence-audit-batch1.test.js,
// scheduling.test.js's pricing-pass GATES table) and aren't re-tested here.
const { test, describe } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");

const SOURCE = fs.readFileSync(path.join(__dirname, "..", "studlin-app.jsx"), "utf8");

describe("Bug 1: Flashcards' broken local extractFileText shadow is gone", () => {
  test("Flashcards no longer declares its own local extractFileText -- handleFile must resolve to the shared top-level one", () => {
    const flashcardsSource = SOURCE.slice(SOURCE.indexOf("function Flashcards("), SOURCE.indexOf("function Notes("));
    assert.doesNotMatch(flashcardsSource, /const extractFileText\s*=/,
      "a re-introduced local shadow would silently break flashcard-from-file generation again, exactly as before this fix");
  });

  test("Flashcards' handleFile still calls extractFileText with (file, onProgress), matching the shared function's real signature", () => {
    assert.match(SOURCE, /const \{text,truncated,empty\}=await extractFileText\(file,pct=>setExtractProgress\(p=>p\?\{\.\.\.p,pct\}:p\)\);/);
  });
});

describe("Bug 2: image support in the shared extractFileText/extractStudyTextFromImage", () => {
  test("extractStudyTextFromImage exists as a real top-level function with a NO_CONTENT_FOUND sentinel for an image with nothing usable in it", () => {
    assert.match(SOURCE, /async function extractStudyTextFromImage\(base64Data,mediaType\)\{/);
    assert.match(SOURCE, /NO_CONTENT_FOUND/);
  });

  test("extractFileText's new image branch enforces a file-size cap before ever attempting a network call", () => {
    assert.match(SOURCE, /if\(file\.size>EXTRACT_FILE_TEXT_MAX_IMAGE_BYTES\)\{/);
  });

  test("extractFileText's image branch is gated by the existing canScanScreenshot/canScanScreenshotReason pair, not a new one-off check", () => {
    assert.match(SOURCE, /if\(!canScanScreenshot\(\)\)\{\s*const reason=canScanScreenshotReason\(\);/);
  });

  test("a successful image extraction records real usage via the existing recordScreenshotScan, same cost-tracking every other image-reading feature already uses", () => {
    assert.match(SOURCE, /if\(error\)return \{text:error,truncated:false,empty:true\};\s*recordScreenshotScan\(\);\s*return finalizeExtractedText\(text\);/);
  });

  test("the gate check and the recordScreenshotScan call live centrally inside extractFileText itself, not duplicated at each of its 4 call sites -- so a future new call site gets correct Pro-gating automatically for free", () => {
    // recordScreenshotScan is a shared, pre-existing function also called
    // by other unrelated image-scan features (ClassSetupWizard's schedule
    // scans, etc.) -- this isn't asserting global uniqueness across the
    // whole file, just that extractFileText's own image branch is the kind
    // of place where ONE call handles it for every caller, rather than
    // Flashcards/Studlin Prep/MaterialEditor each needing their own
    // separate canScanScreenshot+recordScreenshotScan wiring.
    const extractFileTextBody = SOURCE.slice(SOURCE.indexOf("async function extractFileText(file,onProgress){"), SOURCE.indexOf("async function extractFileText(file,onProgress){") + 2500);
    const gateMatches = extractFileTextBody.match(/canScanScreenshot\(\)/g) || [];
    const recordMatches = extractFileTextBody.match(/recordScreenshotScan\(\);/g) || [];
    assert.equal(gateMatches.length, 1, "expected exactly one canScanScreenshot() check inside extractFileText's own body");
    assert.equal(recordMatches.length, 1, "expected exactly one recordScreenshotScan() call inside extractFileText's own body");
  });
});

describe("All 4 upload entry points that share extractFileText now accept image files", () => {
  test("Flashcards' \"From file\" deck-creation upload accepts images", () => {
    assert.match(SOURCE, /accept="\.txt,\.md,\.csv,\.pdf,\.doc,\.docx,\.rtf,\.png,\.jpg,\.jpeg,\.webp,\.gif"/);
  });

  test("Studlin Prep's exam-material upload accepts images", () => {
    assert.match(SOURCE, /<input type="file" ref=\{fileInputRef\} onChange=\{handlePrepFile\} accept="\.txt,\.md,\.pdf,\.docx,\.png,\.jpg,\.jpeg,\.webp,\.gif"/);
  });

  test("Studlin Prep's standalone practice-exam upload accepts images", () => {
    assert.match(SOURCE, /<input type="file" ref=\{peFileRef\} onChange=\{handlePeFile\} accept="\.txt,\.md,\.pdf,\.docx,\.png,\.jpg,\.jpeg,\.webp,\.gif"/);
  });

  test("MaterialEditor's shared per-item upload (projects/assignments) accepts images", () => {
    assert.match(SOURCE, /<input type="file" id=\{fileInputId\} onChange=\{e=>\{handleFiles\(e\.target\.files\);e\.target\.value="";\}\} accept="\.txt,\.md,\.pdf,\.docx,\.png,\.jpg,\.jpeg,\.webp,\.gif"/);
  });
});
