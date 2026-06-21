const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const PRICES = {
  pro_monthly: 'price_1TkZlWFJjTMWMaWhqfDLfirV',
  pro_annual: 'price_1Tkbr1FJjTMWMaWhC4TyEj4F',
  max_monthly: 'price_1TkZmXFJjTMWMaWhX2tnwQ89',
  max_annual: 'price_1Tkbr1FJjTMWMaWhzdBVVWO6',
};

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { plan } = req.body;
    const priceId = PRICES[plan];
    if (!priceId) return res.status(400).json({ error: 'Invalid plan. Use: pro_monthly, pro_annual, max_monthly, max_annual' });

    const customer = await stripe.customers.create();

    const subscription = await stripe.subscriptions.create({
      customer: customer.id,
      items: [{ price: priceId }],
      payment_behavior: 'default_incomplete',
      payment_settings: { save_default_payment_method: 'on_subscription' },
      expand: ['latest_invoice.payment_intent'],
    });

    res.status(200).json({
      subscriptionId: subscription.id,
      clientSecret: subscription.latest_invoice.payment_intent.client_secret,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
