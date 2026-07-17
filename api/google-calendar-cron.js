// Vercel Cron target -- runs once a day with nobody signed in, so it can't
// use verifyAuth/Firebase ID tokens the way every other api/*.js endpoint
// does. Vercel automatically sends `Authorization: Bearer <CRON_SECRET>`
// to a cron-invoked request when that env var is set; that's the only
// thing that authenticates this endpoint. Iterates every user who's
// connected Google Calendar (has a stored refresh token) and refreshes
// their synced snapshot -- this is what makes the connection feel
// "automatic": the client's once-per-load pull (see api/me.js
// google-calendar-pull) just reads whatever this most recently wrote.
const { db } = require('./_lib/firebase-admin');
const { withSentry } = require('./_lib/sentry');
const { refreshAccessToken, fetchGoogleCalendarEvents } = require('./_lib/google-calendar');

module.exports = withSentry(async (req, res) => {
  const expected = process.env.CRON_SECRET;
  const got = (req.headers.authorization || '').replace(/^Bearer /, '');
  if (!expected || got !== expected) return res.status(401).json({ error: 'Unauthorized' });
  if (!db) return res.status(503).json({ error: 'Database unavailable.' });

  const snap = await db.collection('users').where('googleCalendarRefreshToken', '!=', null).get();
  let synced = 0;
  let failed = 0;

  for (const doc of snap.docs) {
    const data = doc.data();
    try {
      const accessToken = await refreshAccessToken(data.googleCalendarRefreshToken);
      const events = await fetchGoogleCalendarEvents(accessToken);
      await doc.ref.update({
        googleCalendarSyncedEvents: events,
        googleCalendarLastSyncedAt: new Date().toISOString(),
        googleCalendarLastSyncError: null,
      });
      synced += 1;
    } catch (err) {
      // One user's revoked/expired token (or a transient Google API error)
      // must never stop the batch -- record it against just that user (the
      // client surfaces this as a "reconnect?" banner, see
      // google-calendar-pull) and move on to the next.
      failed += 1;
      await doc.ref.update({ googleCalendarLastSyncError: err.message || 'Sync failed' }).catch(() => {});
    }
  }

  return res.status(200).json({ ok: true, synced, failed });
});
