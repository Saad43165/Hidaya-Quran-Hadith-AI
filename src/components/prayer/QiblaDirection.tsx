import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
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
    inputRange: [-720, 720],
    outputRange: ['-720deg', '720deg'],
  });

  const DIRS = [
    { d: 'N', deg: 0 }, { d: 'E', deg: 90 },
    { d: 'S', deg: 180 }, { d: 'W', deg: 270 },
  ];

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{t('prayer.qibla')}</Text>

      <View style={styles.compassOuter}>
        {DIRS.map(({ d, deg }) => (
          <Text key={d} style={[styles.cardinal, {
            transform: [
              { rotate: `${deg}deg` },
              { translateY: -62 },
              { rotate: `-${deg}deg` },
            ],
          }]}>{d}</Text>
        ))}

        <Animated.View style={[styles.needleWrap, { transform: [{ rotate: sensorAvailable && deviceHeading !== null ? rotate : `${roundedBearing}deg` }] }]}>
          <View style={styles.needleTip} />
          <View style={styles.needleTail} />
        </Animated.View>
        <View style={styles.center} />
        <Text style={styles.kaabaEmoji}>🕋</Text>
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

const SIZE = 160;

const styles = StyleSheet.create({
  container: { alignItems: 'center', paddingVertical: spacing.xl, gap: spacing.md },
  label: { ...typography.label, color: colors.gold[400] },
  compassOuter: {
    width: SIZE, height: SIZE, borderRadius: SIZE / 2,
    borderWidth: 2, borderColor: colors.gold[600],
    backgroundColor: 'rgba(11,19,48,0.8)',
    alignItems: 'center', justifyContent: 'center',
    position: 'relative',
  },
  cardinal: {
    position: 'absolute', color: colors.parchment[400],
    fontSize: 11, fontWeight: '700',
  },
  needleWrap: {
    position: 'absolute', alignItems: 'center',
    height: SIZE * 0.7, justifyContent: 'center',
  },
  needleTip: { width: 4, height: SIZE * 0.3, backgroundColor: colors.gold[500], borderRadius: 2 },
  needleTail: { width: 4, height: SIZE * 0.17, backgroundColor: colors.parchment[600], borderRadius: 2 },
  center: { position: 'absolute', width: 10, height: 10, borderRadius: 5, backgroundColor: colors.gold[400] },
  kaabaEmoji: { position: 'absolute', top: -14, fontSize: 16 },
  bearing: { ...typography.displayMd, color: colors.white },
  caption: { ...typography.caption, color: colors.parchment[400] },
  hint: { ...typography.caption, color: colors.semantic.warning, textAlign: 'center', maxWidth: 220 },
});
