import { Platform } from 'react-native';

export const fontFamily = {
  base: Platform.select({ ios: 'System', android: 'sans-serif', default: 'System' }),
  arabic: 'Amiri_400Regular',
  arabicBold: 'Amiri_700Bold',
};

export const typography = {
  displayXl:  { fontSize: 36, lineHeight: 44, fontWeight: '800' as const, letterSpacing: -0.5 },
  displayLg:  { fontSize: 30, lineHeight: 38, fontWeight: '700' as const, letterSpacing: -0.3 },
  displayMd:  { fontSize: 24, lineHeight: 32, fontWeight: '700' as const, letterSpacing: -0.2 },
  heading:    { fontSize: 20, lineHeight: 28, fontWeight: '600' as const },
  subheading: { fontSize: 16, lineHeight: 24, fontWeight: '600' as const },
  body:       { fontSize: 15, lineHeight: 23, fontWeight: '400' as const },
  bodyMedium: { fontSize: 15, lineHeight: 23, fontWeight: '500' as const },
  bodySmall:  { fontSize: 13, lineHeight: 20, fontWeight: '400' as const },
  label:      { fontSize: 11, lineHeight: 16, fontWeight: '700' as const, letterSpacing: 0.8, textTransform: 'uppercase' as const },
  caption:    { fontSize: 12, lineHeight: 17, fontWeight: '500' as const },

  // Arabic typography using proper Amiri calligraphic font
  arabicAyah:    { fontFamily: 'Amiri_400Regular', fontSize: 28, lineHeight: 56 },
  arabicHadith:  { fontFamily: 'Amiri_400Regular', fontSize: 22, lineHeight: 46 },
  arabicSmall:   { fontFamily: 'Amiri_400Regular', fontSize: 18, lineHeight: 38 },
  arabicDisplay: { fontFamily: 'Amiri_700Bold',    fontSize: 36, lineHeight: 64 },
};
