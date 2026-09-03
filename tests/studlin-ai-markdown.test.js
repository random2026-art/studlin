// Studlin AI's chat bubble used to render raw text with no formatting at
// all (whiteSpace:"pre-wrap", m.text dropped straight into a div), while
// its own system prompts explicitly invite markdown ("format with markdown
// -- headers, bullets", coaching mode's "or a short list when a breakdown
// helps"). Every **bold**, ## header, and - bullet the model wrote showed
// up as literal asterisks/pound signs/dashes. parseStudlinAiMarkdown is the
// pure parsing half of the fix (2026-09-03) -- split out from the JSX
// rendering specifically so it's testable without a real React DOM (the
// harness's React stub makes createElement return null).
//
// assert.deepEqual on an array/object crossed back from the vm sandbox
// always false-fails here (see tests/harness.js's own notes) -- every
// array/object comparison below goes through JSON.stringify instead.
const { test, describe } = require("node:test");
const assert = require("node:assert/strict");
const { loadStudlinModule } = require("./harness.js");

describe("parseStudlinAiMarkdown", () => {
  test("empty/missing text returns an empty array, not a crash", () => {
    const m = loadStudlinModule();
    assert.equal(JSON.stringify(m.parseStudlinAiMarkdown("")), "[]");
    assert.equal(JSON.stringify(m.parseStudlinAiMarkdown(null)), "[]");
    assert.equal(JSON.stringify(m.parseStudlinAiMarkdown(undefined)), "[]");
  });

  test("a plain sentence with no markdown syntax becomes a single paragraph block", () => {
    const m = loadStudlinModule();
    const blocks = m.parseStudlinAiMarkdown("You have 3 hours free this week.");
    assert.equal(blocks.length, 1);
    assert.equal(blocks[0].type, "p");
    assert.equal(blocks[0].text, "You have 3 hours free this week.");
  });

  test("a # / ## / ### header line becomes a header block with the # stripped", () => {
    const m = loadStudlinModule();
    assert.equal(m.parseStudlinAiMarkdown("# Priorities")[0].type, "header");
    assert.equal(m.parseStudlinAiMarkdown("# Priorities")[0].text, "Priorities");
    assert.equal(m.parseStudlinAiMarkdown("## Priorities")[0].text, "Priorities");
    assert.equal(m.parseStudlinAiMarkdown("### Priorities")[0].text, "Priorities");
  });

  test("consecutive '- ' or '* ' lines collapse into one ul block with multiple items, not one block per line", () => {
    const m = loadStudlinModule();
    const blocks = m.parseStudlinAiMarkdown("- Review chapter 4\n- Do practice problems\n* Take a break");
    assert.equal(blocks.length, 1);
    assert.equal(blocks[0].type, "ul");
    assert.equal(JSON.stringify(blocks[0].items), JSON.stringify(["Review chapter 4", "Do practice problems", "Take a break"]));
  });

  test("consecutive numbered lines collapse into one ol block", () => {
    const m = loadStudlinModule();
    const blocks = m.parseStudlinAiMarkdown("1. Skim for structure\n2. Do problems\n3. Review mistakes");
    assert.equal(blocks.length, 1);
    assert.equal(blocks[0].type, "ol");
    assert.equal(JSON.stringify(blocks[0].items), JSON.stringify(["Skim for structure", "Do problems", "Review mistakes"]));
  });

  test("a blank line breaks a list into two separate blocks instead of merging across the gap", () => {
    const m = loadStudlinModule();
    const blocks = m.parseStudlinAiMarkdown("- First group A\n- First group B\n\n- Second group A");
    assert.equal(blocks.length, 2);
    assert.equal(blocks[0].type, "ul");
    assert.equal(JSON.stringify(blocks[0].items), JSON.stringify(["First group A", "First group B"]));
    assert.equal(blocks[1].type, "ul");
    assert.equal(JSON.stringify(blocks[1].items), JSON.stringify(["Second group A"]));
  });

  test("switching from a ul to an ol (or back) without a blank line still starts a new block, not a mixed one", () => {
    const m = loadStudlinModule();
    const blocks = m.parseStudlinAiMarkdown("- bullet one\n1. numbered one");
    assert.equal(blocks.length, 2);
    assert.equal(blocks[0].type, "ul");
    assert.equal(blocks[1].type, "ol");
  });

  test("a realistic mixed coaching-style reply parses into the expected block sequence", () => {
    const m = loadStudlinModule();
    const text = "Here's how I'd break this down:\n\n## Priority 1: Chapter 4-6\n- Review your missed practice questions first\n- Do 15 min of active recall\n\n## Priority 2: Chapter 7-8\n1. Skim once for structure\n2. Then do problems";
    const blocks = m.parseStudlinAiMarkdown(text);
    const types = blocks.map(b => b.type);
    assert.equal(JSON.stringify(types), JSON.stringify(["p", "header", "ul", "header", "ol"]));
    assert.equal(blocks[0].text, "Here's how I'd break this down:");
    assert.equal(blocks[1].text, "Priority 1: Chapter 4-6");
    assert.equal(JSON.stringify(blocks[2].items), JSON.stringify(["Review your missed practice questions first", "Do 15 min of active recall"]));
    assert.equal(blocks[3].text, "Priority 2: Chapter 7-8");
    assert.equal(JSON.stringify(blocks[4].items), JSON.stringify(["Skim once for structure", "Then do problems"]));
  });

  test("inline **bold** stays as a literal, unparsed substring in the block's text/items (parsed only at render time)", () => {
    const m = loadStudlinModule();
    const blocks = m.parseStudlinAiMarkdown("This is **really** important.");
    assert.equal(blocks[0].text, "This is **really** important.");
  });

  test("a short-answer Q&A-mode reply (no markdown at all) still parses cleanly as a single paragraph", () => {
    const m = loadStudlinModule();
    const blocks = m.parseStudlinAiMarkdown("You have 2 exams this week: Chem on Tuesday and Bio on Friday.");
    assert.equal(blocks.length, 1);
    assert.equal(blocks[0].type, "p");
  });
});
