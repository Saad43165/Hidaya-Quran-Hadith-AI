import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface VocabularyState {
  wordCount: number;
  setWordCount: (count: number) => void;
  hydrate: () => Promise<void>;
}

const COUNT_KEY = 'kitaabai.vocabulary.count';

export const useVocabularyStore = create<VocabularyState>((set) => ({
  wordCount: 0,

  setWordCount: (count) => {
    set({ wordCount: count });
    AsyncStorage.setItem(COUNT_KEY, String(count)).catch(() => {});
  },

  hydrate: async () => {
    const val = await AsyncStorage.getItem(COUNT_KEY);
    set({ wordCount: val ? parseInt(val, 10) : 0 });
  },
}));
