// User report, 2026-09-10 ("she never even got a message... she already
// had her settings on") + follow-up ("why can't it just send her a message,
// there's gotta be a solution"): askFriendsToShareAvailability's ONLY
// delivery channel was a push notification, which silently depends on the
// recipient having granted browser notification permission -- a separate,
// rarely-granted OS-level permission unrelated to the in-app "Share my
// free/busy time" toggle she'd already turned on. Most real users never
// grant it, so this was reaching almost nobody even on a server-side
// "success".
//
// Fixed by sending an actual chat message into the DM instead -- the same
// proven, already-deployed delivery channel every scheduling proposal in
// this app already relies on (unread badge, live listener, zero OS
// permission required), using the identical check-existence-first DM
// creation pattern confirmGsPeople already uses for the documented
// firestore.rules reason. Push stays wired as a same-instant bonus when it
// happens to work, but no longer gates the toast's success/failure.
//
// Source-level regression guard (component-closure UI) -- same
// mixed-coverage convention this session uses elsewhere. Also asserts the
// new writes are actually shaped to pass the deployed chatRooms/messages
// rules (firestore.rules), not just "looks right" in isolation. Run with
// `npm test`.
const { test, describe } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");

const SOURCE = fs.readFileSync(path.join(__dirname, "..", "studlin-app.jsx"), "utf8");
const RULES = fs.readFileSync(path.join(__dirname, "..", "firestore.rules"), "utf8");

describe("askFriendsToShareAvailability sends a real chat message, not just a push notification", () => {
  const idx = SOURCE.indexOf("const askFriendsToShareAvailability=async()=>{");

  test("the function exists and posts into the DM room via dmRoomId, matching confirmGsPeople's check-existence-first pattern", () => {
    assert.notEqual(idx, -1);
    const body = SOURCE.slice(idx, idx + 1800);
    assert.match(body, /dmRoomId\(myUid,uid\)/);
    assert.match(body, /existingRoom\.exists/, "must check the room exists before set(), same firestore.rules reason confirmGsPeople documents");
    assert.match(body, /collection\('messages'\)\.add\(\{senderId:myUid,ts:Date\.now\(\),kind:"text",text:chatText\}\)/);
  });

  test("push notification is still sent, but fire-and-forget -- its failure no longer determines the toast", () => {
    const body = SOURCE.slice(idx, idx + 2400);
    assert.match(body, /shareAvailabilityRequest/, "push should still fire as a bonus channel");
    const chatResultsIdx = body.indexOf("chatResults=");
    const deliveredIdx = body.indexOf("const delivered=chatResults.filter(r=>r.ok).length;");
    assert.notEqual(chatResultsIdx, -1);
    assert.notEqual(deliveredIdx, -1, "delivered must be computed from the chat send results, not the push response");
  });

  test("the new chatRoom create() write matches the deployed rules' required shape (memberUids size 2, createdBy=auth.uid, both in memberUids)", () => {
    const body = SOURCE.slice(idx, idx + 1800);
    assert.match(body, /memberUids:\[myUid,uid\]\.sort\(\)/);
    assert.match(body, /createdBy:myUid/);

    const ruleIdx = RULES.indexOf("match /chatRooms/{roomId}");
    assert.notEqual(ruleIdx, -1);
    const ruleBody = RULES.slice(ruleIdx, ruleIdx + 900);
    assert.match(ruleBody, /memberUids\.size\(\) >= 2/);
    assert.match(ruleBody, /createdBy == request\.auth\.uid/);
  });

  test("the room update() write only touches fields the deployed rules allow (lastMessage/updatedAt)", () => {
    const body = SOURCE.slice(idx, idx + 1800);
    const updateIdx = body.indexOf("roomRef.update({lastMessage:");
    assert.notEqual(updateIdx, -1);
    const updateCall = body.slice(updateIdx, updateIdx + 150);
    assert.doesNotMatch(updateCall, /memberUids|createdBy/, "must never touch frozen fields in this update -- the deployed rules reject anything outside the allowlist");

    const ruleIdx = RULES.indexOf("affectedKeys().hasOnly(['lastMessage','updatedAt','groupType','expiresAt','lastReadAt'])");
    assert.notEqual(ruleIdx, -1, "the rule allowlist this write must stay inside of");
  });

  test("the new message create() write matches the deployed messages-subcollection rule (senderId must equal auth.uid)", () => {
    const body = SOURCE.slice(idx, idx + 1800);
    assert.match(body, /senderId:myUid/);

    const ruleIdx = RULES.indexOf("match /messages/{messageId}");
    assert.notEqual(ruleIdx, -1);
    const ruleBody = RULES.slice(ruleIdx, ruleIdx + 400);
    assert.match(ruleBody, /request\.auth\.uid == request\.resource\.data\.senderId/);
  });
});
