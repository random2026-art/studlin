// getAiMemory/saveAiMemory/mergeAiMemoryFacts/removeAiMemoryFact/
// formatAiMemoryForPrompt -- persistent cross-session AI memory (Item 3
// of the memory/proactive/reasoning upgrade). Only the pure, local-state
// functions are unit-tested here; pushAiMemory/hydrateAiMemoryOnAuth are
// async and Firestore-touching, matching this session's established
// precedent (upsertProfile, sendMessage, etc. aren't unit-tested either).
// Run with `npm test`.
const { test, describe } = require("node:test");
const assert = require("node:assert/strict");
const { loadStudlinModule } = require("./harness.js");

describe("getAiMemory / saveAiMemory round-trip", () => {
  test("with nothing saved yet, returns an empty-but-well-formed shape", () => {
    const m = loadStudlinModule();
    const mem = m.getAiMemory();
    assert.equal(mem.facts.length, 0);
    assert.equal(mem.updatedAt, null);
  });

  test("saveAiMemory then getAiMemory round-trips exactly", () => {
    const m = loadStudlinModule();
    const mem = { facts: [{ text: "Hates morning workouts", addedAt: 1000 }], updatedAt: "2026-09-01T00:00:00.000Z" };
    m.saveAiMemory(mem);
    const back = m.getAiMemory();
    assert.equal(back.facts.length, 1);
    assert.equal(back.facts[0].text, "Hates morning workouts");
    assert.equal(back.facts[0].addedAt, 1000);
    assert.equal(back.updatedAt, "2026-09-01T00:00:00.000Z");
  });
});

describe("mergeAiMemoryFacts", () => {
  test("adds new fact texts as real fact objects with a text and addedAt", () => {
    const m = loadStudlinModule();
    const result = m.mergeAiMemoryFacts({ facts: [], updatedAt: null }, ["Prefers evening study sessions"]);
    assert.equal(result.facts.length, 1);
    assert.equal(result.facts[0].text, "Prefers evening study sessions");
    assert.ok(typeof result.facts[0].addedAt === "number");
    assert.ok(result.updatedAt);
  });

  test("an exact-duplicate fact text is skipped, not added again", () => {
    const m = loadStudlinModule();
    const existing = { facts: [{ text: "Hates morning workouts", addedAt: 1 }], updatedAt: "x" };
    const result = m.mergeAiMemoryFacts(existing, ["Hates morning workouts"]);
    assert.equal(result.facts.length, 1, "should not duplicate an identical fact");
  });

  test("a near-duplicate (case-insensitive substring overlap) is also skipped", () => {
    const m = loadStudlinModule();
    const existing = { facts: [{ text: "hates morning workouts", addedAt: 1 }], updatedAt: "x" };
    const result = m.mergeAiMemoryFacts(existing, ["Hates morning workouts specifically"]);
    assert.equal(result.facts.length, 1, "substring-overlapping fact should count as a dupe, not a second entry");
  });

  test("a genuinely new, unrelated fact is appended alongside existing ones", () => {
    const m = loadStudlinModule();
    const existing = { facts: [{ text: "Hates morning workouts", addedAt: 1 }], updatedAt: "x" };
    const result = m.mergeAiMemoryFacts(existing, ["Prefers flashcards over rereading notes"]);
    assert.equal(result.facts.length, 2);
    assert.equal(result.facts[1].text, "Prefers flashcards over rereading notes");
  });

  test("an empty string in newFactTexts is dropped, never stored as a blank fact", () => {
    const m = loadStudlinModule();
    const result = m.mergeAiMemoryFacts({ facts: [], updatedAt: null }, ["", "   ", "Real fact"]);
    assert.equal(result.facts.length, 1);
    assert.equal(result.facts[0].text, "Real fact");
  });

  test("nothing genuinely new -> returns the existing memory object unchanged (no updatedAt bump)", () => {
    const m = loadStudlinModule();
    const existing = { facts: [{ text: "Hates morning workouts", addedAt: 1 }], updatedAt: "original" };
    const result = m.mergeAiMemoryFacts(existing, ["Hates morning workouts"]);
    assert.equal(result, existing, "should return the same object, not a rebuilt copy, when nothing was added");
  });

  test("adding past the cap drops the OLDEST facts first, never the newest", () => {
    const m = loadStudlinModule();
    const existing = {
      facts: Array.from({ length: m.AI_MEMORY_FACT_CAP }, (_, i) => ({ text: "Fact " + i, addedAt: i })),
      updatedAt: "x",
    };
    const result = m.mergeAiMemoryFacts(existing, ["Brand new fact"]);
    assert.equal(result.facts.length, m.AI_MEMORY_FACT_CAP, "should stay capped, not grow unbounded");
    assert.equal(result.facts[0].text, "Fact 1", "the very oldest fact (Fact 0) should have been dropped");
    assert.equal(result.facts[result.facts.length - 1].text, "Brand new fact", "the newest fact should survive");
  });

  test("existingMem with no facts array at all doesn't throw", () => {
    const m = loadStudlinModule();
    const result = m.mergeAiMemoryFacts({ updatedAt: null }, ["First fact"]);
    assert.equal(result.facts.length, 1);
  });
});

describe("removeAiMemoryFact", () => {
  test("removes exactly the fact at the given index, keeps the rest in order", () => {
    const m = loadStudlinModule();
    const mem = { facts: [{ text: "A" }, { text: "B" }, { text: "C" }], updatedAt: "x" };
    const result = m.removeAiMemoryFact(mem, 1);
    assert.deepEqual(result.facts.map(f => f.text), ["A", "C"]);
  });

  test("removing bumps updatedAt to a fresh timestamp", () => {
    const m = loadStudlinModule();
    const mem = { facts: [{ text: "A" }], updatedAt: "stale" };
    const result = m.removeAiMemoryFact(mem, 0);
    assert.notEqual(result.updatedAt, "stale");
    assert.deepEqual(result.facts, []);
  });
});

describe("formatAiMemoryForPrompt", () => {
  test("no facts saved -> empty string, adds nothing to any prompt", () => {
    const m = loadStudlinModule();
    assert.equal(m.formatAiMemoryForPrompt(), "");
  });

  test("with real facts saved, returns one line naming them all, framed as real/still-true", () => {
    const m = loadStudlinModule();
    m.saveAiMemory({ facts: [{ text: "Hates morning workouts" }, { text: "Prefers evening sessions" }], updatedAt: "x" });
    const line = m.formatAiMemoryForPrompt();
    assert.ok(line.includes("Hates morning workouts"));
    assert.ok(line.includes("Prefers evening sessions"));
    assert.ok(line.length > 0);
  });
});
