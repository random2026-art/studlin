// Three bugs from the same 2026-09-08 user report:
//
// 1. "im mad at you because you also said theres search bar but thereisnt"
//    -- the collaborator-picker search bar (added earlier this session) was
//    gated behind candidates.length>5, copying "Schedule with Friends"'s own
//    threshold. The user has exactly 1 friend, so a real, shipped feature
//    was permanently invisible to them with zero way to discover it existed.
//    Fix: the threshold is gone -- the search box always renders once there
//    is at least one candidate, in both EventDetailModal and NewEventModal.
//
// 2. "i talked with my friend he said he never got anything ... he showed me
//    that in settings and privacy its turned on" -- askFriendsToShareAvailability
//    always showed "Asked them" as a flat success, regardless of whether
//    api/notify.js's shareAvailabilityRequest handler actually delivered
//    anything. The server silently returns {ok:true,sent:0} whenever the
//    recipient lacks a DIFFERENT setting (general push-notifications-enabled,
//    not "share my free/busy time") or has no registered device token --
//    and the client never read that field before declaring success.
//    Fix (this pass): the client read the real `sent` count and showed an
//    honest, differentiated message. SUPERSEDED 2026-09-10 -- push turned
//    out to reach almost nobody in practice (that permission is rarely
//    granted at all), so askFriendsToShareAvailability now sends a real
//    chat message as its primary, guaranteed channel instead, with push
//    kept only as a fire-and-forget bonus. See
//    tests/ask-them-to-turn-it-on-uses-chat-2026-09-10.test.js for current
//    coverage; the describe block below (testing the old push-response-
//    parsing shape) is removed rather than left as dead/misleading
//    coverage of behavior that no longer exists.
//
// 3. "when i turn on it doesnt do anything" (Attack Block retroactive toggle)
//    -- buildAssignmentAttackBlockPair returns null when no legal slot exists
//    before the deadline; EventDetailModal's save() had no null-check for
//    this path, so the toggle silently no-opped with zero feedback. Every
//    other Attack Block entry point in the file already handles this. Fix:
//    a matching null-check + a real, visible error via detailErr.
//
// All three are component-closure changes (EventDetailModal/NewEventModal),
// so these are source-level regression guards, same established convention
// as every other component-closure fix this session. Run with `npm test`.
const { test, describe } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");

const SOURCE = fs.readFileSync(path.join(__dirname, "..", "studlin-app.jsx"), "utf8");

describe("Collaborator search bar: no longer hidden behind a >5-candidates threshold", () => {
  test("EventDetailModal's picker renders the search input for ANY nonzero candidate count, not just >5", () => {
    const idx = SOURCE.indexOf(":collabCandidates.length===0?(");
    assert.notEqual(idx, -1, "the picker's empty-state branch must exist");
    const body = SOURCE.slice(idx, idx + 700);
    assert.match(body, /<Input value=\{collabSearchQuery\}/, "the search input must render unconditionally in the non-empty branch");
    assert.doesNotMatch(body, /collabCandidates\.length>5/, "the old threshold gate must be gone");
  });

  test("NewEventModal's picker renders the search input for ANY nonzero candidate count, not just >5", () => {
    const idx = SOURCE.indexOf(":evCollabCandidates.length===0?(");
    assert.notEqual(idx, -1, "the picker's empty-state branch must exist");
    const body = SOURCE.slice(idx, idx + 700);
    assert.match(body, /<Input value=\{evCollabSearchQuery\}/, "the search input must render unconditionally in the non-empty branch");
    assert.doesNotMatch(body, /evCollabCandidates\.length>5/, "the old threshold gate must be gone");
  });
});

describe("EventDetailModal's retroactive Attack Block toggle: no more silent no-op on a full calendar", () => {
  test("a null pair (no legal slot before the deadline) now blocks save with a real, visible error instead of silently falling through", () => {
    const idx = SOURCE.indexOf("if(canAddAttackBlock&&addAttackBlock){");
    assert.notEqual(idx, -1, "the retroactive Attack Block branch must exist");
    const body = SOURCE.slice(idx, idx + 1700);
    assert.match(body, /if\(!attackPair\)\{setDetailErr\("Couldn't find room for a probe session before the deadline/, "must set a real, visible error instead of proceeding as if the toggle was never touched");
    assert.match(body, /if\(!attackPair\)\{setDetailErr\([^)]*\);return;\}/, "must actually stop the save, not just warn and continue");
  });

  test("the error uses the modal's existing detailErr state, which already renders elsewhere in this same modal", () => {
    const declIdx = SOURCE.indexOf("const [detailErr,setDetailErr]=useState(\"\");");
    assert.notEqual(declIdx, -1, "detailErr must already be a real, rendered state in this modal (used by the project-breakdown guard)");
  });
});
