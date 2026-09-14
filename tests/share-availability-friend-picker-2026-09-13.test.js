// User request, 2026-09-13: "maybe a user doesn't want to turn on for
// everyone to see their calendar they could instead choose the people they
// want" + follow-up: "the list of names and a check by each of them you
// could check and uncheck", "you can see out of the groupmates who didn't
// share their share time yet and you could send them notification next to
// their name."
//
// Two independent pieces:
// 1. Settings: "Share my free/busy time" used to be all-or-nothing (on =
//    every accepted friend). shareAvailabilityMode ("everyone"|"selected")
//    + shareAvailabilitySelectedUids let a student restrict it to specific
//    friends via a checkbox-list picker modal, and publishBusyWindows'
//    sharedWithUids now intersects the real accepted-friends list with
//    that selection when mode is "selected".
// 2. Schedule with Friends group picker (gsCandidates/gsSelected): used to
//    only reveal who hasn't shared in a combined banner AFTER confirming
//    the group (the "place" step). openGroupSchedule now fetches sharing
//    status for every candidate up front, and each row in the picker's
//    checkbox list shows its own "Hasn't shared" tag + a per-person
//    Notify button (askFriendsToShareAvailability generalized to accept
//    an explicit uid list instead of always using gsSelected).
//
// Component-closure UI -- source-level regression guard, same convention
// as the other Schedule with Friends / busyWindows test files in this
// suite. Run with `npm test`.
const { test, describe } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");

const SOURCE = fs.readFileSync(path.join(__dirname, "..", "studlin-app.jsx"), "utf8");

describe("Settings: per-friend sharing picker", () => {
  test("publishBusyWindows intersects the real accepted-friends list with the selection when mode is 'selected'", () => {
    const idx = SOURCE.indexOf("async function publishBusyWindows(){");
    assert.ok(idx > -1);
    const body = SOURCE.slice(idx, idx + 1800);
    assert.match(body, /settings\.shareAvailabilityMode==="selected"/);
    assert.match(body, /acceptedUids\.filter\(uid=>\(settings\.shareAvailabilitySelectedUids\|\|\[\]\)\.includes\(uid\)\)/, "must never trust a selected uid that isn't a real current accepted friend");
  });

  test("defaults to sharing with every accepted friend when mode isn't 'selected'", () => {
    const idx = SOURCE.indexOf("async function publishBusyWindows(){");
    const body = SOURCE.slice(idx, idx + 1800);
    assert.match(body, /:acceptedUids;/);
  });

  test("the picker modal renders a checkbox per friend, toggled via toggleShareSelectedUid", () => {
    const idx = SOURCE.indexOf('title="Choose who can see your free/busy time"');
    assert.ok(idx > -1, "the sharing picker Modal should still exist under this title");
    const body = SOURCE.slice(idx, idx + 2000);
    assert.match(body, /<input type="checkbox" checked=\{checked\} onChange=\{\(\)=>toggleShareSelectedUid\(c\.uid\)\}/);
  });

  test("Everyone/Choose people mode switch exists and only shows the picker's Manage button in 'selected' mode", () => {
    const idx = SOURCE.indexOf('label:"Choose people"');
    assert.ok(idx > -1);
    const body = SOURCE.slice(idx, idx + 1500);
    assert.match(body, /toggles\.shareAvailabilityMode==="selected"&&\(/);
    assert.match(body, /onClick=\{openShareModePicker\}/);
  });
});

describe("Schedule with Friends group picker: per-row sharing status + notify", () => {
  test("openGroupSchedule fetches sharing status for every candidate up front, not just the confirmed group", () => {
    const idx = SOURCE.indexOf("const openGroupSchedule=async()=>{");
    assert.ok(idx > -1);
    const body = SOURCE.slice(idx, idx + 2200);
    assert.match(body, /fetchFriendsBusyIntervals\(uids\)\.then\(\(\{sharedUids\}\)=>\{setGsSharedUids\(sharedUids\);setGsSharedUidsLoaded\(true\);\}\)/);
  });

  test("askFriendsToShareAvailability accepts an explicit uid list instead of always using gsSelected", () => {
    const idx = SOURCE.indexOf("const askFriendsToShareAvailability=async(uids)=>{");
    assert.ok(idx > -1, "must accept a uids param so a single non-selected candidate can be notified individually");
    const body = SOURCE.slice(idx, idx + 300);
    assert.match(body, /const candidateUids=uids\|\|gsSelected;/);
  });

  test("each picker row shows a 'Hasn't shared' tag and a per-person Notify button, gated on the upfront fetch resolving", () => {
    const idx = SOURCE.indexOf('<div style={{fontSize:13,fontWeight:600,color:T.text,flex:1}}>{c.name}</div>');
    assert.ok(idx > -1, "the picker's per-candidate row should still render the name in this shape");
    const body = SOURCE.slice(idx, idx + 1600);
    assert.match(body, /gsSharedUidsLoaded&&!gsSharedUids\.has\(c\.uid\)&&\(/, "must not flash 'hasn't shared' before the upfront fetch resolves");
    assert.match(body, /onClick=\{\(\)=>askFriendsToShareAvailability\(\[c\.uid\]\)\}/);
  });
});
