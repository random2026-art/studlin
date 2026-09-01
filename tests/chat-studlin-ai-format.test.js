// api/chat.js's format:"studlin_ai" pricing/prompt-selection logic --
// resolveRequestCost/resolveSystemPrompt/resolveMaxTokens are pure
// functions attached to the exported handler (see that file's own
// comment), exercised directly here rather than through the handler
// itself, which would need auth/Firestore/fetch mocking this repo has no
// existing pattern for.
const { test, describe } = require("node:test");
const assert = require("node:assert/strict");
const { resolveRequestCost, resolveSystemPrompt, resolveMaxTokens } = require("../api/chat.js");

describe("resolveRequestCost", () => {
  test("plain text chat costs 1 regardless of format when no image and not studlin_ai", () => {
    assert.equal(resolveRequestCost(false, "standard", undefined), 1);
    assert.equal(resolveRequestCost(false, "flash", "json"), 1);
  });

  test("an image-bearing request always costs IMAGE_CREDIT_COST (4), even under format:studlin_ai", () => {
    assert.equal(resolveRequestCost(true, "standard", undefined), 4);
    assert.equal(resolveRequestCost(true, "standard", "studlin_ai"), 4);
  });

  test("format:studlin_ai without an image costs 2, distinct from plain chat and images", () => {
    assert.equal(resolveRequestCost(false, "standard", "studlin_ai"), 2);
    assert.equal(resolveRequestCost(false, "flash", "studlin_ai"), 2);
  });

  test("image always wins over studlin_ai pricing when both could apply", () => {
    // hasImage is checked first -- an image-bearing studlin_ai request
    // (not expected to actually happen today, but the precedence should
    // still be deliberate, not accidental) costs the image rate, not 2.
    assert.equal(resolveRequestCost(true, "flash", "studlin_ai"), 4);
  });
});

describe("resolveSystemPrompt", () => {
  test("format:studlin_ai gets the calendar-assistant prompt regardless of model", () => {
    const standard = resolveSystemPrompt("studlin_ai", "standard");
    const flash = resolveSystemPrompt("studlin_ai", "flash");
    assert.match(standard, /calendar assistant/);
    assert.match(flash, /calendar assistant/);
    assert.equal(standard, flash);
  });

  test("the studlin_ai prompt explicitly forbids inventing data and claiming write actions", () => {
    const prompt = resolveSystemPrompt("studlin_ai", "standard");
    assert.match(prompt, /[Nn]ever invent/);
    assert.match(prompt, /read-only/i);
  });

  test("format:json still gets the extraction prompt, unaffected by the new branch", () => {
    const prompt = resolveSystemPrompt("json", "standard");
    assert.match(prompt, /extract structured data/);
  });

  test("plain chat still splits on flash vs standard, unaffected by the new branch", () => {
    const flash = resolveSystemPrompt(undefined, "flash");
    const standard = resolveSystemPrompt(undefined, "standard");
    assert.match(flash, /Studlin Flash/);
    assert.doesNotMatch(standard, /Studlin Flash/);
  });
});

describe("resolveMaxTokens", () => {
  test("format:studlin_ai gets its own fixed budget (768), regardless of model", () => {
    assert.equal(resolveMaxTokens("studlin_ai", "standard"), 768);
    assert.equal(resolveMaxTokens("studlin_ai", "flash"), 768);
  });

  test("format:json + standard still gets the larger JSON budget, unaffected by the new branch", () => {
    assert.equal(resolveMaxTokens("json", "standard"), 4096);
  });

  test("format:json + flash still gets flash's own smaller budget, not the JSON one", () => {
    assert.equal(resolveMaxTokens("json", "flash"), 512);
  });

  test("plain chat still gets each model's own default budget", () => {
    assert.equal(resolveMaxTokens(undefined, "standard"), 2048);
    assert.equal(resolveMaxTokens(undefined, "flash"), 512);
  });
});
