// Regression tests for the 2026-08-27 fix: CalendarTab's "Find Shared
// Study Window" panel already named which selected friends hadn't turned
// on "Share my free/busy time," but gave the student no way to actually
// do anything about it from there. This adds a real one-tap "ask them"
// action that pushes a notification to each non-sharing friend, deep-
// linking straight to the Privacy toggle itself.
//
// Both halves (the client-side button/handler in studlin-app.jsx, and the
// new sendShareAvailabilityRequest branch in api/notify.js) are covered by
// source-level regression guards rather than direct invocation: the
// client half lives inside CalendarTab's component closure (not an
// exported pure function, same established precedent as this session's
// other component-closure fixes); the server half requires the Firebase
// Admin SDK's db/admin objects, which nothing in this test suite mocks
// today (every existing api/*.js test -- ssrf-guard, canvas-token --
// deliberately covers only genuinely pure, dependency-free helpers, never
// a function requiring live Firestore Admin plumbing) -- building a novel
// Admin-SDK mock harness for this one function would be a disproportionate
// departure from that existing convention. `node --check api/notify.js`
// (run manually during development) confirmed the file is syntactically
// valid. Run with `npm test`.
const { test, describe } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");

const APP_SOURCE = fs.readFileSync(path.join(__dirname, "..", "studlin-app.jsx"), "utf8");
const NOTIFY_SOURCE = fs.readFileSync(path.join(__dirname, "..", "api", "notify.js"), "utf8");

describe("Client: \"Ask them to turn it on\" button (source-level regression guards)", () => {
  test("askFriendsToShareAvailability posts to /api/notify with type shareAvailabilityRequest for each non-sharing, not-yet-asked friend", () => {
    assert.match(APP_SOURCE, /const nonSharing=gsSelected\.filter\(uid=>!gsSharedUids\.has\(uid\)&&!shareAskSentUids\.has\(uid\)\);/);
    assert.match(APP_SOURCE, /body:JSON\.stringify\(\{type:"shareAvailabilityRequest",recipientUid:uid\}\)/);
  });

  test("the amber non-sharing warning renders a real button, not just static text naming who hasn't shared", () => {
    assert.match(APP_SOURCE, /onClick=\{askFriendsToShareAvailability\}/,
      "without a real action here, naming who hasn't shared told the student something they couldn't do anything about");
  });

  test("the button flips to an inert \"Asked\" state per-session once fired, so it can't be spammed by repeated clicks", () => {
    assert.match(APP_SOURCE, /\{stillToAsk\.length===0\?"Asked ✓":"Ask them to turn it on"\}/);
  });

  test("openGroupSchedule resets the per-session asked-tracking when a new group-scheduling session starts", () => {
    assert.match(APP_SOURCE, /setShareAskSentUids\(new Set\(\)\);/);
  });
});

describe("Client: notification deep-link lands on Settings > Privacy and highlights the toggle (source-level regression guards)", () => {
  test("App reads ?openSetting= from the URL on load, same one-shot idiom as the existing dm/group chat deep link", () => {
    assert.match(APP_SOURCE, /const setting=params\.get\("openSetting"\);/);
    assert.match(APP_SOURCE, /url\.searchParams\.delete\("openSetting"\);/);
  });

  test("the same deep link also works when a notification is clicked while a tab is already open (the postMessage path)", () => {
    assert.match(APP_SOURCE, /const dm=params\.get\("dm"\),group=params\.get\("group"\),setting=params\.get\("openSetting"\);/);
    assert.match(APP_SOURCE, /if\(setting\)\{setPendingOpenSetting\(setting\);setActive\("settings"\);return;\}/);
  });

  test("SettingsTab jumps straight to the Privacy sub-tab when the deep link names shareAvailability", () => {
    assert.match(APP_SOURCE, /const \[active,setActive\]=useState\(pendingOpenSetting==="shareAvailability"\?"Privacy":"General"\);/);
  });

  test("the Share my free/busy time Row actually receives the highlight prop tied to the deep-link flag", () => {
    assert.match(APP_SOURCE, /k="shareAvailability" highlight=\{highlightSetting==="shareAvailability"\}/);
  });
});

describe("Server: sendShareAvailabilityRequest (api/notify.js) (source-level regression guards -- see this file's own top comment for why)", () => {
  test("the router dispatches type:shareAvailabilityRequest to the new handler", () => {
    assert.match(NOTIFY_SOURCE, /if \(type === 'shareAvailabilityRequest'\) return sendShareAvailabilityRequest\(user, req, res\);/);
  });

  test("authorization checks BOTH friendship directions before sending anything -- otherwise a stranger could nudge (or notification-spam) any user", () => {
    assert.match(NOTIFY_SOURCE, /where\('senderId', '==', user\.uid\)\.where\('receiverId', '==', recipientUid\)\.where\('status', '==', 'accepted'\)/);
    assert.match(NOTIFY_SOURCE, /where\('senderId', '==', recipientUid\)\.where\('receiverId', '==', user\.uid\)\.where\('status', '==', 'accepted'\)/);
    assert.match(NOTIFY_SOURCE, /if \(asSender\.empty && asReceiver\.empty\) return res\.status\(403\)/);
  });

  test("still respects the recipient's own pushNotificationsEnabled preference, same gate sendPush already applies", () => {
    assert.match(NOTIFY_SOURCE, /if \(!recip\.preferences \|\| recip\.preferences\.pushNotificationsEnabled !== true\) return res\.status\(200\)\.json\(\{ ok: true, sent: 0 \}\);/);
  });

  test("the push deep-links straight to the Privacy toggle, not a generic page the recipient has to go hunt through", () => {
    assert.match(NOTIFY_SOURCE, /const deepLinkUrl = '\/app\?openSetting=shareAvailability';/);
  });

  test("a stale/invalid FCM token gets cleaned up, same as sendPush's own existing cleanup", () => {
    assert.match(NOTIFY_SOURCE, /fcmTokens: admin\.firestore\.FieldValue\.arrayRemove\(\.\.\.staleTokens\),\s*\}\)\.catch\(\(\) => \{\}\);\s*\}\s*\n\s*return res\.status\(200\)\.json\(\{ ok: true, sent \}\);\s*\} catch \(e\) \{\s*console\.error\('\[notify:shareAvailabilityRequest\]/);
  });
});
