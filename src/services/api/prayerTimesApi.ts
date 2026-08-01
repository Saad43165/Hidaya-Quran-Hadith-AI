import axios from 'axios';
import { PrayerTimes } from '../../types/models';

/**
 * Aladhan.com API — free, no key required.
 * https://aladhan.com/prayer-times-api
 * Method 2 = Islamic Society of North America (ISNA) — widely used default.
 * Users can override in settings (Phase 6 adds a method picker).
 */
const aladhanClient = axios.create({
  baseURL: 'https://api.aladhan.com/v1',
  timeout: 10000,
});

interface RawTimings {
  Fajr: string;
  Sunrise: string;
  Dhuhr: string;
  Asr: string;
  Sunset: string;
  Maghrib: string;
  Isha: string;
  Imsak: string;
  Midnight: string;
}

interface RawPrayerResponse {
  data: {
    timings: RawTimings;
    date: { readable: string; gregorian: { date: string } };
    meta: {
      timezone: string;
      method: { id: number };
      location: { latitude: number; longitude: number };
    };
  };
}

interface RawCityResponse {
  data: Array<{
    timings: RawTimings;
    date: { readable: string; gregorian: { date: string } };
    meta: { timezone: string; method: { id: number } };
  }>;
}

/** Fetch today's prayer times using device GPS coordinates. */
export async function fetchPrayerTimesByCoords(
  latitude: number,
  longitude: number,
  method = 2
): Promise<PrayerTimes> {
  const today = new Date();
  const timestamp = Math.floor(today.getTime() / 1000);
  const { data } = await aladhanClient.get<RawPrayerResponse>(
    `/timings/${timestamp}`,
    { params: { latitude, longitude, method } }
  );
  const t = data.data;
  return {
    Fajr: t.timings.Fajr,
    Sunrise: t.timings.Sunrise,
    Dhuhr: t.timings.Dhuhr,
    Asr: t.timings.Asr,
    Maghrib: t.timings.Maghrib,
    Isha: t.timings.Isha,
    date: t.date.gregorian.date,
    city: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
    country: '',
    timezone: t.meta.timezone,
    method: t.meta.method.id,
  };
}

/** Fetch today's prayer times by city + country name (fallback when GPS is denied). */
export async function fetchPrayerTimesByCity(
  city: string,
  country: string,
  method = 2
): Promise<PrayerTimes> {
  const today = new Date();
  const month = today.getMonth() + 1;
  const year = today.getFullYear();
  const { data } = await aladhanClient.get<RawCityResponse>(
    '/calendarByCity',
    { params: { city, country, method, month, year } }
  );
  // Pick today's entry by matching the day of month.
  const day = today.getDate() - 1; // 0-indexed
  const entry = data.data[day] ?? data.data[0];
  return {
    Fajr: entry.timings.Fajr,
    Sunrise: entry.timings.Sunrise,
    Dhuhr: entry.timings.Dhuhr,
    Asr: entry.timings.Asr,
    Maghrib: entry.timings.Maghrib,
    Isha: entry.timings.Isha,
    date: entry.date.gregorian.date,
    city,
    country,
    timezone: entry.meta.timezone,
    method: entry.meta.method.id,
  };
}
