// Regression tests for the pending-acceptance calendar visualization added
// on top of Schedule with Friends / Find Shared Study Window: a proposed
// meetup or study block now shows dimmed with an "accepted/total" badge on
// the ORGANIZER's own calendar until every invited member has accepted (see
// confirmStudyTime, scheduleGroupSession, postGroupSchedule, and
// respondToShare's calendar branch in studlin-app.jsx).
//
// computeAcceptanceSummary is the one piece of that pulled out as a plain,
// independently-testable function -- it has to mirror respondToShare's own
// allAccepted check exactly (same memberUids.every(...)==="accepted" idea),
// since the block's dim/badge and respondToShare's own status:"confirmed"
// transition need to agree about when a proposal is actually done.
//
// refreshPendingAcceptance is the fetch-on-mount/fetch-on-open refresh (see
// its own comment for why this app deliberately doesn't hold a live
// Firestore listener open for this) -- only its "nothing to do" short-
// circuit is exercised here, since the harness's firebase stub has no
// firestore() to actually hit (see harness.js's own comment on what it
// stubs). That's still a real regression to guard: once a proposal is fully
// accepted, it must never be re-fetched again, not just render normally.
//
// Run with `npm test`.
const { test, describe } = require("node:test");
const assert = require("node:assert/strict");
const { loadStudlinModule } = require("./harness.js");

describe("computeAcceptanceSummary", () => {
  test("nobody's responded yet -- everyone reads as pending, not accepted", () => {
    const { computeAcceptanceSummary } = loadStudlinModule({});
    const s = computeAcceptanceSummary(["a", "b", "c"], {});
    assert.equal(s.total, 3);
    assert.equal(s.accepted, 0);
    assert.equal(s.declined, 0);
    assert.equal(s.pending, 3);
    assert.equal(s.allAccepted, false);
  });

  test("organizer's own implicit acceptance counts -- matches scheduleGroupSession/postGroupSchedule writing responses:{[myUid]:\"accepted\"} at proposal time", () => {
    const { computeAcceptanceSummary } = loadStudlinModule({});
    const s = computeAcceptanceSummary(["me", "friend1", "friend2"], { me: "accepted" });
    assert.equal(s.accepted, 1);
    assert.equal(s.pending, 2);
    assert.equal(s.allAccepted, false, "2/3 -- still dimmed, still shows a badge");
  });

  test("everyone accepted -- allAccepted flips true, this is what makes the block render as a totally normal event again", () => {
    const { computeAcceptanceSummary } = loadStudlinModule({});
    const s = computeAcceptanceSummary(["a", "b"], { a: "accepted", b: "accepted" });
    assert.equal(s.accepted, 2);
    assert.equal(s.total, 2);
    assert.equal(s.allAccepted, true);
  });

  test("a decline never counts toward acceptance, and never flips allAccepted true no matter how the rest respond", () => {
    const { computeAcceptanceSummary } = loadStudlinModule({});
    const s = computeAcceptanceSummary(["a", "b", "c"], { a: "accepted", b: "declined", c: "accepted" });
    assert.equal(s.accepted, 2);
    assert.equal(s.declined, 1);
    assert.equal(s.pending, 0, "declined isn't pending -- it's a resolved, non-accepting answer");
    assert.equal(s.allAccepted, false);
  });

  test("empty invite list never claims allAccepted -- an event with no real memberUids yet (or a malformed one) must not render as fully confirmed by default", () => {
    const { computeAcceptanceSummary } = loadStudlinModule({});
    const s = computeAcceptanceSummary([], {});
    assert.equal(s.total, 0);
    assert.equal(s.allAccepted, false, "total>0 is required -- vacuously-true would be a silent bug here");
  });

  test("missing memberUids/responses (undefined, not just empty) don't throw -- a plain manually-created event has neither field at all", () => {
    const { computeAcceptanceSummary } = loadStudlinModule({});
    const s = computeAcceptanceSummary(undefined, undefined);
    assert.equal(s.total, 0);
    assert.equal(s.allAccepted, false);
  });
});

describe("refreshPendingAcceptance", () => {
  test("no events carry a proposal FK -- returns null and never touches Firestore (the harness's firebase stub has no firestore(), so this proves the short-circuit actually runs)", async () => {
    const { refreshPendingAcceptance } = loadStudlinModule({});
    const events = [
      { id: "e1", date: "2026-08-25", time: "09:00", duration: 30, kind: "study block" },
      { id: "e2", date: "2026-08-25", time: "10:00", duration: 30, kind: "class" },
    ];
    const result = await refreshPendingAcceptance(events);
    assert.equal(result, null);
  });

  test("a proposal that's already fully accepted is never re-fetched -- once allAccepted, there's nothing left to learn from the chat message", async () => {
    const { refreshPendingAcceptance } = loadStudlinModule({});
    const events = [{
      id: "e1", date: "2026-08-25", time: "09:00", duration: 30, kind: "busy block",
      chatRoomId: "room1", chatMessageId: "msg1",
      proposalMemberUids: ["me", "friend"],
      proposalMemberNames: { me: "You", friend: "Friend" },
      proposalResponses: { me: "accepted", friend: "accepted" },
    }];
    const result = await refreshPendingAcceptance(events);
    assert.equal(result, null, "settled proposals are skipped entirely, not just a no-op update");
  });

  test("an id filter that matches nothing pending also short-circuits (the single-block popover-open refresh path)", async () => {
    const { refreshPendingAcceptance } = loadStudlinModule({});
    const events = [{
      id: "e1", date: "2026-08-25", time: "09:00", duration: 30, kind: "busy block",
      chatRoomId: "room1", chatMessageId: "msg1",
      proposalMemberUids: ["me", "friend"], proposalResponses: { me: "accepted" },
    }];
    const result = await refreshPendingAcceptance(events, ["some-other-id"]);
    assert.equal(result, null);
  });
});
