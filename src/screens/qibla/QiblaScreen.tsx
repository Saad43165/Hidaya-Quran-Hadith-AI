import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Image,
  Linking,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useThemeStore } from '../../store/useThemeStore';
import { darkColors } from '../../theme/darkColors';
import { colors, radius, shadow, spacing } from '../../theme';
import { BackButton } from '../../components/common/BackButton';

// ─── Mecca coordinates ───────────────────────────────────────────────────────
const MECCA_LAT = 21.4225;
const MECCA_LON = 39.8262;
const GOLD = colors.gold[500];
const GOLD_LIGHT = colors.gold[400];

// ─── Helpers ─────────────────────────────────────────────────────────────────
function getBearing(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;
  const x = Math.sin(Δλ) * Math.cos(φ2);
  const y = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
  return ((Math.atan2(x, y) * 180 / Math.PI) + 360) % 360;
}

function getDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const dφ = (lat2 - lat1) * Math.PI / 180;
  const dλ = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dφ / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(dλ / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function compassDir(deg: number): string {
  const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  return dirs[Math.round(((deg % 360) + 360) % 360 / 45) % 8];
}

// ─── Types ───────────────────────────────────────────────────────────────────
type ScreenState = 'loading' | 'permission-denied' | 'sensor-unavailable' | 'active';

interface LocationInfo {
  city: string;
  country: string;
  latitude: number;
  longitude: number;
}

// ─── Tick marks (no SVG) ─────────────────────────────────────────────────────
function TickMark({ deg, center, outerR }: { deg: number; center: number; outerR: number }) {
  const isMajor = deg % 45 === 0;
  const is22 = deg % 22.5 === 0 && !isMajor;
  const tickLen = isMajor ? 12 : is22 ? 7 : 4;
  const rad = (deg - 90) * (Math.PI / 180);
  const r1 = outerR - 4;
  const r2 = r1 - tickLen;
  const x2 = center + r2 * Math.cos(rad);
  const y2 = center + r2 * Math.sin(rad);
  const dx = (r2 - r1) * Math.cos(rad) * -1;
  const dy = (r2 - r1) * Math.sin(rad) * -1;
  const length = Math.sqrt(dx * dx + dy * dy);
  const angle = Math.atan2(dy, dx) * 180 / Math.PI;
  return (
    <View
      pointerEvents="none"
      style={{
        position: 'absolute',
        left: x2,
        top: y2,
        width: length,
        height: isMajor ? 2.5 : is22 ? 1.5 : 1,
        backgroundColor: isMajor ? GOLD : is22 ? 'rgba(212,169,62,0.45)' : 'rgba(212,169,62,0.2)',
        transformOrigin: '0 50%',
        transform: [{ rotate: `${angle}deg` }],
      }}
    />
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export function QiblaScreen() {
  const isDark = useThemeStore(s => s.isDark);

  const bg = isDark ? darkColors.background : colors.parchment[50];
  const border = isDark ? darkColors.border : 'rgba(11,19,48,0.10)';
  const textPrimary = isDark ? darkColors.text.primary : colors.navy[900];
  const textSecondary = isDark ? darkColors.text.secondary : colors.parchment[600];
  const textMuted = isDark ? darkColors.text.muted : colors.parchment[500];
  const cardBg = isDark ? darkColors.surfaceElevated : colors.white;

  const [screenState, setScreenState] = useState<ScreenState>('loading');
  const [locationInfo, setLocationInfo] = useState<LocationInfo | null>(null);
  const [heading, setHeading] = useState(0);       // degrees from true/magnetic north (clockwise)
  const [bearing, setBearing] = useState(0);        // bearing from user to Mecca
  const [distanceKm, setDistanceKm] = useState(0);
  const [accuracy, setAccuracy] = useState<number | null>(null);

  // Animated needle: rotates the arrow so it points at Qibla
  const needleAnim = useRef(new Animated.Value(0)).current;
  const prevNeedleRef = useRef(0);

  // Heading subscription
  const headingSubRef = useRef<Location.LocationSubscription | null>(null);

  // ── Fetch location + start heading watcher ────────────────────────────────
  const fetchLocation = useCallback(async () => {
    setScreenState('loading');
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setScreenState('permission-denied');
        return;
      }

      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const { latitude, longitude } = pos.coords;

      let city = '';
      let country = '';
      try {
        const geo = await Location.reverseGeocodeAsync({ latitude, longitude });
        if (geo.length > 0) {
          city = geo[0].city ?? geo[0].subregion ?? geo[0].region ?? '';
          country = geo[0].country ?? '';
        }
      } catch { /* non-fatal */ }

      const dist = getDistanceKm(latitude, longitude, MECCA_LAT, MECCA_LON);
      const bear = getBearing(latitude, longitude, MECCA_LAT, MECCA_LON);

      setDistanceKm(dist);
      setBearing(bear);
      setLocationInfo({ city, country, latitude, longitude });
      setScreenState('active');
    } catch {
      setScreenState('permission-denied');
    }
  }, []);

  // ── Watch device heading using Location.watchHeadingAsync ─────────────────
  // This API uses the OS-level compass (handles Android tilt compensation +
  // declination automatically), giving accurate results without raw magnetometer math.
  useEffect(() => {
    if (screenState !== 'active') return;

    let mounted = true;
    let sub: Location.LocationSubscription | null = null;

    (async () => {
      try {
        sub = await Location.watchHeadingAsync((headingData) => {
          if (!mounted) return;
          // trueHeading is -1 when unavailable; fall back to magHeading
          const h = headingData.trueHeading >= 0
            ? headingData.trueHeading
            : headingData.magHeading;
          setHeading(h);
          setAccuracy(headingData.accuracy ?? null);
        });
        headingSubRef.current = sub;
      } catch {
        setScreenState('sensor-unavailable');
      }
    })();

    return () => {
      mounted = false;
      sub?.remove();
    };
  }, [screenState]);

  // ── Animate compass needle (the whole disc rotates, fixed arrow at top) ───
  useEffect(() => {
    if (screenState !== 'active') return;

    // We rotate the compass DISC by -heading so it stays fixed relative to North.
    // The Qibla arrow is at the bearing position on the disc → it naturally points
    // toward Qibla as the user rotates.
    // Alternatively: rotate the needle = bearing - heading
    const qiblaAngle = (bearing - heading + 360) % 360;

    let prev = prevNeedleRef.current;
    let delta = qiblaAngle - prev;
    if (delta > 180) delta -= 360;
    if (delta < -180) delta += 360;
    const target = prev + delta;
    prevNeedleRef.current = target;

    Animated.spring(needleAnim, {
      toValue: target,
      useNativeDriver: true,
      tension: 50,
      friction: 10,
    }).start();
  }, [bearing, heading, screenState]);

  useEffect(() => {
    fetchLocation();
    return () => { headingSubRef.current?.remove(); };
  }, []);

  const needleRotate = needleAnim.interpolate({
    inputRange: [-1080, -720, -360, 0, 360, 720, 1080],
    outputRange: ['-1080deg', '-720deg', '-360deg', '0deg', '360deg', '720deg', '1080deg'],
  });

  // Disc rotates opposite to heading, keeping North fixed at top
  const discAnim = useRef(new Animated.Value(0)).current;
  const prevDiscRef = useRef(0);

  useEffect(() => {
    if (screenState !== 'active') return;
    // Rotate disc by -heading to make it "north-up"
    const target_disc = -heading;
    let prev = prevDiscRef.current;
    let delta = target_disc - prev;
    if (delta > 180) delta -= 360;
    if (delta < -180) delta += 360;
    const target = prev + delta;
    prevDiscRef.current = target;

    Animated.spring(discAnim, {
      toValue: target,
      useNativeDriver: true,
      tension: 50,
      friction: 10,
    }).start();
  }, [heading, screenState]);

  const discRotate = discAnim.interpolate({
    inputRange: [-1080, -720, -360, 0, 360, 720, 1080],
    outputRange: ['-1080deg', '-720deg', '-360deg', '0deg', '360deg', '720deg', '1080deg'],
  });

  // ─── Header ───────────────────────────────────────────────────────────────
  const renderHeader = () => (
    <LinearGradient colors={['#060C1F', '#0B2238', '#0B1330']} style={styles.header}>
      <Image source={require('../../../assets/images/mosque.png')} style={styles.headerBgFull} resizeMode="cover" />
      <View style={styles.headerScrim} />
      <Image source={require('../../../assets/images/kabba.png')} style={styles.headerBgImage} resizeMode="contain" />
      <StatusBar barStyle="light-content" backgroundColor="#060C1F" translucent={false} />
      <View style={styles.headerRow}>
        <BackButton color={GOLD_LIGHT} />
        <View style={styles.headerCenter}>
          <Text style={[styles.headerAr, { fontFamily: 'Amiri_400Regular' }]}>اتجاه القبلة</Text>
          <Text style={styles.headerTitle}>Qibla Direction</Text>
          <Text style={styles.headerSub}>Direction of the Kaaba · Mecca</Text>
        </View>
        <TouchableOpacity
          style={styles.refreshBtn}
          onPress={fetchLocation}
          activeOpacity={0.75}
        >
          <Ionicons name="refresh-outline" size={20} color={GOLD_LIGHT} />
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );

  // ─── Loading ──────────────────────────────────────────────────────────────
  if (screenState === 'loading') {
    return (
      <View style={[styles.root, { backgroundColor: bg }]}>
        {renderHeader()}
        <View style={styles.centered}>
          <View style={[styles.stateIconRing, { borderColor: GOLD }]}>
            <Ionicons name="compass-outline" size={44} color={GOLD} />
          </View>
          <Text style={[styles.stateTitle, { color: textPrimary }]}>Finding your location…</Text>
          <Text style={[styles.stateBody, { color: textSecondary }]}>
            Getting GPS position and starting the compass sensor.
          </Text>
        </View>
      </View>
    );
  }

  // ─── Permission denied ────────────────────────────────────────────────────
  if (screenState === 'permission-denied') {
    return (
      <View style={[styles.root, { backgroundColor: bg }]}>
        {renderHeader()}
        <View style={styles.centered}>
          <Ionicons name="location-outline" size={52} color={GOLD} />
          <Text style={[styles.stateTitle, { color: textPrimary }]}>Location Access Needed</Text>
          <Text style={[styles.stateBody, { color: textSecondary }]}>
            The Qibla compass requires your GPS location to determine the accurate direction of Masjid al-Haram.
          </Text>
          <TouchableOpacity style={[styles.actionBtn, { backgroundColor: GOLD }]} onPress={() => Linking.openSettings()}>
            <Text style={styles.actionBtnText}>Open Settings</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.retryLink} onPress={fetchLocation}>
            <Text style={[styles.retryText, { color: GOLD }]}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ─── Sensor unavailable ───────────────────────────────────────────────────
  if (screenState === 'sensor-unavailable') {
    return (
      <View style={[styles.root, { backgroundColor: bg }]}>
        {renderHeader()}
        <View style={styles.centered}>
          <Ionicons name="compass-outline" size={52} color={colors.parchment[400]} />
          <Text style={[styles.stateTitle, { color: textPrimary }]}>Compass Not Available</Text>
          <Text style={[styles.stateBody, { color: textSecondary }]}>
            Your device does not have a compass sensor. Use the bearing below to find the Qibla manually.
          </Text>
          {locationInfo && (
            <View style={[styles.fallbackCard, { backgroundColor: cardBg, borderColor: border }]}>
              <Text style={[styles.fallbackLabel, { color: textSecondary }]}>Bearing to Mecca from {locationInfo.city || 'your location'}</Text>
              <Text style={[styles.fallbackValue, { color: GOLD }]}>{Math.round(bearing)}° {compassDir(bearing)}</Text>
              <View style={styles.fallbackDivider} />
              <Text style={[styles.fallbackLabel, { color: textSecondary }]}>Distance</Text>
              <Text style={[styles.fallbackValue, { color: textPrimary }]}>
                {Math.round(distanceKm).toLocaleString()} km
              </Text>
            </View>
          )}
        </View>
      </View>
    );
  }

  // ─── Active compass ───────────────────────────────────────────────────────
  const compassSize = 270;
  const center = compassSize / 2;
  const outerR = center - 4;
  const innerR = outerR - 32;

  const qiblaAngle = (bearing - heading + 360) % 360;
  const isAligned = qiblaAngle <= 5 || qiblaAngle >= 355;

  const cardinals: { label: string; angle: number; color: string }[] = [
    { label: 'N', angle: 0, color: '#EF4444' },
    { label: 'E', angle: 90, color: GOLD_LIGHT },
    { label: 'S', angle: 180, color: GOLD_LIGHT },
    { label: 'W', angle: 270, color: GOLD_LIGHT },
  ];

  return (
    <View style={[styles.root, { backgroundColor: bg }]}>
      {renderHeader()}

      <View style={styles.body}>

        {/* Location info strip */}
        {locationInfo && (
          <View style={[styles.locationStrip, { backgroundColor: cardBg, borderColor: border }]}>
            <Ionicons name="location" size={14} color={GOLD} />
            <Text style={[styles.locationText, { color: textSecondary }]} numberOfLines={1}>
              {locationInfo.city ? `${locationInfo.city}, ` : ''}{locationInfo.country}
            </Text>
            <View style={[styles.locationDivider, { backgroundColor: border }]} />
            <Ionicons name="navigate-outline" size={13} color={GOLD} />
            <Text style={[styles.locationText, { color: textSecondary }]}>
              {Math.round(distanceKm).toLocaleString()} km
            </Text>
            {accuracy !== null && (
              <>
                <View style={[styles.locationDivider, { backgroundColor: border }]} />
                <View style={[styles.accuracyDot, { backgroundColor: accuracy <= 1 ? '#4ADE80' : accuracy <= 2 ? '#F59E0B' : '#EF4444' }]} />
                <Text style={[styles.locationText, { color: textMuted }]}>
                  {accuracy <= 1 ? 'High accuracy' : accuracy <= 2 ? 'Medium' : 'Low accuracy'}
                </Text>
              </>
            )}
          </View>
        )}

        {/* ── Compass ─────────────────────────────────────────────────── */}
        <View style={styles.compassWrapper}>
          {/* Outer glow ring */}
          <View style={[
            styles.outerRing,
            {
              width: compassSize + 36,
              height: compassSize + 36,
              borderRadius: (compassSize + 36) / 2,
              borderColor: isAligned ? '#4ADE80' : GOLD,
              backgroundColor: isAligned ? 'rgba(74,222,128,0.06)' : 'rgba(212,169,62,0.04)',
            },
            isAligned ? { shadowColor: '#4ADE80', shadowOpacity: 0.5, shadowRadius: 18, elevation: 8 } : {},
          ]}>
            {/* Compass disc — rotates with device so N stays at top */}
            <Animated.View
              style={[
                styles.compassDisc,
                {
                  width: compassSize,
                  height: compassSize,
                  borderRadius: center,
                  backgroundColor: isDark ? '#0B1020' : colors.navy[900],
                  transform: [{ rotate: discRotate }],
                },
              ]}
            >
              {/* Tick marks */}
              {Array.from({ length: 120 }, (_, i) => i * 3).map(deg => (
                <TickMark key={deg} deg={deg} center={center} outerR={outerR} />
              ))}

              {/* Cardinal labels */}
              {cardinals.map(({ label, angle, color: lc }) => {
                const rad = (angle - 90) * (Math.PI / 180);
                const r = innerR;
                const lx = center + r * Math.cos(rad);
                const ly = center + r * Math.sin(rad);
                return (
                  <Text
                    key={label}
                    style={[
                      styles.cardinalLabel,
                      { left: lx - 12, top: ly - 12, color: lc, fontSize: label === 'N' ? 16 : 13 },
                    ]}
                  >
                    {label}
                  </Text>
                );
              })}

              {/* Inter-cardinals */}
              {[{ label: 'NE', angle: 45 }, { label: 'SE', angle: 135 }, { label: 'SW', angle: 225 }, { label: 'NW', angle: 315 }].map(({ label, angle }) => {
                const rad = (angle - 90) * (Math.PI / 180);
                const r = innerR - 8;
                const lx = center + r * Math.cos(rad);
                const ly = center + r * Math.sin(rad);
                return (
                  <Text key={label} style={[styles.interCardinalLabel, { left: lx - 10, top: ly - 8, color: 'rgba(212,169,62,0.4)' }]}>
                    {label}
                  </Text>
                );
              })}

              {/* Degree numbers at 30° intervals */}
              {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map(deg => {
                const rad = (deg - 90) * Math.PI / 180;
                const r = outerR - 22;
                const lx = center + r * Math.cos(rad);
                const ly = center + r * Math.sin(rad);
                return (
                  <Text key={deg} style={[styles.degreeLabel, { left: lx - 10, top: ly - 7, color: 'rgba(212,169,62,0.3)' }]}>
                    {deg}
                  </Text>
                );
              })}

              {/* Center medallion */}
              <View style={[styles.centerMedallion, { backgroundColor: isDark ? '#060C1F' : colors.navy[950], borderColor: GOLD }]}>
                <Text style={{ fontSize: 22 }}>🕋</Text>
              </View>
            </Animated.View>

            {/* Qibla needle — stays fixed, disc rotates under it */}
            <Animated.View
              pointerEvents="none"
              style={[
                StyleSheet.absoluteFill,
                { alignItems: 'center', justifyContent: 'center' },
                { transform: [{ rotate: needleRotate }] },
              ]}
            >
              {/* Needle shaft */}
              <View style={styles.needleShaft}>
                {/* Top (Qibla direction) — gold with crescent tip */}
                <View style={styles.needleTipWrap}>
                  <View style={[styles.needleTop, { borderBottomColor: GOLD }]} />
                  <View style={[styles.needleTipDot, { backgroundColor: GOLD }]} />
                </View>
                {/* Bottom */}
                <View style={[styles.needleBottom, { borderTopColor: 'rgba(212,169,62,0.15)' }]} />
              </View>
            </Animated.View>
          </View>

          {/* Angle + direction badge */}
          <View style={[styles.angleBadge, { backgroundColor: isDark ? darkColors.surfaceElevated : colors.navy[800] }]}>
            <Text style={[styles.angleDeg, { color: isAligned ? '#4ADE80' : GOLD }]}>
              {Math.round(bearing)}°
            </Text>
            <Text style={styles.angleLabel}>{compassDir(bearing)} of North</Text>
          </View>

          {isAligned && (
            <View style={styles.alignedBadge}>
              <Ionicons name="checkmark-circle" size={16} color="#4ADE80" />
              <Text style={styles.alignedText}>Facing the Qibla ✓</Text>
            </View>
          )}
        </View>

        {/* ── Info cards ──────────────────────────────────────────────── */}
        <View style={styles.infoRow}>
          <View style={[styles.infoCard, { backgroundColor: cardBg, borderColor: border }]}>
            <Text style={styles.infoIcon}>📍</Text>
            <Text style={[styles.infoValue, { color: textPrimary }]}>
              {Math.round(distanceKm).toLocaleString()}
            </Text>
            <Text style={[styles.infoLabel, { color: textSecondary }]}>km to Mecca</Text>
          </View>
          <View style={[styles.infoCard, { backgroundColor: cardBg, borderColor: border }]}>
            <Text style={styles.infoIcon}>🧭</Text>
            <Text style={[styles.infoValue, { color: textPrimary }]}>{Math.round(bearing)}°</Text>
            <Text style={[styles.infoLabel, { color: textSecondary }]}>Qibla bearing</Text>
          </View>
          <View style={[styles.infoCard, { backgroundColor: cardBg, borderColor: border }]}>
            <Text style={styles.infoIcon}>🌐</Text>
            <Text style={[styles.infoValue, { color: textPrimary }]} numberOfLines={1}>
              {locationInfo?.latitude?.toFixed(2)}°
            </Text>
            <Text style={[styles.infoLabel, { color: textSecondary }]}>latitude</Text>
          </View>
        </View>

        {/* ── Calibration tip ─────────────────────────────────────────── */}
        <View style={[styles.calibrationCard, { backgroundColor: isDark ? 'rgba(212,169,62,0.06)' : 'rgba(212,169,62,0.07)', borderColor: 'rgba(212,169,62,0.20)' }]}>
          <Ionicons name="information-circle-outline" size={18} color={GOLD} style={{ marginTop: 1 }} />
          <View style={{ flex: 1, gap: 4 }}>
            <Text style={[styles.calibrationTitle, { color: GOLD }]}>Tip: Improve accuracy</Text>
            <Text style={[styles.calibrationText, { color: textSecondary }]}>
              Wave your phone in a figure-8 pattern if the compass seems off. Hold your device flat and level. Keep away from metal objects.
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const PT = Platform.OS === 'ios' ? 54 : (StatusBar.currentHeight ?? 24) + 8;

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { paddingTop: PT, paddingBottom: spacing.lg, paddingHorizontal: spacing.lg, overflow: 'hidden' },
  headerBgFull: { position: 'absolute', top: -60, left: 0, right: 0, bottom: 0, width: '100%', opacity: 0.28 },
  headerScrim: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(6,12,31,0.40)' },
  headerBgImage: { position: 'absolute', right: -10, bottom: -10, width: 90, height: 90, opacity: 0.22 },
  headerRow: { flexDirection: 'row', alignItems: 'center' },
  headerCenter: { flex: 1, alignItems: 'center', gap: 2 },
  headerAr: { fontSize: 22, color: GOLD, lineHeight: 30 },
  headerTitle: { fontSize: 17, fontWeight: '700', color: colors.parchment[100], letterSpacing: 0.3 },
  headerSub: { fontSize: 11, color: 'rgba(244,241,236,0.45)', letterSpacing: 0.4 },
  refreshBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', borderRadius: radius.sm, backgroundColor: 'rgba(255,255,255,0.07)' },

  // State screens
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.xl, gap: spacing.lg },
  stateIconRing: { width: 96, height: 96, borderRadius: 48, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  stateTitle: { fontSize: 20, fontWeight: '700', textAlign: 'center', marginTop: spacing.sm },
  stateBody: { fontSize: 15, textAlign: 'center', lineHeight: 22 },
  actionBtn: { paddingVertical: spacing.md, paddingHorizontal: spacing.xxl, borderRadius: radius.pill, marginTop: spacing.sm },
  actionBtnText: { fontSize: 16, fontWeight: '700', color: colors.navy[950] },
  retryLink: { padding: spacing.sm },
  retryText: { fontSize: 15, fontWeight: '600' },
  fallbackCard: { width: '100%', padding: spacing.xl, borderRadius: radius.md, borderWidth: 1, alignItems: 'center', marginTop: spacing.lg },
  fallbackLabel: { fontSize: 12, textTransform: 'uppercase', letterSpacing: 1, textAlign: 'center' },
  fallbackValue: { fontSize: 28, fontWeight: '700', marginTop: 4 },
  fallbackDivider: { height: 1, width: '60%', backgroundColor: 'rgba(212,169,62,0.2)', marginVertical: spacing.md },

  // Active body
  body: { flex: 1, alignItems: 'center', paddingTop: spacing.md, paddingBottom: spacing.xl, paddingHorizontal: spacing.lg, gap: spacing.md },

  locationStrip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: spacing.md, paddingVertical: 8, borderRadius: radius.pill, borderWidth: 0.5, width: '100%', justifyContent: 'center' },
  locationText: { fontSize: 12, fontWeight: '600' },
  locationDivider: { width: 1, height: 14 },
  accuracyDot: { width: 7, height: 7, borderRadius: 4 },

  compassWrapper: { alignItems: 'center', gap: spacing.md },
  outerRing: { borderWidth: 2, alignItems: 'center', justifyContent: 'center', padding: 16 },
  compassDisc: { position: 'relative', overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  cardinalLabel: { position: 'absolute', width: 24, height: 24, textAlign: 'center', textAlignVertical: 'center', lineHeight: 24, fontWeight: '800', letterSpacing: 0.5 },
  interCardinalLabel: { position: 'absolute', width: 20, height: 16, textAlign: 'center', fontSize: 9, fontWeight: '600' },
  degreeLabel: { position: 'absolute', width: 20, height: 14, textAlign: 'center', fontSize: 8, fontWeight: '500' },

  needleShaft: { alignItems: 'center' },
  needleTipWrap: { alignItems: 'center' },
  needleTop: { width: 0, height: 0, borderLeftWidth: 8, borderRightWidth: 8, borderBottomWidth: 72, borderLeftColor: 'transparent', borderRightColor: 'transparent' },
  needleTipDot: { width: 10, height: 10, borderRadius: 5, marginTop: -5 },
  needleBottom: { width: 0, height: 0, borderLeftWidth: 8, borderRightWidth: 8, borderTopWidth: 54, borderLeftColor: 'transparent', borderRightColor: 'transparent' },

  centerMedallion: { position: 'absolute', width: 54, height: 54, borderRadius: 27, borderWidth: 2, alignItems: 'center', justifyContent: 'center', shadowColor: GOLD, shadowOpacity: 0.5, shadowRadius: 8, elevation: 5 },

  angleBadge: { paddingVertical: spacing.sm, paddingHorizontal: spacing.xl, borderRadius: radius.pill, alignItems: 'center' },
  angleDeg: { fontSize: 28, fontWeight: '800', letterSpacing: -0.5 },
  angleLabel: { fontSize: 11, color: 'rgba(244,241,236,0.45)', textTransform: 'uppercase', letterSpacing: 1, marginTop: 1 },
  alignedBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(74,222,128,0.15)', borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: 6, borderWidth: 1, borderColor: 'rgba(74,222,128,0.3)' },
  alignedText: { fontSize: 13, fontWeight: '700', color: '#4ADE80' },

  infoRow: { flexDirection: 'row', gap: spacing.sm, width: '100%' },
  infoCard: { flex: 1, borderWidth: 1, borderRadius: radius.md, paddingVertical: spacing.md, paddingHorizontal: spacing.sm, alignItems: 'center', gap: 2 },
  infoIcon: { fontSize: 18, marginBottom: 2 },
  infoValue: { fontSize: 16, fontWeight: '700' },
  infoLabel: { fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.4, textAlign: 'center' },

  calibrationCard: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm, width: '100%', padding: spacing.lg, borderRadius: radius.md, borderWidth: 1 },
  calibrationTitle: { fontSize: 12, fontWeight: '700', letterSpacing: 0.3 },
  calibrationText: { fontSize: 12, lineHeight: 18 },
});
