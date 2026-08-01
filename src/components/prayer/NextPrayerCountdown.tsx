import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PrayerName, PrayerTimes, PRAYER_NAMES } from '../../types/models';
import { colors, radius, spacing, typography } from '../../theme';

const PRAYER_ARABIC: Record<PrayerName, string> = {
  Fajr: 'الفجر', Dhuhr: 'الظهر', Asr: 'العصر', Maghrib: 'المغرب', Isha: 'العشاء',
};

function parseMinutes(t: string) {
  const m = t.match(/^(\d{1,2}):(\d{2})/);
  return m ? parseInt(m[1]) * 60 + parseInt(m[2]) : -1;
}

function fmtCountdown(total: number) {
  const h = Math.floor(total / 60);
  const m = total % 60;
  if (h > 0) return { h: String(h).padStart(2, '0'), m: String(m).padStart(2, '0'), s: '00' };
  return { h: '00', m: String(m).padStart(2, '0'), s: '00' };
}

export function NextPrayerCountdown({ prayerTimes }: { prayerTimes: PrayerTimes }) {
  const [now, setNow] = useState(new Date());
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim  = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    // Fade in on mount
    Animated.timing(fadeAnim, {
      toValue: 1, duration: 600, useNativeDriver: true,
      easing: Easing.out(Easing.cubic),
    }).start();

    // Pulse ring
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.06, duration: 1800, useNativeDriver: true, easing: Easing.inOut(Easing.sin) }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1800, useNativeDriver: true, easing: Easing.inOut(Easing.sin) }),
      ])
    ).start();
  }, []);

  const nowMins = now.getHours() * 60 + now.getMinutes();
  let next: PrayerName = 'Fajr', mins = 0;
  for (const p of PRAYER_NAMES) {
    const pm = parseMinutes(prayerTimes[p]);
    if (pm > nowMins) { next = p; mins = pm - nowMins; break; }
  }
  if (!mins) { mins = 1440 - nowMins + parseMinutes(prayerTimes.Fajr); }

  const { h, m } = fmtCountdown(mins);
  const displayTime = prayerTimes[next].replace(/ \(.*\)/, '');

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      {/* Glow ring */}
      <Animated.View style={[styles.glowRing, { transform: [{ scale: pulseAnim }] }]} />

      <Text style={styles.nextLabel}>NEXT PRAYER</Text>

      <Text style={[styles.prayerName]}>{next}</Text>
      <Text style={[styles.prayerArabic, { fontFamily: 'Amiri_400Regular' }]}>
        {PRAYER_ARABIC[next]}
      </Text>

      {/* Countdown blocks */}
      <View style={styles.countdownRow}>
        <View style={styles.countdownBlock}>
          <Text style={styles.countdownNum}>{h}</Text>
          <Text style={styles.countdownUnit}>HRS</Text>
        </View>
        <Text style={styles.countdownColon}>:</Text>
        <View style={styles.countdownBlock}>
          <Text style={styles.countdownNum}>{m}</Text>
          <Text style={styles.countdownUnit}>MIN</Text>
        </View>
      </View>

      <View style={styles.timeRow}>
        <Ionicons name="time-outline" size={13} color="rgba(255,255,255,0.4)" />
        <Text style={styles.timeText}>{displayTime}</Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    gap: spacing.sm,
  },
  glowRing: {
    position: 'absolute',
    top: '50%',
    width: 180,
    height: 180,
    marginTop: -90,
    borderRadius: 90,
    borderWidth: 1,
    borderColor: 'rgba(82,214,138,0.2)',
    backgroundColor: 'transparent',
  },
  nextLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 2.5,
    color: '#52D68A',
  },
  prayerName: {
    ...typography.displayXl,
    color: colors.white,
    letterSpacing: 1,
  },
  prayerArabic: {
    fontSize: 18,
    color: 'rgba(255,255,255,0.45)',
    lineHeight: 28,
    marginTop: -4,
  },
  countdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  countdownBlock: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    alignItems: 'center',
    minWidth: 72,
  },
  countdownNum: {
    fontSize: 36,
    fontWeight: '800',
    color: colors.gold[300],
    letterSpacing: 2,
    fontVariant: ['tabular-nums'],
  },
  countdownUnit: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 2,
    color: 'rgba(255,255,255,0.35)',
    marginTop: 2,
  },
  countdownColon: {
    fontSize: 30,
    fontWeight: '800',
    color: 'rgba(255,255,255,0.3)',
    marginBottom: 12,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: spacing.xs,
  },
  timeText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.4)',
    fontWeight: '500',
    fontVariant: ['tabular-nums'],
  },
});
