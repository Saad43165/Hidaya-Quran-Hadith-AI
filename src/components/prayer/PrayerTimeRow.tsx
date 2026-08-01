import React from 'react';
import { StyleSheet, Switch, Text, View } from 'react-native';
import { PrayerName } from '../../types/models';
import { colors, radius, spacing, typography } from '../../theme';

const ARABIC_NAMES: Record<PrayerName, string> = {
  Fajr: 'الفجر', Dhuhr: 'الظهر', Asr: 'العصر', Maghrib: 'المغرب', Isha: 'العشاء',
};

interface Props {
  name: PrayerName;
  time: string;
  isNext: boolean;
  notificationsEnabled: boolean;
  onToggleNotification: (v: boolean) => void;
}

export function PrayerTimeRow({ name, time, isNext, notificationsEnabled, onToggleNotification }: Props) {
  const displayTime = time.replace(/ \(.*\)/, '');
  return (
    <View style={[styles.row, isNext && styles.rowNext]}>
      <Text style={[styles.arabic, isNext && styles.textOnDark]}>{ARABIC_NAMES[name]}</Text>
      <View style={styles.mid}>
        <Text style={[styles.name, isNext && styles.textOnDark]}>{name}</Text>
      </View>
      <Text style={[styles.time, isNext && styles.timeOnDark]}>{displayTime}</Text>
      <Switch
        value={notificationsEnabled}
        onValueChange={onToggleNotification}
        trackColor={{ true: colors.gold[500], false: colors.parchment[300] }}
        thumbColor={colors.white}
        style={{ transform: [{ scale: 0.85 }] }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    gap: spacing.md,
  },
  rowNext: {
    backgroundColor: colors.navy[800],
  },
  arabic: {
    fontSize: 18,
    color: colors.parchment[500],
    width: 44,
    textAlign: 'center',
  },
  mid: { flex: 1 },
  name: {
    ...typography.subheading,
    color: colors.parchment[950],
  },
  time: {
    ...typography.subheading,
    color: colors.navy[700],
    fontVariant: ['tabular-nums'],
  },
  textOnDark: { color: colors.white },
  timeOnDark: { color: colors.gold[300], fontVariant: ['tabular-nums'] },
});
