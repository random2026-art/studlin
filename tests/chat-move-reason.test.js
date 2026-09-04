// inferChatMoveReason + pastTenseProposalLabel's `reason` param -- honest
// "why" text for a chat move/retime confirmation. Deliberately does NOT
// reuse fmtPlacementReason's richer peak-hour/reliability vocabulary --
// chat's move/retime proposals go through the plain findFixedEventSlot/
// findLegalSlotOrNull scanner, which never computes those signals, so
// claiming them would be inventing a reason the engine didn't use. Only
// ever states something real: a displaced neighbor, or genuine adjacency
// to another event after placement. Run with `npm test`.
const { test, describe } = require("node:test");
const assert = require("node:assert/strict");
const { loadStudlinModule } = require("./harness.js");

describe("inferChatMoveReason", () => {
  test("a displaced title takes priority over everything else", () => {
    const m = loadStudlinModule();
    const reason = m.inferChatMoveReason([], "14:00", 30, "ev1", "Gym");
    assert.equal(reason, "moved Gym to fit");
  });

  test("no newTime at all -> empty string, never throws", () => {
    const m = loadStudlinModule();
    assert.equal(m.inferChatMoveReason([{ id: "x", time: "10:00" }], null, 30, "ev1", null), "");
  });

  test("something starts right after the new block ends (within 15 min) -> 'right before' that item", () => {
    const m = loadStudlinModule();
    const dayEvents = [{ id: "practice", title: "Track Practice", time: "15:10", duration: 60 }];
    // New block: 14:30-15:00 (30min), practice starts 15:10 -- a 10min gap, within the 15min window.
    const reason = m.inferChatMoveReason(dayEvents, "14:30", 30, "moved-1", null);
    assert.equal(reason, "right before your Track Practice at 3:10PM");
  });

  test("something ends right before the new block starts (within 15 min) -> 'right after' that item", () => {
    const m = loadStudlinModule();
    const dayEvents = [{ id: "class", title: "Chem Lecture", time: "13:00", duration: 50 }];
    // Class ends 13:50, new block starts 14:00 -- a 10min gap, within window.
    const reason = m.inferChatMoveReason(dayEvents, "14:00", 30, "moved-1", null);
    assert.equal(reason, "right after your Chem Lecture");
  });

  test("nothing adjacent within the window -> empty string, never a fabricated reason", () => {
    const m = loadStudlinModule();
    const dayEvents = [{ id: "far", title: "Dinner", time: "19:00", duration: 60 }];
    const reason = m.inferChatMoveReason(dayEvents, "10:00", 30, "moved-1", null);
    assert.equal(reason, "");
  });

  test("excludes the moved item's own entry from adjacency checks (it may still be in dayEvents at its OLD time)", () => {
    const m = loadStudlinModule();
    const dayEvents = [{ id: "moved-1", title: "This exact item", time: "10:05", duration: 30 }];
    const reason = m.inferChatMoveReason(dayEvents, "10:00", 30, "moved-1", null);
    assert.equal(reason, "", "should not treat the moved item's own old self as an adjacent neighbor");
  });

  test("an event exactly on the 15-minute boundary still counts as adjacent", () => {
    const m = loadStudlinModule();
    const dayEvents = [{ id: "b", title: "Boundary Event", time: "10:45", duration: 30 }];
    // New block 10:00-10:30, boundary event starts 10:45 -- exactly 15min gap.
    const reason = m.inferChatMoveReason(dayEvents, "10:00", 30, "x", null);
    assert.equal(reason, "right before your Boundary Event at 10:45AM");
  });

  test("an event just past the 15-minute window does NOT count as adjacent", () => {
    const m = loadStudlinModule();
    const dayEvents = [{ id: "b", title: "Too Far", time: "10:46", duration: 30 }];
    const reason = m.inferChatMoveReason(dayEvents, "10:00", 30, "x", null);
    assert.equal(reason, "");
  });
});

describe("pastTenseProposalLabel with a reason", () => {
  test("folds the reason in before the final period, one sentence", () => {
    const m = loadStudlinModule();
    const moved = [{ id: "e1", newDate: "2026-09-08", newTime: "15:00" }];
    const label = m.pastTenseProposalLabel("Move Chem homework", moved, "right before your Track Practice at 6:00PM");
    assert.equal(label, "Moved Chem homework to Tue, Sep 8 at 3:00PM, right before your Track Practice at 6:00PM.");
  });

  test("omitting the reason (or an empty string) reads exactly as before -- no dangling comma", () => {
    const m = loadStudlinModule();
    const moved = [{ id: "e1", newDate: "2026-09-08", newTime: "15:00" }];
    const label = m.pastTenseProposalLabel("Move Chem homework", moved, "");
    assert.equal(label, "Moved Chem homework to Tue, Sep 8 at 3:00PM.");
    const labelNoArg = m.pastTenseProposalLabel("Move Chem homework", moved);
    assert.equal(labelNoArg, label, "3rd arg is fully optional, byte-identical output when omitted");
  });

  test("a non-move label (Add/Delete/Set) is completely unaffected by a reason argument", () => {
    const m = loadStudlinModule();
    const label = m.pastTenseProposalLabel("Delete \"Old task\" from 2026-09-08?", [], "right before your Track Practice");
    assert.equal(label, "Deleted \"Old task\" from 2026-09-08");
  });
});
