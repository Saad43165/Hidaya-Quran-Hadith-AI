import { create } from 'zustand';
import { createAudioPlayer, type AudioPlayer } from 'expo-audio';
import { Ayah, SurahDetail } from '../types/models';

interface AudioState {
  currentSurah: SurahDetail | null;
  currentAyahIndex: number;
  isPlaying: boolean;
  activePlayer: AudioPlayer | null;
  
  play: (surah: SurahDetail, index: number) => Promise<void>;
  pause: () => void;
  resume: () => void;
  playNext: () => Promise<void>;
  playPrev: () => Promise<void>;
  stop: () => void;
}

let statusSubscription: { remove: () => void } | null = null;

export const useAudioStore = create<AudioState>((set, get) => ({
  currentSurah: null,
  currentAyahIndex: -1,
  isPlaying: false,
  activePlayer: null,

  play: async (surah: SurahDetail, index: number) => {
    const { activePlayer } = get();
    
    // Stop and clean up any existing player
    if (activePlayer) {
      activePlayer.pause();
      if (statusSubscription) {
        statusSubscription.remove();
        statusSubscription = null;
      }
    }

    const ayah = surah.ayahs[index];
    if (!ayah || !ayah.number) return;

    const url = `https://cdn.islamic.network/quran/audio/128/ar.alafasy/${ayah.number}.mp3`;
    const player = createAudioPlayer(url);

    set({
      currentSurah: surah,
      currentAyahIndex: index,
      isPlaying: true,
      activePlayer: player,
    });

    statusSubscription = player.addListener('playbackStatusUpdate', (status: any) => {
      if (status.didJustFinish) {
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
    const { currentSurah, currentAyahIndex, play, stop } = get();
    if (!currentSurah) return;
    
    const nextIndex = currentAyahIndex + 1;
    if (nextIndex < currentSurah.ayahs.length) {
      await play(currentSurah, nextIndex);
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
}));
