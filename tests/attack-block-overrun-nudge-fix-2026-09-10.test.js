// User report, 2026-09-10, with a screenshot: "why does it say this its
// stupid shouldnt we just remove it... i already hit dismiss but it has it
// again."
//
// The screenshot showed the Dashboard's "Falling behind on ..." overrun
// banner reading "0.0h of runway left... but the plan still has 0.5h
// scheduled" for an assignment due in 3 days with a single, entirely
// reasonable 30-minute block already scheduled for it -- not actually
// behind at all.
//
// Two real, separately confirmed bugs, both in computeCapacitySlack/
// detectAttackBlockOverruns:
//
// 1. computeCapacitySlack subtracts a 4-day "finish before the real
//    deadline" buffer, then floors runwayDays (and therefore
//    capacityMins) at 0 whenever that buffered date has already passed --
//    which happens for ANY deadline sooner than the buffer itself,
//    regardless of how much real time is actually left. A deadline
//    tomorrow and a deadline in 10 minutes both used to report the
//    identical "capacityMins:0" -- this file's own scheduling.test.js
//    already covers the general math fix (compressed:true falls back to
//    the real remaining time against the actual deadline).
//
// 2. Dismissal ("I'll handle it") was keyed on attackChainId alone -- a
//    fresh, randomly-generated id every time an Attack Block is (re)
//    started. Cancel a chain and start a new one for the SAME assignment
//    (exactly what happens while testing this exact feature) and the
//    dismissal never carries over, since it's genuinely a different
//    chainId even though it's the same underlying assignment. Fixed by
//    keying on dismissKey (the chain's dueEventId, its stable owning
//    assignment marker -- falls back to chainId only if a chain somehow
//    has no dueEventId at all).
//
// Both fixed functions are real, exported, pure functions -- tested with
// real invocations. Run with `npm test`.
const { test, describe } = require("node:test");
const assert = require("node:assert/strict");
const { loadStudlinModule } = require("./harness.js");

describe("detectAttackBlockOverruns: the exact screenshot scenario no longer false-positives", () => {
  test("a near-term assignment (due in 3 days) with a single reasonable scheduled block is NOT flagged as falling behind", () => {
    const m = loadStudlinModule({ now: "2026-09-10T20:00:00" });
    const events = [{
      id: "hw3-session", isAttackBlock: true, attackChainId: "attack-abc", dueEventId: "hw3-marker",
      title: "HW 3 (7.2 and 7.3)", deadline: "2026-09-13", status: "pending", duration: 30,
    }];
    const overruns = m.detectAttackBlockOverruns(events, "2026-09-10");
    assert.equal(overruns.length, 0, "0.5h scheduled against a genuinely 3-day-out deadline is fine, not an overrun");
  });

  test("the same assignment WOULD still be flagged if it genuinely had too much pending work for its real remaining time", () => {
    const m = loadStudlinModule({ now: "2026-09-10T20:00:00" });
    const events = [{
      id: "hw3-session", isAttackBlock: true, attackChainId: "attack-abc", dueEventId: "hw3-marker",
      title: "HW 3 (7.2 and 7.3)", deadline: "2026-09-13", status: "pending", duration: 500,
    }];
    const overruns = m.detectAttackBlockOverruns(events, "2026-09-10");
    assert.equal(overruns.length, 1, "500 pending minutes genuinely doesn't fit in 3 days at a sustainable pace -- this one really is an overrun");
  });
});

describe("detectAttackBlockOverruns exposes dismissKey (the stable assignment id, not the ephemeral chain id)", () => {
  test("dismissKey prefers dueEventId over chainId", () => {
    const m = loadStudlinModule({ now: "2026-07-20T09:00:00" });
    const events = [{
      id: "s1", isAttackBlock: true, attackChainId: "attack-xyz", dueEventId: "assignment-1",
      title: "Big Paper", deadline: "2026-07-21", status: "pending", duration: 400,
    }];
    const overruns = m.detectAttackBlockOverruns(events, "2026-07-20");
    assert.equal(overruns.length, 1);
    assert.equal(overruns[0].dismissKey, "assignment-1");
    assert.equal(overruns[0].chainId, "attack-xyz", "chainId is still reported too, just no longer what dismissal keys off of");
  });

  test("falls back to chainId when a chain genuinely has no dueEventId", () => {
    const m = loadStudlinModule({ now: "2026-07-20T09:00:00" });
    const events = [{
      id: "s1", isAttackBlock: true, attackChainId: "attack-xyz",
      title: "Big Paper", deadline: "2026-07-21", status: "pending", duration: 400,
    }];
    const overruns = m.detectAttackBlockOverruns(events, "2026-07-20");
    assert.equal(overruns.length, 1);
    assert.equal(overruns[0].dismissKey, "attack-xyz");
  });

  test("the exact user-reported scenario: dismissing the old chain, then cancelling and restarting Attack Block for the same assignment (a brand-new chainId), still counts as dismissed today", () => {
    const m = loadStudlinModule({ now: "2026-07-20T09:00:00" });
    const oldChainEvents = [{
      id: "old-session", isAttackBlock: true, attackChainId: "attack-old", dueEventId: "assignment-1",
      title: "Big Paper", deadline: "2026-07-21", status: "pending", duration: 400,
    }];
    const beforeDismiss = m.detectAttackBlockOverruns(oldChainEvents, "2026-07-20");
    assert.equal(beforeDismiss.length, 1);
    m.dismissAttackOverrunToday(beforeDismiss[0].dismissKey);

    // Cancel the old chain, start a brand-new one for the SAME assignment
    // -- a genuinely different attackChainId, same dueEventId.
    const newChainEvents = [{
      id: "new-session", isAttackBlock: true, attackChainId: "attack-new", dueEventId: "assignment-1",
      title: "Big Paper", deadline: "2026-07-21", status: "pending", duration: 400,
    }];
    const afterRestart = m.detectAttackBlockOverruns(newChainEvents, "2026-07-20");
    assert.equal(afterRestart.length, 1, "still a real overrun by the raw math");
    assert.equal(m.isAttackOverrunDismissedToday(afterRestart[0].dismissKey), true, "the new chain's dismissKey resolves to the same stable assignment id, so it's still considered dismissed for today");
  });
});
