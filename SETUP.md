# KitaabAI — Setup Guide

## Run in 3 commands

```bash
npm install
cp .env.example .env     # fill in your Groq key
npx expo start --web     # preview in browser
```

**No backend server needed. No hosting costs.**

---

## Step 1 — Get your Groq API key (free, 2 minutes)

1. Go to [console.groq.com](https://console.groq.com)
2. Sign up (free, no credit card)
3. API Keys → Create new key → copy it
4. Paste into `.env`:
```env
EXPO_PUBLIC_GROQ_API_KEY=gsk_your_key_here
```

That's all the AI needs. Free tier: 14,400 requests/day.

---

## Step 2 — Firebase (optional, for user accounts)

Without Firebase the app runs in guest mode — everything works, users just can't create accounts.

To enable accounts:
1. [console.firebase.google.com](https://console.firebase.google.com) → Create project
2. Authentication → Sign-in method → Enable **Email/Password**
3. Project Settings → General → Your Apps → **Add Web App** → copy the config
4. Add to `.env`:
```env
EXPO_PUBLIC_FIREBASE_API_KEY=AIzaSy...
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
```

---

## Step 3 — Build for Android

```bash
npm install -g eas-cli
eas login
eas init    # one time — generates your project ID, paste into app.json

# Test APK
eas build --platform android --profile preview

# Store build
eas build --platform android --profile production
eas submit --platform android
```

---

## What works without any keys

| Feature | Needs |
|---|---|
| Quran + audio | Nothing |
| Hadith + chapters | Nothing |
| Prayer times + Qibla | Nothing |
| 99 Names, Duas, Tasbih | Nothing |
| Daily Ayah + Hadith | Nothing |
| Hijri calendar | Nothing |
| Offline + Bookmarks + Streaks | Nothing |
| Library | Nothing |
| Dark mode, EN/UR/AR | Nothing |
| **AI Assistant** | Groq key (free) |
| **User accounts** | Firebase (free tier) |

---

## That's it

No backend. No hosting. No monthly bills.
The app calls Groq directly. Firebase is serverless.
Total running cost at launch: **$0/month**.
