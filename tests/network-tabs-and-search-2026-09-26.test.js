// Feature request 2026-09-26: Studlin Network gets All / Friends / Groups /
// Classmates tabs, a search box that filters your own friends, groups and
// classmates, and a classmates list that stays usable with hundreds of people.
const { test, describe } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");
const { loadStudlinModule } = require("./harness.js");
const S = fs.readFileSync(path.join(__dirname, "..", "studlin-app.jsx"), "utf8");
const m = loadStudlinModule();

describe("filterByQuery (real calls)", () => {
  const people = [{ n: "Ava Chen", h: "avac" }, { n: "Ben Ortiz", h: "bortiz" }, { n: "Chloe Ava", h: "cloe" }];
  const text = (u) => u.n + " " + u.h;
  test("empty or blank query returns everything", () => {
    assert.equal(m.filterByQuery(people, "", text).length, 3);
    assert.equal(m.filterByQuery(people, "   ", text).length, 3);
  });
  test("matches name or handle, ignoring case", () => {
    assert.equal(m.filterByQuery(people, "AVA", text).length, 2);
    assert.equal(m.filterByQuery(people, "bortiz", text).length, 1);
    assert.equal(m.filterByQuery(people, "zzz", text).length, 0);
  });
});

describe("Network tabs", () => {
  test("four tabs, and opening Classmates is what starts loading them", () => {
    assert.match(S, /\["All","Friends","Groups","Classmates"\]\.map\(t=>\(/);
    assert.match(S, /if\(t==="Classmates"\)setClassmatesRequested\(true\);/);
    assert.match(S, /if\(!classmatesRequested\)return;/);
  });
  test("Friends shows every friend, Groups only groups, All both; a search filters name, handle and group name", () => {
    assert.match(S, /const inboxBase=inboxTab==="Groups"\?inboxGroups:inboxTab==="Friends"\?inboxDms:\[\.\.\.inboxDms,\.\.\.inboxGroups\];/);
    assert.match(S, /filterByQuery\(inboxBase,inboxQuery,row=>row\.kind==="group"\?\(row\.group\.name\|\|""\):\(\(row\.user\.n\|\|""\)\+" "\+\(row\.user\.h\|\|""\)\)\)/);
  });
  test("classmates: 10 at a time with Show more, a search, the fetch cap is stated, and people who hid their profile are left out", () => {
    assert.match(S, /useState\(10\);/);
    assert.match(S, /Show more \(\{classmatesFiltered\.length-classmatesVisible\} more\)/);
    assert.match(S, /Showing the first \{CLASSMATES_FETCH_LIMIT\} at your school/);
    assert.match(S, /if\(d\.data\(\)\.discoverable===false\)return;/);
    assert.match(S, /const CLASSMATES_FETCH_LIMIT=100;/);
  });
  test("the old standalone Classmates card is gone (it is a tab now)", () => {
    assert.ok(!S.includes("{/* ── CLASSMATES AT MY SCHOOL — real, auto-populated ── */}"));
  });
  test("empty states never render blank, and the search has an accessible name and a clear button", () => {
    assert.match(S, /No classmates match "\{inboxQuery\}"\./);
    assert.match(S, /Nothing matches \\"/);
    assert.match(S, /aria-label="Clear search"/);
    assert.match(S, /aria-label=\{inboxTab==="Classmates"\?"Search classmates":"Search your friends and groups"\}/);
  });
});
