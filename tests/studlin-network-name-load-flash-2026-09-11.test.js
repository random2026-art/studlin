// User report, 2026-09-11: "when i go to studlin network sometimes it
// takes a second to load all the names".
//
// Root cause: FriendsChat's syncProfileListeners started ONE brand-new
// onSnapshot listener per friend, with no initial data -- the friend list
// rendered immediately with every uid falling back to profileToFriend's
// "Studlin User" placeholder, then names popped in one at a time as each
// individual listener's own first snapshot happened to resolve. Bounded
// by the SLOWEST listener, not a single round trip -- got visibly worse
// with more friends.
//
// Fix: batch-prime any newly-appearing uid's profile in one shot (a
// single Firestore 'in' query, chunked to the 30-value cap) before/
// alongside starting the real per-friend listeners, so the very first
// paint already has real names. The live per-friend listeners are
// untouched -- they still deliver real-time updates (e.g. a friend
// flipping Incognito on) exactly as before this fix.
//
// This is component-closure UI (FriendsChat), not an exported pure
// function -- source-level regression guard, same convention this file
// already uses elsewhere. Run with `npm test`.
const { test, describe } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");

const SOURCE = fs.readFileSync(path.join(__dirname, "..", "studlin-app.jsx"), "utf8");

describe("FriendsChat's syncProfileListeners batch-primes new friends' profiles instead of only individual listeners", () => {
  test("computes newIds -- uids that don't already have an active listener", () => {
    const idx = SOURCE.indexOf("const syncProfileListeners=()=>{");
    assert.ok(idx > -1);
    const body = SOURCE.slice(idx, idx + 2200);
    assert.ok(body.includes("const newIds=[...ids].filter(uid=>!profileUnsubs[uid]);"));
  });

  test("batches the initial read via a single 'in' query on documentId(), chunked to 30", () => {
    const idx = SOURCE.indexOf("const syncProfileListeners=()=>{");
    const body = SOURCE.slice(idx, idx + 2200);
    assert.ok(body.includes("i+=30"), "must chunk at Firestore's 'in' query cap");
    assert.ok(body.includes("firebase.firestore.FieldPath.documentId(),'in',chunk"));
  });

  test("never overwrites a profile the real listener already delivered while the batch read was in flight", () => {
    const idx = SOURCE.indexOf("const syncProfileListeners=()=>{");
    const body = SOURCE.slice(idx, idx + 2200);
    assert.ok(body.includes("if(profileDocs[d.id]===undefined){profileDocs[d.id]=d.data();changed=true;}"));
  });

  test("the real per-friend onSnapshot listeners are still started for every current friend, untouched by the batch fix", () => {
    const idx = SOURCE.indexOf("const syncProfileListeners=()=>{");
    const body = SOURCE.slice(idx, idx + 2600);
    assert.ok(body.includes("ids.forEach(uid=>{"));
    assert.ok(body.includes("profileUnsubs[uid]=fsdb().collection('profiles').doc(uid)"));
    assert.ok(body.includes(".onSnapshot(doc=>{profileDocs[uid]=doc.exists?doc.data():null;rebuildFriendsState();},()=>{});"));
  });

  test("only re-renders from the batch result when it actually contributed a profile no listener had already set", () => {
    const idx = SOURCE.indexOf("const syncProfileListeners=()=>{");
    const body = SOURCE.slice(idx, idx + 2200);
    assert.ok(body.includes("if(changed)rebuildFriendsState();"));
  });
});
