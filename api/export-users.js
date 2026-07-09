// Admin-only CSV export of all real onboarded Studlin users, plus (via
// { action: "purge_preview" | "purge" }) a one-time dev-database purge that
// deletes every account except KEEP_EMAIL below. Access: POST
// /api/export-users with JSON body { secret: "YOUR_ADMIN_EXPORT_SECRET", action? }
const { db, auth } = require('./_lib/firebase-admin');
const { withSentry } = require('./_lib/sentry');

// Filter out test / QA accounts by email or display name
const TEST_PATTERNS = [
  /@example\.com$/i,
  /@test\.com$/i,
  /@mailinator\.com$/i,
  /@guerrillamail/i,
  /@tempmail/i,
  /@yopmail/i,
  /^studlin\.qa/i,
  /^qa[\s.]/i,
  /^test[\s.]/i,
  /testuser/i,
  /^promise\.sctech@/i,
];

function isTestAccount(email, name) {
  if (!email) return true; // no email = not a real signup
  if (TEST_PATTERNS.some(p => p.test(email))) return true;
  if (name && TEST_PATTERNS.some(p => p.test(name))) return true;
  return false;
}

function readableStatus(status) {
  if (status === 'highschool') return 'High School';
  if (status === 'college') return 'College';
  return status || '';
}

function readableProvider(provider) {
  if (provider === 'google.com') return 'Google';
  if (provider === 'password') return 'Email';
  return provider || '';
}

module.exports = withSentry(async (req, res) => {
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

  const action = (req.body || {}).action || 'export';
  if (action === 'purge_preview' || action === 'purge') {
    return handlePurge(action, req, res);
  }

  try {
    // Pull all Firebase Auth users
    const authUsers = {};
    let pageToken;
    do {
      const result = await auth.listUsers(1000, pageToken);
      for (const u of result.users) {
        authUsers[u.uid] = {
          name:          u.displayName || '',
          email:         u.email || '',
          emailVerified: u.emailVerified ? 'Yes' : 'No',
          createdAt:     u.metadata.creationTime || '',
          provider:      (u.providerData[0] || {}).providerId || 'unknown',
        };
      }
      pageToken = result.pageToken;
    } while (pageToken);

    // Pull Firestore user documents
    const snap = await db.collection('users').get();
    const firestoreUsers = {};
    snap.forEach(doc => { firestoreUsers[doc.id] = doc.data(); });

    // Merge, filter test accounts, keep only onboarded users
    const rows = Object.entries(authUsers)
      .map(([uid, au]) => {
        const fs = firestoreUsers[uid] || {};
        return {
          // Identity
          name:            fs.name || au.name || '',
          email:           fs.email || au.email || '',
          emailVerified:   au.emailVerified,

          // Onboarding Q1: sign-up method
          signUpMethod:    readableProvider(au.provider),

          // Onboarding Q2: student status
          studentStatus:   readableStatus(fs.status),

          // Onboarding Q3: school name
          school:          fs.school || fs.affiliation || '',

          // Account details
          plan:            fs.plan || 'Free',
          credits:         fs.credits !== undefined ? fs.credits : '',
          onboarded:       fs.onboarded ? 'Yes' : 'No',

          // Timestamps
          signedUpAt:      fs.createdAt || au.createdAt || '',
          onboardedAt:     fs.onboardedAt || '',
        };
      })
      // Only real users who completed onboarding
      .filter(r => r.onboarded === 'Yes')
      // Remove test accounts
      .filter(r => !isTestAccount(r.email, r.name))
      // Must have a school (means they completed the profile step)
      .filter(r => r.school.trim() !== '');

    // Sort: newest signup first
    rows.sort((a, b) => (b.signedUpAt > a.signedUpAt ? 1 : -1));

    // Column headers match the onboarding questions
    const headers = [
      { key: 'name',          label: 'Full Name' },
      { key: 'email',         label: 'Email Address' },
      { key: 'emailVerified', label: 'Email Verified' },
      { key: 'signUpMethod',  label: 'Sign Up Method (Google or Email)' },
      { key: 'studentStatus', label: 'Student Status (High School or College)' },
      { key: 'school',        label: 'School Name' },
      { key: 'plan',          label: 'Plan' },
      { key: 'credits',       label: 'Credits' },
      { key: 'signedUpAt',    label: 'Signed Up At' },
      { key: 'onboardedAt',   label: 'Onboarded At' },
    ];

    const escape = v => `"${String(v).replace(/"/g, '""')}"`;
    const csv = [
      headers.map(h => escape(h.label)).join(','),
      ...rows.map(r => headers.map(h => escape(r[h.key])).join(',')),
    ].join('\n');

    const date = new Date().toISOString().slice(0, 10);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="studlin-users-${date}.csv"`);
    return res.status(200).send(csv);
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
});

// One-time dev-database purge — deletes every Firebase Auth user and every
// Firestore users/{uid} doc EXCEPT the one exempted email below. Same admin
// secret as the export action gates it; the client (admin-export.html) still
// requires an explicit "purge_preview" (dry run, deletes nothing) before the
// real "purge" call is even offered, so this can never fire from a single
// accidental click.
const KEEP_EMAIL = 'shenouday7@gmail.com';

async function handlePurge(action, req, res) {
  try {
    const authUsers = [];
    let pageToken;
    do {
      const result = await auth.listUsers(1000, pageToken);
      authUsers.push(...result.users);
      pageToken = result.pageToken;
    } while (pageToken);

    const toDelete = authUsers.filter(u => (u.email || '').toLowerCase() !== KEEP_EMAIL.toLowerCase());
    const kept = authUsers.length - toDelete.length;

    if (action === 'purge_preview') {
      return res.status(200).json({
        ok: true,
        totalAccounts: authUsers.length,
        willDelete: toDelete.length,
        willKeep: kept,
        sampleEmails: toDelete.slice(0, 10).map(u => u.email || '(no email)'),
      });
    }

    // action === 'purge' — the real, irreversible deletion.
    const uids = toDelete.map(u => u.uid);

    // Firestore users/{uid} docs first, batched under the 500-write limit.
    for (let i = 0; i < uids.length; i += 400) {
      const batch = db.batch();
      uids.slice(i, i + 400).forEach(uid => batch.delete(db.collection('users').doc(uid)));
      await batch.commit().catch(() => {}); // a missing doc is fine, nothing to delete
    }

    // Firebase Auth accounts, batched under the Admin SDK's 1000-uid limit.
    let deleted = 0;
    const errors = [];
    for (let i = 0; i < uids.length; i += 1000) {
      const result = await auth.deleteUsers(uids.slice(i, i + 1000));
      deleted += result.successCount;
      errors.push(...result.errors.map(e => e.error?.message || String(e)));
    }

    return res.status(200).json({ ok: true, totalAccounts: authUsers.length, deleted, kept, errors });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
