const { admin, db } = require('./_lib/firebase-admin');
const { withSentry } = require('./_lib/sentry');
const { dueReminders } = require('./_lib/reminders-core');

// Closed-app "X starts in N minutes" pushes. Meant to be hit every minute by
// an external scheduler (Vercel Hobby crons are daily-only) with
// `Authorization: Bearer $CRON_SECRET`. Per-user prefs live on
// users/{uid}.reminderPrefs (written by /api/me action `set-reminder-prefs`).
const FIRED_KEEP = 100;

async function readCollection(uid, name) {
  const snap = await db.collection('users').doc(uid).collection(name).get();
  return snap.docs.map(d => Object.assign({}, d.data(), { id: d.id }));
}

async function remindOneUser(doc, nowMs) {
  const data = doc.data();
  const prefs = data.reminderPrefs;
  const tokens = data.fcmTokens || [];
  if (!prefs || prefs.sysPush !== true || tokens.length === 0) return 0;
  const [events, routines] = await Promise.all([
    readCollection(doc.id, 'events'),
    prefs.classReminders === true ? readCollection(doc.id, 'routines') : Promise.resolve([]),
  ]);
  const fired = Array.isArray(data.firedReminders) ? data.firedReminders : [];
  const due = dueReminders({ events, routines, prefs, nowMs, firedKeys: fired });
  if (due.length === 0) return 0;

  // Claim the keys first (transaction re-reads firedReminders) so two
  // overlapping runs can't both send the same reminder.
  const ref = db.collection('users').doc(doc.id);
  const claimed = await db.runTransaction(async (tx) => {
    const cur = await tx.get(ref);
    const curFired = Array.isArray(cur.data().firedReminders) ? cur.data().firedReminders : [];
    const fresh = due.filter(r => !curFired.includes(r.key));
    if (fresh.length === 0) return [];
    tx.update(ref, { firedReminders: curFired.concat(fresh.map(r => r.key)).slice(-FIRED_KEEP) });
    return fresh;
  });

  let sent = 0;
  const stale = [];
  for (const r of claimed) {
    for (const token of tokens) {
      try {
        await admin.messaging().send({
          token,
          notification: { title: 'Studlin', body: r.title + ' starts in ' + r.lead + ' minutes' },
          data: { url: '/app' },
        });
        sent++;
      } catch (e) {
        if ((e.code === 'messaging/invalid-registration-token' || e.code === 'messaging/registration-token-not-registered') && !stale.includes(token)) {
          stale.push(token);
        }
      }
    }
  }
  if (stale.length > 0) {
    await ref.update({ fcmTokens: admin.firestore.FieldValue.arrayRemove(...stale) }).catch(() => {});
  }
  return sent;
}

module.exports = withSentry(async (req, res) => {
  const auth = (req.headers.authorization || '').replace(/^Bearer /, '');
  if (!process.env.CRON_SECRET || auth !== process.env.CRON_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  if (!db) return res.status(200).json({ ok: false, error: 'Database unavailable.' });
  const nowMs = Date.now();
  let checked = 0, sent = 0, failed = 0;
  const snap = await db.collection('users').where('reminderPrefs.sysPush', '==', true).get();
  for (const doc of snap.docs) {
    checked++;
    try { sent += await remindOneUser(doc, nowMs); } catch (e) { failed++; }
  }
  return res.status(200).json({ ok: true, checked, sent, failed });
});
