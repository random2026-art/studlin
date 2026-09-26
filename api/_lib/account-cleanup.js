// Account-deletion cleanup for the collections that were missed before the
// 2026-09-25 persona audit. Takes db/admin as arguments so it can be tested
// against a small fake instead of the live database.

// Docs keyed by the student's own uid.
const OWN_DOC_COLLECTIONS = ['aiMemory', 'completionLogSync', 'settingsSync', 'busyWindows'];

async function deleteQueryIn(db, query) {
  const snap = await query.get();
  let count = 0;
  for (let i = 0; i < snap.docs.length; i += 400) {
    const batch = db.batch();
    snap.docs.slice(i, i + 400).forEach((doc) => { batch.delete(doc.ref); count += 1; });
    await batch.commit();
  }
  return count;
}

// Shared records (study sessions, shared projects): whatever the student
// created or owns is deleted with the account. Where they were only a
// member, the other people keep their record and the student is removed
// from it. A record left with fewer than two people is deleted, since a
// shared record with one person is not shared any more.
async function leaveSharedRecords(db, admin, collection, ownerField, uid) {
  const FieldValue = admin.firestore.FieldValue;
  const owned = await deleteQueryIn(db, db.collection(collection).where(ownerField, '==', uid));
  const snap = await db.collection(collection).where('memberUids', 'array-contains', uid).get();
  let left = 0;
  let removed = 0;
  for (const doc of snap.docs) {
    const members = (doc.data().memberUids || []).filter((m) => m !== uid);
    if (members.length < 2) {
      await doc.ref.delete();
      removed += 1;
    } else {
      await doc.ref.update({ memberUids: FieldValue.arrayRemove(uid), ['participants.' + uid]: FieldValue.delete() });
      left += 1;
    }
  }
  return { owned, left, removed };
}

async function cleanupMissedCollections(db, admin, uid, safeStep) {
  const stats = {};
  for (const name of OWN_DOC_COLLECTIONS) {
    await safeStep(name, () => db.collection(name).doc(uid).delete());
  }
  stats.calendarViewGrants =
    ((await safeStep('calendarViewGrants:owner', () => deleteQueryIn(db, db.collection('calendarViewGrants').where('ownerUid', '==', uid)))) || 0) +
    ((await safeStep('calendarViewGrants:requester', () => deleteQueryIn(db, db.collection('calendarViewGrants').where('requesterUid', '==', uid)))) || 0);
  stats.studySessions = await safeStep('studySessions', () => leaveSharedRecords(db, admin, 'studySessions', 'createdBy', uid));
  stats.sharedProjects = await safeStep('sharedProjects', () => leaveSharedRecords(db, admin, 'sharedProjects', 'ownerUid', uid));
  return stats;
}

module.exports = { OWN_DOC_COLLECTIONS, leaveSharedRecords, cleanupMissedCollections };
