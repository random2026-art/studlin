const admin = require('firebase-admin');

if (!admin.apps.length) {
  const sa = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (sa) {
    admin.initializeApp({ credential: admin.credential.cert(JSON.parse(sa)) });
  } else {
    admin.initializeApp();
  }
}

const db = admin.firestore();
const auth = admin.auth();

module.exports = { admin, db, auth };
