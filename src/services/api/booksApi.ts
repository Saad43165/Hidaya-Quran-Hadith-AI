import { Book } from '../../types/models';

/** Search free, public-domain Islamic/general texts on Project Gutenberg. */
export async function searchGutenberg(query: string): Promise<Book[]> {
  const url = `https://gutendex.com/books?search=${encodeURIComponent(query)}`;
  const response = await fetch(url);
  
  if (!response.ok) {
    throw new Error(`Gutenberg API failed: ${response.status}`);
  }
  
  const data = await response.json();
  return (data.results || []).map((r: any) => ({
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
  let url = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}`;
  if (apiKey) url += `&key=${apiKey}`;

  const response = await fetch(url);
  
  if (!response.ok) {
    throw new Error(`Google Books API failed: ${response.status}`);
  }

  const data = await response.json();
  return (data.items || []).map((item: any) => ({
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
