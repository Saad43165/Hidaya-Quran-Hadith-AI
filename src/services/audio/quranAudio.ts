import { createAudioPlayer, type AudioPlayer } from 'expo-audio';

let currentPlayer: AudioPlayer | null = null;

export async function playVerse(globalVerseNumber: number): Promise<void> {
  const url = `https://cdn.islamic.network/quran/audio/128/ar.alafasy/${globalVerseNumber}.mp3`;
  await stopCurrentAudio();
  
  currentPlayer = createAudioPlayer(url);
  currentPlayer.play();
}

export async function stopCurrentAudio(): Promise<void> {
  if (currentPlayer) {
    currentPlayer.pause();
    currentPlayer = null;
  }
}

export function isAudioPlaying(): boolean {
  return currentPlayer ? currentPlayer.playing : false;
}
