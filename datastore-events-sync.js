// Pure, dependency-free sync/merge logic for the events->Firestore
// migration (step 1 of the personal-content migration described in
// firestore.rules' users/{uid}/events comment). Deliberately has zero
// Firebase/DOM dependencies so the exact same code can be:
//   - loaded as a plain <script> before studlin-app.jsx (browser global
//     `window.StudlinEventsSync`), since this codebase has no bundler and
//     no shared-module system between or within bundles (see CLAUDE.md /
//     project-architecture memory) -- a plain script tag is the only way
//     to share code without introducing one.
//   - require()'d directly from the Node test suite, so tests exercise
//     the real production logic instead of a re-implementation of it.
//
// This file intentionally does NOT talk to Firestore itself -- the
// Firestore calls (batch writes, reads, auth) live in studlin-app.jsx's
// DataStore object, which calls these pure functions to decide WHAT to
// write. Keeping Firestore/auth out of here is what makes it testable
// without an emulator.
(function (root) {
  // Google Calendar sync already wipes and regenerates every "gcal-"
  // prefixed event wholesale on each sync pass (fresh ids each time --
  // see syncGoogleCalendar in studlin-app.jsx). Mirroring those to
  // Firestore would just accumulate orphaned soft-deleted docs forever
  // for data that's re-derived locally anyway, so they're excluded from
  // sync entirely and stay local-only.
  function isSyncableId(id) {
    return typeof id === "string" && id.length > 0 && !id.startsWith("gcal-");
  }

  // Cheap content-change signature. Local event objects have no
  // updatedAt/version field of their own (confirmed: none of the ~85
  // local write sites in studlin-app.jsx stamp one), so there's no
  // cheaper way to detect "did this item actually change since we last
  // pushed it" than comparing serialized content.
  function sigOf(event) {
    return JSON.stringify(event);
  }

  // prevSyncedSigs: plain object {id: sig} describing what DataStore
  // believes is already in Firestore (from the last successful push or
  // the initial hydrate). currentEvents: the live local events array.
  // Returns {upserts, deletedIds} -- upserts is the list of full event
  // objects that are new or changed; deletedIds is every previously-
  // synced id that's no longer present locally.
  //
  // Local deletes are hard-deletes-by-array-filter everywhere in this
  // codebase (no tombstone concept exists locally at all). The events
  // Firestore rule forbids delete entirely (delete: if false) --
  // soft-delete via an update that sets deletedAt is the only allowed
  // path. This function is the bridge: an id disappearing from the
  // local array becomes a deletedIds entry, which the caller turns into
  // a Firestore update{deletedAt} instead of a delete. Local behavior
  // itself is completely unchanged -- the array is still just filtered
  // as it always was.
  function computePushDiff(prevSyncedSigs, currentEvents) {
    const prev = prevSyncedSigs || {};
    const upserts = [];
    const seen = Object.create(null);
    for (const ev of currentEvents) {
      if (!ev || !isSyncableId(ev.id)) continue;
      seen[ev.id] = true;
      const s = sigOf(ev);
      if (prev[ev.id] !== s) upserts.push(ev);
    }
    const deletedIds = [];
    for (const id in prev) {
      if (!seen[id]) deletedIds.push(id);
    }
    return { upserts, deletedIds };
  }

  // Folds a remote snapshot (already filtered to exclude soft-deleted
  // docs by the caller) into the local array on hydrate (sign-in /
  // fresh device). Local wins whenever both sides have the same id --
  // there's no per-item updatedAt on the LOCAL side to compare against
  // remote's, so "local is authoritative, remote only fills in items
  // this device doesn't have yet" is the only conflict rule that can't
  // silently discard a local edit. Remote-only items (created on
  // another device) are adopted as-is.
  //
  // Known limitation, deliberately deferred rather than solved wrong:
  // this does NOT propagate a deletion made on another device into a
  // local array that still has the item -- that direction (remote
  // delete -> local removal) isn't implemented in step 1. Local ->
  // remote soft-delete works (see computePushDiff above); the reverse
  // needs either a live listener or a real local updatedAt convention,
  // both out of scope for this step.
  function mergeRemoteIntoLocal(localEvents, remoteEvents) {
    const byId = new Map(localEvents.map((e) => [e.id, e]));
    for (const r of remoteEvents) {
      if (!byId.has(r.id)) byId.set(r.id, r);
    }
    return Array.from(byId.values());
  }

  const api = { isSyncableId, sigOf, computePushDiff, mergeRemoteIntoLocal };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.StudlinEventsSync = api;
})(typeof window !== "undefined" ? window : globalThis);
