import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, Switch, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { PrayerName } from '../../types/models';
import { Haptics } from '../../services/haptics';
import { useThemeStore } from '../../store/useThemeStore';
import { darkColors } from '../../theme/darkColors';
import { colors, radius, spacing, typography } from '../../theme';

const ARABIC_NAMES: Record<PrayerName, string> = {
  Fajr: 'الفجر', Dhuhr: 'الظهر', Asr: 'العصر', Maghrib: 'المغرب', Isha: 'العشاء',
};

// Professional icon config per prayer (no emojis)
const PRAYER_CONFIG: Record<PrayerName, { icon: keyof typeof Ionicons.glyphMap; color: string; bg: string }> = {
  Fajr:    { icon: 'partly-sunny-outline',  color: '#F97316', bg: 'rgba(249,115,22,0.15)'   },
  Dhuhr:   { icon: 'sunny',                 color: '#EAB308', bg: 'rgba(234,179,8,0.15)'    },
  Asr:     { icon: 'partly-sunny',          color: '#3B82F6', bg: 'rgba(59,130,246,0.15)'   },
  Maghrib: { icon: 'cloudy-night-outline',  color: '#EC4899', bg: 'rgba(236,72,153,0.15)'   },
  Isha:    { icon: 'moon',                  color: '#8B5CF6', bg: 'rgba(139,92,246,0.15)'   },
};

interface Props {
  name: PrayerName;
  time: string;
  isNext: boolean;
  isCurrent?: boolean;
  minutesUntil?: number;
  notificationsEnabled: boolean;
  onToggleNotification: (v: boolean) => void;
}

export function PrayerTimeRow({ name, time, isNext, isCurrent, minutesUntil, notificationsEnabled, onToggleNotification }: Props) {
  const isDark = useThemeStore(s => s.isDark);
  const displayTime = time.replace(/ \(.*\)/, '');
  const handleToggle = (v: boolean) => { Haptics.impact('light'); onToggleNotification(v); };
  const cfg = PRAYER_CONFIG[name];
  const rowBg = isDark ? darkColors.surface : colors.white;
  const nameTxt = isDark ? darkColors.text.primary : colors.parchment[950];
  const arabicTxt = isDark ? darkColors.text.secondary : colors.parchment[500];
  const timeTxt = isDark ? darkColors.text.primary : colors.navy[700];
  const currentBorder = isDark ? 'rgba(245,158,11,0.6)' : colors.gold[500];
  const slideAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.97)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 1, duration: 350, useNativeDriver: true,
        easing: Easing.out(Easing.cubic),
      }),
      Animated.spring(scaleAnim, {
        toValue: 1, tension: 100, friction: 10, useNativeDriver: true,
      }),
    ]).start();
  }, []);

  if (isNext) {
    return (
      <Animated.View style={{ opacity: slideAnim, transform: [{ scale: scaleAnim }] }}>
        <LinearGradient colors={['#0F3D2E', '#1A6B4A']} style={styles.rowNext}>
          <View style={[styles.nextBar, { backgroundColor: '#52D68A' }]} />
          <View style={[styles.iconWrap, { backgroundColor: 'rgba(82,214,138,0.2)' }]}>
            <Ionicons name={cfg.icon} size={20} color="#52D68A" />
          </View>
          <View style={styles.mid}>
            <View style={styles.nextBadge}>
              <View style={styles.nextDot} />
              <Text style={styles.nextBadgeText}>UP NEXT</Text>
            </View>
            <Text style={styles.nameNext}>{name}</Text>
            <Text style={[styles.arabicNext, { fontFamily: 'Amiri_400Regular' }]}>{ARABIC_NAMES[name]}</Text>
          </View>
          <View style={styles.rightBlock}>
            <Text style={styles.timeNext}>{displayTime}</Text>
            {minutesUntil !== undefined && (
              <Text style={styles.minutesUntil}>
                in {minutesUntil < 60 ? `${minutesUntil}m` : `${Math.floor(minutesUntil / 60)}h ${minutesUntil % 60}m`}
              </Text>
            )}
            <Switch
              value={notificationsEnabled}
              onValueChange={handleToggle}
              trackColor={{ true: '#52D68A', false: 'rgba(255,255,255,0.2)' }}
              thumbColor={colors.white}
              style={{ transform: [{ scale: 0.82 }] }}
            />
          </View>
        </LinearGradient>
      </Animated.View>
    );
  }

  return (
    <Animated.View style={{ opacity: slideAnim }}>
      <View style={[
        styles.row,
        { backgroundColor: rowBg },
        isCurrent && { borderLeftWidth: 3, borderLeftColor: currentBorder, backgroundColor: isDark ? 'rgba(212,169,62,0.06)' : colors.gold[50] },
      ]}>
        <View style={[styles.iconWrap, { backgroundColor: cfg.bg }]}>
          <Ionicons name={cfg.icon} size={19} color={cfg.color} />
        </View>
        <View style={styles.mid}>
          <Text style={[styles.name, { color: nameTxt }]}>{name}</Text>
          <Text style={[styles.arabic, { fontFamily: 'Amiri_400Regular', color: arabicTxt }]}>{ARABIC_NAMES[name]}</Text>
        </View>
        <View style={styles.rightBlock}>
          <Text style={[styles.time, { color: timeTxt }]}>{displayTime}</Text>
          <Switch
            value={notificationsEnabled}
            onValueChange={handleToggle}
            trackColor={{ true: colors.gold[500], false: isDark ? 'rgba(255,255,255,0.15)' : colors.parchment[200] }}
            thumbColor={colors.white}
            style={{ transform: [{ scale: 0.82 }] }}
          />
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md + 4,
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
    minHeight: 64,
  },
  rowNext: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
    overflow: 'hidden',
    minHeight: 80,
  },
  nextBar: {
    position: 'absolute', left: 0, top: 0, bottom: 0, width: 4,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  mid: { flex: 1, gap: 3 },
  name: { ...typography.subheading, fontWeight: '700' },
  nameNext: { ...typography.subheading, color: colors.white, fontWeight: '700' },
  arabic: { fontSize: 14, lineHeight: 20 },
  arabicNext: { fontSize: 14, color: 'rgba(255,255,255,0.5)', lineHeight: 20 },
  nextBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    alignSelf: 'flex-start', marginBottom: 3,
    backgroundColor: 'rgba(82,214,138,0.25)',
    borderRadius: radius.pill, paddingHorizontal: spacing.sm, paddingVertical: 2,
    borderWidth: 1, borderColor: 'rgba(82,214,138,0.4)',
  },
  nextDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: '#52D68A' },
  nextBadgeText: { fontSize: 9, color: '#52D68A', fontWeight: '800', letterSpacing: 1.2 },
  rightBlock: { alignItems: 'flex-end', gap: 4, flexShrink: 0 },
  time: {
    ...typography.subheading, fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  timeNext: {
    ...typography.heading, color: '#52D68A',
    fontVariant: ['tabular-nums'],
  },
  minutesUntil: { fontSize: 11, color: 'rgba(82,214,138,0.8)', fontWeight: '700' },
});
