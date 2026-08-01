import * as SQLite from 'expo-sqlite';

let db: SQLite.SQLiteDatabase | null = null;
let isReady: Promise<void> | null = null;

function getDb(): SQLite.SQLiteDatabase {
  if (!db) db = SQLite.openDatabaseSync('kitaabai.db');
  return db;
}

export function ensureDatabaseReady(): Promise<void> {
  if (!isReady) {
    isReady = getDb().execAsync(`
      PRAGMA journal_mode = WAL;
      CREATE TABLE IF NOT EXISTS bookmarks (
        id TEXT PRIMARY KEY NOT NULL, type TEXT NOT NULL,
        surah_number INTEGER, surah_name TEXT, ayah_number INTEGER,
        collection_id TEXT, collection_name TEXT, hadith_number INTEGER,
        snippet TEXT NOT NULL, created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL
      );
      CREATE TABLE IF NOT EXISTS reading_progress (
        key TEXT PRIMARY KEY NOT NULL, surah_number INTEGER, surah_name TEXT,
        ayah_number INTEGER, collection_id TEXT, collection_name TEXT, updated_at INTEGER NOT NULL
      );
      CREATE TABLE IF NOT EXISTS content_cache (
        cache_key TEXT PRIMARY KEY NOT NULL, json_blob TEXT NOT NULL, cached_at INTEGER NOT NULL
      );
    `).catch(e => {
      console.warn('[KitaabAI] DB setup error:', e);
      // Reset so next call retries
      isReady = null;
    });
  }
  return isReady!;
}

export { getDb };
