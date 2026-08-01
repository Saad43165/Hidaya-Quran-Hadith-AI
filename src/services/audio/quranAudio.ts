/**
 * Quran audio — lazy loads expo-av so the app never crashes
 * if the native module is unavailable or audio fails to load.
 */
let currentSound: any = null;

export async function playVerse(globalVerseNumber: number): Promise<void> {
  try {
    await stopCurrentAudio();
    const { Audio } = await import('expo-av');
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      playsInSilentModeIOS: true,
      staysActiveInBackground: false,
    });
    const url = `https://cdn.islamic.network/quran/audio/128/ar.alafasy/${globalVerseNumber}.mp3`;
    const { sound } = await Audio.Sound.createAsync({ uri: url }, { shouldPlay: true });
    currentSound = sound;
    sound.setOnPlaybackStatusUpdate((status: any) => {
      if (status.isLoaded && status.didJustFinish) {
        sound.unloadAsync().catch(() => {});
        currentSound = null;
      }
    });
  } catch (e) {
    console.warn('[KitaabAI] Audio play failed:', e);
    currentSound = null;
  }
}

export async function stopCurrentAudio(): Promise<void> {
  if (!currentSound) return;
  try {
    await currentSound.stopAsync();
    await currentSound.unloadAsync();
  } catch {}
  currentSound = null;
}

export function isAudioPlaying(): boolean {
  return currentSound !== null;
}
