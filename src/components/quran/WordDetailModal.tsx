import React, { useEffect, useRef, useState } from 'react';
import {
  Animated, Modal, Pressable, StyleSheet, Text,
  TouchableOpacity, View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { VocabularyWord } from '../../types/models';
import { saveWord, removeWord, isWordSaved } from '../../services/db/vocabularyRepo';
import { useVocabularyStore } from '../../store/useVocabularyStore';
import { getWordCount } from '../../services/db/vocabularyRepo';
import { colors, radius, shadow, spacing, typography } from '../../theme';

interface Props {
  word: VocabularyWord | null;
  onClose: () => void;
}

const GRAMMAR_COLORS: Record<string, string> = {
  Noun: '#F59E0B',
  Verb: '#4ADE80',
  Particle: '#38BDF8',
  Pronoun: '#C084FC',
  Adjective: '#F472B6',
};

export function WordDetailModal({ word, onClose }: Props) {
  const slideAnim = useRef(new Animated.Value(400)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const [saved, setSaved] = useState(false);
  const setWordCount = useVocabularyStore(s => s.setWordCount);

  useEffect(() => {
    if (word) {
      setSaved(false);
      isWordSaved(word.id).then(setSaved).catch(() => {});
      Animated.parallel([
        Animated.timing(opacityAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.spring(slideAnim, {
          toValue: 0, tension: 60, friction: 10, useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(opacityAnim, { toValue: 0, duration: 150, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 400, duration: 200, useNativeDriver: true }),
      ]).start();
    }
  }, [word]);

  const handleBookmark = async () => {
    if (!word) return;
    try {
      if (saved) {
        await removeWord(word.id);
        setSaved(false);
      } else {
        await saveWord(word);
        setSaved(true);
      }
      const count = await getWordCount();
      setWordCount(count);
    } catch {}
  };

  const badgeColor = word ? (GRAMMAR_COLORS[word.grammarRole] ?? colors.parchment[400]) : colors.parchment[400];
  const rootLetters = word?.root ? word.root.split('').join(' · ') : '';

  return (
    <Modal visible={!!word} transparent animationType="none" onRequestClose={onClose}>
      <Animated.View style={[styles.overlay, { opacity: opacityAnim }]}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <Animated.View style={[styles.panel, { transform: [{ translateY: slideAnim }] }]}>
          {/* Handle */}
          <View style={styles.handle} />

          {/* Arabic word */}
          <Text style={[styles.arabic, { fontFamily: 'Amiri_700Bold' }]}>
            {word?.arabic}
          </Text>

          {/* Transliteration */}
          <Text style={styles.translit}>{word?.transliteration}</Text>

          {/* Meaning */}
          <Text style={styles.meaning}>{word?.meaning}</Text>

          {/* Root */}
          {rootLetters ? (
            <View style={styles.rootRow}>
              <Text style={styles.rootLabel}>Root</Text>
              <Text style={[styles.rootLetters, { fontFamily: 'Amiri_400Regular' }]}>
                {rootLetters}
              </Text>
            </View>
          ) : null}

          {/* Grammar badge */}
          {word?.grammarRole ? (
            <View style={[styles.grammarBadge, { backgroundColor: badgeColor + '20', borderColor: badgeColor + '40' }]}>
              <Text style={[styles.grammarText, { color: badgeColor }]}>{word.grammarRole}</Text>
            </View>
          ) : null}

          {/* Stat */}
          {word?.timesInQuran ? (
            <Text style={styles.stat}>
              Appears <Text style={styles.statBold}>{word.timesInQuran}</Text> times in the Quran
            </Text>
          ) : null}

          {/* Bookmark */}
          <TouchableOpacity style={styles.saveBtn} onPress={handleBookmark} activeOpacity={0.8}>
            <Ionicons
              name={saved ? 'bookmark' : 'bookmark-outline'}
              size={18}
              color={saved ? colors.gold[500] : colors.parchment[600]}
            />
            <Text style={[styles.saveBtnText, saved && { color: colors.gold[600] }]}>
              {saved ? 'Saved to Vocabulary' : 'Save to Vocabulary'}
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(0,0,0,0.5)' },
  panel: {
    backgroundColor: colors.parchment[50],
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xxxl,
    paddingTop: spacing.md,
    alignItems: 'center',
    gap: spacing.md,
    ...shadow.lg,
  },
  handle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: colors.parchment[300],
    marginBottom: spacing.sm,
  },
  arabic: {
    fontSize: 42, color: colors.navy[900], lineHeight: 64,
    textAlign: 'center',
  },
  translit: { ...typography.subheading, color: colors.parchment[600] },
  meaning: { ...typography.heading, color: colors.navy[800], textAlign: 'center' },
  rootRow: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    backgroundColor: colors.parchment[100], borderRadius: radius.md,
    paddingHorizontal: spacing.lg, paddingVertical: spacing.sm,
  },
  rootLabel: { ...typography.caption, color: colors.parchment[500], fontWeight: '700' },
  rootLetters: { fontSize: 20, color: colors.navy[700], letterSpacing: 4 },
  grammarBadge: {
    borderRadius: radius.pill, borderWidth: 1,
    paddingHorizontal: spacing.lg, paddingVertical: spacing.xs,
  },
  grammarText: { ...typography.caption, fontWeight: '700' },
  stat: { ...typography.bodySmall, color: colors.parchment[500], textAlign: 'center' },
  statBold: { fontWeight: '700', color: colors.navy[700] },
  saveBtn: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    backgroundColor: colors.white, borderRadius: radius.md,
    paddingHorizontal: spacing.xl, paddingVertical: spacing.md,
    borderWidth: 1, borderColor: colors.parchment[200],
    ...shadow.sm, marginTop: spacing.sm,
  },
  saveBtnText: { ...typography.bodySmall, color: colors.parchment[600], fontWeight: '600' },
});
