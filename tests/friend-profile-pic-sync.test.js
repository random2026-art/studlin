// Regression tests for the 2026-08-27 fix: a profile picture only ever
// lived in the uploading device's own localStorage ("profilePic"), never
// synced anywhere -- so no friend, on any device, could ever see it no
// matter which screen rendered them (every friend-facing <Av> in
// FriendsChat was hardcoded picUrl="" for exactly this reason). Run with
// `npm test`.
//
// The actual sync wiring (Profile's handlePicFile, FriendsChat's
// profileToFriend) lives inside component closures the vm harness can't
// invoke directly -- consistent with this repo's existing precedent (see
// intelligence-audit-batch1.test.js's own top comment) these are covered
// by source-level regression guards against the exact literals this fix
// changed, plus real, exported pure-function tests for the one piece of
// this fix that's genuine standalone logic: the avatar resize math.
const { test, describe } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");
const { loadStudlinModule } = require("./harness.js");

const SOURCE = fs.readFileSync(path.join(__dirname, "..", "studlin-app.jsx"), "utf8");

describe("computeAvatarScaledSize (pure scale-to-fit math backing resizeImageForAvatar)", () => {
  test("a source already smaller than AVATAR_MAX_DIM on both sides is never upscaled", () => {
    const { computeAvatarScaledSize, AVATAR_MAX_DIM } = loadStudlinModule();
    const { w, h } = computeAvatarScaledSize(50, 40);
    assert.equal(w, 50);
    assert.equal(h, 40);
    assert.ok(w <= AVATAR_MAX_DIM && h <= AVATAR_MAX_DIM);
  });

  test("a wide source is scaled down so its longest side exactly hits AVATAR_MAX_DIM, preserving aspect ratio", () => {
    const { computeAvatarScaledSize, AVATAR_MAX_DIM } = loadStudlinModule();
    const { w, h } = computeAvatarScaledSize(4000, 2000);
    assert.equal(w, AVATAR_MAX_DIM);
    assert.equal(h, Math.round(AVATAR_MAX_DIM / 2));
  });

  test("a tall source scales down by its height instead, same aspect-ratio preservation", () => {
    const { computeAvatarScaledSize, AVATAR_MAX_DIM } = loadStudlinModule();
    const { w, h } = computeAvatarScaledSize(1000, 4000);
    assert.equal(h, AVATAR_MAX_DIM);
    assert.equal(w, Math.round(AVATAR_MAX_DIM / 4));
  });

  test("a perfectly square oversized source scales both sides equally", () => {
    const { computeAvatarScaledSize, AVATAR_MAX_DIM } = loadStudlinModule();
    const { w, h } = computeAvatarScaledSize(3000, 3000);
    assert.equal(w, AVATAR_MAX_DIM);
    assert.equal(h, AVATAR_MAX_DIM);
  });

  test("never returns a zero or negative dimension even for a degenerate 1px-tall source", () => {
    const { computeAvatarScaledSize } = loadStudlinModule();
    const { w, h } = computeAvatarScaledSize(5000, 1);
    assert.ok(w >= 1 && h >= 1);
  });
});

describe("Profile picture sync to friends (source-level regression guards -- see this file's own top comment for why)", () => {
  test("handlePicFile resizes the upload before storing it, not the raw file", () => {
    assert.match(SOURCE, /const url=await resizeImageForAvatar\(file\);/,
      "handlePicFile must run the upload through resizeImageForAvatar -- storing a raw, unresized photo risks blowing Firestore's 1MB doc cap and makes every friend download it in full");
  });

  test("handlePicFile writes the resized picture onto the public profiles/{uid} doc, not just localStorage", () => {
    assert.match(SOURCE, /fsdb\(\)\.collection\('profiles'\)\.doc\(u\.uid\)\.set\(\{picUrl:url,updatedAt:new Date\(\)\.toISOString\(\)\},\{merge:true\}\)/,
      "without this write, a new picture still only ever lives on the uploading device -- the exact bug this fix targets");
  });

  test("profileToFriend (FriendsChat's single normalization point for every friend-list/search/DM row) carries the picture through as field p", () => {
    assert.match(SOURCE, /p:\(d&&d\.picUrl\)\|\|"",/,
      "profileToFriend feeds nearly every friend-facing row in FriendsChat (classmates, search results, DM inbox, chat header, group creation) -- if it drops picUrl, none of those surfaces can ever show a synced picture regardless of whether the upload/sync side works");
  });

  test("the incoming-friend-request builder forwards the picture field too, not just name/handle/school", () => {
    assert.match(SOURCE, /return \{id:d\.id,senderId:d\.senderId,n:f\.n,h:f\.h,s:f\.s,p:f\.p\};/,
      "this builder explicitly cherry-picks fields off the profileToFriend result rather than spreading it -- p must be listed by name or a request row silently never gets a picture even though profileToFriend itself has one");
  });

  test("at least one real friend-list render site actually reads the synced field (u.p), not just the data-layer plumbing", () => {
    const matches = SOURCE.match(/picUrl=\{u\.p\|\|""\}/g) || [];
    assert.ok(matches.length >= 4, "expected the picture field to be wired into multiple friend-row <Av> render sites (classmates, search results, DM inbox, group creation) -- found " + matches.length);
  });
});
