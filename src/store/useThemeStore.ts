import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type ThemeMode = 'light' | 'dark' | 'amoled';

interface ThemeState {
  mode: ThemeMode;
  isDark: boolean;
  isAmoled: boolean;
  setTheme: (mode: ThemeMode) => Promise<void>;
  toggleTheme: () => Promise<void>;
  hydrate: () => Promise<void>;
}

const KEY = 'kitaabai.theme';

export const useThemeStore = create<ThemeState>((set, get) => ({
  mode: 'light',
  isDark: false,
  isAmoled: false,
  setTheme: async (mode: ThemeMode) => {
    await AsyncStorage.setItem(KEY, mode);
    set({ mode, isDark: mode !== 'light', isAmoled: mode === 'amoled' });
  },
  toggleTheme: async () => {
    const next: ThemeMode = get().mode === 'light' ? 'dark' : 'light';
    await AsyncStorage.setItem(KEY, next);
    set({ mode: next, isDark: next !== 'light', isAmoled: false });
  },
  hydrate: async () => {
    const stored = await AsyncStorage.getItem(KEY);
    const mode = (stored as ThemeMode) ?? 'light';
    set({ mode, isDark: mode !== 'light', isAmoled: mode === 'amoled' });
  },
}));
