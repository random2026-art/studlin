// Canvas Personal Access Token helpers -- the richer alternative to the
// Calendar Feed (.ics) import in api/cal-proxy.js. A token gives direct
// REST API access instead of a static calendar export, so Studlin can pull
// full assignment descriptions, real quiz/exam detection, and real
// per-course grade weighting (Canvas's assignment_groups.group_weight) --
// none of which the .ics feed exposes. Token generation is self-service
// (Account > Settings > New Access Token) but some institutions restrict
// or block it for students, which is why the Calendar Feed import stays a
// working fallback rather than being replaced.

// Scoped to *.instructure.com domains only, same reasoning as
// cal-proxy.js's ALLOWED_DOMAINS: that's Canvas's own SaaS subdomain,
// vendor-controlled DNS a request can't be tricked into resolving
// somewhere else (SSRF). Canvas also supports institution-owned custom/
// vanity domains (e.g. canvas.someschool.edu), which this deliberately
// does NOT cover yet -- there's no static suffix that safely allows "any
// real Canvas instance" without also allowing an attacker-supplied domain
// the server would blindly fetch with the student's own token attached.
function isAllowedCanvasDomain(hostname) {
  return hostname === 'instructure.com' || hostname.endsWith('.instructure.com');
}

// Accepts what a student is likely to paste -- a bare domain, or the full
// URL of their Canvas homepage -- and normalizes to a bare hostname.
// Returns null for anything that isn't a real, allowed Canvas domain
// rather than guessing.
function normalizeCanvasDomain(input) {
  let s = (input || '').trim();
  if (!s) return null;
  if (!/^https?:\/\//i.test(s)) s = 'https://' + s;
  let hostname;
  try {
    hostname = new URL(s).hostname.toLowerCase();
  } catch (e) {
    return null;
  }
  if (!isAllowedCanvasDomain(hostname)) return null;
  return hostname;
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
  normalizeCanvasDomain,
  fetchCanvasCourses,
  fetchCanvasAssignments,
  fetchCanvasAssignmentGroups,
  canvasAssignmentToEvent,
  fetchAllCanvasData,
  stripHtml,
};
