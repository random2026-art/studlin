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

  // Folds a remote snapshot into the local array on hydrate (sign-in /
  // fresh device). Real newest-wins: an id present on both sides is
  // decided by comparing localUpdatedAtMs[id] (this device's own record
  // of when it last changed that item -- see studlin-app.jsx's
  // onLocalWrite, which stamps this on every real content change,
  // independent of the local event objects themselves) against
  // remoteUpdatedAtMs[id] (the Firestore doc's real updatedAt, in ms).
  // When there's NO local timestamp on record at all -- an id this
  // device's own bookkeeping has never seen -- remote wins by default:
  // "newest wins" has no basis for favoring local when there's zero
  // signal for when local last changed, while remote at least carries a
  // real timestamp. In practice this only happens for a genuine
  // cross-device id collision with no local edit history, which
  // essentially can't occur through normal use (ids are per-device
  // timestamps -- see isSyncableId's comment). A tie favors local.
  //
  // remoteDeletedIds is every id soft-deleted on the remote side (see
  // computePushDiff's own comment for why deletes are soft/update-only,
  // never a real Firestore delete). Same newest-wins rule applies: the
  // delete only propagates into a still-present local item when that
  // item has no newer LOCAL edit than the delete itself -- otherwise a
  // local edit made after another device's delete would be silently
  // discarded, which is exactly the class of bug this whole function
  // exists to avoid.
  //
  // Returns { merged, adoptedFromRemote } -- adoptedFromRemote (a Set of
  // ids) tells the caller which ids just had their content replaced by
  // the remote copy, so it can correctly re-seed its own bookkeeping
  // (see hydrateOnAuth) instead of treating an adopted remote value as a
  // brand-new local edit.
  function mergeRemoteIntoLocal(localEvents, remoteEvents, remoteDeletedIds, localUpdatedAtMs, remoteUpdatedAtMs) {
    localUpdatedAtMs = localUpdatedAtMs || {};
    remoteUpdatedAtMs = remoteUpdatedAtMs || {};
    const deletedSet = new Set(remoteDeletedIds || []);
    const byId = new Map(localEvents.map((e) => [e.id, e]));
    const adoptedFromRemote = new Set();

    function localIsAuthoritative(id) {
      const localMs = localUpdatedAtMs[id];
      if (localMs === undefined) return false; // no local signal -- defer to remote
      const remoteMs = remoteUpdatedAtMs[id];
      if (remoteMs === undefined) return true;
      return localMs >= remoteMs; // tie -> local
    }

    for (const r of remoteEvents) {
      if (!byId.has(r.id)) {
        byId.set(r.id, r); // remote-only -> adopt (created on another device)
        adoptedFromRemote.add(r.id);
        continue;
      }
      if (!localIsAuthoritative(r.id)) {
        byId.set(r.id, r);
        adoptedFromRemote.add(r.id);
      }
    }
    for (const id of deletedSet) {
      if (byId.has(id) && !localIsAuthoritative(id)) byId.delete(id);
    }
    return { merged: Array.from(byId.values()), adoptedFromRemote };
  }

  const api = { isSyncableId, sigOf, computePushDiff, mergeRemoteIntoLocal };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.StudlinEventsSync = api;
})(typeof window !== "undefined" ? window : globalThis);
