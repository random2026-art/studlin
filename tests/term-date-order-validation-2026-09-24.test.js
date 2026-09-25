// Audit finding, 2026-09-24: the onboarding wizard's "End of Term" step
// (Term starts/Term ends) and Settings' identical Calendar Preferences pair
// (School starts/School ends) both had zero date-order validation -- an end
// before start silently saved with no error and nothing blocking Continue.
// The sibling "Awake time" step right next to it in the same wizard already
// had this exact validate-and-block pattern (windowInvalid); it just was
// never applied to the term dates. Fixed by mirroring that pattern.
//
// Source-level regression guards (component-closure UI, same mixed-coverage
// convention this file's neighbors use). Run with `npm test`.
const { test, describe } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");

const SOURCE = fs.readFileSync(path.join(__dirname, "..", "studlin-app.jsx"), "utf8");

describe("ClassSetupWizard: term step blocks an inverted date range, same pattern as Awake time", () => {
  test("termWindowInvalid is computed as a string compare, right next to windowInvalid", () => {
    const idx = SOURCE.indexOf("const windowInvalid=timeToMinutes(workEnd)<=timeToMinutes(workStart);");
    assert.notEqual(idx, -1);
    const body = SOURCE.slice(idx, idx + 800);
    assert.match(body, /const termWindowInvalid=!!\(termStart&&termEnd&&termEnd<termStart\);/);
  });

  test("the term step's DateField pair passes min={termStart} and shows an inline error", () => {
    const idx = SOURCE.indexOf('title="When does this term run?"');
    assert.notEqual(idx, -1);
    const body = SOURCE.slice(idx, idx + 700);
    assert.match(body, /DateField label="Term ends" value=\{termEnd\} onChange=\{setTermEnd\} min=\{termStart\}/);
    assert.match(body, /termWindowInvalid&&<div[^>]*>Term ends must be after term starts\.<\/div>/);
  });

  test("the term step's footer Continue button is disabled when termWindowInvalid", () => {
    // The footer buttons live in a separate block from the step's own
    // render (the wizard renders content and footer controls in two
    // distinct regions), so this looks for the footer's own term-step
    // block specifically, not the render block above.
    const idx = SOURCE.indexOf("status is guaranteed already resolved");
    assert.notEqual(idx, -1, "the term step's footer block (with its 2026-09-11 status-ordering comment) must exist");
    const body = SOURCE.slice(idx, idx + 600);
    assert.match(body, /Continue<\/Btn>/);
    assert.match(body, /disabled=\{termWindowInvalid\}/, "Continue must be gated on termWindowInvalid, not unconditional");
  });

  test("both real commit paths guard their saveSchoolTerm call, not just the step's own Continue button", () => {
    const occurrences = [...SOURCE.matchAll(/if\(termStart&&termEnd&&termEnd>=termStart\)saveSchoolTerm\(\{start:termStart,end:termEnd\}\);/g)];
    assert.equal(occurrences.length, 2, "commitHsSchedule and commitAllToCalendar must both guard the write -- Skip, or a returning user who never revisits the term step, can reach either without the step's own disabled Continue button catching it");
  });
});

describe("Settings' Calendar Preferences: the same School starts/ends pair also guards its immediate-save", () => {
  test("saveTerm skips the write (but the field still updates) when the range is inverted", () => {
    const idx = SOURCE.indexOf("const saveTerm=(start,end)=>{if(start&&end&&end<start)return;saveSchoolTerm(start&&end?{start,end}:null);};");
    assert.notEqual(idx, -1, "saveTerm must bail out before calling saveSchoolTerm when end<start");
  });

  test("the School starts/ends fields pass min and show an inline error, same as the wizard", () => {
    const idx = SOURCE.indexOf('<DateField label="School starts"');
    assert.notEqual(idx, -1);
    const body = SOURCE.slice(idx, idx + 400);
    assert.match(body, /DateField label="School ends" value=\{termEnd\} onChange=\{setTermEnd\} min=\{termStart\}/);
    assert.match(body, /termWindowInvalid&&<div[^>]*>School ends must be after school starts/);
  });
});
