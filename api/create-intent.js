const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const CREDIT_PACKS = {
  150:  499,
  500:  1499,
  1000: 2499,
  3000: 5999,
};

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { mode, credits, customAmount } = req.body;

    if (mode === 'setup') {
      const setupIntent = await stripe.setupIntents.create({
        automatic_payment_methods: { enabled: true },
      });
      return res.status(200).json({ clientSecret: setupIntent.client_secret });
    }

    if (mode === 'payment') {
      let amountCents;
      if (customAmount) {
        const dollars = Math.floor(+customAmount);
        if (dollars < 5 || dollars > 100000) return res.status(400).json({ error: 'Amount must be $5–$100,000.' });
        amountCents = dollars * 100;
      } else {
        amountCents = CREDIT_PACKS[credits];
        if (!amountCents) return res.status(400).json({ error: 'Invalid credit pack.' });
      }

      const paymentIntent = await stripe.paymentIntents.create({
        amount: amountCents,
        currency: 'usd',
        automatic_payment_methods: { enabled: true },
        metadata: { type: 'credit_topup', credits: String(credits || Math.floor((+customAmount) * 30)) },
      });
      return res.status(200).json({ clientSecret: paymentIntent.client_secret });
    }

    return res.status(400).json({ error: 'Invalid mode. Use "setup" or "payment".' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
