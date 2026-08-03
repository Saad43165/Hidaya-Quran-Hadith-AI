import { useAudioStore } from '../store/useAudioStore';

// Height the MiniPlayer occupies above the tab bar: bottom(80) + height(64) + gap(8)
export const MINI_PLAYER_CLEARANCE = 152;

export function useMiniPlayerPadding(): number {
  const active = useAudioStore(s => !!s.currentSurah && s.currentAyahIndex !== -1);
  return active ? MINI_PLAYER_CLEARANCE : 0;
}
