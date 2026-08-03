import AsyncStorage from '@react-native-async-storage/async-storage';
import { PrayerName, PRAYER_NAMES, PrayerTimes } from '../../types/models';

// ─── Per-prayer notification offset ────────────────────────────────────────────
export type NotifOffset = 'off' | '0' | '5' | '10' | '15';
export type PrayerNotifOffsets = Partial<Record<PrayerName, NotifOffset>>;

const OFFSET_KEY = 'kitaabai.prayer.notif.offsets';

export const DEFAULT_OFFSETS: PrayerNotifOffsets = {
  Fajr: '0', Dhuhr: 'off', Asr: 'off', Maghrib: '0', Isha: '0',
};

export async function loadNotifOffsets(): Promise<PrayerNotifOffsets> {
  try {
    const raw = await AsyncStorage.getItem(OFFSET_KEY);
    if (raw) return { ...DEFAULT_OFFSETS, ...JSON.parse(raw) as PrayerNotifOffsets };
  } catch {}
  return { ...DEFAULT_OFFSETS };
}

export async function saveNotifOffsets(offsets: PrayerNotifOffsets): Promise<void> {
  await AsyncStorage.setItem(OFFSET_KEY, JSON.stringify(offsets)).catch(() => {});
}

// ─── Notification sound preference ─────────────────────────────────────────────
export type NotifSound = 'default' | 'adhan';
const SOUND_KEY = 'kitaabai.prayer.notif.sound';

export async function loadNotifSound(): Promise<NotifSound> {
  try {
    const raw = await AsyncStorage.getItem(SOUND_KEY);
    if (raw === 'adhan' || raw === 'default') return raw;
  } catch {}
  return 'adhan';
}

export async function saveNotifSound(sound: NotifSound): Promise<void> {
  await AsyncStorage.setItem(SOUND_KEY, sound).catch(() => {});
}

export function configureNotificationHandler(): void {
  // Lazy configure — won't crash if module unavailable
  import('expo-notifications').then(Notifications => {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });
  }).catch(() => {});
}

export async function requestNotificationPermission(): Promise<boolean> {
  try {
    const Device = await import('expo-device');
    if (!Device.isDevice) return false;
    const Notifications = await import('expo-notifications');
    const { Platform } = await import('react-native');
    if (Platform.OS === 'android') {
      // Two channels because Android locks the sound per-channel after first creation
      await Notifications.setNotificationChannelAsync('prayer-reminders-default', {
        name: 'Prayer Reminders',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        sound: 'default',
      });
      await Notifications.setNotificationChannelAsync('prayer-reminders-adhan', {
        name: 'Prayer Reminders (Adhan)',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        // Requires android/app/src/main/res/raw/adhan.mp3 — falls back to default if absent
        sound: 'adhan',
      });
    }
    const { status: existing } = await Notifications.getPermissionsAsync();
    if (existing === 'granted') return true;
    const { status } = await Notifications.requestPermissionsAsync();
    return status === 'granted';
  } catch { return false; }
}

function parsePrayerTime(t: string): { h: number; m: number } | null {
  const match = t.match(/^(\d{1,2}):(\d{2})/);
  return match ? { h: parseInt(match[1], 10), m: parseInt(match[2], 10) } : null;
}

const PREFIX = 'prayer-';

export async function schedulePrayerNotifications(
  prayerTimes: PrayerTimes,
  enabledPrayers: Set<PrayerName>,
  offsets?: PrayerNotifOffsets,
  sound?: NotifSound,
): Promise<void> {
  try {
    const Notifications = await import('expo-notifications');
    const { Platform } = await import('react-native');
    const resolvedSound: NotifSound = sound ?? (await loadNotifSound());
    const channelId = resolvedSound === 'adhan' ? 'prayer-reminders-adhan' : 'prayer-reminders-default';
    await cancelPrayerNotifications();
    for (const prayer of PRAYER_NAMES) {
      if (!enabledPrayers.has(prayer)) continue;
      const offsetStr = offsets?.[prayer] ?? '0';
      if (offsetStr === 'off') continue;
      const parsed = parsePrayerTime(prayerTimes[prayer]);
      if (!parsed) continue;
      const offsetMins = parseInt(offsetStr, 10);
      let { h, m } = parsed;
      const totalMins = h * 60 + m - offsetMins;
      h = Math.floor(totalMins / 60) % 24;
      m = ((totalMins % 60) + 60) % 60;
      const offsetLabel = offsetMins > 0 ? ` (${offsetMins} min early)` : '';
      await Notifications.scheduleNotificationAsync({
        identifier: `${PREFIX}${prayer.toLowerCase()}`,
        content: {
          title: `🕌 ${prayer} Prayer${offsetLabel}`,
          body: offsetMins > 0 ? `${prayer} prayer in ${offsetMins} minutes` : `It's time for ${prayer}`,
          sound: resolvedSound === 'adhan' ? 'adhan' : 'default',
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour: h,
          minute: m,
          ...(Platform.OS === 'android' ? { channelId } : {}),
        },
      });
    }
  } catch (e) { console.warn('[KitaabAI] Notification scheduling failed:', e); }
}

export async function cancelPrayerNotifications(): Promise<void> {
  try {
    const Notifications = await import('expo-notifications');
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    await Promise.all(
      scheduled
        .filter(n => n.identifier.startsWith(PREFIX))
        .map(n => Notifications.cancelScheduledNotificationAsync(n.identifier))
    );
  } catch {}
}

export async function getScheduledPrayerNames(): Promise<Set<PrayerName>> {
  try {
    const Notifications = await import('expo-notifications');
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    const names = new Set<PrayerName>();
    for (const n of scheduled) {
      if (!n.identifier.startsWith(PREFIX)) continue;
      const name = (n.identifier.replace(PREFIX, '').charAt(0).toUpperCase()
        + n.identifier.replace(PREFIX, '').slice(1)) as PrayerName;
      if (PRAYER_NAMES.includes(name)) names.add(name);
    }
    return names;
  } catch { return new Set(); }
}
