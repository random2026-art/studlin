// Persona audit, 2026-09-25 (Wave 1, chunk 4: paywall honesty). A free
// student who had spent their one scan kept getting nudged to scan, and got
// a generic "Pro feature" line instead of the truth. Brain Dump only said it
// was Pro after typing a whole dump.
const { test, describe } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");
const { loadStudlinModule } = require("./harness.js");

const SOURCE = fs.readFileSync(path.join(__dirname, "..", "studlin-app.jsx"), "utf8");

describe("free scan used up (real calls)", () => {
  test("nudge shows while the free scan is unused, stops once it is spent", () => {
    const m = loadStudlinModule();
    m.lsSet("syllabusNudgeDismissedAt", 0);
    m.lsSet("freeSyllabusScanUsed", false);
    assert.equal(m.shouldShowSyllabusNudge(), true);
    m.lsSet("freeSyllabusScanUsed", true);
    assert.equal(m.shouldShowSyllabusNudge(), false);
  });

  test("paywall key: first-time free -> generic, free scan spent -> 'used your free scan'", () => {
    const m = loadStudlinModule();
    m.lsSet("freeSyllabusScanUsed", false);
    assert.equal(m.syllabusPaywallKey(), "syllabusScan");
    m.lsSet("freeSyllabusScanUsed", true);
    assert.equal(m.syllabusPaywallKey(), "syllabusScanUsed");
  });
});

describe("copy and wiring", () => {
  test("the used-scan copy exists, has no em dash, and every scan gate uses the shared key", () => {
    assert.match(SOURCE, /syllabusScanUsed:"You've used your free scan\. Pro scans every class\."/);
    assert.ok(!SOURCE.includes('"syllabusScan":"aiUsageCap"'));
    assert.equal(SOURCE.split('?"syllabusScan":"aiUsageCap"').length - 1, 0);
  });
  test("Brain Dump tells you it is Pro on open, and the work-schedule card carries a PRO label", () => {
    assert.match(SOURCE, /\{!canUseBrainDump\(\)&&<div[^\n]*See plans/);
    assert.match(SOURCE, /Scan your work schedule\{!canScanSyllabus\(\)&&<span[^>]*>PRO<\/span>\}/);
  });
  test("unsorted calendar imports say why", () => {
    assert.match(SOURCE, /Studlin didn't sort these into assignments and exams/);
  });
});
