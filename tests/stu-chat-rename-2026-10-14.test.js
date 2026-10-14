// The "Studlin AI" chat is now "Stu", the existing mascot. Source guards.
const { describe, test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const SOURCE = fs
  .readFileSync(path.join(__dirname, "..", "studlin-app.jsx"), "utf8")
  .replace(/\r\n/g, "\n");

const slice = (marker, len) => {
  const i = SOURCE.indexOf(marker);
  assert.notEqual(i, -1, marker + " not found");
  return SOURCE.slice(i, i + len);
};

describe("Stu chat button", () => {
  const body = slice("function StudlinAiBubble(", 2200);
  test("keeps its id and renders the resting mascot", () => {
    assert.ok(body.includes('id="studlin-ai-bubble"'));
    assert.match(body, /<StudMascot size=\{56\} mood="happy"/);
    assert.ok(body.includes("stuPalette()"));
    assert.ok(!body.includes("walking"));
  });
  test("button semantics", () => {
    assert.ok(body.includes('aria-label="Chat with Stu"'));
    assert.ok(body.includes('title="Ask Stu about your schedule"'));
    assert.ok(body.includes('background:"transparent"'));
    assert.ok(body.includes("minWidth:44,minHeight:44"));
    assert.ok(body.includes("env(safe-area-inset-bottom"));
    assert.ok(body.includes(":focus-visible"));
    assert.ok(body.includes("STUDLIN_AI_BUBBLE_Z"));
  });
  test("keeps the proactive dot and is not gated on mascot settings", () => {
    assert.ok(body.includes("hasProactive&&"));
    assert.ok(!/stuSettingOn|nudgesAllowed|smartFeaturesOn/.test(body));
  });
  test("is mounted unconditionally", () => {
    assert.match(SOURCE, /\n\s*<StudlinAiBubble onClick=\{\(\)=>setStudlinAiOpen\(true\)\} hasProactive=\{!!studlinAiProactive\} \/>/);
  });
});

describe("Stu rename copy", () => {
  test("drawer header shows Stu with a 32px mascot", () => {
    const body = slice("<StudMascot size={32} mood=\"happy\"", 500);
    assert.ok(body.includes(">Stu</div>"));
    assert.ok(body.includes("Ask me anything, or tell me to add or move something"));
  });
  test("student-facing strings say Stu", () => {
    for (const s of [
      "Stu needs Pro. I've opened the upgrade options.",
      "Stu can't reach the server. Try again.",
      "Remembered: ",
      "Stu noticed new course events",
      "Ask Stu anything",
      "Stu answers from your real schedule, not a guess.",
      "What Stu remembers",
      "Forget everything Stu remembers about you?",
      "Stu chat is a Pro feature.",
      '["Stu question","2"],["Stu action (move, add, delete...)","1"],["Stu coaching check-in","2"]',
      "Stu's chat button is always on.",
    ]) assert.ok(SOURCE.includes(s), s);
  });
  test("old chat names are gone from the drawer and settings", () => {
    for (const s of [
      "Studlin AI needs Pro",
      "Couldn't reach Studlin AI. Check",
      "Studlin AI remembered",
      "What Studlin AI remembers",
      "Ask Studlin AI anything",
    ]) assert.ok(!SOURCE.includes(s), s);
  });
  test("identifiers and the app_help keywords are untouched", () => {
    assert.ok(SOURCE.includes("function StudlinAiDrawer("));
    assert.ok(SOURCE.includes('"what does studlin ai remember"'));
  });
  test("no em dashes in the new copy", () => {
    assert.ok(!slice("function StudlinAiBubble(", 1200).includes("—"));
  });
});
