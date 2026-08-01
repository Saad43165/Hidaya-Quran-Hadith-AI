import { ensureDatabaseReady, getDb } from './database';
import { ReadingProgress } from '../../types/models';

interface ProgressRow {
  key: string;
  surah_number: number | null;
  surah_name: string | null;
  ayah_number: number | null;
  collection_id: string | null;
  collection_name: string | null;
  updated_at: number;
}

function rowToProgress(row: ProgressRow): ReadingProgress {
  return {
    key: row.key as ReadingProgress['key'],
    surahNumber: row.surah_number ?? undefined,
    surahName: row.surah_name ?? undefined,
    ayahNumber: row.ayah_number ?? undefined,
    collectionId: row.collection_id ?? undefined,
    collectionName: row.collection_name ?? undefined,
    updatedAt: row.updated_at,
  };
}

export async function getAllProgress(): Promise<ReadingProgress[]> {
  await ensureDatabaseReady();
  const rows = await getDb().getAllAsync<ProgressRow>('SELECT * FROM reading_progress');
  return rows.map(rowToProgress);
}

export async function setQuranProgress(surahNumber: number, surahName: string, ayahNumber?: number): Promise<void> {
  await ensureDatabaseReady();
  await getDb().runAsync(
    `INSERT OR REPLACE INTO reading_progress (key, surah_number, surah_name, ayah_number, updated_at)
     VALUES ('quran', ?, ?, ?, ?)`,
    [surahNumber, surahName, ayahNumber ?? null, Date.now()]
  );
}

export async function setHadithProgress(collectionId: string, collectionName: string): Promise<void> {
  await ensureDatabaseReady();
  await getDb().runAsync(
    `INSERT OR REPLACE INTO reading_progress (key, collection_id, collection_name, updated_at)
     VALUES ('hadith', ?, ?, ?)`,
    [collectionId, collectionName, Date.now()]
  );
}
