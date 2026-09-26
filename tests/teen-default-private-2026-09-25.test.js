// Persona audit 2026-09-25 (Wave 2, chunk 7). "Public profile" in Settings was
// read nowhere (a do-nothing switch) while every account was searchable.
// It is now a real flag: search skips accounts marked not discoverable, and
// high school accounts default to private until they choose otherwise.
const { test, describe } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");
const { loadStudlinModule } = require("./harness.js");
const SOURCE = fs.readFileSync(path.join(__dirname, "..", "studlin-app.jsx"), "utf8");

describe("isDiscoverableFor (real calls)", () => {
  const m = loadStudlinModule();
  test("high school defaults private, college and unset default findable", () => {
    assert.equal(m.isDiscoverableFor("highschool", null), false);
    assert.equal(m.isDiscoverableFor("college", null), true);
    assert.equal(m.isDiscoverableFor(undefined, null), true);
  });
  test("an explicit choice always wins, either way", () => {
    assert.equal(m.isDiscoverableFor("highschool", true), true);
    assert.equal(m.isDiscoverableFor("college", false), false);
  });
});

describe("wiring", () => {
  test("the flag is published on the profile and search honors it", () => {
    assert.match(SOURCE, /discoverable:isDiscoverableFor\(status,lsGet\("profileDiscoverable",null\)\)/);
    assert.match(SOURCE, /snap\.docs\.filter\(d=>d\.data\(\)\.discoverable!==false\)/);
  });
  test("Settings switch is real and the dead Share Weekly Wrapped switch is gone", () => {
    assert.match(SOURCE, /aria-label="Public profile" onClick=\{toggleDiscoverable\}/);
    assert.ok(!SOURCE.includes('k="share"') && !SOURCE.includes('k="profile"'));
  });
});
