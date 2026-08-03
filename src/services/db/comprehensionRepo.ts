import { ensureDatabaseReady, getDb } from './database';
import { ComprehensionEntry, ComprehensionLevel } from '../../types/models';

interface CompRow {
  id: string;
  surah_number: number;
  surah_name: string;
  ayah_number: number;
  arabic_text: string;
  translation: string;
  level: string;
  saved_at: number;
}

function rowToEntry(row: CompRow): ComprehensionEntry {
  return {
    id: row.id,
    surahNumber: row.surah_number,
    surahName: row.surah_name,
    ayahNumber: row.ayah_number,
    arabicText: row.arabic_text,
    translation: row.translation,
    level: row.level as ComprehensionLevel,
    savedAt: row.saved_at,
  };
}

export async function saveComprehension(entry: ComprehensionEntry): Promise<void> {
  await ensureDatabaseReady();
  await getDb().runAsync(
    `INSERT OR REPLACE INTO comprehension
       (id, surah_number, surah_name, ayah_number, arabic_text, translation, level, saved_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [entry.id, entry.surahNumber, entry.surahName, entry.ayahNumber,
     entry.arabicText, entry.translation, entry.level, entry.savedAt],
  );
}

export async function listComprehension(level?: ComprehensionLevel): Promise<ComprehensionEntry[]> {
  await ensureDatabaseReady();
  const rows = level
    ? await getDb().getAllAsync<CompRow>('SELECT * FROM comprehension WHERE level = ? ORDER BY saved_at DESC', [level])
    : await getDb().getAllAsync<CompRow>('SELECT * FROM comprehension ORDER BY saved_at DESC');
  return rows.map(rowToEntry);
}

export async function listGaps(): Promise<ComprehensionEntry[]> {
  await ensureDatabaseReady();
  const rows = await getDb().getAllAsync<CompRow>(
    `SELECT * FROM comprehension WHERE level IN ('no','partially') ORDER BY saved_at DESC`,
  );
  return rows.map(rowToEntry);
}

export async function getComprehensionForAyah(surahNumber: number, ayahNumber: number): Promise<ComprehensionLevel | null> {
  await ensureDatabaseReady();
  const row = await getDb().getFirstAsync<{ level: string }>(
    'SELECT level FROM comprehension WHERE surah_number = ? AND ayah_number = ?',
    [surahNumber, ayahNumber],
  );
  return row ? (row.level as ComprehensionLevel) : null;
}

export async function getGapCount(): Promise<number> {
  await ensureDatabaseReady();
  const row = await getDb().getFirstAsync<{ count: number }>(
    `SELECT COUNT(*) as count FROM comprehension WHERE level IN ('no','partially')`,
  );
  return row?.count ?? 0;
}

export async function updateComprehensionLevel(id: string, level: ComprehensionLevel): Promise<void> {
  await ensureDatabaseReady();
  await getDb().runAsync('UPDATE comprehension SET level = ? WHERE id = ?', [level, id]);
}

export async function removeComprehension(id: string): Promise<void> {
  await ensureDatabaseReady();
  await getDb().runAsync('DELETE FROM comprehension WHERE id = ?', [id]);
}
