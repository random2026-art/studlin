// Server-side proxy for fetching .ics calendar files.
// Avoids browser CORS restrictions when importing iCloud / other calendar links.
const { withSentry } = require('./_lib/sentry');
const { verifyPublicDomain } = require('./_lib/ssrf-guard');

// Schoology, Canvas, and Blackboard are safe to allow with the same
// suffix-match check as everything else here: all three are SaaS
// platforms where the calendar-feed hostname is always vendor-controlled
// DNS (*.schoology.com, *.instructure.com, *.blackboard.com) -- no school
// or district ever gets a subdomain outside that zone, so the suffix
// can't be spoofed the way a fake lookalike domain could be.
// Blackboard also ships as a self-hosted product on arbitrary
// institution-owned domains -- that case isn't in this static list (no
// static suffix could cover it safely), but IS supported via
// isCalendarHostAllowedForPlatform below, which DNS-verifies a
// non-listed domain isn't pointed at a private/internal address before
// ever fetching it, and ONLY when the client identifies the connection as
// a Blackboard one.
// Moodle gets the identical treatment, for the identical reason: it's
// self-hosted per school with no shared vendor domain (Lehigh brands
// theirs "Course Site" at coursesite.lehigh.edu; every other school runs
// it under its own name/domain), so no static suffix could ever cover it.
// The frontend already sends platform==='moodle' as its hint (see
// PLATFORM_HELP.moodle / openImportCalModal in studlin-app.jsx) -- this
// was the missing half, leaving every real Moodle URL 403ing here despite
// the connect flow being fully built on the client side.
// PowerSchool and Infinite Campus are deliberately NOT given the same
// treatment yet -- both are commonly self-hosted on arbitrary
// district-owned domains too, but nothing in this file currently marks a
// request as "this is a PowerSchool/Infinite Campus connect" the way the
// Blackboard/Moodle platform hints do, so extending the same DNS-verified
// fallback to them would need that plumbing added first, not just a
// bigger allowlist.
const ALLOWED_DOMAINS = [
  'icloud.com',
  'calendar.google.com',
  'outlook.live.com',
  'outlook.office365.com',
  'schoology.com',
  'instructure.com',
  'blackboard.com',
];

function isAllowedCalendarHost(hostname) {
  return ALLOWED_DOMAINS.some(d => hostname === d || hostname.endsWith('.' + d));
}

// The full allow/deny decision for one request: the static allowlist
// above first (fast, no network round trip, covers every SaaS platform
// including *.blackboard.com), then -- ONLY when the client identified
// this as a Blackboard connect (platform==='blackboard') -- a fallback for
// a self-hosted Blackboard instance on its own institution-owned domain,
// gated on verifyPublicDomain actually confirming it resolves to a real,
// public address rather than an internal one. Deliberately scoped to
// Blackboard only: widening this to any domain would turn cal-proxy into
// a general-purpose URL fetcher, and PowerSchool/Infinite Campus/other
// unvetted platforms stay blocked exactly as before.
async function isCalendarHostAllowedForPlatform(hostname, platform) {
  if (isAllowedCalendarHost(hostname)) return true;
  if (platform === 'blackboard' || platform === 'moodle') return verifyPublicDomain(hostname);
  return false;
}

// Which sources get date-only (all-day) calendar entries included instead
// of dropped -- see the "all-day" comment on parseICS below for why this
// can't apply to every calendar source. Hostname-derived (not the client's
// own `platform` query param) so it still catches a raw Canvas/Schoology
// URL pasted into the generic "Connect a calendar" flow, not just a
// platform-specific card. Same suffix-match idiom as isAllowedCalendarHost,
// plus platform==='blackboard' for the self-hosted-custom-domain case
// (already DNS-verified by isCalendarHostAllowedForPlatform above -- by the
// time that's true, the client has explicitly identified this as Blackboard).
// Moodle belongs in the platform check below for the same reason
// Blackboard does: the frontend already runs Moodle imports through AI
// classification as a real academic source (see isAcademicCalendarSource
// in studlin-app.jsx), so a same-day exam entered with no clock time
// needs to survive the import instead of being silently dropped as
// "non-academic."
const ACADEMIC_DOMAINS = ['schoology.com', 'instructure.com', 'blackboard.com'];
function isAcademicCalendarHost(hostname, platform) {
  return ACADEMIC_DOMAINS.some(d => hostname === d || hostname.endsWith('.' + d)) || platform === 'blackboard' || platform === 'moodle';
}

// Re-validates the hostname on every hop instead of a bare
// fetch(...,{redirect:'follow'}) -- the allowlist above is only as strong
// as "every URL this proxy actually fetches passes it," and a plain
// redirect:'follow' never re-checks that after the first hop. Capped at 3
// redirects (real calendar feeds don't chain more than that) plus a 10s
// timeout so a slow/hanging upstream can't tie up the function indefinitely.
async function fetchCalendarRevalidated(url, platform, maxRedirects = 3) {
  let current = url;
  for (let i = 0; i <= maxRedirects; i++) {
    const parsed = new URL(current);
    if (!(await isCalendarHostAllowedForPlatform(parsed.hostname, platform))) {
      throw Object.assign(new Error('Domain not allowed. Only iCloud, Google, Outlook, Schoology, Canvas, and Blackboard calendar feeds are supported.'), { status: 403 });
    }
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    let r;
    try {
      r = await fetch(current, { headers: { Accept: 'text/calendar, */*' }, redirect: 'manual', signal: controller.signal });
    } finally {
      clearTimeout(timeout);
    }
    if (r.status >= 300 && r.status < 400 && r.headers.get('location')) {
      current = new URL(r.headers.get('location'), current).toString();
      continue;
    }
    return r;
  }
  throw Object.assign(new Error('Too many redirects'), { status: 400 });
}

module.exports = withSentry(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') return res.status(200).end();

  let { url, platform } = req.query;
  if (!url) return res.status(400).json({ error: 'Missing url parameter' });
  url = normalizeCalendarUrl(url);

  let parsed;
  try { parsed = new URL(url); } catch { return res.status(400).json({ error: 'Invalid URL' }); }

  if (!(await isCalendarHostAllowedForPlatform(parsed.hostname, platform))) {
    return res.status(403).json({ error: 'Domain not allowed. Only iCloud, Google, Outlook, Schoology, Canvas, and Blackboard calendar feeds are supported.' });
  }

  try {
    const r = await fetchCalendarRevalidated(url, platform);
    if (!r.ok) return res.status(r.status).json({ error: 'Calendar server returned ' + r.status });
    const ics = await r.text();
    // A wrong-but-reachable link (e.g. a Canvas calendar *page* URL instead
    // of its "Calendar Feed" .ics link) still returns 200, just with an
    // HTML body -- parseICS would silently find zero VEVENTs and this
    // endpoint would report the exact same "ok, 0 events" shape as a
    // legitimate empty feed, with no way for the student to tell "wrong
    // link" apart from "nothing due right now." BEGIN:VCALENDAR is the one
    // line every valid ICS body has per RFC 5545, even an empty feed.
    if (!/BEGIN:VCALENDAR/i.test(ics)) {
      return res.status(422).json({ error: 'That link didn\'t return real calendar data - double-check you copied the "Calendar Feed" (.ics) link, not a regular calendar page URL.' });
    }
    const includeAllDay = isAcademicCalendarHost(parsed.hostname, platform);
    const { events, skippedAllDay } = parseICS(ics, { includeAllDay });
    return res.status(200).json({ ok: true, events, count: events.length, skippedAllDay });
  } catch (e) {
    return res.status(e.status || 500).json({ error: e.message || 'Server error' });
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

function parseICS(text, opts) {
  const includeAllDay = !!(opts && opts.includeAllDay);
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
  // day (e.g. a "Spring Break" all-day marker). Skipped by default and
  // counted so the caller can say so honestly instead of just dropping
  // them with no trace. When includeAllDay is set (Canvas/Schoology/
  // Blackboard only -- see isAcademicCalendarHost -- where these items go
  // through AI classification and student review before ever landing on
  // the calendar, and a common real case is an exam entered with no
  // specific time), they're kept instead, with time/duration left null so
  // nothing here ever fabricates a clock time -- that's decided downstream
  // in mergeImportedEvents, only for the items that actually turn out to
  // need one (see its own comment).
  const timed = upcoming.filter(e => e.dtstart.length > 10);
  const allDayEntries = includeAllDay ? upcoming.filter(e => e.dtstart.length <= 10) : [];
  const skippedAllDay = includeAllDay ? 0 : upcoming.length - timed.length;

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
      // Kept (truncated) so the client-side Schoology/Canvas classification
      // pass has more than a bare title to work with -- every other caller
      // (Google/Outlook/iCloud/work-schedule imports) already ignores
      // fields it doesn't use, so this is additive, not a behavior change.
      description: e.description ? e.description.slice(0, 300) : '',
      subject: 'General',
      kind: 'busy block',
    };
  }).concat(allDayEntries.map(e => ({
    id: 'apple-' + Math.random().toString(36).slice(2, 10),
    uid: e.uid || null,
    date: e.dtstart.slice(0, 10),
    time: null,
    duration: null,
    allDay: true,
    title: e.summary || 'Untitled',
    description: e.description ? e.description.slice(0, 300) : '',
    subject: 'General',
    kind: 'busy block',
  })));

  return { events: outEvents, skippedAllDay };
}

module.exports.parseICS = parseICS;
module.exports.normalizeCalendarUrl = normalizeCalendarUrl;
module.exports.isAllowedCalendarHost = isAllowedCalendarHost;
module.exports.isCalendarHostAllowedForPlatform = isCalendarHostAllowedForPlatform;
module.exports.isAcademicCalendarHost = isAcademicCalendarHost;
