const { setCors, verifyAuth } = require('./_lib/auth');

module.exports = async (req, res) => {
  setCors(req, res);
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const user = await verifyAuth(req);
  if (!user) return res.status(401).json({ error: 'Sign in required.' });

  try {
    const { url } = req.body;
    if (!url) return res.status(400).json({ error: 'URL is required.' });

    const oembed = await fetch('https://www.youtube.com/oembed?url=' + encodeURIComponent(url) + '&format=json');
    if (!oembed.ok) return res.status(400).json({ error: 'Could not fetch video info. Check the URL.' });

    const data = await oembed.json();
    return res.status(200).json({
      title: data.title || '',
      author: data.author_name || '',
    });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch video info.' });
  }
};
