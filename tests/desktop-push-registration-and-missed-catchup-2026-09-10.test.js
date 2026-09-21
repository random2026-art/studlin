// Regression tests for a live user report, 2026-09-10: "I enabled desktop
// notifications but didn't get one when my friend messaged me. I want it so
// that even if my laptop is closed, when I reopen it it shows me like 3
// missed notifications."
//
// Root cause of the first half: the FCM device-token registration effect
// (fires every time Studlin Network is opened with permission already
// granted) used to read the account's own users/{uid} doc first
// (`userRef.get()`) to dedup/cap the existing token list before writing.
// firestore.rules denies ALL client reads of users/{uid}, even by its own
// owner (that doc also holds credits/plan/billing/OAuth tokens -- see
// api/me.js's own comments) -- so that read was rejected every single time,
// silently swallowed by `.catch(()=>{})`, and the write that depended on its
// result never ran. This browser's token was never actually added to
// fcmTokens, so the server (api/notify.js sendPush) had nothing to deliver
// a background/desktop push to, no matter how many times permission was
// granted or Studlin Network reopened. The service worker side
// (service-worker.js's onBackgroundMessage) was already correct the whole
// time -- confirmed by reading it -- this was purely a registration gap.
//
// Fix: register via arrayUnion (no read needed -- Firestore only adds the
// token if it isn't already present, same idempotency the old read-then-
// diff dance was for). The cap-to-5 trim moved server-side into api/me.js's
// GET handler, which already has Admin SDK access and runs on every app
// boot via fetchUserProfile.
//
// Second half: the chatRooms onSnapshot listener used to silently seed a
// baseline for every already-unread room on its very first snapshot and
// return -- exactly the reopening-after-being-away case -- so nothing ever
// told the student anything was missed. Now the first snapshot collects
// which rooms are already unread and fires one batched catch-up
// Notification naming who they're from.
//
// Both are component-closure/module-level code (not exported pure
// functions), so covered by source-level regression guards, same
// established precedent as friend-request-notification-badge.test.js and
// share-availability-request.test.js. Run with `npm test`.
const { test, describe } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");

const APP_SOURCE = fs.readFileSync(path.join(__dirname, "..", "studlin-app.jsx"), "utf8");
const ME_SOURCE = fs.readFileSync(path.join(__dirname, "..", "api", "me.js"), "utf8");
const SW_SOURCE = fs.readFileSync(path.join(__dirname, "..", "service-worker.js"), "utf8");

describe("FCM token registration no longer depends on a blocked users/{uid} read (source-level regression guards)", () => {
  // 2026-09-20 follow-up: this write now lives inside the shared
  // registerPushToken() (module scope, near FCM_CONFIGURED) instead of
  // inline in the Network-tab effect -- pulled out so Settings' own
  // "Desktop notifications" toggle can call the same real registration
  // step, not just this one tab (see registerPushToken's own comment for
  // that follow-up bug). The arrayUnion-not-read-then-write property this
  // test guards is unchanged, just relocated.
  test("registerPushToken writes via arrayUnion, not a read-then-write against userRef.get()", () => {
    assert.match(APP_SOURCE, /async function registerPushToken\(myUid\)\{[\s\S]*?fsdb\(\)\.collection\('users'\)\.doc\(myUid\)\.set\(\{fcmTokens:firebase\.firestore\.FieldValue\.arrayUnion\(token\),updatedAt:new Date\(\)\.toISOString\(\)\},\{merge:true\}\);/,
      "arrayUnion needs no read at all -- Firestore adds the token only if it isn't already present");
  });

  test("the Network-tab effect and the Settings toggle both call the same shared registerPushToken, instead of duplicating (or only some of them having) the real registration step", () => {
    const matches = APP_SOURCE.match(/registerPushToken\(myUid\)/g) || [];
    assert.ok(matches.length >= 3, `expected registerPushToken(myUid) called from the Network-tab effect and both granted-permission branches of the Settings toggle, found ${matches.length} call sites`);
  });

  test("the old blocked read-before-write pattern is gone", () => {
    assert.doesNotMatch(APP_SOURCE, /const userRef=fsdb\(\)\.collection\('users'\)\.doc\(myUid\);\s*\n\s*userRef\.get\(\)\.then\(snap=>\{/,
      "users/{uid} is unreadable by any client per firestore.rules -- this exact read always failed silently and the token write depending on it never ran");
  });

  test("api/me.js's GET handler trims fcmTokens down to the 5 most recent, now that the client can't cap it itself", () => {
    assert.match(ME_SOURCE, /if \(Array\.isArray\(data\.fcmTokens\) && data\.fcmTokens\.length > 5\) \{\s*\n\s*await ref\.set\(\{ fcmTokens: data\.fcmTokens\.slice\(-5\) \}, \{ merge: true \}\);/);
  });

  test("service-worker.js already correctly shows a native notification for a background FCM push (confirms the registration gap was the whole bug, not the delivery side)", () => {
    assert.match(SW_SOURCE, /messaging\.onBackgroundMessage\(\(payload\) => \{/);
    assert.match(SW_SOURCE, /self\.registration\.showNotification\(title, \{/);
  });
});

describe("Reopening Studlin after being away surfaces missed messages (source-level regression guards)", () => {
  test("the chatRooms listener tracks its own first-snapshot state, freshly per subscription", () => {
    assert.match(APP_SOURCE, /let isFirstSnapshot=true;\s*\n\s*const unsub=fsdb\(\)\.collection\('chatRooms'\)\.where\('memberUids','array-contains',myUid\)/);
  });

  test("on the first snapshot, already-unread rooms are collected into missedFrom instead of being silently seeded and ignored", () => {
    assert.match(APP_SOURCE, /if\(isFirstSnapshot\)\{\s*\n\s*lastMsgRef\.current\[d\.id\]=last\.ts;\s*\n\s*if\(isRoomUnread\(room,myUid\)\)\{\s*\n\s*missedFrom\.push\(room\.type==="group"\?\(room\.name\|\|"a group chat"\):\(\(room\.memberNames&&room\.memberNames\[last\.senderId\]\)\|\|"Someone"\)\);/);
  });

  test("a batched catch-up Notification fires once, naming who the missed messages are from, gated on the same sysPush+permission check live messages already use", () => {
    assert.match(APP_SOURCE, /if\(missedFrom\.length&&!timerTaskRef\.current&&typeof Notification!=="undefined"&&Notification\.permission==="granted"&&lsGet\("settings",\{\}\)\.sysPush===true\)\{/);
    assert.match(APP_SOURCE, /new Notification\("Studlin",\{body:\(missedFrom\.length===1\?"You missed a message from ":`\$\{missedFrom\.length\} unread chats from `\)\+shown\}\);/);
  });

  test("the missed-chats copy never uses an em dash (permanent house rule for user-facing text)", () => {
    const marker = 'new Notification("Studlin",{body:(missedFrom.length===1';
    const start = APP_SOURCE.indexOf(marker);
    assert.notEqual(start, -1, "expected to find the catch-up Notification call");
    const snippet = APP_SOURCE.slice(start, start + 200);
    assert.doesNotMatch(snippet, /—/);
  });

  test("live per-message routing (chimes/Rule 1-4) is untouched for snapshots after the first -- only gated by isFirstSnapshot, not folded into the missed-catchup branch", () => {
    assert.match(APP_SOURCE, /if\(prevTs!==undefined&&last\.ts<=prevTs\)return;/);
    assert.match(APP_SOURCE, /if\(timerTaskRef\.current\)return; \/\/ Rule 4: lock-in overrules everything/);
  });
});
