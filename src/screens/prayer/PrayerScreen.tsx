import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, Easing, Image, Linking, Modal, RefreshControl, ScrollView, StatusBar, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
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
import { requestNotificationPermission, schedulePrayerNotifications, cancelPrayerNotifications, getScheduledPrayerNames, loadNotifOffsets } from '../../services/notifications/prayerNotifications';
import { BackButton } from '../../components/common/BackButton';
import { OfflineBanner } from '../../components/common/OfflineBanner';
import { getTodayHijri } from '../../services/hijri/hijriCalendar';
import { PrayerName, PrayerTimes, PRAYER_NAMES, PrayerCalculationMethod, PRAYER_METHODS } from '../../types/models';
import { getNextPrayer, getCurrentPrayer, getMinutesUntil } from '../../utils/prayerUtils';
import { useThemeColors } from '../../hooks/useThemeColors';
import { colors, radius, shadow, spacing, typography } from '../../theme';

const DEFAULT_CITY    = 'Karachi';
const DEFAULT_COUNTRY = 'Pakistan';
const METHOD_KEY      = 'kitaabai.prayer.method';
const NOTIF_KEY       = 'ilmai.prayer.notifications';

export function PrayerScreen() {
  const { t } = useTranslation();
  const { isDark, surface, surfaceElevated, border, textPrimary, textSecondary } = useThemeColors();
  const [prayerTimes, setPrayerTimes]     = useState<PrayerTimes | null>(null);
  const [isLoading, setIsLoading]         = useState(true);
  const [error, setError]                 = useState<string | null>(null);
  const [locationName, setLocationName]   = useState('');
  const [coords, setCoords]               = useState<{ latitude: number; longitude: number } | null>(null);
  const [enabledPrayers, setEnabledPrayers] = useState<Set<PrayerName>>(new Set());
  const [notifPermission, setNotifPermission] = useState(false);
  const [calcMethod, setCalcMethod]       = useState<PrayerCalculationMethod>(2);
  const [methodPickerOpen, setMethodPickerOpen] = useState(false);
  const [refreshing, setRefreshing]       = useState(false);

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

  const persistEnabledPrayers = useCallback(async (next: Set<PrayerName>) => {
    try {
      await AsyncStorage.setItem(NOTIF_KEY, JSON.stringify(Array.from(next)));
    } catch {}
  }, []);

  const loadNotifState = useCallback(async () => {
    if (notifLoaded.current) return;
    notifLoaded.current = true;
    const granted = await requestNotificationPermission();
    setNotifPermission(granted);
    // Load from AsyncStorage first for instant UI, then reconcile with scheduled notifications
    try {
      const saved = await AsyncStorage.getItem(NOTIF_KEY);
      if (saved) {
        const parsed: string[] = JSON.parse(saved);
        const fromStorage = new Set<PrayerName>(
          parsed.filter((n): n is PrayerName => (PRAYER_NAMES as string[]).includes(n))
        );
        setEnabledPrayers(fromStorage);
      }
    } catch {}
    if (granted) {
      const scheduled = await getScheduledPrayerNames();
      setEnabledPrayers(new Set<PrayerName>(scheduled));
    }
  }, []);

  useEffect(() => { load(); loadNotifState(); }, [load, loadNotifState]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  const handleTogglePrayer = async (prayer: PrayerName, enabled: boolean) => {
    if (!notifPermission) {
      const granted = await requestNotificationPermission();
      if (!granted) {
        showAlert('Allow Notifications', 'KitaabAI needs notification permission to send prayer reminders.',
          [{ text: 'Cancel', style: 'cancel' }, { text: 'Open Settings', onPress: () => Linking.openSettings() }]);
        return;
      }
      setNotifPermission(true);
    }
    if (!prayerTimes) return;
    const next = new Set(enabledPrayers);
    enabled ? next.add(prayer) : next.delete(prayer);
    setEnabledPrayers(next);
    await persistEnabledPrayers(next);
    if (next.size === 0) {
      await cancelPrayerNotifications();
    } else {
      const offsets = await loadNotifOffsets();
      await schedulePrayerNotifications(prayerTimes, next, offsets);
    }
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
    await persistEnabledPrayers(all);
    const offsets = await loadNotifOffsets();
    await schedulePrayerNotifications(prayerTimes, all, offsets);
  };

  const handleDisableAll = async () => {
    const empty = new Set<PrayerName>();
    setEnabledPrayers(empty);
    await persistEnabledPrayers(empty);
    await cancelPrayerNotifications();
  };

  if (isLoading && !refreshing) return <ScreenContainer><LoadingView message="Fetching prayer times…" /></ScreenContainer>;
  if (error || !prayerTimes) return <ScreenContainer><ErrorView message={error ?? 'Could not load prayer times.'} onRetry={load} /></ScreenContainer>;

  const nextPrayer    = getNextPrayer(prayerTimes);
  const currentPrayer = getCurrentPrayer(prayerTimes);
  const minsUntilNext = getMinutesUntil(prayerTimes, nextPrayer);
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  const hijri = getTodayHijri();
  const methodLabel = PRAYER_METHODS.find(m => m.value === calcMethod)?.label ?? '';

  return (
    <ScreenContainer noPadding>
      <OfflineBanner />
      <StatusBar barStyle="light-content" />

      {/* Method picker modal */}
      <Modal visible={methodPickerOpen} transparent animationType="slide" onRequestClose={() => setMethodPickerOpen(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.methodPanel, { backgroundColor: surface }]}>
            <View style={[styles.methodHandle, { backgroundColor: border }]} />
            <Text style={[styles.methodTitle, { color: textPrimary }]}>Calculation Method</Text>
            {PRAYER_METHODS.map(m => (
              <TouchableOpacity
                key={m.value}
                style={[styles.methodRow, { borderColor: border }, calcMethod === m.value && styles.methodRowActive]}
                onPress={() => handleChangeMethod(m.value)}
                activeOpacity={0.75}
              >
                <Text style={[styles.methodLabel, { color: textSecondary }, calcMethod === m.value && styles.methodLabelActive]} numberOfLines={2}>
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

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#4ADE80" colors={['#4ADE80']} />
        }
      >

        {/* ── Hero Header ── */}
        <LinearGradient colors={['#060C1F', '#062316', '#0B3D2E']} style={styles.hero}>
          <Image source={require('../../../assets/images/prayerscreenheader.png')} style={styles.heroBgImage} resizeMode="cover" />
          <View style={styles.heroScrim} />
          <View style={styles.heroDecor1} />
          <View style={styles.heroDecor2} />

          {/* Back button row */}
          <View style={styles.heroNavRow}>
            <BackButton />
            <View style={styles.heroPillsRow}>
              <View style={styles.locationPill}>
                <Ionicons name="location" size={12} color="#4ADE80" />
                <Text style={styles.locationText} numberOfLines={1}>{locationName}</Text>
              </View>
              <View style={styles.datePill}>
                <Ionicons name="calendar-outline" size={12} color="rgba(255,255,255,0.5)" />
                <Text style={styles.datePillText}>{today}</Text>
              </View>
              <View style={styles.hijriPill}>
                <Text style={[styles.hijriPillAr, { fontFamily: 'Amiri_400Regular' }]}>{hijri.day} {hijri.monthNameAr}</Text>
                <Text style={styles.hijriPillEn}>{hijri.year} AH</Text>
              </View>
            </View>
          </View>

          <Animated.View style={{ opacity: headerOpacity, transform: [{ translateY: headerSlide }] }}>
            <NextPrayerCountdown prayerTimes={prayerTimes} />

            {/* Method + Notification row */}
            <View style={styles.heroActions}>
              <TouchableOpacity style={styles.methodBtn} onPress={() => setMethodPickerOpen(true)} activeOpacity={0.75}>
                <Ionicons name="calculator-outline" size={12} color="rgba(255,255,255,0.5)" />
                <Text style={styles.methodBtnText} numberOfLines={1}>{methodLabel}</Text>
                <Ionicons name="chevron-down" size={11} color="rgba(255,255,255,0.35)" />
              </TouchableOpacity>
              {enabledPrayers.size === 0 && (
                <TouchableOpacity style={styles.enableAllBtn} onPress={handleEnableAll} activeOpacity={0.85}>
                  <Ionicons name="notifications" size={13} color={colors.navy[900]} />
                  <Text style={styles.enableAllLabel}>Reminders</Text>
                </TouchableOpacity>
              )}
            </View>
          </Animated.View>
        </LinearGradient>

        {/* ── Prayer Times ── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="time" size={14} color="#4ADE80" />
            <Text style={[styles.sectionTitle, { color: textPrimary }]}>Prayer Times</Text>
            <TouchableOpacity
              onPress={enabledPrayers.size === PRAYER_NAMES.length ? handleDisableAll : handleEnableAll}
              style={[styles.allToggleBtn, { borderColor: border }]}
              activeOpacity={0.75}
            >
              <Ionicons
                name={enabledPrayers.size === PRAYER_NAMES.length ? 'notifications' : 'notifications-outline'}
                size={12}
                color={enabledPrayers.size === PRAYER_NAMES.length ? colors.gold[600] : textSecondary}
              />
              <Text style={[styles.allToggleBtnText, { color: enabledPrayers.size === PRAYER_NAMES.length ? colors.gold[600] : textSecondary }]}>
                {enabledPrayers.size === PRAYER_NAMES.length ? 'Mute all' : 'Notify all'}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={[styles.prayerGroup, { backgroundColor: surface, borderColor: border }]}>
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
                {index < PRAYER_NAMES.length - 1 && <View style={[styles.rowDivider, { backgroundColor: border }]} />}
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
              <Image source={require('../../../assets/images/kabba.png')} style={{ width: 18, height: 18 }} resizeMode="contain" />
              <Text style={[styles.sectionTitle, { color: textPrimary }]}>{t('prayer.qibla')}</Text>
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

  hero: { paddingTop: 48, paddingBottom: spacing.xl, paddingHorizontal: spacing.lg, overflow: 'hidden', marginBottom: spacing.sm },
  heroBgImage: { position: 'absolute', right: 0, bottom: 0, width: '100%', height: '130%', opacity: 0.35 },
  heroScrim: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(6,12,31,0.5)' },
  heroDecor1: { position: 'absolute', right: -50, top: -50, width: 180, height: 180, borderRadius: 90, borderWidth: 1, borderColor: 'rgba(74,222,128,0.12)' },
  heroDecor2: { position: 'absolute', left: -40, bottom: -50, width: 160, height: 160, borderRadius: 80, borderWidth: 1, borderColor: 'rgba(74,222,128,0.06)' },
  heroNavRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.md },
  heroPillsRow: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: spacing.xs, flexWrap: 'wrap' },
  locationPill: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(74,222,128,0.12)', borderRadius: radius.pill, paddingHorizontal: spacing.sm, paddingVertical: 4, borderWidth: 1, borderColor: 'rgba(74,222,128,0.22)' },
  locationText: { fontSize: 11, color: '#4ADE80', fontWeight: '700', maxWidth: 120 },
  datePill: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(255,255,255,0.07)', borderRadius: radius.pill, paddingHorizontal: spacing.sm, paddingVertical: 4, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  datePillText: { fontSize: 10, color: 'rgba(255,255,255,0.45)', fontWeight: '500' },
  hijriPill: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: 'rgba(212,169,62,0.12)', borderRadius: radius.pill, paddingHorizontal: spacing.sm, paddingVertical: 4, borderWidth: 1, borderColor: 'rgba(212,169,62,0.22)' },
  hijriPillAr: { fontSize: 11, color: colors.gold[300] },
  hijriPillEn: { fontSize: 10, color: 'rgba(255,255,255,0.35)', fontWeight: '500' },
  heroActions: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.sm, flexWrap: 'wrap' },
  methodBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: radius.pill,
    paddingHorizontal: spacing.sm, paddingVertical: 5,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)',
    maxWidth: 200,
  },
  methodBtnText: { fontSize: 11, color: 'rgba(255,255,255,0.5)', fontWeight: '500', flex: 1 },
  enableAllBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(74,222,128,0.18)', borderRadius: radius.pill, paddingVertical: 5, paddingHorizontal: spacing.md, borderWidth: 1, borderColor: 'rgba(74,222,128,0.35)' },
  enableAllLabel: { fontSize: 12, color: '#4ADE80', fontWeight: '700' },

  section: { paddingHorizontal: spacing.lg, marginBottom: spacing.xl },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.md },
  sectionTitle: { ...typography.heading, flex: 1 },
  nextBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(74,222,128,0.12)', borderRadius: radius.pill, paddingHorizontal: spacing.sm, paddingVertical: 3, borderWidth: 1, borderColor: 'rgba(74,222,128,0.25)' },
  nextDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: '#4ADE80' },
  nextText: { fontSize: 11, color: '#4ADE80', fontWeight: '700' },

  prayerGroup: { borderRadius: radius.lg, overflow: 'hidden', ...shadow.md, borderWidth: 1 },
  rowDivider: { height: 1, backgroundColor: colors.parchment[100], marginLeft: spacing.lg },
  sunriseRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, justifyContent: 'center', marginTop: spacing.md },
  sunriseMeta: { ...typography.caption, color: colors.parchment[500] },

  qiblaCard: { backgroundColor: colors.navy[900], borderRadius: radius.md, overflow: 'hidden', ...shadow.navy },

  allToggleBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: 5, borderWidth: 1 },
  allToggleBtnText: { fontSize: 12, fontWeight: '600' },

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
