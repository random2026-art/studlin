const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { db } = require('./_lib/firebase-admin');
const { setCors, verifyAuth } = require('./_lib/auth');
const { checkRateLimit } = require('./_lib/rateLimit');

const PRICES = {
  pro_monthly: 'price_1TkZlWFJjTMWMaWhqfDLfirV',
  pro_annual: 'price_1Tkbr1FJjTMWMaWhC4TyEj4F',
  max_monthly: 'price_1TkZmXFJjTMWMaWhX2tnwQ89',
  max_annual: 'price_1Tkbr1FJjTMWMaWhzdBVVWO6',
};

module.exports = async (req, res) => {
  setCors(req, res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const user = await verifyAuth(req);
  if (!user) return res.status(401).json({ error: 'Sign in required.' });

  const { allowed } = await checkRateLimit(`checkout:${user.uid}`, 5, 15 * 60 * 1000);
  if (!allowed) return res.status(429).json({ error: 'Too many requests. Please try again later.' });

  try {
    const { plan, country, paymentMethodId } = req.body;
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

    const subscription = await stripe.subscriptions.create({
      customer: customer.id,
      items: [{ price: priceId }],
      trial_period_days: 7,
      default_payment_method: paymentMethodId,
      metadata: { firebase_uid: user.uid },
    });

    res.status(200).json({ subscriptionId: subscription.id, status: subscription.status });
  } catch (err) {
    console.error('Checkout error:', err);
    res.status(500).json({ error: 'Payment processing failed. Please try again.' });
  }
};
