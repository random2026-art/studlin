const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { admin, db, auth } = require('./_lib/firebase-admin');
const { setCors, verifyAuth } = require('./_lib/auth');
const { withSentry } = require('./_lib/sentry');
const { exchangeCodeForTokens, refreshAccessToken, fetchGoogleCalendarEvents, registerCalendarWatch, stopCalendarWatch } = require('./_lib/google-calendar');
const { resolveCanvasDomain, fetchAllCanvasData } = require('./_lib/canvas');

// Source of truth for the Free plan's monthly AI chat allowance — this is
// what actually creates the user doc on first load. Must match
// api/chat.js's DEFAULT_CREDITS (a same-value fallback for the rare case a
// chat request beats the profile fetch) and studlin-app.jsx's
// getCreditLimit() Free branch.
const DEFAULT_CREDITS = 120;
const DELETED_USER_ID = 'deleted-user';
const DELETED_USER_NAME = 'Deleted user';

// Beta tester Pro trial (2026-08-20) -- a small, curated group gets one
// month of real Pro access via a shared code, WITHOUT it being a
// permanent comp and without going through Stripe at all. The code
// itself ("betatesters") isn't the actual security boundary -- it's a
// single shared word, easy to leak -- the email allowlist is. Add an
// email here (lowercase) and redeploy to let that account in; nothing
// else needs to change. See handleRedeemBeta below for the redemption
// logic and the GET handler further down for the self-expiring check.
const BETA_TESTER_EMAILS = [
  'shenouday7@gmail.com',
  'ymehraeil779@gmail.com',
  'owentyler10@icloud.com',
  'nourlena28@gmail.com',
];
const BETA_CODE = 'betatesters';
const BETA_TRIAL_DAYS = 30;

// Referral trial (2026-08-27) -- replaces an earlier "50 bonus AI
// credits" promise on the growth banner that, on inspection, had no
// backing implementation anywhere: the invite link only ever created a
// pending friendship, nothing granted anything when it was accepted. This
// is the real thing: accepting a friend request that came in via someone
// else's invite link (see AuthGate's onAuthStateChanged in
// studlin-app.jsx, which is the only place a friendship doc gets
// source:'invite_link') gives BOTH people a short, deliberately-capped
// Pro trial -- its own plan value ('Pro-Limited', see studlin-app.jsx's
// effectiveProLimit) rather than real 'Pro' with a shorter clock, so
// every per-feature AI cap stays well under real Pro's for the whole
// trial. Short (3 days) and capped specifically so it's cheap even if
// two throwaway accounts referred each other purely to farm it.
const REFERRAL_TRIAL_DAYS = 3;

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

// Real bug found live: Settings' "Payment methods" and "Billing history"
// cards were hardcoded mock data (a fake VISA •••• 4242, four fake
// "Paid" transactions) shown identically to every single account
// regardless of whether they'd ever actually paid -- a beta-trial
// account with zero real charges saw the exact same fake card and fake
// $6.99 "Paid" rows as everyone else. This returns the real thing.
// Subscription invoices only for now, not one-off credit-pack
// purchases -- those PaymentIntents (api/create-intent.js) are created
// without a `customer` attached at all, so they can't be looked up via
// stripeCustomerId the way subscription invoices can; merging them in
// would need a metadata-based Stripe search, a separate, larger piece
// of work. Documented here rather than silently missing them.
async function handleBillingInfo(user, res) {
  if (!db) return res.status(503).json({ error: 'Database unavailable.' });
  try {
    const doc = await db.collection('users').doc(user.uid).get();
    const data = doc.exists ? doc.data() : {};
    const customerId = data.stripeCustomerId;
    if (!customerId) return res.status(200).json({ paymentMethod: null, invoices: [] });

    const [pmList, invoiceList] = await Promise.all([
      stripe.paymentMethods.list({ customer: customerId, type: 'card', limit: 1 }),
      stripe.invoices.list({ customer: customerId, limit: 12 }),
    ]);

    const pm = pmList.data[0];
    const paymentMethod = pm && pm.card ? {
      brand: pm.card.brand,
      last4: pm.card.last4,
      expMonth: pm.card.exp_month,
      expYear: pm.card.exp_year,
    } : null;

    const invoices = invoiceList.data.map((inv) => ({
      date: isoFromStripeSeconds(inv.created),
      description: (inv.lines.data[0] && inv.lines.data[0].description) || 'Pro plan',
      amount: (inv.amount_paid / 100).toFixed(2),
      status: inv.status === 'paid' ? 'Paid' : (inv.status || 'open'),
    }));

    return res.status(200).json({ paymentMethod, invoices });
  } catch (err) {
    console.error('billing info error:', err);
    return res.status(500).json({ error: 'Could not load billing info.' });
  }
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

// Beta tester code redemption -- see BETA_TESTER_EMAILS' own comment for
// why the code alone isn't the real gate. Deliberately does NOT reset
// the expiry clock on a repeat redemption while already active -- that
// would turn "one month" into "however many times you feel like typing
// the word," defeating the entire point of a time-boxed trial. A real
// paying subscriber's plan is never touched here regardless of what
// they type, so this can never accidentally downgrade someone.
async function handleRedeemBeta(user, req, res) {
  if (!db) return res.status(503).json({ error: 'Database unavailable.' });
  const { code } = req.body || {};
  const email = (user.email || '').toLowerCase();
  if (typeof code !== 'string' || code.trim().toLowerCase() !== BETA_CODE) {
    return res.status(400).json({ error: 'That code didn\'t work.' });
  }
  if (!email || !BETA_TESTER_EMAILS.includes(email)) {
    return res.status(403).json({ error: 'That code didn\'t work.' });
  }

  try {
    const userRef = db.collection('users').doc(user.uid);
    const userDoc = await userRef.get();
    const data = userDoc.exists ? userDoc.data() : {};

    if (data.stripeSubscriptionId && data.subscriptionStatus === 'active') {
      return res.status(200).json({ plan: 'Pro', message: 'You already have Pro.' });
    }
    if (data.plan === 'Pro' && data.betaTrialExpiresAt && new Date(data.betaTrialExpiresAt) > new Date()) {
      return res.status(200).json({ plan: 'Pro', betaTrialExpiresAt: data.betaTrialExpiresAt, message: 'Your beta trial is already active.' });
    }

    const betaTrialExpiresAt = new Date(Date.now() + BETA_TRIAL_DAYS * 86400000).toISOString();
    const update = { plan: 'Pro', betaTrialExpiresAt, updatedAt: new Date().toISOString() };
    await userRef.set(update, { merge: true });
    return res.status(200).json({ ...update, message: 'Pro unlocked for ' + BETA_TRIAL_DAYS + ' days.' });
  } catch (err) {
    console.error('beta redeem error:', err);
    return res.status(500).json({ error: 'Could not redeem code. Please try again.' });
  }
}

// Grants the referral trial to both parties of a friendship, once, only
// when it's real: status is genuinely 'accepted' (not just "a pending
// request exists" -- a stranger sending a request and immediately calling
// this must not pay out), it actually came from an invite link (source
// check -- an ordinary organic friend request grants nothing), the
// caller is really one of the two people on it, and it hasn't already
// been granted for this exact friendship (referralTrialGranted flag on
// the friendship doc itself, not on either user, so it's a single shared
// gate regardless of which of the two people's client happens to call
// this first). Never overwrites a real paying subscriber, and never
// shortens an already-longer-lived active trial (this account's own
// existing beta trial, or an earlier still-active referral trial) --
// growth perks are additive, never a downgrade.
async function handleReferralTrialGrant(user, req, res) {
  if (!db) return res.status(200).json({ ok: false, reason: 'admin_unconfigured' });
  const { friendshipId } = req.body || {};
  if (!friendshipId) return res.status(400).json({ error: 'friendshipId is required' });

  try {
    const ref = db.collection('friendships').doc(friendshipId);
    const snap = await ref.get();
    if (!snap.exists) return res.status(404).json({ error: 'Friendship not found' });
    const data = snap.data();

    if (data.senderId !== user.uid && data.receiverId !== user.uid) {
      return res.status(403).json({ error: 'Not a party to this friendship' });
    }
    if (data.status !== 'accepted') return res.status(200).json({ ok: true, granted: false, reason: 'not_accepted' });
    if (data.source !== 'invite_link') return res.status(200).json({ ok: true, granted: false, reason: 'not_a_referral' });
    if (data.referralTrialGranted) return res.status(200).json({ ok: true, granted: false, reason: 'already_granted' });

    // Marked before the per-user grants below (not a transaction -- both
    // parties' clients calling this within moments of each other double-
    // granting themselves a few extra days of a deliberately cheap,
    // capped trial is a low-stakes, self-correcting race, not a real
    // security boundary worth the extra complexity here).
    await ref.set({ referralTrialGranted: true, referralTrialGrantedAt: new Date().toISOString() }, { merge: true });

    const expiresAt = new Date(Date.now() + REFERRAL_TRIAL_DAYS * 86400000).toISOString();
    const grantTo = async (uid) => {
      const userRef = db.collection('users').doc(uid);
      const udoc = await userRef.get();
      const udata = udoc.exists ? udoc.data() : {};
      if (udata.stripeSubscriptionId && udata.subscriptionStatus === 'active') return;
      if (udata.plan === 'Pro' && udata.betaTrialExpiresAt && new Date(udata.betaTrialExpiresAt) > new Date()) return;
      if (udata.plan === 'Pro-Limited' && udata.referralTrialExpiresAt && new Date(udata.referralTrialExpiresAt) > new Date(expiresAt)) return;
      // api/chat.js deducts against this account's real, already-stored
      // `credits` field on every message regardless of plan -- the
      // client's own Pro-Limited cap (see studlin-app.jsx's
      // getCreditLimit) means nothing if the real balance underneath is
      // still whatever was left of the Free 120. Topped up, never down,
      // so an account sitting on unused credits doesn't lose them.
      const credits = Math.max(udata.credits ?? DEFAULT_CREDITS, 300);
      await userRef.set({ plan: 'Pro-Limited', referralTrialExpiresAt: expiresAt, credits, updatedAt: new Date().toISOString() }, { merge: true });
    };
    await Promise.all([grantTo(data.senderId), grantTo(data.receiverId)]);

    return res.status(200).json({ ok: true, granted: true, expiresAt });
  } catch (err) {
    console.error('referral trial grant error:', err);
    return res.status(500).json({ error: 'Could not grant referral trial.' });
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
    try {
      const watch = await registerCalendarWatch(tokens.access_token, user.uid);
      await db.collection('users').doc(user.uid).update({
        googleCalendarChannelId: watch.channelId,
        googleCalendarChannelResourceId: watch.resourceId,
        googleCalendarChannelExpiration: watch.expiration,
      });
    } catch (watchErr) {
      console.warn('google calendar watch registration failed:', watchErr.message);
    }
    return res.status(200).json({ events, lastSyncedAt: now });
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

// Personal Access Token connect -- the richer alternative to the .ics
// Calendar Feed import (api/cal-proxy.js). Unlike a calendar-feed URL
// (fine to keep client-side, see importedCalendars in studlin-app.jsx), a
// Canvas token is a real account credential with broad read access to
// courses, grades, and files -- so it's stored the same way as Google
// Calendar's refresh token: server-side only, on users/{uid}, never
// readable by any client (see firestore.rules users/{userId}: allow read:
// if false).
async function handleCanvasConnect(user, req, res) {
  if (!db) return res.status(503).json({ error: 'Database unavailable.' });
  const { domain: rawDomain, token } = req.body || {};
  // Every failure reason (bad input, DNS failure, resolves to a private/
  // internal address) gets the exact same generic message -- distinct
  // errors here would let repeated attempts be used to map out which
  // internal hosts exist, exactly what this check exists to prevent.
  const resolved = await resolveCanvasDomain(rawDomain);
  if (!resolved.ok) return res.status(400).json({ error: "Couldn't verify that Canvas domain. Double-check it, or use the calendar feed link instead." });
  const domain = resolved.domain;
  if (!token || !String(token).trim()) return res.status(400).json({ error: 'Missing access token.' });

  try {
    const events = await fetchAllCanvasData(domain, String(token).trim());
    const now = new Date().toISOString();
    await db.collection('users').doc(user.uid).set({
      canvasDomain: domain,
      canvasAccessToken: String(token).trim(),
      canvasConnectedAt: now,
      canvasSyncedEvents: events,
      canvasLastSyncedAt: now,
      canvasLastSyncError: null,
    }, { merge: true });
    return res.status(200).json({ events, lastSyncedAt: now });
  } catch (err) {
    console.error('canvas connect error:', err);
    return res.status(err.status && err.status < 500 ? err.status : 500).json({ error: err.message || 'Could not connect to Canvas. Please try again.' });
  }
}

// Live re-fetch (not a cached read like Google Calendar's own pull) -- a
// stored Canvas token has no OAuth popup to hang on, so unlike
// pullGoogleCalendarIfConnected there's no downside to just calling Canvas
// again on every resync. Shared by the manual per-item "sync now" and the
// once-a-day auto-resync, same as resyncCalendar already does for every
// .ics-based import in studlin-app.jsx.
async function handleCanvasPull(user, res) {
  if (!db) return res.status(503).json({ error: 'Database unavailable.' });
  try {
    const doc = await db.collection('users').doc(user.uid).get();
    const data = doc.exists ? doc.data() : {};
    if (!data.canvasAccessToken) return res.status(200).json({ connected: false, events: [] });
    try {
      // Re-verified on every pull, not just at connect time -- closes the
      // gap where a custom domain's DNS could be pointed at an internal
      // address sometime after the original connect (DNS rebinding).
      // instructure.com domains skip the network round trip either way
      // (see resolveCanvasDomain).
      const resolved = await resolveCanvasDomain(data.canvasDomain);
      if (!resolved.ok) throw new Error("Couldn't verify the Canvas domain on file. Try reconnecting.");
      const events = await fetchAllCanvasData(resolved.domain, data.canvasAccessToken);
      const now = new Date().toISOString();
      await db.collection('users').doc(user.uid).update({
        canvasSyncedEvents: events,
        canvasLastSyncedAt: now,
        canvasLastSyncError: null,
      });
      return res.status(200).json({ connected: true, events, lastSyncedAt: now, lastSyncError: null });
    } catch (syncErr) {
      await db.collection('users').doc(user.uid).update({ canvasLastSyncError: syncErr.message || 'Sync failed' }).catch(() => {});
      return res.status(200).json({ connected: true, events: data.canvasSyncedEvents || [], lastSyncedAt: data.canvasLastSyncedAt || null, lastSyncError: syncErr.message || 'Sync failed' });
    }
  } catch (err) {
    console.error('canvas pull error:', err);
    return res.status(500).json({ error: 'Could not load synced Canvas data.' });
  }
}

async function handleCanvasDisconnect(user, res) {
  if (!db) return res.status(503).json({ error: 'Database unavailable.' });
  try {
    await db.collection('users').doc(user.uid).update({
      canvasDomain: admin.firestore.FieldValue.delete(),
      canvasAccessToken: admin.firestore.FieldValue.delete(),
      canvasConnectedAt: admin.firestore.FieldValue.delete(),
      canvasSyncedEvents: admin.firestore.FieldValue.delete(),
      canvasLastSyncedAt: admin.firestore.FieldValue.delete(),
      canvasLastSyncError: admin.firestore.FieldValue.delete(),
    });
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('canvas disconnect error:', err);
    return res.status(500).json({ error: 'Could not disconnect Canvas.' });
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

  const uid = user.uid;
  const userRef = db.collection('users').doc(uid);

  // Every step below is secondary/shared-record cleanup (billing, other
  // users' friend lists, chat rooms, username reservations, etc). None of
  // it should be able to block what actually constitutes "the account is
  // deleted" -- previously this whole function was one try/catch, so a
  // single failure ANYWHERE (e.g. a transient Stripe error) aborted before
  // ever reaching userRef.delete()/auth.deleteUser() below, while the
  // client only saw a generic error and otherwise left everything
  // (Firebase Auth session, all of Firestore) fully intact -- a silently
  // failed "delete" that looks identical to a real one from the student's
  // side, and re-signing-in afterward (Google OAuth doesn't distinguish
  // "new" from "returning") lands back in the exact same never-deleted
  // account, onboarding and all. Each step is now isolated: a real failure
  // is logged and reported back in cleanupErrors, but never stops the
  // steps after it, including the critical ones at the end.
  const cleanupErrors = [];
  const safeStep = async (label, fn) => {
    try {
      return await fn();
    } catch (err) {
      console.error(`delete account cleanup step "${label}" failed:`, err);
      cleanupErrors.push(label);
      return null;
    }
  };

  const userDoc = await userRef.get().catch(() => null);
  const userData = userDoc && userDoc.exists ? userDoc.data() : {};

  await safeStep('stripe', () => cancelStripe(userData));

  const stats = {
    courses: (await safeStep('courses', () => deleteQuery(db.collection('courses').where('userId', '==', uid)))) || 0,
    assignments: (await safeStep('assignments', () => deleteQuery(db.collection('assignments').where('userId', '==', uid)))) || 0,
    sentFriendships: (await safeStep('sentFriendships', () => deleteQuery(db.collection('friendships').where('senderId', '==', uid)))) || 0,
    receivedFriendships: (await safeStep('receivedFriendships', () => deleteQuery(db.collection('friendships').where('receiverId', '==', uid)))) || 0,
    usernames: (await safeStep('usernames', () => deleteQuery(db.collection('usernames').where('uid', '==', uid)))) || 0,
    sharedChats: 0,
    chatRooms: (await safeStep('chatRooms', () => removeFromChatRooms(uid))) || 0,
  };

  for (const field of ['uid', 'userId', 'ownerUid', 'createdBy']) {
    stats.sharedChats += (await safeStep(`sharedChats:${field}`, () => deleteQuery(db.collection('shared_chats').where(field, '==', uid)))) || 0;
  }

  await safeStep('profiles', () => db.collection('profiles').doc(uid).delete());
  await safeStep('emailOtps', () => db.collection('emailOtps').doc(uid).delete());

  // The two critical steps -- deliberately NOT wrapped in safeStep. If
  // either genuinely fails, the account is NOT deleted and the student
  // needs to see a real error, not a false "success" toast.
  // deleteDocTree (not a bare userRef.delete()) because Firestore never
  // cascade-deletes subcollections on its own -- a plain userRef.delete()
  // silently orphans users/{uid}/events, notes, decks, timerLogs,
  // practiceExams, and _sync forever (confirmed: firestore.rules denies
  // client-side delete on every one of those, so nothing else can ever
  // clean them up either). Same recursive-delete helper this file already
  // trusts for chat rooms below.
  try {
    await deleteDocTree(userRef);
    await auth.deleteUser(uid).catch((err) => {
      if (err && err.code !== 'auth/user-not-found') throw err;
    });
  } catch (err) {
    console.error('delete account error (critical step):', err);
    return res.status(500).json({ error: 'Could not fully delete your account. Please contact support so we can finish removing it.' });
  }

  return res.status(200).json({ ok: true, stats, cleanupErrors, displayName: DELETED_USER_NAME });
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
    if (action === 'canvas-connect') return handleCanvasConnect(user, req, res);
    if (action === 'canvas-pull') return handleCanvasPull(user, res);
    if (action === 'canvas-disconnect') return handleCanvasDisconnect(user, res);
    if (action === 'redeem-beta') return handleRedeemBeta(user, req, res);
    if (action === 'accept-friend-referral') return handleReferralTrialGrant(user, req, res);
    if (action === 'billing-info') return handleBillingInfo(user, res);
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
    // Self-expiring beta trial (see handleRedeemBeta) -- checked on every
    // profile read rather than a cron job, same "compute on read" pattern
    // the client side already uses for its own cooldown timestamps.
    // Never touches a real paying subscriber (stripeSubscriptionId gates
    // it out) even if betaTrialExpiresAt happens to still be on their doc
    // from before they subscribed for real.
    let plan = data.plan || 'Free';
    if (plan === 'Pro' && data.betaTrialExpiresAt && !data.stripeSubscriptionId && new Date(data.betaTrialExpiresAt) <= new Date()) {
      plan = 'Free';
      await ref.set({ plan: 'Free' }, { merge: true });
    }
    // Self-expiring referral trial -- same "compute on read" pattern as
    // the beta trial just above, checked independently since a user could
    // in principle have redeemed a beta code before their referral trial
    // (already handled -- grantTo above never touches an active beta
    // trial) or after it expired (this is the only remaining path).
    if (plan === 'Pro-Limited' && data.referralTrialExpiresAt && new Date(data.referralTrialExpiresAt) <= new Date()) {
      plan = 'Free';
      await ref.set({ plan: 'Free' }, { merge: true });
    }
    return res.status(200).json({
      plan,
      credits: data.credits ?? DEFAULT_CREDITS,
      email: data.email || user.email || null,
      betaTrialExpiresAt: data.betaTrialExpiresAt || null,
      referralTrialExpiresAt: data.referralTrialExpiresAt || null,
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
