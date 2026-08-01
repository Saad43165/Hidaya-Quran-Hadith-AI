import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { HadithGrade, GRADE_LABELS, GRADE_COLORS, GRADE_BG } from '../../data/hadithGrades';
import { radius, spacing, typography } from '../../theme';

interface Props {
  grade: HadithGrade;
  onPress?: () => void;
}

const GRADE_ICONS: Record<HadithGrade, string> = {
  sahih: '✓', hasan: '~', daif: '⚠', mawdu: '✗', unknown: '?',
};

export function HadithGradeBadge({ grade, onPress }: Props) {
  const color = GRADE_COLORS[grade];
  const bg = GRADE_BG[grade];

  return (
    <TouchableOpacity
      style={[styles.badge, { backgroundColor: bg, borderColor: color + '40' }]}
      onPress={onPress}
      disabled={!onPress}
      activeOpacity={0.75}
    >
      <Text style={[styles.icon, { color }]}>{GRADE_ICONS[grade]}</Text>
      <Text style={[styles.label, { color }]}>{GRADE_LABELS[grade]}</Text>
      {onPress && <Ionicons name="information-circle-outline" size={12} color={color} />}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    borderRadius: radius.pill, borderWidth: 1,
    paddingHorizontal: spacing.sm, paddingVertical: 3,
    alignSelf: 'flex-start',
  },
  icon: { fontSize: 11, fontWeight: '700' },
  label: { fontSize: 11, fontWeight: '600' },
});
