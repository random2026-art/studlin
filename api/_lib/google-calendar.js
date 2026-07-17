// Shared Google Calendar OAuth + fetch helpers, used by both api/me.js
// (user-initiated connect/pull/disconnect, one uid at a time) and
// api/google-calendar-cron.js (the daily background sync, every connected
// uid, nobody logged in) — kept in one place so both stay in sync instead
// of drifting.
const CLIENT_ID = '16831354472-e2vauavtunm3ot771cg7pgline10i9rk.apps.googleusercontent.com';

// redirect_uri:'postmessage' is Google's documented sentinel for exchanging
// a code that came from google.accounts.oauth2.initCodeClient's popup/
// postMessage flow (ux_mode:'popup') -- there is no real redirect URL here,
// this literal string is what Google's token endpoint expects instead.
async function exchangeCodeForTokens(code) {
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: CLIENT_ID,
      client_secret: process.env.GOOGLE_CALENDAR_CLIENT_SECRET,
      redirect_uri: 'postmessage',
      grant_type: 'authorization_code',
    }),
  });
  const data = await res.json();
  if (data.error) throw new Error(data.error_description || data.error);
  return data; // { access_token, refresh_token, expires_in, ... }
}

async function refreshAccessToken(refreshToken) {
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      client_id: CLIENT_ID,
      client_secret: process.env.GOOGLE_CALENDAR_CLIENT_SECRET,
      grant_type: 'refresh_token',
    }),
  });
  const data = await res.json();
  if (data.error) throw new Error(data.error_description || data.error);
  return data.access_token;
}

// Mirrors studlin-app.jsx's client-side googleItemToEvent exactly, so a
// user who only ever gets events via the server (the once-per-load "pull")
// sees identically-shaped data to one who just clicked "Connect" and got
// them straight from the client-side fetch path.
function googleItemToEvent(item) {
  const timed = !!(item.start && item.start.dateTime);
  let duration = 60;
  if (timed && item.end && item.end.dateTime) {
    const mins = Math.round((new Date(item.end.dateTime) - new Date(item.start.dateTime)) / 60000);
    if (mins > 0) duration = mins;
  }
  return {
    id: 'gcal-' + item.id,
    date: (item.start.dateTime || item.start.date).slice(0, 10),
    time: timed ? item.start.dateTime.slice(11, 16) : '',
    duration: timed ? duration : null,
    title: item.summary || 'Untitled',
    subject: 'General',
    kind: timed ? 'busy block' : 'deadline',
  };
}

async function fetchGoogleCalendarEvents(accessToken) {
  const now = new Date().toISOString();
  const url = 'https://www.googleapis.com/calendar/v3/calendars/primary/events?maxResults=50&orderBy=startTime&singleEvents=true&timeMin=' + encodeURIComponent(now);
  const res = await fetch(url, { headers: { Authorization: 'Bearer ' + accessToken } });
  const data = await res.json();
  if (data.error) throw new Error(data.error.message);
  return (data.items || []).map(googleItemToEvent);
}

// Registers a Google Calendar push-notification "watch" channel -- Google
// will POST to `address` within seconds of any change on this calendar,
// instead of Studlin having to wait for the next daily poll. `token` is
// an opaque string Google echoes back on every notification unchanged;
// passing the Firestore uid here is what lets an incoming ping be matched
// to a user with no separate lookup table. The channel itself carries no
// calendar data -- just "something changed, go look" -- and expires on
// its own (Google's own cap, commonly under two weeks), so the caller is
// responsible for re-registering before `expiration` passes; there is no
// "renew," only "create a new one."
async function registerCalendarWatch(accessToken, uid) {
  const res = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events/watch', {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + accessToken, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      id: 'studlin-' + uid + '-' + Date.now().toString(36),
      type: 'web_hook',
      // The apex domain 308-redirects to www -- confirmed Google Calendar
      // push delivery does not reliably follow redirects on webhook POSTs,
      // so this must be the canonical non-redirecting host or Google's
      // notifications silently never arrive.
      address: 'https://www.studlin.com/api/me',
      token: uid,
    }),
  });
  const data = await res.json();
  if (data.error) throw new Error(data.error.message || 'Watch registration failed');
  return { channelId: data.id, resourceId: data.resourceId, expiration: parseInt(data.expiration, 10) };
}

// Best-effort -- called right before the refresh token itself is deleted
// on disconnect, purely so Google stops trying to notify a channel nobody
// is listening for anymore. Never fatal: a channel Google can no longer
// reach for a deleted/expired token just stops delivering on its own.
async function stopCalendarWatch(accessToken, channelId, resourceId) {
  await fetch('https://www.googleapis.com/calendar/v3/channels/stop', {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + accessToken, 'Content-Type': 'application/json' },
    body: JSON.stringify({ id: channelId, resourceId }),
  });
}

module.exports = { exchangeCodeForTokens, refreshAccessToken, fetchGoogleCalendarEvents, googleItemToEvent, registerCalendarWatch, stopCalendarWatch };
