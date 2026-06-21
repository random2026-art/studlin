const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const PACKS = {
  150:  { amount: 499,  label: '150 AI Credits' },
  500:  { amount: 1499, label: '500 AI Credits' },
  1000: { amount: 2499, label: '1,000 AI Credits' },
  3000: { amount: 5999, label: '3,000 AI Credits' },
};

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { credits, customAmount } = req.body;

    let amountCents, label;

    if (customAmount) {
      const dollars = Math.floor(+customAmount);
      if (dollars < 5) return res.status(400).json({ error: 'Minimum purchase is $5.' });
      if (dollars > 100000) return res.status(400).json({ error: 'Maximum purchase is $100,000.' });
      amountCents = dollars * 100;
      label = (dollars * 30).toLocaleString() + ' AI Credits';
    } else {
      const pack = PACKS[credits];
      if (!pack) return res.status(400).json({ error: 'Invalid credit pack.' });
      amountCents = pack.amount;
      label = pack.label;
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: { name: label, description: 'Studlin AI credit top-up' },
          unit_amount: amountCents,
        },
        quantity: 1,
      }],
      success_url: req.headers.origin + '/Studlin%20Web%20App.html?credits=success',
      cancel_url: req.headers.origin + '/Studlin%20Web%20App.html?credits=cancelled',
    });

    res.status(200).json({ url: session.url });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
