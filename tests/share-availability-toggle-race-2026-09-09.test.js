// User report, 2026-09-09 (screenshot showed the amber "hasn't turned on
// sharing" warning for a friend who insisted her toggle was already on):
// publishBusyWindows() gates on lsGet("settings",{}).shareAvailability as
// its first line, by design -- so other call sites (Find Shared Study
// Window in ChatDrawer) can invoke it unconditionally without checking the
// setting themselves first. But the Settings toggle's own onClick handler
// used to call tog("shareAvailability") -- whose actual localStorage write
// happens inside a React state updater with no guaranteed ordering versus
// the very next line -- and then immediately call publishBusyWindows() in
// that same synchronous tick. Losing that race meant the toggle visually
// showed on while the read-back saw the stale off value, so the Firestore
// busyWindows doc never actually got created -- permanently, until the
// student happened to flip the toggle again or use Find Shared Study
// Window. The fix: write the new value straight to localStorage in the
// click handler itself, removing any dependency on tog()'s internal timing.
//
// Source-level regression guard (component-closure UI) -- same
// mixed-coverage convention this session uses elsewhere. Run with `npm test`.
//
// Updated 2026-09-10: publishBusyWindows/unpublishBusyWindows now return an
// honest {ok,reason} result instead of undefined (see
// tests/busy-windows-silent-failures-2026-09-10.test.js), and the toggle's
// onClick awaits that result to show a real error toast on failure. The
// race-fix and internal-gate assertions below still hold, just adjusted for
// the call now being wrapped in a ternary + .then() instead of a bare if/else.
const { test, describe } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");

const SOURCE = fs.readFileSync(path.join(__dirname, "..", "studlin-app.jsx"), "utf8");

describe("Share my free/busy time toggle publishes without a read-after-write race", () => {
  test("the toggle's onClick writes the new value to localStorage before tog()/publishBusyWindows() run", () => {
    const idx = SOURCE.indexOf('label="Share my free/busy time"');
    assert.notEqual(idx, -1);
    const body = SOURCE.slice(idx, idx + 3000);
    const lsSetIdx = body.indexOf('lsSet("settings"');
    const togIdx = body.indexOf('tog("shareAvailability")');
    const publishIdx = body.indexOf("publishBusyWindows()");
    assert.notEqual(lsSetIdx, -1, "must write the new value to localStorage directly in the click handler");
    assert.notEqual(togIdx, -1);
    assert.notEqual(publishIdx, -1);
    assert.ok(lsSetIdx < togIdx && togIdx < publishIdx, "localStorage write must happen before tog() and before publishBusyWindows(), in source order matching execution order");
    assert.match(body, /shareAvailability:next/, "must write the freshly-computed next value, not a stale read");
  });

  test("publishBusyWindows still keeps its own internal gate (defense in depth for its other, unconditional caller)", () => {
    const idx = SOURCE.indexOf("async function publishBusyWindows()");
    assert.notEqual(idx, -1);
    const body = SOURCE.slice(idx, idx + 300);
    assert.match(body, /if\(!lsGet\("settings",\{\}\)\.shareAvailability\)return\{ok:true,skipped:true\};/);
  });
});
