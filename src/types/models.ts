export interface Surah {
  number: number;
  name: string; // Arabic name
  englishName: string;
  englishNameTranslation: string;
  numberOfAyahs: number;
  revelationType: 'Meccan' | 'Medinan';
}

export interface Ayah {
  numberInSurah: number;
  text: string; // Arabic text
  translation?: string;
  audioUrl?: string;
}

export interface SurahDetail extends Surah {
  ayahs: Ayah[];
}

export interface Book {
  id: string;
  title: string;
  author: string;
  coverUrl?: string;
  source: 'google_books' | 'gutenberg';
  language: string;
  description?: string;
  sourceUrl?: string; // link to read/preview the book on its origin site
  progress?: number; // 0-1, reading progress
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: number;
}

export interface HadithCollection {
  id: string; // e.g. "bukhari"
  name: string; // e.g. "Sahih al Bukhari"
  hasArabic: boolean;
}

export interface Hadith {
  hadithNumber: number;
  arabicNumber: number;
  text: string; // English (or requested language) text
  arabicText?: string;
  bookReference: number;
}

export interface HadithCollectionDetail {
  id: string;
  name: string;
  hadiths: Hadith[];
}

export interface PrayerTimes {
  Fajr: string;
  Sunrise: string;
  Dhuhr: string;
  Asr: string;
  Maghrib: string;
  Isha: string;
  date: string; // YYYY-MM-DD
  city: string;
  country: string;
  timezone: string;
  method: number;
}

export type PrayerName = 'Fajr' | 'Dhuhr' | 'Asr' | 'Maghrib' | 'Isha';
export const PRAYER_NAMES: PrayerName[] = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];

export type BookmarkType = 'ayah' | 'hadith';

export interface Bookmark {
  id: string; // e.g. "ayah:2:255" or "hadith:bukhari:12"
  type: BookmarkType;
  // Ayah bookmarks:
  surahNumber?: number;
  surahName?: string;
  ayahNumber?: number;
  // Hadith bookmarks:
  collectionId?: string;
  collectionName?: string;
  hadithNumber?: number;
  // Common:
  snippet: string; // short preview text shown in the bookmarks list
  createdAt: number;
  updatedAt: number;
}

export interface ReadingProgress {
  key: 'quran' | 'hadith'; // one row per content type
  surahNumber?: number;
  surahName?: string;
  ayahNumber?: number;
  collectionId?: string;
  collectionName?: string;
  updatedAt: number;
}

export type SupportedLanguage = 'en' | 'ur' | 'ar';

export interface JuzEntry {
  number: number;
  arabic: string;
  urdu: string;
  english: string;
  startSurah: number;
  startAyah: number;
}

export interface Ayah {
  numberInSurah: number;
  number?: number; // global verse number for audio
  text: string;
  translation?: string;
  audioUrl?: string;
}
