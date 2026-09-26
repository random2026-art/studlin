// Feature request 2026-09-26: when Google Calendar / Moodle / Canvas / a linked
// feed adds things in the background, Calendar should say what was imported and
// let the student acknowledge it, not surprise them.
const { test, describe } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");
const { loadStudlinModule } = require("./harness.js");
const S = fs.readFileSync(path.join(__dirname, "..", "studlin-app.jsx"), "utf8");

describe("import log (real calls)", () => {
  const m = loadStudlinModule();
  test("appending records the source, count and titles; nothing new appends nothing", () => {
    const a = m.appendImportLog([], "Moodle", [{ title: "HW 1", date: "2026-10-01" }, { title: "Quiz", date: "2026-10-02" }], 1000);
    assert.equal(a.length, 1);
    assert.equal(a[0].source, "Moodle");
    assert.equal(a[0].count, 2);
    assert.equal(a[0].items[0].title, "HW 1");
    assert.equal(m.appendImportLog(a, "Moodle", [], 2000).length, 1);
    assert.equal(m.appendImportLog(a, "Moodle", [{ title: "" }], 2000).length, 1);
  });
  test("the log is capped at 20 entries, keeping the newest", () => {
    let log = [];
    for (let i = 0; i < 25; i++) log = m.appendImportLog(log, "S" + i, [{ title: "t" }], i);
    assert.equal(log.length, 20);
    assert.equal(log[19].source, "S24");
  });
  test("the summary groups by source and totals the counts", () => {
    let log = m.appendImportLog([], "Google Calendar", [{ title: "a" }, { title: "b" }], 1);
    log = m.appendImportLog(log, "Moodle", [{ title: "c" }], 2);
    log = m.appendImportLog(log, "Google Calendar", [{ title: "d" }], 3);
    const s = m.summarizeImportLog(log);
    assert.equal(s.total, 4);
    assert.equal(s.groups.length, 2);
    assert.equal(s.groups[0].source, "Google Calendar");
    assert.equal(s.groups[0].count, 3);
    assert.equal(m.summarizeImportLog([]).total, 0);
  });
});

describe("wiring", () => {
  test("Google and linked-feed refreshes both record what they added", () => {
    assert.match(S, /recordImport\("Google Calendar",newlyAdded\);/);
    assert.match(S, /recordImport\(sub\.label,newItems\);/);
  });
  test("Calendar shows a banner with See what / Got it, and Got it clears the log", () => {
    assert.match(S, /new item\{summary\.total!==1\?"s":""\} imported<\/strong>/);
    assert.match(S, />Got it<\/button>/);
    assert.match(S, /const acknowledgeImports=\(\)=>\{lsSet\("importLog",\[\]\);setImportLog\(\[\]\);/);
    assert.match(S, /window\.addEventListener\("studlin-import-log",refresh\)/);
  });
});
