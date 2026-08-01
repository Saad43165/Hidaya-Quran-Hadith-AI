import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, shadow, spacing, typography } from '../../theme';

interface QuickAccessItem {
  key: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  accent?: boolean;
}

interface Props {
  items: QuickAccessItem[];
}

// Icon accent colors — each feature has its own tint
const ICON_TINTS: Record<string, string> = {
  'book-outline':                   colors.gold[600],
  'chatbox-outline':                colors.navy[500],
  'time-outline':                   '#2E7D5B',
  'library-outline':                '#6B4E8A',
  'chatbubble-ellipses-outline':    '#1E6B80',
  'bookmark-outline':               '#8A4B1A',
};

export function QuickAccessGrid({ items }: Props) {
  const rows: QuickAccessItem[][] = [];
  for (let i = 0; i < items.length; i += 3) rows.push(items.slice(i, i + 3));

  return (
    <View style={styles.container}>
      {rows.map((row, ri) => (
        <View key={ri} style={styles.row}>
          {row.map((item) => {
            const tint = ICON_TINTS[item.icon] ?? colors.navy[600];
            return (
              <TouchableOpacity
                key={item.key}
                style={styles.tile}
                onPress={item.onPress}
                activeOpacity={0.7}
              >
                <View style={[styles.iconWrap, { backgroundColor: tint + '18' }]}>
                  <Ionicons name={item.icon} size={22} color={tint} />
                </View>
                <Text style={styles.label} numberOfLines={1}>{item.label}</Text>
              </TouchableOpacity>
            );
          })}
          {row.length < 3 && Array.from({ length: 3 - row.length }).map((_, i) => (
            <View key={`empty-${i}`} style={[styles.tile, styles.tileEmpty]} />
          ))}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.sm },
  row: { flexDirection: 'row', gap: spacing.sm },
  tile: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    alignItems: 'center',
    gap: spacing.xs,
    ...shadow.sm,
  },
  tileEmpty: {
    backgroundColor: 'transparent',
    shadowOpacity: 0,
    elevation: 0,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  label: {
    ...typography.caption,
    color: colors.parchment[900],
    textAlign: 'center',
    fontWeight: '600',
  },
});
