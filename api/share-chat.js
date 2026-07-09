const { db } = require('./_lib/firebase-admin');
const { setCors, verifyAuth } = require('./_lib/auth');

module.exports = async (req, res) => {
  setCors(req, res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const user = await verifyAuth(req);
  if (!user) return res.status(401).json({ error: 'Sign in required.' });

  const { msgs, title } = req.body || {};
  if (!Array.isArray(msgs) || msgs.length === 0) {
    return res.status(400).json({ error: 'No messages to share.' });
  }

  if (!db) return res.status(503).json({ error: 'Database unavailable.' });

  try {
    const shareId = 's' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
    await db.collection('shared_chats').doc(shareId).set({
      msgs: msgs.map(m => ({ r: m.r, t: m.t || '', file: m.file || null })),
      title: (title || 'Shared conversation').slice(0, 120),
      createdAt: Date.now(),
      uid: user.uid,
    });
    return res.status(200).json({ shareId });
  } catch (err) {
    console.error('share-chat error:', err);
    return res.status(500).json({ error: 'Failed to create share link.' });
  }
};
