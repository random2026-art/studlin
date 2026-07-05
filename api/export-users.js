// Admin-only CSV export of all Studlin users.
// Access: GET /api/export-users?secret=YOUR_ADMIN_EXPORT_SECRET
// Set ADMIN_EXPORT_SECRET in Vercel environment variables.
const { db, auth } = require('./_lib/firebase-admin');

module.exports = async (req, res) => {
  if (req.method !== 'GET') return res.status(405).end();

  const secret = process.env.ADMIN_EXPORT_SECRET;
  if (!secret || req.query.secret !== secret) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (!db || !auth) return res.status(500).json({ error: 'Firebase not initialized' });

  try {
    // Pull all Firebase Auth users (for displayName / creationTime)
    const authUsers = {};
    let pageToken;
    do {
      const result = await auth.listUsers(1000, pageToken);
      for (const u of result.users) {
        authUsers[u.uid] = {
          name: u.displayName || '',
          email: u.email || '',
          createdAt: u.metadata.creationTime || '',
          provider: (u.providerData[0] || {}).providerId || 'unknown',
        };
      }
      pageToken = result.pageToken;
    } while (pageToken);

    // Pull all Firestore user documents
    const snap = await db.collection('users').get();
    const firestoreUsers = {};
    snap.forEach(doc => { firestoreUsers[doc.id] = doc.data(); });

    // Merge: every Auth user gets a row, Firestore fills in the extra fields
    const rows = Object.entries(authUsers).map(([uid, au]) => {
      const fs = firestoreUsers[uid] || {};
      return {
        name:        fs.name || au.name || '',
        email:       fs.email || au.email || '',
        school:      fs.school || fs.affiliation || '',
        status:      fs.status || '',
        plan:        fs.plan || 'Free',
        credits:     fs.credits !== undefined ? fs.credits : '',
        onboarded:   fs.onboarded ? 'yes' : 'no',
        provider:    au.provider,
        createdAt:   fs.createdAt || au.createdAt || '',
        onboardedAt: fs.onboardedAt || '',
      };
    });

    // Sort by createdAt descending (newest first)
    rows.sort((a, b) => (b.createdAt > a.createdAt ? 1 : -1));

    // Build CSV
    const headers = ['name','email','school','status','plan','credits','onboarded','provider','createdAt','onboardedAt'];
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
