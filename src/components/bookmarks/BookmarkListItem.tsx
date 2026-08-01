import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Bookmark } from '../../types/models';
import { colors, radius, shadow, spacing, typography } from '../../theme';

export function BookmarkListItem({ bookmark, onPress, onRemove }: {
  bookmark: Bookmark; onPress: () => void; onRemove: () => void;
}) {
  const isAyah = bookmark.type === 'ayah';
  const title = isAyah
    ? `${bookmark.surahName ?? 'Surah'} — Ayah ${bookmark.ayahNumber}`
    : `${bookmark.collectionName ?? 'Hadith'} — #${bookmark.hadithNumber}`;
  const accent = isAyah ? colors.gold[600] : colors.navy[500];
  const bgColor = isAyah ? colors.gold[50] : '#EEF2FF';

  return (
    <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={0.75}>
      <View style={[styles.iconWrap, { backgroundColor: bgColor }]}>
        <Ionicons name={isAyah ? 'book' : 'chatbox'} size={18} color={accent} />
      </View>
      <View style={styles.middle}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.snippet} numberOfLines={2}>{bookmark.snippet}</Text>
      </View>
      <TouchableOpacity onPress={onRemove} style={styles.removeBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
        <Ionicons name="trash-outline" size={16} color={colors.parchment[400]} />
      </TouchableOpacity>
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
  iconWrap: { width: 40, height: 40, borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  middle: { flex: 1 },
  title: { ...typography.bodyMedium, color: colors.parchment[950] },
  snippet: { ...typography.caption, color: colors.parchment[500], marginTop: 2 },
  removeBtn: { padding: spacing.xs },
});
