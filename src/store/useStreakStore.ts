import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface StreakState {
  currentStreak: number;
  longestStreak: number;
  totalDaysRead: number;
  lastReadDate: string | null;
  readDays: Set<string>;
  recordToday: () => Promise<void>;
  hydrate: () => Promise<void>;
}

const KEYS = {
  streak: 'kitaabai.streak.current',
  longest: 'kitaabai.streak.longest',
  total: 'kitaabai.streak.total',
  lastDate: 'kitaabai.streak.lastDate',
  days: 'kitaabai.streak.days',
};

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function daysBetween(a: string, b: string) {
  // Compare calendar dates (strip time component) to avoid timezone-sensitive rounding
  const dateA = new Date(a + 'T00:00:00');
  const dateB = new Date(b + 'T00:00:00');
  return Math.round((dateB.getTime() - dateA.getTime()) / 86400000);
}

export const useStreakStore = create<StreakState>((set, get) => ({
  currentStreak: 0,
  longestStreak: 0,
  totalDaysRead: 0,
  lastReadDate: null,
  readDays: new Set<string>(),

  recordToday: async () => {
    const today = todayStr();
    const { lastReadDate, currentStreak, longestStreak, totalDaysRead, readDays } = get();
    if (lastReadDate === today) return; // already recorded today

    const diff = lastReadDate ? daysBetween(lastReadDate, today) : 1;
    const newStreak = diff === 1 ? currentStreak + 1 : 1;
    const newLongest = Math.max(longestStreak, newStreak);
    const newTotal = totalDaysRead + 1;

    const newReadDays = new Set(readDays);
    newReadDays.add(today);

    await Promise.all([
      AsyncStorage.setItem(KEYS.streak, String(newStreak)),
      AsyncStorage.setItem(KEYS.longest, String(newLongest)),
      AsyncStorage.setItem(KEYS.total, String(newTotal)),
      AsyncStorage.setItem(KEYS.lastDate, today),
      AsyncStorage.setItem(KEYS.days, JSON.stringify(Array.from(newReadDays))),
    ]);

    set({
      currentStreak: newStreak,
      longestStreak: newLongest,
      totalDaysRead: newTotal,
      lastReadDate: today,
      readDays: newReadDays,
    });
  },

  hydrate: async () => {
    const [streak, longest, total, lastDate, daysJson] = await Promise.all([
      AsyncStorage.getItem(KEYS.streak),
      AsyncStorage.getItem(KEYS.longest),
      AsyncStorage.getItem(KEYS.total),
      AsyncStorage.getItem(KEYS.lastDate),
      AsyncStorage.getItem(KEYS.days),
    ]);

    // If last read was > 1 day ago, reset streak
    const today = todayStr();
    const diff = lastDate ? daysBetween(lastDate, today) : 999;
    const currentStreak = diff <= 1 ? parseInt(streak ?? '0', 10) : 0;

    let readDays = new Set<string>();
    if (daysJson) {
      try {
        const arr: unknown = JSON.parse(daysJson);
        if (Array.isArray(arr)) {
          readDays = new Set(arr.filter((d): d is string => typeof d === 'string'));
        }
      } catch { /* ignore parse errors */ }
    }

    set({
      currentStreak,
      longestStreak: parseInt(longest ?? '0', 10),
      totalDaysRead: parseInt(total ?? '0', 10),
      lastReadDate: lastDate,
      readDays,
    });
  },
}));
