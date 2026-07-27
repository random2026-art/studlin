// Unit tests for the pure diff/merge logic that drives the events ->
// Firestore migration (step 1, see the "DataStore: events Firestore
// sync" comment in studlin-app.jsx). Requires no emulator, no Firebase --
// datastore-events-sync.js is deliberately dependency-free so these tests
// exercise the exact code the browser runs, not a re-implementation.
// Run with `npm test`.
const { test, describe } = require("node:test");
const assert = require("node:assert/strict");
const S = require("../datastore-events-sync.js");

describe("isSyncableId", () => {
  test("plain app-generated ids are syncable", () => {
    assert.equal(S.isSyncableId("1690489200123-0"), true);
  });
  test("gcal-* ids are excluded (re-derived wholesale on every calendar sync pass)", () => {
    assert.equal(S.isSyncableId("gcal-abc123"), false);
  });
  test("non-string / empty ids are not syncable", () => {
    assert.equal(S.isSyncableId(undefined), false);
    assert.equal(S.isSyncableId(""), false);
    assert.equal(S.isSyncableId(123), false);
  });
});

describe("computePushDiff", () => {
  test("a brand-new event with no prior sync state is an upsert", () => {
    const ev = { id: "a1", title: "Problem Set", date: "2026-07-28" };
    const { upserts, deletedIds } = S.computePushDiff({}, [ev]);
    assert.deepEqual(upserts, [ev]);
    assert.deepEqual(deletedIds, []);
  });

  test("an unchanged event (same signature already synced) produces no upsert", () => {
    const ev = { id: "a1", title: "Problem Set", date: "2026-07-28" };
    const prevSigs = { a1: S.sigOf(ev) };
    const { upserts, deletedIds } = S.computePushDiff(prevSigs, [ev]);
    assert.deepEqual(upserts, []);
    assert.deepEqual(deletedIds, []);
  });

  test("editing a field changes the signature and re-upserts", () => {
    const before = { id: "a1", title: "Problem Set", date: "2026-07-28" };
    const after = { id: "a1", title: "Problem Set (extended)", date: "2026-07-28" };
    const prevSigs = { a1: S.sigOf(before) };
    const { upserts } = S.computePushDiff(prevSigs, [after]);
    assert.deepEqual(upserts, [after]);
  });

  test("an id present in prior sync state but absent locally is a soft-delete candidate", () => {
    const prevSigs = { a1: "somesig" };
    const { upserts, deletedIds } = S.computePushDiff(prevSigs, []);
    assert.deepEqual(upserts, []);
    assert.deepEqual(deletedIds, ["a1"]);
  });

  test("gcal-* events never appear as upserts or deletes even across changes", () => {
    const prevSigs = {};
    const { upserts, deletedIds } = S.computePushDiff(prevSigs, [{ id: "gcal-xyz", title: "Imported" }]);
    assert.deepEqual(upserts, []);
    assert.deepEqual(deletedIds, []);
  });

  test("mixed batch: one new, one unchanged, one edited, one deleted", () => {
    const unchanged = { id: "u1", title: "Stays the same" };
    const editedBefore = { id: "e1", title: "Before edit" };
    const editedAfter = { id: "e1", title: "After edit" };
    const prevSigs = { u1: S.sigOf(unchanged), e1: S.sigOf(editedBefore), d1: "gone-now" };
    const current = [unchanged, editedAfter, { id: "n1", title: "Brand new" }];
    const { upserts, deletedIds } = S.computePushDiff(prevSigs, current);
    assert.deepEqual(upserts.map((e) => e.id).sort(), ["e1", "n1"]);
    assert.deepEqual(deletedIds, ["d1"]);
  });
});

describe("mergeRemoteIntoLocal", () => {
  test("remote-only items (created on another device) are adopted", () => {
    const local = [{ id: "a1", title: "Local one" }];
    const remote = [{ id: "b1", title: "From another device" }];
    const { merged, adoptedFromRemote } = S.mergeRemoteIntoLocal(local, remote, [], {}, {});
    assert.deepEqual(merged.map((e) => e.id).sort(), ["a1", "b1"]);
    assert.deepEqual([...adoptedFromRemote], ["b1"]);
  });

  test("empty remote leaves local untouched", () => {
    const local = [{ id: "a1", title: "Only local" }];
    const { merged } = S.mergeRemoteIntoLocal(local, [], [], {}, {});
    assert.deepEqual(merged, local);
  });

  test("no local timestamp on record -- defers to remote, since there's no evidence local is newer", () => {
    // "Newest wins" can't justify favoring local when there's zero signal
    // for when local last changed -- remote at least has a real timestamp.
    // In practice this only comes up for a genuine cross-device id
    // collision with no local edit history at all, which essentially
    // can't happen through normal use (ids are per-device timestamps).
    const local = [{ id: "a1", title: "Local, never tracked by this device" }];
    const remote = [{ id: "a1", title: "Remote copy" }];
    const { merged, adoptedFromRemote } = S.mergeRemoteIntoLocal(local, remote, [], {}, { a1: 1000 });
    assert.equal(merged[0].title, "Remote copy");
    assert.equal(adoptedFromRemote.has("a1"), true);
  });

  test("exact tie favors local", () => {
    const local = [{ id: "a1", title: "Local" }];
    const remote = [{ id: "a1", title: "Remote" }];
    const { merged } = S.mergeRemoteIntoLocal(local, remote, [], { a1: 5000 }, { a1: 5000 });
    assert.equal(merged[0].title, "Local");
  });

  test("remote strictly newer wins -- a stale local device does not clobber a newer remote edit", () => {
    const local = [{ id: "a1", title: "Stale local copy" }];
    const remote = [{ id: "a1", title: "Newer remote edit" }];
    const { merged, adoptedFromRemote } = S.mergeRemoteIntoLocal(local, remote, [], { a1: 1000 }, { a1: 9000 });
    assert.equal(merged[0].title, "Newer remote edit");
    assert.equal(adoptedFromRemote.has("a1"), true);
  });

  test("local strictly newer wins -- a real local edit is not discarded", () => {
    const local = [{ id: "a1", title: "Newer local edit" }];
    const remote = [{ id: "a1", title: "Older remote copy" }];
    const { merged, adoptedFromRemote } = S.mergeRemoteIntoLocal(local, remote, [], { a1: 9000 }, { a1: 1000 });
    assert.equal(merged[0].title, "Newer local edit");
    assert.equal(adoptedFromRemote.has("a1"), false);
  });

  test("a remote-side delete propagates and removes a still-present local item with no newer local edit", () => {
    const local = [{ id: "a1", title: "Deleted on another device" }];
    const { merged } = S.mergeRemoteIntoLocal(local, [], ["a1"], { a1: 1000 }, { a1: 9000 });
    assert.equal(merged.length, 0);
  });

  test("a remote-side delete does NOT propagate when local has a newer edit -- local un-deletes it", () => {
    const local = [{ id: "a1", title: "Edited locally after the remote delete" }];
    const { merged } = S.mergeRemoteIntoLocal(local, [], ["a1"], { a1: 9000 }, { a1: 1000 });
    assert.equal(merged.length, 1);
    assert.equal(merged[0].title, "Edited locally after the remote delete");
  });

  test("a remote-side delete with no local timestamp on record propagates (legacy default defers to remote)", () => {
    const local = [{ id: "a1", title: "Never tracked locally" }];
    const { merged } = S.mergeRemoteIntoLocal(local, [], ["a1"], {}, { a1: 1000 });
    assert.equal(merged.length, 0);
  });
});
