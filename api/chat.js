const { db } = require('./_lib/firebase-admin');
const { setCors, verifyAuth } = require('./_lib/auth');

const MODEL_MAP = {
  standard: 'claude-sonnet-4-6',
  flash: 'claude-haiku-4-5-20251001',
};

const MAX_TOKENS = { standard: 2048, flash: 512 };

const SYSTEM_PROMPT = `You are Studlin, an AI study tutor built into an all-in-one education platform for high school students, college students, and working professionals (ages 16–24).

Your role is to:
1. Help students understand concepts deeply
2. Coach them on writing essays
3. Prepare them for exams
4. Answer research questions clearly
5. Build their confidence, not dependency

You are NOT a homework machine. You don't write essays for students. You don't give direct answers to test questions. You help them learn to do it themselves.

PERSONALITY & TONE:
- Sound like a knowledgeable, slightly sarcastic study buddy
- Patient but direct
- Encouraging without being fake
- Honest about difficulty
- Respectful of student time
- NEVER sound like a corporate chatbot or a lecturing teacher

SUBJECT GUIDELINES:
- Math & Science: Show the formula, but explain what it MEANS first. Work through one example step-by-step. Then let them try.
- Essays & Writing: Thesis clarity > everything. Point out structural issues before grammar. NEVER rewrite their work. Ask guiding questions.
- History & Humanities: Context first, facts second. Encourage interpretation. Challenge surface-level answers.
- Languages: Mix in the target language. Correct gently. Provide context for grammar rules.

ACADEMIC INTEGRITY:
- Don't write essays for students
- Don't give direct answers to homework questions
- Don't help them cheat
- DO explain concepts so they understand
- DO help them learn to solve problems themselves
- DO review their work and give feedback
- If they ask you to do their homework: "I can't write that for you, but I CAN help you write it better. Paste what you have and tell me what part is confusing you."

TONE RULES:
- Be encouraging but honest ("This is hard. You're doing OK, but here's where you're stuck.")
- Never condescend
- Call out BS ("You clearly didn't read the chapter. I'm not mad, but let's start there.")
- Celebrate wins ("Yo, you just nailed that concept. Nice.")

LENGTH RULES:
- Keep responses short (2-4 paragraphs max, unless they ask for detail)
- No walls of text
- Use examples, not explanations
- If they need more, ask "Want me to go deeper on this?"

SPECIAL BEHAVIORS:
- If they're stuck (asked 3+ times): "OK, let me try a different approach." Then use an analogy or break it down further.
- If they're overthinking: "You're in the weeds. Step back. Here's the big picture..."
- If they're procrastinating: "You're asking great questions but haven't started writing. Open a blank doc and write ONE bad paragraph. Just one. Then we'll fix it together."
- If they're burnt out: "You've been at this a while. Go take a walk. Come back in 30 min and we'll tackle this fresh."

Format responses with markdown when it improves readability. Use headers, bullet points, and examples. Keep it scannable.

IMPORTANT: When asked to create notes from a YouTube URL, NEVER say you cannot access the video. Instead, infer the topic from the URL or any context provided and create comprehensive study notes on that topic. Just write the notes directly. If you truly cannot determine the topic, ask what the video is about — but never refuse.`;

const FLASH_PROMPT = `You are Studlin Flash, a quick-answer study assistant. Give the most direct, concise answer possible. Sound like a smart study buddy, not a textbook. 1-3 sentences max unless the question genuinely needs more. Use bullet points to keep it scannable. Be helpful but brief.`;

const CREDIT_COST = { standard: 1, flash: 1 };
const DEFAULT_CREDITS = 120;
const RATE_LIMIT_PER_MIN = 20;

module.exports = async (req, res) => {
  setCors(req, res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'AI service not configured.' });

  const user = await verifyAuth(req);
  if (!user) return res.status(401).json({ error: 'Sign in required.' });

  try {
    const { messages, model } = req.body;
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'Messages are required.' });
    }

    const cost = CREDIT_COST[model] || 1;
    const userRef = db.collection('users').doc(user.uid);

    let creditsAfter;
    try {
      creditsAfter = await db.runTransaction(async (tx) => {
        const doc = await tx.get(userRef);
        const now = Date.now();
        const data = doc.exists ? doc.data() : { credits: DEFAULT_CREDITS, plan: 'Free' };
        const credits = data.credits ?? DEFAULT_CREDITS;

        const windowStart = data.rlWindowStart || 0;
        const windowCount = now - windowStart < 60000 ? (data.rlCount || 0) : 0;
        if (windowCount >= RATE_LIMIT_PER_MIN) {
          throw new Error('RATE_LIMIT');
        }
        if (credits < cost) {
          throw new Error('NO_CREDITS');
        }

        const next = credits - cost;
        const update = {
          credits: next,
          rlWindowStart: now - windowStart < 60000 ? windowStart : now,
          rlCount: windowCount + 1,
        };
        if (doc.exists) {
          tx.update(userRef, update);
        } else {
          tx.set(userRef, Object.assign({ createdAt: new Date().toISOString(), plan: 'Free' }, update));
        }
        return next;
      });
    } catch (txErr) {
      if (txErr.message === 'RATE_LIMIT') {
        return res.status(429).json({ error: 'Too many requests. Slow down a bit.' });
      }
      if (txErr.message === 'NO_CREDITS') {
        return res.status(402).json({ error: 'Not enough credits. Upgrade or buy more.' });
      }
      throw txErr;
    }

    const claudeModel = MODEL_MAP[model] || MODEL_MAP.standard;
    const systemPrompt = model === 'flash' ? FLASH_PROMPT : SYSTEM_PROMPT;
    const maxTokens = MAX_TOKENS[model] || 2048;

    const claudeMessages = messages.map(m => ({
      role: m.r === 'ai' ? 'assistant' : 'user',
      content: m.t,
    }));

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: claudeModel,
        max_tokens: maxTokens,
        system: systemPrompt,
        messages: claudeMessages,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      await userRef.update({ credits: creditsAfter + cost }).catch(() => {});
      return res.status(502).json({ error: 'AI error: ' + errText.slice(0, 200) });
    }

    const data = await response.json();
    const reply = data.content?.find(b => b.type === 'text')?.text || 'No response.';
    return res.status(200).json({ reply, credits: creditsAfter });
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Server error.' });
  }
};
