module.exports = async (req, res) => {
  const allowedOrigins = ['https://studlin.vercel.app'];
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

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
