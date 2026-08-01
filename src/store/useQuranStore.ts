import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type TranslationLanguage = 'en.sahih' | 'ur.ahmedali' | 'none';

export const TRANSLATION_LABELS: Record<TranslationLanguage, string> = {
  'en.sahih':    'English (Sahih International)',
  'ur.ahmedali': 'اردو (احمد علی)',
  'none':        'Arabic Only',
};

export type ReadingMode = 'cards' | 'flowing';

interface QuranState {
  fontSize: number;
  translationLang: TranslationLanguage;
  wordByWordEnabled: boolean;
  readingMode: ReadingMode;
  setFontSize: (size: number) => Promise<void>;
  setTranslationLang: (lang: TranslationLanguage) => Promise<void>;
  setWordByWordEnabled: (enabled: boolean) => Promise<void>;
  setReadingMode: (mode: ReadingMode) => Promise<void>;
  hydrate: () => Promise<void>;
}

const FONT_SIZE_KEY    = 'kitaabai.quran.fontSize';
const TRANS_LANG_KEY   = 'kitaabai.quran.translationLang';
const WORD_BY_WORD_KEY = 'kitaabai.quran.wordByWord';
const READING_MODE_KEY = 'kitaabai.quran.readingMode';

export const useQuranStore = create<QuranState>((set) => ({
  fontSize: 24,
  translationLang: 'en.sahih',
  wordByWordEnabled: false,
  readingMode: 'cards',

  setFontSize: async (size) => {
    await AsyncStorage.setItem(FONT_SIZE_KEY, String(size));
    set({ fontSize: size });
  },

  setTranslationLang: async (lang) => {
    await AsyncStorage.setItem(TRANS_LANG_KEY, lang);
    set({ translationLang: lang });
  },

  setWordByWordEnabled: async (enabled) => {
    await AsyncStorage.setItem(WORD_BY_WORD_KEY, enabled ? '1' : '0');
    set({ wordByWordEnabled: enabled });
  },

  setReadingMode: async (mode) => {
    await AsyncStorage.setItem(READING_MODE_KEY, mode);
    set({ readingMode: mode });
  },

  hydrate: async () => {
    const [sizeStr, lang, wbw, mode] = await Promise.all([
      AsyncStorage.getItem(FONT_SIZE_KEY),
      AsyncStorage.getItem(TRANS_LANG_KEY),
      AsyncStorage.getItem(WORD_BY_WORD_KEY),
      AsyncStorage.getItem(READING_MODE_KEY),
    ]);
    set({
      fontSize: sizeStr ? parseInt(sizeStr, 10) : 24,
      translationLang: (lang as TranslationLanguage) ?? 'en.sahih',
      wordByWordEnabled: wbw === '1',
      readingMode: (mode as ReadingMode) ?? 'cards',
    });
  },
}));
