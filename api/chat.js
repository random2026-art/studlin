const MODEL_MAP = {
  standard: 'claude-sonnet-4-6',
  flash: 'claude-haiku-4-5',
};

const SYSTEM_PROMPTS = {
  standard: 'You are Studlin, an AI study assistant built for students. You help with homework, explain concepts, solve problems step by step, and provide thorough academic support. Be clear, educational, and show your reasoning when solving problems. Use examples when helpful. Format responses with markdown when it improves readability. Be thorough but organized.',
  flash: 'You are Studlin Flash, a quick-answer AI assistant for students. Give the most direct, concise answer possible. Aim for 1-3 sentences when possible.',
};

const MAX_TOKENS = { standard: 2048, flash: 512 };

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'AI service not configured.' });

  try {
    const { messages, model } = req.body;
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'Messages are required.' });
    }

    const claudeModel = MODEL_MAP[model] || MODEL_MAP.standard;
    const systemPrompt = SYSTEM_PROMPTS[model] || SYSTEM_PROMPTS.standard;
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
      return res.status(502).json({ error: 'AI error: ' + errText.slice(0, 200) });
    }

    const data = await response.json();
    const reply = data.content?.find(b => b.type === 'text')?.text || 'No response.';
    return res.status(200).json({ reply });
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Server error.' });
  }
};
