import React, { useCallback, useRef, useState } from 'react';
import {
  Animated, FlatList, StyleSheet, Text,
  TouchableOpacity, View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { useFocusEffect } from '@react-navigation/native';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { listWords, removeWord } from '../../services/db/vocabularyRepo';
import { useVocabularyStore } from '../../store/useVocabularyStore';
import { VocabularyWord } from '../../types/models';
import { colors, gradients, radius, shadow, spacing, typography } from '../../theme';

type VocabTab = 'list' | 'flashcard';

// ── Flashcard Session ────────────────────────────────────────────────────────
function FlashcardSession({ words }: { words: VocabularyWord[] }) {
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [known, setKnown] = useState<Set<number>>(new Set());
  const [done, setDone] = useState(false);
  const flipAnim = useRef(new Animated.Value(0)).current;

  const current = words[index];
  const progress = index / words.length;

  const reveal = () => {
    Animated.spring(flipAnim, { toValue: 1, tension: 80, friction: 8, useNativeDriver: true }).start();
    setRevealed(true);
  };

  const next = (wasKnown: boolean) => {
    if (wasKnown) setKnown(p => new Set(p).add(index));
    if (index + 1 >= words.length) { setDone(true); return; }
    flipAnim.setValue(0);
    setRevealed(false);
    setIndex(i => i + 1);
  };

  if (done) {
    return (
      <View style={styles.flashDone}>
        <Text style={styles.flashDoneIcon}>🎉</Text>
        <Text style={styles.flashDoneTitle}>Session Complete!</Text>
        <Text style={styles.flashDoneSub}>
          {known.size} of {words.length} marked as known
        </Text>
        <TouchableOpacity
          style={styles.flashRestartBtn}
          onPress={() => { setIndex(0); setKnown(new Set()); setDone(false); setRevealed(false); flipAnim.setValue(0); }}
        >
          <Text style={styles.flashRestartText}>Practice Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!current) return null;

  const meaningOpacity = flipAnim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, 0, 1] });
  const blurScale = flipAnim.interpolate({ inputRange: [0, 1], outputRange: [1.02, 1] });

  return (
    <View style={styles.flashWrap}>
      {/* Progress */}
      <View style={styles.flashProgressTrack}>
        <View style={[styles.flashProgressFill, { width: `${progress * 100}%` }]} />
      </View>
      <Text style={styles.flashProgress}>{index + 1} / {words.length}</Text>

      {/* Card */}
      <TouchableOpacity style={styles.flashCard} onPress={!revealed ? reveal : undefined} activeOpacity={0.9}>
        <Text style={[styles.flashArabic, { fontFamily: 'Amiri_700Bold' }]}>{current.arabic}</Text>
        <Text style={styles.flashTranslit}>{current.transliteration}</Text>
        {!revealed ? (
          <Text style={styles.flashTapHint}>Tap to reveal meaning</Text>
        ) : (
          <Animated.View style={{ opacity: meaningOpacity, transform: [{ scale: blurScale }] }}>
            <Text style={styles.flashMeaning}>{current.meaning}</Text>
            {current.root ? (
              <Text style={styles.flashRoot}>Root: {current.root}</Text>
            ) : null}
          </Animated.View>
        )}
      </TouchableOpacity>

      {/* Buttons */}
      {revealed && (
        <View style={styles.flashBtns}>
          <TouchableOpacity style={[styles.flashBtn, styles.flashBtnNo]} onPress={() => next(false)}>
            <Ionicons name="close" size={20} color="#F87171" />
            <Text style={[styles.flashBtnText, { color: '#F87171' }]}>Review again</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.flashBtn, styles.flashBtnYes]} onPress={() => next(true)}>
            <Ionicons name="checkmark" size={20} color="#4ADE80" />
            <Text style={[styles.flashBtnText, { color: '#4ADE80' }]}>Know it</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

// ── Main Screen ──────────────────────────────────────────────────────────────
export function VocabularyScreen() {
  const navigation = useNavigation();
  const [tab, setTab] = useState<VocabTab>('list');
  const [words, setWords] = useState<VocabularyWord[]>([]);
  const setWordCount = useVocabularyStore(s => s.setWordCount);

  useFocusEffect(useCallback(() => {
    listWords().then(w => { setWords(w); setWordCount(w.length); }).catch(() => {});
  }, [setWordCount]));

  const handleRemove = async (id: string) => {
    try {
      await removeWord(id);
      setWords(prev => prev.filter(w => w.id !== id));
      setWordCount(Math.max(0, words.length - 1));
    } catch {}
  };

  return (
    <ScreenContainer noPadding>
      {/* Header */}
      <LinearGradient colors={gradients.heroNavy} style={styles.header}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 4 }}>
            <Ionicons name="arrow-back" size={24} color={colors.white} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>My Vocabulary</Text>
          <View style={styles.countBadge}>
            <Text style={styles.countText}>{words.length}</Text>
          </View>
        </View>

        {/* Tab pills */}
        <View style={styles.tabRow}>
          {(['list', 'flashcard'] as VocabTab[]).map(t => (
            <TouchableOpacity
              key={t}
              style={[styles.tabBtn, tab === t && styles.tabBtnActive]}
              onPress={() => setTab(t)}
            >
              <Ionicons
                name={t === 'list' ? 'list-outline' : 'card-outline'}
                size={14}
                color={tab === t ? colors.navy[900] : 'rgba(255,255,255,0.6)'}
              />
              <Text style={[styles.tabLabel, tab === t && styles.tabLabelActive]}>
                {t === 'list' ? 'LIST' : 'FLASHCARDS'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </LinearGradient>

      {/* Content */}
      {tab === 'list' ? (
        words.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="language-outline" size={52} color={colors.parchment[300]} />
            <Text style={styles.emptyTitle}>No words yet</Text>
            <Text style={styles.emptyText}>
              Tap any Arabic word while reading to save it here
            </Text>
          </View>
        ) : (
          <FlatList
            data={words}
            keyExtractor={w => w.id}
            contentContainerStyle={styles.list}
            renderItem={({ item }) => (
              <View style={styles.wordCard}>
                <View style={styles.wordCardLeft}>
                  <Text style={[styles.wordArabic, { fontFamily: 'Amiri_700Bold' }]}>{item.arabic}</Text>
                  <Text style={styles.wordTranslit}>{item.transliteration}</Text>
                  <Text style={styles.wordMeaning}>{item.meaning}</Text>
                  {item.root ? (
                    <Text style={styles.wordRoot}>Root: {item.root}</Text>
                  ) : null}
                </View>
                <TouchableOpacity style={styles.wordRemoveBtn} onPress={() => handleRemove(item.id)}>
                  <Ionicons name="trash-outline" size={18} color={colors.semantic.error} />
                </TouchableOpacity>
              </View>
            )}
          />
        )
      ) : (
        words.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="card-outline" size={52} color={colors.parchment[300]} />
            <Text style={styles.emptyTitle}>No words to practice</Text>
            <Text style={styles.emptyText}>Save words from the Quran reader to start flashcard practice</Text>
          </View>
        ) : (
          <FlashcardSession words={words} />
        )
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: { paddingTop: spacing.lg, paddingBottom: spacing.xl, paddingHorizontal: spacing.lg, gap: spacing.md },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  headerTitle: { ...typography.displayMd, color: colors.white, flex: 1 },
  countBadge: {
    backgroundColor: 'rgba(212,169,62,0.2)', borderRadius: radius.pill,
    borderWidth: 1, borderColor: 'rgba(212,169,62,0.35)',
    paddingHorizontal: spacing.md, paddingVertical: 3,
  },
  countText: { ...typography.caption, color: colors.gold[300], fontWeight: '700' },

  tabRow: { flexDirection: 'row', gap: spacing.sm },
  tabBtn: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.xs,
    paddingHorizontal: spacing.lg, paddingVertical: spacing.sm,
    borderRadius: radius.pill, backgroundColor: 'rgba(255,255,255,0.1)',
  },
  tabBtnActive: { backgroundColor: colors.gold[400] },
  tabLabel: { ...typography.caption, color: 'rgba(255,255,255,0.6)', fontWeight: '700' },
  tabLabelActive: { color: colors.navy[900] },

  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xxl, gap: spacing.md },
  emptyTitle: { ...typography.heading, color: colors.parchment[800] },
  emptyText: { ...typography.body, color: colors.parchment[500], textAlign: 'center', lineHeight: 24 },

  list: { padding: spacing.lg, paddingBottom: spacing.xxxl, gap: spacing.sm },
  wordCard: {
    backgroundColor: colors.white, borderRadius: radius.md, padding: spacing.lg,
    flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md,
    ...shadow.sm,
  },
  wordCardLeft: { flex: 1, gap: 3 },
  wordArabic: { fontSize: 24, color: colors.navy[900], textAlign: 'right', lineHeight: 36 },
  wordTranslit: { ...typography.bodySmall, color: colors.parchment[600] },
  wordMeaning: { ...typography.bodySmall, color: colors.navy[700], fontWeight: '600' },
  wordRoot: { ...typography.caption, color: colors.parchment[500] },
  wordRemoveBtn: { padding: spacing.xs, marginTop: spacing.xs },

  // Flashcard
  flashWrap: { flex: 1, padding: spacing.lg, gap: spacing.lg },
  flashProgressTrack: { height: 4, backgroundColor: colors.parchment[200], borderRadius: radius.pill, overflow: 'hidden' },
  flashProgressFill: { height: 4, backgroundColor: colors.gold[500], borderRadius: radius.pill },
  flashProgress: { ...typography.caption, color: colors.parchment[500], textAlign: 'center' },
  flashCard: {
    flex: 1, backgroundColor: colors.white, borderRadius: radius.lg,
    padding: spacing.xxl, alignItems: 'center', justifyContent: 'center',
    gap: spacing.lg, ...shadow.md,
  },
  flashArabic: { fontSize: 52, color: colors.navy[900], lineHeight: 72, textAlign: 'center' },
  flashTranslit: { ...typography.subheading, color: colors.parchment[600] },
  flashTapHint: { ...typography.bodySmall, color: colors.parchment[400], marginTop: spacing.md },
  flashMeaning: { ...typography.heading, color: colors.navy[800], textAlign: 'center' },
  flashRoot: { ...typography.caption, color: colors.parchment[500], textAlign: 'center', marginTop: 4 },
  flashBtns: { flexDirection: 'row', gap: spacing.md },
  flashBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm,
    borderRadius: radius.md, paddingVertical: spacing.md, borderWidth: 1.5, ...shadow.sm,
  },
  flashBtnNo: { backgroundColor: 'rgba(248,113,113,0.08)', borderColor: 'rgba(248,113,113,0.3)' },
  flashBtnYes: { backgroundColor: 'rgba(74,222,128,0.08)', borderColor: 'rgba(74,222,128,0.3)' },
  flashBtnText: { ...typography.bodySmall, fontWeight: '700' },
  flashDone: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md, padding: spacing.xxl },
  flashDoneIcon: { fontSize: 52 },
  flashDoneTitle: { ...typography.displayMd, color: colors.navy[900] },
  flashDoneSub: { ...typography.body, color: colors.parchment[600], textAlign: 'center' },
  flashRestartBtn: {
    backgroundColor: colors.navy[900], borderRadius: radius.pill,
    paddingHorizontal: spacing.xxl, paddingVertical: spacing.md,
    marginTop: spacing.md,
  },
  flashRestartText: { ...typography.subheading, color: colors.white },
});
