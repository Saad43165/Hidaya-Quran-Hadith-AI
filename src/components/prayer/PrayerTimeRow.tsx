import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, Switch, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { PrayerName } from '../../types/models';
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
  const displayTime = time.replace(/ \(.*\)/, '');
  const cfg = PRAYER_CONFIG[name];
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
          {/* Left color bar */}
          <View style={[styles.nextBar, { backgroundColor: '#52D68A' }]} />

          <View style={[styles.iconWrap, { backgroundColor: 'rgba(82,214,138,0.2)' }]}>
            <Ionicons name={cfg.icon} size={20} color="#52D68A" />
          </View>

          <View style={styles.mid}>
            <View style={styles.nextBadgeRow}>
              <View style={styles.nextBadge}>
                <View style={styles.nextDot} />
                <Text style={styles.nextBadgeText}>UP NEXT</Text>
              </View>
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
              onValueChange={onToggleNotification}
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
      <View style={[styles.row, isCurrent && styles.rowCurrent]}>
        <View style={[styles.iconWrap, { backgroundColor: cfg.bg }]}>
          <Ionicons name={cfg.icon} size={19} color={cfg.color} />
        </View>
        <View style={styles.mid}>
          <Text style={styles.name}>{name}</Text>
          <Text style={[styles.arabic, { fontFamily: 'Amiri_400Regular' }]}>{ARABIC_NAMES[name]}</Text>
        </View>
        <View style={styles.rightBlock}>
          <Text style={styles.time}>{displayTime}</Text>
          <Switch
            value={notificationsEnabled}
            onValueChange={onToggleNotification}
            trackColor={{ true: colors.gold[500], false: colors.parchment[200] }}
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
    paddingVertical: spacing.md + 2,
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
    backgroundColor: colors.white,
  },
  rowCurrent: {
    borderLeftWidth: 3,
    borderLeftColor: colors.gold[500],
  },
  rowNext: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
    overflow: 'hidden',
  },
  nextBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  mid: { flex: 1, gap: 2 },
  name: { ...typography.subheading, color: colors.parchment[950] },
  nameNext: { ...typography.subheading, color: colors.white },
  arabic: {
    fontSize: 14,
    color: colors.parchment[500],
    lineHeight: 20,
  },
  arabicNext: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.5)',
    lineHeight: 20,
  },
  nextBadgeRow: { marginBottom: 2 },
  nextBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(82,214,138,0.25)',
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: 'rgba(82,214,138,0.4)',
  },
  nextDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#52D68A',
  },
  nextBadgeText: {
    fontSize: 9,
    color: '#52D68A',
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  rightBlock: { alignItems: 'flex-end', gap: 2 },
  time: {
    ...typography.subheading,
    color: colors.navy[700],
    fontVariant: ['tabular-nums'],
  },
  timeNext: {
    ...typography.heading,
    color: '#52D68A',
    fontVariant: ['tabular-nums'],
  },
  minutesUntil: {
    fontSize: 10,
    color: 'rgba(82,214,138,0.7)',
    fontWeight: '600',
  },
});
