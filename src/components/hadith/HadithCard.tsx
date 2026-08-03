import React, { useState } from 'react';
import { Share, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
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
  collectionName?: string;
}

function formatHadithText(hadith: Hadith, collectionName?: string): string {
  return [
    hadith.arabicText,
    hadith.arabicText ? '\n' : null,
    hadith.text,
    `\n— Hadith No. ${hadith.hadithNumber}${collectionName ? `, ${collectionName}` : ''}`,
    '— via IlmAI',
  ].filter(Boolean).join('\n');
}

export function HadithCard({ hadith, collectionId, isBookmarked, onToggleBookmark, collectionName }: Props) {
  const grade = getHadithGrade(collectionId, hadith.hadithNumber);
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    const msg = formatHadithText(hadith, collectionName);
    try { await Share.share({ message: msg }); } catch {}
  };

  const handleCopy = async () => {
    const msg = formatHadithText(hadith, collectionName);
    try {
      await Clipboard.setStringAsync(msg);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  };

  return (
    <View style={styles.card}>
      <View style={styles.accentBar} />
      <View style={styles.header}>
        <View style={styles.numberBadge}>
          <Text style={styles.numberLabel}>No.</Text>
          <Text style={styles.numberText}>{hadith.hadithNumber}</Text>
        </View>
        <View style={styles.actions}>
          <TouchableOpacity style={styles.actionBtn} onPress={handleCopy} activeOpacity={0.7}>
            <Ionicons name={copied ? 'checkmark' : 'copy-outline'} size={15} color={copied ? '#4ADE80' : colors.parchment[500]} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn} onPress={handleShare} activeOpacity={0.7}>
            <Ionicons name="share-outline" size={15} color={colors.parchment[500]} />
          </TouchableOpacity>
          <BookmarkButton isBookmarked={isBookmarked} onToggle={onToggleBookmark} />
        </View>
      </View>
      {grade !== 'unknown' && <HadithGradeBadge grade={grade} />}
      {hadith.arabicText ? (
        <Text style={[styles.arabicText, { fontFamily: 'Amiri_400Regular' }]}>{hadith.arabicText}</Text>
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
    overflow: 'hidden',
    ...shadow.sm,
  },
  accentBar: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, backgroundColor: colors.gold[400] },
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
  actions: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  actionBtn: {
    width: 30, height: 30, borderRadius: radius.xs,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: colors.parchment[50],
  },
  arabicText: {
    fontSize: 20,
    lineHeight: 44,
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
