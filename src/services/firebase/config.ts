import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { initializeAuth, getAuth, Auth } from 'firebase/auth';
// The `firebase` meta-package's `./auth` export map doesn't declare a
// `react-native` condition, but the underlying `@firebase/auth` package
// does — so this specific function is imported from there directly.
import { getReactNativePersistence } from '@firebase/auth';
import { createAsyncStorage } from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
};

export function isFirebaseConfigured(): boolean {
  return Boolean(firebaseConfig.apiKey && firebaseConfig.authDomain && firebaseConfig.projectId);
}

let app: FirebaseApp | null = null;
let auth: Auth | null = null;

/**
 * Lazily initializes Firebase. Returns null if config env vars aren't set
 * yet — callers must check isFirebaseConfigured() / handle null before
 * calling auth methods, rather than crashing on a missing key.
 */
export function getFirebaseAuth(): Auth | null {
  if (!isFirebaseConfigured()) return null;

  if (!app) {
    app = getApps().length ? getApp() : initializeApp(firebaseConfig);
  }

  if (!auth) {
    const appStorage = createAsyncStorage('kitaabai-auth');
    try {
      auth = initializeAuth(app, {
        persistence: getReactNativePersistence(appStorage),
      });
    } catch {
      // initializeAuth throws if called twice (e.g. after Fast Refresh) —
      // fall back to the already-initialized instance.
      auth = getAuth(app);
    }
  }

  return auth;
}
