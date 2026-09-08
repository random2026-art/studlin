// Regression test for a 2026-09-08 user report that directly contradicted
// an earlier same-day fix: "the schedule with friends feature once i click
// on my friends name it just says loading friend and stays like that for
// what seems to be forever so no you did not in fact fix this."
//
// The earlier fix (schedule-with-friends-stuck-loading-2026-09-08.test.js)
// covered openGroupSchedule -- the initial friends-LIST fetch. This is a
// genuinely different function: confirmGsPeople, bound to the "Continue"
// button AFTER a friend is picked. It awaits four separate Firestore
// calls (create/merge the chat room, fetchFriendsBusyIntervals,
// findSharedStudyWindow) with zero try/catch -- any one failing threw out
// of the async function before setGsLoading(false) ever ran. Since
// gsLoading is the SAME flag the picker step's own render checks to show
// "Loading your friends…", a failure here looked identical to the
// friends list itself never loading, even though it had already loaded
// successfully by this point -- exactly the user's report.
//
// Also covers the same missing-error-handling gap in the two Project
// collaborator pickers (openCollabPicker/openEvCollabPicker), fixed
// alongside this for consistency, plus their new search bars.
//
// All three live in component closures, so these are source-level
// regression guards, same established precedent as every other
// component-closure fix this session. Run with `npm test`.
const { test, describe } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");

const SOURCE = fs.readFileSync(path.join(__dirname, "..", "studlin-app.jsx"), "utf8");

describe("confirmGsPeople never leaves the picker stuck on a misleading 'loading' state forever", () => {
  test("the whole body is wrapped in try/catch, and setGsLoading(false) runs even on failure", () => {
    const idx = SOURCE.indexOf("const confirmGsPeople=async()=>{");
    assert.notEqual(idx, -1, "confirmGsPeople must exist");
    const body = SOURCE.slice(idx, idx + 4800);
    assert.match(body, /try\{/, "the four awaited Firestore calls must be inside a try block");
    assert.match(body, /\}catch\(e\)\{/, "a failure must be caught, not left as an unhandled rejection");
    const catchIdx = body.indexOf("}catch(e){");
    const afterCatch = body.slice(catchIdx);
    assert.match(afterCatch, /setGsLoading\(false\)/, "setGsLoading(false) must still run after a caught failure");
    assert.match(afterCatch, /setGsConfirmLoadError\(true\)/, "a caught failure must set a real, distinct error flag");
  });

  test("the render shows a distinct error+retry state for this failure, not the misleading 'Loading your friends…' text or a silent fall-through to the candidate list", () => {
    const idx = SOURCE.indexOf('title="Schedule with Friends"');
    assert.notEqual(idx, -1);
    const body = SOURCE.slice(idx, idx + 2000);
    assert.match(body, /gsConfirmLoadError\?/, "the render must branch on the confirm-step error state separately from the initial load error");
    assert.match(body, /Couldn't check everyone's availability/, "the error copy must be honest about which step failed");
    assert.match(body, /onClick=\{confirmGsPeople\}>Try again/, "retrying must re-run confirmGsPeople, not just reopen the friends list");
  });

  test("the loading text distinguishes the initial friends-fetch from the post-pick availability-check, since both share gsLoading", () => {
    const idx = SOURCE.indexOf('title="Schedule with Friends"');
    const body = SOURCE.slice(idx, idx + 1200);
    assert.match(body, /gsSelected\.length>0\?"Checking everyone's availability…":"Loading your friends…"/);
  });

  // Root cause, found via direct Firestore inspection against the user's
  // real account: the single-friend DM branch's chatRooms merge-set write
  // is the EXACT same shape ChatDrawer's own lazy DM-room-creation already
  // uses (type/memberUids/createdBy/createdAt/updatedAt/lastMessage) --
  // firestore.rules' chatRooms `update` rule only allows lastMessage/
  // updatedAt/groupType/expiresAt/lastReadAt to change, so this correctly,
  // predictably gets rejected with permission-denied for ANY conversation
  // that already exists (createdAt differs from what's stored). ChatDrawer
  // already treats this as a harmless no-op via .catch(()=>{}) -- this
  // call was missing that exact safety net, so an everyday, expected
  // rejection is what actually threw here in the first place, not some
  // rare edge case.
  test("the single-friend chatRoom write is caught the same proven-safe way ChatDrawer's own DM-room creation already is", () => {
    const idx = SOURCE.indexOf("const confirmGsPeople=async()=>{");
    const body = SOURCE.slice(idx, idx + 3000);
    assert.match(body, /collection\('chatRooms'\)\.doc\(roomId\)\.set\(\{type:"dm",memberUids:\[myUid,otherUid\]\.sort\(\),createdBy:myUid,createdAt:now,updatedAt:now,lastMessage:null\},\{merge:true\}\)\.catch\(\(\)=>\{\}\);/,
      "without .catch(()=>{}), this write's everyday permission-denied rejection for an already-existing room throws uncaught out of confirmGsPeople");
  });
});

describe("Project collaborator pickers get the same error-handling + search bar as Schedule with Friends", () => {
  test("openCollabPicker (EventDetailModal) is wrapped in try/catch", () => {
    const idx = SOURCE.indexOf("const openCollabPicker=async()=>{");
    assert.notEqual(idx, -1);
    const body = SOURCE.slice(idx, idx + 1400);
    assert.match(body, /try\{/);
    assert.match(body, /setCollabLoadError\(true\)/);
  });

  test("openEvCollabPicker (NewEventModal) is wrapped in try/catch", () => {
    const idx = SOURCE.indexOf("const openEvCollabPicker=async()=>{");
    assert.notEqual(idx, -1);
    const body = SOURCE.slice(idx, idx + 1400);
    assert.match(body, /try\{/);
    assert.match(body, /setEvCollabLoadError\(true\)/);
  });

  test("both collaborator picker modals render a search bar once candidates exceed 5, same threshold as Schedule with Friends", () => {
    const collabIdx = SOURCE.indexOf("{collabLoading?(");
    const collabBody = SOURCE.slice(collabIdx, collabIdx + 1400);
    assert.match(collabBody, /collabCandidates\.length>5&&\(/);
    assert.match(collabBody, /placeholder="Search friends"/);

    const evCollabIdx = SOURCE.indexOf("{evCollabLoading?(");
    const evCollabBody = SOURCE.slice(evCollabIdx, evCollabIdx + 1600);
    assert.match(evCollabBody, /evCollabCandidates\.length>5&&\(/);
    assert.match(evCollabBody, /placeholder="Search friends"/);
  });
});
