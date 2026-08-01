import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SupportedLanguage } from '../types/models';

interface AppState {
  hasOnboarded: boolean;
  language: SupportedLanguage;
  setHasOnboarded: (value: boolean) => Promise<void>;
  setLanguage: (lang: SupportedLanguage) => Promise<void>;
  hydrate: () => Promise<void>;
}

const ONBOARD_KEY = 'kitaabai.hasOnboarded';
const LANG_KEY = 'kitaabai.language';

export const useAppStore = create<AppState>((set) => ({
  hasOnboarded: false,
  language: 'en',

  setHasOnboarded: async (value) => {
    await AsyncStorage.setItem(ONBOARD_KEY, value ? '1' : '0');
    set({ hasOnboarded: value });
  },

  setLanguage: async (lang) => {
    await AsyncStorage.setItem(LANG_KEY, lang);
    set({ language: lang });
  },

  hydrate: async () => {
    const [onboarded, lang] = await Promise.all([
      AsyncStorage.getItem(ONBOARD_KEY),
      AsyncStorage.getItem(LANG_KEY),
    ]);
    set({
      hasOnboarded: onboarded === '1',
      language: (lang as SupportedLanguage) ?? 'en',
    });
  },
}));
