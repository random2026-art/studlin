// User request, 2026-09-11: "if i plan to meet with a friend and it has
// the meeting on the calendar make it so that i cant move it but if i hit
// it i could hit edit and edit time and meeting time but it wont update
// until the other person or people agree also theres option to delete but
// it will let the other people know or person he deleted it so not
// planning on going."
//
// Three real gaps found (all in the existing "Schedule with Friends"
// negotiation, which already tracks proposalMemberUids/proposalResponses
// per shared block via computeAcceptanceSummary):
//  1. Once every invited person accepted, the block was treated as "just a
//     fully normal event from then on" (the pre-existing comment's own
//     words) -- fully draggable, no lock at all. moveEvent now refuses and
//     shows a toast (isLockedSharedMeeting).
//  2. Editing a locked meeting's date/time in the Edit Task modal used to
//     commit directly. It now diverts into a reschedule request (a new
//     "calendarReschedule" chat message) that only actually applies once
//     every invited person accepts -- see proposeRescheduleFromDetail,
//     respondToShare's calendarReschedule branch, and
//     refreshPendingReschedules (the proposer's own side, since only the
//     accepting side's client applies the change immediately in
//     respondToShare -- the proposer needs to notice it happened on their
//     own next visit, same fetch-on-mount tradeoff refreshPendingAcceptance
//     already uses for the original invite).
//  3. Deleting a "study block" co-op session already notified the other
//     participant (a live studySessions doc + the existing
//     coopCancelAlerts listener) -- but a "busy block" Meeting has no such
//     doc at all, so deleting one never told anyone. notifyMeetingCancellation
//     now sends a plain chat message for that case, and is called from
//     BOTH delete paths this app has (CalendarTab's deleteEventWithUndo,
//     App's deleteEventFromDetail behind the Edit Task modal's Delete
//     button) -- there were two, and only one had the co-op-session logic.
//
// isLockedSharedMeeting/refreshPendingReschedules/notifyMeetingCancellation
// are real, exported functions -- tested with real invocations wherever
// they don't require a live Firestore (fsdb is not stubbed in this test
// harness; notifyMeetingCancellation's own real invocations here only
// cover the branches that return before ever reaching fsdb()). Everything
// else (the moveEvent/save()/respondToShare/ChatBubble wiring) is
// component-closure UI, so those are source-level regression guards, same
// mixed-coverage convention this session has used throughout. Run with
// `npm test`.
const { test, describe } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");
const { loadStudlinModule } = require("./harness.js");

const SOURCE = fs.readFileSync(path.join(__dirname, "..", "studlin-app.jsx"), "utf8");

describe("isLockedSharedMeeting: locked only once EVERY invited person has accepted", () => {
  test("true once all members accepted", () => {
    const { isLockedSharedMeeting } = loadStudlinModule({ now: "2026-09-11T09:00:00" });
    const ev = { proposalMemberUids: ["me", "friend"], proposalResponses: { me: "accepted", friend: "accepted" } };
    assert.equal(isLockedSharedMeeting(ev), true);
  });
  test("still unlocked while a response is pending -- fine to drag freely, only the proposer has it so far", () => {
    const { isLockedSharedMeeting } = loadStudlinModule({ now: "2026-09-11T09:00:00" });
    const ev = { proposalMemberUids: ["me", "friend"], proposalResponses: { me: "accepted" } };
    assert.equal(isLockedSharedMeeting(ev), false);
  });
  test("a plain event with no proposalMemberUids at all is never locked", () => {
    const { isLockedSharedMeeting } = loadStudlinModule({ now: "2026-09-11T09:00:00" });
    assert.equal(isLockedSharedMeeting({ title: "Study" }), false);
    assert.equal(isLockedSharedMeeting(null), false);
  });
});

describe("refreshPendingReschedules: no-ops safely with nothing pending", () => {
  test("returns null immediately when no event has a pendingReschedule", async () => {
    const { refreshPendingReschedules } = loadStudlinModule({ now: "2026-09-11T09:00:00" });
    const result = await refreshPendingReschedules([{ id: "a", date: "2026-09-11" }]);
    assert.equal(result, null);
  });
  test("returns null for an empty events array", async () => {
    const { refreshPendingReschedules } = loadStudlinModule({ now: "2026-09-11T09:00:00" });
    const result = await refreshPendingReschedules([]);
    assert.equal(result, null);
  });
});

describe("notifyMeetingCancellation: safe no-op with no signed-in user (real invocation, no Firestore reached)", () => {
  test("does not throw for a locked Meeting with no signed-in user", () => {
    const { notifyMeetingCancellation } = loadStudlinModule({ now: "2026-09-11T09:00:00" });
    const ev = { title: "Coffee", chatRoomId: "room1", proposalMemberUids: ["me", "friend"], proposalResponses: { me: "accepted", friend: "accepted" } };
    assert.doesNotThrow(() => notifyMeetingCancellation(ev));
  });
  test("does not throw for a co-op study session with no signed-in user", () => {
    const { notifyMeetingCancellation } = loadStudlinModule({ now: "2026-09-11T09:00:00" });
    assert.doesNotThrow(() => notifyMeetingCancellation({ title: "Study", studySessionId: "sess1" }));
  });
  test("does not throw for a plain unrelated event", () => {
    const { notifyMeetingCancellation } = loadStudlinModule({ now: "2026-09-11T09:00:00" });
    assert.doesNotThrow(() => notifyMeetingCancellation({ title: "Homework" }));
  });
});

describe("Source-level regression guards: moveEvent refuses to drag a locked meeting", () => {
  test("moveEvent checks isLockedSharedMeeting before allowing a move, same choke point as the deadline hard wall", () => {
    const idx = SOURCE.indexOf("const moveEvent=(id,newDate,newTime)=>{");
    assert.ok(idx > -1, "moveEvent should still exist");
    const slice = SOURCE.slice(idx, idx + 400);
    assert.ok(slice.includes("if(ev.deadline&&newDate>ev.deadline){showDeadlineToast(ev.deadline);return;}"), "the pre-existing deadline hard wall must still be there");
    assert.ok(slice.includes("if(isLockedSharedMeeting(ev)){showLockedMeetingToast();return;}"), "a locked shared meeting must be refused the same way, right next to the deadline wall");
  });
});

describe("Source-level regression guards: both delete paths notify the other person", () => {
  test("CalendarTab's deleteEventWithUndo calls notifyMeetingCancellation", () => {
    const idx = SOURCE.indexOf("if(ev)notifyMeetingCancellation(ev);");
    assert.ok(idx > -1, "deleteEventWithUndo must call the shared notify function");
  });
  test("App's deleteEventFromDetail (the Edit Task modal's Delete button) ALSO calls it -- this is the second, previously-uncovered delete path", () => {
    const idx = SOURCE.indexOf("const deleteEventFromDetail=(ev,opts)=>{");
    assert.ok(idx > -1, "deleteEventFromDetail should still exist");
    const slice = SOURCE.slice(idx, idx + 1800);
    assert.ok(slice.includes("notifyMeetingCancellation(ev);"), "deleting from the Edit Task modal must notify too, not just CalendarTab's own grid delete");
  });
});

describe("Source-level regression guards: editing a locked meeting proposes instead of committing", () => {
  test("EventDetailModal's save() intercepts a date/time change on a locked meeting before finishSave/proceedSave", () => {
    const idx = SOURCE.indexOf("function EventDetailModal(");
    assert.ok(idx > -1, "EventDetailModal should still exist");
    const slice = SOURCE.slice(idx, idx + 50000);
    assert.ok(slice.includes("const isLockedMeeting=isLockedSharedMeeting(ev);"), "the modal must compute lock state from the real shared function, not its own re-implementation");
    assert.ok(slice.includes("onProposeReschedule(ev,date,time);"), "changing date/time on a locked meeting must call onProposeReschedule");
    assert.ok(slice.includes("if(isLockedMeeting&&!hasPendingReschedule&&(date!==ev.date||time!==ev.time)){"), "must only intercept when the date/time actually changed, not every save");
  });
  test("App wires onProposeReschedule={proposeRescheduleFromDetail} into the modal, and that function sends a calendarReschedule message", () => {
    const idx = SOURCE.indexOf("const proposeRescheduleFromDetail=(ev,newDate,newTime)=>{");
    assert.ok(idx > -1, "proposeRescheduleFromDetail should exist in App()");
    const slice = SOURCE.slice(idx, idx + 1500);
    assert.ok(slice.includes('kind:"calendarReschedule"'), "must send the new calendarReschedule message kind");
    assert.ok(slice.includes("pendingReschedule:{chatMessageId:msgRef.id,newDate,newTime}"), "must stamp the proposer's own local event as pending, not change its real date/time yet");
    const wireIdx = SOURCE.indexOf("onProposeReschedule={proposeRescheduleFromDetail}");
    assert.ok(wireIdx > -1, "must actually be passed into <EventDetailModal>");
  });
});

describe("Source-level regression guards: the responder's side applies the change once everyone accepts", () => {
  test("respondToShare has a calendarReschedule branch that patches the matching local event by chatMessageId", () => {
    const idx = SOURCE.indexOf('if(msg.kind==="calendarReschedule"){');
    assert.ok(idx > -1, "respondToShare should have a calendarReschedule branch");
    const slice = SOURCE.slice(idx, idx + 1200);
    assert.ok(slice.includes("e.chatMessageId===msg.originalChatMessageId"), "must match the responder's OWN local event via the shared originalChatMessageId key, not by a locally-generated id (each side's copy has a different one)");
    assert.ok(slice.includes("date:msg.newDate,time:msg.newTime"), "must apply the new date/time once allAccepted");
  });
  test("ChatBubble renders an Accept/Decline UI for calendarReschedule messages", () => {
    const idx = SOURCE.indexOf('if(m.kind==="calendarReschedule"){');
    assert.ok(idx > -1, "ChatBubble should render calendarReschedule messages");
    const slice = SOURCE.slice(idx, idx + 1500);
    assert.ok(slice.includes('onRespond(m.id,"accepted")'), "must offer Accept");
    assert.ok(slice.includes('onRespond(m.id,"declined")'), "must offer Decline");
  });
});
