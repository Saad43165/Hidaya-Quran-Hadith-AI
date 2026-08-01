<div align="center">

# 📖 KitaabAI

### The Islamic reading companion that understands what you're reading

*Quran · Hadith · Prayer · AI Assistant · 99 Names · Duas · Tasbih*

[![React Native](https://img.shields.io/badge/React_Native-0.86-61DAFB?style=flat-square&logo=react)](https://reactnative.dev)
[![Expo SDK](https://img.shields.io/badge/Expo-57-000020?style=flat-square&logo=expo)](https://expo.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-Strict-3178C6?style=flat-square&logo=typescript)](https://typescriptlang.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688?style=flat-square&logo=fastapi)](https://fastapi.tiangolo.com)

</div>

---

## What makes KitaabAI different

Every other Islamic app shows you the Quran and Hadith as static text. KitaabAI's AI assistant **knows what you're reading** — open Surah Al-Baqarah and it proactively shows an insight. Ask a question and it answers in the context of the specific ayah or hadith chapter you're on. No other Islamic app does this.

---

## Features

### Quran
- 114 surahs with proper Amiri calligraphic Arabic font
- English (Sahih International) and Urdu (Ahmed Ali) translations
- Adjustable Arabic font size (18–32px)
- Audio recitation — Mishary Alafasy, per-ayah play/pause
- Juz / Para navigation (all 30, with names in Arabic and English)
- Bismillah displayed correctly (not on Al-Fatiha or At-Tawbah)
- Bookmarks per ayah

### Hadith
- 10 major collections: Bukhari, Muslim, Abu Dawud, Tirmidhi, Nasai, Ibn Majah, Malik, Nawawi's 40, Qudsi, Dehlawi
- **Chapter-first navigation** — browse by topic (Wuzu, Ghusl, Salah, Fasting, Zakat...)
- Authenticity grade badges (Sahih / Hasan / Da'if) per hadith
- Scholar notes per chapter (Hanbali, Shafi'i, Maliki, with disclaimer)
- Arabic + English text, bookmarks per hadith

### AI Reading Assistant
- **Contextual AI** — knows which Surah or Hadith chapter you're reading
- Proactive insights when you open a new page
- Quick-reply suggestions ("Tell me more", "Historical context")
- Answers grounded in what you're actually looking at
- Won't fabricate citations or issue personal fatwas
- Powered by Groq (ultra-fast inference)

### Prayer & Qibla
- GPS-based prayer times (Aladhan API, no key needed)
- Real-time countdown to next prayer
- Per-prayer notification toggles with daily scheduling
- Live Qibla compass using device magnetometer — animated needle
- Falls back gracefully when magnetometer unavailable

### Islamic Content
- **99 Names of Allah** — Arabic, transliteration, meaning, explanation (searchable)
- **Duas** — 28 duas across 10 categories with Arabic, transliteration, translation, source
- **Tasbih Counter** — 7 zikrs, animated, haptic feedback, ripple effect
- **Daily Ayah** — rotates through short surahs daily
- **Daily Hadith** — 14 classic hadiths, always available offline

### Home & Discovery
- **Hijri calendar** — calculated on-device, highlights Islamic special days
- **Reading streak** — daily streak tracking with longest streak
- Quick access to all features
- Continue Reading cards (Quran + Hadith)
- Library — Project Gutenberg + Google Books

### App-wide
- English, Urdu, Arabic — full RTL support
- Dark mode — navy/gold, persisted
- Offline caching with SQLite — previously-read content works without internet
- Bookmarks synced across Quran and Hadith
- Firebase Auth (email/password + guest mode)
- No ads. No data selling. No account required to use core features.

---

## Tech Stack

**App:** React Native 0.86 · Expo SDK 57 · TypeScript (strict) · React Navigation 7 · Zustand 5 · i18next · expo-sqlite · expo-sensors · expo-av · expo-notifications · expo-location · Firebase JS SDK · Amiri Arabic font

**AI:** Groq API (direct, no backend) · llama-3.1-8b-instant · 14,400 free requests/day

**Free APIs (no keys):** AlQuran Cloud · fawazahmed0/hadith-api · Aladhan · Gutendex · Islamic Network CDN (audio)

---

## Quick Start

```bash
git clone https://github.com/yourusername/kitaabai
cd kitaabai
npm install
npx expo start --web    # browser preview
```

See **SETUP.md** for full device build, Firebase setup, and App Store submission.

---

## Project Structure

```
src/
├── theme/          colors · typography · spacing · shadows
├── navigation/     stack + tabs + auth navigator
├── screens/        home · quran · hadith · prayer · dua · names
│                   tasbih · library · assistant · search · bookmarks
│                   settings · auth · onboarding
├── components/     quran · hadith · prayer · assistant · home
│                   bookmarks · auth · common
├── services/
│   ├── api/        quranApi · hadithApi · prayerTimesApi · searchApi
│   │               aiAssistantApi · booksApi · dailyContentApi
│   ├── db/         database · cacheRepo · bookmarksRepo · progressRepo
│   ├── audio/      quranAudio
│   ├── firebase/   config · auth · authErrors
│   ├── font/       fonts (Amiri)
│   ├── hijri/      hijriCalendar
│   └── notifications/ prayerNotifications
├── store/          useAppStore · useAuthStore · useQuranStore
│                   useLibraryStore · useStreakStore · useThemeStore
├── data/           juzData · hadithChapters · hadithGrades · duas · namesOfAllah
├── i18n/           en.json · ur.json · ar.json
└── types/          models.ts

backend/
├── app/
│   ├── core/       config · auth (dev-mode bypass)
│   └── routers/    health · profile · assistant (contextual + context-prompt)
└── requirements.txt
```

---

## License

MIT © 2026 Saad Ikram
