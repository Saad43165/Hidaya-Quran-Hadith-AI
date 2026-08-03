import { PrayerName, PrayerTimes, PRAYER_NAMES } from '../types/models';

export function getNextPrayer(times: PrayerTimes): PrayerName {
  const now = new Date();
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  for (const prayer of PRAYER_NAMES) {
    const match = times[prayer].match(/^(\d{1,2}):(\d{2})/);
    if (!match) continue;
    if (parseInt(match[1], 10) * 60 + parseInt(match[2], 10) > nowMinutes) return prayer;
  }
  return 'Fajr';
}

export function getCurrentPrayer(times: PrayerTimes): PrayerName | null {
  const next = getNextPrayer(times);
  const idx = PRAYER_NAMES.indexOf(next);
  return idx === 0 ? null : PRAYER_NAMES[idx - 1];
}

export function getMinutesUntil(times: PrayerTimes, prayer: PrayerName): number {
  const now = new Date();
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const match = times[prayer].match(/^(\d{1,2}):(\d{2})/);
  if (!match) return 0;
  const prayerMinutes = parseInt(match[1], 10) * 60 + parseInt(match[2], 10);
  const diff = prayerMinutes - nowMinutes;
  return diff > 0 ? diff : 1440 + diff;
}

export function formatTime12(time24: string): string {
  const match = time24.match(/^(\d{1,2}):(\d{2})/);
  if (!match) return time24;
  let hours = parseInt(match[1], 10);
  const minutes = match[2];
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12 || 12;
  return `${hours}:${minutes} ${ampm}`;
}
