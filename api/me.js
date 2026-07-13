const { db } = require('./_lib/firebase-admin');
const { setCors, verifyAuth } = require('./_lib/auth');
const { withSentry } = require('./_lib/sentry');

// Source of truth for the Free plan's monthly AI chat allowance — this is
// what actually creates the user doc on first load. Must match
// api/chat.js's DEFAULT_CREDITS (a same-value fallback for the rare case a
// chat request beats the profile fetch) and studlin-app.jsx's
// getCreditLimit() Free branch.
const DEFAULT_CREDITS = 120;

module.exports = withSentry(async (req, res) => {
  setCors(req, res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const user = await verifyAuth(req);
  if (!user) return res.status(401).json({ error: 'Sign in required.' });

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
      return res.status(200).json(data);
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
    });
  } catch (err) {
    console.warn('Profile lookup unavailable, returning defaults:', err.message);
    return res.status(200).json({ plan: 'Free', credits: DEFAULT_CREDITS, email: user.email || null });
  }
});
