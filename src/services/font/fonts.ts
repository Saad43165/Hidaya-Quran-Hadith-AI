import { useFonts } from 'expo-font';

export const ARABIC_FONT_REGULAR = 'Amiri_400Regular';
export const ARABIC_FONT_BOLD = 'Amiri_700Bold';

export function useArabicFonts(): [boolean, Error | null] {
  try {
    const {
      Amiri_400Regular,
      Amiri_700Bold,
    } = require('@expo-google-fonts/amiri');
    return useFonts({
      [ARABIC_FONT_REGULAR]: Amiri_400Regular,
      [ARABIC_FONT_BOLD]: Amiri_700Bold,
    });
  } catch (e) {
    // Return [true, error] so app continues with system font
    return [true, e as Error];
  }
}
