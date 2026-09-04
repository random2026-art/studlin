const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { setCors, verifyAuth } = require('./_lib/auth');
const { withSentry } = require('./_lib/sentry');
const { checkRateLimit } = require('./_lib/rateLimit');

// Subscription price IDs — merged in from api/checkout.js so subscription
// creation and one-off payment intents share one function (Vercel Hobby's
// 12-function cap; see vercel.json).
//
// 2026-08-20: real live-mode Price IDs from the Stripe dashboard, created
// for the 2026-08-10 pricing pass (Pro: $6.99/mo, $4.99/mo billed
// annually / $59.88/yr).
const PRICES = {
  pro_monthly: 'price_1TkZlWFJjTMWMaWhqfDLfirV', // $6.99/mo
  pro_annual: 'price_1Tkbr1FJjTMWMaWhC4TyEj4F', // $59.88/yr ($4.99/mo)
};

module.exports = withSentry(async (req, res) => {
  setCors(req, res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const user = await verifyAuth(req);
  if (!user) return res.status(401).json({ error: 'Sign in required.' });

  const { allowed } = await checkRateLimit(`create-intent:${user.uid}`, 10, 15 * 60 * 1000);
  if (!allowed) return res.status(429).json({ error: 'Too many requests. Please try again later.' });

  try {
    const { mode, credits, customAmount, plan, country, paymentMethodId } = req.body;

    if (mode === 'setup') {
      const setupIntent = await stripe.setupIntents.create({
        payment_method_types: ['card'],
        metadata: { firebase_uid: user.uid },
      });
      return res.status(200).json({ clientSecret: setupIntent.client_secret });
    }

    if (mode === 'payment') {
      // Credit top-ups were disabled 2026-08-26 in the client (every AI
      // gate checks getPlan()==="Pro" outright, not credit balance, so a
      // completed purchase unlocked nothing) -- but this endpoint itself
      // was left able to actually charge a card for it. Found live 2026-09-04
      // via a leftover "Buy credit packs" link in Settings still pointing at
      // checkout.html?credits=500. Blocking server-side too so no client
      // entry point (old link, bookmark, direct call) can charge real money
      // for a feature that doesn't unlock anything.
      return res.status(400).json({ error: 'Credit purchases are not available. Upgrade to Pro for unlimited AI access instead.' });
    }

    if (mode === 'subscription') {
      const priceId = PRICES[plan];
      if (!priceId) return res.status(400).json({ error: 'Invalid plan.' });
      if (!paymentMethodId) return res.status(400).json({ error: 'Payment method is required.' });

      const customer = await stripe.customers.create({
        email: user.email,
        name: user.name || undefined,
        address: { country: country || undefined },
        payment_method: paymentMethodId,
        invoice_settings: { default_payment_method: paymentMethodId },
        metadata: { plan, firebase_uid: user.uid },
      });

      // No trial (2026-08-10 pricing pass -- pure freemium instead: the
      // free tier itself is the "try before you buy," Pro charges
      // immediately on signup).
      const subscription = await stripe.subscriptions.create({
        customer: customer.id,
        items: [{ price: priceId }],
        default_payment_method: paymentMethodId,
        metadata: { firebase_uid: user.uid },
      });

      return res.status(200).json({ subscriptionId: subscription.id, status: subscription.status });
    }

    return res.status(400).json({ error: 'Invalid mode. Use "setup", "payment", or "subscription".' });
  } catch (err) {
    console.error('Payment intent error:', err);
    res.status(500).json({ error: 'Payment processing failed. Please try again.' });
  }
});
