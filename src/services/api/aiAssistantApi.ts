import axios, { isAxiosError } from 'axios';
import { ChatMessage } from '../../types/models';
import { Madhab, KnowledgeLevel, AILanguage, ConversationMode } from '../../store/useAIStore';

const GROQ_URL        = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_MODEL      = 'llama-3.3-70b-versatile';  // 70B — accurate Islamic knowledge
const GROQ_MODEL_FAST = 'llama-3.1-8b-instant';     // 8B — context prompts only (low latency)

export class AssistantNotConfiguredError extends Error {}

// ── Reading context (unchanged — ContextualAssistant uses this) ────────────────

export interface ReadingContext {
  type: 'surah' | 'hadith' | 'juz' | 'dua';
  surahNumber?: number;
  surahName?: string;
  ayahNumber?: number;
  arabicText?: string;
  translation?: string;
  collectionName?: string;
  chapterName?: string;
  hadithNumber?: number;
  hadithText?: string;
}

export interface AIPrefs {
  madhab:   Madhab;
  level:    KnowledgeLevel;
  language: AILanguage;
  mode:     ConversationMode;
}

// ── System prompt builder ──────────────────────────────────────────────────────

const MADHAB_LABELS: Record<Madhab, string> = {
  hanafi:  'Hanafi',
  shafii:  "Shafi'i",
  maliki:  'Maliki',
  hanbali: 'Hanbali',
  none:    'No preference — present mainstream scholarly view',
};

const LEVEL_INSTRUCTIONS: Record<KnowledgeLevel, string> = {
  beginner:     'Use simple language. Avoid Arabic jargon. Explain every Islamic term in plain English. Use relatable everyday analogies.',
  intermediate: 'Use some Arabic terms with brief parenthetical explanations. Assume familiarity with the five pillars and basic Islamic concepts.',
  advanced:     'Scholarly tone is appropriate. Use Arabic terminology freely. Reference classical scholars and their positions where relevant.',
};

const LANGUAGE_INSTRUCTIONS: Record<AILanguage, string> = {
  en: 'Respond entirely in English.',
  ur: 'Respond entirely in Urdu. Use Arabic script for Quranic quotations and du\'a text. Do not mix in English except for proper names.',
  ar: 'Respond entirely in Modern Standard Arabic (Fusha). Use proper Arabic grammatical structures.',
};

const MODE_INSTRUCTIONS: Record<ConversationMode, string> = {
  general: '',
  tafsir:  'MODE — TAFSIR: Focus on explaining the meaning of Quranic verses. Cover: (1) literal meaning of the Arabic, (2) asbab al-nuzul (reasons for revelation) if known, (3) tafsir from Ibn Kathir or al-Tabari, (4) practical lessons for today. Always quote the Arabic ayah text.',
  dua:     'MODE — DU\'A FINDER: Your task is to find the most relevant authenticated du\'a from Quran and Sunnah for the user\'s situation. Always provide in this exact format: Arabic text (in Arabic script) → Transliteration → Translation → Source reference. Only recommend authentic du\'as with verifiable chains.',
  fiqh:    'MODE — FIQH: Answer Islamic jurisprudence questions. Present the view of the user\'s madhab first. Then briefly note if there is significant khilaf (scholarly difference) among the four major madhabs. Distinguish between ijma\' (consensus) and khilaf clearly. Always conclude by saying: "Consult a qualified scholar for personal rulings."',
  learn:   'MODE — LEARN: Teach the topic systematically. Start with the definition and importance, give Quranic and Sunnah evidence, share a brief historical context, and end with 2-3 actionable takeaways. Use numbered steps or bullet points to organize.',
  seerah:  'MODE — SEERAH: Answer questions about the life of Prophet Muhammad ﷺ. Base your answers on authenticated sources: Sahih hadith, Ibn Hisham\'s Seerah, and Ibn Kathir\'s Al-Bidaya wan-Nihaya. Include dates/years where known. Always send salawat (ﷺ) after the Prophet\'s name.',
  word:    'MODE — ARABIC WORD: Explain Quranic Arabic words with linguistic depth. Cover: (1) the three-letter root (جذر) and its core meaning, (2) how this word is used across different surahs, (3) how the Quran\'s usage differs from everyday Arabic, (4) morphological form (verb/noun/adjective). Use Arabic script for all Arabic text.',
};

function buildSystemPrompt(prefs?: Partial<AIPrefs>, context?: ReadingContext): string {
  const madhab   = prefs?.madhab   ?? 'none';
  const level    = prefs?.level    ?? 'intermediate';
  const language = prefs?.language ?? 'en';
  const mode     = prefs?.mode     ?? 'general';

  let prompt = `You are IlmAI — a scholarly Islamic AI assistant with mastery of Quran, Hadith, Fiqh, Tafsir, Seerah, and Islamic history.

═══ SCHOLARLY STANDARDS ═══
• Source hierarchy: Quran (primary) → Sahih Bukhari & Sahih Muslim → remaining Kutub al-Sittah → classical scholars
• Cite references in this exact format: [Quran 2:255] or [Bukhari 6311] or [Muslim 2308]
• NEVER fabricate references. If unsure of a number, describe the hadith and say "exact reference uncertain"
• For fiqh: distinguish ijma' (consensus) from khilaf (scholarly difference); note the madhab positions
• NEVER issue personal fatwas. Say: "For a personal ruling, please consult a qualified scholar."
• When quoting any ayah or du'a, always include the Arabic text in Arabic script

═══ FORMATTING ═══
• Be concise and mobile-friendly — maximum 4 short paragraphs unless mode requires more
• Use **bold** for Islamic terms on first use in a response
• Use bullet points starting with • for lists (not dashes or asterisks)
• Separate paragraphs with a blank line
• For du'a: Arabic text → transliteration → translation → source — always in this order

═══ USER PROFILE ═══
• Madhab preference: ${MADHAB_LABELS[madhab]}
• Knowledge level: ${level} — ${LEVEL_INSTRUCTIONS[level]}
• ${LANGUAGE_INSTRUCTIONS[language]}`;

  const modeInstruction = MODE_INSTRUCTIONS[mode];
  if (modeInstruction) {
    prompt += `\n\n═══ ACTIVE MODE ═══\n${modeInstruction}`;
  }

  // Inject reading context if available
  if (context) {
    if (context.type === 'surah') {
      prompt += `\n\n═══ READING CONTEXT ═══\nThe user is currently reading Surah ${context.surahName ?? ''} (${context.surahNumber ?? ''})`;
      if (context.ayahNumber) prompt += `, Ayah ${context.ayahNumber}`;
      if (context.arabicText) prompt += `\nArabic: ${context.arabicText}`;
      if (context.translation) prompt += `\nTranslation: ${context.translation}`;
      prompt += `\nAnswer in the context of what they are reading.`;
    } else if (context.type === 'hadith') {
      prompt += `\n\n═══ READING CONTEXT ═══\nThe user is reading: ${context.collectionName ?? 'Hadith'}`;
      if (context.chapterName) prompt += `, Chapter: "${context.chapterName}"`;
      if (context.hadithNumber) prompt += `, Hadith #${context.hadithNumber}`;
      if (context.hadithText) prompt += `\nText excerpt: ${context.hadithText.slice(0, 250)}`;
      prompt += `\nAnswer in the context of this chapter.`;
    }
  }

  return prompt;
}

// ── Low-level helpers ──────────────────────────────────────────────────────────

function getGroqKey(): string {
  const key = process.env.EXPO_PUBLIC_GROQ_API_KEY ?? '';
  if (!key) throw new AssistantNotConfiguredError(
    'Add EXPO_PUBLIC_GROQ_API_KEY to your .env file.\nGet a free key at console.groq.com'
  );
  return key;
}

function buildMessageHistory(
  history: ChatMessage[],
  message: string,
  systemPrompt: string,
): Array<{ role: string; content: string }> {
  const msgs: Array<{ role: string; content: string }> = [
    { role: 'system', content: systemPrompt },
  ];
  for (const m of history.slice(-12)) {
    if (!m.isError) {
      msgs.push({ role: m.role === 'assistant' ? 'assistant' : 'user', content: m.content });
    }
  }
  msgs.push({ role: 'user', content: message });
  return msgs;
}

// ── Streaming call ─────────────────────────────────────────────────────────────

async function callGroqStream(
  messages: Array<{ role: string; content: string }>,
  onToken: (token: string) => void,
  model = GROQ_MODEL,
  maxTokens = 1000,
): Promise<string> {
  const key = getGroqKey();

  const response = await fetch(GROQ_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: 0.45,
      max_tokens: maxTokens,
      stream: true,
    }),
  });

  if (!response.ok) {
    const errBody = await response.json().catch(() => ({}));
    const status = response.status;
    if (status === 401) throw new Error('Invalid Groq API key. Check your .env file.');
    if (status === 429) throw new Error('Rate limited. Please wait a moment and try again.');
    throw new Error(`Groq error ${status}: ${(errBody as any)?.error?.message ?? 'Unknown error'}`);
  }

  // Streaming via ReadableStream (works in RN with Hermes)
  const body = response.body;
  if (!body) {
    // Fallback: read as text if streaming body unavailable
    const text = await response.text();
    const data = JSON.parse(text);
    const content = data.choices?.[0]?.message?.content ?? '';
    onToken(content);
    return content;
  }

  const reader = body.getReader();
  const decoder = new TextDecoder('utf-8');
  let fullText = '';
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed === 'data: [DONE]') continue;
      if (trimmed.startsWith('data: ')) {
        try {
          const json = JSON.parse(trimmed.slice(6));
          const token: string = json.choices?.[0]?.delta?.content ?? '';
          if (token) {
            fullText += token;
            onToken(token);
          }
        } catch {}
      }
    }
  }

  return fullText;
}

// ── Non-streaming call (for context prompts and ContextualAssistant) ───────────

async function callGroq(
  messages: Array<{ role: string; content: string }>,
  model = GROQ_MODEL,
  maxTokens = 800,
): Promise<string> {
  const key = getGroqKey();
  const response = await axios.post(
    GROQ_URL,
    { model, messages, temperature: 0.4, max_tokens: maxTokens },
    {
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      timeout: 30000,
    },
  );
  return response.data.choices[0].message.content as string;
}

function wrapAxiosError(e: unknown): Error {
  if (e instanceof AssistantNotConfiguredError) return e;
  if (isAxiosError(e)) {
    const status = e.response?.status;
    if (status === 401) return new Error('Invalid Groq API key. Check EXPO_PUBLIC_GROQ_API_KEY in .env');
    if (status === 429) return new Error('Rate limited by Groq. Please wait a moment and try again.');
    if (status === 400) return new Error('Request error. Try a shorter message.');
  }
  if (e instanceof Error && e.message.includes('timeout')) {
    return new Error('Response timed out. Check your internet connection.');
  }
  return new Error('Could not reach the AI. Check your internet connection.');
}

// ── Public API ─────────────────────────────────────────────────────────────────

/**
 * Streaming send — primary path for AssistantScreen.
 * Calls onToken for each streamed chunk; resolves to the final ChatMessage.
 */
export async function sendAssistantMessageStreaming(
  history: ChatMessage[],
  message: string,
  opts: {
    prefs?: Partial<AIPrefs>;
    context?: ReadingContext;
    onToken: (token: string) => void;
  },
): Promise<ChatMessage> {
  try {
    const systemPrompt = buildSystemPrompt(opts.prefs, opts.context);
    const msgs = buildMessageHistory(history, message, systemPrompt);
    const fullText = await callGroqStream(msgs, opts.onToken);
    return {
      id: `${Date.now()}-ai`,
      role: 'assistant',
      content: fullText,
      createdAt: Date.now(),
    };
  } catch (e) {
    throw wrapAxiosError(e);
  }
}

/**
 * Non-streaming send — kept for backward compat (ContextualAssistant).
 */
export async function sendAssistantMessage(
  history: ChatMessage[],
  message: string,
  context?: ReadingContext,
): Promise<ChatMessage> {
  try {
    const systemPrompt = buildSystemPrompt(undefined, context);
    const msgs = buildMessageHistory(history, message, systemPrompt);
    const reply = await callGroq(msgs, GROQ_MODEL, 800);
    return {
      id: `${Date.now()}-ai`,
      role: 'assistant',
      content: reply,
      createdAt: Date.now(),
    };
  } catch (e) {
    throw wrapAxiosError(e);
  }
}

/**
 * Proactive context insight — shown when user opens a Surah or Hadith chapter.
 * Uses the fast model; silently fails so it never blocks the reader.
 */
export async function fetchContextPrompt(context: ReadingContext): Promise<string> {
  try {
    getGroqKey();
    let userMsg = '';
    if (context.type === 'surah' && context.surahName) {
      userMsg = `I just opened Surah ${context.surahName} (${context.surahNumber}). `
        + `Give me one fascinating insight in 2 sentences max to help me read it carefully. Be direct.`;
    } else if (context.type === 'hadith' && context.chapterName) {
      userMsg = `I just opened the hadith chapter on "${context.chapterName}" in ${context.collectionName}. `
        + `In 2 sentences, tell me why this topic matters and what to look for as I read.`;
    } else {
      return '';
    }
    const reply = await callGroq(
      [{ role: 'system', content: buildSystemPrompt() }, { role: 'user', content: userMsg }],
      GROQ_MODEL_FAST,
      120,
    );
    return reply;
  } catch {
    return '';
  }
}
