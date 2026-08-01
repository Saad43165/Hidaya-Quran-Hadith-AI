import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

type ThemeMode = 'light' | 'dark';

interface ThemeState {
  mode: ThemeMode;
  isDark: boolean;
  toggleTheme: () => Promise<void>;
  hydrate: () => Promise<void>;
}

const KEY = 'kitaabai.theme';

export const useThemeStore = create<ThemeState>((set, get) => ({
  mode: 'light',
  isDark: false,
  toggleTheme: async () => {
    const next: ThemeMode = get().mode === 'light' ? 'dark' : 'light';
    await AsyncStorage.setItem(KEY, next);
    set({ mode: next, isDark: next === 'dark' });
  },
  hydrate: async () => {
    const stored = await AsyncStorage.getItem(KEY);
    const mode = (stored as ThemeMode) ?? 'light';
    set({ mode, isDark: mode === 'dark' });
  },
}));
