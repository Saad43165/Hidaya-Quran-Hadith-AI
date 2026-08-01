import { fetchWithCache } from '../db/cacheRepo';
import { quranClient } from './client';
import { WordToken } from '../../types/models';

export interface WordByWordAyah {
  numberInSurah: number;
  words: WordToken[];
}

interface AlquranWordToken {
  text: { arab: string };
  transliteration?: { text?: string };
  translation?: { text?: string };
}

interface AlquranAyah {
  numberInSurah: number;
  words?: AlquranWordToken[];
}

function mapAyahs(ayahs: AlquranAyah[]): WordByWordAyah[] {
  return ayahs.map(a => ({
    numberInSurah: a.numberInSurah,
    words: (a.words ?? []).map(w => ({
      arabic: w.text?.arab ?? '',
      transliteration: w.transliteration?.text ?? '',
      translation: w.translation?.text ?? '',
    })),
  }));
}

export async function fetchWordByWordSurah(surahNumber: number): Promise<WordByWordAyah[]> {
  return fetchWithCache<WordByWordAyah[]>(
    `word-surah:${surahNumber}`,
    async () => {
      const res = await quranClient.get<{ data: { ayahs: AlquranAyah[] } }>(
        `/surah/${surahNumber}/quran-words`,
      );
      return mapAyahs(res.data.data.ayahs);
    },
  );
}
