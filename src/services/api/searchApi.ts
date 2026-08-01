import { quranClient } from './client';
import { fetchWithCache } from '../db/cacheRepo';
import { Surah } from '../../types/models';

export interface QuranSearchResult {
  surahNumber: number;
  surahName: string;
  surahEnglishName: string;
  ayahNumber: number;
  arabicText: string;
  translationText: string;
}

/**
 * Search the Quran by keyword using alquran.cloud's search endpoint.
 * Falls back to offline cache for previously searched terms.
 */
export async function searchQuran(query: string, language: string = 'en'): Promise<QuranSearchResult[]> {
  if (!query.trim()) return [];
  const cacheKey = `search:quran:${language}:${query.toLowerCase().trim()}`;
  return fetchWithCache(cacheKey, async () => {
    const edition = language === 'ur' ? 'ur.ahmedali' : 'en.sahih';
    const { data } = await quranClient.get(`/search/${encodeURIComponent(query)}/${edition}`);
    const matches = data?.data?.matches ?? [];
    return matches.map((m: any) => ({
      surahNumber: m.surah.number,
      surahName: m.surah.name,
      surahEnglishName: m.surah.englishName,
      ayahNumber: m.numberInSurah,
      arabicText: m.text ?? '',
      translationText: m.text ?? '',
    }));
  });
}

export interface HadithSearchResult {
  collectionId: string;
  collectionName: string;
  hadithNumber: number;
  text: string;
}

/**
 * Search hadiths locally from cached collection data.
 * No extra API calls — works offline after the collection is loaded once.
 */
export async function searchHadithsLocal(
  query: string,
  cachedCollections: Array<{ id: string; name: string; hadiths: Array<{ hadithNumber: number; text: string }> }>
): Promise<HadithSearchResult[]> {
  if (!query.trim()) return [];
  const q = query.toLowerCase();
  const results: HadithSearchResult[] = [];
  for (const col of cachedCollections) {
    for (const h of col.hadiths) {
      if (h.text.toLowerCase().includes(q)) {
        results.push({ collectionId: col.id, collectionName: col.name, hadithNumber: h.hadithNumber, text: h.text });
        if (results.length >= 50) return results; // cap at 50
      }
    }
  }
  return results;
}
