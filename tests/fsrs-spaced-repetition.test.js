// Tests for real per-card FSRS spaced repetition (see the FSRS block in
// studlin-app.jsx, right before computeReviewOffsets). These formulas were
// transcribed directly from the actual open-source reference implementation
// (open-spaced-repetition/py-fsrs, fsrs/scheduler.py) rather than from
// memory, so most of these tests check mathematical properties that are
// true BY CONSTRUCTION of the FACTOR/DECAY relationship -- if the formulas
// were transcribed wrong, these would catch it even without needing to
// hand-verify every decimal parameter. Run with `npm test`.
const { test, describe } = require("node:test");
const assert = require("node:assert/strict");
const { loadStudlinModule } = require("./harness.js");

describe("fsrsRetrievability (forgetting curve)", () => {
  test("no time elapsed -- perfect retrievability", () => {
    const m = loadStudlinModule();
    assert.equal(m.fsrsRetrievability(10, 0), 1);
  });

  test("at exactly t=stability, retrievability is ~0.9 -- this is the DEFINITION of stability, and only holds if FACTOR/DECAY were derived correctly from it", () => {
    const m = loadStudlinModule();
    for (const s of [1, 10, 50, 200]) {
      assert.ok(Math.abs(m.fsrsRetrievability(s, s) - 0.9) < 0.0001, `stability=${s} should give R~0.9, got ${m.fsrsRetrievability(s, s)}`);
    }
  });

  test("retrievability strictly decreases as more time elapses", () => {
    const m = loadStudlinModule();
    const r0 = m.fsrsRetrievability(20, 5);
    const r1 = m.fsrsRetrievability(20, 10);
    const r2 = m.fsrsRetrievability(20, 30);
    assert.ok(r0 > r1 && r1 > r2, `expected strictly decreasing, got ${r0}, ${r1}, ${r2}`);
  });

  test("a card with no stability yet has zero retrievability", () => {
    const m = loadStudlinModule();
    assert.equal(m.fsrsRetrievability(null, 5), 0);
    assert.equal(m.fsrsRetrievability(undefined, 5), 0);
  });
});

describe("fsrsInitialStability / fsrsInitialDifficulty (first-ever rating on a new card)", () => {
  test("initial stability is monotonically higher for a better first rating (Again < Hard < Good < Easy)", () => {
    const m = loadStudlinModule();
    const [again, hard, good, easy] = [1, 2, 3, 4].map(r => m.fsrsInitialStability(r));
    assert.ok(again < hard && hard < good && good < easy, `expected strictly increasing, got ${again}, ${hard}, ${good}, ${easy}`);
  });

  test("initial difficulty is monotonically LOWER for a better first rating -- a card you got right away is judged easier", () => {
    const m = loadStudlinModule();
    const [again, hard, good, easy] = [1, 2, 3, 4].map(r => m.fsrsInitialDifficulty(r));
    assert.ok(again > hard && hard > good && good > easy, `expected strictly decreasing, got ${again}, ${hard}, ${good}, ${easy}`);
  });

  test("difficulty is always clamped to [1,10] even for an extreme first rating", () => {
    const m = loadStudlinModule();
    for (const r of [1, 2, 3, 4]) {
      const d = m.fsrsInitialDifficulty(r);
      assert.ok(d >= 1 && d <= 10, `difficulty ${d} out of [1,10] for rating ${r}`);
    }
  });
});

describe("fsrsNextIntervalDays (solving the forgetting curve for the 90%-retention point)", () => {
  test("the next interval for a given stability is that same stability -- inverse of the retrievability formula, by construction", () => {
    const m = loadStudlinModule();
    for (const s of [1, 5, 30, 100]) {
      assert.equal(m.fsrsNextIntervalDays(s), Math.max(1, Math.round(s)));
    }
  });

  test("never schedules less than 1 day out", () => {
    const m = loadStudlinModule();
    assert.equal(m.fsrsNextIntervalDays(0.001), 1);
  });
});

describe("fsrsReviewCard (the real end-to-end scheduling behavior a student would see)", () => {
  test("repeated 'Mastered' (Easy) ratings on a new card produce a growing sequence of intervals -- the actual spaced-repetition shape", () => {
    const m = loadStudlinModule();
    let card = {};
    let now = new Date("2026-01-01T00:00:00Z");
    const intervals = [];
    for (let i = 0; i < 5; i++) {
      card = m.fsrsReviewCard(card, 4, now);
      intervals.push(Math.round((new Date(card.due) - now) / 86400000));
      now = new Date(card.due);
    }
    for (let i = 1; i < intervals.length; i++) {
      assert.ok(intervals[i] > intervals[i - 1], `interval sequence should strictly grow, got ${intervals}`);
    }
  });

  test("a lapse ('Missed') after real accumulated stability drops it sharply -- forgetting resets progress, doesn't just pause it", () => {
    const m = loadStudlinModule();
    let card = {};
    let now = new Date("2026-01-01T00:00:00Z");
    for (let i = 0; i < 3; i++) {
      card = m.fsrsReviewCard(card, 4, now);
      now = new Date(card.due);
    }
    const stabilityBeforeLapse = card.stability;
    const afterLapse = m.fsrsReviewCard(card, 1, now);
    assert.ok(afterLapse.stability < stabilityBeforeLapse * 0.5, `expected a sharp drop, went from ${stabilityBeforeLapse} to ${afterLapse.stability}`);
  });

  test("a brand-new card (no prior state at all) can be reviewed without crashing, and gets a real due date in the future", () => {
    const m = loadStudlinModule();
    const now = new Date("2026-01-01T00:00:00Z");
    const card = m.fsrsReviewCard({ q: "What is 2+2?", a: "4" }, 3, now);
    assert.ok(card.due, "should have a due date");
    assert.ok(new Date(card.due) > now, "due date should be in the future");
    assert.equal(card.q, "What is 2+2?", "existing card fields must survive untouched");
    assert.equal(card.reps, 1);
  });

  test("does not mutate the input card object", () => {
    const m = loadStudlinModule();
    const original = { q: "x", a: "y" };
    const originalCopy = { ...original };
    m.fsrsReviewCard(original, 3, new Date());
    assert.deepEqual(original, originalCopy, "input card must be untouched");
  });
});

describe("fsrsCardIsDue", () => {
  test("a card with no due date at all (every pre-FSRS card) is due immediately -- no silent migration needed", () => {
    const m = loadStudlinModule();
    assert.equal(m.fsrsCardIsDue({ q: "x", a: "y" }, new Date()), true);
  });

  test("a future due date is not due yet", () => {
    const m = loadStudlinModule();
    const now = new Date("2026-01-01T00:00:00Z");
    const future = new Date("2026-06-01T00:00:00Z");
    assert.equal(m.fsrsCardIsDue({ due: future.toISOString() }, now), false);
  });

  test("a past due date is due", () => {
    const m = loadStudlinModule();
    const now = new Date("2026-06-01T00:00:00Z");
    const past = new Date("2026-01-01T00:00:00Z");
    assert.equal(m.fsrsCardIsDue({ due: past.toISOString() }, now), true);
  });
});

describe("FSRS_PARAMETERS (the transcribed default weights)", () => {
  test("has exactly 21 parameters, matching the real reference implementation's DEFAULT_PARAMETERS length", () => {
    const { FSRS_PARAMETERS } = loadStudlinModule();
    assert.equal(FSRS_PARAMETERS.length, 21);
  });
});
