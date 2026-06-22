const MODEL_MAP = {
  standard: 'claude-sonnet-4-6',
  pro: 'claude-sonnet-4-6',
  reason: 'claude-sonnet-4-6',
  flash: 'claude-haiku-4-5',
};

const MODEL_CONFIG = {
  flash:    { max_tokens: 512 },
  standard: { max_tokens: 1024 },
  pro:      { max_tokens: 2048 },
  reason:   { max_tokens: 4096, thinking: { type: 'adaptive' }, effort: 'high' },
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
    if (config.thinking) body.thinking = config.thinking;
    if (config.effort) body.output_config = { effort: config.effort };

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
      const errText = await response.text();
      let detail = 'AI service error';
      try { detail = JSON.parse(errText).error?.message || errText; } catch(e) { detail = errText; }
      return res.status(502).json({ error: detail });
    }

    const data = await response.json();
    const textBlock = data.content?.find(b => b.type === 'text');
    const reply = textBlock?.text || 'Sorry, I couldn\'t generate a response.';

    return res.status(200).json({ reply });
  } catch (err) {
    console.error('Chat error:', err);
    return res.status(500).json({ error: 'Something went wrong.' });
  }
};
