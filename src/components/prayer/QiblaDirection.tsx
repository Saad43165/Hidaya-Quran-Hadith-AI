import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography } from '../../theme';

const MECCA_LAT = 21.4225;
const MECCA_LNG = 39.8262;

function toRad(d: number) { return (d * Math.PI) / 180; }
function toDeg(r: number) { return (r * 180) / Math.PI; }

export function calculateQibla(lat: number, lng: number): number {
  const dLng = toRad(MECCA_LNG - lng);
  const lat1 = toRad(lat);
  const lat2 = toRad(MECCA_LAT);
  const y = Math.sin(dLng) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);
  return (toDeg(Math.atan2(y, x)) + 360) % 360;
}

interface Props { latitude: number; longitude: number; }

export function QiblaDirection({ latitude, longitude }: Props) {
  const { t } = useTranslation();
  const [deviceHeading, setDeviceHeading] = useState<number | null>(null);
  const [sensorAvailable, setSensorAvailable] = useState(false);
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const qiblaBearing = calculateQibla(latitude, longitude);
  const roundedBearing = Math.round(qiblaBearing);

  useEffect(() => {
    let sub: { remove: () => void } | null = null;
    // Lazy-load expo-sensors to avoid crash if module not linked
    Promise.resolve().then(async () => {
      try {
        const { Magnetometer } = await import('expo-sensors');
        const avail = await Magnetometer.isAvailableAsync();
        if (!avail) return;
        setSensorAvailable(true);
        Magnetometer.setUpdateInterval(150);
        sub = Magnetometer.addListener(({ x, y }) => {
          let h = toDeg(Math.atan2(y, x));
          if (h < 0) h += 360;
          setDeviceHeading(h);
        });
      } catch (e) {
        console.warn('[KitaabAI] Magnetometer unavailable:', e);
      }
    });
    return () => { try { sub?.remove(); } catch {} };
  }, []);

  useEffect(() => {
    if (deviceHeading === null) return;
    const angle = qiblaBearing - deviceHeading;
    Animated.timing(rotateAnim, {
      toValue: angle,
      duration: 200,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start();
  }, [deviceHeading, qiblaBearing, rotateAnim]);

  const rotate = rotateAnim.interpolate({
    inputRange: [-360, 360],
    outputRange: ['360deg', '-360deg'],
  });

  const DIRS = [
    { d: 'N', deg: 0 }, { d: 'E', deg: 90 },
    { d: 'S', deg: 180 }, { d: 'W', deg: 270 },
  ];

  const dialRotation = sensorAvailable && deviceHeading !== null ? rotate : '0deg';

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{t('prayer.qibla')}</Text>

      {/* Fixed top indicator */}
      <Ionicons name="caret-down" size={24} color={colors.gold[500]} style={{ marginBottom: -15, zIndex: 10 }} />

      <View style={styles.compassOuter}>
        {/* Rotating Dial */}
        <Animated.View style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center', transform: [{ rotate: dialRotation }] }]}>
          {DIRS.map(({ d, deg }) => (
            <Text key={d} style={[styles.cardinal, {
              transform: [
                { rotate: `${deg}deg` },
                { translateY: -64 },
                { rotate: `-${deg}deg` },
              ],
            }]}>{d}</Text>
          ))}
          {/* Kaaba marker placed on the dial at qiblaBearing */}
          <View style={[styles.kaabaMarker, { transform: [{ rotate: `${roundedBearing}deg` }, { translateY: -64 }] }]}>
            <Text style={styles.kaabaEmoji}>🕋</Text>
          </View>

          {/* Compass ring details */}
          {Array.from({ length: 24 }).map((_, i) => (
            <View key={i} style={[styles.tickMarker, { transform: [{ rotate: `${i * 15}deg` }, { translateY: -76 }] }]} />
          ))}
        </Animated.View>

        {/* Center fixed needle (optional, or just center dot) */}
        <View style={styles.centerOuter}>
          <View style={styles.centerInner} />
        </View>
      </View>

      <Text style={styles.bearing}>{roundedBearing}°</Text>
      <Text style={styles.caption}>{t('prayer.fromNorth')} · {t('prayer.towardMecca')}</Text>
      {sensorAvailable && deviceHeading === null && (
        <Text style={styles.hint}>Move device in figure-8 to calibrate</Text>
      )}
      {!sensorAvailable && (
        <Text style={styles.hint}>Compass sensor unavailable — showing calculated bearing</Text>
      )}
    </View>
  );
}

const SIZE = 180;

const styles = StyleSheet.create({
  container: { alignItems: 'center', paddingVertical: spacing.xl, gap: spacing.md },
  label: { ...typography.label, color: colors.gold[400] },
  compassOuter: {
    width: SIZE, height: SIZE, borderRadius: SIZE / 2,
    borderWidth: 3, borderColor: 'rgba(212,169,62,0.5)',
    backgroundColor: 'rgba(11,19,48,0.9)',
    alignItems: 'center', justifyContent: 'center',
    position: 'relative',
    shadowColor: colors.gold[500],
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
  },
  cardinal: {
    position: 'absolute', color: colors.parchment[300],
    fontSize: 14, fontWeight: '800',
  },
  tickMarker: {
    position: 'absolute', width: 2, height: 6,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 1,
  },
  kaabaMarker: {
    position: 'absolute',
    alignItems: 'center', justifyContent: 'center',
  },
  kaabaEmoji: { fontSize: 22, marginTop: -6 },
  centerOuter: {
    position: 'absolute', width: 16, height: 16, borderRadius: 8,
    backgroundColor: 'rgba(212,169,62,0.3)',
    alignItems: 'center', justifyContent: 'center',
  },
  centerInner: {
    width: 6, height: 6, borderRadius: 3,
    backgroundColor: colors.gold[400],
  },
  bearing: { ...typography.displayMd, color: colors.white, marginTop: spacing.sm },
  caption: { ...typography.caption, color: colors.parchment[400] },
  hint: { ...typography.caption, color: colors.semantic.warning, textAlign: 'center', maxWidth: 220 },
});
