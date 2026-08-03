import { ensureDatabaseReady, getDb } from './database';

const PRAYERS = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'] as const;
export type PrayerName = (typeof PRAYERS)[number];

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function makeId(date: string, prayer: string): string {
  return `${date}_${prayer}`;
}

/** Returns {Fajr: true/false, ...} for today */
export async function getTodaySalah(): Promise<Record<string, boolean>> {
  await ensureDatabaseReady();
  const date = today();
  const rows = await getDb().getAllAsync<{ prayer: string; completed: number }>(
    `SELECT prayer, completed FROM salah_log WHERE date = ?`,
    [date],
  );
  const result: Record<string, boolean> = {};
  for (const p of PRAYERS) result[p] = false;
  for (const row of rows) result[row.prayer] = row.completed === 1;
  return result;
}

/** Toggle a prayer for today */
export async function toggleSalah(prayer: string, completed: boolean): Promise<void> {
  await ensureDatabaseReady();
  const date = today();
  const id = makeId(date, prayer);
  const completedAt = completed ? Date.now() : null;
  await getDb().runAsync(
    `INSERT INTO salah_log (id, date, prayer, completed, completed_at)
     VALUES (?, ?, ?, ?, ?)
     ON CONFLICT(date, prayer) DO UPDATE SET completed = excluded.completed, completed_at = excluded.completed_at`,
    [id, date, prayer, completed ? 1 : 0, completedAt],
  );
}

/** Last 7 days including today, newest first */
export async function getWeeklySalah(): Promise<
  Array<{ date: string; prayers: Record<string, boolean> }>
> {
  await ensureDatabaseReady();
  const dates: string[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    dates.push(d.toISOString().slice(0, 10));
  }

  const placeholders = dates.map(() => '?').join(', ');
  const rows = await getDb().getAllAsync<{ date: string; prayer: string; completed: number }>(
    `SELECT date, prayer, completed FROM salah_log WHERE date IN (${placeholders})`,
    dates,
  );

  return dates.map(date => {
    const prayers: Record<string, boolean> = {};
    for (const p of PRAYERS) prayers[p] = false;
    for (const row of rows) {
      if (row.date === date) prayers[row.prayer] = row.completed === 1;
    }
    return { date, prayers };
  });
}

/** Lifetime total completed prayers */
export async function getTotalCompleted(): Promise<number> {
  await ensureDatabaseReady();
  const row = await getDb().getFirstAsync<{ total: number }>(
    `SELECT COUNT(*) as total FROM salah_log WHERE completed = 1`,
  );
  return row?.total ?? 0;
}

/** Longest all-5 streak ever */
export async function getLongestStreak(): Promise<number> {
  await ensureDatabaseReady();
  // Pull all dates with exactly 5 prayers completed, sorted ascending
  const rows = await getDb().getAllAsync<{ date: string }>(
    `SELECT date FROM salah_log WHERE completed = 1
     GROUP BY date HAVING COUNT(*) >= 5
     ORDER BY date ASC`,
  );
  if (rows.length === 0) return 0;
  let longest = 1;
  let current = 1;
  for (let i = 1; i < rows.length; i++) {
    const prev = new Date(rows[i - 1].date);
    const curr = new Date(rows[i].date);
    const diff = (curr.getTime() - prev.getTime()) / 86400000;
    if (diff === 1) { current++; longest = Math.max(longest, current); }
    else current = 1;
  }
  return longest;
}

export { PRAYERS };
