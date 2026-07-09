const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { db } = require('./_lib/firebase-admin');
const { Sentry, withSentry } = require('./_lib/sentry');

const PLAN_MAP = {
  price_1TkZlWFJjTMWMaWhqfDLfirV: 'Pro',
  price_1Tkbr1FJjTMWMaWhC4TyEj4F: 'Pro',
  price_1TkZmXFJjTMWMaWhX2tnwQ89: 'Max',
  price_1Tkbr1FJjTMWMaWhzdBVVWO6: 'Max',
};

const PLAN_CREDITS = { Pro: 200, Max: 500 };

async function handlePaymentSucceeded(intent) {
  const uid = intent.metadata?.firebase_uid;
  if (!uid) return;
  if (intent.metadata?.type !== 'credit_topup') return;

  const credits = parseInt(intent.metadata.credits, 10);
  if (!Number.isFinite(credits) || credits <= 0) return;

  const userRef = db.collection('users').doc(uid);
  await db.runTransaction(async (tx) => {
    const doc = await tx.get(userRef);
    const current = doc.exists ? (doc.data().credits || 0) : 0;
    if (doc.exists) {
      tx.update(userRef, { credits: current + credits });
    } else {
      tx.set(userRef, { credits: current + credits, plan: 'Free', createdAt: new Date().toISOString() });
    }
  });
}

async function handleSubscriptionUpdated(subscription) {
  const uid = subscription.metadata?.firebase_uid;
  if (!uid) return;

  const item = subscription.items?.data?.[0];
  const priceId = item?.price?.id;
  const plan = PLAN_MAP[priceId] || 'Free';
  const active = ['active', 'trialing'].includes(subscription.status);

  const userRef = db.collection('users').doc(uid);
  await db.runTransaction(async (tx) => {
    const doc = await tx.get(userRef);
    const data = doc.exists ? doc.data() : {};
    const update = {
      plan: active ? plan : 'Free',
      stripeSubscriptionId: subscription.id,
      stripeCustomerId: subscription.customer,
    };
    if (doc.exists) {
      tx.update(userRef, update);
    } else {
      tx.set(userRef, { credits: 120, createdAt: new Date().toISOString(), ...update });
    }
  });
}

async function handleInvoicePaid(invoice) {
  const sub = invoice.subscription;
  if (!sub) return;
  const subscription = await stripe.subscriptions.retrieve(sub);
  const uid = subscription.metadata?.firebase_uid;
  if (!uid) return;

  const priceId = subscription.items?.data?.[0]?.price?.id;
  const plan = PLAN_MAP[priceId];
  const monthlyCredits = PLAN_CREDITS[plan];
  if (!monthlyCredits) return;

  const userRef = db.collection('users').doc(uid);
  await db.runTransaction(async (tx) => {
    const doc = await tx.get(userRef);
    const current = doc.exists ? (doc.data().credits || 0) : 0;
    if (doc.exists) {
      tx.update(userRef, { credits: current + monthlyCredits });
    } else {
      tx.set(userRef, { credits: monthlyCredits, plan: plan, createdAt: new Date().toISOString() });
    }
  });
}

async function handleSubscriptionDeleted(subscription) {
  const uid = subscription.metadata?.firebase_uid;
  if (!uid) return;

  const userRef = db.collection('users').doc(uid);
  const doc = await userRef.get();
  if (doc.exists) {
    await userRef.update({ plan: 'Free', stripeSubscriptionId: null });
  }
}

const handler = withSentry(async (req, res) => {
  if (req.method !== 'POST') return res.status(405).end();

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error('STRIPE_WEBHOOK_SECRET not configured');
    return res.status(500).end();
  }

  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const rawBody = Buffer.concat(chunks);

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      rawBody,
      req.headers['stripe-signature'],
      webhookSecret
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).json({ error: 'Invalid signature.' });
  }

  try {
    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentSucceeded(event.data.object);
        break;
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object);
        break;
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object);
        break;
      case 'invoice.paid':
        await handleInvoicePaid(event.data.object);
        break;
    }
  } catch (err) {
    console.error('Webhook handler error:', err);
    Sentry.captureException(err);
    return res.status(500).json({ error: 'Webhook processing failed.' });
  }

  res.status(200).json({ received: true });
});

// Vercel serverless: raw body needed for Stripe signature verification.
// Must be set on the exported function AFTER withSentry() wraps it —
// the previous order here (module.exports.config = ... before
// module.exports = async (req,res) => {...}) attached .config to a
// throwaway object that got discarded the moment module.exports was
// reassigned, so Vercel never actually saw bodyParser:false. That meant
// the default JSON body-parser was consuming the request stream before
// this handler could read it raw, which silently failed every webhook's
// signature check — i.e. Stripe payments were very likely never
// actually granting credits/plan upgrades in production.
handler.config = { api: { bodyParser: false } };
module.exports = handler;
