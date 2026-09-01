// confidenceOutcomeInsight -- compares each scored exam's last pre-exam
// confidence answer against how it actually went. Extracted 2026-09-01 from
// an inline IIFE in Studlin Prep's exam-detail render (studlin-app.jsx) so
// Studlin AI's digest can reuse the exact same logic. These tests pin the
// exact behavior of that extraction (byte-identical to the original IIFE).
const { test, describe } = require("node:test");
const assert = require("node:assert/strict");
const { loadStudlinModule } = require("./harness.js");

function exam(overrides) {
  return { id: "e" + Math.random(), kind: "exam", date: "2026-06-01", status: "done", ...overrides };
}

describe("confidenceOutcomeInsight", () => {
  test("fewer than 3 scored exams returns null, even with a clear pattern", () => {
    const m = loadStudlinModule();
    m.lsSet("events", [
      exam({ scoreTier: "below", confidenceLog: [4] }),
      exam({ scoreTier: "below", confidenceLog: [5] }),
    ]);
    assert.equal(m.confidenceOutcomeInsight(), null);
  });

  test("majority solid-but-below-expected returns the caution sentence with real counts", () => {
    const m = loadStudlinModule();
    m.lsSet("events", [
      exam({ scoreTier: "below", confidenceLog: [4] }), // solid (4) but scored below
      exam({ scoreTier: "below", confidenceLog: [5] }), // solid (5) but scored below
      exam({ scoreTier: "above", confidenceLog: [3] }), // okay, not solid or shaky -- irrelevant
    ]);
    const insight = m.confidenceOutcomeInsight();
    assert.match(insight, /"solid" confidence calls have run worse than expected on 2 of your last 3 scored exams/);
  });

  test("majority shaky-but-above-expected returns the encouragement sentence with real counts", () => {
    const m = loadStudlinModule();
    m.lsSet("events", [
      exam({ scoreTier: "above", confidenceLog: [1] }), // shaky (1) but scored above
      exam({ scoreTier: "above", confidenceLog: [2] }), // shaky (2) but scored above
      exam({ scoreTier: "below", confidenceLog: [5] }), // solid, scored below -- only 1, not a majority
    ]);
    const insight = m.confidenceOutcomeInsight();
    assert.match(insight, /scored better than expected on 2 of your last 3 "shaky" exams/);
  });

  test("no dominant mismatch pattern returns null", () => {
    const m = loadStudlinModule();
    m.lsSet("events", [
      exam({ scoreTier: "expected", confidenceLog: [3] }),
      exam({ scoreTier: "above", confidenceLog: [5] }), // solid, scored above -- not a mismatch at all
      exam({ scoreTier: "below", confidenceLog: [1] }), // shaky, scored below -- not a mismatch either
    ]);
    assert.equal(m.confidenceOutcomeInsight(), null);
  });

  test("only the LAST confidenceLog entry counts, not earlier ones", () => {
    const m = loadStudlinModule();
    m.lsSet("events", [
      // Early answers were shaky (1,1), but the FINAL pre-exam answer was
      // solid (5) -- if the code incorrectly used the first entry instead
      // of the last, this would land in shakyButAbove/neither bucket
      // instead of solidButBelow, and the count below would be wrong.
      exam({ scoreTier: "below", confidenceLog: [1, 1, 5] }),
      exam({ scoreTier: "below", confidenceLog: [4] }),
      exam({ scoreTier: "expected", confidenceLog: [3] }), // control: neither bucket
    ]);
    const insight = m.confidenceOutcomeInsight();
    assert.match(insight, /"solid" confidence calls have run worse than expected on 2 of your last 3 scored exams/);
  });

  test("exams missing scoreTier or confidenceLog are excluded from the sample entirely", () => {
    const m = loadStudlinModule();
    m.lsSet("events", [
      exam({ scoreTier: "below", confidenceLog: [5] }),
      exam({ scoreTier: "below", confidenceLog: [4] }),
      exam({ confidenceLog: [5] }), // no scoreTier -- excluded
      exam({ scoreTier: "below" }), // no confidenceLog -- excluded
    ]);
    // Only 2 genuinely qualify -- under the 3-exam floor.
    assert.equal(m.confidenceOutcomeInsight(), null);
  });

  test("non-exam events are ignored entirely", () => {
    const m = loadStudlinModule();
    m.lsSet("events", [
      exam({ scoreTier: "below", confidenceLog: [5] }),
      exam({ scoreTier: "below", confidenceLog: [4] }),
      { id: "not-exam", kind: "deadline", date: "2026-06-01", scoreTier: "below", confidenceLog: [5] },
    ]);
    assert.equal(m.confidenceOutcomeInsight(), null);
  });
});
