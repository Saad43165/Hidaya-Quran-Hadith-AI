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

import { getDb, ensureDatabaseReady } from '../db/database';

export interface HadithSearchResult {
  collectionId: string;
  collectionName: string;
  hadithNumber: number;
  text: string;
}

/**
 * Search hadiths locally from SQLite content_cache.
 * No network calls — works offline for any cached collection.
 */
export async function searchHadiths(query: string): Promise<HadithSearchResult[]> {
  await ensureDatabaseReady();
  const q = query.toLowerCase().trim();
  if (!q) return [];

  const rows = await getDb().getAllAsync<{ json_blob: string }>(
    "SELECT json_blob FROM content_cache WHERE cache_key LIKE 'hadith-collection:%'"
  );

  const results: HadithSearchResult[] = [];
  for (const row of rows) {
    try {
      const data = JSON.parse(row.json_blob);
      if (data && Array.isArray(data.hadiths)) {
        for (const h of data.hadiths) {
          if (h.text && h.text.toLowerCase().includes(q)) {
            results.push({
              collectionId: data.id,
              collectionName: data.name,
              hadithNumber: h.hadithNumber,
              text: h.text,
            });
            if (results.length >= 50) return results;
          }
        }
      }
    } catch {
      // ignore JSON parse error
    }
  }
  return results;
}
