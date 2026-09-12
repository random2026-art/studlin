// User report, 2026-09-11: "im not sure why its not working it saying my
// friends didnt turn it on when they did they showed me".
//
// Root cause: publishBusyWindows' own sharedWithUids field is a snapshot
// of the owner's accepted friends taken AT PUBLISH TIME (see its own
// comment in studlin-app.jsx and in firestore.rules' busyWindows match
// block) -- it's only ever recomputed when the "Share my free/busy time"
// toggle is flipped, or opportunistically inside the Studlin Match flow.
// Nothing re-published it when a NEW friendship formed, so a friend added
// after either side's last publish was invisible to "Schedule with
// Friends" -- firestore.rules correctly denies the read (they're not yet
// in that stale sharedWithUids array), and the client's own
// fetchFriendsBusyIntervals treats permission-denied as the expected
// "hasn't shared" case (see its own comment) -- indistinguishable from
// the friend genuinely never turning it on, even though they truly had.
//
// Fix: FriendsChat's friendship-list-changed listener (syncProfileListeners,
// which already fires on every app load via each onSnapshot's first
// delivery, and again whenever the friend list itself changes) now also
// calls publishBusyWindows() -- a no-op if sharing is off, otherwise a
// fresh republish with the CURRENT accepted-friends list. This closes the
// gap from whichever side's client next runs this listener, without
// requiring the other person to retoggle anything.
//
// This is component-closure UI (FriendsChat), not an exported pure
// function -- source-level regression guard, same convention this file
// already uses elsewhere. Run with `npm test`.
const { test, describe } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");

const SOURCE = fs.readFileSync(path.join(__dirname, "..", "studlin-app.jsx"), "utf8");

describe("FriendsChat republishes busyWindows whenever the friend list changes, fixing stale sharedWithUids", () => {
  test("syncProfileListeners calls publishBusyWindows() after rebuilding friend state", () => {
    const idx = SOURCE.indexOf("const syncProfileListeners=()=>{");
    assert.ok(idx > -1);
    const body = SOURCE.slice(idx, idx + 4000);
    const rebuildIdx = body.lastIndexOf("rebuildFriendsState();");
    assert.ok(rebuildIdx > -1);
    const afterRebuild = body.slice(rebuildIdx, rebuildIdx + 1300);
    assert.ok(afterRebuild.includes("publishBusyWindows();"), "must republish right after the friend list is rebuilt, so it runs on every friendship-list change including the very first snapshot on app load");
  });

  test("this runs on BOTH friendship listeners (sender and receiver direction) since both call syncProfileListeners", () => {
    const idx = SOURCE.indexOf("const unsub1=fsdb().collection('friendships').where('senderId','==',myUid).where('status','==','accepted')");
    assert.ok(idx > -1);
    const body = SOURCE.slice(idx, idx + 500);
    assert.match(body, /onSnapshot\(snap=>\{asSender=snap\.docs\.map\(d=>d\.data\(\)\.receiverId\);syncProfileListeners\(\);\}/);
    assert.match(body, /onSnapshot\(snap=>\{asReceiver=snap\.docs\.map\(d=>d\.data\(\)\.senderId\);syncProfileListeners\(\);\}/);
  });

  test("publishBusyWindows itself is a safe no-op when sharing is off, so this new call never spends a write for most users", () => {
    const idx = SOURCE.indexOf("async function publishBusyWindows(){");
    assert.ok(idx > -1);
    const body = SOURCE.slice(idx, idx + 300);
    assert.ok(body.includes('if(!lsGet("settings",{}).shareAvailability)return{ok:true,skipped:true};'));
  });
});
