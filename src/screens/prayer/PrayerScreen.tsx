import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import { useTranslation } from 'react-i18next';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { LoadingView, ErrorView } from '../../components/common/AsyncStateView';
import { PrayerTimeRow } from '../../components/prayer/PrayerTimeRow';
import { NextPrayerCountdown } from '../../components/prayer/NextPrayerCountdown';
import { QiblaDirection } from '../../components/prayer/QiblaDirection';
import { fetchPrayerTimesByCoords, fetchPrayerTimesByCity } from '../../services/api/prayerTimesApi';
import {
  requestNotificationPermission,
  schedulePrayerNotifications,
  cancelPrayerNotifications,
  getScheduledPrayerNames,
} from '../../services/notifications/prayerNotifications';
import { PrayerName, PrayerTimes, PRAYER_NAMES } from '../../types/models';
import { colors, gradients, radius, spacing, typography } from '../../theme';

const DEFAULT_CITY = 'Karachi';
const DEFAULT_COUNTRY = 'Pakistan';

function getNextPrayer(times: PrayerTimes): PrayerName {
  const now = new Date();
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  for (const prayer of PRAYER_NAMES) {
    const match = times[prayer].match(/^(\d{1,2}):(\d{2})/);
    if (!match) continue;
    if (parseInt(match[1], 10) * 60 + parseInt(match[2], 10) > nowMinutes) return prayer;
  }
  return 'Fajr';
}

export function PrayerScreen() {
  const { t } = useTranslation();
  const [prayerTimes, setPrayerTimes] = useState<PrayerTimes | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [locationName, setLocationName] = useState('');
  const [coords, setCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [enabledPrayers, setEnabledPrayers] = useState<Set<PrayerName>>(new Set());
  const [notifPermission, setNotifPermission] = useState(false);
  const notifLoaded = useRef(false);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        const { latitude, longitude } = loc.coords;
        setCoords({ latitude, longitude });
        const [place] = await Location.reverseGeocodeAsync({ latitude, longitude });
        setLocationName([place?.city ?? place?.region, place?.country].filter(Boolean).join(', ')
          || `${latitude.toFixed(2)}, ${longitude.toFixed(2)}`);
        setPrayerTimes(await fetchPrayerTimesByCoords(latitude, longitude));
      } else {
        setLocationName(`${DEFAULT_CITY}, ${DEFAULT_COUNTRY}`);
        setCoords({ latitude: 24.8607, longitude: 67.0011 });
        setPrayerTimes(await fetchPrayerTimesByCity(DEFAULT_CITY, DEFAULT_COUNTRY));
      }
    } catch {
      setError('Could not load prayer times. Check your connection and try again.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadNotifState = useCallback(async () => {
    if (notifLoaded.current) return;
    notifLoaded.current = true;
    const granted = await requestNotificationPermission();
    setNotifPermission(granted);
    if (granted) setEnabledPrayers(await getScheduledPrayerNames());
  }, []);

  useEffect(() => { load(); loadNotifState(); }, [load, loadNotifState]);

  const handleTogglePrayer = async (prayer: PrayerName, enabled: boolean) => {
    if (!notifPermission) {
      Alert.alert('Allow Notifications', 'KitaabAI needs notification permission to send prayer reminders.',
        [{ text: 'Cancel', style: 'cancel' }, { text: 'Open Settings', onPress: () => Linking.openSettings() }]);
      return;
    }
    if (!prayerTimes) return;
    const next = new Set(enabledPrayers);
    enabled ? next.add(prayer) : next.delete(prayer);
    setEnabledPrayers(next);
    next.size === 0 ? await cancelPrayerNotifications() : await schedulePrayerNotifications(prayerTimes, next);
  };

  const handleEnableAll = async () => {
    if (!prayerTimes) return;
    const granted = await requestNotificationPermission();
    if (!granted) {
      Alert.alert('Permission required', 'Please allow notifications in Settings to receive prayer reminders.');
      return;
    }
    setNotifPermission(true);
    const all = new Set<PrayerName>(PRAYER_NAMES);
    setEnabledPrayers(all);
    await schedulePrayerNotifications(prayerTimes, all);
  };

  if (isLoading) return <ScreenContainer><LoadingView message="Fetching prayer times..." /></ScreenContainer>;
  if (error || !prayerTimes) return <ScreenContainer><ErrorView message={error ?? 'Could not load prayer times.'} onRetry={load} /></ScreenContainer>;

  return (
    <ScreenContainer noPadding>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

        <LinearGradient colors={gradients.heroNavy} style={styles.hero}>
          <Text style={styles.locationText}>{locationName}</Text>
          <Text style={styles.dateText}>{prayerTimes.date}</Text>
          <NextPrayerCountdown prayerTimes={prayerTimes} />
        </LinearGradient>

        {enabledPrayers.size === 0 && (
          <TouchableOpacity style={styles.enableAllBtn} onPress={handleEnableAll}>
            <Text style={styles.enableAllLabel}>🔔  {t('prayer.enableAll')}</Text>
          </TouchableOpacity>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('prayer.prayerTimes')}</Text>
          {PRAYER_NAMES.map((prayer) => (
            <PrayerTimeRow
              key={prayer}
              name={prayer}
              time={prayerTimes[prayer]}
              isNext={getNextPrayer(prayerTimes) === prayer}
              notificationsEnabled={enabledPrayers.has(prayer)}
              onToggleNotification={(enabled) => handleTogglePrayer(prayer, enabled)}
            />
          ))}
          <Text style={styles.sunriseMeta}>
            {t('prayer.sunrise')}: {prayerTimes.Sunrise.replace(/ \(.*\)/, '')}
          </Text>
        </View>

        {coords && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('prayer.qibla')}</Text>
            <View style={styles.qiblaCard}>
              <QiblaDirection latitude={coords.latitude} longitude={coords.longitude} />
            </View>
          </View>
        )}

      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scrollContent: { paddingBottom: spacing.xxxl },
  hero: {
    paddingTop: spacing.xl,
    paddingBottom: spacing.xl,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    borderBottomLeftRadius: radius.lg,
    borderBottomRightRadius: radius.lg,
    marginBottom: spacing.lg,
  },
  locationText: { ...typography.subheading, color: colors.gold[400], marginBottom: spacing.xs },
  dateText: { ...typography.caption, color: colors.parchment[300], marginBottom: spacing.lg },
  enableAllBtn: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    backgroundColor: colors.gold[500],
    borderRadius: radius.pill,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  enableAllLabel: { ...typography.subheading, color: colors.navy[900] },
  section: { paddingHorizontal: spacing.lg, marginBottom: spacing.xl },
  sectionTitle: { ...typography.heading, color: colors.navy[900], marginBottom: spacing.md },
  sunriseMeta: { ...typography.caption, color: colors.parchment[600], marginTop: spacing.sm, textAlign: 'center' },
  qiblaCard: { backgroundColor: colors.navy[800], borderRadius: radius.lg, paddingVertical: spacing.lg },
});
