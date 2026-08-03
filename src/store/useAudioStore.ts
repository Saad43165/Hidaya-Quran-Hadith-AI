import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from 'expo-audio';
import { Ayah, SurahDetail } from '../types/models';
import { RECITERS, DEFAULT_RECITER_ID, buildAyahUrl } from '../data/reciters';

const RECITER_KEY = 'kitaabai.audio.reciter';

export type RepeatMode = 'off' | 'verse' | 'surah';

interface AudioState {
  currentSurah: SurahDetail | null;
  currentAyahIndex: number;
  isPlaying: boolean;
  activePlayer: AudioPlayer | null;
  selectedReciterId: string;
  repeatMode: RepeatMode;
  autoPlay: boolean;
  sleepTimerMinutes: number | null;
  sleepTimerEndsAt: number | null;

  play: (surah: SurahDetail, index: number) => Promise<void>;
  pause: () => void;
  resume: () => void;
  playNext: () => Promise<void>;
  playPrev: () => Promise<void>;
  stop: () => void;
  setReciter: (id: string) => Promise<void>;
  setRepeatMode: (mode: RepeatMode) => void;
  cycleRepeatMode: () => void;
  setSleepTimer: (minutes: number | null) => void;
  clearSleepTimer: () => void;
  hydrate: () => Promise<void>;
}

let statusSubscription: { remove: () => void } | null = null;
let sleepTimerTimeoutId: ReturnType<typeof setTimeout> | null = null;

export const useAudioStore = create<AudioState>((set, get) => ({
  currentSurah: null,
  currentAyahIndex: -1,
  isPlaying: false,
  activePlayer: null,
  selectedReciterId: DEFAULT_RECITER_ID,
  repeatMode: 'off',
  autoPlay: true,
  sleepTimerMinutes: null,
  sleepTimerEndsAt: null,

  play: async (surah: SurahDetail, index: number) => {
    const { activePlayer, selectedReciterId } = get();

    // Stop and clean up any existing player
    if (activePlayer) {
      activePlayer.pause();
      try {
        activePlayer.remove();
      } catch (err) {
        console.warn('Error removing player:', err);
      }
      if (statusSubscription) {
        statusSubscription.remove();
        statusSubscription = null;
      }
    }

    const ayah = surah.ayahs[index];
    if (!ayah || !ayah.number) return;

    const reciter = RECITERS.find(r => r.id === selectedReciterId) ?? RECITERS[0];
    const url = buildAyahUrl(reciter, ayah.number);
    const player = createAudioPlayer(url);

    set({
      currentSurah: surah,
      currentAyahIndex: index,
      isPlaying: true,
      activePlayer: player,
    });

    statusSubscription = player.addListener('playbackStatusUpdate', (status: any) => {
      if (status.didJustFinish) {
        const { repeatMode, currentSurah: s, currentAyahIndex: i, play: playFn } = get();
        if (repeatMode === 'verse') {
          // Repeat the same ayah again
          if (s) playFn(s, i);
          return;
        }
        get().playNext();
      }
    });

    player.play();
  },

  pause: () => {
    const { activePlayer } = get();
    if (activePlayer) {
      activePlayer.pause();
      set({ isPlaying: false });
    }
  },

  resume: () => {
    const { activePlayer } = get();
    if (activePlayer) {
      activePlayer.play();
      set({ isPlaying: true });
    }
  },

  playNext: async () => {
    const { currentSurah, currentAyahIndex, play, stop, repeatMode } = get();
    if (!currentSurah) return;

    const nextIndex = currentAyahIndex + 1;
    if (nextIndex < currentSurah.ayahs.length) {
      await play(currentSurah, nextIndex);
    } else if (repeatMode === 'surah') {
      // Loop back to the start of the surah
      await play(currentSurah, 0);
    } else {
      stop();
    }
  },

  playPrev: async () => {
    const { currentSurah, currentAyahIndex, play } = get();
    if (!currentSurah) return;

    const prevIndex = currentAyahIndex - 1;
    if (prevIndex >= 0) {
      await play(currentSurah, prevIndex);
    }
  },

  stop: () => {
    const { activePlayer } = get();
    if (activePlayer) {
      activePlayer.pause();
      try {
        activePlayer.remove();
      } catch (err) {
        console.warn('Error removing player:', err);
      }
      if (statusSubscription) {
        statusSubscription.remove();
        statusSubscription = null;
      }
    }
    set({
      currentSurah: null,
      currentAyahIndex: -1,
      isPlaying: false,
      activePlayer: null,
    });
  },

  setReciter: async (id: string) => {
    const valid = RECITERS.find(r => r.id === id);
    if (!valid) return;
    set({ selectedReciterId: id });
    await AsyncStorage.setItem(RECITER_KEY, id);
  },

  setRepeatMode: (mode: RepeatMode) => set({ repeatMode: mode }),

  cycleRepeatMode: () => {
    const order: RepeatMode[] = ['off', 'verse', 'surah'];
    const current = get().repeatMode;
    const next = order[(order.indexOf(current) + 1) % order.length];
    set({ repeatMode: next });
  },

  setSleepTimer: (minutes: number | null) => {
    if (sleepTimerTimeoutId) {
      clearTimeout(sleepTimerTimeoutId);
      sleepTimerTimeoutId = null;
    }

    if (minutes === null) {
      set({ sleepTimerMinutes: null, sleepTimerEndsAt: null });
      return;
    }

    const endsAt = Date.now() + minutes * 60000;
    sleepTimerTimeoutId = setTimeout(() => {
      sleepTimerTimeoutId = null;
      get().pause();
      set({ sleepTimerMinutes: null, sleepTimerEndsAt: null });
    }, minutes * 60000);

    set({ sleepTimerMinutes: minutes, sleepTimerEndsAt: endsAt });
  },

  clearSleepTimer: () => {
    if (sleepTimerTimeoutId) {
      clearTimeout(sleepTimerTimeoutId);
      sleepTimerTimeoutId = null;
    }
    set({ sleepTimerMinutes: null, sleepTimerEndsAt: null });
  },

  hydrate: async () => {
    try {
      await setAudioModeAsync({ playsInSilentMode: true });
    } catch (e) {
      console.warn('Failed to set audio mode:', e);
    }
    const stored = await AsyncStorage.getItem(RECITER_KEY);
    if (stored && RECITERS.find(r => r.id === stored)) {
      set({ selectedReciterId: stored });
    }
  },
}));
