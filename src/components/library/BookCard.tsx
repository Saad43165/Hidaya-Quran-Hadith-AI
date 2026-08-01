import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Book } from '../../types/models';
import { colors, radius, shadow, spacing, typography } from '../../theme';

export function BookCard({ book, onPress }: { book: Book; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.8}>
      {book.coverUrl ? (
        <Image source={{ uri: book.coverUrl }} style={styles.cover} resizeMode="cover" />
      ) : (
        <View style={[styles.cover, styles.coverFallback]}>
          <Ionicons name="book" size={28} color={colors.gold[400]} />
        </View>
      )}
      <View style={styles.info}>
        <Text style={styles.title} numberOfLines={2}>{book.title}</Text>
        <Text style={styles.author} numberOfLines={1}>{book.author}</Text>
        <View style={styles.sourceBadge}>
          <Text style={styles.sourceText}>
            {book.source === 'gutenberg' ? 'Free' : 'Google'}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: { width: '47%', backgroundColor: colors.white, borderRadius: radius.md, overflow: 'hidden', ...shadow.sm },
  cover: { width: '100%', aspectRatio: 2 / 3 },
  coverFallback: { backgroundColor: colors.navy[800], alignItems: 'center', justifyContent: 'center' },
  info: { padding: spacing.sm, gap: 3 },
  title: { ...typography.bodySmall, color: colors.parchment[950], fontWeight: '600' },
  author: { ...typography.caption, color: colors.parchment[500] },
  sourceBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.gold[100],
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    marginTop: 2,
  },
  sourceText: { fontSize: 10, fontWeight: '700', color: colors.gold[700] },
});
