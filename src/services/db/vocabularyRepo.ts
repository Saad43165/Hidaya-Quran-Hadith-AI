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

const SEED_WORDS: VocabularyWord[] = [
  { id: 'seed_allah',      arabic: 'الله',         transliteration: 'Allah',       meaning: 'God',                        root: '',       grammarRole: '', surahNumber: 1, ayahNumber: 1, timesInQuran: 2699, savedAt: 0 },
  { id: 'seed_rahmaan',    arabic: 'رَحْمَن',       transliteration: 'Rahmaan',     meaning: 'Most Gracious',              root: 'ر-ح-م', grammarRole: '', surahNumber: 1, ayahNumber: 1, timesInQuran: 57,   savedAt: 1 },
  { id: 'seed_raheem',     arabic: 'رَحِيم',        transliteration: 'Raheem',      meaning: 'Most Merciful',              root: 'ر-ح-م', grammarRole: '', surahNumber: 1, ayahNumber: 1, timesInQuran: 115,  savedAt: 2 },
  { id: 'seed_rabb',       arabic: 'رَبّ',          transliteration: 'Rabb',        meaning: 'Lord',                       root: '',       grammarRole: '', surahNumber: 1, ayahNumber: 2, timesInQuran: 975,  savedAt: 3 },
  { id: 'seed_aalameen',   arabic: 'عَالَمِين',     transliteration: "'Aalameen",   meaning: 'Worlds',                     root: 'ع-ل-م', grammarRole: '', surahNumber: 1, ayahNumber: 2, timesInQuran: 73,   savedAt: 4 },
  { id: 'seed_siraat',     arabic: 'الصِّرَاط',     transliteration: 'As-Siraat',   meaning: 'The Path',                   root: '',       grammarRole: '', surahNumber: 1, ayahNumber: 6, timesInQuran: 45,   savedAt: 5 },
  { id: 'seed_mustaqeem',  arabic: 'مُسْتَقِيم',    transliteration: 'Mustaqeem',   meaning: 'Straight',                   root: '',       grammarRole: '', surahNumber: 1, ayahNumber: 6, timesInQuran: 33,   savedAt: 6 },
  { id: 'seed_yawm',       arabic: 'يَوْم',         transliteration: 'Yawm',        meaning: 'Day',                        root: 'ي-و-م', grammarRole: '', surahNumber: 1, ayahNumber: 4, timesInQuran: 365,  savedAt: 7 },
  { id: 'seed_deen',       arabic: 'الدِّين',       transliteration: 'Ad-Deen',     meaning: 'The Judgment / The Religion', root: '',      grammarRole: '', surahNumber: 1, ayahNumber: 4, timesInQuran: 92,   savedAt: 8 },
  { id: 'seed_nabudu',     arabic: 'نَعْبُد',       transliteration: "Na'budu",     meaning: 'We worship',                 root: 'ع-ب-د', grammarRole: '', surahNumber: 1, ayahNumber: 5, timesInQuran: 0,    savedAt: 9 },
  { id: 'seed_nastaeen',   arabic: 'نَسْتَعِين',    transliteration: "Nasta'een",   meaning: 'We seek help',               root: 'ع-و-ن', grammarRole: '', surahNumber: 1, ayahNumber: 5, timesInQuran: 0,    savedAt: 10 },
  { id: 'seed_anamta',     arabic: 'اَنْعَمْت',     transliteration: "An'amta",     meaning: 'You bestowed',               root: 'ن-ع-م', grammarRole: '', surahNumber: 1, ayahNumber: 7, timesInQuran: 0,    savedAt: 11 },
  { id: 'seed_ghair',      arabic: 'غَيْر',         transliteration: 'Ghair',       meaning: 'Other than',                 root: '',       grammarRole: '', surahNumber: 1, ayahNumber: 7, timesInQuran: 86,   savedAt: 12 },
  { id: 'seed_maghdhoob',  arabic: 'المَغْضُوب',    transliteration: 'Al-Maghdhoob', meaning: 'Those who earned anger',    root: 'غ-ض-ب', grammarRole: '', surahNumber: 1, ayahNumber: 7, timesInQuran: 0,    savedAt: 13 },
  { id: 'seed_daalleen',   arabic: 'ضَآلِّين',      transliteration: 'Daalleen',    meaning: 'Those who are astray',       root: 'ض-ل-ل', grammarRole: '', surahNumber: 1, ayahNumber: 7, timesInQuran: 0,    savedAt: 14 },
  { id: 'seed_qul',        arabic: 'قُل',           transliteration: 'Qul',         meaning: 'Say',                        root: 'ق-و-ل', grammarRole: '', surahNumber: 112, ayahNumber: 1, timesInQuran: 332, savedAt: 15 },
  { id: 'seed_ahad',       arabic: 'أَحَد',         transliteration: 'Ahad',        meaning: 'One',                        root: '',       grammarRole: '', surahNumber: 112, ayahNumber: 1, timesInQuran: 82,  savedAt: 16 },
  { id: 'seed_kufuwan',    arabic: 'كُفُوًا',       transliteration: 'Kufuwan',     meaning: 'Equal',                      root: '',       grammarRole: '', surahNumber: 112, ayahNumber: 4, timesInQuran: 0,   savedAt: 17 },
  { id: 'seed_iqra',       arabic: 'اِقْرَأ',       transliteration: 'Iqra',        meaning: 'Read',                       root: 'ق-ر-أ', grammarRole: '', surahNumber: 96, ayahNumber: 1,  timesInQuran: 0,   savedAt: 18 },
  { id: 'seed_allama',     arabic: 'عَلَّم',        transliteration: "'Allama",     meaning: 'Taught',                     root: 'ع-ل-م', grammarRole: '', surahNumber: 96, ayahNumber: 4,  timesInQuran: 0,   savedAt: 19 },
];

export async function seedVocabularyIfEmpty(): Promise<void> {
  const count = await getWordCount();
  if (count > 0) return;
  for (const word of SEED_WORDS) {
    await saveWord(word);
  }
}
