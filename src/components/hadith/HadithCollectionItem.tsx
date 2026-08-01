import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { HadithCollection } from '../../types/models';
import { colors, radius, shadow, spacing, typography } from '../../theme';

// Each major collection gets its own color accent
const COLLECTION_COLORS: Record<string, string> = {
  bukhari:  '#D4A93E',
  muslim:   '#2E7D5B',
  abudawud: '#1E6B80',
  tirmidhi: '#6B4E8A',
  nasai:    '#8A4B1A',
  ibnmajah: '#2A5C8A',
  malik:    '#7A5A12',
  nawawi:   '#2E4D6B',
  qudsi:    '#5A3A7A',
  dehlawi:  '#1A5A4A',
};

export function HadithCollectionItem({ collection, onPress }: { collection: HadithCollection; onPress: () => void }) {
  const accent = COLLECTION_COLORS[collection.id] ?? colors.navy[600];
  const initial = collection.name.charAt(0);

  return (
    <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={0.75}>
      <View style={[styles.badge, { backgroundColor: accent + '22' }]}>
        <Text style={[styles.badgeText, { color: accent }]}>{initial}</Text>
      </View>
      <View style={styles.info}>
        <Text style={styles.name}>{collection.name}</Text>
        <Text style={styles.meta}>{collection.hasArabic ? 'Arabic · English' : 'English'}</Text>
      </View>
      <Ionicons name="chevron-forward" size={16} color={colors.parchment[400]} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    gap: spacing.md,
    ...shadow.sm,
  },
  badge: {
    width: 44,
    height: 44,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  badgeText: { fontSize: 20, fontWeight: '700' },
  info: { flex: 1 },
  name: { ...typography.subheading, color: colors.parchment[950] },
  meta: { ...typography.caption, color: colors.parchment[500], marginTop: 2 },
});
