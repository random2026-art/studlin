const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { admin, db, auth } = require('./_lib/firebase-admin');
const { setCors, verifyAuth } = require('./_lib/auth');
const { withSentry } = require('./_lib/sentry');
const { exchangeCodeForTokens, refreshAccessToken, fetchGoogleCalendarEvents, registerCalendarWatch, stopCalendarWatch } = require('./_lib/google-calendar');

// Source of truth for the Free plan's monthly AI chat allowance — this is
// what actually creates the user doc on first load. Must match
// api/chat.js's DEFAULT_CREDITS (a same-value fallback for the rare case a
// chat request beats the profile fetch) and studlin-app.jsx's
// getCreditLimit() Free branch.
const DEFAULT_CREDITS = 120;
const DELETED_USER_ID = 'deleted-user';
const DELETED_USER_NAME = 'Deleted user';

function isoFromStripeSeconds(value) {
  return value ? new Date(value * 1000).toISOString() : null;
}

function subscriptionPayload(subscription) {
  return {
    stripeSubscriptionId: subscription.id,
    stripeCustomerId: subscription.customer,
    subscriptionStatus: subscription.status,
    subscriptionCancelAtPeriodEnd: !!subscription.cancel_at_period_end,
    subscriptionCurrentPeriodEnd: isoFromStripeSeconds(subscription.current_period_end),
    subscriptionEndsAt: subscription.cancel_at_period_end ? isoFromStripeSeconds(subscription.current_period_end) : null,
  };
}

async function handleSubscriptionAction(user, req, res) {
  if (!db) return res.status(503).json({ error: 'Database unavailable.' });
  const { action } = req.body || {};
  if (!['cancel', 'resume'].includes(action)) {
    return res.status(400).json({ error: 'Invalid subscription action.' });
  }

  try {
    const userRef = db.collection('users').doc(user.uid);
    const userDoc = await userRef.get();
    const data = userDoc.exists ? userDoc.data() : {};
    const subscriptionId = data.stripeSubscriptionId;
    if (!subscriptionId) {
      return res.status(404).json({ error: 'No active subscription found.' });
    }

    const existing = await stripe.subscriptions.retrieve(subscriptionId);
    const metadataUid = existing.metadata && existing.metadata.firebase_uid;
    if (metadataUid && metadataUid !== user.uid) {
      return res.status(403).json({ error: 'Subscription does not belong to this account.' });
    }
    if (data.stripeCustomerId && existing.customer !== data.stripeCustomerId) {
      return res.status(403).json({ error: 'Subscription customer mismatch.' });
    }

    const subscription = await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: action === 'cancel',
    });

    const update = {
      ...subscriptionPayload(subscription),
      updatedAt: new Date().toISOString(),
    };
    await userRef.set(update, { merge: true });

    return res.status(200).json(update);
  } catch (err) {
    console.error('subscription action error:', err);
    return res.status(500).json({ error: 'Could not update subscription. Please try again.' });
  }
}

// Exchanges the one-time authorization code the client got from Google's
// popup consent screen for a long-lived refresh token, stores it (never
// readable by any client -- see firestore.rules users/{userId}: allow
// read: if false), then does one immediate sync so "Connect" still feels
// instant, same as the old client-only implicit-token flow did. Everything
// after this point (the daily cron, the on-load pull) reads the refresh
// token this stores; nothing else ever requests a fresh one from Google.
async function handleGoogleCalendarConnect(user, req, res) {
  if (!db) return res.status(503).json({ error: 'Database unavailable.' });
  const { code } = req.body || {};
  if (!code) return res.status(400).json({ error: 'Missing authorization code.' });

  try {
    const tokens = await exchangeCodeForTokens(code);
    if (!tokens.refresh_token) {
      // Google only issues a refresh token on a fresh consent grant --
      // initCodeClient is configured with prompt:'consent' client-side
      // specifically to guarantee this, so getting here means something
      // upstream of that changed; fail loudly rather than silently storing
      // a connection that can never actually background-sync.
      return res.status(502).json({ error: "Google didn't grant offline access. Try disconnecting and reconnecting." });
    }
    const events = await fetchGoogleCalendarEvents(tokens.access_token);
    const now = new Date().toISOString();
    await db.collection('users').doc(user.uid).set({
      googleCalendarRefreshToken: tokens.refresh_token,
      googleCalendarConnectedAt: now,
      googleCalendarSyncedEvents: events,
      googleCalendarLastSyncedAt: now,
      googleCalendarLastSyncError: null,
    }, { merge: true });
    // Best-effort, non-fatal: a failure here (e.g. a transient Google API
    // error) shouldn't fail the whole connect -- the daily cron's own
    // expiring-channel check (see handleGoogleCalendarCron) registers one
    // for this user within a day either way if this doesn't land now.
    // watchError is surfaced in the response (temporary -- diagnosing why
    // push notifications aren't arriving in production) so a registration
    // failure is visible instead of silently swallowed.
    let watchError = null;
    try {
      const watch = await registerCalendarWatch(tokens.access_token, user.uid);
      await db.collection('users').doc(user.uid).update({
        googleCalendarChannelId: watch.channelId,
        googleCalendarChannelResourceId: watch.resourceId,
        googleCalendarChannelExpiration: watch.expiration,
      });
    } catch (watchErr) {
      watchError = watchErr.message;
      console.warn('google calendar watch registration failed:', watchErr.message);
    }
    return res.status(200).json({ events, lastSyncedAt: now, watchError });
  } catch (err) {
    console.error('google calendar connect error:', err);
    return res.status(500).json({ error: 'Could not connect Google Calendar. Please try again.' });
  }
}

// Read-only -- returns whatever the daily cron (or the connect call above)
// most recently fetched. Never calls Google itself, so this is cheap
// enough to run on every app load without worrying about rate limits or
// popup UX at all.
async function handleGoogleCalendarPull(user, res) {
  if (!db) return res.status(503).json({ error: 'Database unavailable.' });
  try {
    const doc = await db.collection('users').doc(user.uid).get();
    const data = doc.exists ? doc.data() : {};
    if (!data.googleCalendarRefreshToken) return res.status(200).json({ connected: false, events: [] });
    return res.status(200).json({
      connected: true,
      events: data.googleCalendarSyncedEvents || [],
      lastSyncedAt: data.googleCalendarLastSyncedAt || null,
      lastSyncError: data.googleCalendarLastSyncError || null,
    });
  } catch (err) {
    console.error('google calendar pull error:', err);
    return res.status(500).json({ error: 'Could not load synced calendar.' });
  }
}

async function handleGoogleCalendarDisconnect(user, res) {
  if (!db) return res.status(503).json({ error: 'Database unavailable.' });
  try {
    const ref = db.collection('users').doc(user.uid);
    const doc = await ref.get();
    const data = doc.exists ? doc.data() : {};
    // Best-effort cleanup so Google stops trying to notify a channel
    // nobody's listening for -- never fatal, the fields get deleted
    // either way even if this fails (a stale token/channel just stops
    // delivering on its own once Google can no longer reach it).
    if (data.googleCalendarRefreshToken && data.googleCalendarChannelId) {
      try {
        const accessToken = await refreshAccessToken(data.googleCalendarRefreshToken);
        await stopCalendarWatch(accessToken, data.googleCalendarChannelId, data.googleCalendarChannelResourceId);
      } catch (stopErr) {
        console.warn('google calendar watch stop failed:', stopErr.message);
      }
    }
    await ref.update({
      googleCalendarRefreshToken: admin.firestore.FieldValue.delete(),
      googleCalendarConnectedAt: admin.firestore.FieldValue.delete(),
      googleCalendarSyncedEvents: admin.firestore.FieldValue.delete(),
      googleCalendarLastSyncedAt: admin.firestore.FieldValue.delete(),
      googleCalendarLastSyncError: admin.firestore.FieldValue.delete(),
      googleCalendarChannelId: admin.firestore.FieldValue.delete(),
      googleCalendarChannelResourceId: admin.firestore.FieldValue.delete(),
      googleCalendarChannelExpiration: admin.firestore.FieldValue.delete(),
    });
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('google calendar disconnect error:', err);
    return res.status(500).json({ error: 'Could not disconnect Google Calendar.' });
  }
}

// Shared by the cron loop and the webhook handler below -- refreshes one
// user's access token, fetches their calendar, and writes the synced
// snapshot. Returns the access token on success so a caller that also
// needs to touch the Calendar API right after (the cron's channel-renewal
// check below) doesn't have to refresh a second time. Throws on failure;
// callers are responsible for recording googleCalendarLastSyncError.
async function syncOneUser(ref, data) {
  const accessToken = await refreshAccessToken(data.googleCalendarRefreshToken);
  const events = await fetchGoogleCalendarEvents(accessToken);
  await ref.update({
    googleCalendarSyncedEvents: events,
    googleCalendarLastSyncedAt: new Date().toISOString(),
    googleCalendarLastSyncError: null,
  });
  return accessToken;
}

const CHANNEL_RENEW_WITHIN_MS = 48 * 60 * 60 * 1000;

// Vercel Cron target for the daily background sync -- folded into this
// file (rather than its own api/google-calendar-cron.js) to stay within
// the Hobby plan's 12-Serverless-Function-per-deployment cap, the same
// constraint api/notify.js already merged three functions to respect (see
// its own comment). Runs with nobody signed in, so it can't use
// verifyAuth/a Firebase ID token the way every other action here does --
// authenticated instead by an exact match against CRON_SECRET, which
// Vercel automatically sends as `Authorization: Bearer <CRON_SECRET>` on
// a cron-invoked request. Checked before verifyAuth in the main handler
// below, so this path never touches the normal per-user auth gate.
async function handleGoogleCalendarCron(res) {
  if (!db) return res.status(503).json({ error: 'Database unavailable.' });
  const snap = await db.collection('users').where('googleCalendarRefreshToken', '!=', null).get();
  let synced = 0;
  let failed = 0;
  for (const doc of snap.docs) {
    const data = doc.data();
    try {
      const accessToken = await syncOneUser(doc.ref, data);
      synced += 1;
      // Channels expire (Google caps them, commonly under two weeks) and
      // can't be extended, only replaced -- this is the fallback renewal
      // path even when the webhook below is working fine, and the only
      // path at all if the connect-time registration ever silently
      // failed. Reuses the access token syncOneUser already refreshed
      // above instead of requesting a second one.
      const expiresSoon = !data.googleCalendarChannelExpiration || (data.googleCalendarChannelExpiration - Date.now()) < CHANNEL_RENEW_WITHIN_MS;
      if (expiresSoon) {
        try {
          const watch = await registerCalendarWatch(accessToken, doc.id);
          await doc.ref.update({
            googleCalendarChannelId: watch.channelId,
            googleCalendarChannelResourceId: watch.resourceId,
            googleCalendarChannelExpiration: watch.expiration,
          });
        } catch (watchErr) {
          console.warn('google calendar watch renewal failed for', doc.id, ':', watchErr.message);
        }
      }
    } catch (err) {
      // One user's revoked/expired token (or a transient Google API
      // error) must never stop the batch -- recorded against just that
      // user (surfaced client-side as a "reconnect?" banner, see
      // google-calendar-pull above) and move on to the next.
      failed += 1;
      await doc.ref.update({ googleCalendarLastSyncError: err.message || 'Sync failed' }).catch(() => {});
    }
  }
  return res.status(200).json({ ok: true, synced, failed });
}

// Google's push notification -- carries no calendar data itself, just
// "something changed, go look." Routed here from the very top of the
// exported handler below (before verifyAuth: this request has no
// Firebase user) via the X-Goog-Resource-State header. `token` is
// whatever Studlin set at registration time (see registerCalendarWatch)
// -- the uid, which is how an incoming ping gets matched to a user with
// no separate lookup table.
async function handleGoogleCalendarWebhook(uid, channelId, res) {
  // Google expects a fast 2xx regardless of outcome and will retry on
  // failure -- always 200, even when there's nothing to do, rather than
  // surfacing an error it would just retry forever.
  if (!db || !uid) return res.status(200).end();
  try {
    const ref = db.collection('users').doc(uid);
    const doc = await ref.get();
    const data = doc.exists ? doc.data() : {};
    // A mismatched channel id means this is a stale notification from a
    // channel that's since been replaced (e.g. by the cron's renewal
    // above) -- ignore it rather than acting on stale identity.
    if (data.googleCalendarRefreshToken && data.googleCalendarChannelId === channelId) {
      await syncOneUser(ref, data);
    }
  } catch (err) {
    console.warn('google calendar webhook sync failed:', err.message);
  }
  return res.status(200).end();
}

async function deleteQuery(query) {
  const snap = await query.get();
  if (snap.empty) return 0;
  let count = 0;
  for (let i = 0; i < snap.docs.length; i += 400) {
    const batch = db.batch();
    snap.docs.slice(i, i + 400).forEach((doc) => {
      batch.delete(doc.ref);
      count += 1;
    });
    await batch.commit();
  }
  return count;
}

async function deleteDocTree(ref) {
  if (typeof db.recursiveDelete === 'function') {
    await db.recursiveDelete(ref);
    return;
  }
  const messages = await ref.collection('messages').get().catch(() => null);
  if (messages && !messages.empty) {
    for (let i = 0; i < messages.docs.length; i += 400) {
      const batch = db.batch();
      messages.docs.slice(i, i + 400).forEach((doc) => batch.delete(doc.ref));
      await batch.commit();
    }
  }
  await ref.delete();
}

async function anonymizeMessages(roomRef, uid) {
  const snap = await roomRef.collection('messages').where('senderId', '==', uid).get();
  if (snap.empty) return 0;
  let count = 0;
  for (let i = 0; i < snap.docs.length; i += 400) {
    const batch = db.batch();
    snap.docs.slice(i, i + 400).forEach((doc) => {
      batch.update(doc.ref, {
        senderId: DELETED_USER_ID,
        senderDeleted: true,
        senderName: admin.firestore.FieldValue.delete(),
      });
      count += 1;
    });
    await batch.commit();
  }
  return count;
}

async function removeFromChatRooms(uid) {
  const snap = await db.collection('chatRooms').where('memberUids', 'array-contains', uid).get();
  let roomsTouched = 0;

  for (const doc of snap.docs) {
    const room = doc.data() || {};
    const roomRef = doc.ref;
    const remaining = (room.memberUids || []).filter((memberUid) => memberUid !== uid);
    await anonymizeMessages(roomRef, uid);

    if (remaining.length === 0) {
      await deleteDocTree(roomRef);
      roomsTouched += 1;
      continue;
    }

    const memberNames = { ...(room.memberNames || {}) };
    delete memberNames[uid];
    Object.keys(memberNames).forEach((key) => {
      if (!remaining.includes(key)) delete memberNames[key];
    });

    const lastReadAt = { ...(room.lastReadAt || {}) };
    delete lastReadAt[uid];

    const update = {
      memberUids: remaining,
      memberNames,
      lastReadAt,
      updatedAt: new Date().toISOString(),
    };

    if (room.createdBy === uid) update.createdBy = remaining[0];
    if (room.lastMessage && room.lastMessage.senderId === uid) {
      update.lastMessage = { ...room.lastMessage, senderId: DELETED_USER_ID, senderDeleted: true };
    }

    await roomRef.update(update);
    roomsTouched += 1;
  }

  return roomsTouched;
}

async function cancelStripe(data) {
  const subscriptionId = data && data.stripeSubscriptionId;
  const customerId = data && data.stripeCustomerId;
  if (subscriptionId) {
    await stripe.subscriptions.cancel(subscriptionId).catch((err) => {
      if (err && err.statusCode !== 404) throw err;
    });
  }
  if (customerId) {
    await stripe.customers.del(customerId).catch((err) => {
      if (err && err.statusCode !== 404) throw err;
    });
  }
}

async function handleDeleteAccount(user, res) {
  if (!db || !auth) return res.status(503).json({ error: 'Account service unavailable.' });

  try {
    const uid = user.uid;
    const userRef = db.collection('users').doc(uid);
    const userDoc = await userRef.get();
    const userData = userDoc.exists ? userDoc.data() : {};

    await cancelStripe(userData);

    const stats = {
      courses: await deleteQuery(db.collection('courses').where('userId', '==', uid)),
      assignments: await deleteQuery(db.collection('assignments').where('userId', '==', uid)),
      sentFriendships: await deleteQuery(db.collection('friendships').where('senderId', '==', uid)),
      receivedFriendships: await deleteQuery(db.collection('friendships').where('receiverId', '==', uid)),
      usernames: await deleteQuery(db.collection('usernames').where('uid', '==', uid)),
      sharedChats: 0,
      chatRooms: await removeFromChatRooms(uid),
    };

    for (const field of ['uid', 'userId', 'ownerUid', 'createdBy']) {
      stats.sharedChats += await deleteQuery(db.collection('shared_chats').where(field, '==', uid)).catch(() => 0);
    }

    await db.collection('profiles').doc(uid).delete().catch(() => {});
    await db.collection('emailOtps').doc(uid).delete().catch(() => {});
    await userRef.delete().catch(() => {});
    await auth.deleteUser(uid).catch((err) => {
      if (err && err.code !== 'auth/user-not-found') throw err;
    });

    return res.status(200).json({ ok: true, stats, displayName: DELETED_USER_NAME });
  } catch (err) {
    console.error('delete account error:', err);
    return res.status(500).json({ error: 'Could not delete account. Please contact support.' });
  }
}

module.exports = withSentry(async (req, res) => {
  setCors(req, res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (!['GET', 'POST'].includes(req.method)) return res.status(405).json({ error: 'Method not allowed' });

  // A Google Calendar push notification -- checked before verifyAuth
  // since this has no Firebase user either, just Google's own headers.
  // "sync" is the one-time confirmation Google sends the moment a watch
  // channel is first created (no calendar data changed, nothing to do);
  // any other resource state means something actually changed.
  const resourceState = req.headers['x-goog-resource-state'];
  if (resourceState) {
    if (resourceState === 'sync') return res.status(200).end();
    return handleGoogleCalendarWebhook(req.headers['x-goog-channel-token'], req.headers['x-goog-channel-id'], res);
  }

  // Vercel Cron hitting this path -- checked before verifyAuth since there
  // is no signed-in user for a batch job. An exact secret match (not just
  // "any bearer token") so this can never be triggered by anything but
  // Vercel's own scheduler.
  const cronAuth = (req.headers.authorization || '').replace(/^Bearer /, '');
  if (process.env.CRON_SECRET && cronAuth === process.env.CRON_SECRET) {
    return handleGoogleCalendarCron(res);
  }

  const user = await verifyAuth(req);
  if (!user) return res.status(401).json({ error: 'Sign in required.' });

  if (req.method === 'POST') {
    const { action } = req.body || {};
    if (action === 'delete-account') return handleDeleteAccount(user, res);
    if (action === 'google-calendar-connect') return handleGoogleCalendarConnect(user, req, res);
    if (action === 'google-calendar-pull') return handleGoogleCalendarPull(user, res);
    if (action === 'google-calendar-disconnect') return handleGoogleCalendarDisconnect(user, res);
    return handleSubscriptionAction(user, req, res);
  }

  if (!db) {
    return res.status(200).json({ plan: 'Free', credits: DEFAULT_CREDITS, email: user.email || null });
  }

  try {
    const ref = db.collection('users').doc(user.uid);
    const doc = await ref.get();

    if (!doc.exists) {
      const data = {
        plan: 'Free',
        credits: DEFAULT_CREDITS,
        createdAt: new Date().toISOString(),
        email: user.email || null,
      };
      await ref.set(data);
      return res.status(200).json({ ...data, onboarded: false });
    }

    const data = doc.data();
    return res.status(200).json({
      plan: data.plan || 'Free',
      credits: data.credits ?? DEFAULT_CREDITS,
      email: data.email || user.email || null,
      stripeSubscriptionId: data.stripeSubscriptionId || null,
      subscriptionStatus: data.subscriptionStatus || null,
      subscriptionInterval: data.subscriptionInterval || null,
      subscriptionCancelAtPeriodEnd: !!data.subscriptionCancelAtPeriodEnd,
      subscriptionCurrentPeriodEnd: data.subscriptionCurrentPeriodEnd || null,
      subscriptionEndsAt: data.subscriptionEndsAt || null,
      onboarded: !!data.onboarded,
    });
  } catch (err) {
    console.warn('Profile lookup unavailable, returning defaults:', err.message);
    return res.status(200).json({ plan: 'Free', credits: DEFAULT_CREDITS, email: user.email || null });
  }
});
