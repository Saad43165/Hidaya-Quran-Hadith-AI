import { create } from 'zustand';
import type { User } from 'firebase/auth';
import { subscribeToAuthChanges, signOutUser } from '../services/firebase/auth';

interface AuthState {
  user: User | null;
  isGuest: boolean;
  isInitializing: boolean;
  initialize: () => () => void;
  continueAsGuest: () => void;
  signOut: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isGuest: false,
  isInitializing: true,

  initialize: () => {
    const unsubscribe = subscribeToAuthChanges((user) => {
      set({ user, isInitializing: false });
    });
    return unsubscribe;
  },

  continueAsGuest: () => set({ isGuest: true }),

  signOut: async () => {
    if (useAuthStore.getState().isGuest) {
      set({ isGuest: false });
      return;
    }
    await signOutUser();
    set({ user: null });
  },
}));
