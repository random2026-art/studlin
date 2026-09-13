// Full-audit bug, 2026-09-12 user report ("it says my friend didn't turn on
// sharing, but they did"): the 2026-09-11 fix for this exact symptom
// republishes busyWindows/{uid} (refreshing sharedWithUids to the current
// friend list) inside FriendsChat's syncProfileListeners, which only runs
// while FriendsChat is mounted -- and FriendsChat only mounts when the
// student opens the Friends/Network tab (active==="friends"). Its own
// comment claimed this "always" fires "on every app load," which is false:
// a friendship formed while neither side happens to visit that specific tab
// (entirely normal, since Schedule with Friends is launched from Calendar)
// never gets the republish, so a friend who genuinely turned sharing on
// keeps reading as "hasn't shared" indefinitely.
//
// Fix: also call publishBusyWindows() from AuthGate's onAuthStateChanged,
// the actual "every real app load" bootstrap point, chained after
// fetchUserProfile() so it reads the just cross-device-reconciled
// shareAvailability value.
//
// Source-level regression guard (component-closure UI), same convention as
// the other Schedule with Friends / busyWindows test files. Run with `npm test`.
const { test, describe } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");

const SOURCE = fs.readFileSync(path.join(__dirname, "..", "studlin-app.jsx"), "utf8");

describe("busyWindows republishes on real app boot, not just when the Friends tab happens to be open", () => {
  test("AuthGate's onAuthStateChanged calls publishBusyWindows() once the profile reconcile resolves", () => {
    const idx = SOURCE.indexOf("const profilePromise=fetchUserProfile();upsertProfile();");
    assert.notEqual(idx, -1, "the onAuthStateChanged profile-fetch line should still exist under this name");
    const body = SOURCE.slice(idx, idx + 1400);
    assert.match(body, /profilePromise\.then\(\(\)=>publishBusyWindows\(\)\)/, "must republish busyWindows after the cross-device shareAvailability reconcile, independent of which tab is open");
  });

  test("FriendsChat's own friendship-change republish is untouched -- this adds a second trigger, it doesn't replace the live one", () => {
    const idx = SOURCE.indexOf("const syncProfileListeners=()=>{");
    const endIdx = SOURCE.indexOf("const unsub1=fsdb().collection('friendships')", idx);
    assert.notEqual(idx, -1);
    assert.notEqual(endIdx, -1);
    const body = SOURCE.slice(idx, endIdx);
    assert.match(body, /publishBusyWindows\(\);/, "the friendship-listener republish (for a friendship formed while already on the Friends tab) must still be there");
  });
});
