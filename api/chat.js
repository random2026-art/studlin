const { db } = require('./_lib/firebase-admin');
const { setCors, verifyAuth } = require('./_lib/auth');

const MODEL_MAP = {
  standard: 'claude-sonnet-4-6',
  flash: 'claude-haiku-4-5',
};

const MODEL_CONFIG = {
  standard: { max_tokens: 2048 },
  flash:    { max_tokens: 512 },
};

const SYSTEM_PROMPTS = {
  standard: `You are Studlin, an AI study assistant built for students. You help with homework, explain concepts, solve problems step by step, and provide thorough academic support. Be clear, educational, and show your reasoning when solving problems. Use examples when helpful. Format responses with markdown — use headers, bullet points, numbered lists, and code blocks when they improve readability. Be thorough but organized. If the student asks a simple question, keep it concise. If they ask something complex, break it down step by step and explain WHY each step matters.`,
  flash: `You are Studlin Flash, a quick-answer AI assistant for students. Give the most direct, concise answer possible. Skip lengthy explanations unless asked. Aim for 1-3 sentences when possible. If the question needs a longer answer, use bullet points to keep it scannable.`,
};

const CREDIT_COST = { standard: 1, flash: 1 };
const MAX_MESSAGES = 50;
const MAX_MESSAGE_LENGTH = 50000;
const DEFAULT_CREDITS = 120;

module.exports = async (req, res) => {
  setCors(req, res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const user = await verifyAuth(req);

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'AI service not configured.' });

  try {
    const { messages, model: modelId } = req.body;
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'Messages are required.' });
    }
    if (messages.length > MAX_MESSAGES) {
      return res.status(400).json({ error: 'Too many messages in conversation.' });
    }
    for (const m of messages) {
      if (!m || typeof m.t !== 'string' || m.t.length > MAX_MESSAGE_LENGTH) {
        return res.status(400).json({ error: 'Invalid or oversized message.' });
      }
    }

    const cost = CREDIT_COST[modelId] || 1;
    let newCredits = null;
    let creditsBefore = null;

    if (user && db) {
      const userRef = db.collection('users').doc(user.uid);
      newCredits = await db.runTransaction(async (tx) => {
        const doc = await tx.get(userRef);
        const data = doc.exists ? doc.data() : { credits: DEFAULT_CREDITS, plan: 'Free' };
        creditsBefore = data.credits ?? DEFAULT_CREDITS;
        if (creditsBefore < cost) throw new Error('NOT_ENOUGH_CREDITS');
        const updated = creditsBefore - cost;
        if (doc.exists) {
          tx.update(userRef, { credits: updated });
        } else {
          tx.set(userRef, { credits: updated, plan: 'Free', createdAt: new Date().toISOString() });
        }
        return updated;
      });
    }

    const claudeModel = MODEL_MAP[modelId] || MODEL_MAP.standard;
    const systemPrompt = SYSTEM_PROMPTS[modelId] || SYSTEM_PROMPTS.standard;
    const config = MODEL_CONFIG[modelId] || MODEL_CONFIG.standard;

    const claudeMessages = messages.map(m => ({
      role: m.r === 'ai' ? 'assistant' : 'user',
      content: m.t,
    }));

    const body = {
      model: claudeModel,
      max_tokens: config.max_tokens,
      system: systemPrompt,
      messages: claudeMessages,
    };

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      if (user && db && creditsBefore !== null) {
        try { await db.collection('users').doc(user.uid).update({ credits: creditsBefore }); } catch(e) {}
      }
      const errText = await response.text();
      let detail = 'AI service error';
      try { detail = JSON.parse(errText).error?.message || errText; } catch(e) { detail = errText; }
      return res.status(502).json({ error: detail, credits: creditsBefore });
    }

    const data = await response.json();
    const textBlock = data.content?.find(b => b.type === 'text');
    const reply = textBlock?.text || 'Sorry, I couldn\'t generate a response.';

    return res.status(200).json({ reply, credits: newCredits });
  } catch (err) {
    if (err.message === 'NOT_ENOUGH_CREDITS') {
      return res.status(402).json({ error: 'Not enough credits. Buy more or switch to a lighter model.' });
    }
    console.error('Chat error:', err);
    return res.status(500).json({ error: 'Something went wrong.' });
  }
};
