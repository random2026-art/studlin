const { db } = require('./_lib/firebase-admin');
const { setCors } = require('./_lib/auth');
const { withSentry } = require('./_lib/sentry');

module.exports = withSentry(async (req, res) => {
  setCors(req, res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const { id } = req.query;
  if (!id) return res.status(400).json({ error: 'Missing share id.' });

  if (!db) return res.status(503).json({ error: 'Database unavailable.' });

  try {
    const doc = await db.collection('shared_chats').doc(id).get();
    if (!doc.exists) return res.status(404).json({ error: 'Not found.' });
    return res.status(200).json(doc.data());
  } catch (err) {
    console.error('get-shared-chat error:', err);
    return res.status(500).json({ error: 'Failed to load shared chat.' });
  }
});
