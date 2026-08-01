import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Animated, Easing, Linking, Modal, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CustomAlert } from '../../components/common/CustomAlert';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { LoadingView, ErrorView } from '../../components/common/AsyncStateView';
import { PrayerTimeRow } from '../../components/prayer/PrayerTimeRow';
import { NextPrayerCountdown } from '../../components/prayer/NextPrayerCountdown';
import { QiblaDirection } from '../../components/prayer/QiblaDirection';
import { fetchPrayerTimesByCoords, fetchPrayerTimesByCity } from '../../services/api/prayerTimesApi';
import { requestNotificationPermission, schedulePrayerNotifications, cancelPrayerNotifications, getScheduledPrayerNames } from '../../services/notifications/prayerNotifications';
import { PrayerName, PrayerTimes, PRAYER_NAMES, PrayerCalculationMethod, PRAYER_METHODS } from '../../types/models';
import { colors, radius, shadow, spacing, typography } from '../../theme';

const DEFAULT_CITY    = 'Karachi';
const DEFAULT_COUNTRY = 'Pakistan';
const METHOD_KEY      = 'kitaabai.prayer.method';

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

function getCurrentPrayer(times: PrayerTimes): PrayerName | null {
  const next = getNextPrayer(times);
  const nextIdx = PRAYER_NAMES.indexOf(next);
  if (nextIdx === 0) return null; // before Fajr
  return PRAYER_NAMES[nextIdx - 1];
}

function getMinutesUntil(times: PrayerTimes, prayer: PrayerName): number {
  const now = new Date();
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const match = times[prayer].match(/^(\d{1,2}):(\d{2})/);
  if (!match) return 0;
  const prayerMinutes = parseInt(match[1], 10) * 60 + parseInt(match[2], 10);
  const diff = prayerMinutes - nowMinutes;
  return diff > 0 ? diff : 1440 + diff;
}

export function PrayerScreen() {
  const { t } = useTranslation();
  const [prayerTimes, setPrayerTimes]     = useState<PrayerTimes | null>(null);
  const [isLoading, setIsLoading]         = useState(true);
  const [error, setError]                 = useState<string | null>(null);
  const [locationName, setLocationName]   = useState('');
  const [coords, setCoords]               = useState<{ latitude: number; longitude: number } | null>(null);
  const [enabledPrayers, setEnabledPrayers] = useState<Set<PrayerName>>(new Set());
  const [notifPermission, setNotifPermission] = useState(false);
  const [calcMethod, setCalcMethod]       = useState<PrayerCalculationMethod>(2);
  const [methodPickerOpen, setMethodPickerOpen] = useState(false);
  
  const [alertConfig, setAlertConfig] = useState<{
    visible: boolean; title: string; message?: string; buttons?: any[];
  }>({ visible: false, title: '' });
  const showAlert = (title: string, message?: string, buttons?: any[]) => setAlertConfig({ visible: true, title, message, buttons });
  const hideAlert = () => setAlertConfig(prev => ({ ...prev, visible: false }));

  const notifLoaded = useRef(false);
  const savedCoords = useRef<{ latitude: number; longitude: number } | null>(null);
  const savedCity   = useRef<{ city: string; country: string } | null>(null);

  const headerOpacity = useRef(new Animated.Value(0)).current;
  const headerSlide   = useRef(new Animated.Value(-24)).current;

  const fetchWithMethod = useCallback(async (method: PrayerCalculationMethod) => {
    if (savedCoords.current) {
      const { latitude, longitude } = savedCoords.current;
      return fetchPrayerTimesByCoords(latitude, longitude, method);
    } else if (savedCity.current) {
      const { city, country } = savedCity.current;
      return fetchPrayerTimesByCity(city, country, method);
    }
    return fetchPrayerTimesByCity(DEFAULT_CITY, DEFAULT_COUNTRY, method);
  }, []);

  const load = useCallback(async () => {
    setIsLoading(true); setError(null);
    const storedMethod = await AsyncStorage.getItem(METHOD_KEY).catch(() => null);
    const method: PrayerCalculationMethod = storedMethod ? (parseInt(storedMethod, 10) as PrayerCalculationMethod) : 2;
    setCalcMethod(method);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        const { latitude, longitude } = loc.coords;
        savedCoords.current = { latitude, longitude };
        setCoords({ latitude, longitude });
        const [place] = await Location.reverseGeocodeAsync({ latitude, longitude });
        setLocationName([place?.city ?? place?.region, place?.country].filter(Boolean).join(', ')
          || `${latitude.toFixed(2)}, ${longitude.toFixed(2)}`);
        setPrayerTimes(await fetchPrayerTimesByCoords(latitude, longitude, method));
      } else {
        savedCity.current = { city: DEFAULT_CITY, country: DEFAULT_COUNTRY };
        setLocationName(`${DEFAULT_CITY}, ${DEFAULT_COUNTRY}`);
        setCoords({ latitude: 24.8607, longitude: 67.0011 });
        setPrayerTimes(await fetchPrayerTimesByCity(DEFAULT_CITY, DEFAULT_COUNTRY, method));
      }
    } catch {
      setError('Could not load prayer times. Check your connection and try again.');
    } finally {
      setIsLoading(false);
      Animated.parallel([
        Animated.timing(headerOpacity, { toValue: 1, duration: 450, useNativeDriver: true, easing: Easing.out(Easing.cubic) }),
        Animated.timing(headerSlide,   { toValue: 0,  duration: 450, useNativeDriver: true, easing: Easing.out(Easing.cubic) }),
      ]).start();
    }
  }, []);

  const handleChangeMethod = async (method: PrayerCalculationMethod) => {
    setCalcMethod(method);
    setMethodPickerOpen(false);
    await AsyncStorage.setItem(METHOD_KEY, String(method)).catch(() => {});
    try {
      const times = await fetchWithMethod(method);
      setPrayerTimes(times);
    } catch { /* silent */ }
  };

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
      showAlert('Allow Notifications', 'KitaabAI needs notification permission to send prayer reminders.',
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
      showAlert('Permission required', 'Allow notifications in Settings to receive prayer reminders.', [{ text: 'OK' }]);
      return;
    }
    setNotifPermission(true);
    const all = new Set<PrayerName>(PRAYER_NAMES);
    setEnabledPrayers(all);
    await schedulePrayerNotifications(prayerTimes, all);
  };

  if (isLoading) return <ScreenContainer><LoadingView message="Fetching prayer times…" /></ScreenContainer>;
  if (error || !prayerTimes) return <ScreenContainer><ErrorView message={error ?? 'Could not load prayer times.'} onRetry={load} /></ScreenContainer>;

  const nextPrayer    = getNextPrayer(prayerTimes);
  const currentPrayer = getCurrentPrayer(prayerTimes);
  const minsUntilNext = getMinutesUntil(prayerTimes, nextPrayer);
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  const methodLabel = PRAYER_METHODS.find(m => m.value === calcMethod)?.label ?? '';

  return (
    <ScreenContainer noPadding>
      <StatusBar barStyle="light-content" />

      {/* Method picker modal */}
      <Modal visible={methodPickerOpen} transparent animationType="slide" onRequestClose={() => setMethodPickerOpen(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.methodPanel}>
            <View style={styles.methodHandle} />
            <Text style={styles.methodTitle}>Calculation Method</Text>
            {PRAYER_METHODS.map(m => (
              <TouchableOpacity
                key={m.value}
                style={[styles.methodRow, calcMethod === m.value && styles.methodRowActive]}
                onPress={() => handleChangeMethod(m.value)}
              >
                <Text style={[styles.methodLabel, calcMethod === m.value && styles.methodLabelActive]} numberOfLines={2}>
                  {m.label}
                </Text>
                {calcMethod === m.value && (
                  <Ionicons name="checkmark-circle" size={18} color={colors.gold[500]} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Modal>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

        {/* ── Hero Header ── */}
        <LinearGradient colors={['#060C1F', '#062316', '#0B3D2E']} style={styles.hero}>
          <View style={styles.heroDecor1} />
          <View style={styles.heroDecor2} />

          <Animated.View style={{ opacity: headerOpacity, transform: [{ translateY: headerSlide }] }}>
            <View style={styles.heroTop}>
              <View style={styles.locationPill}>
                <Ionicons name="location" size={13} color="#4ADE80" />
                <Text style={styles.locationText}>{locationName}</Text>
              </View>
              <Text style={styles.dateText}>{today}</Text>
            </View>

            <NextPrayerCountdown prayerTimes={prayerTimes} />

            {/* Method button */}
            <TouchableOpacity style={styles.methodBtn} onPress={() => setMethodPickerOpen(true)}>
              <Ionicons name="calculator-outline" size={13} color="rgba(255,255,255,0.5)" />
              <Text style={styles.methodBtnText} numberOfLines={1}>{methodLabel}</Text>
              <Ionicons name="chevron-down" size={12} color="rgba(255,255,255,0.4)" />
            </TouchableOpacity>

            {enabledPrayers.size === 0 && (
              <TouchableOpacity style={styles.enableAllBtn} onPress={handleEnableAll} activeOpacity={0.85}>
                <Ionicons name="notifications" size={16} color={colors.navy[900]} />
                <Text style={styles.enableAllLabel}>Enable Prayer Reminders</Text>
              </TouchableOpacity>
            )}
          </Animated.View>
        </LinearGradient>

        {/* ── Prayer Times ── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="time" size={14} color="#4ADE80" />
            <Text style={[styles.sectionTitle, { color: colors.parchment[950] }]}>Prayer Times</Text>
            <View style={styles.nextBadge}>
              <View style={styles.nextDot} />
              <Text style={styles.nextText}>{nextPrayer} next</Text>
            </View>
          </View>

          <View style={styles.prayerGroup}>
            {PRAYER_NAMES.map((prayer, index) => (
              <View key={prayer}>
                <PrayerTimeRow
                  name={prayer}
                  time={prayerTimes[prayer]}
                  isNext={nextPrayer === prayer}
                  isCurrent={currentPrayer === prayer}
                  minutesUntil={nextPrayer === prayer ? minsUntilNext : undefined}
                  notificationsEnabled={enabledPrayers.has(prayer)}
                  onToggleNotification={(enabled) => handleTogglePrayer(prayer, enabled)}
                />
                {index < PRAYER_NAMES.length - 1 && <View style={styles.rowDivider} />}
              </View>
            ))}
          </View>

          <View style={styles.sunriseRow}>
            <Ionicons name="sunny-outline" size={13} color={colors.gold[500]} />
            <Text style={styles.sunriseMeta}>Sunrise  {prayerTimes.Sunrise.replace(/ \(.*\)/, '')}</Text>
          </View>
        </View>

        {/* ── Qibla ── */}
        {coords && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="compass" size={14} color="#F59E0B" />
              <Text style={[styles.sectionTitle, { color: colors.parchment[950] }]}>{t('prayer.qibla')}</Text>
            </View>
            <View style={styles.qiblaCard}>
              <QiblaDirection latitude={coords.latitude} longitude={coords.longitude} />
            </View>
          </View>
        )}

      </ScrollView>
      <CustomAlert
        visible={alertConfig.visible}
        title={alertConfig.title}
        message={alertConfig.message}
        buttons={alertConfig.buttons}
        onDismiss={hideAlert}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scrollContent: { paddingBottom: spacing.xxxl },

  hero: { paddingTop: spacing.xl + spacing.xl, paddingBottom: spacing.xxl, paddingHorizontal: spacing.lg, overflow: 'hidden', marginBottom: spacing.sm },
  heroDecor1: { position: 'absolute', right: -50, top: -50, width: 180, height: 180, borderRadius: 90, borderWidth: 1, borderColor: 'rgba(74,222,128,0.15)' },
  heroDecor2: { position: 'absolute', left: -40, bottom: -50, width: 160, height: 160, borderRadius: 80, borderWidth: 1, borderColor: 'rgba(74,222,128,0.07)' },
  heroTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.lg },
  locationPill: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(74,222,128,0.15)', borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: 5, borderWidth: 1, borderColor: 'rgba(74,222,128,0.25)' },
  locationText: { ...typography.caption, color: '#4ADE80', fontWeight: '700' },
  dateText: { ...typography.caption, color: 'rgba(255,255,255,0.3)' },
  methodBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: radius.pill,
    paddingHorizontal: spacing.md, paddingVertical: 5,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)',
    marginTop: spacing.md, alignSelf: 'flex-start', maxWidth: '100%',
  },
  methodBtnText: { fontSize: 11, color: 'rgba(255,255,255,0.5)', fontWeight: '500', flex: 1 },
  enableAllBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, backgroundColor: '#4ADE80', borderRadius: radius.pill, paddingVertical: spacing.md, marginTop: spacing.lg },
  enableAllLabel: { ...typography.subheading, color: colors.navy[900] },

  section: { paddingHorizontal: spacing.lg, marginBottom: spacing.xl },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.md },
  sectionTitle: { ...typography.heading, flex: 1 },
  nextBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(74,222,128,0.12)', borderRadius: radius.pill, paddingHorizontal: spacing.sm, paddingVertical: 3, borderWidth: 1, borderColor: 'rgba(74,222,128,0.25)' },
  nextDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: '#4ADE80' },
  nextText: { fontSize: 11, color: '#4ADE80', fontWeight: '700' },

  prayerGroup: { backgroundColor: colors.white, borderRadius: radius.md, overflow: 'hidden', ...shadow.md },
  rowDivider: { height: 1, backgroundColor: colors.parchment[100], marginLeft: spacing.lg },
  sunriseRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, justifyContent: 'center', marginTop: spacing.md },
  sunriseMeta: { ...typography.caption, color: colors.parchment[500] },

  qiblaCard: { backgroundColor: colors.navy[900], borderRadius: radius.md, overflow: 'hidden', ...shadow.navy },

  // Method picker
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
  methodPanel: {
    backgroundColor: colors.parchment[50],
    borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl,
    paddingHorizontal: spacing.xl, paddingBottom: spacing.xxxl,
    paddingTop: spacing.md, gap: spacing.xs, ...shadow.lg,
  },
  methodHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: colors.parchment[300], alignSelf: 'center', marginBottom: spacing.md },
  methodTitle: { ...typography.heading, color: colors.navy[900], marginBottom: spacing.sm },
  methodRow: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    paddingVertical: spacing.md, paddingHorizontal: spacing.md,
    borderRadius: radius.md, borderWidth: 1, borderColor: colors.parchment[200],
  },
  methodRowActive: { backgroundColor: colors.gold[50], borderColor: colors.gold[300] },
  methodLabel: { ...typography.bodySmall, color: colors.parchment[700], flex: 1 },
  methodLabelActive: { color: colors.navy[900], fontWeight: '600' },
});
