const { db, admin } = require('./_lib/firebase-admin');
const { setCors, verifyAuth } = require('./_lib/auth');
const { withSentry } = require('./_lib/sentry');

const MODEL_MAP = {
  standard: 'claude-sonnet-4-6',
  flash: 'claude-haiku-4-5-20251001',
};

const MAX_TOKENS = { standard: 2048, flash: 512 };
// A dense real syllabus (25-30 graded items, each with a title, date,
// kind, confidence, and a `detail` sentence) can plausibly run past the
// plain 2048-token chat budget above -- and a cut-off JSON response isn't
// a partial extraction, it's just invalid JSON, silently degrading to the
// caller's empty-result fallback. Only format:"json" + the standard model
// gets the larger budget; flash's structured calls (Reschedule's intent
// classifier) return a handful of fields and never need it.
const MAX_TOKENS_JSON_STANDARD = 4096;

const SYSTEM_PROMPT = `You are Studlin AI.

Your mission is to help students and professionals learn faster, think deeper, retain more information, and achieve better academic or professional outcomes.

You are not a generic chatbot.

You are an AI-powered learning operating system.

CORE IDENTITY

You combine the capabilities of:
- Elite private tutor
- Study coach
- Learning scientist
- Research assistant
- Writing mentor
- Productivity coach
- Critical thinking partner

Your primary objective is maximizing learning outcomes.

Every response should help users:
- Understand concepts faster
- Remember information longer
- Apply knowledge correctly
- Build confidence
- Save time

FIRST PRINCIPLES

Never optimize for sounding smart.

Optimize for:
- clarity
- usefulness
- accuracy
- understanding

If a concept can be explained simply, explain it simply.
If a user appears confused, teach before answering.
If a user appears overwhelmed, simplify.
If a user already understands the basics, increase depth.

ADAPTIVE TEACHING

Determine the user's level:
- Beginner: simple language, analogies, examples
- Intermediate: more technical detail, practical applications
- Advanced: deep reasoning, edge cases, nuance

Always adapt.

ACTIVE LEARNING

Do not only provide answers. When appropriate:
- ask questions
- test understanding
- create mini quizzes
- encourage recall
- reinforce concepts

Prioritize learning over passive consumption.

EXPLANATION FRAMEWORK

Whenever teaching:
1. Simple explanation
2. Why it matters
3. Real-world example
4. Common mistakes
5. Quick recap

SUBJECT GUIDELINES

Math & Science: Show the formula, but explain what it MEANS first. Work through one example step-by-step. Then let them try.
Essays & Writing: Thesis clarity > everything. Point out structural issues before grammar. Ask guiding questions.
History & Humanities: Context first, facts second. Encourage interpretation. Challenge surface-level answers.
Languages: Mix in the target language. Correct gently. Provide context for grammar rules.

ACADEMIC INTEGRITY

- Do not write essays or assignments for students
- Do not give direct answers to test or homework questions
- DO explain concepts so they understand
- DO help them learn to solve problems themselves
- DO review their work and give feedback
- If asked to do homework: explain you can help them write it better — ask what part is confusing

WRITING ASSISTANCE

When helping with essays:
- improve clarity, structure, reasoning, and evidence
- do not add unnecessary fluff
- prioritize strong arguments

STUDY PLANNING

When creating study plans, consider: deadlines, workload, difficulty, available time, user goals.
Create realistic plans. Avoid impossible schedules.

PROBLEM SOLVING

For math, science, and technical questions:
- show reasoning
- break problems into steps
- explain why each step matters
- do not skip educational value

FLASHCARDS

Create high-retention flashcards. Prefer:
- Question to Answer
- Concept to Definition
- Problem to Solution

Focus on active recall.

LECTURE ASSISTANT

When processing lectures, generate: summaries, key concepts, flashcards, quizzes, action items.
Extract signal, remove noise.

NOTES

Notes should be: concise, organized, memorable.
Use: headings, bullets, summaries, key takeaways.

SPECIAL BEHAVIORS

- If they are stuck: try a different approach — use an analogy or break it down further.
- If they are overthinking: "Step back. Here's the big picture..."
- If they are procrastinating: "Write ONE bad paragraph. Just one. Then we'll fix it together."
- If they are burnt out: "Go take a walk. Come back in 30 min and we'll tackle this fresh."

PRODUCTIVITY

Encourage: consistency, deep work, realistic goals.
Avoid toxic productivity. Optimize for sustainable performance.

COMMUNICATION STYLE

Tone: intelligent, encouraging, calm, modern, direct.
Avoid: robotic language, unnecessary disclaimers, excessive formality.
Be concise when possible. Be detailed when necessary.
Format responses with markdown when it improves readability — headers, bullets, examples. Keep it scannable.

QUALITY STANDARD

Before every response ask:
1. Is this accurate?
2. Is this useful?
3. Is this easy to understand?
4. Will this help the user learn?

If not, improve it.

YOUTUBE AND MEDIA

When asked to create notes from a YouTube URL, NEVER say you cannot access the video. Infer the topic from the URL or any context and create comprehensive study notes on that topic directly. If you truly cannot determine the topic, ask what the video is about — but never refuse.

GOAL

Every interaction should make the user smarter, more capable, more confident, and more productive.

You are Studlin AI. Your purpose is helping people learn better than they could alone.`;

const FLASH_PROMPT = `You are Studlin Flash, a quick-answer study assistant. Give the most direct, concise answer possible. Sound like a smart study buddy, not a textbook. 1-3 sentences max unless the question genuinely needs more. Use bullet points to keep it scannable. Be helpful but brief.`;

// For calls that need a strict machine-readable output (Brain Dump
// extraction, and any future structured-parsing feature) — the tutor
// persona above actively fights a "return ONLY JSON" instruction (it's
// told to ask questions, use markdown, etc.), which made JSON-mode calls
// unreliable. This prompt has no personality to override.
const EXTRACTION_PROMPT = `You extract structured data from student input. Follow the user's formatting instructions exactly and completely. Respond with ONLY the requested output — no greeting, no explanation, no markdown code fences, no commentary before or after.`;

// Studlin AI Phase 1 (the floating, read-only calendar assistant) --
// distinct product from the general tutoring persona above (which
// already self-identifies as "Studlin AI" in its own text; that naming
// overlap is real and worth resolving at the product level, but doesn't
// collide at the code level -- separate constant, separate format value).
// The DIGEST referenced below is assembled client-side by
// assembleStudlinAiDigest/the profile-signal calls around it (see
// studlin-app.jsx) and sent as part of the request's own message text --
// this server never touches calendar data directly, same reason every
// other AI-calling feature in this file already builds its own context
// client-side (Brain Dump's todaysScheduleForBrainDump is the existing
// precedent).
const STUDLIN_AI_SYSTEM_PROMPT = `You are Studlin's calendar assistant. A student is asking about their own real schedule and study history.

You will be given a DIGEST: real, already-computed data about their upcoming schedule and/or their study patterns. This is the ONLY source of truth you have. Never invent an assignment, date, class, or number that isn't in the digest. If the digest doesn't cover what they're asking, say so plainly instead of guessing -- "I don't have data on that yet" is a correct answer, not a failure.

You cannot create, move, reschedule, or delete anything. You are read-only. If asked to do any of those, say you can't do that yet -- never claim you did it.

Answer in one to three sentences. State the real number the digest gives you, not a vague impression. Never pad with filler like "I'd be happy to help" or "great question." Sound like a smart friend stating a fact, not a customer service bot.

If a signal in the digest has too little data to be trustworthy (the digest will say so explicitly), say that plainly too rather than answering around it.`;

const CREDIT_COST = { standard: 1, flash: 1 };
// A request carrying an image (the Canvas/syllabus screenshot importer)
// costs meaningfully more real tokens than a text-only call -- a full-
// resolution screenshot alone can run past a thousand image tokens before
// the model reads a single word back, on top of the response itself. Flat
// 1-credit pricing for that would badly under-charge relative to every
// other AI feature in this app.
const IMAGE_CREDIT_COST = 4;
// Studlin AI's digest (14 days of schedule data plus whichever behavioral
// signals the question routed to) is meaningfully bigger input than a
// plain chat message but never carries an image -- priced between plain
// chat (1) and an image call (4) rather than folded into either.
const STUDLIN_AI_CREDIT_COST = 2;
const MAX_TOKENS_STUDLIN_AI = 768;
// Studlin AI Phase 2's message router/intent classifier -- a separate,
// bounded-choice call (question vs. a fixed set of calendar actions),
// same reasoning as EXTRACTION_PROMPT above: a personality prompt fights
// a strict JSON contract, so this reuses that bare framing rather than
// STUDLIN_AI_SYSTEM_PROMPT's conversational one. Priced like the existing
// Tier-3 Reschedule classifier (submitPauseCommand in studlin-app.jsx),
// which already rides the flat 1-credit flash rate for the same kind of
// call -- no reason for this new one to cost more. Output is a short,
// fixed-shape JSON object, so MAX_TOKENS is small.
const STUDLIN_AI_INTENT_SYSTEM_PROMPT = EXTRACTION_PROMPT;
const STUDLIN_AI_INTENT_CREDIT_COST = 1;
const MAX_TOKENS_STUDLIN_AI_INTENT = 220;
// Studlin AI's real coaching mode -- distinct from STUDLIN_AI_SYSTEM_PROMPT
// above, which is deliberately restricted to stating digest facts and
// explicitly can't give advice. This one is allowed to: a student asking
// "how should I study for this" wants real strategy, not a fact, and a
// generic answer would be a weak version of the feature (any chatbot can
// give generic study tips) -- the actual point is grounding it in this
// student's real situation via the CONTEXT block
// (gatherStudlinAiCoachingContext/formatStudlinAiCoachingPrompt in
// studlin-app.jsx), same "client builds real context, server never
// touches calendar data directly" precedent as the Q&A path above.
const STUDLIN_AI_COACHING_SYSTEM_PROMPT = `You are Studlin's calendar-aware study coach. A student is asking for real help with how to approach studying, not just a fact about their schedule.

You will be given CONTEXT: real data about this student -- their upcoming workload, and, when identifiable, their own real performance history and exam readiness for the subject they're asking about. Use it to make your advice specific to THIS student's real situation, not a generic template that would fit anyone. Never invent a fact beyond what's given in the context -- if something isn't there, don't claim to know it.

Give real, actionable strategy: how to break the material down, how to sequence study time, what to prioritize first, concrete techniques (active recall, spaced practice, reviewing past mistakes) suited to the situation described. If the context shows a tight timeline or a real weak spot, say so plainly and factor it into the advice.

You cannot create, move, reschedule, or delete anything from this response -- if a real study session or task would help, say so, but never claim to have added one.

Keep it focused and real: three to six sentences, or a short list when an actual breakdown helps. No filler, no "I'd be happy to help," no encouragement that isn't earned by something in the context. Never use an em dash.`;
const STUDLIN_AI_COACHING_CREDIT_COST = 2;
const MAX_TOKENS_STUDLIN_AI_COACHING = 1024;
const DEFAULT_CREDITS = 120; // Free plan limit — must match api/me.js, the actual account-creation default
const RATE_LIMIT_PER_MIN = 20;

// Real dollar cost of Anthropic usage, separate from the arbitrary
// CREDIT_COST unit above. Credits cap how many *messages* a plan gets;
// this caps how much a Pro subscriber can actually cost us in raw
// Anthropic API spend against the $6.99/mo they pay, since a flat
// 100,000-credit allowance has no relationship to real token cost.
// Rates are $/million tokens -- verify these against the Anthropic
// console for the exact model strings in MODEL_MAP before relying on
// this for real budgeting, pricing can change and isn't fetchable at
// runtime.
const PRICE_PER_MILLION_TOKENS = {
  standard: { input: 3, output: 15 },
  flash: { input: 0.8, output: 4 },
};
const PRO_MONTHLY_AI_COST_CAP_CENTS = 300; // $3 -- see PRICE_PER_MILLION_TOKENS caveat above

function usageCostCents(modelKey, usage) {
  const rates = PRICE_PER_MILLION_TOKENS[modelKey] || PRICE_PER_MILLION_TOKENS.standard;
  const inputCost = ((usage?.input_tokens || 0) / 1e6) * rates.input;
  const outputCost = ((usage?.output_tokens || 0) / 1e6) * rates.output;
  return (inputCost + outputCost) * 100;
}

// Basic shape/size guard on any attached image(s) before a request ever
// reaches the credit transaction or the upstream call -- a malformed or
// oversized payload should fail fast and cheap, not burn a credit first
// and find out from Anthropic's own error response.
// Vercel's Node.js serverless functions have a hard 4.5MB request body
// ceiling that nothing in this repo's vercel.json raises (it isn't
// configurable for this runtime) -- a bigger base64 payload than this
// never reaches this code at all, it gets a platform-level 413 first.
// Sized with headroom under that real ceiling, not Anthropic's own (much
// larger) per-image limit, since Vercel's is the actual bottleneck here.
const MAX_IMAGE_BASE64_CHARS = 3.5 * 1024 * 1024;
// m.images (plural) is the multi-screenshot path -- the "scan whole
// schedule" flow can now span more than one photo. A separate field from
// the original singular m.image rather than overloading it, so every
// existing single-image call site keeps working unchanged. Capped
// independently of the per-image limit above: several images each just
// under that per-image cap could still blow past Vercel's combined
// 4.5MB body ceiling even though none individually would.
const MAX_IMAGES_PER_MESSAGE = 6;
const MAX_TOTAL_IMAGE_BASE64_CHARS = 4 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp', 'image/gif']);
function imageValidationError(img) {
  if (!img.data || !img.mediaType) return 'Image is missing required fields.';
  if (!ALLOWED_IMAGE_TYPES.has(img.mediaType)) return 'Unsupported image type. Use PNG, JPEG, WEBP, or GIF.';
  if (img.data.length > MAX_IMAGE_BASE64_CHARS) return 'Image is too large. Try a smaller screenshot or crop it down.';
  return null;
}
// Pulled out as its own pure function (message shapes in, an error string
// or null out) specifically so it's unit-testable without mocking auth/
// Firestore/the Anthropic fetch call the rest of this handler needs --
// exported below alongside the default handler export.
function validateMessageImages(messages) {
  for (const m of messages) {
    if (m.image) {
      const err = imageValidationError(m.image);
      if (err) return err;
    }
    if (m.images) {
      if (!Array.isArray(m.images) || m.images.length === 0) {
        return 'images must be a non-empty array.';
      }
      if (m.images.length > MAX_IMAGES_PER_MESSAGE) {
        return `Too many screenshots at once (max ${MAX_IMAGES_PER_MESSAGE}). Try fewer, or submit the rest separately.`;
      }
      let totalChars = 0;
      for (const img of m.images) {
        const err = imageValidationError(img);
        if (err) return err;
        totalChars += img.data.length;
      }
      if (totalChars > MAX_TOTAL_IMAGE_BASE64_CHARS) {
        return 'Combined size of these screenshots is too large. Try fewer photos, or smaller ones.';
      }
    }
  }
  return null;
}

// Pulled out as their own pure functions (same reasoning as
// validateMessageImages above) so pricing/prompt-selection logic is
// unit-testable directly, without mocking auth/Firestore/the Anthropic
// fetch call -- exported below alongside the default handler export.
function resolveRequestCost(hasImage, model, format) {
  if (hasImage) return IMAGE_CREDIT_COST;
  if (format === 'studlin_ai') return STUDLIN_AI_CREDIT_COST;
  if (format === 'studlin_ai_intent') return STUDLIN_AI_INTENT_CREDIT_COST;
  if (format === 'studlin_ai_coaching') return STUDLIN_AI_COACHING_CREDIT_COST;
  return CREDIT_COST[model] || 1;
}
function resolveSystemPrompt(format, effectiveModel) {
  if (format === 'json') return EXTRACTION_PROMPT;
  if (format === 'studlin_ai') return STUDLIN_AI_SYSTEM_PROMPT;
  if (format === 'studlin_ai_intent') return STUDLIN_AI_INTENT_SYSTEM_PROMPT;
  if (format === 'studlin_ai_coaching') return STUDLIN_AI_COACHING_SYSTEM_PROMPT;
  return effectiveModel === 'flash' ? FLASH_PROMPT : SYSTEM_PROMPT;
}
function resolveMaxTokens(format, effectiveModel) {
  if (format === 'studlin_ai') return MAX_TOKENS_STUDLIN_AI;
  if (format === 'studlin_ai_intent') return MAX_TOKENS_STUDLIN_AI_INTENT;
  if (format === 'studlin_ai_coaching') return MAX_TOKENS_STUDLIN_AI_COACHING;
  if (format === 'json' && effectiveModel !== 'flash') return MAX_TOKENS_JSON_STANDARD;
  return MAX_TOKENS[effectiveModel] || 2048;
}

const chatHandler = async (req, res) => {
  setCors(req, res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'AI service not configured.' });

  const user = await verifyAuth(req);
  if (!user) return res.status(401).json({ error: 'Sign in required.' });

  try {
    const { messages, model, verbosity, tutorStyle, format } = req.body;
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'Messages are required.' });
    }

    const imagesError = validateMessageImages(messages);
    if (imagesError) return res.status(400).json({ error: imagesError });

    const hasImage = messages.some(m => !!m.image || (Array.isArray(m.images) && m.images.length > 0));
    const cost = resolveRequestCost(hasImage, model, format);

    // Credit tracking is best-effort: if Firestore is unreachable or the
    // `users` collection/document isn't there yet, don't let that break the
    // chat itself — just skip the credit deduction for this request.
    let creditsAfter = null;
    let creditTrackingSkipped = false;
    // Set inside the transaction below when this account is Pro and has
    // already hit PRO_MONTHLY_AI_COST_CAP_CENTS of real Anthropic spend
    // this billing cycle — forces this call onto the cheap model instead
    // of blocking a paying subscriber outright. Reset to 0 by
    // handleInvoicePaid in api/stripe-webhook.js each renewal.
    let downgradedForCostCap = false;
    const userRef = db ? db.collection('users').doc(user.uid) : null;

    if (!userRef) {
      creditTrackingSkipped = true;
    } else {
      try {
        const txResult = await db.runTransaction(async (tx) => {
          const doc = await tx.get(userRef);
          const now = Date.now();
          const data = doc.exists ? doc.data() : { credits: DEFAULT_CREDITS, plan: 'Free' };
          const credits = data.credits ?? DEFAULT_CREDITS;

          const windowStart = data.rlWindowStart || 0;
          const windowCount = now - windowStart < 60000 ? (data.rlCount || 0) : 0;
          if (windowCount >= RATE_LIMIT_PER_MIN) {
            throw new Error('RATE_LIMIT');
          }
          // Bug fix, 2026-09-04 audit: Studlin AI chat (the studlin_ai*
          // formats -- the question-answering/action-proposal/coaching
          // chat drawer, gated Pro-only client-side via
          // canUseStudlinAiQna()/hasProAccess()) was never actually
          // checked server-side -- only the plan-agnostic credit balance
          // was. Every account starts with DEFAULT_CREDITS real credits
          // regardless of plan, so a Free account calling this endpoint
          // directly (bypassing the UI) could spend real inference cost
          // on a feature the product's own pricing says Free doesn't get.
          // format:"json" (syllabus/schedule extraction, Brain Dump, etc.)
          // is untouched -- those have their own separate, sometimes-
          // free-tier-eligible gates client-side (canScanSyllabus and
          // friends), this only covers the three formats that are
          // unconditionally Pro-only with no free path at all.
          const planNow = data.plan || 'Free';
          const isStudlinAiFormat = format === 'studlin_ai' || format === 'studlin_ai_intent' || format === 'studlin_ai_coaching';
          if (isStudlinAiFormat && planNow !== 'Pro' && planNow !== 'Pro-Limited') {
            throw new Error('PRO_REQUIRED');
          }
          if (credits < cost) {
            throw new Error('NO_CREDITS');
          }

          // format:"json" (syllabus/schedule extraction, Brain Dump) is
          // excluded from the downgrade even over cap -- flash's smaller
          // MAX_TOKENS truncates a real extraction into invalid JSON,
          // silently degrading to an empty result (see MAX_TOKENS_JSON_STANDARD's
          // own comment). Those calls are rare/bursty, not the sustained-chat
          // cost driver this cap targets, so it's not worth risking that
          // regression to save a few cents here.
          const plan = data.plan || 'Free';
          const aiSpendCents = data.aiSpendCentsCycle || 0;
          const overCostCap = plan === 'Pro' && model === 'standard' && format !== 'json' && aiSpendCents >= PRO_MONTHLY_AI_COST_CAP_CENTS;

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
          return { next, overCostCap };
        });
        creditsAfter = txResult.next;
        downgradedForCostCap = txResult.overCostCap;
      } catch (txErr) {
        if (txErr.message === 'RATE_LIMIT') {
          return res.status(429).json({ error: 'Too many requests. Slow down a bit.' });
        }
        if (txErr.message === 'NO_CREDITS') {
          return res.status(402).json({ error: 'Not enough credits. Upgrade or buy more.' });
        }
        if (txErr.message === 'PRO_REQUIRED') {
          return res.status(402).json({ error: 'Studlin AI chat requires Pro.' });
        }
        // Unexpected Firestore error (e.g. NOT_FOUND from a database/collection
        // that isn't set up yet) — log it and let the chat continue rather than
        // surfacing a raw backend error to the student.
        console.warn('Credit tracking unavailable, continuing without it:', txErr.message);
        creditTrackingSkipped = true;
      }
    }

    const effectiveModel = downgradedForCostCap ? 'flash' : model;
    const claudeModel = MODEL_MAP[effectiveModel] || MODEL_MAP.standard;
    let systemPrompt = resolveSystemPrompt(format, effectiveModel);
    const maxTokens = resolveMaxTokens(format, effectiveModel);

    // Only genuine chat/tutoring surfaces send verbosity/tutorStyle — every
    // other call site (citations, grammar, essay feedback, flashcard/quiz
    // gen, humanizer, calendar auto-scheduling) never sends these fields, so
    // this block is a guaranteed no-op for them.
    const VERBOSITY_DIRECTIVES = {
      Concise: 'Keep your response brief and to the point.',
      Comprehensive: 'Provide a thorough, detailed explanation.',
    };
    const TUTOR_STYLE_DIRECTIVES = {
      Socratic: 'Favor asking guiding questions over giving direct answers.',
      Direct: 'Give direct, clear answers without excessive questioning.',
      Encouraging: 'Be extra encouraging and supportive in tone.',
      Strict: 'Be rigorous and hold the student to a high standard.',
    };
    const directives = [VERBOSITY_DIRECTIVES[verbosity], TUTOR_STYLE_DIRECTIVES[tutorStyle]].filter(Boolean);
    if (directives.length > 0) {
      systemPrompt = systemPrompt + '\n\n' + directives.join(' ');
    }

    // Plain string content for every existing text-only caller (chat,
    // syllabus text extraction, flashcard/quiz gen, ...) -- completely
    // unchanged. A message carrying image(s) switches to Anthropic's
    // multi-part content block array, image(s) first so the model reads
    // them before the accompanying instruction text. m.images (plural,
    // the multi-screenshot path) attaches every image as its own block in
    // the same message -- Claude reads a multi-image message as one
    // combined context, which is what lets it de-duplicate a class/period
    // that happens to appear in more than one screenshot instead of
    // double-counting it.
    const claudeMessages = messages.map(m => {
      const images = m.images && m.images.length ? m.images : (m.image ? [m.image] : null);
      return {
        role: m.r === 'ai' ? 'assistant' : 'user',
        content: images
          ? [
              ...images.map(img => ({ type: 'image', source: { type: 'base64', media_type: img.mediaType, data: img.data } })),
              { type: 'text', text: m.t || '' },
            ]
          : m.t,
      };
    });

    // A hung/slow upstream call would otherwise let Vercel's own platform
    // timeout (maxDuration, set in vercel.json) kill the function first —
    // that returns Vercel's own error page (not JSON), which is exactly
    // what caused the raw "Unexpected token..." crash in Studlin AI. Aborting
    // a few seconds early guarantees our own try/catch below always gets to
    // return clean JSON instead.
    // format:"json" callers (syllabus/schedule extraction, Brain Dump,
    // calendar-import classification, ...) want consistent, literal
    // output, not conversational variety -- the API's own default
    // temperature is tuned for chat, and was silently applying to these
    // structured calls too. Real chat/tutoring is untouched (still no
    // temperature field, same default as always).
    const requestBody = {
      model: claudeModel,
      max_tokens: maxTokens,
      system: systemPrompt,
      messages: claudeMessages,
    };
    // studlin_ai gets the same low temperature json mode does -- the system
    // prompt already instructs "never invent a number not in the digest,"
    // but a real sampling-parameter backstop against creative drift is
    // cheap insurance on top of an instruction alone.
    if (format === 'json' || format === 'studlin_ai' || format === 'studlin_ai_intent' || format === 'studlin_ai_coaching') requestBody.temperature = 0.2;

    // Raised alongside vercel.json's maxDuration (30s -> 60s): flashcard/quiz
    // generation now sends up to MATERIAL_TEXT_CAP (50,000 chars, was 15,000)
    // of material with a larger format:"json" response budget, which was
    // regularly taking long enough to hit the old 25s abort on real
    // material -- confirmed live (504 on a real PDF upload) after that
    // change shipped. Same 5s safety margin under the platform limit as
    // before, just scaled up with it.
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 55000);
    let response;
    try {
      response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      });
    } catch (fetchErr) {
      if (!creditTrackingSkipped && userRef) {
        await userRef.update({ credits: creditsAfter + cost }).catch(() => {});
      }
      if (fetchErr.name === 'AbortError') {
        return res.status(504).json({ error: 'Studlin AI took too long to respond. Please try again.' });
      }
      throw fetchErr;
    } finally {
      clearTimeout(timeout);
    }

    if (!response.ok) {
      const errText = await response.text();
      if (!creditTrackingSkipped && userRef) {
        await userRef.update({ credits: creditsAfter + cost }).catch(() => {});
      }
      return res.status(502).json({ error: 'AI error: ' + errText.slice(0, 200) });
    }

    const data = await response.json();
    let reply = data.content?.find(b => b.type === 'text')?.text || 'No response.';
    // Real Anthropic spend for this call (plus the retry's own usage below,
    // if one happens) -- accumulated against the account's per-cycle total
    // so the cost cap above has real data to check next time. Best-effort,
    // same as credit tracking: never blocks the reply on a Firestore error.
    let totalUsageCents = usageCostCents(effectiveModel, data.usage);

    // format:"json" self-correction: every extractor strips code fences
    // and JSON.parses client-side, then silently falls back to an
    // empty/error result on failure -- for a multi-class whole-schedule
    // scan especially, one malformed field used to throw the entire
    // batch away. One best-effort retry, showing the model its own
    // broken output plus the real parse error, converts a chunk of those
    // failures into successes. Purely additive: any failure here (parse
    // still bad, retry call itself errors or times out) just falls
    // through to returning the original reply, exactly today's behavior.
    if (format === 'json') {
      const stripFences = (s) => (s || '').replace(/```json?\n?/gi, '').replace(/```/g, '').trim();
      let parseErr = null;
      try { JSON.parse(stripFences(reply)); } catch (e) { parseErr = e; }
      if (parseErr) {
        try {
          const retryController = new AbortController();
          const retryTimeout = setTimeout(() => retryController.abort(), 20000);
          let retryResponse;
          try {
            retryResponse = await fetch('https://api.anthropic.com/v1/messages', {
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
                temperature: 0.2,
                messages: [
                  ...claudeMessages,
                  { role: 'assistant', content: reply },
                  { role: 'user', content: `That wasn't valid JSON (parse error: ${parseErr.message}). Reply with ONLY the corrected, complete, valid JSON -- no commentary, no code fences.` },
                ],
              }),
              signal: retryController.signal,
            });
          } finally {
            clearTimeout(retryTimeout);
          }
          if (retryResponse.ok) {
            const retryData = await retryResponse.json();
            const retryReply = retryData.content?.find(b => b.type === 'text')?.text || '';
            JSON.parse(stripFences(retryReply)); // only accept it if this parses clean
            reply = retryReply;
            totalUsageCents += usageCostCents(effectiveModel, retryData.usage);
          }
        } catch (retryErr) {
          // Retry failed or was itself invalid -- fall through with the
          // original reply, same as before this fix existed.
        }
      }
    }

    if (!creditTrackingSkipped && userRef && totalUsageCents > 0) {
      await userRef.update({ aiSpendCentsCycle: admin.firestore.FieldValue.increment(totalUsageCents) }).catch(() => {});
    }

    return res.status(200).json({ reply, credits: creditsAfter, downgradedForCostCap });
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Server error.' });
  }
};

module.exports = withSentry(chatHandler);
// Attached to the exported handler (functions are objects) so
// tests/chat-image-validation.test.js can exercise this pure validation
// logic directly, without mocking auth/Firestore/the Anthropic fetch call
// the handler itself needs -- Vercel only cares that module.exports is
// callable, so this extra property is otherwise inert in production.
module.exports.validateMessageImages = validateMessageImages;
module.exports.resolveRequestCost = resolveRequestCost;
module.exports.resolveSystemPrompt = resolveSystemPrompt;
module.exports.resolveMaxTokens = resolveMaxTokens;
