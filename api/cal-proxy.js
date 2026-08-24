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

function pad2(n) { return String(n).padStart(2, '0'); }

// Real-world hard ceiling on RRULE expansion -- a malformed or absurdly long
// recurrence (e.g. a feed bug that emits FREQ=WEEKLY with no UNTIL/COUNT at
// all) must never be able to hang this function or hand the client a
// multi-thousand-row payload. Whichever bound (the RRULE's own UNTIL/COUNT,
// or this ceiling) is hit first wins.
const RRULE_MAX_OCCURRENCES = 500;
const RRULE_MAX_SPAN_YEARS = 2;

const BYDAY_CODES = { SU: 0, MO: 1, TU: 2, WE: 3, TH: 4, FR: 5, SA: 6 };

// Expands one recurring VEVENT into its actual individual occurrences.
// Deliberately scoped to the two shapes that cover the overwhelming
// real-world case for a class schedule -- FREQ=WEEKLY with BYDAY (e.g.
// "every Mon/Wed/Fri") and the simpler FREQ=DAILY -- both bounded by UNTIL
// or COUNT (or the hard ceiling above if neither is given). This is NOT a
// general RFC 5545 RRULE implementation (no MONTHLY/YEARLY, no BYMONTHDAY,
// no BYSETPOS, no INTERVAL > 1) -- see CLAUDE.md: avoid overengineering,
// choose the simpler solution. Anything outside this scope -- including a
// WEEKLY rule with no BYDAY -- falls back to returning just the master's own
// DTSTART/DTEND unchanged, exactly what this parser did before RRULE
// support existed. No regression for the cases left unhandled, just no fix
// for them either.
function expandRecurringEvent(ev) {
  const fallback = [{ dtstart: ev.dtstart, dtend: ev.dtend }];
  if (!ev.rrule || !ev.dtstart) return fallback;

  const parts = {};
  ev.rrule.split(';').forEach(p => {
    const eq = p.indexOf('=');
    if (eq < 0) return;
    parts[p.slice(0, eq).toUpperCase()] = p.slice(eq + 1).trim();
  });

  const freq = parts.FREQ;
  if (freq !== 'WEEKLY' && freq !== 'DAILY') return fallback;
  if (parts.INTERVAL && parts.INTERVAL !== '1') return fallback;
  if (freq === 'WEEKLY' && !parts.BYDAY) return fallback;

  const isDateOnly = ev.dtstart.length <= 10;
  const timePart = isDateOnly ? '' : ev.dtstart.slice(10); // "THH:MM"
  const startDate = new Date(isDateOnly ? ev.dtstart + 'T00:00' : ev.dtstart);
  if (isNaN(startDate.getTime())) return fallback;
  const startDay = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());

  // DAILY has no BYDAY restriction -- every day matches. WEEKLY matches only
  // the specific weekdays named in BYDAY (already required non-empty above).
  const byDays = freq === 'WEEKLY'
    ? parts.BYDAY.split(',').map(d => BYDAY_CODES[d.trim().slice(-2).toUpperCase()]).filter(d => d !== undefined)
    : null;
  if (freq === 'WEEKLY' && !byDays.length) return fallback;
  const matchesDay = day => freq === 'DAILY' || byDays.includes(day);

  // UNTIL is compared by calendar day only (not exact time) -- real feeds
  // are inconsistent about whether UNTIL lands at midnight of the last
  // occurrence or midnight of the day after, and this app doesn't need
  // sub-day precision for "does this class still meet on this date."
  let untilDay = null;
  if (parts.UNTIL) {
    const u = parseDt(parts.UNTIL);
    const ud = new Date(u.length <= 10 ? u + 'T00:00' : u);
    if (!isNaN(ud.getTime())) untilDay = new Date(ud.getFullYear(), ud.getMonth(), ud.getDate());
  }
  const count = parts.COUNT ? parseInt(parts.COUNT, 10) : null;

  const ceilingDay = new Date(startDay.getFullYear() + RRULE_MAX_SPAN_YEARS, startDay.getMonth(), startDay.getDate());

  // Original duration (DTEND - DTSTART) from the master event, reapplied to
  // each occurrence's own start -- never just reused as an absolute DTEND.
  let durationMs = null;
  if (ev.dtend && ev.dtend.length > 10 && !isDateOnly) {
    const dMs = new Date(ev.dtend).getTime() - new Date(ev.dtstart).getTime();
    if (!isNaN(dMs) && dMs > 0) durationMs = dMs;
  }

  const exdateSet = new Set((ev.exdates || []).map(d => d.slice(0, 10)));

  const occurrences = [];
  const cursor = new Date(startDay.getTime());
  // Per RFC 5545, COUNT bounds the number of raw occurrences the rule
  // generates BEFORE EXDATE removes any of them -- so a cancelled date still
  // "uses up" one of the COUNT slots instead of being backfilled by an extra
  // occurrence past the end of the rule. Tracked separately from
  // occurrences.length (which is the actual kept/output count) for exactly
  // that reason.
  let rawCount = 0;
  // Belt-and-suspenders iteration cap independent of the ceiling/UNTIL/COUNT
  // checks below, so a bug in any one of those bounds still can't spin
  // forever -- generous enough to comfortably cover the 2-year ceiling.
  const maxIterations = RRULE_MAX_SPAN_YEARS * 366 + 30;
  for (let i = 0; i < maxIterations; i++) {
    if (cursor.getTime() > ceilingDay.getTime()) break;
    if (untilDay && cursor.getTime() > untilDay.getTime()) break;
    if (occurrences.length >= RRULE_MAX_OCCURRENCES) break;
    if (count !== null && rawCount >= count) break;
    if (matchesDay(cursor.getDay())) {
      rawCount++;
      const dateStr = cursor.getFullYear() + '-' + pad2(cursor.getMonth() + 1) + '-' + pad2(cursor.getDate());
      if (!exdateSet.has(dateStr)) {
        const occStart = dateStr + timePart;
        let occEnd = null;
        if (durationMs !== null) {
          const endMs = new Date(occStart).getTime() + durationMs;
          const ed = new Date(endMs);
          occEnd = ed.getFullYear() + '-' + pad2(ed.getMonth() + 1) + '-' + pad2(ed.getDate()) + 'T' + pad2(ed.getHours()) + ':' + pad2(ed.getMinutes());
        } else if (ev.dtend) {
          occEnd = ev.dtend; // no usable duration (e.g. date-only) -- keep pre-existing behavior of passing DTEND through as-is
        }
        occurrences.push({ dtstart: occStart, dtend: occEnd });
      }
    }
    cursor.setDate(cursor.getDate() + 1);
  }

  return occurrences.length ? occurrences : fallback;
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
  // Tracks nesting depth for sub-components inside a VEVENT (VALARM is the
  // real-world case -- a reminder alert can carry its own DESCRIPTION line).
  // The parser otherwise never tracks BEGIN/END nesting at all, it just
  // matches key:value lines anywhere between BEGIN:VEVENT and END:VEVENT --
  // so without this, a VALARM's own DESCRIPTION appearing after the event's
  // real one would silently overwrite it. A depth counter is enough here;
  // this parser only ever needs "are we inside some nested block right
  // now," never which one.
  let nestedDepth = 0;

  for (const line of lines) {
    if (line === 'BEGIN:VEVENT') { ev = {}; nestedDepth = 0; continue; }
    if (line === 'END:VEVENT') {
      if (ev && ev.dtstart) events.push(ev);
      ev = null;
      continue;
    }
    if (!ev) continue;

    if (line.startsWith('BEGIN:')) { nestedDepth++; continue; }
    if (line.startsWith('END:')) { if (nestedDepth > 0) nestedDepth--; continue; }
    if (nestedDepth > 0) continue; // ignore keys inside a nested VALARM/etc.

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
    else if (key === 'RRULE') ev.rrule = val;
    else if (key === 'EXDATE') {
      // RFC 5545 allows either several comma-separated dates on one EXDATE
      // line, or several separate EXDATE lines for the same event -- both
      // show up in real feeds, so this appends instead of overwriting.
      const dates = val.split(',').map(d => parseDt(d.trim())).filter(Boolean);
      ev.exdates = (ev.exdates || []).concat(dates);
    }
  }

  // Expand every recurring VEVENT (one master + RRULE) into its real
  // individual occurrences before the upcoming-events filter below ever
  // runs. This matters specifically because that filter drops anything
  // with DTSTART in the past -- and a recurring class's DTSTART is its
  // FIRST occurrence, typically the start of the semester, which is
  // usually already in the past by the time a student connects their
  // calendar. Without expansion the whole class silently vanished; this is
  // the actual fix for that.
  const expanded = [];
  for (const e of events) {
    if (!e.rrule) { expanded.push(e); continue; }
    const occs = expandRecurringEvent(e);
    if (occs.length <= 1) {
      // Not actually recurring (unsupported RRULE form, or the rule
      // legitimately resolves to a single occurrence) -- keep the event
      // exactly as before, including its original UID, so nothing about
      // today's non-recurring-event behavior changes.
      expanded.push({ ...e, dtstart: occs[0].dtstart, dtend: occs[0].dtend });
      continue;
    }
    occs.forEach(occ => {
      expanded.push({
        ...e,
        dtstart: occ.dtstart,
        dtend: occ.dtend,
        // Each expanded occurrence needs its own identity. mergeImportedEvents
        // (studlin-app.jsx) dedupes/resyncs by matching on externalUid via a
        // Map keyed on UID -- if every occurrence of this recurring event
        // shared the master's UID, that Map would keep only the
        // last-processed occurrence, and a resync would collapse every
        // occurrence's date/time onto that one. Suffixing with the
        // occurrence's own date keeps it stable across resyncs (same date
        // in, same UID out) while making every occurrence distinct.
        uid: e.uid ? e.uid + '-' + occ.dtstart.slice(0, 10) : e.uid,
      });
    });
  }

  const now = new Date();
  const upcoming = expanded.filter(e => {
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
