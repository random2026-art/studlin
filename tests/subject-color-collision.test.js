// Regression tests for a 2026-08-27 bug reported live from a screenshot of
// Settings > Subjects & Labels: two different subjects ("Applied
// Engineering Computer Methods" and "Calculus II") both displayed the exact
// same color swatch (#D9806B, SUBJECT_COLORS[0]).
//
// Root cause: 5 independent places that assign a new subject/course/period
// a default color each used their own local counter (subjects.length,
// pendingClasses.length, a batch-map index i, etc.) modulo the 10-color
// palette, with zero awareness of colors already in use elsewhere. Two
// counters that both start from (or land back on) the same value -- most
// commonly a brand new ClassSetupWizard session (pendingClasses.length
// always resets to 0) run after Settings' own "+ Add" had already handed
// out index 0 -- silently produced duplicate swatches.
//
// Fix: a single top-level nextAvailableSubjectColor(usedColors) function
// that returns the first palette color NOT already in the given list,
// falling back to round-robin only once every color is genuinely taken.
// All 5 call sites now build their own "colors currently in use" list
// (from getSubjects() and/or their own in-progress staged list) and call
// this instead of indexing SUBJECT_COLORS by a bare count.
//
// nextAvailableSubjectColor itself is a real top-level pure function, so
// it's tested directly. The 5 call sites are inside component closures
// (ClassSetupWizard, SettingsTab, Notes, a routine-matching helper) --
// source-level regression guards for those, same established precedent as
// every other component-closure fix this session. Run with `npm test`.
const { test, describe } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");
const { loadStudlinModule } = require("./harness.js");
const { nextAvailableSubjectColor, SUBJECT_COLORS } = loadStudlinModule();

const SOURCE = fs.readFileSync(path.join(__dirname, "..", "studlin-app.jsx"), "utf8");

describe("nextAvailableSubjectColor: the centralized picker itself", () => {
  test("picks the first palette color, no colors used yet", () => {
    assert.equal(nextAvailableSubjectColor([]), SUBJECT_COLORS[0]);
  });

  test("skips a color already in use and returns the next free one", () => {
    assert.equal(nextAvailableSubjectColor([SUBJECT_COLORS[0]]), SUBJECT_COLORS[1]);
  });

  test("this is the exact reported bug scenario: two counters both landing on index 0 must no longer collide", () => {
    const first = nextAvailableSubjectColor([]);
    const second = nextAvailableSubjectColor([first]);
    assert.notEqual(first, second, "a second subject created right after the first must not get the same color");
  });

  test("skips multiple used colors, not just the first", () => {
    const used = [SUBJECT_COLORS[0], SUBJECT_COLORS[1], SUBJECT_COLORS[2]];
    assert.equal(nextAvailableSubjectColor(used), SUBJECT_COLORS[3]);
  });

  test("falls back to round-robin only once the entire palette is genuinely exhausted, rather than throwing or returning undefined", () => {
    const allUsed = [...SUBJECT_COLORS];
    const result = nextAvailableSubjectColor(allUsed);
    assert.ok(SUBJECT_COLORS.includes(result));
  });

  test("order of usedColors doesn't matter -- it's a set membership check, not position-based", () => {
    assert.equal(nextAvailableSubjectColor([SUBJECT_COLORS[2], SUBJECT_COLORS[0]]), SUBJECT_COLORS[1]);
  });
});

describe("All 5 call sites now route through nextAvailableSubjectColor instead of a bare local-count index", () => {
  test("no call site still does SUBJECT_COLORS[<count>.length%SUBJECT_COLORS.length] for a *new subject/course/period* (the flawed pattern that caused the bug)", () => {
    assert.doesNotMatch(SOURCE, /color:SUBJECT_COLORS\[subjects\.length%SUBJECT_COLORS\.length\]/);
    assert.doesNotMatch(SOURCE, /color:SUBJECT_COLORS\[subs\.length%SUBJECT_COLORS\.length\]/);
    assert.doesNotMatch(SOURCE, /const nextColor=\(\)=>SUBJECT_COLORS\[pendingClasses\.length%SUBJECT_COLORS\.length\];/);
    assert.doesNotMatch(SOURCE, /color:SUBJECT_COLORS\[i%SUBJECT_COLORS\.length\],startTime:p\.startTime/);
    assert.doesNotMatch(SOURCE, /color:SUBJECT_COLORS\[s\.length%SUBJECT_COLORS\.length\]/);
  });

  test("ensureSubjectsForClassRoutines (class-routine matching) uses the running subjects array's own colors", () => {
    assert.match(SOURCE, /color:nextAvailableSubjectColor\(subjects\.map\(s=>s\.color\)\)/);
  });

  test("Notes' syllabus-scan-to-subject flow checks real saved subjects' colors", () => {
    assert.match(SOURCE, /color:nextAvailableSubjectColor\(subs\.map\(s=>s\.color\)\),termEnd:null/);
  });

  test("ClassSetupWizard's nextColor checks BOTH real saved subjects and this session's own already-staged pendingClasses -- this was the exact root cause of the reported bug (a fresh wizard session's own counter always restarts at 0)", () => {
    assert.match(SOURCE, /const nextColor=\(\)=>nextAvailableSubjectColor\(\[\.\.\.getSubjects\(\)\.map\(s=>s\.color\),\.\.\.pendingClasses\.map\(c=>c\.color\)\]\);/);
  });

  test("the HS whole-schedule batch import builds a running used-colors list across its own map instead of relying on unique index i alone, so it also avoids colliding with already-saved subjects", () => {
    assert.match(SOURCE, /const hsUsedColors=getSubjects\(\)\.map\(s=>s\.color\);/);
    assert.match(SOURCE, /const color=nextAvailableSubjectColor\(hsUsedColors\);/);
    assert.match(SOURCE, /hsUsedColors\.push\(color\);/);
  });

  test("Settings' Manage Subjects & Labels \"+ Add\" button (the exact screen from the report) checks the running mgmtSubjs list's colors", () => {
    assert.match(SOURCE, /color:nextAvailableSubjectColor\(s\.map\(x=>x\.color\)\),termEnd:term\?term\.end:null/);
  });

  test("unrelated color-picker defaults (Activities templates, a new-event form's initial SUBJECT_COLORS[0]) were deliberately left alone -- they aren't subjects and aren't part of this bug", () => {
    assert.match(SOURCE, /title:"Morning Routine",color:SUBJECT_COLORS\[0\]/);
    assert.match(SOURCE, /useState\(SUBJECT_COLORS\[0\]\)/);
  });
});
