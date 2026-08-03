import { useThemeStore } from '../store/useThemeStore';
import { colors } from '../theme/colors';
import { darkColors } from '../theme/darkColors';

export function useThemeColors() {
  const isDark = useThemeStore(s => s.isDark);
  const isAmoled = useThemeStore(s => s.isAmoled);
  return {
    isDark,
    isAmoled,
    bg: isAmoled ? '#000000' : isDark ? darkColors.background : colors.parchment[50],
    surface: isAmoled ? '#0A0A0A' : isDark ? darkColors.surface : colors.white,
    surfaceElevated: isAmoled ? '#111111' : isDark ? darkColors.surfaceElevated : colors.parchment[100],
    border: isAmoled ? '#1A1A1A' : isDark ? darkColors.border : colors.parchment[200],
    textPrimary: isDark ? darkColors.text.primary : colors.parchment[950],
    textSecondary: isDark ? darkColors.text.secondary : colors.parchment[500],
    textMuted: isDark ? darkColors.text.muted : colors.parchment[400],
    colors,
    darkColors,
  };
}
