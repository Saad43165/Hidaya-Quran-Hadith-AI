import axios from 'axios';
import { fetchWithCache } from '../db/cacheRepo';
import { Hadith, HadithCollection, HadithCollectionDetail } from '../../types/models';
import { getChapterName } from '../../data/hadithChapters';

const hadithClient = axios.create({
  baseURL: 'https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1',
  timeout: 30000,
});

interface RawEditionsResponse {
  [collectionId: string]: {
    name: string;
    collection: Array<{ name: string; book: string; language: string }>;
  };
}

interface RawHadithEdition {
  metadata: {
    name: string;
    section?: Record<string, string>; // book number → chapter name
  };
  hadiths: Array<{
    hadithnumber: number;
    arabicnumber: number;
    text: string;
    reference: { book: number; hadith: number };
  }>;
}

export async function fetchHadithCollections(): Promise<HadithCollection[]> {
  return fetchWithCache('hadith-collections', async () => {
    const { data } = await hadithClient.get<RawEditionsResponse>('/editions.min.json');
    return Object.entries(data).map(([id, value]) => ({
      id,
      name: value.name,
      hasArabic: value.collection.some((c) => c.language === 'Arabic'),
    }));
  });
}

export interface HadithChapter {
  bookNumber: number;
  name: string;
  hadiths: Hadith[];
}

export interface HadithCollectionWithChapters extends HadithCollectionDetail {
  chapters: HadithChapter[];
}

export async function fetchHadithCollectionDetail(
  collectionId: string
): Promise<HadithCollectionWithChapters> {
  return fetchWithCache(`hadith-collection:${collectionId}`, async () => {
    const englishReq = hadithClient.get<RawHadithEdition>(
      `/editions/eng-${collectionId}.min.json`
    );
    const arabicReq = hadithClient
      .get<RawHadithEdition>(`/editions/ara-${collectionId}.min.json`)
      .catch(() => null);

    const [englishRes, arabicRes] = await Promise.all([englishReq, arabicReq]);
    const english = englishRes.data;
    const arabicByNumber = new Map<number, string>();
    arabicRes?.data.hadiths.forEach((h) =>
      arabicByNumber.set(h.hadithnumber, h.text)
    );

    // Build hadiths array
    const hadiths: Hadith[] = english.hadiths.map((h) => ({
      hadithNumber: h.hadithnumber,
      arabicNumber: h.arabicnumber,
      text: h.text,
      arabicText: arabicByNumber.get(h.hadithnumber),
      bookReference: h.reference.book,
    }));

    // Group into chapters by bookReference
    const chapterMap = new Map<number, Hadith[]>();
    hadiths.forEach((h) => {
      const book = h.bookReference ?? 1;
      if (!chapterMap.has(book)) chapterMap.set(book, []);
      chapterMap.get(book)!.push(h);
    });

    // Build chapters array with proper names
    // Prefer API-provided section names, fall back to our static mapping
    const apiSections = english.metadata.section ?? {};
    const chapters: HadithChapter[] = Array.from(chapterMap.entries())
      .sort(([a], [b]) => a - b)
      .map(([bookNumber, bookHadiths]) => ({
        bookNumber,
        name:
          apiSections[String(bookNumber)] ??
          getChapterName(collectionId, bookNumber),
        hadiths: bookHadiths,
      }));

    return {
      id: collectionId,
      name: english.metadata.name,
      hadiths,
      chapters,
    };
  });
}
