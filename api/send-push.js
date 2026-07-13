const { admin, db } = require('./_lib/firebase-admin');
const { setCors, verifyAuth } = require('./_lib/auth');
const { checkRateLimit } = require('./_lib/rateLimit');

// Fires a native push to every other member of a chat room, gated on each
// recipient's own `preferences.pushNotificationsEnabled` (checked here,
// server-side, using the admin SDK — never trust a client-supplied flag).
// Triggered by the sender's own client right after it writes a message
// (studlin-app.jsx ChatDrawer.sendMessage) — there's no Firebase Cloud
// Functions deployment in this project, so there's no way for the server to
// react to the Firestore write itself. The sender never controls who a push
// is attributed to: identity comes from verifyAuth(req), not the request body.
module.exports = async (req, res) => {
  setCors(req, res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const user = await verifyAuth(req);
  if (!user) return res.status(401).json({ error: 'Sign in required.' });

  const { allowed } = await checkRateLimit(`send-push:${user.uid}`, 60, 60 * 1000);
  if (!allowed) return res.status(429).json({ error: 'Too many requests.' });

  if (!db) {
    // Admin SDK isn't configured (FIREBASE_SERVICE_ACCOUNT missing) — fail
    // safe rather than crash, same fallback style as api/me.js.
    return res.status(200).json({ ok: false, reason: 'admin_unconfigured' });
  }

  const { roomId, preview } = req.body || {};
  if (!roomId || !preview) return res.status(400).json({ error: 'roomId and preview are required' });

  try {
    const roomSnap = await db.collection('chatRooms').doc(roomId).get();
    if (!roomSnap.exists) return res.status(404).json({ error: 'Room not found' });
    const room = roomSnap.data();
    const memberUids = room.memberUids || [];

    // Authorization: only an actual member of the room can trigger a push
    // for it — otherwise any signed-in user could spam pushes to strangers.
    if (!memberUids.includes(user.uid)) return res.status(403).json({ error: 'Not a member of this room' });

    const recipientUids = memberUids.filter((uid) => uid !== user.uid);
    if (recipientUids.length === 0) return res.status(200).json({ ok: true, sent: 0 });

    let senderName = 'Someone';
    try {
      const profileSnap = await db.collection('profiles').doc(user.uid).get();
      if (profileSnap.exists) senderName = profileSnap.data().name || senderName;
    } catch (e) {}

    const deepLinkUrl = room.type === 'group' ? `/network?group=${roomId}` : `/network?dm=${user.uid}`;

    let sent = 0;
    for (const uid of recipientUids) {
      const recipSnap = await db.collection('users').doc(uid).get();
      if (!recipSnap.exists) continue;
      const recip = recipSnap.data();
      if (!recip.preferences || recip.preferences.pushNotificationsEnabled !== true) continue;
      const tokens = recip.fcmTokens || [];
      if (tokens.length === 0) continue;

      const staleTokens = [];
      for (const token of tokens) {
        try {
          await admin.messaging().send({
            token,
            notification: { title: senderName, body: preview.slice(0, 140) },
            data: { url: deepLinkUrl },
          });
          sent++;
        } catch (e) {
          if (e.code === 'messaging/invalid-registration-token' || e.code === 'messaging/registration-token-not-registered') {
            staleTokens.push(token);
          }
        }
      }
      if (staleTokens.length > 0) {
        await db.collection('users').doc(uid).update({
          fcmTokens: admin.firestore.FieldValue.arrayRemove(...staleTokens),
        }).catch(() => {});
      }
    }

    return res.status(200).json({ ok: true, sent });
  } catch (e) {
    console.error('[send-push] Unexpected error:', e.message);
    return res.status(500).json({ error: 'Server error' });
  }
};
