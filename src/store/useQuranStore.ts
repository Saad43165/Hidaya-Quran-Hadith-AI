import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type TranslationLanguage = 'en.sahih' | 'ur.ahmedali' | 'none';

export const TRANSLATION_LABELS: Record<TranslationLanguage, string> = {
  'en.sahih':    'English (Sahih International)',
  'ur.ahmedali': 'اردو (احمد علی)',
  'none':        'Arabic Only',
};

interface QuranState {
  fontSize: number;          // 16–32
  translationLang: TranslationLanguage;
  setFontSize: (size: number) => Promise<void>;
  setTranslationLang: (lang: TranslationLanguage) => Promise<void>;
  hydrate: () => Promise<void>;
}

const FONT_SIZE_KEY    = 'kitaabai.quran.fontSize';
const TRANS_LANG_KEY   = 'kitaabai.quran.translationLang';

export const useQuranStore = create<QuranState>((set) => ({
  fontSize: 24,
  translationLang: 'en.sahih',

  setFontSize: async (size) => {
    await AsyncStorage.setItem(FONT_SIZE_KEY, String(size));
    set({ fontSize: size });
  },

  setTranslationLang: async (lang) => {
    await AsyncStorage.setItem(TRANS_LANG_KEY, lang);
    set({ translationLang: lang });
  },

  hydrate: async () => {
    const [sizeStr, lang] = await Promise.all([
      AsyncStorage.getItem(FONT_SIZE_KEY),
      AsyncStorage.getItem(TRANS_LANG_KEY),
    ]);
    set({
      fontSize: sizeStr ? parseInt(sizeStr, 10) : 24,
      translationLang: (lang as TranslationLanguage) ?? 'en.sahih',
    });
  },
}));
