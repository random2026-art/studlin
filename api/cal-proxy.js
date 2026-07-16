// Server-side proxy for fetching .ics calendar files.
// Avoids browser CORS restrictions when importing iCloud / other calendar links.
const { withSentry } = require('./_lib/sentry');

const ALLOWED_DOMAINS = [
  'icloud.com',
  'calendar.google.com',
  'outlook.live.com',
  'outlook.office365.com',
];

module.exports = withSentry(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') return res.status(200).end();

  let { url } = req.query;
  if (!url) return res.status(400).json({ error: 'Missing url parameter' });
  url = normalizeCalendarUrl(url);

  let parsed;
  try { parsed = new URL(url); } catch { return res.status(400).json({ error: 'Invalid URL' }); }

  const hostname = parsed.hostname;
  const allowed = ALLOWED_DOMAINS.some(d => hostname === d || hostname.endsWith('.' + d));
  if (!allowed) return res.status(403).json({ error: 'Domain not allowed. Only iCloud and major calendar providers are supported.' });

  try {
    const r = await fetch(url, { headers: { Accept: 'text/calendar, */*' }, redirect: 'follow' });
    if (!r.ok) return res.status(r.status).json({ error: 'Calendar server returned ' + r.status });
    const ics = await r.text();
    const { events, skippedAllDay } = parseICS(ics);
    return res.status(200).json({ ok: true, events, count: events.length, skippedAllDay });
  } catch (e) {
    return res.status(500).json({ error: e.message || 'Server error' });
  }
});

// "webcal://" is just a calendar-app convention meaning "this is an .ics
// feed" -- iCloud's own "Public Calendar" share link uses it by default.
// It means the exact same thing as https:// for fetching purposes, but
// the underlying HTTP client only understands http(s), so it has to be
// normalized before we ever try to fetch it.
function normalizeCalendarUrl(url) {
  return /^webcal:\/\//i.test(url) ? 'https://' + url.slice('webcal://'.length) : url;
}

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
    else if (key === 'UID') ev.uid = val;
  }

  const now = new Date();
  const upcoming = events.filter(e => {
    if (!e.dtstart) return false;
    const d = new Date(e.dtstart);
    return !isNaN(d.getTime()) && d >= now;
  });

  // Date-only (all-day) entries have no clock-time component -- treating
  // those as real occupied time would silently block a student's whole
  // day (e.g. a "Spring Break" all-day marker). Skip them for now but
  // count them so the caller can say so honestly instead of just
  // dropping them with no trace.
  const timed = upcoming.filter(e => e.dtstart.length > 10);
  const skippedAllDay = upcoming.length - timed.length;

  const outEvents = timed.map(e => {
    let duration = 60;
    if (e.dtend && e.dtend.length > 10) {
      const startMs = new Date(e.dtstart).getTime();
      const endMs = new Date(e.dtend).getTime();
      if (!isNaN(startMs) && !isNaN(endMs) && endMs > startMs) {
        duration = Math.round((endMs - startMs) / 60000);
      }
    }
    return {
      id: 'apple-' + Math.random().toString(36).slice(2, 10),
      uid: e.uid || null,
      date: e.dtstart.slice(0, 10),
      time: e.dtstart.slice(11, 16),
      duration,
      title: e.summary || 'Untitled',
      subject: 'General',
      kind: 'busy block',
    };
  });

  return { events: outEvents, skippedAllDay };
}

module.exports.parseICS = parseICS;
module.exports.normalizeCalendarUrl = normalizeCalendarUrl;
