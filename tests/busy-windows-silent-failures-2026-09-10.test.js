// User report, 2026-09-10 ("still not working") after multiple already-
// live-verified fixes to this exact sharing chain (the toggle race, the
// chat-based ask, the Refresh action, the 60-day range). Deeper investigation
// found no remaining data-integrity issue (no duplicate friend profiles,
// friendship records correct both directions, the publish path verified
// live against production Firestore) -- but found that EVERY step in this
// chain silently swallowed its own errors with a bare `catch(e){}`. A
// genuinely real failure (offline, a security-rule mismatch, bad data)
// was therefore indistinguishable from "working as designed, friend just
// hasn't shared yet" -- to the student, and to any future debugging
// session. publishBusyWindows/unpublishBusyWindows now return an honest
// {ok, reason} result instead of swallowing to undefined; the Settings
// toggle awaits it and shows a real error toast on failure instead of
// silence. fetchFriendsBusyIntervals still treats permission-denied as
// the expected case (a friend genuinely hasn't shared -- extremely
// common, not a bug) but reports anything else.
//
// publishBusyWindows/unpublishBusyWindows/fetchFriendsBusyIntervals are
// real async functions but need a live Firestore/auth context this test
// suite doesn't mock (same documented convention as
// tests/share-availability-request.test.js) -- source-level regression
// guards instead. Run with `npm test`.
const { test, describe } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");

const SOURCE = fs.readFileSync(path.join(__dirname, "..", "studlin-app.jsx"), "utf8");

describe("publishBusyWindows/unpublishBusyWindows report real failures instead of swallowing them", () => {
  test("publishBusyWindows returns {ok:true} on success and {ok:false,reason} on a caught error, not undefined", () => {
    const idx = SOURCE.indexOf("async function publishBusyWindows(){");
    assert.notEqual(idx, -1);
    const body = SOURCE.slice(idx, idx + 900);
    assert.match(body, /return\{ok:true\};/);
    assert.match(body, /catch\(e\)\{\s*\n\s*reportError\("publishBusyWindows"\)\(e\);\s*\n\s*return\{ok:false,reason:/);
  });

  test("unpublishBusyWindows follows the identical honest-result shape", () => {
    const idx = SOURCE.indexOf("async function unpublishBusyWindows(){");
    assert.notEqual(idx, -1);
    const body = SOURCE.slice(idx, idx + 500);
    assert.match(body, /return\{ok:true\};/);
    assert.match(body, /reportError\("unpublishBusyWindows"\)\(e\);/);
  });

  test("the Settings toggle awaits the result and shows a real error toast on failure, not silence", () => {
    const idx = SOURCE.indexOf('label="Share my free/busy time"');
    assert.notEqual(idx, -1);
    const body = SOURCE.slice(idx, idx + 3000);
    assert.match(body, /\(next\?publishBusyWindows\(\):unpublishBusyWindows\(\)\)\.then\(result=>\{/);
    assert.match(body, /if\(result&&result\.ok===false\)showToast\(/, "a real failure must actually surface to the student, not just to Sentry");
  });
});

describe("fetchFriendsBusyIntervals distinguishes 'friend hasn't shared' from a real unexpected failure", () => {
  test("permission-denied (the expected, extremely common case) is not reported as an error", () => {
    const idx = SOURCE.indexOf("async function fetchFriendsBusyIntervals(otherUids){");
    assert.notEqual(idx, -1);
    const body = SOURCE.slice(idx, idx + 1400);
    assert.match(body, /if\(!e\|\|e\.code!=="permission-denied"\)reportError\("fetchFriendsBusyIntervals"\)\(e\);/);
  });
});
