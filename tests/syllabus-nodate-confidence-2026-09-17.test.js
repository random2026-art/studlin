// Internal audit finding, 2026-09-17: "guess bad" risk audit found
// mapDeadlinesToReviewItems hardcoded noDate:false regardless of whether
// the AI extraction actually returned a date. The extraction prompt
// (CLASS_SYLLABUS_JSON_CONTRACT) explicitly tells the model "never omit
// date even if uncertain" -- so a genuinely missing d.date from the model
// is a real compliance gap, and the old code silently fell back to
// today's date with no visual signal, letting a guessed date look like a
// known one. A "no date" checkbox/UI already existed (manually togglable)
// but was never auto-triggered by the actual extraction result.
//
// mapDeadlinesToReviewItems is a component-closure function (not exported
// to the test harness, same as onboarding-tour-reorder-and-inline-syllabus's
// own coverage of it) -- source-level regression guard, same convention.
const { test, describe } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");

const SOURCE = fs.readFileSync(path.join(__dirname, "..", "studlin-app.jsx"), "utf8");

describe("mapDeadlinesToReviewItems: noDate reflects whether the AI actually found a date", () => {
  test("noDate is derived from d.date, not hardcoded false", () => {
    const idx = SOURCE.indexOf("const mapDeadlinesToReviewItems=(deadlines,idPrefix)=>{");
    assert.notEqual(idx, -1);
    const body = SOURCE.slice(idx, idx + 1400);
    assert.match(body, /noDate:!d\.date,/, "a missing d.date must flip noDate to true, not silently default to false");
    assert.doesNotMatch(body, /noDate:false,/, "the old hardcoded-false bug must not survive as a stray leftover");
  });

  test("the date field still has a same-day fallback for display purposes, since the UI hides the date input entirely when noDate is true", () => {
    const idx = SOURCE.indexOf("const mapDeadlinesToReviewItems=(deadlines,idPrefix)=>{");
    const body = SOURCE.slice(idx, idx + 1400);
    assert.match(body, /date:d\.date\|\|today,/);
  });

  test("manually-added items (the user's own +Add, not an AI guess) still correctly default noDate:false -- this fix only changes the AI-extraction path", () => {
    const idx = SOURCE.indexOf('const addManualItem=()=>setReview(r=>({...r,items:[...r.items,{id:"cd-manual-"+Date.now()');
    assert.notEqual(idx, -1);
    const body = SOURCE.slice(idx, idx + 300);
    assert.match(body, /noDate:false,/);
  });
});
