import { getDb, ensureDatabaseReady } from './database';
import { VocabularyWord } from '../../types/models';

interface VocabRow {
  id: string;
  arabic: string;
  transliteration: string | null;
  meaning: string | null;
  root: string | null;
  grammar_role: string | null;
  surah_number: number | null;
  ayah_number: number | null;
  times_in_quran: number | null;
  saved_at: number;
}

function rowToWord(row: VocabRow): VocabularyWord {
  return {
    id: row.id,
    arabic: row.arabic,
    transliteration: row.transliteration ?? '',
    meaning: row.meaning ?? '',
    root: row.root ?? '',
    grammarRole: row.grammar_role ?? '',
    surahNumber: row.surah_number ?? 0,
    ayahNumber: row.ayah_number ?? 0,
    timesInQuran: row.times_in_quran ?? 0,
    savedAt: row.saved_at,
  };
}

export async function saveWord(word: VocabularyWord): Promise<void> {
  await ensureDatabaseReady();
  await getDb().runAsync(
    `INSERT OR REPLACE INTO vocabulary
       (id, arabic, transliteration, meaning, root, grammar_role,
        surah_number, ayah_number, times_in_quran, saved_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      word.id, word.arabic, word.transliteration, word.meaning, word.root,
      word.grammarRole, word.surahNumber, word.ayahNumber, word.timesInQuran,
      word.savedAt,
    ],
  );
}

export async function removeWord(id: string): Promise<void> {
  await ensureDatabaseReady();
  await getDb().runAsync('DELETE FROM vocabulary WHERE id = ?', [id]);
}

export async function listWords(): Promise<VocabularyWord[]> {
  await ensureDatabaseReady();
  const rows = await getDb().getAllAsync<VocabRow>(
    'SELECT * FROM vocabulary ORDER BY saved_at DESC',
  );
  return rows.map(rowToWord);
}

export async function isWordSaved(id: string): Promise<boolean> {
  await ensureDatabaseReady();
  const row = await getDb().getFirstAsync<{ cnt: number }>(
    'SELECT COUNT(*) as cnt FROM vocabulary WHERE id = ?',
    [id],
  );
  return (row?.cnt ?? 0) > 0;
}

export async function getWordCount(): Promise<number> {
  await ensureDatabaseReady();
  const row = await getDb().getFirstAsync<{ cnt: number }>(
    'SELECT COUNT(*) as cnt FROM vocabulary',
  );
  return row?.cnt ?? 0;
}
