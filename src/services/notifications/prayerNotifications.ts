import { PrayerName, PRAYER_NAMES, PrayerTimes } from '../../types/models';

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
      await Notifications.setNotificationChannelAsync('prayer-reminders', {
        name: 'Prayer Reminders',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        sound: 'default',
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
  enabledPrayers: Set<PrayerName>
): Promise<void> {
  try {
    const Notifications = await import('expo-notifications');
    await cancelPrayerNotifications();
    for (const prayer of PRAYER_NAMES) {
      if (!enabledPrayers.has(prayer)) continue;
      const parsed = parsePrayerTime(prayerTimes[prayer]);
      if (!parsed) continue;
      await Notifications.scheduleNotificationAsync({
        identifier: `${PREFIX}${prayer.toLowerCase()}`,
        content: {
          title: `🕌 ${prayer} Prayer`,
          body: `It's time for ${prayer}`,
          sound: 'default',
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour: parsed.h,
          minute: parsed.m,
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
