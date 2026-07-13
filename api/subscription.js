const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { db } = require('./_lib/firebase-admin');
const { setCors, verifyAuth } = require('./_lib/auth');
const { withSentry } = require('./_lib/sentry');

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

module.exports = withSentry(async (req, res) => {
  setCors(req, res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const user = await verifyAuth(req);
  if (!user) return res.status(401).json({ error: 'Sign in required.' });
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
});
