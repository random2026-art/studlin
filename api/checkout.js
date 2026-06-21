const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const PRICES = {
  pro_monthly: 'price_1TkZlWFJjTMWMaWhqfDLfirV',
  max_monthly: 'price_1TkZmXFJjTMWMaWhX2tnwQ89',
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
    if (!priceId) return res.status(400).json({ error: 'Invalid plan' });

    const origin = req.headers.origin || req.headers.referer || 'https://studlin.vercel.app';

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${origin}/Studlin Web App.html?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/Studlin Onboarding.html`,
    });

    res.status(200).json({ url: session.url });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
