const PIPED_INSTANCES = [
  'https://pipedapi.kavin.rocks',
  'https://pipedapi.adminforge.de',
  'https://pipedapi.in.projectsegfau.lt',
];

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const q = req.query.q;
  if (!q) return res.status(400).json({ error: 'Missing search query (?q=...)' });

  for (const instance of PIPED_INSTANCES) {
    try {
      const url = instance + '/search?q=' + encodeURIComponent(q) + '&filter=videos';
      const resp = await fetch(url, { signal: AbortSignal.timeout(5000) });
      if (!resp.ok) continue;
      const data = await resp.json();

      const videos = (data.items || [])
        .filter(item => item.type === 'stream' && item.duration > 0)
        .slice(0, 12)
        .map(item => ({
          id: (item.url || '').replace('/watch?v=', ''),
          title: item.title || '',
          channel: item.uploaderName || '',
          thumbnail: item.thumbnail || ('https://img.youtube.com/vi/' + (item.url || '').replace('/watch?v=', '') + '/mqdefault.jpg'),
          duration: item.duration || 0,
          views: item.views || 0,
          uploaded: item.uploadedDate || '',
        }));

      return res.status(200).json({ videos });
    } catch (e) {
      continue;
    }
  }

  return res.status(502).json({ error: 'Video search is temporarily unavailable. Try again.' });
};
