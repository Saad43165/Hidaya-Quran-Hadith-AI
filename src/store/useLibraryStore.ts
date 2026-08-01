import { create } from 'zustand';
import { Book } from '../types/models';

interface LibraryState {
  books: Book[];
  isLoading: boolean;
  error: string | null;
  setBooks: (books: Book[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  updateProgress: (bookId: string, progress: number) => void;
}

export const useLibraryStore = create<LibraryState>((set) => ({
  books: [],
  isLoading: false,
  error: null,
  setBooks: (books) => set({ books }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  updateProgress: (bookId, progress) =>
    set((state) => ({
      books: state.books.map((b) => (b.id === bookId ? { ...b, progress } : b)),
    })),
}));
