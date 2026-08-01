import axios from 'axios';

/**
 * Base client for the Quran/Hadith data provider.
 * alquran.cloud is free and requires no API key — good for Phase 1.
 */
export const quranClient = axios.create({
  baseURL: 'https://api.alquran.cloud/v1',
  timeout: 10000,
});

/**
 * Base client for our own FastAPI backend (Phase 3+: auth, AI assistant,
 * book library sync). Point this at your deployed backend URL.
 */
export const backendClient = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_BASE_URL ?? 'https://api.kitaabai.app',
  timeout: 15000,
});
