// User report, 2026-09-30: "if its more than 1 person it needs to all
// overlap" -- fetchFriendsBusyIntervals already unions every selected
// friend's intervals into one shared byDate Map (confirmed by reading the
// function directly: a single `byDate` declared once, outside the
// otherUids.map loop, with every uid's segments pushed into the same
// per-date array via .push, never a fresh map per friend or a .set that
// would overwrite an earlier friend's entries for that date). No existing
// test guarded this specific property -- the other Schedule with Friends
// tests cover the timezone expansion and the stale-sharedWithUids guard
// separately, but nothing asserted the actual multi-friend union shape
// itself. Same source-pattern convention every other test in this feature
// area already uses (no local Firestore emulator to run this for real
// against -- see tests/firestore-rules.test.js's own ECONNREFUSED skip).
const { test, describe } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");
const SOURCE = fs.readFileSync(path.join(__dirname, "..", "studlin-app.jsx"), "utf8");

describe("fetchFriendsBusyIntervals unions every selected friend into one shared byDate map", () => {
  test("byDate is declared once, before the per-uid loop, not re-created per friend", () => {
    const idx = SOURCE.indexOf("async function fetchFriendsBusyIntervals(otherUids){");
    assert.notEqual(idx, -1);
    const body = SOURCE.slice(idx, idx + 700);
    // The Map must exist before Promise.all(otherUids.map(...)) starts, so
    // every uid's callback closes over the SAME map instance.
    const byDateIdx = body.indexOf("const byDate=new Map();");
    const loopIdx = body.indexOf("Promise.all(otherUids.map(");
    assert.notEqual(byDateIdx, -1);
    assert.notEqual(loopIdx, -1);
    assert.ok(byDateIdx < loopIdx, "byDate must be created before the per-friend loop starts, not inside it");
    // Only one `new Map()` for byDate in the whole function -- a second one
    // anywhere would mean a per-uid map sneaking back in.
    assert.equal((body.match(/byDate=new Map\(\)/g) || []).length, 1);
  });
  test("each friend's segments are pushed into the shared map, never replacing what's already there for that date", () => {
    const idx = SOURCE.indexOf("async function fetchFriendsBusyIntervals(otherUids){");
    const body = SOURCE.slice(idx, idx + 700);
    assert.match(body, /if\(!byDate\.has\(seg\.date\)\)byDate\.set\(seg\.date,\[\]\);/);
    assert.match(body, /byDate\.get\(seg\.date\)\.push\(\{s:seg\.s,e:seg\.e\}\);/);
  });
});
