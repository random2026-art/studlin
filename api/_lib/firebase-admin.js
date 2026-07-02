const admin = require('firebase-admin');
const { getFirestore } = require('firebase-admin/firestore');

let db = null;
let auth = null;

// Firestore "NOT_FOUND" (grpc code 5) most commonly means the client is
// pointed at a database ID that doesn't exist for this project — e.g. the
// Firestore database was created with a custom ID instead of the default
// "(default)" one. Allow overriding via env so this can be corrected without
// a code change, but default to "(default)" which is what almost every
// project uses.
const DATABASE_ID = process.env.FIRESTORE_DATABASE_ID || '(default)';

try {
  if (!admin.apps.length) {
    const sa = process.env.FIREBASE_SERVICE_ACCOUNT;
    if (sa) {
      admin.initializeApp({ credential: admin.credential.cert(JSON.parse(sa)) });
    } else {
      admin.initializeApp({ projectId: 'studlin-cb78b' });
    }
  }
  db = DATABASE_ID === '(default)' ? admin.firestore() : getFirestore(admin.app(), DATABASE_ID);
  auth = admin.auth();
} catch (e) {
  console.warn('Firebase Admin init failed:', e.message);
}

module.exports = { admin, db, auth };
