const MODEL_MAP = {
  standard: 'claude-sonnet-4-6',
  pro: 'claude-sonnet-4-6',
  reason: 'claude-sonnet-4-6',
  flash: 'claude-haiku-4-5',
};

const SYSTEM_PROMPTS = {
  standard: `You are Studlin, an AI study assistant for students. You help with homework, explain concepts, and provide academic support. Be clear, concise, and educational. Use examples when helpful. Format responses with markdown when it improves readability. Keep responses focused and under 400 words unless the student asks for more detail.`,
  pro: `You are Studlin Pro, an advanced AI study assistant. You provide deeper analysis, more thorough explanations, and can handle complex multi-step problems. Show your reasoning. Use markdown formatting. Be thorough but organized — use headers, bullet points, and code blocks when appropriate.`,
  reason: `You are Studlin Reasoning, a step-by-step AI tutor. Break every problem into clear numbered steps. Show all work. Explain WHY each step matters, not just what to do. Use markdown formatting with headers and numbered lists. Think through the problem carefully before answering.`,
  flash: `You are Studlin Flash, a quick-answer AI assistant for students. Give the most direct, concise answer possible. Skip lengthy explanations unless asked. Aim for 1-3 sentences when possible.`,
};

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'AI service not configured.' });

  try {
    const { messages, model: modelId } = req.body;
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'Messages are required.' });
    }

    const claudeModel = MODEL_MAP[modelId] || MODEL_MAP.standard;
    const systemPrompt = SYSTEM_PROMPTS[modelId] || SYSTEM_PROMPTS.standard;

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
        max_tokens: modelId === 'flash' ? 512 : 1024,
        system: systemPrompt,
        messages: claudeMessages,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      let detail = 'AI service error';
      try { detail = JSON.parse(errText).error?.message || errText; } catch(e) { detail = errText; }
      return res.status(502).json({ error: detail });
    }

    const data = await response.json();
    const reply = data.content?.[0]?.text || 'Sorry, I couldn\'t generate a response.';

    return res.status(200).json({ reply });
  } catch (err) {
    console.error('Chat error:', err);
    return res.status(500).json({ error: 'Something went wrong.' });
  }
};
