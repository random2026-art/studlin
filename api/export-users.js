// Admin-only CSV export of all Studlin users.
// Access: POST /api/export-users with JSON body { secret: "YOUR_ADMIN_EXPORT_SECRET" }
// Set ADMIN_EXPORT_SECRET in Vercel environment variables.
const { db, auth } = require('./_lib/firebase-admin');

const TEST_PATTERNS = [
  /@example\.com$/i,
  /^studlin\.qa/i,
  /^qa\s/i,
  /^test\s/i,
  /testuser/i,
];

function isTestAccount(email, name) {
  if (!email) return false;
  if (TEST_PATTERNS.some(p => p.test(email))) return true;
  if (name && TEST_PATTERNS.some(p => p.test(name))) return true;
  return false;
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).end();

  const secret = process.env.ADMIN_EXPORT_SECRET;
  const provided = (req.body || {}).secret;
  if (!secret || provided !== secret) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (!db || !auth) return res.status(500).json({ error: 'Firebase not initialized' });

  try {
    // Pull all Firebase Auth users
    const authUsers = {};
    let pageToken;
    do {
      const result = await auth.listUsers(1000, pageToken);
      for (const u of result.users) {
        authUsers[u.uid] = {
          name: u.displayName || '',
          email: u.email || '',
          emailVerified: u.emailVerified ? 'yes' : 'no',
          createdAt: u.metadata.creationTime || '',
          provider: (u.providerData[0] || {}).providerId || 'unknown',
        };
      }
      pageToken = result.pageToken;
    } while (pageToken);

    // Pull Firestore user documents
    const snap = await db.collection('users').get();
    const firestoreUsers = {};
    snap.forEach(doc => { firestoreUsers[doc.id] = doc.data(); });

    // Merge and filter out test accounts
    const rows = Object.entries(authUsers)
      .map(([uid, au]) => {
        const fs = firestoreUsers[uid] || {};
        return {
          name:          fs.name || au.name || '',
          email:         fs.email || au.email || '',
          school:        fs.school || fs.affiliation || '',
          status:        fs.status || '',
          plan:          fs.plan || 'Free',
          credits:       fs.credits !== undefined ? fs.credits : '',
          onboarded:     fs.onboarded ? 'yes' : 'no',
          emailVerified: au.emailVerified,
          provider:      au.provider,
          createdAt:     fs.createdAt || au.createdAt || '',
          onboardedAt:   fs.onboardedAt || '',
        };
      })
      .filter(r => !isTestAccount(r.email, r.name));

    // Sort: onboarded users first, then by newest signup
    rows.sort((a, b) => {
      if (a.onboarded !== b.onboarded) return a.onboarded === 'yes' ? -1 : 1;
      return (b.createdAt > a.createdAt ? 1 : -1);
    });

    const headers = ['name','email','school','status','plan','credits','onboarded','emailVerified','provider','createdAt','onboardedAt'];
    const escape = v => `"${String(v).replace(/"/g,'""')}"`;
    const csv = [
      headers.join(','),
      ...rows.map(r => headers.map(h => escape(r[h])).join(',')),
    ].join('\n');

    const date = new Date().toISOString().slice(0, 10);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="studlin-users-${date}.csv"`);
    return res.status(200).send(csv);
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
};
