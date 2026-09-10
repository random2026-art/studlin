// User report, 2026-09-10 ("landon did turn the show free time... but it
// didnt communicate back to my laptop"): gsSharedUids/gsBusyByDate were
// only ever fetched once, inside confirmGsPeople, at the moment the
// Schedule with Friends panel opens. If a friend turns "Share my free/busy
// time" on AFTER that -- the exact sequence "Ask them to turn it on" is
// meant to produce -- nothing on the already-open panel would ever reflect
// it; the amber "hasn't shared" banner would keep showing forever until the
// whole flow was closed and the same friends re-picked from scratch. Added
// a Refresh action that re-runs the identical fetch + recommendation search
// confirmGsPeople does, without losing gsDraft (anything already placed on
// the calendar).
//
// Source-level regression guards (component-closure UI) -- same
// mixed-coverage convention this session uses elsewhere. Run with `npm test`.
const { test, describe } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");

const SOURCE = fs.readFileSync(path.join(__dirname, "..", "studlin-app.jsx"), "utf8");

describe("Schedule with Friends: a Refresh action re-checks sharing without reopening the whole flow", () => {
  test("refreshGsSharing exists and re-fetches gsBusyByDate/gsSharedUids via fetchFriendsBusyIntervals", () => {
    const idx = SOURCE.indexOf("const refreshGsSharing=async()=>{");
    assert.notEqual(idx, -1);
    const body = SOURCE.slice(idx, idx + 900);
    assert.match(body, /fetchFriendsBusyIntervals\(gsSelected\)/);
    assert.match(body, /setGsBusyByDate\(busyObj\)/);
    assert.match(body, /setGsSharedUids\(sharedUids\)/);
    assert.doesNotMatch(body, /setGsDraft/, "refreshing must never touch a block the student already placed on the calendar");
  });

  test("it also re-runs the recommendation search, so a newly-shared friend can produce a better suggested window", () => {
    const idx = SOURCE.indexOf("const refreshGsSharing=async()=>{");
    const body = SOURCE.slice(idx, idx + 900);
    assert.match(body, /findSharedStudyWindow\(myUid,gsSelected,\{timeMode:"anytime",lookAheadDayRange:60,durationInMinutes:60\}\)/);
  });

  test("the amber non-sharing banner renders a Refresh button alongside Ask them to turn it on", () => {
    const idx = SOURCE.indexOf('{stillToAsk.length===0?"Asked ✓":"Ask them to turn it on"}');
    assert.notEqual(idx, -1);
    const body = SOURCE.slice(idx, idx + 900);
    assert.match(body, /onClick=\{refreshGsSharing\}/);
    assert.match(body, /gsRefreshing\?"Checking…":"Refresh"/);
  });

  test("the Refresh button disables itself while a check is already in flight, so it can't be double-fired", () => {
    const idx = SOURCE.indexOf("const refreshGsSharing=async()=>{");
    const body = SOURCE.slice(idx, idx + 200);
    assert.match(body, /if\(gsRefreshing\|\|gsSelected\.length===0\)return;/);
  });
});
