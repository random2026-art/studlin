// Regression tests for isNearDuplicateSchoolName -- the matcher that lets
// two students who typed their school differently ("PSU Harrisburg" /
// "Penn State Harrisburg") still get connected as classmates. Extends the
// same near-duplicate idea isNearDuplicateCourseLabel already established
// for course names, plus two shapes specific to institution names: a
// droppable generic suffix and acronyms. Run with `npm test`.
const { test, describe } = require("node:test");
const assert = require("node:assert/strict");
const { loadStudlinModule } = require("./harness.js");

describe("isNearDuplicateSchoolName", () => {
  test("an identical name matches", () => {
    const m = loadStudlinModule();
    assert.equal(m.isNearDuplicateSchoolName("Penn State University", "Penn State University"), true);
  });

  test("case and whitespace differences alone still match", () => {
    const m = loadStudlinModule();
    assert.equal(m.isNearDuplicateSchoolName("penn state university", "PENN STATE UNIVERSITY"), true);
  });

  test("a droppable generic suffix matches ('Penn State' vs 'Penn State University')", () => {
    const m = loadStudlinModule();
    assert.equal(m.isNearDuplicateSchoolName("Penn State", "Penn State University"), true);
  });

  test("an acronym matches its full name ('PSU' vs 'Penn State University')", () => {
    const m = loadStudlinModule();
    assert.equal(m.isNearDuplicateSchoolName("PSU", "Penn State University"), true);
  });

  test("an acronym matches with a stopword excluded from initials ('UCLA' vs 'University of California Los Angeles')", () => {
    const m = loadStudlinModule();
    assert.equal(m.isNearDuplicateSchoolName("UCLA", "University of California Los Angeles"), true);
  });

  test("a typo'd/abbreviated word, same word count, matches ('Wash High School' vs 'Washington High School')", () => {
    const m = loadStudlinModule();
    assert.equal(m.isNearDuplicateSchoolName("Wash High School", "Washington High School"), true);
  });

  test("a too-short shared prefix does not count as an abbreviation match ('Penn St' vs 'Penn State')", () => {
    const m = loadStudlinModule();
    assert.equal(m.isNearDuplicateSchoolName("Penn St", "Penn State"), false);
  });

  test("genuinely different schools do not match", () => {
    const m = loadStudlinModule();
    assert.equal(m.isNearDuplicateSchoolName("Penn State University", "Ohio State University"), false);
  });

  test("two different campuses of a system are not treated as the same school", () => {
    const m = loadStudlinModule();
    assert.equal(m.isNearDuplicateSchoolName("Penn State Harrisburg", "Penn State University Park"), false);
  });

  test("a long compact name is never coincidentally treated as someone else's acronym", () => {
    const m = loadStudlinModule();
    assert.equal(m.isNearDuplicateSchoolName("Georgia Institute of Technology", "Penn State University"), false);
  });

  test("empty/missing names never match", () => {
    const m = loadStudlinModule();
    assert.equal(m.isNearDuplicateSchoolName("", "Penn State University"), false);
    assert.equal(m.isNearDuplicateSchoolName(null, null), false);
  });
});
