// Incognito Mode's own copy promises: "Completely masks your live study
// status. You'll appear offline everywhere and won't receive Join Lock-In
// requests." Found broken in an audit pass (2026-09-03) -- there was no
// data channel at all for a friend to ever learn you're incognito:
// isIncognitoOn() only ever read local settings, upsertProfile never
// synced it, and presenceInfo's one real call site (FriendsChat) never
// even passed the incognito param it already accepted, so its own
// suppression branch was dead code.
//
// This fix has three parts: (1) upsertProfile now writes incognito to the
// shared profiles doc, and SettingsTab's toggle handler calls it
// immediately instead of waiting for a sparse natural trigger; (2)
// profileToFriend reads it back, and the presenceInfo call site actually
// passes it; (3) the separate "Join Lock-In" live-invite listener now
// checks the session starter's own incognito status before surfacing the
// popup, closing the "won't receive Join Lock-In requests" half of the
// promise too. presenceInfo is the one pure, easily-testable piece --
// the profile-sync and live-invite-listener halves touch real Firestore
// calls and aren't unit-tested here, consistent with this codebase's
// existing precedent for async Firebase-touching functions.
const { test, describe } = require("node:test");
const assert = require("node:assert/strict");
const { loadStudlinModule } = require("./harness.js");

describe("presenceInfo (Incognito Mode masking)", () => {
  test("a friend with a live session and incognito:true is masked to Offline, not the Locking In reveal", () => {
    const m = loadStudlinModule();
    const liveSession = { id: "sess-1", subject: "Chemistry", title: "Chem study" };
    const info = m.presenceInfo({ presence: { state: "idle" }, online: true }, { incognito: true, liveSession });
    assert.equal(info.text, "Offline");
    assert.equal(info.joinable, false);
  });

  test("a friend with a live session and incognito:false (or omitted) shows the real Locking In reveal, joinable", () => {
    const m = loadStudlinModule();
    const liveSession = { id: "sess-1", subject: "Chemistry", title: "Chem study" };
    const info = m.presenceInfo({}, { incognito: false, liveSession });
    assert.equal(info.text, "Locking In: Chemistry — tap to join");
    assert.equal(info.joinable, true);
    assert.equal(info.sessionId, "sess-1");
  });

  test("incognito:true with no live session still resolves to Offline, not whatever u.presence/u.online would otherwise say", () => {
    const m = loadStudlinModule();
    const info = m.presenceInfo({ presence: { state: "idle" }, online: true }, { incognito: true, liveSession: null });
    assert.equal(info.text, "Offline");
  });

  test("omitting the options object entirely (incognito defaults false) still works and falls back to the non-incognito presence read", () => {
    const m = loadStudlinModule();
    assert.doesNotThrow(() => m.presenceInfo({ presence: { state: "idle" } }));
    const info = m.presenceInfo({ presence: { state: "idle" } });
    assert.equal(info.text, "Idle");
  });

  test("falls back to u.online-derived state when u.presence is missing, for a non-incognito, no-live-session friend", () => {
    const m = loadStudlinModule();
    const onlineNoPresence = m.presenceInfo({ online: true }, {});
    assert.equal(onlineNoPresence.text, "Idle");
    const offlineNoPresence = m.presenceInfo({ online: false }, {});
    assert.equal(offlineNoPresence.text, "Offline");
  });

  test("liveSession falls back to .title when .subject is missing", () => {
    const m = loadStudlinModule();
    const info = m.presenceInfo({}, { incognito: false, liveSession: { id: "s2", title: "Group study" } });
    assert.equal(info.text, "Locking In: Group study — tap to join");
  });

  // Bug fix, 2026-09-04 user follow-up: profileToFriend used to hand this
  // function a hardcoded presence:{state:"idle"} for every friend, real
  // data or not -- "Idle" showed for literally everyone not in a live
  // session. profileToFriend now omits presence/online entirely when
  // there's no real signal; presenceInfo reads that absence as "unknown"
  // and shows nothing, per the user's explicit choice over showing a
  // made-up status.
  test("no presence and no online boolean at all resolves to 'unknown' -- no fabricated status text", () => {
    const m = loadStudlinModule();
    const info = m.presenceInfo({}, {});
    assert.equal(info.text, null);
    assert.equal(info.joinable, false);
  });

  test("an explicit boolean u.online (true or false) still resolves to the real idle/offline branches, not 'unknown'", () => {
    const m = loadStudlinModule();
    assert.equal(m.presenceInfo({ online: true }, {}).text, "Idle");
    assert.equal(m.presenceInfo({ online: false }, {}).text, "Offline");
  });
});
