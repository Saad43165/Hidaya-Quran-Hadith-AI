import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Hadith } from '../../types/models';
import { BookmarkButton } from '../bookmarks/BookmarkButton';
import { HadithGradeBadge } from './HadithGradeBadge';
import { getHadithGrade } from '../../data/hadithGrades';
import { colors, radius, shadow, spacing, typography } from '../../theme';

interface Props {
  hadith: Hadith;
  collectionId: string;
  isBookmarked: boolean;
  onToggleBookmark: () => void;
}

export function HadithCard({ hadith, collectionId, isBookmarked, onToggleBookmark }: Props) {
  const grade = getHadithGrade(collectionId, hadith.hadithNumber);
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.numberBadge}>
          <Text style={styles.numberLabel}>No.</Text>
          <Text style={styles.numberText}>{hadith.hadithNumber}</Text>
        </View>
        <BookmarkButton isBookmarked={isBookmarked} onToggle={onToggleBookmark} />
      </View>
      <HadithGradeBadge grade={grade} />
      {hadith.arabicText ? (
        <Text style={styles.arabicText}>{hadith.arabicText}</Text>
      ) : null}
      <Text style={styles.translationText}>{hadith.text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    backgroundColor: colors.white,
    borderRadius: radius.md,
    padding: spacing.lg,
    ...shadow.sm,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  numberBadge: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  numberLabel: {
    ...typography.caption,
    color: colors.parchment[500],
    fontSize: 10,
  },
  numberText: {
    ...typography.subheading,
    color: colors.gold[600],
  },
  arabicText: {
    ...typography.arabicHadith,
    color: colors.navy[900],
    textAlign: 'right',
    writingDirection: 'rtl',
    marginBottom: spacing.md,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.parchment[200],
  },
  translationText: {
    ...typography.body,
    color: colors.parchment[800],
    lineHeight: 24,
  },
});
