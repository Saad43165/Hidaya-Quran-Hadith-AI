import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, shadow, spacing, typography } from '../../theme';

interface Props {
  title: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
}

export function ContinueReadingCard({ title, subtitle, icon, onPress }: Props) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.8}>
      <View style={styles.left}>
        <View style={styles.iconWrap}>
          <Ionicons name={icon} size={20} color={colors.gold[400]} />
        </View>
        <View style={styles.textBlock}>
          <Text style={styles.label}>Continue</Text>
          <Text style={styles.title} numberOfLines={1}>{title}</Text>
          <Text style={styles.subtitle} numberOfLines={1}>{subtitle}</Text>
        </View>
      </View>
      <View style={styles.chevronWrap}>
        <Ionicons name="chevron-forward" size={14} color={colors.gold[400]} />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.navy[800],
    borderRadius: radius.md,
    padding: spacing.lg,
    ...shadow.md,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    flex: 1,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: radius.sm,
    backgroundColor: 'rgba(212,169,62,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textBlock: {
    flex: 1,
    gap: 2,
  },
  label: {
    ...typography.label,
    color: colors.gold[500],
    fontSize: 10,
  },
  title: {
    ...typography.subheading,
    color: colors.white,
  },
  subtitle: {
    ...typography.caption,
    color: 'rgba(255,255,255,0.5)',
  },
  chevronWrap: {
    width: 28,
    height: 28,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255,255,255,0.07)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
