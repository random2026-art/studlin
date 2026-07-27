// Requires the Firestore emulator (run via `npm run test:rules`, which
// wraps this in `firebase emulators:exec`). Verifies the new personal-
// content subcollections (Firestore migration step 0) are strictly
// owner-only, plus a handful of regression checks on existing collections
// this migration must not weaken.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {
  initializeTestEnvironment,
  assertFails,
  assertSucceeds,
} = require('@firebase/rules-unit-testing');

let testEnv;

test.before(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: 'studlin-rules-test',
    firestore: {
      rules: fs.readFileSync(path.join(__dirname, '..', 'firestore.rules'), 'utf8'),
      host: '127.0.0.1',
      port: 8080,
    },
  });
});

test.after(async () => {
  await testEnv.cleanup();
});

test.beforeEach(async () => {
  await testEnv.clearFirestore();
});

const USER_A = 'user-a';
const USER_B = 'user-b';
const PERSONAL_TYPES = ['events', 'notes', 'decks', 'essays', 'lectures', 'timerLogs', 'practiceExams'];

for (const type of PERSONAL_TYPES) {
  test(`${type}: owner can create/read/update their own item`, async () => {
    const db = testEnv.authenticatedContext(USER_A).firestore();
    const ref = db.collection('users').doc(USER_A).collection(type).doc('item1');
    await assertSucceeds(ref.set({ title: 'hi', updatedAt: new Date() }));
    await assertSucceeds(ref.get());
    await assertSucceeds(ref.update({ title: 'hi2', updatedAt: new Date() }));
  });

  test(`${type}: a different signed-in user cannot read another user's item`, async () => {
    await testEnv.withSecurityRulesDisabled((ctx) =>
      ctx.firestore().collection('users').doc(USER_A).collection(type).doc('item1')
        .set({ title: 'secret', updatedAt: new Date() })
    );
    const dbB = testEnv.authenticatedContext(USER_B).firestore();
    await assertFails(dbB.collection('users').doc(USER_A).collection(type).doc('item1').get());
  });

  test(`${type}: a different signed-in user cannot write another user's item`, async () => {
    const dbB = testEnv.authenticatedContext(USER_B).firestore();
    await assertFails(
      dbB.collection('users').doc(USER_A).collection(type).doc('item1')
        .set({ title: 'hacked', updatedAt: new Date() })
    );
  });

  test(`${type}: unauthenticated request is denied`, async () => {
    const dbAnon = testEnv.unauthenticatedContext().firestore();
    const ref = dbAnon.collection('users').doc(USER_A).collection(type).doc('item1');
    await assertFails(ref.get());
    await assertFails(ref.set({ title: 'x', updatedAt: new Date() }));
  });

  test(`${type}: create without updatedAt is rejected`, async () => {
    const dbA = testEnv.authenticatedContext(USER_A).firestore();
    await assertFails(
      dbA.collection('users').doc(USER_A).collection(type).doc('item2').set({ title: 'no timestamp' })
    );
  });

  test(`${type}: hard delete is always rejected, soft-delete via update is allowed`, async () => {
    const dbA = testEnv.authenticatedContext(USER_A).firestore();
    const ref = dbA.collection('users').doc(USER_A).collection(type).doc('item3');
    await assertSucceeds(ref.set({ title: 'x', updatedAt: new Date() }));
    await assertFails(ref.delete());
    await assertSucceeds(ref.update({ deletedAt: new Date(), updatedAt: new Date() }));
  });
}

test('_sync/status: owner-only read/write, others denied', async () => {
  const dbA = testEnv.authenticatedContext(USER_A).firestore();
  const dbB = testEnv.authenticatedContext(USER_B).firestore();
  const path_ = (db) => db.collection('users').doc(USER_A).collection('_sync').doc('status');
  await assertSucceeds(path_(dbA).set({ migratedTypes: {} }));
  await assertFails(path_(dbB).get());
  await assertFails(path_(dbB).set({ migratedTypes: {} }));
});

// --- Regression checks on existing rules this migration must not weaken ---

test('regression: users/{uid} root doc is never client-readable, even by its owner', async () => {
  const dbA = testEnv.authenticatedContext(USER_A).firestore();
  await assertFails(dbA.collection('users').doc(USER_A).get());
});

test('regression: users/{uid} write allowlist still rejects credits/plan tampering', async () => {
  // In production this doc is always created server-side via the Admin SDK
  // first (api/me.js, which bypasses rules) before any client write hits
  // it -- mirror that here, since the rule's own `.diff(resource.data)`
  // call errors out (rather than allow/deny) on a true first-write create
  // with no prior resource.data, a latent gap this test surfaced but is
  // out of scope to fix here (see PENDING_VERIFICATION.md).
  await testEnv.withSecurityRulesDisabled((ctx) =>
    ctx.firestore().collection('users').doc(USER_A).set({ plan: 'Free', credits: 120 })
  );
  const dbA = testEnv.authenticatedContext(USER_A).firestore();
  await assertFails(dbA.collection('users').doc(USER_A).set({ credits: 999999 }, { merge: true }));
  await assertSucceeds(dbA.collection('users').doc(USER_A).set({ onboarded: true }, { merge: true }));
});

test('regression: friendships only readable by the two parties involved', async () => {
  await testEnv.withSecurityRulesDisabled((ctx) =>
    ctx.firestore().collection('friendships').doc('f1')
      .set({ senderId: USER_A, receiverId: USER_B, status: 'accepted' })
  );
  const dbC = testEnv.authenticatedContext('user-c').firestore();
  await assertFails(dbC.collection('friendships').doc('f1').get());
  const dbA = testEnv.authenticatedContext(USER_A).firestore();
  await assertSucceeds(dbA.collection('friendships').doc('f1').get());
});

test('regression: chatRooms only readable by members', async () => {
  await testEnv.withSecurityRulesDisabled((ctx) =>
    ctx.firestore().collection('chatRooms').doc('r1')
      .set({ memberUids: [USER_A, USER_B], createdBy: USER_A })
  );
  const dbC = testEnv.authenticatedContext('user-c').firestore();
  await assertFails(dbC.collection('chatRooms').doc('r1').get());
});

test('regression: default-deny catch-all still blocks arbitrary undeclared collections', async () => {
  const dbA = testEnv.authenticatedContext(USER_A).firestore();
  await assertFails(dbA.collection('some-future-collection').doc('x').set({ a: 1 }));
});
