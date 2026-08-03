import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  Animated, FlatList, ScrollView, StyleSheet, Text,
  TextInput, TouchableOpacity, View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';

import { ScreenContainer } from '../../components/common/ScreenContainer';
import { FadeInRow } from '../../components/common/FadeInRow';
import { BackButton } from '../../components/common/BackButton';
import { listWords, removeWord, seedVocabularyIfEmpty } from '../../services/db/vocabularyRepo';
import { useVocabularyStore } from '../../store/useVocabularyStore';
import { useThemeColors } from '../../hooks/useThemeColors';
import { Haptics } from '../../services/haptics';
import { VocabularyWord } from '../../types/models';
import {
  QURANIC_VOCABULARY, QV_CATEGORIES, QVCategory,
  QuranicWord, getWordOfDay,
} from '../../data/quranVocabulary';
import { colors, radius, spacing, typography } from '../../theme';

type VocabTab = 'saved' | 'quran100' | 'flashcard';

// ── Word card (shared) ─────────────────────────────────────────────────────────

function WordCard({
  arabic, transliteration, meaning, root, surah, ayah, timesInQuran,
  accent, grammarRole, notes, onRemove, index, isDark, surface, border, textPrimary, textSecondary,
}: {
  arabic: string; transliteration: string; meaning: string; root?: string;
  surah?: number; ayah?: number; timesInQuran?: number; accent: string;
  grammarRole?: string; notes?: string; onRemove?: () => void;
  index: number; isDark: boolean; surface: string; border: string;
  textPrimary: string; textSecondary: string;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <FadeInRow index={index} delay={30}>
      <TouchableOpacity
        style={[styles.wordCard, { backgroundColor: surface, borderColor: border }]}
        onPress={() => setExpanded(v => !v)}
        activeOpacity={0.85}
      >
        {/* Left accent bar */}
        <View style={[styles.wordAccent, { backgroundColor: accent }]} />

        <View style={styles.wordBody}>
          {/* Top row */}
          <View style={styles.wordTopRow}>
            <Text style={[styles.wordArabic, { fontFamily: 'Amiri_700Bold', color: textPrimary }]}>
              {arabic}
            </Text>
            <View style={{ flex: 1, alignItems: 'flex-end', gap: 4 }}>
              {timesInQuran != null && timesInQuran > 0 && (
                <View style={[styles.freqBadge, { backgroundColor: accent + '18', borderColor: accent + '40' }]}>
                  <Text style={[styles.freqText, { color: accent }]}>×{timesInQuran.toLocaleString()}</Text>
                </View>
              )}
              {onRemove && (
                <TouchableOpacity onPress={onRemove} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <Ionicons name="trash-outline" size={15} color={colors.semantic.error} />
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Transliteration + meaning */}
          <Text style={[styles.wordTranslit, { color: textSecondary }]}>{transliteration}</Text>
          <Text style={[styles.wordMeaning, { color: textPrimary }]}>{meaning}</Text>

          {/* Root badge */}
          {root ? (
            <View style={[styles.rootBadge, { backgroundColor: colors.gold[50], borderColor: colors.gold[200] }]}>
              <Text style={[styles.rootText, { color: colors.gold[700] }]}>Root: {root}</Text>
            </View>
          ) : null}

          {/* Expanded extras */}
          {expanded && (
            <View style={[styles.expandedSection, { borderTopColor: border }]}>
              {grammarRole ? (
                <View style={styles.expandedRow}>
                  <Text style={[styles.expandedLabel, { color: textSecondary }]}>Role</Text>
                  <Text style={[styles.expandedValue, { color: textPrimary }]}>{grammarRole}</Text>
                </View>
              ) : null}
              {surah && ayah ? (
                <View style={styles.expandedRow}>
                  <Text style={[styles.expandedLabel, { color: textSecondary }]}>Example</Text>
                  <Text style={[styles.expandedValue, { color: textPrimary }]}>Surah {surah}: {ayah}</Text>
                </View>
              ) : null}
              {notes ? (
                <View style={styles.expandedRow}>
                  <Text style={[styles.expandedLabel, { color: textSecondary }]}>Note</Text>
                  <Text style={[styles.expandedValue, { color: textPrimary }]}>{notes}</Text>
                </View>
              ) : null}
            </View>
          )}

          <Text style={[styles.tapHint, { color: isDark ? 'rgba(255,255,255,0.15)' : colors.parchment[400] }]}>
            {expanded ? 'Tap to collapse' : 'Tap for details'}
          </Text>
        </View>
      </TouchableOpacity>
    </FadeInRow>
  );
}

// ── Quran 100 Tab ──────────────────────────────────────────────────────────────

function QuranVocabTab({
  isDark, surface, border, textPrimary, textSecondary, textMuted, bg,
}: {
  isDark: boolean; surface: string; border: string;
  textPrimary: string; textSecondary: string; textMuted: string; bg: string;
}) {
  const [selectedCat, setSelectedCat] = useState<QVCategory | 'all'>('all');
  const [search, setSearch] = useState('');
  const [learnedIds, setLearnedIds] = useState<Set<string>>(new Set());

  const filtered = useMemo(() => {
    let list = selectedCat === 'all'
      ? QURANIC_VOCABULARY
      : QURANIC_VOCABULARY.filter(w => w.category === selectedCat);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(w =>
        w.arabic.includes(search) ||
        w.transliteration.toLowerCase().includes(q) ||
        w.meaning.toLowerCase().includes(q) ||
        w.root.toLowerCase().includes(q)
      );
    }
    return list;
  }, [selectedCat, search]);

  const catForWord = (w: QuranicWord) => QV_CATEGORIES.find(c => c.key === w.category)!;

  return (
    <View style={{ flex: 1, backgroundColor: bg }}>
      {/* Search bar */}
      <View style={[styles.searchBar, { backgroundColor: surface, borderColor: border }]}>
        <Ionicons name="search-outline" size={16} color={textMuted} />
        <TextInput
          style={[styles.searchInput, { color: textPrimary }]}
          placeholder="Search by Arabic, meaning, or root…"
          placeholderTextColor={textMuted}
          value={search}
          onChangeText={setSearch}
          autoCorrect={false}
        />
        {search ? (
          <TouchableOpacity onPress={() => setSearch('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="close-circle" size={16} color={textMuted} />
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Category filter chips */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.catChips}>
        <TouchableOpacity
          style={[styles.catChip,
            selectedCat === 'all'
              ? styles.catChipActive
              : { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : colors.parchment[100], borderColor: isDark ? 'rgba(255,255,255,0.1)' : colors.parchment[200] }
          ]}
          onPress={() => setSelectedCat('all')}
          activeOpacity={0.75}
        >
          <Text style={[styles.catChipText, selectedCat === 'all' && { color: colors.navy[900] }]}>
            All ({QURANIC_VOCABULARY.length})
          </Text>
        </TouchableOpacity>
        {QV_CATEGORIES.map(cat => {
          const active = selectedCat === cat.key;
          const count = QURANIC_VOCABULARY.filter(w => w.category === cat.key).length;
          return (
            <TouchableOpacity
              key={cat.key}
              style={[styles.catChip,
                active
                  ? [styles.catChipActive, { backgroundColor: cat.color + '28', borderColor: cat.color }]
                  : { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : colors.parchment[100], borderColor: isDark ? 'rgba(255,255,255,0.1)' : colors.parchment[200] }
              ]}
              onPress={() => setSelectedCat(cat.key)}
              activeOpacity={0.75}
            >
              <Text style={{ fontSize: 13 }}>{cat.icon}</Text>
              <Text style={[styles.catChipText, active && { color: cat.color }]}>
                {cat.label.split(' ')[0]} ({count})
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Word list */}
      <FlatList
        data={filtered}
        keyExtractor={w => w.id}
        style={{ backgroundColor: bg }}
        contentContainerStyle={styles.list}
        renderItem={({ item, index }) => {
          const cat = catForWord(item);
          const learned = learnedIds.has(item.id);
          return (
            <View style={{ opacity: learned ? 0.5 : 1 }}>
              <WordCard
                arabic={item.arabic}
                transliteration={item.transliteration}
                meaning={item.meaning}
                root={item.root}
                surah={item.exampleSurah}
                ayah={item.exampleAyah}
                timesInQuran={item.timesInQuran}
                grammarRole={undefined}
                notes={item.notes}
                accent={cat.color}
                index={index}
                isDark={isDark}
                surface={surface}
                border={border}
                textPrimary={textPrimary}
                textSecondary={textSecondary}
                onRemove={undefined}
              />
              {/* Learned toggle */}
              <TouchableOpacity
                style={[styles.learnedBtn, {
                  backgroundColor: learned ? colors.gold[400] : 'transparent',
                  borderColor: learned ? colors.gold[400] : (isDark ? 'rgba(255,255,255,0.12)' : colors.parchment[300]),
                }]}
                onPress={() => {
                  Haptics.impact('light');
                  setLearnedIds(prev => {
                    const next = new Set(prev);
                    learned ? next.delete(item.id) : next.add(item.id);
                    return next;
                  });
                }}
                activeOpacity={0.8}
              >
                <Ionicons
                  name={learned ? 'checkmark-circle' : 'checkmark-circle-outline'}
                  size={14}
                  color={learned ? colors.navy[900] : textMuted}
                />
                <Text style={[styles.learnedBtnText, { color: learned ? colors.navy[900] : textMuted }]}>
                  {learned ? 'Learned ✓' : 'Mark as learned'}
                </Text>
              </TouchableOpacity>
            </View>
          );
        }}
        ListEmptyComponent={
          <View style={styles.emptyInline}>
            <Text style={[styles.emptyText, { color: textMuted }]}>No words match "{search}"</Text>
          </View>
        }
      />
    </View>
  );
}

// ── Flashcard (handles both saved + quran100 pool) ─────────────────────────────

type FlashWord = { arabic: string; transliteration: string; meaning: string; root?: string; source?: string };

function FlashcardSession({
  words, isDark, surface, border, bg, textPrimary, textSecondary, textMuted,
}: {
  words: FlashWord[]; isDark: boolean; surface: string; border: string;
  bg: string; textPrimary: string; textSecondary: string; textMuted: string;
}) {
  const [pool, setPool]         = useState(() => [...words].sort(() => Math.random() - 0.5));
  const [index, setIndex]       = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [known, setKnown]       = useState<Set<number>>(new Set());
  const [done, setDone]         = useState(false);
  const flipAnim = useRef(new Animated.Value(0)).current;
  const cardAnim = useRef(new Animated.Value(0)).current;

  const current = pool[index];

  const reveal = () => {
    Haptics.impact('light');
    Animated.spring(flipAnim, { toValue: 1, tension: 70, friction: 8, useNativeDriver: true }).start();
    setRevealed(true);
  };

  const next = (wasKnown: boolean) => {
    Haptics.impact(wasKnown ? 'medium' : 'light');
    if (wasKnown) setKnown(p => new Set(p).add(index));
    // Slide out
    Animated.timing(cardAnim, { toValue: wasKnown ? 1 : -1, duration: 200, useNativeDriver: true }).start(() => {
      cardAnim.setValue(0);
      flipAnim.setValue(0);
      setRevealed(false);
      if (index + 1 >= pool.length) setDone(true);
      else setIndex(i => i + 1);
    });
  };

  const restart = () => {
    setPool(prev => [...prev].sort(() => Math.random() - 0.5));
    setIndex(0); setKnown(new Set()); setDone(false);
    setRevealed(false); flipAnim.setValue(0); cardAnim.setValue(0);
  };

  if (done) {
    return (
      <View style={[styles.flashDone, { backgroundColor: bg }]}>
        <LinearGradient colors={['#1A2E7A', '#060C1F']} style={styles.flashDoneGrad}>
          <Text style={{ fontSize: 52 }}>🎉</Text>
          <Text style={[styles.flashDoneTitle, { color: colors.white }]}>Session Complete!</Text>
          <Text style={[styles.flashDoneSub, { color: 'rgba(255,255,255,0.6)' }]}>
            {known.size} of {pool.length} known
          </Text>
          <View style={styles.flashDoneStats}>
            <View style={styles.flashDoneStat}>
              <Text style={styles.flashDoneStatNum}>{known.size}</Text>
              <Text style={styles.flashDoneStatLabel}>Known</Text>
            </View>
            <View style={[styles.flashDoneStat, { borderLeftWidth: 1, borderLeftColor: 'rgba(255,255,255,0.2)' }]}>
              <Text style={styles.flashDoneStatNum}>{pool.length - known.size}</Text>
              <Text style={styles.flashDoneStatLabel}>Review</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.flashRestartBtn} onPress={restart} activeOpacity={0.85}>
            <Text style={styles.flashRestartText}>Practice Again</Text>
          </TouchableOpacity>
        </LinearGradient>
      </View>
    );
  }

  if (!current) return null;

  const progress = index / pool.length;
  const meaningOpacity = flipAnim.interpolate({ inputRange: [0, 0.4, 1], outputRange: [0, 0, 1] });
  const translateX = cardAnim.interpolate({ inputRange: [-1, 0, 1], outputRange: [-300, 0, 300] });

  return (
    <View style={[styles.flashWrap, { backgroundColor: bg }]}>
      {/* Progress */}
      <View style={styles.flashProgressSection}>
        <View style={[styles.flashProgressTrack, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : colors.parchment[200] }]}>
          <View style={[styles.flashProgressFill, { width: `${progress * 100}%` }]} />
        </View>
        <Text style={[styles.flashProgressText, { color: textMuted }]}>{index + 1} / {pool.length}</Text>
      </View>

      {/* Card */}
      <Animated.View style={{ flex: 1, transform: [{ translateX }] }}>
        <TouchableOpacity
          style={[styles.flashCard, { backgroundColor: surface, borderColor: border }]}
          onPress={!revealed ? reveal : undefined}
          activeOpacity={0.95}
        >
          <Text style={[styles.flashArabic, { fontFamily: 'Amiri_700Bold', color: textPrimary }]}>
            {current.arabic}
          </Text>
          <Text style={[styles.flashTranslit, { color: textSecondary }]}>{current.transliteration}</Text>

          {!revealed ? (
            <View style={styles.flashTapWrap}>
              <Ionicons name="eye-outline" size={20} color={textMuted} />
              <Text style={[styles.flashTapHint, { color: textMuted }]}>Tap to reveal</Text>
            </View>
          ) : (
            <Animated.View style={{ opacity: meaningOpacity, alignItems: 'center', gap: spacing.sm }}>
              <View style={[styles.flashMeaningBox, { backgroundColor: colors.gold[50], borderColor: colors.gold[200] }]}>
                <Text style={[styles.flashMeaning, { color: colors.navy[900] }]}>{current.meaning}</Text>
              </View>
              {current.root ? (
                <Text style={[styles.flashRoot, { color: textMuted }]}>Root: {current.root}</Text>
              ) : null}
              {current.source ? (
                <Text style={[styles.flashSource, { color: textMuted }]}>{current.source}</Text>
              ) : null}
            </Animated.View>
          )}
        </TouchableOpacity>
      </Animated.View>

      {/* Buttons */}
      {revealed && (
        <View style={styles.flashBtns}>
          <TouchableOpacity style={[styles.flashBtn, styles.flashBtnNo]} onPress={() => next(false)} activeOpacity={0.8}>
            <Ionicons name="refresh-outline" size={18} color="#F87171" />
            <Text style={[styles.flashBtnText, { color: '#F87171' }]}>Review again</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.flashBtn, styles.flashBtnYes]} onPress={() => next(true)} activeOpacity={0.8}>
            <Ionicons name="checkmark" size={18} color="#4ADE80" />
            <Text style={[styles.flashBtnText, { color: '#4ADE80' }]}>Know it!</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

// ── Main Screen ────────────────────────────────────────────────────────────────

export function VocabularyScreen() {
  const { isDark, bg, surface, border, textPrimary, textSecondary, textMuted } = useThemeColors();
  const [tab, setTab]         = useState<VocabTab>('saved');
  const [savedWords, setWords] = useState<VocabularyWord[]>([]);
  const [flashSource, setFlashSource] = useState<'saved' | 'quran100'>('saved');
  const setWordCount = useVocabularyStore(s => s.setWordCount);

  const wordOfDay = useMemo(() => getWordOfDay(), []);
  const wodCat = QV_CATEGORIES.find(c => c.key === wordOfDay.category)!;

  useFocusEffect(useCallback(() => {
    seedVocabularyIfEmpty()
      .then(() => listWords())
      .then(w => { setWords(w); setWordCount(w.length); })
      .catch(() => {});
  }, [setWordCount]));

  const handleRemove = async (id: string) => {
    try {
      Haptics.impact('light');
      await removeWord(id);
      setWords(prev => prev.filter(w => w.id !== id));
      setWordCount(Math.max(0, savedWords.length - 1));
    } catch {}
  };

  // Flash pool: saved or full quran vocab
  const flashPool: FlashWord[] = flashSource === 'saved'
    ? savedWords.map(w => ({ arabic: w.arabic, transliteration: w.transliteration, meaning: w.meaning, root: w.root, source: w.surahNumber ? `Surah ${w.surahNumber}:${w.ayahNumber}` : undefined }))
    : QURANIC_VOCABULARY.map(w => ({ arabic: w.arabic, transliteration: w.transliteration, meaning: w.meaning, root: w.root }));

  const TABS = [
    { key: 'saved'    as VocabTab, icon: 'bookmark-outline' as const, label: 'My Words' },
    { key: 'quran100' as VocabTab, icon: 'library-outline'  as const, label: 'Quranic 100' },
    { key: 'flashcard'as VocabTab, icon: 'card-outline'     as const, label: 'Flashcards' },
  ];

  return (
    <ScreenContainer noPadding>
      {/* ── Header ── */}
      <LinearGradient colors={['#060C1F', '#0D1A45', '#1A2E7A']} style={styles.header}>
        <View style={styles.headerRow}>
          <BackButton />
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>Vocabulary</Text>
            <Text style={styles.headerSub}>Quranic Arabic Word Bank</Text>
          </View>
          <View style={styles.countBadge}>
            <Text style={styles.countText}>{savedWords.length} saved</Text>
          </View>
        </View>

        {/* Word of the Day */}
        <TouchableOpacity
          style={styles.wodCard}
          onPress={() => { setTab('quran100'); }}
          activeOpacity={0.9}
        >
          <View style={[styles.wodAccent, { backgroundColor: wodCat.color }]} />
          <View style={styles.wodContent}>
            <View style={styles.wodHeader}>
              <Text style={styles.wodLabel}>✨ WORD OF THE DAY</Text>
              <View style={[styles.wodFreq, { backgroundColor: wodCat.color + '25', borderColor: wodCat.color + '50' }]}>
                <Text style={[styles.wodFreqText, { color: wodCat.color }]}>×{wordOfDay.timesInQuran}</Text>
              </View>
            </View>
            <Text style={[styles.wodArabic, { fontFamily: 'Amiri_700Bold' }]}>{wordOfDay.arabic}</Text>
            <Text style={styles.wodTranslit}>{wordOfDay.transliteration}</Text>
            <Text style={styles.wodMeaning}>{wordOfDay.meaning}</Text>
            {wordOfDay.root ? (
              <Text style={styles.wodRoot}>Root: {wordOfDay.root}</Text>
            ) : null}
          </View>
        </TouchableOpacity>

        {/* Tabs */}
        <View style={styles.tabRow}>
          {TABS.map(t => (
            <TouchableOpacity
              key={t.key}
              style={[styles.tabBtn, tab === t.key && styles.tabBtnActive]}
              onPress={() => setTab(t.key)}
              activeOpacity={0.75}
            >
              <Ionicons name={t.icon} size={13} color={tab === t.key ? colors.navy[900] : 'rgba(255,255,255,0.6)'} />
              <Text style={[styles.tabLabel, tab === t.key && styles.tabLabelActive]}>{t.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </LinearGradient>

      {/* ── Tab Content ── */}
      {tab === 'saved' && (
        savedWords.length === 0 ? (
          <View style={[styles.empty, { backgroundColor: bg }]}>
            <Ionicons name="bookmark-outline" size={48} color={isDark ? 'rgba(255,255,255,0.1)' : colors.parchment[300]} />
            <Text style={[styles.emptyTitle, { color: textPrimary }]}>No saved words yet</Text>
            <Text style={[styles.emptyText, { color: textMuted }]}>
              Tap any Arabic word while reading Quran or Hadith to save it here.
            </Text>
          </View>
        ) : (
          <FlatList
            data={savedWords}
            keyExtractor={w => w.id}
            style={{ backgroundColor: bg }}
            contentContainerStyle={styles.list}
            renderItem={({ item, index }) => (
              <WordCard
                arabic={item.arabic}
                transliteration={item.transliteration}
                meaning={item.meaning}
                root={item.root}
                surah={item.surahNumber}
                ayah={item.ayahNumber}
                timesInQuran={item.timesInQuran}
                grammarRole={item.grammarRole}
                accent={colors.gold[500]}
                index={index}
                isDark={isDark}
                surface={surface}
                border={border}
                textPrimary={textPrimary}
                textSecondary={textSecondary}
                onRemove={() => handleRemove(item.id)}
              />
            )}
          />
        )
      )}

      {tab === 'quran100' && (
        <QuranVocabTab
          isDark={isDark} surface={surface} border={border} bg={bg}
          textPrimary={textPrimary} textSecondary={textSecondary} textMuted={textMuted}
        />
      )}

      {tab === 'flashcard' && (
        <View style={[{ flex: 1, backgroundColor: bg }]}>
          {/* Source selector */}
          <View style={[styles.flashSourceRow, { backgroundColor: surface, borderBottomColor: border }]}>
            <Text style={[styles.flashSourceLabel, { color: textMuted }]}>Practice from:</Text>
            {(['saved', 'quran100'] as const).map(src => (
              <TouchableOpacity
                key={src}
                style={[styles.flashSourceBtn,
                  flashSource === src && { backgroundColor: colors.gold[400], borderColor: colors.gold[400] },
                  flashSource !== src && { borderColor: border },
                ]}
                onPress={() => setFlashSource(src)}
                activeOpacity={0.75}
              >
                <Text style={[styles.flashSourceBtnText, flashSource === src && { color: colors.navy[900] }]}>
                  {src === 'saved' ? `My Words (${savedWords.length})` : `Quranic 100 (${QURANIC_VOCABULARY.length})`}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {flashPool.length === 0 ? (
            <View style={styles.empty}>
              <Text style={[styles.emptyTitle, { color: textPrimary }]}>No words to practice</Text>
              <Text style={[styles.emptyText, { color: textMuted }]}>Save words from the Quran reader first.</Text>
            </View>
          ) : (
            <FlashcardSession
              key={flashSource}
              words={flashPool}
              isDark={isDark}
              surface={surface}
              border={border}
              bg={bg}
              textPrimary={textPrimary}
              textSecondary={textSecondary}
              textMuted={textMuted}
            />
          )}
        </View>
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  // Header
  header: { paddingTop: 52, paddingBottom: spacing.md, paddingHorizontal: spacing.lg, gap: spacing.md, overflow: 'hidden' },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  headerTitle: { fontSize: 18, fontWeight: '800', color: colors.white, letterSpacing: 0.2 },
  headerSub:   { fontSize: 11, color: 'rgba(255,255,255,0.4)', fontWeight: '500' },
  countBadge: {
    backgroundColor: 'rgba(212,169,62,0.15)', borderRadius: radius.pill,
    borderWidth: 1, borderColor: 'rgba(212,169,62,0.3)',
    paddingHorizontal: spacing.md, paddingVertical: 4,
  },
  countText: { fontSize: 11, color: colors.gold[300], fontWeight: '700' },

  // Word of the Day
  wodCard: {
    backgroundColor: 'rgba(255,255,255,0.07)', borderRadius: radius.md,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
    flexDirection: 'row', overflow: 'hidden',
  },
  wodAccent:   { width: 4 },
  wodContent:  { flex: 1, padding: spacing.md, gap: 3 },
  wodHeader:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  wodLabel:    { fontSize: 9, fontWeight: '800', letterSpacing: 1.2, color: 'rgba(255,255,255,0.5)' },
  wodFreq:     { borderRadius: radius.pill, borderWidth: 1, paddingHorizontal: 8, paddingVertical: 2 },
  wodFreqText: { fontSize: 10, fontWeight: '800' },
  wodArabic:   { fontSize: 26, color: colors.gold[200], lineHeight: 40 },
  wodTranslit: { fontSize: 13, color: 'rgba(255,255,255,0.5)', fontStyle: 'italic' },
  wodMeaning:  { fontSize: 14, color: colors.white, fontWeight: '600' },
  wodRoot:     { fontSize: 11, color: colors.gold[400] },

  // Tabs
  tabRow: { flexDirection: 'row', gap: spacing.sm },
  tabBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.xs,
    paddingVertical: spacing.sm, borderRadius: radius.pill,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  tabBtnActive: { backgroundColor: colors.gold[400] },
  tabLabel:     { fontSize: 11, fontWeight: '700', color: 'rgba(255,255,255,0.6)' },
  tabLabelActive: { color: colors.navy[900] },

  // Search
  searchBar: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    margin: spacing.lg, marginBottom: 0,
    borderRadius: radius.md, borderWidth: 1,
    paddingHorizontal: spacing.md, paddingVertical: 10,
  },
  searchInput: { flex: 1, fontSize: 14 },

  // Category chips
  catChips: { paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, gap: spacing.sm },
  catChip:  {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: spacing.md, paddingVertical: 6,
    borderRadius: radius.pill, borderWidth: 1,
  },
  catChipActive: { backgroundColor: colors.gold[400] + '28', borderColor: colors.gold[400] },
  catChipText:   { fontSize: 12, fontWeight: '600', color: 'rgba(255,255,255,0.6)' },

  // List
  list: { padding: spacing.lg, paddingBottom: 100, gap: spacing.sm },

  // Word card
  wordCard: {
    borderRadius: radius.md, overflow: 'hidden', borderWidth: 1,
    flexDirection: 'row',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 3, elevation: 1,
  },
  wordAccent: { width: 4 },
  wordBody:   { flex: 1, padding: spacing.md, gap: 3 },
  wordTopRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 2 },
  wordArabic: { fontSize: 26, lineHeight: 40, flex: 1 },
  freqBadge:  { borderRadius: radius.pill, borderWidth: 1, paddingHorizontal: 7, paddingVertical: 2 },
  freqText:   { fontSize: 10, fontWeight: '800' },
  wordTranslit: { fontSize: 12, fontStyle: 'italic' },
  wordMeaning:  { fontSize: 13, fontWeight: '600', lineHeight: 20 },
  rootBadge:  { alignSelf: 'flex-start', borderRadius: radius.pill, borderWidth: 1, paddingHorizontal: 8, paddingVertical: 2, marginTop: 4 },
  rootText:   { fontSize: 11, fontWeight: '700' },
  tapHint:    { fontSize: 10, marginTop: 4 },
  expandedSection: { borderTopWidth: 1, marginTop: 8, paddingTop: 8, gap: 4 },
  expandedRow: { flexDirection: 'row', gap: 8 },
  expandedLabel: { fontSize: 11, fontWeight: '700', width: 50 },
  expandedValue: { flex: 1, fontSize: 12, lineHeight: 18 },

  // Learned button
  learnedBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    alignSelf: 'flex-end', marginTop: -6, marginRight: spacing.lg, marginBottom: spacing.xs,
    borderRadius: radius.pill, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 5,
  },
  learnedBtnText: { fontSize: 11, fontWeight: '700' },

  // Empty
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xxl, gap: spacing.md },
  emptyTitle: { fontSize: 18, fontWeight: '700' },
  emptyText: { fontSize: 14, textAlign: 'center', lineHeight: 22 },
  emptyInline: { alignItems: 'center', padding: spacing.xl },

  // Flash source row
  flashSourceRow: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    paddingHorizontal: spacing.lg, paddingVertical: spacing.sm,
    borderBottomWidth: 1,
  },
  flashSourceLabel: { fontSize: 12, fontWeight: '600' },
  flashSourceBtn: {
    borderRadius: radius.pill, borderWidth: 1,
    paddingHorizontal: spacing.md, paddingVertical: 6,
  },
  flashSourceBtnText: { fontSize: 12, fontWeight: '700', color: 'rgba(255,255,255,0.5)' },

  // Flashcard
  flashWrap:         { flex: 1, padding: spacing.lg, gap: spacing.md },
  flashProgressSection: { gap: 4 },
  flashProgressTrack:   { height: 4, borderRadius: 2, overflow: 'hidden' },
  flashProgressFill:    { height: 4, backgroundColor: colors.gold[500], borderRadius: 2 },
  flashProgressText:    { fontSize: 11, textAlign: 'center', fontWeight: '600' },
  flashCard: {
    flex: 1, borderRadius: radius.lg, padding: spacing.xxl,
    alignItems: 'center', justifyContent: 'center',
    gap: spacing.lg, borderWidth: 1,
    shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 4,
  },
  flashArabic:  { fontSize: 56, lineHeight: 76, textAlign: 'center' },
  flashTranslit: { fontSize: 16, fontStyle: 'italic', textAlign: 'center' },
  flashTapWrap: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: spacing.md },
  flashTapHint: { fontSize: 13 },
  flashMeaningBox: {
    borderRadius: radius.md, borderWidth: 1,
    paddingHorizontal: spacing.lg, paddingVertical: spacing.md, alignItems: 'center',
  },
  flashMeaning: { fontSize: 20, fontWeight: '700', textAlign: 'center' },
  flashRoot:    { fontSize: 12, textAlign: 'center' },
  flashSource:  { fontSize: 11, textAlign: 'center' },
  flashBtns:    { flexDirection: 'row', gap: spacing.md },
  flashBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm,
    borderRadius: radius.md, paddingVertical: 14, borderWidth: 1.5,
  },
  flashBtnNo:   { backgroundColor: 'rgba(248,113,113,0.08)', borderColor: 'rgba(248,113,113,0.3)' },
  flashBtnYes:  { backgroundColor: 'rgba(74,222,128,0.08)',  borderColor: 'rgba(74,222,128,0.3)'  },
  flashBtnText: { fontSize: 13, fontWeight: '700' },

  flashDone: { flex: 1 },
  flashDoneGrad: {
    flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md, padding: spacing.xxl,
  },
  flashDoneTitle: { fontSize: 24, fontWeight: '900' },
  flashDoneSub:   { fontSize: 15, textAlign: 'center' },
  flashDoneStats: {
    flexDirection: 'row', borderRadius: radius.md, borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)',
    overflow: 'hidden', marginTop: spacing.sm,
  },
  flashDoneStat: { flex: 1, alignItems: 'center', paddingVertical: spacing.lg },
  flashDoneStatNum: { fontSize: 28, fontWeight: '900', color: colors.gold[300] },
  flashDoneStatLabel: { fontSize: 12, color: 'rgba(255,255,255,0.5)', fontWeight: '600', textTransform: 'uppercase' },
  flashRestartBtn: {
    backgroundColor: colors.gold[400], borderRadius: radius.pill,
    paddingHorizontal: 32, paddingVertical: spacing.md, marginTop: spacing.md,
  },
  flashRestartText: { fontSize: 15, fontWeight: '800', color: colors.navy[900] },
});
