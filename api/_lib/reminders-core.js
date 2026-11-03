// Pure reminder logic for api/reminders.js -- no Firebase, so tests can run
// it directly. Ports the client's "X starts in N minutes" check
// (studlin-app.jsx, App()'s LEAD_TIMES effect) plus expandRoutineOccurrences
// to the server, so a phone gets the push with the app closed.
//
// Events/routines store local wall-clock strings ("2026-10-31", "09:30"), so
// every calculation here is done in the student's own IANA timezone.

const LEAD_TIMES = [10, 5];
// The server is poked every 5 minutes (GitHub Actions cron, .github/workflows/
// reminders.yml), so each lead owns a 5-minute window: 10 covers (5,10] minutes
// out and 5 covers (0,5]. firedKeys makes sure a key can only ever send once.
const WINDOW_MINS = 5;
const ROUTINE_KIND_TO_EVENT_KIND = { class: 'class', busy: 'busy block', free: 'free period' };

function validTimeZone(tz) {
  if (typeof tz !== 'string' || !tz || tz.length > 64) return false;
  try { new Intl.DateTimeFormat('en-US', { timeZone: tz }); return true; } catch (e) { return false; }
}

function zonedParts(ms, tz) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: tz, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  }).formatToParts(new Date(ms));
  const o = {};
  parts.forEach(p => { o[p.type] = p.value; });
  return { y: +o.year, mo: +o.month, d: +o.day, h: +o.hour, mi: +o.minute, s: +o.second };
}

// ms offset (local wall clock minus UTC) of `tz` at instant `ms`.
function tzOffsetMs(ms, tz) {
  const p = zonedParts(ms, tz);
  return Date.UTC(p.y, p.mo - 1, p.d, p.h, p.mi, p.s) - Math.floor(ms / 1000) * 1000;
}

// Real instant for a local wall-clock date + "HH:MM" in `tz`. Returns NaN on
// a malformed date/time.
function wallClockToMs(dateStr, timeStr, tz) {
  const dm = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateStr || '');
  const tm = /^(\d{1,2}):(\d{2})/.exec(timeStr || '');
  if (!dm || !tm) return NaN;
  const guess = Date.UTC(+dm[1], +dm[2] - 1, +dm[3], +tm[1], +tm[2]);
  const first = guess - tzOffsetMs(guess, tz);
  const second = guess - tzOffsetMs(first, tz);
  return second;
}

function dayKeyInTz(ms, tz) {
  const p = zonedParts(ms, tz);
  return p.y + '-' + String(p.mo).padStart(2, '0') + '-' + String(p.d).padStart(2, '0');
}

function addDaysKey(key, n) {
  const [y, m, d] = key.split('-').map(Number);
  const t = new Date(Date.UTC(y, m - 1, d + n));
  return t.getUTCFullYear() + '-' + String(t.getUTCMonth() + 1).padStart(2, '0') + '-' + String(t.getUTCDate()).padStart(2, '0');
}

// Same rule as the client's reminderCategoryAllowed.
function reminderCategoryAllowed(kind, deadlineAlertsOn) {
  if (kind === 'deadline' || kind === 'exam') return deadlineAlertsOn !== false;
  return true;
}

// Port of expandRoutineOccurrences for a single date key. skips/overrides/
// term come from the student's synced prefs (they are local-only on the
// client otherwise).
function routineOccurrencesForDate(routines, dateKey, prefs) {
  const out = [];
  if (!Array.isArray(routines)) return out;
  const skips = (prefs && prefs.routineSkips) || {};
  const overrides = (prefs && prefs.routineOverrides) || {};
  const term = prefs && prefs.schoolTerm && prefs.schoolTerm.start && prefs.schoolTerm.end ? prefs.schoolTerm : null;
  const [y, m, d] = dateKey.split('-').map(Number);
  const dow = (new Date(Date.UTC(y, m - 1, d)).getUTCDay() + 6) % 7; // Monday-first 0..6
  const skippedToday = skips[dateKey] || [];
  routines.forEach(r => {
    if (!r || !Array.isArray(r.days) || !r.days.includes(dow)) return;
    if (r.deletedAt) return;
    if (r.kind === 'habit') return;
    if (r.kind === 'class' && term && (dateKey < term.start || dateKey > term.end)) return;
    if (skippedToday.includes(r.id)) return;
    const o = overrides[r.id] && overrides[r.id][dateKey];
    out.push({
      id: 'routine-' + r.id + '-' + dateKey,
      title: r.title,
      date: dateKey,
      time: o && o.startTime != null ? o.startTime : r.startTime,
      kind: ROUTINE_KIND_TO_EVENT_KIND[r.kind] || 'class',
      status: 'pending',
    });
  });
  return out;
}

// Per-task override (ev.remindMins): 0 = none, N = one reminder N minutes
// before, anything else = the default leads. Mirrors reminderLeadsFor in
// studlin-app.jsx.
function leadsFor(ev) {
  const r = ev && ev.remindMins;
  if (r === 0) return [];
  if (typeof r === 'number' && r > 0 && r <= 1440) return [r];
  return LEAD_TIMES;
}

// -> [{key, title, lead}] for every reminder due right now that hasn't
// already been sent (firedKeys: array/Set of keys).
function dueReminders({ events, routines, prefs, nowMs, firedKeys }) {
  const p = prefs || {};
  if (!validTimeZone(p.tz)) return [];
  if (p.notifMaster === false) return [];
  const fired = firedKeys instanceof Set ? firedKeys : new Set(firedKeys || []);
  const todayK = dayKeyInTz(nowMs, p.tz);
  const tomorrowK = addDaysKey(todayK, 1);
  const items = [];
  (Array.isArray(events) ? events : []).forEach(ev => {
    if (!ev || ev.deletedAt) return;
    if (ev.date !== todayK && ev.date !== tomorrowK) return;
    if (!reminderCategoryAllowed(ev.kind, p.deadline)) return;
    items.push(ev);
  });
  if (p.classReminders === true) {
    [todayK, tomorrowK].forEach(k => routineOccurrencesForDate(routines, k, p).forEach(o => items.push(o)));
  }
  const due = [];
  const seen = new Set();
  items.forEach(ev => {
    if (!ev.time || ev.checklist || ev.status === 'done') return;
    const startMs = wallClockToMs(ev.date, ev.time, p.tz);
    if (isNaN(startMs)) return;
    const minsUntil = (startMs - nowMs) / 60000;
    leadsFor(ev).forEach(lead => {
      if (!(minsUntil <= lead && minsUntil > lead - WINDOW_MINS)) return;
      // Only the smaller lead wins if both windows overlap (they don't with
      // 10/5 and a 2-minute window, but keep it safe).
      const key = ev.id + '-' + lead + '-' + ev.date;
      if (fired.has(key) || seen.has(key)) return;
      seen.add(key);
      due.push({ key, title: ev.title || 'Your next item', lead, mins: Math.max(1, Math.round(minsUntil)) });
    });
  });
  return due;
}

module.exports = {
  LEAD_TIMES, WINDOW_MINS, validTimeZone, wallClockToMs, dayKeyInTz, addDaysKey,
  reminderCategoryAllowed, routineOccurrencesForDate, dueReminders,
};
