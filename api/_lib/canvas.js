// Canvas Personal Access Token helpers -- the richer alternative to the
// Calendar Feed (.ics) import in api/cal-proxy.js. A token gives direct
// REST API access instead of a static calendar export, so Studlin can pull
// full assignment descriptions, real quiz/exam detection, and real
// per-course grade weighting (Canvas's assignment_groups.group_weight) --
// none of which the .ics feed exposes. Token generation is self-service
// (Account > Settings > New Access Token) but some institutions restrict
// or block it for students, which is why the Calendar Feed import stays a
// working fallback rather than being replaced.
const dns = require('dns').promises;

// *.instructure.com is Canvas's own SaaS subdomain -- vendor-controlled
// DNS a request can't be tricked into resolving somewhere else, so it's
// trusted outright with no extra check (see resolveCanvasDomain below).
function isAllowedCanvasDomain(hostname) {
  return hostname === 'instructure.com' || hostname.endsWith('.instructure.com');
}

// Accepts what a student is likely to paste -- a bare domain, or the full
// URL of their Canvas homepage -- and normalizes to a bare hostname. Pure
// parsing only, no allow/deny decision here (see resolveCanvasDomain).
function extractHostname(input) {
  let s = (input || '').trim();
  if (!s) return null;
  if (!/^https?:\/\//i.test(s)) s = 'https://' + s;
  try {
    return new URL(s).hostname.toLowerCase();
  } catch (e) {
    return null;
  }
}

function ipv4ToInt(ip) {
  const parts = ip.split('.').map(Number);
  if (parts.length !== 4 || parts.some(p => !Number.isInteger(p) || p < 0 || p > 255)) return null;
  return ((parts[0] << 24) >>> 0) + (parts[1] << 16) + (parts[2] << 8) + parts[3];
}

// Blocks the address ranges an SSRF attempt would actually target: the
// three RFC1918 private blocks, loopback, carrier-grade NAT, and --
// critically -- 169.254.0.0/16, which is where every major cloud
// provider's instance-metadata endpoint lives (the classic SSRF
// jackpot). 224.0.0.0 and above catches multicast/reserved/broadcast,
// none of which a real web server ever answers from.
function isPrivateOrReservedIPv4(ip) {
  const n = ipv4ToInt(ip);
  if (n === null) return true; // malformed -- fail closed
  const inRange = (base, bits) => {
    const mask = (~0 << (32 - bits)) >>> 0;
    return (n & mask) === (ipv4ToInt(base) & mask);
  };
  return inRange('10.0.0.0', 8) || inRange('172.16.0.0', 12) || inRange('192.168.0.0', 16) ||
    inRange('127.0.0.0', 8) || inRange('169.254.0.0', 16) || inRange('0.0.0.0', 8) ||
    inRange('100.64.0.0', 10) || inRange('192.0.0.0', 24) || inRange('198.18.0.0', 15) ||
    n >= ipv4ToInt('224.0.0.0');
}

function isPrivateOrReservedIPv6(ip) {
  const lower = ip.toLowerCase();
  if (lower === '::1' || lower === '::') return true; // loopback / unspecified
  if (/^fe[89ab][0-9a-f]:/.test(lower)) return true; // link-local fe80::/10
  if (/^f[cd][0-9a-f]{2}:/.test(lower)) return true; // unique local fc00::/7
  const mapped = lower.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
  if (mapped) return isPrivateOrReservedIPv4(mapped[1]);
  return false;
}

function isPrivateOrReservedIp(ip) {
  return ip.includes(':') ? isPrivateOrReservedIPv6(ip) : isPrivateOrReservedIPv4(ip);
}

// Confirms a non-instructure.com domain actually resolves to a real,
// public address before the server ever fetches it with a student's own
// token attached -- otherwise a hostname could be pointed straight at an
// internal service (localhost, a private 10.x/192.168.x address, or a
// cloud metadata endpoint) and the server would fetch it as if it were
// Canvas. Re-run on every sync (see api/me.js's handleCanvasPull), not
// just at connect time, since DNS can change after the fact.
async function verifyPublicDomain(hostname) {
  let addrs;
  try {
    addrs = await dns.lookup(hostname, { all: true });
  } catch (e) {
    return false;
  }
  return addrs.length > 0 && addrs.every(a => !isPrivateOrReservedIp(a.address));
}

// The one entry point api/me.js calls to decide whether a domain is safe
// to fetch. *.instructure.com is trusted outright (vendor DNS). Anything
// else -- a school's self-hosted custom/vanity Canvas domain -- is also
// supported, but only after verifyPublicDomain confirms it isn't pointed
// at an internal address. Every caller gets the same generic failure
// either way (see api/me.js) so a repeated attempt can't be used to map
// out which internal hosts exist by comparing error messages.
async function resolveCanvasDomain(input) {
  const hostname = extractHostname(input);
  if (!hostname) return { ok: false };
  if (isAllowedCanvasDomain(hostname)) return { ok: true, domain: hostname };
  const safe = await verifyPublicDomain(hostname);
  return safe ? { ok: true, domain: hostname } : { ok: false };
}

async function canvasFetch(domain, token, path) {
  const res = await fetch('https://' + domain + path, {
    headers: { Authorization: 'Bearer ' + token, Accept: 'application/json' },
  });
  if (res.status === 401) {
    throw Object.assign(new Error("That token was rejected by Canvas. Double-check you copied the whole thing."), { status: 401 });
  }
  if (!res.ok) {
    throw Object.assign(new Error('Canvas returned an error (' + res.status + ').'), { status: 502 });
  }
  return res.json();
}

async function fetchCanvasCourses(domain, token) {
  return canvasFetch(domain, token, '/api/v1/courses?enrollment_state=active&per_page=50');
}

async function fetchCanvasAssignments(domain, token, courseId) {
  return canvasFetch(domain, token, '/api/v1/courses/' + courseId + '/assignments?per_page=100&order_by=due_at');
}

async function fetchCanvasAssignmentGroups(domain, token, courseId) {
  return canvasFetch(domain, token, '/api/v1/courses/' + courseId + '/assignment_groups?per_page=50');
}

function stripHtml(html) {
  if (!html) return '';
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, ' ')
    .trim();
}

// Normalizes one Canvas assignment into the exact event shape parseICS
// produces (see api/cal-proxy.js) so it flows through the same
// client-side classification + mergeImportedEvents pipeline unchanged.
// quiz_id/submission_types is folded into the description as a
// plain-language hint rather than a separate field -- the classifier
// (classifyImportedCalendarEvents) already reads title+description and has
// no other channel for a structured hint, and this way a quiz genuinely
// reads as one without a second code path.
function canvasAssignmentToEvent(assignment, courseName, groupWeight) {
  const due = new Date(assignment.due_at);
  const isQuiz = !!assignment.quiz_id || (assignment.submission_types || []).includes('online_quiz');
  const points = assignment.points_possible ? (Math.round(assignment.points_possible * 10) / 10) + ' points. ' : '';
  const desc = stripHtml(assignment.description).slice(0, 280);
  return {
    id: 'canvas-' + assignment.id,
    uid: 'canvas-' + assignment.id,
    date: due.toISOString().slice(0, 10),
    time: due.toISOString().slice(11, 16),
    duration: 60,
    title: assignment.name || 'Untitled',
    description: (isQuiz ? 'This is a quiz/test. ' : '') + 'Course: ' + courseName + '. ' + points + desc,
    subject: courseName,
    kind: 'busy block',
    // Real, professor-configured grade weighting for this assignment's
    // category, not an AI guess from prose. Only meaningful once
    // mergeImportedEvents classifies this item as an exam (see its
    // gradeWeightPercent handling in studlin-app.jsx); harmless extra
    // data otherwise.
    gradeWeightPercent: groupWeight != null ? Math.round(groupWeight * 10) / 10 : null,
  };
}

// Orchestrates the full pull: every active course, every course's
// assignments + assignment groups (for real grade weighting), normalized
// and flattened into one list. Assignments with no due date, or one
// already past, are skipped -- same reasoning as parseICS skipping
// all-day/past entries, there's no real upcoming time to schedule around.
async function fetchAllCanvasData(domain, token) {
  const courses = await fetchCanvasCourses(domain, token);
  if (!Array.isArray(courses)) throw new Error('Unexpected response from Canvas.');
  const events = [];
  const now = new Date();
  for (const course of courses.slice(0, 20)) {
    const courseName = course.name || course.course_code || 'Course';
    let groups = [];
    try { groups = await fetchCanvasAssignmentGroups(domain, token, course.id); } catch (e) { groups = []; }
    const weightById = new Map((Array.isArray(groups) ? groups : []).map(g => [g.id, g.group_weight]));
    let assignments = [];
    try { assignments = await fetchCanvasAssignments(domain, token, course.id); } catch (e) { continue; }
    if (!Array.isArray(assignments)) continue;
    for (const a of assignments) {
      if (!a.due_at) continue;
      const due = new Date(a.due_at);
      if (isNaN(due.getTime()) || due < now) continue;
      events.push(canvasAssignmentToEvent(a, courseName, weightById.get(a.assignment_group_id)));
    }
  }
  return events;
}

module.exports = {
  isAllowedCanvasDomain,
  extractHostname,
  isPrivateOrReservedIp,
  resolveCanvasDomain,
  fetchCanvasCourses,
  fetchCanvasAssignments,
  fetchCanvasAssignmentGroups,
  canvasAssignmentToEvent,
  fetchAllCanvasData,
  stripHtml,
};
