import { quranClient } from './client';
import { fetchWithCache } from '../db/cacheRepo';
import { Surah, SurahDetail, Ayah } from '../../types/models';

interface RawSurahListResponse {
  data: Array<{
    number: number;
    name: string;
    englishName: string;
    englishNameTranslation: string;
    numberOfAyahs: number;
    revelationType: string;
  }>;
}

interface RawSurahEditionResponse {
  data: {
    number: number;
    name: string;
    englishName: string;
    englishNameTranslation: string;
    revelationType: string;
    ayahs: Array<{ number: number; numberInSurah: number; text: string }>;
  };
}

export async function fetchSurahList(): Promise<Surah[]> {
  return fetchWithCache('surah-list', async () => {
    const { data } = await quranClient.get<RawSurahListResponse>('/surah');
    return data.data.map((s) => ({
      number: s.number,
      name: s.name,
      englishName: s.englishName,
      englishNameTranslation: s.englishNameTranslation,
      numberOfAyahs: s.numberOfAyahs,
      revelationType: s.revelationType as Surah['revelationType'],
    }));
  });
}

export async function fetchSurahDetail(
  surahNumber: number,
  translationEdition: string = 'en.sahih'
): Promise<SurahDetail> {
  const cacheKey = `surah:${surahNumber}:${translationEdition}`;
  return fetchWithCache(cacheKey, async () => {
    const requests: [Promise<any>, Promise<any>] = [
      quranClient.get<RawSurahEditionResponse>(`/surah/${surahNumber}/quran-uthmani`),
      translationEdition !== 'none'
        ? quranClient.get<RawSurahEditionResponse>(`/surah/${surahNumber}/${translationEdition}`)
        : Promise.resolve(null),
    ];

    const [arabicRes, translationRes] = await Promise.all(requests);
    const arabic = arabicRes.data.data;
    const transAyahs = translationRes?.data?.data?.ayahs ?? [];

    const ayahs: Ayah[] = arabic.ayahs.map((a: any, idx: number) => ({
      numberInSurah: a.numberInSurah,
      number: a.number,
      text: a.text,
      translation: transAyahs[idx]?.text,
    }));

    return {
      number: arabic.number,
      name: arabic.name,
      englishName: arabic.englishName,
      englishNameTranslation: arabic.englishNameTranslation,
      numberOfAyahs: ayahs.length,
      revelationType: arabic.revelationType as Surah['revelationType'],
      ayahs,
    };
  });
}

/** Fetch all ayahs for a specific Juz */
export async function fetchJuzDetail(
  juzNumber: number
): Promise<{ ayahs: Ayah[]; name: string }> {
  return fetchWithCache(`juz:${juzNumber}`, async () => {
    const [arabicRes, transRes] = await Promise.all([
      quranClient.get(`/juz/${juzNumber}/quran-uthmani`),
      quranClient.get(`/juz/${juzNumber}/en.sahih`),
    ]);

    const arabicAyahs = arabicRes.data.data.ayahs as Array<{
      number: number;
      numberInSurah: number;
      text: string;
      surah: { number: number; name: string; englishName: string };
    }>;
    const transAyahs = transRes.data.data.ayahs as Array<{ text: string }>;

    const ayahs: Ayah[] = arabicAyahs.map((a, idx) => ({
      numberInSurah: a.numberInSurah,
      number: a.number,
      text: a.text,
      translation: transAyahs[idx]?.text,
    }));

    return { ayahs, name: `Juz ${juzNumber}` };
  });
}
