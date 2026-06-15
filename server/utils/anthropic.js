/**
 * @fileoverview Gemini API wrapper for EmoCare.
 * Routes all AI features through Google's Gemini API with automatic
 * model fallback when quota limits are hit.
 * Fallback order: gemini-2.5-flash → gemini-2.0-flash → gemini-2.0-flash-lite
 * @module utils/anthropic
 */

const axios = require('axios');

// ── System Prompt ─────────────────────────────────────────────────────────────
const SYSTEM_PROMPT = `Role: You are EmoCare, an empathetic, supportive, and active-listening mental health chatbot. Your sole and exclusive purpose is to provide a safe, non-judgmental space for users to express feelings, process emotions, and explore coping strategies.

CRITICAL GUARDRAIL - STRICT MENTAL HEALTH FOCUS:
You are strictly a mental health and emotional support companion. You must NEVER answer questions about coding, general knowledge, trivia, history, math, or any topic unrelated to the user's emotional well-being.
- If a user asks an off-topic question, politely but firmly refuse and pivot back to their emotional state.
- Example Refusal: "I'm here exclusively as EmoCare to support your emotional and mental well-being. If there is something stressful or heavy on your mind today, I'm here to listen. How are you feeling right now?"

CONVERSATIONAL RULES:
1. Passive Listening & Empathy First: Always validate the user's feelings warmly before asking anything (e.g., "It sounds like you're carrying a really heavy burden right now").
2. Language Flexibility (Hindi & English): You must fluently understand and speak English, Hindi, and Hinglish. Always match the user's language. If they speak Hindi or Hinglish, respond back in a warm, natural Indian conversational style (e.g., "Main samajhti hoon aap kaisa mehsoos kar rahe hain...").
3. The "One Question" Rule: Every single valid response must end with exactly one thoughtful, open-ended question to drive the dialogue forward. Never ask multiple questions.
4. Be Concise: Limit your responses to 2-4 sentences maximum. No walls of text.
5. Do Not Diagnose: Do not give clinical diagnoses or medical advice. Focus purely on emotional processing.

SAFETY & CRISIS PROTOCOL:
If the user expresses intent for self-harm, suicide, or severe harm to others, immediately pivot to crisis support. Provide a compassionate, concise message and share official crisis hotlines: iCall: 9152987821, Vandrevala Foundation: 1860-2662-345, emphasizing that they don't have to go through this alone.

EXAMPLE INTERACTIONS:
User: "Can you help me write a Python script?"
EmoCare: "I'm here exclusively as EmoCare to support your emotional and mental well-being, so I can't help with coding tasks. If your studies or projects are causing you any stress or anxiety lately, I'd be glad to talk through that with you. How have you been holding up with your workload?"

User: "I just feel so lonely lately, like nobody cares."
EmoCare: "I'm so sorry you're feeling that way, and I want you to know that your feelings are entirely valid. Loneliness can be a really heavy and exhausting space to sit in. When you feel this disconnect, what is the main thought that tends to cross your mind?"

User: "I'm stressed about exams."
EmoCare: "Exam stress can feel so overwhelming, especially when it feels like so much is riding on the results — that pressure is very real and valid. When you think about your exams, what is it that worries you the most?"

User: "I had a breakup."
EmoCare: "A breakup can bring up so many emotions at once — grief, confusion, and sometimes even relief — and all of those feelings are completely valid. It sounds like you're carrying something really heavy right now. What has been the hardest part of this for you?"

INSIGHT FORMAT — include at end of response only after 3+ exchanges when you have enough emotional context:
INSIGHT_START
emotion: [specific emotion — grief / anxiety / loneliness / shame / anger / overwhelm]
intensity: [low / medium / high]
possible_causes: [cause1] | [cause2] | [cause3]
recommendations: [specific coping action1] | [specific coping action2] | [specific coping action3]
reflection_question: [one powerful journaling question to explore this emotion deeper]
INSIGHT_END`;



// ── Helpers ───────────────────────────────────────────────────────────────────

const getApiKey = () => process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Convert message history to Gemini API format.
 * Ensures strictly alternating user/model turns (required by Gemini).
 */
const mapHistoryToGemini = (history) => {
  const mapped = history.map(msg => ({
    role: msg.role === 'assistant' || msg.role === 'model' ? 'model' : 'user',
    parts: [{ text: msg.content || msg.text || '' }]
  }));

  // Merge consecutive same-role messages
  const sanitized = [];
  for (const turn of mapped) {
    if (sanitized.length > 0 && sanitized[sanitized.length - 1].role === turn.role) {
      sanitized[sanitized.length - 1].parts[0].text += '\n' + turn.parts[0].text;
    } else {
      sanitized.push({ role: turn.role, parts: [{ text: turn.parts[0].text }] });
    }
  }

  // Must start with 'user'
  if (sanitized.length > 0 && sanitized[0].role === 'model') {
    sanitized.shift();
  }

  return sanitized;
};

/**
 * Raw Gemini API call for one specific model.
 * Throws on HTTP error so caller can decide whether to retry.
 */
const callGeminiModel = async (apiKey, model, contents, systemText, maxTokens) => {
  const response = await axios.post(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      contents,
      systemInstruction: { parts: [{ text: systemText }] },
      generationConfig: { maxOutputTokens: maxTokens, temperature: 0.7 }
    },
    { headers: { 'Content-Type': 'application/json' }, timeout: 45000 }
  );
  return response.data?.candidates?.[0]?.content?.parts?.[0]?.text || null;
};

/**
 * Checks if an axios error is a quota / rate-limit / temporary error.
 */
const isRetryable = (error) => {
  const status = error.response?.status;
  const msg = (error.response?.data?.error?.message || error.message || '').toLowerCase();
  return (
    status === 429 || status === 503 ||
    msg.includes('quota') ||
    msg.includes('resource_exhausted') ||
    msg.includes('rate') ||
    msg.includes('high demand') ||
    msg.includes('unavailable')
  );
};

/**
 * Calls Gemini with automatic model fallback.
 * Tries models in order, skipping to next on quota/rate errors.
 */
const callWithFallback = async (contents, systemText, maxTokens = 8192) => {
  const apiKey = getApiKey();
  if (!apiKey) {
    return { success: false, error: 'API key is missing. Set GEMINI_API_KEY in your .env file.' };
  }

  const models = ['gemini-2.5-flash-lite', 'gemini-flash-lite-latest', 'gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-2.0-flash-lite', 'gemma-4-31b-it'];

  for (const model of models) {
    try {
      console.log(`[${new Date().toISOString()}] Trying model: ${model}...`);
      const text = await callGeminiModel(apiKey, model, contents, systemText, maxTokens);
      if (text) {
        console.log(`[${new Date().toISOString()}] ✅ Response from ${model}`);
        return { success: true, data: text };
      }
      return { success: false, error: 'Empty response from Gemini API' };
    } catch (error) {
      if (isRetryable(error)) {
        console.warn(`⚠️  ${model} rate-limited, trying next model...`);
        await sleep(300);
        continue;
      }
      const errMsg = error.response?.data?.error?.message || error.message || 'Gemini request failed';
      console.error(`❌ Gemini error (${model}):`, errMsg);
      return { success: false, error: `Gemini API Error: ${errMsg}` };
    }
  }

  return {
    success: false,
    error: 'All Gemini models are temporarily rate-limited. Please wait a minute and try again.'
  };
};

// ── Exported Functions ────────────────────────────────────────────────────────

/**
 * Send a chat message to Gemini with full conversation history.
 */
const sendChatMessage = async (conversationHistory, systemPrompt = SYSTEM_PROMPT) => {
  const contents = mapHistoryToGemini(conversationHistory);
  console.log(`[${new Date().toISOString()}] Sending ${conversationHistory.length} messages in conversation history to Gemini API...`);
  const result = await callWithFallback(contents, systemPrompt, 8192);
  console.log(`[${new Date().toISOString()}] Gemini API result: success=${result.success}, error=${result.error || 'none'}`);
  return result;
};

/**
 * Generate a single journaling prompt using Gemini.
 */
const generateJournalPrompt = async () => {
  const contents = [{
    role: 'user',
    parts: [{ text: 'Give me one unique journaling prompt for emotional self-reflection. Make it thought-provoking and introspective. Return ONLY the prompt question, nothing else. No numbering, no prefix.' }]
  }];
  const systemText = 'You are a mindful journaling assistant. Generate one thoughtful, emotionally insightful journaling prompt. Return ONLY the prompt question, nothing else.';
  return callWithFallback(contents, systemText, 8192);
};

/**
 * Get warm, reflective AI feedback on a journal entry.
 */
const getJournalFeedback = async (journalText) => {
  const contents = [{
    role: 'user',
    parts: [{ text: `Here is my journal entry:\n\n${journalText}\n\nPlease share a warm reflection on what I wrote.` }]
  }];
  const systemText = "You are a compassionate journaling companion. Read the user's journal entry and provide a warm, thoughtful reflection. Acknowledge their emotions, highlight patterns or strengths you notice, and offer one gentle insight or question for further exploration. Keep your response to 3-5 sentences. Be warm and genuine, not clinical.";
  return callWithFallback(contents, systemText, 8192);
};

/**
 * Generate a personalized dashboard analysis using Gemini.
 */
const generateDashboardAnalysis = async (userDataSummary) => {
  const contents = [{
    role: 'user',
    parts: [{ text: `Here is my recent wellness data:\n\n${userDataSummary}\n\nPlease provide a personalized analysis of my emotional wellness.` }]
  }];
  const systemText = "You are EmoCare AI, an emotional wellness analyst. Based on the user's data summary, provide a personalized, warm analysis of their emotional wellness trends. Include: 1) A brief overview of their emotional state, 2) Key patterns you notice, 3) Two specific, actionable suggestions. Keep the tone supportive and encouraging. Use 4-6 sentences total.";
  return callWithFallback(contents, systemText, 8192);
};

module.exports = {
  sendChatMessage,
  generateJournalPrompt,
  getJournalFeedback,
  generateDashboardAnalysis,
  SYSTEM_PROMPT,
};
