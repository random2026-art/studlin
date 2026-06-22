const { db } = require('./_lib/firebase-admin');
const { setCors, verifyAuth } = require('./_lib/auth');

const DEFAULT_CREDITS = 120;

module.exports = async (req, res) => {
  setCors(req, res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const user = await verifyAuth(req);
  if (!user) return res.status(401).json({ error: 'Sign in required.' });

  const ref = db.collection('users').doc(user.uid);
  let doc = await ref.get();

  if (!doc.exists) {
    const data = {
      plan: 'Free',
      credits: DEFAULT_CREDITS,
      createdAt: new Date().toISOString(),
      email: user.email || null,
    };
    await ref.set(data);
    return res.status(200).json(data);
  }

  const data = doc.data();
  return res.status(200).json({
    plan: data.plan || 'Free',
    credits: data.credits ?? DEFAULT_CREDITS,
    email: data.email || user.email || null,
  });
};
