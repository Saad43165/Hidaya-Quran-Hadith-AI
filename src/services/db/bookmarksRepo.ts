import { ensureDatabaseReady, getDb } from './database';
import { Bookmark } from '../../types/models';

interface BookmarkRow {
  id: string;
  type: string;
  surah_number: number | null;
  surah_name: string | null;
  ayah_number: number | null;
  collection_id: string | null;
  collection_name: string | null;
  hadith_number: number | null;
  snippet: string;
  created_at: number;
  updated_at: number;
}

function rowToBookmark(row: BookmarkRow): Bookmark {
  return {
    id: row.id,
    type: row.type as Bookmark['type'],
    surahNumber: row.surah_number ?? undefined,
    surahName: row.surah_name ?? undefined,
    ayahNumber: row.ayah_number ?? undefined,
    collectionId: row.collection_id ?? undefined,
    collectionName: row.collection_name ?? undefined,
    hadithNumber: row.hadith_number ?? undefined,
    snippet: row.snippet,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function listBookmarks(): Promise<Bookmark[]> {
  await ensureDatabaseReady();
  const rows = await getDb().getAllAsync<BookmarkRow>('SELECT * FROM bookmarks ORDER BY created_at DESC');
  return rows.map(rowToBookmark);
}

export async function isBookmarked(id: string): Promise<boolean> {
  await ensureDatabaseReady();
  const row = await getDb().getFirstAsync('SELECT id FROM bookmarks WHERE id = ?', [id]);
  return Boolean(row);
}

export async function addBookmark(bookmark: Omit<Bookmark, 'createdAt' | 'updatedAt'>): Promise<Bookmark> {
  await ensureDatabaseReady();
  const now = Date.now();
  await getDb().runAsync(
    `INSERT OR REPLACE INTO bookmarks
      (id, type, surah_number, surah_name, ayah_number, collection_id, collection_name, hadith_number, snippet, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      bookmark.id,
      bookmark.type,
      bookmark.surahNumber ?? null,
      bookmark.surahName ?? null,
      bookmark.ayahNumber ?? null,
      bookmark.collectionId ?? null,
      bookmark.collectionName ?? null,
      bookmark.hadithNumber ?? null,
      bookmark.snippet,
      now,
      now,
    ]
  );
  return { ...bookmark, createdAt: now, updatedAt: now };
}

export async function removeBookmark(id: string): Promise<void> {
  await ensureDatabaseReady();
  await getDb().runAsync('DELETE FROM bookmarks WHERE id = ?', [id]);
}
