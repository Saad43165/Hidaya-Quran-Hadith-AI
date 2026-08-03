import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
  onAuthStateChanged,
  updateProfile,
  User,
  GoogleAuthProvider,
  signInWithCredential,
} from 'firebase/auth';
import { getFirebaseAuth } from './config';

export class AuthNotConfiguredError extends Error {
  constructor() {
    super('Firebase is not configured yet — add EXPO_PUBLIC_FIREBASE_* keys to your .env file.');
    this.name = 'AuthNotConfiguredError';
  }
}

function requireAuth() {
  const auth = getFirebaseAuth();
  if (!auth) throw new AuthNotConfiguredError();
  return auth;
}

export async function registerWithEmail(name: string, email: string, password: string): Promise<User> {
  const auth = requireAuth();
  const credential = await createUserWithEmailAndPassword(auth, email, password);
  if (name.trim()) {
    await updateProfile(credential.user, { displayName: name.trim() });
  }
  return credential.user;
}

export async function signInWithEmail(email: string, password: string): Promise<User> {
  const auth = requireAuth();
  const credential = await signInWithEmailAndPassword(auth, email, password);
  return credential.user;
}

export async function signOutUser(): Promise<void> {
  const auth = requireAuth();
  await firebaseSignOut(auth);
}

export async function resetPassword(email: string): Promise<void> {
  const auth = requireAuth();
  await sendPasswordResetEmail(auth, email);
}

export async function signInWithGoogleAccessToken(accessToken: string): Promise<User> {
  const auth = requireAuth();
  const credential = GoogleAuthProvider.credential(null, accessToken);
  const userCredential = await signInWithCredential(auth, credential);
  return userCredential.user;
}


export function subscribeToAuthChanges(callback: (user: User | null) => void): () => void {
  const auth = getFirebaseAuth();
  if (!auth) {
    callback(null);
    return () => {};
  }
  return onAuthStateChanged(auth, callback);
}
