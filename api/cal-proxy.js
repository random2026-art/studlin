// Server-side proxy for fetching .ics calendar files.
// Avoids browser CORS restrictions when importing iCloud / other calendar links.
const ALLOWED_DOMAINS = [
  'icloud.com',
  'calendar.google.com',
  'outlook.live.com',
  'outlook.office365.com',
];

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { url } = req.query;
  if (!url) return res.status(400).json({ error: 'Missing url parameter' });

  let parsed;
  try { parsed = new URL(url); } catch { return res.status(400).json({ error: 'Invalid URL' }); }

  const hostname = parsed.hostname;
  const allowed = ALLOWED_DOMAINS.some(d => hostname === d || hostname.endsWith('.' + d));
  if (!allowed) return res.status(403).json({ error: 'Domain not allowed. Only iCloud and major calendar providers are supported.' });

  try {
    const r = await fetch(url, { headers: { Accept: 'text/calendar, */*' }, redirect: 'follow' });
    if (!r.ok) return res.status(r.status).json({ error: 'Calendar server returned ' + r.status });
    const ics = await r.text();
    const events = parseICS(ics);
    return res.status(200).json({ ok: true, events, count: events.length });
  } catch (e) {
    return res.status(500).json({ error: e.message || 'Server error' });
  }
};

function parseDt(s) {
  if (!s || s.length < 8) return '';
  const yr = s.slice(0, 4), mo = s.slice(4, 6), dy = s.slice(6, 8);
  if (s.length >= 15) {
    const hr = s.slice(9, 11), mn = s.slice(11, 13);
    return yr + '-' + mo + '-' + dy + 'T' + hr + ':' + mn;
  }
  return yr + '-' + mo + '-' + dy;
}

function parseICS(text) {
  const lines = text
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/\n[ \t]/g, '') // unfold wrapped lines
    .split('\n');

  const events = [];
  let ev = null;

  for (const line of lines) {
    if (line === 'BEGIN:VEVENT') { ev = {}; continue; }
    if (line === 'END:VEVENT') {
      if (ev && ev.dtstart) events.push(ev);
      ev = null;
      continue;
    }
    if (!ev) continue;

    const ci = line.indexOf(':');
    if (ci < 0) continue;
    const key = line.slice(0, ci).replace(/;[^:]+/, '').toUpperCase();
    const val = line.slice(ci + 1).trim();

    if (key === 'SUMMARY') ev.summary = val;
    else if (key === 'DTSTART') ev.dtstart = parseDt(val);
    else if (key === 'DTEND') ev.dtend = parseDt(val);
    else if (key === 'DESCRIPTION') ev.description = val;
    else if (key === 'LOCATION') ev.location = val;
    else if (key === 'STATUS') ev.status = val;
  }

  const now = new Date();
  return events
    .filter(e => {
      if (!e.dtstart) return false;
      const d = new Date(e.dtstart);
      return !isNaN(d.getTime()) && d >= now;
    })
    .map(e => ({
      id: 'apple-' + Math.random().toString(36).slice(2, 10),
      date: e.dtstart.slice(0, 10),
      time: e.dtstart.length > 10 ? e.dtstart.slice(11, 16) : '',
      title: e.summary || 'Untitled',
      subject: 'General',
      kind: 'deadline',
    }));
}
