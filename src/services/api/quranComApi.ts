/**
 * quran.com API v4 client
 * Base: https://api.quran.com/api/v4
 * No auth required for public endpoints.
 */
import axios from 'axios';

const client = axios.create({
  baseURL: 'https://api.quran.com/api/v4',
  timeout: 12000,
  headers: { Accept: 'application/json' },
});

// ─── Tafsir IDs ──────────────────────────────────────────────────────────────
export const TAFSIR_OPTIONS = [
  { id: 169, name: 'Ibn Kathir (English)', lang: 'en', short: 'Ibn Kathir' },
  { id: 168, name: 'Maariful Quran (English)', lang: 'en', short: 'Maariful Quran' },
  { id: 817, name: 'Tafseer e Usmani (Urdu)', lang: 'ur', short: 'Usmani (Ur)' },
  { id: 97,  name: 'Maududi Tafheem (Urdu)', lang: 'ur', short: 'Maududi (Ur)' },
] as const;

export type TafsirId = (typeof TAFSIR_OPTIONS)[number]['id'];

// ─── Tafsir for one ayah ─────────────────────────────────────────────────────
export interface TafsirResult {
  ayahKey: string;       // e.g. "2:255"
  tafsirId: number;
  text: string;
}

export async function fetchTafsir(
  surahNumber: number,
  ayahNumber: number,
  tafsirId: TafsirId = 169,
): Promise<TafsirResult> {
  const ayahKey = `${surahNumber}:${ayahNumber}`;
  const { data } = await client.get(`/tafsirs/${tafsirId}/by_ayah/${ayahKey}`);
  const raw: string = data?.tafsir?.text ?? '';
  // Strip HTML tags from response
  const text = raw.replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&nbsp;/g, ' ').trim();
  return { ayahKey, tafsirId, text };
}

// ─── Word-by-word for one verse ───────────────────────────────────────────────
export interface WordInfo {
  position: number;
  arabic: string;
  transliteration: string;
  translation: string;
  rootArabic?: string;
  grammar?: string;
}

export async function fetchWordByWord(
  surahNumber: number,
  ayahNumber: number,
): Promise<WordInfo[]> {
  const verseKey = `${surahNumber}:${ayahNumber}`;
  const { data } = await client.get(`/verses/by_key/${verseKey}`, {
    params: {
      words: true,
      word_fields: 'text_uthmani,transliteration,text_translation',
      translation_fields: 'text_plain',
    },
  });

  const words: WordInfo[] = [];
  for (const w of (data?.verse?.words ?? [])) {
    if (w.char_type_name === 'end') continue; // skip verse-end marker
    words.push({
      position: w.position,
      arabic: w.text_uthmani ?? w.text ?? '',
      transliteration: w.transliteration?.text ?? '',
      translation: w.translation?.text ?? '',
      grammar: w.char_type_name ?? '',
    });
  }
  return words;
}

// ─── Audio recitations ────────────────────────────────────────────────────────
// everyayah.com is simpler for per-ayah audio — direct URL construction:
export function getAyahAudioUrl(
  surahNumber: number,
  ayahNumber: number,
  reciter = 'Alafasy_128kbps',
): string {
  const s = String(surahNumber).padStart(3, '0');
  const a = String(ayahNumber).padStart(3, '0');
  return `https://everyayah.com/data/${reciter}/${s}${a}.mp3`;
}
