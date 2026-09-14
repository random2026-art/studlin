// User report, 2026-09-13: "Schedule with Friends sometimes works sometimes
// doesn't."
//
// Root cause: events/routines are local-only per device (no server sync of
// the source data itself -- see architecture_subjects_routines_events_local_only).
// busyWindows/{uid} is a single last-write-wins Firestore doc, republished
// from several call sites (the friend-list listener, app-boot profile
// reconcile, the [events,routines] debounce effect, etc.) with no way to
// tell whether the device firing the publish actually has the freshest
// local data. A device that hasn't been opened in weeks could still fire a
// publish on load with its stale cached events, silently overwriting a
// fresher publish from a device that HAS been kept current -- which copy
// of the truth was live depended on which device last happened to publish,
// not which one actually had the newest data.
//
// Fix: stamp scheduleDataUpdatedAt in localStorage whenever events/routines
// actually change (never on mere mount), include it in the published doc
// as sourceUpdatedAt, and have publishBusyWindows skip its own write if the
// doc already in Firestore has a newer sourceUpdatedAt than this device's
// local stamp.
//
// publishBusyWindows/the debounce effect touch fsdb() and React state
// directly, so -- same convention as the other busyWindows regression
// tests in this suite -- this is a source-level guard, not a full runtime
// execution test. Run with `npm test`.
const { test, describe } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");

const SOURCE = fs.readFileSync(path.join(__dirname, "..", "studlin-app.jsx"), "utf8");

describe("publishBusyWindows refuses to overwrite fresher data with a stale device's local snapshot", () => {
  test("reads its own local scheduleDataUpdatedAt stamp before publishing", () => {
    const idx = SOURCE.indexOf("async function publishBusyWindows(){");
    assert.ok(idx > -1, "publishBusyWindows should still exist under this name");
    const body = SOURCE.slice(idx, idx + 900);
    assert.match(body, /const sourceUpdatedAt=lsGet\("scheduleDataUpdatedAt",0\);/);
  });

  test("skips the write when the existing doc's sourceUpdatedAt is newer than this device's own", () => {
    const idx = SOURCE.indexOf("async function publishBusyWindows(){");
    const body = SOURCE.slice(idx, idx + 900);
    assert.match(body, /existing\.exists&&\(existing\.data\(\)\.sourceUpdatedAt\|\|0\)>sourceUpdatedAt/, "must compare against the doc already in Firestore, not just always overwrite");
    assert.match(body, /return\{ok:true,skipped:true,reason:"stale_local_data"\};/);
  });

  test("writes sourceUpdatedAt into the published doc so the NEXT device can compare against it", () => {
    const idx = SOURCE.indexOf("async function publishBusyWindows(){");
    const body = SOURCE.slice(idx, idx + 1800);
    assert.match(body, /\.set\(\{ownerUid:myUid,sharedWithUids,intervals,sourceUpdatedAt,updatedAt:new Date\(\)\.toISOString\(\)\}\)/);
  });
});

describe("scheduleDataUpdatedAt is stamped only on a real events/routines change, never on mere mount", () => {
  test("the [events,routines] debounce effect skips stamping on its first (mount) run", () => {
    const idx = SOURCE.indexOf("const busyWindowsRepublishTimer=useRef(null);");
    assert.ok(idx > -1, "the busyWindows republish debounce effect should still exist under this name");
    const body = SOURCE.slice(idx, idx + 1400);
    assert.match(body, /const busyWindowsFirstRunRef=useRef\(true\);/);
    assert.match(body, /if\(busyWindowsFirstRunRef\.current\)busyWindowsFirstRunRef\.current=false;\s*\r?\n\s*else lsSet\("scheduleDataUpdatedAt",Date\.now\(\)\);/, "must not stamp \"now\" on the very first (mount) invocation -- only on a real subsequent change, otherwise a stale device would look fresh just by opening the app");
  });

  test("still debounces and calls publishBusyWindows() exactly as before", () => {
    const idx = SOURCE.indexOf("const busyWindowsRepublishTimer=useRef(null);");
    const body = SOURCE.slice(idx, idx + 1400);
    assert.match(body, /setTimeout\(\(\)=>\{publishBusyWindows\(\);\},1500\)/);
    assert.match(body, /\},\[events,routines\]\);/);
  });
});
