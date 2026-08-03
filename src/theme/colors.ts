/**
 * KitaabAI Design System — Color Tokens
 *
 * Identity: illuminated manuscript meets modern Islamic geometry.
 * Deep lapis navy as the ground, warm 22k-gold accents, warm parchment
 * backgrounds — no cold grays, no generic blue-grays anywhere.
 */
export const colors = {
  // Core brand — lapis lazuli depths
  navy: {
    950: '#060C1F',
    900: '#0B1330',
    800: '#0F1C42',
    700: '#162354',
    600: '#1E2F6B',
    500: '#2A3F88',
  },
  // Warm gold — illuminated manuscript ink
  gold: {
    900: '#6B4E0E',
    700: '#9A6F14',
    600: '#B8881C',
    500: '#D4A93E',
    400: '#E2C05A',
    300: '#EDD080',
    200: '#F4E4B4',
    100: '#FBF4DF',
    50:  '#FEFAF0',
  },
  // Warm parchment neutrals — no cold grays
  parchment: {
    950: '#1A1714',
    900: '#2C2820',
    800: '#3D372C',
    700: '#5A5248',
    600: '#7A7168',
    500: '#9B9188',
    400: '#BDB5AC',
    300: '#D4CEC7',
    200: '#E8E4DE',
    100: '#F4F1EC',
    50:  '#FAF8F4',
  },
  // Semantic
  semantic: {
    success: '#1E6B4A',
    successLight: '#E8F5EF',
    error: '#9B2B1A',
    errorLight: '#FAECEA',
    warning: '#8A6010',
    warningLight: '#FDF3DF',
  },
  // Red colors for heart/warnings
  red: {
    500: '#EF4444',
  },
  // Indigo colors for Prophet's names/secondary accent
  indigo: {
    50: '#EEF2FF',
    200: '#C7D2FE',
    500: '#6366F1',
    600: '#4F46E5',
    900: '#312E81',
  },
  // Pure
  white: '#FFFFFF',
  black: '#000000',
} as const;

export const gradients = {
  // Hero gradient — deep navy with slight blue lift
  heroNavy: ['#0B1330', '#162354'] as const,
  // Gold shimmer for accent elements
  goldShimmer: ['#9A6F14', '#E2C05A'] as const,
  // Warm card gradient for Featured tiles
  warmCard: ['#0F1C42', '#1E2F6B'] as const,
  // Parchment — light screens
  parchment: ['#FAF8F4', '#F4F1EC'] as const,
} as const;
