import axios, { isAxiosError } from 'axios';
import { ChatMessage } from '../../types/models';

/**
 * Direct Groq API integration — no backend server required.
 * The key is set via EXPO_PUBLIC_GROQ_API_KEY, which EAS injects at
 * build time and never appears in your source code or GitHub repo.
 *
 * Free tier: 14,400 requests/day, 500 req/min — more than enough for launch.
 * https://console.groq.com
 */

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_MODEL = 'llama-3.1-8b-instant'; // fastest, free, great for mobile

export class AssistantNotConfiguredError extends Error {}

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

const BASE_SYSTEM_PROMPT = `You are KitaabAI — a warm, knowledgeable Islamic reading companion.
Help users understand the Quran, Hadith, and Islamic texts they are currently reading.

Guidelines:
- Be concise and mobile-friendly. No walls of text.
- Tailor answers to the specific content the user is reading.
- For Quranic verses: explain meaning, context (asbab al-nuzul), and lessons.
- For Hadith: explain the teaching, its application, and relevant scholarly context.
- Never fabricate verse numbers, hadith numbers, or scholar quotes.
- For fiqh rulings: give background but recommend a qualified local scholar for personal decisions.
- You are a reading companion, not a mufti. Never issue personal fatwas.
- Respond in the same language the user writes in (English, Urdu, or Arabic).`;

function buildContextBlock(context?: ReadingContext): string {
  if (!context) return '';
  if (context.type === 'surah') {
    let block = `\n\n[USER IS READING: Surah ${context.surahName ?? ''} (${context.surahNumber ?? ''})`;
    if (context.ayahNumber) block += `, Ayah ${context.ayahNumber}`;
    if (context.arabicText) block += `\nArabic: ${context.arabicText}`;
    if (context.translation) block += `\nTranslation: ${context.translation}`;
    block += `\nAnswer in the context of this specific content.]`;
    return block;
  }
  if (context.type === 'hadith') {
    let block = `\n\n[USER IS READING: ${context.collectionName ?? 'Hadith'}`;
    if (context.chapterName) block += `, Chapter: ${context.chapterName}`;
    if (context.hadithNumber) block += `, Hadith #${context.hadithNumber}`;
    if (context.hadithText) block += `\nText: ${context.hadithText.slice(0, 200)}...`;
    block += `\nAnswer in the context of this chapter and hadith.]`;
    return block;
  }
  return '';
}

function buildMessages(
  history: ChatMessage[],
  message: string,
  context?: ReadingContext,
): Array<{ role: string; content: string }> {
  const systemContent = BASE_SYSTEM_PROMPT + buildContextBlock(context);
  const msgs: Array<{ role: string; content: string }> = [
    { role: 'system', content: systemContent },
  ];
  // Cap history at last 10 messages to keep tokens low
  for (const m of history.slice(-10)) {
    msgs.push({ role: m.role === 'assistant' ? 'assistant' : 'user', content: m.content });
  }
  msgs.push({ role: 'user', content: message });
  return msgs;
}

function getGroqKey(): string {
  const key = process.env.EXPO_PUBLIC_GROQ_API_KEY ?? '';
  if (!key) throw new AssistantNotConfiguredError(
    'Add EXPO_PUBLIC_GROQ_API_KEY to your .env file.\nGet a free key at console.groq.com'
  );
  return key;
}

async function callGroq(
  messages: Array<{ role: string; content: string }>,
  maxTokens = 600,
): Promise<string> {
  const key = getGroqKey();
  const response = await axios.post(
    GROQ_URL,
    { model: GROQ_MODEL, messages, temperature: 0.4, max_tokens: maxTokens },
    {
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      timeout: 30000,
    }
  );
  return response.data.choices[0].message.content as string;
}

export async function sendAssistantMessage(
  history: ChatMessage[],
  message: string,
  context?: ReadingContext,
): Promise<ChatMessage> {
  try {
    const messages = buildMessages(history, message, context);
    const reply = await callGroq(messages, 800);
    return {
      id: `${Date.now()}-ai`,
      role: 'assistant',
      content: reply,
      createdAt: Date.now(),
    };
  } catch (e) {
    if (e instanceof AssistantNotConfiguredError) throw e;
    if (isAxiosError(e)) {
      const status = e.response?.status;
      if (status === 401) throw new Error('Invalid Groq API key. Check EXPO_PUBLIC_GROQ_API_KEY in .env');
      if (status === 429) throw new Error('Rate limited by Groq. Please wait a moment and try again.');
      if (status === 400) throw new Error('Request error. Try a shorter message.');
    }
    if (e instanceof Error && e.message.includes('timeout')) {
      throw new Error('Response timed out. Check your internet connection.');
    }
    throw new Error('Could not reach the AI. Check your internet connection.');
  }
}

/**
 * Proactive context insight — shown when user opens a Surah or Hadith chapter.
 * Short, max 100 tokens, silent fail so it never blocks the reader from loading.
 */
export async function fetchContextPrompt(context: ReadingContext): Promise<string> {
  try {
    getGroqKey(); // will throw AssistantNotConfiguredError if no key, caught below
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
      [{ role: 'system', content: BASE_SYSTEM_PROMPT }, { role: 'user', content: userMsg }],
      120
    );
    return reply;
  } catch {
    // Never block the reader — silent fail
    return '';
  }
}
