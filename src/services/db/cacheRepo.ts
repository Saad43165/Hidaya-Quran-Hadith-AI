import { ensureDatabaseReady, getDb } from './database';

/** Read a cached JSON blob by key. Returns null if not cached. */
export async function getCached<T>(cacheKey: string): Promise<T | null> {
  await ensureDatabaseReady();
  const row = await getDb().getFirstAsync<{ json_blob: string }>(
    'SELECT json_blob FROM content_cache WHERE cache_key = ?',
    [cacheKey]
  );
  if (!row) return null;
  try {
    return JSON.parse(row.json_blob) as T;
  } catch {
    return null;
  }
}

/** Store a JSON-serializable value under a cache key, overwriting any previous entry. */
export async function setCached(cacheKey: string, value: unknown): Promise<void> {
  await ensureDatabaseReady();
  await getDb().runAsync(
    'INSERT OR REPLACE INTO content_cache (cache_key, json_blob, cached_at) VALUES (?, ?, ?)',
    [cacheKey, JSON.stringify(value), Date.now()]
  );
}

/**
 * Fetch-with-cache wrapper: tries the network first (so content stays
 * fresh when online), falls back to the cache on any network failure,
 * and always refreshes the cache on a successful network fetch.
 */
export async function fetchWithCache<T>(cacheKey: string, fetcher: () => Promise<T>): Promise<T> {
  try {
    const fresh = await fetcher();
    setCached(cacheKey, fresh).catch(() => {
      // Caching failures shouldn't break the read path.
    });
    return fresh;
  } catch (networkError) {
    const cached = await getCached<T>(cacheKey);
    if (cached) return cached;
    throw networkError;
  }
}
