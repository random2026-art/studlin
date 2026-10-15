// Review fixes on the merged Stu chat work (2026-10-14).
const { test, describe } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");
const { loadStudlinModule } = require("./harness.js");
const SOURCE = fs.readFileSync(path.join(__dirname, "..", "studlin-app.jsx"), "utf8").replace(/\r\n/g, "\n");

describe("crisis detection runs before brain dump mode", () => {
  test("send() checks detectCrisis before the bdMode branch, and a hit leaves bdMode", () => {
    const i = SOURCE.indexOf("const send=async()=>{");
    const body = SOURCE.slice(i, i + 3000);
    const crisis = body.indexOf("if(detectCrisis(text)){");
    const bd = body.indexOf("if(bdMode){sendBrainDump(text);return;}");
    assert.ok(crisis > 0 && bd > crisis, "crisis check must come first");
    assert.match(body.slice(crisis, bd), /setBdMode\(false\)/);
  });
});

describe("detectCrisis false positives from review", () => {
  const m = loadStudlinModule();
  test("ordinary scheduling and idioms do not show the card", () => {
    for (const t of [
      "I can't go on Tuesday, move my study session",
      "I cut myself off from social media this week",
      "end everything by Friday",
      "this exam is killing me",
    ]) assert.equal(m.detectCrisis(t), false, t);
  });
  test("clear statements still do", () => {
    for (const t of [
      "I can't go on anymore",
      "i can't go on like this.",
      "I want to kill myself",
      "I want to end it all",
    ]) assert.equal(m.detectCrisis(t), true, t);
  });
});

describe("smaller review fixes", () => {
  test("opening Brain Dump uses showMemoryToast so no stale Undo remains", () => {
    assert.match(SOURCE, /showMemoryToast\("Opening Brain Dump",\[\]\);/);
    assert.ok(!SOURCE.includes('setMemoryToast("Opening Brain Dump")'));
  });
  test("bdMode resets when the drawer closes", () => {
    assert.match(SOURCE, /useEffect\(\(\)=>\{if\(!open\)setBdMode\(false\);\},\[open\]\);/);
  });
  test("a stale pendingCalendarTool flag is cleared if nothing consumed it", () => {
    const i = SOURCE.indexOf("function openStuCalendarTool(");
    assert.match(SOURCE.slice(i, i + 900), /setTimeout\(\(\)=>\{try\{if\(lsGet\("pendingCalendarTool",null\)\)lsSet\("pendingCalendarTool",null\);\}catch\(e\)\{\}\},2500\);/);
  });
  test("Brain Dump errors say Stu", () => {
    assert.ok(!SOURCE.includes('"Couldn\'t reach Studlin AI.";'));
    assert.match(SOURCE, /Something went wrong reaching Stu\./);
  });
});
