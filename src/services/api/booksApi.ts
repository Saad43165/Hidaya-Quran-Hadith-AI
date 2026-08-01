import axios from 'axios';
import { Book } from '../../types/models';

const gutenbergClient = axios.create({
  baseURL: 'https://gutendex.com', // public Gutenberg mirror API, no key needed
  timeout: 10000,
});

const googleBooksClient = axios.create({
  baseURL: 'https://www.googleapis.com/books/v1',
  timeout: 10000,
});

/** Search free, public-domain Islamic/general texts on Project Gutenberg. */
export async function searchGutenberg(query: string): Promise<Book[]> {
  const { data } = await gutenbergClient.get('/books', { params: { search: query } });
  return data.results.map((r: any) => ({
    id: `gutenberg-${r.id}`,
    title: r.title,
    author: r.authors?.[0]?.name ?? 'Unknown',
    coverUrl: r.formats?.['image/jpeg'],
    source: 'gutenberg' as const,
    language: r.languages?.[0] ?? 'en',
    sourceUrl: `https://www.gutenberg.org/ebooks/${r.id}`,
  }));
}

/**
 * Search Google Books. Requires EXPO_PUBLIC_GOOGLE_BOOKS_API_KEY (Phase 3) —
 * works without a key too, but at a much lower rate limit.
 */
export async function searchGoogleBooks(query: string): Promise<Book[]> {
  const apiKey = process.env.EXPO_PUBLIC_GOOGLE_BOOKS_API_KEY;
  const { data } = await googleBooksClient.get('/volumes', {
    params: { q: query, ...(apiKey ? { key: apiKey } : {}) },
  });
  return (data.items ?? []).map((item: any) => ({
    id: `google-${item.id}`,
    title: item.volumeInfo?.title ?? 'Untitled',
    author: item.volumeInfo?.authors?.[0] ?? 'Unknown',
    coverUrl: item.volumeInfo?.imageLinks?.thumbnail,
    source: 'google_books' as const,
    language: item.volumeInfo?.language ?? 'en',
    description: item.volumeInfo?.description,
    sourceUrl: item.volumeInfo?.previewLink ?? item.volumeInfo?.infoLink,
  }));
}
