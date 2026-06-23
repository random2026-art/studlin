const admin = require('firebase-admin');

let db = null;
let auth = null;

try {
  if (!admin.apps.length) {
    const sa = process.env.FIREBASE_SERVICE_ACCOUNT;
    if (sa) {
      admin.initializeApp({ credential: admin.credential.cert(JSON.parse(sa)) });
    } else {
      admin.initializeApp({ projectId: 'studlin-cb78b' });
    }
  }
  db = admin.firestore();
  auth = admin.auth();
} catch (e) {
  console.warn('Firebase Admin init failed:', e.message);
}

module.exports = { admin, db, auth };
