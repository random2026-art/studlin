// Persona audit 2026-09-25 (Wave 3, chunk 12, part): scans say what they skipped.
const { test, describe } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");
const { loadStudlinModule } = require("./harness.js");
const SOURCE = fs.readFileSync(path.join(__dirname, "..", "studlin-app.jsx"), "utf8");

describe("scanReviewNotice (real calls)", () => {
  const m = loadStudlinModule();
  test("nothing to say -> empty string", () => {
    assert.equal(m.scanReviewNotice("short text", [{ date: "2999-01-01" }]), "");
  });
  test("a text longer than 30,000 characters says only the first 30,000 were read", () => {
    const n = m.scanReviewNotice("x".repeat(30001), []);
    assert.match(n, /first 30,000 characters/);
  });
  test("already-past dates are counted and said to start unchecked", () => {
    const n = m.scanReviewNotice("", [{ date: "2000-01-01" }, { date: "2000-02-01" }, { date: "2999-01-01" }]);
    assert.match(n, /2 of the 3 dates found are already past, so they start unchecked\./);
    assert.match(m.scanReviewNotice("", [{ date: "2000-01-01" }]), /1 of the 1 dates found is already past, so it starts unchecked\./);
  });
});

describe("wiring", () => {
  test("the review screen renders the notice", () => {
    assert.match(SOURCE, /\{review\.notice&&<div role="status"/);
    assert.match(SOURCE, /notice:scanReviewNotice\(sourceText,result\.deadlines\)/);
  });
  test("a scanned PDF / empty file gets a specific message before any scan is spent", () => {
    const i = SOURCE.indexOf('if(text.replace(/\s/g,"").length<20){');
    assert.ok(i > -1);
    const j = SOURCE.indexOf("recordSyllabusScan()", i);
    assert.ok(SOURCE.indexOf("This PDF looks like a scan", i) < j);
  });
  test("phone photos are shrunk before upload, and the original is kept when shrinking isn't possible", () => {
    assert.match(SOURCE, /async function shrinkImageForScan\(file,maxDim=1800\)/);
    assert.match(SOURCE, /const shrunk=await shrinkImageForScan\(file\);/);
    assert.match(SOURCE, /catch\(e\)\{return null;\}\r?\n\}/);
  });
});
