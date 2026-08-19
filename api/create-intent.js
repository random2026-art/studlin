const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { setCors, verifyAuth } = require('./_lib/auth');
const { withSentry } = require('./_lib/sentry');
const { checkRateLimit } = require('./_lib/rateLimit');

const CREDIT_PACKS = {
  150:  499,
  500:  1499,
  1000: 2499,
  3000: 5999,
};

// Subscription price IDs — merged in from api/checkout.js so subscription
// creation and one-off payment intents share one function (Vercel Hobby's
// 12-function cap; see vercel.json).
//
// 2026-08-10 pricing pass: collapsed Free/Pro/Max down to Free/Pro, new
// Pro price ($6.99/mo, $4.99/mo billed annually). Deliberately null, not
// the old $9.99/$7.99 Price IDs -- neither Claude nor this codebase can
// create real Stripe Price objects, and silently reusing the old ones
// would charge $9.99 while every price shown to the user says $6.99.
// null makes the `if (!priceId)` check below fail cleanly with "Invalid
// plan" instead. Create two new Prices in the Stripe dashboard ($6.99/mo
// recurring monthly, $59.88/yr recurring annual) and paste their IDs in
// here before checkout will actually work again.
const PRICES = {
  pro_monthly: null, // TODO: new $6.99/mo Price ID
  pro_annual: null, // TODO: new $4.99/mo ($59.88/yr) Price ID
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
      let amountCents, creditCount;
      if (customAmount) {
        const dollars = Math.floor(Number(customAmount));
        if (!Number.isFinite(dollars) || dollars < 5 || dollars > 100000) {
          return res.status(400).json({ error: 'Amount must be a whole number between $5 and $100,000.' });
        }
        amountCents = dollars * 100;
        creditCount = dollars * 30;
      } else {
        amountCents = CREDIT_PACKS[credits];
        if (!amountCents) return res.status(400).json({ error: 'Invalid credit pack.' });
        creditCount = credits;
      }

      const paymentIntent = await stripe.paymentIntents.create({
        amount: amountCents,
        currency: 'usd',
        payment_method_types: ['card'],
        metadata: {
          type: 'credit_topup',
          credits: String(creditCount),
          firebase_uid: user.uid,
        },
      });
      return res.status(200).json({ clientSecret: paymentIntent.client_secret });
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
