# Hidaya (KitaabAI) - Your Comprehensive Islamic Companion

Hidaya (also known as KitaabAI) is a beautifully designed, feature-rich React Native application built with Expo. It serves as a modern digital library and Islamic companion, offering users a premium experience for reading the Quran, exploring Hadith collections, and engaging with an intelligent AI assistant.

## ✨ Features

- **📖 Interactive Quran Reader:** Read the Holy Quran in beautiful Arabic typography (Amiri font) with translations.
- **🎧 High-Quality Audio Recitations:** Integrated native audio playback (via `expo-audio`) for listening to Quranic verses.
- **🧭 Professional Qibla Compass:** A dynamic, absolute-north tracking compass with a precise Kaaba indicator.
- **🤖 AI Islamic Assistant:** Integrated with Groq for blazing-fast, intelligent, and context-aware responses with native Markdown rendering.
- **📚 Digital Library:** Search and discover free Islamic texts and public domain classics via Project Gutenberg and Google Books APIs.
- **🔐 Secure Authentication:** Seamless email/password login and "Continue as Guest" mode powered by Firebase Authentication.
- **🌙 Premium UI & Dark Mode:** A stunning, animated interface with glassmorphism, responsive navigation, and full Dark Mode support.
- **🌐 Localization & RTL Support:** Fully localized in English, Arabic, and Urdu, with smart Right-to-Left (RTL) layout switching.
- **💾 Offline Capabilities:** Robust SQLite caching and AsyncStorage for saving bookmarks, streaks, and downloaded content.

## 🛠 Tech Stack

- **Framework:** [React Native](https://reactnative.dev/) & [Expo](https://expo.dev/) (SDK 52+)
- **State Management:** Zustand
- **Navigation:** React Navigation (Native Stack & Bottom Tabs)
- **Database / Caching:** SQLite & AsyncStorage
- **Backend / Auth:** Firebase
- **AI Integration:** Groq API
- **Styling:** Custom Design System (Vanilla CSS patterns via StyleSheet)

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- Expo CLI
- Firebase Project configured
- Groq API Key

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Saad43165/Hidaya-Quran-Hadith-AI.git
   cd Hidaya-Quran-Hadith-AI
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   Create a `.env` file in the root directory and configure your API keys:
   ```env
   # Groq AI Assistant
   EXPO_PUBLIC_GROQ_API_KEY=your_groq_api_key_here

   # Firebase Configuration
   EXPO_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
   EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
   EXPO_PUBLIC_FIREBASE_PROJECT_ID=your_firebase_project_id
   ```

4. **Run the App**
   ```bash
   npx expo start
   ```
   *Press `a` to run on Android, `i` to run on iOS, or scan the QR code with the Expo Go app.*

## 📸 Screenshots
*(Coming soon)*

## 🤝 Contributing
Contributions, issues, and feature requests are welcome! Feel free to check the [issues page](https://github.com/Saad43165/Hidaya-Quran-Hadith-AI/issues).

## 📄 License
This project is for educational and open-source purposes.
