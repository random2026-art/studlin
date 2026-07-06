const crypto = require('crypto');
const { auth, db } = require('./_lib/firebase-admin');
const { setCors, verifyAuth } = require('./_lib/auth');

const MAX_ATTEMPTS = 5;
const hashCode = (code) => crypto.createHash('sha256').update(code).digest('hex');

module.exports = async (req, res) => {
  setCors(req, res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (!auth || !db) return res.status(503).json({ error: 'Auth service not configured' });

  const user = await verifyAuth(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  const code = String(req.body?.code || '').trim();
  if (!/^\d{6}$/.test(code)) return res.status(400).json({ error: 'Enter the 6-digit code.' });

  const ref = db.collection('emailOtps').doc(user.uid);
  const snap = await ref.get().catch(() => null);
  if (!snap || !snap.exists) return res.status(400).json({ error: 'No pending code. Request a new one.' });

  const data = snap.data();
  if (Date.now() > data.expiresAt) {
    await ref.delete().catch(() => {});
    return res.status(400).json({ error: 'Code expired. Request a new one.' });
  }
  if ((data.attempts || 0) >= MAX_ATTEMPTS) {
    await ref.delete().catch(() => {});
    return res.status(429).json({ error: 'Too many attempts. Request a new code.' });
  }

  if (hashCode(code) !== data.codeHash) {
    await ref.update({ attempts: (data.attempts || 0) + 1 }).catch(() => {});
    return res.status(400).json({ error: 'Incorrect code. Try again.' });
  }

  try {
    await auth.updateUser(user.uid, { emailVerified: true });
  } catch (e) {
    return res.status(500).json({ error: 'Could not verify email: ' + e.message });
  }
  await ref.delete().catch(() => {});
  return res.json({ ok: true });
};
