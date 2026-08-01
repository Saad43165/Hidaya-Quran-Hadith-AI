import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ScrollView, Share, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useRoute, RouteProp } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { ContextualAssistant } from '../../components/assistant/ContextualAssistant';
import { LoadingView, ErrorView } from '../../components/common/AsyncStateView';
import { BookmarkButton } from '../../components/bookmarks/BookmarkButton';
import { ReaderSettingsPanel } from '../../components/quran/ReaderSettingsPanel';
import { WordDetailModal } from '../../components/quran/WordDetailModal';
import { fetchSurahDetail } from '../../services/api/quranApi';
import { fetchWordByWordSurah, WordByWordAyah } from '../../services/api/wordApi';
import { useAudioStore } from '../../store/useAudioStore';
import { listBookmarks, addBookmark, removeBookmark } from '../../services/db/bookmarksRepo';
import { setQuranProgress } from '../../services/db/progressRepo';
import { useQuranStore } from '../../store/useQuranStore';
import { SurahDetail, Ayah, VocabularyWord, WordToken } from '../../types/models';
import { colors, gradients, radius, shadow, spacing, typography } from '../../theme';
import type { RootStackParamList } from '../../navigation/types';

type SurahDetailRoute = RouteProp<RootStackParamList, 'SurahDetail'>;

function buildWordId(surahNumber: number, ayahNumber: number, wordIndex: number): string {
  return `word:${surahNumber}:${ayahNumber}:${wordIndex}`;
}

function toVocabWord(
  word: WordToken,
  surahNumber: number,
  ayahNumber: number,
  wordIndex: number,
): VocabularyWord {
  return {
    id: buildWordId(surahNumber, ayahNumber, wordIndex),
    arabic: word.arabic,
    transliteration: word.transliteration,
    meaning: word.translation,
    root: '',
    grammarRole: '',
    surahNumber,
    ayahNumber,
    timesInQuran: 0,
    savedAt: Date.now(),
  };
}

export function SurahDetailScreen() {
  const { params } = useRoute<SurahDetailRoute>();
  const { fontSize, translationLang, wordByWordEnabled, readingMode, setWordByWordEnabled, hydrate } = useQuranStore();
  const { currentSurah, currentAyahIndex, isPlaying, play: playAudio, pause: pauseAudio, resume: resumeAudio } = useAudioStore();
  
  const [surah, setSurah] = useState<SurahDetail | null>(null);
  const [wordData, setWordData] = useState<Map<number, WordByWordAyah>>(new Map());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bookmarkedAyahs, setBookmarkedAyahs] = useState<Set<number>>(new Set());
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [assistantOpen, setAssistantOpen] = useState(false);
  const [selectedWord, setSelectedWord] = useState<VocabularyWord | null>(null);
  const listRef = useRef<any>(null);

  const bookmarkId = (n: number) => `ayah:${params.surahNumber}:${n}`;

  const load = useCallback(async () => {
    setIsLoading(true); setError(null);
    try {
      const data = await fetchSurahDetail(params.surahNumber, translationLang);
      setSurah(data);
      setQuranProgress(params.surahNumber, data.englishName).catch(() => {});
    } catch { setError('Could not load this Surah. Check your connection.'); }
    finally { setIsLoading(false); }
  }, [params.surahNumber, translationLang]);

  const loadWordData = useCallback(async () => {
    if (!wordByWordEnabled) return;
    try {
      const ayahs = await fetchWordByWordSurah(params.surahNumber);
      const map = new Map<number, WordByWordAyah>();
      ayahs.forEach(a => map.set(a.numberInSurah, a));
      setWordData(map);
    } catch { /* fallback: display nothing */ }
  }, [params.surahNumber, wordByWordEnabled]);

  const loadBookmarks = useCallback(async () => {
    const all = await listBookmarks();
    setBookmarkedAyahs(new Set(
      all.filter(b => b.type === 'ayah' && b.surahNumber === params.surahNumber)
         .map(b => b.ayahNumber!)
    ));
  }, [params.surahNumber]);

  useEffect(() => {
    hydrate();
    load();
    loadBookmarks();
  }, [load, loadBookmarks, hydrate]);

  useEffect(() => { if (surah) load(); }, [translationLang]);
  useEffect(() => { if (wordByWordEnabled) loadWordData(); }, [wordByWordEnabled, loadWordData]);

  // Scroll to initial ayah if navigated from bookmark
  useEffect(() => {
    if (surah && params.initialAyahNumber && params.initialAyahNumber > 1) {
      const timeout = setTimeout(() => {
        listRef.current?.scrollToIndex({
          index: params.initialAyahNumber! - 1,
          animated: true,
          viewPosition: 0.1,
        });
      }, 500);
      return () => clearTimeout(timeout);
    }
  }, [surah, params.initialAyahNumber]);

  const handleAudio = async (ayah: Ayah) => {
    if (!surah) return;
    const index = surah.ayahs.findIndex(a => a.numberInSurah === ayah.numberInSurah);
    if (index === -1) return;

    if (currentSurah?.number === surah.number && currentAyahIndex === index) {
      if (isPlaying) {
        pauseAudio();
      } else {
        resumeAudio();
      }
    } else {
      await playAudio(surah, index);
    }
  };

  const handleToggleBookmark = async (ayah: Ayah) => {
    const id = bookmarkId(ayah.numberInSurah);
    if (bookmarkedAyahs.has(ayah.numberInSurah)) {
      await removeBookmark(id);
      setBookmarkedAyahs(p => { const n = new Set(p); n.delete(ayah.numberInSurah); return n; });
    } else {
      await addBookmark({ id, type: 'ayah', surahNumber: params.surahNumber, surahName: surah?.englishName, ayahNumber: ayah.numberInSurah, snippet: ayah.text });
      setBookmarkedAyahs(p => new Set(p).add(ayah.numberInSurah));
    }
  };

  const handleShareAyah = async (ayah: Ayah) => {
    const ref = `${surah?.englishName} (${params.surahNumber}:${ayah.numberInSurah})`;
    const text = ayah.translation
      ? `${ayah.text}\n\n"${ayah.translation}"\n\n— Quran, ${ref}`
      : `${ayah.text}\n\n— Quran, ${ref}`;
    try { await Share.share({ message: text }); } catch { /* user cancelled */ }
  };

  const handleWordTap = (word: WordToken, ayahNumber: number, wordIndex: number) => {
    setSelectedWord(toVocabWord(word, params.surahNumber, ayahNumber, wordIndex));
  };

  if (isLoading) return <ScreenContainer><LoadingView /></ScreenContainer>;
  if (error || !surah) return <ScreenContainer><ErrorView message={error ?? 'Not found'} onRetry={load} /></ScreenContainer>;

  const renderHeader = (
    <LinearGradient colors={gradients.heroNavy} style={styles.header}>
      <View style={styles.headerDecor} />
      {/* Settings + WBW toggle */}
      <View style={styles.headerBtns}>
        <TouchableOpacity
          style={[styles.headerIconBtn, wordByWordEnabled && styles.headerIconBtnActive]}
          onPress={() => setWordByWordEnabled(!wordByWordEnabled)}
        >
          <Text style={[styles.wbwBtnText, wordByWordEnabled && { color: colors.navy[900] }]}>Aa</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.settingsBtn} onPress={() => setSettingsOpen(true)}>
          <Ionicons name="text" size={16} color={colors.gold[400]} />
          <Ionicons name="settings-outline" size={14} color="rgba(255,255,255,0.4)" />
        </TouchableOpacity>
      </View>
      <Text style={[styles.arabicTitle, { fontFamily: 'Amiri_700Bold' }]}>{surah.name}</Text>
      <Text style={styles.englishTitle}>{surah.englishName}</Text>
      <Text style={styles.meaning}>{surah.englishNameTranslation}</Text>
      <View style={styles.pills}>
        <View style={styles.pill}><Text style={styles.pillText}>{surah.revelationType}</Text></View>
        <View style={styles.pill}><Text style={styles.pillText}>{surah.numberOfAyahs} Ayahs</Text></View>
        <View style={styles.pill}>
          <Text style={styles.pillText}>
            {translationLang === 'none' ? 'Arabic Only' : translationLang === 'ur.ahmedali' ? 'Urdu' : 'English'}
          </Text>
        </View>
      </View>
      {params.surahNumber !== 1 && params.surahNumber !== 9 && (
        <Text style={[styles.bismillah, { fontFamily: 'Amiri_400Regular' }]}>
          بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
        </Text>
      )}
    </LinearGradient>
  );

  return (
    <View style={{ flex: 1 }}>
      <ScreenContainer noPadding>
        <ReaderSettingsPanel visible={settingsOpen} onClose={() => setSettingsOpen(false)} />
        {readingMode === 'flowing' ? (
          <ScrollView style={styles.list} contentContainerStyle={{ paddingBottom: spacing.xxxl }}>
            {renderHeader}
            <View style={styles.flowingPage}>
              <Text style={[styles.flowingText, { fontSize: fontSize, lineHeight: fontSize * 2.2 }]}>
                {surah.ayahs.map((item, index) => {
                  const cleanedText = (item.numberInSurah === 1 && params.surahNumber !== 1 && params.surahNumber !== 9)
                    ? item.text.replace(/^بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ ?/g, '').replace(/^بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ ?/g, '').trim()
                    : item.text;
                  const marker = String(item.numberInSurah).replace(/[0-9]/g, d => String.fromCharCode(d.charCodeAt(0) + 1584));
                  return `${cleanedText} ﴿${marker}﴾ `;
                }).join('')}
              </Text>
            </View>
          </ScrollView>
        ) : (
          <FlashList
            ref={listRef}
            data={surah.ayahs}
            keyExtractor={item => String(item.numberInSurah)}
            contentContainerStyle={styles.list}
            // @ts-ignore
            estimatedItemSize={250}
            ListHeaderComponent={renderHeader}
          renderItem={({ item }) => {
            const wbwAyah = wordData.get(item.numberInSurah);
            const isPlayingThisAyah = currentSurah?.number === params.surahNumber &&
              currentAyahIndex === (surah?.ayahs.findIndex(a => a.numberInSurah === item.numberInSurah) ?? -1) &&
              isPlaying;

            return (
              <View style={styles.ayahCard}>
                <View style={styles.ayahTop}>
                  <View style={styles.ayahBadge}>
                    <Text style={styles.ayahBadgeText}>{item.numberInSurah}</Text>
                  </View>
                  <View style={styles.ayahActions}>
                    <TouchableOpacity onPress={() => handleAudio(item)}>
                      <Ionicons
                        name={isPlayingThisAyah ? 'pause-circle' : 'play-circle-outline'}
                        size={26}
                        color={isPlayingThisAyah ? '#D62828' : colors.parchment[400]}
                      />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleShareAyah(item)}>
                      <Ionicons name="share-social-outline" size={22} color={colors.parchment[400]} />
                    </TouchableOpacity>
                    <BookmarkButton
                      isBookmarked={bookmarkedAyahs.has(item.numberInSurah)}
                      onToggle={() => handleToggleBookmark(item)}
                    />
                  </View>
                </View>

                {/* Verse number diamond separator */}
                <View style={styles.verseSepRow}>
                  <View style={styles.verseSepLine} />
                  <Text style={[styles.verseSepNum, { fontFamily: 'Amiri_400Regular' }]}>
                    {`◆${item.numberInSurah}`}
                  </Text>
                  <View style={styles.verseSepLine} />
                </View>

                {/* Arabic text: word-by-word chips or flowing */}
                {wordByWordEnabled && wbwAyah && wbwAyah.words.length > 0 ? (
                  <View style={styles.wbwRow}>
                    {[...wbwAyah.words].reverse().map((w, wi) => (
                      <TouchableOpacity
                        key={wi}
                        style={styles.wordChip}
                        onPress={() => handleWordTap(w, item.numberInSurah, wi)}
                        activeOpacity={0.75}
                      >
                        <Text style={[styles.wordChipArabic, { fontSize, fontFamily: 'Amiri_400Regular' }]}>
                          {w.arabic}
                        </Text>
                        {w.translation ? (
                          <Text style={styles.wordChipGloss} numberOfLines={1}>{w.translation}</Text>
                        ) : null}
                      </TouchableOpacity>
                    ))}
                  </View>
                ) : (
                  <Text style={[styles.arabicText, { fontSize, lineHeight: fontSize * 2, fontFamily: 'Amiri_400Regular' }]}>
                    {item.numberInSurah === 1 && params.surahNumber !== 1 && params.surahNumber !== 9
                      ? item.text.replace(/^بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ ?/g, '').replace(/^بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ ?/g, '').trim()
                      : item.text}
                  </Text>
                )}

                {item.translation ? (
                  <View style={styles.translationWrap}>
                    <Text style={[
                      styles.translation,
                      translationLang === 'ur.ahmedali' && styles.translationUrdu,
                    ]}>
                      {item.translation}
                    </Text>
                  </View>
                ) : null}
              </View>
            );
          }}
        />
        )}
      </ScreenContainer>

      <WordDetailModal word={selectedWord} onClose={() => setSelectedWord(null)} />

      <ContextualAssistant
        context={{
          type: 'surah',
          surahNumber: params.surahNumber,
          surahName: surah.englishName,
        }}
        isOpen={assistantOpen}
        onToggle={() => setAssistantOpen(o => !o)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  list: { paddingBottom: spacing.xxxl },
  header: {
    paddingTop: spacing.xxl + spacing.lg, paddingBottom: spacing.xxl,
    paddingHorizontal: spacing.xl, alignItems: 'center',
    marginBottom: spacing.md, overflow: 'hidden',
    gap: spacing.xs,
  },
  headerDecor: {
    position: 'absolute', right: -60, top: -60,
    width: 220, height: 220, borderRadius: 110,
    borderWidth: 1, borderColor: 'rgba(212,169,62,0.1)',
  },
  headerBtns: {
    position: 'absolute', top: spacing.md + spacing.lg, right: spacing.md,
    flexDirection: 'row', alignItems: 'center', gap: spacing.xs,
  },
  headerIconBtn: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    paddingHorizontal: spacing.md, paddingVertical: spacing.xs,
  },
  headerIconBtnActive: {
    backgroundColor: colors.gold[400],
    borderColor: colors.gold[300],
  },
  wbwBtnText: { fontSize: 13, fontWeight: '700', color: 'rgba(255,255,255,0.8)' },
  settingsBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    paddingHorizontal: spacing.md, paddingVertical: spacing.xs,
  },
  arabicTitle: { fontSize: 46, color: colors.gold[300], lineHeight: 64 },
  englishTitle: { ...typography.displayMd, color: colors.white },
  meaning: { ...typography.body, color: 'rgba(255,255,255,0.4)', marginBottom: spacing.md },
  pills: {
    flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md,
    flexWrap: 'wrap', justifyContent: 'center',
  },
  pill: {
    backgroundColor: 'rgba(212,169,62,0.15)',
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: 'rgba(212,169,62,0.25)',
    paddingHorizontal: spacing.md, paddingVertical: 4,
  },
  pillText: { ...typography.caption, color: colors.gold[300], fontWeight: '600' },
  bismillah: {
    fontSize: 24, color: 'rgba(255,255,255,0.8)',
    marginTop: spacing.md, textAlign: 'center', lineHeight: 46,
  },
  ayahCard: {
    marginHorizontal: spacing.lg, marginBottom: spacing.md,
    backgroundColor: colors.white, borderRadius: radius.md,
    padding: spacing.lg,
    ...shadow.sm,
  },
  ayahTop: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: spacing.sm,
  },
  ayahBadge: {
    width: 34, height: 34, borderRadius: radius.pill,
    backgroundColor: colors.navy[900],
    alignItems: 'center', justifyContent: 'center',
  },
  ayahBadgeText: { fontSize: 12, color: colors.gold[400], fontWeight: '700' },
  ayahActions: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  verseSepRow: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  verseSepLine: { flex: 1, height: 1, backgroundColor: colors.parchment[100] },
  verseSepNum: { fontSize: 13, color: colors.gold[600] },
  arabicText: {
    color: colors.navy[900], textAlign: 'right',
    writingDirection: 'rtl', marginBottom: spacing.md,
  },
  wbwRow: {
    flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'flex-end',
    gap: spacing.xs, marginBottom: spacing.md,
  },
  wordChip: {
    alignItems: 'center', backgroundColor: colors.parchment[50],
    borderRadius: radius.sm, borderWidth: 1, borderColor: colors.parchment[200],
    paddingHorizontal: spacing.sm, paddingVertical: 4,
    minWidth: 48,
  },
  wordChipArabic: { color: colors.navy[900], textAlign: 'center', writingDirection: 'rtl' },
  wordChipGloss: { fontSize: 9, color: colors.parchment[500], textAlign: 'center', marginTop: 1, maxWidth: 56 },
  translationWrap: {
    borderTopWidth: 1, borderTopColor: colors.parchment[100], paddingTop: spacing.md,
  },
  translation: {
    ...typography.body, color: colors.parchment[700], lineHeight: 26,
  },
  translationUrdu: {
    fontFamily: 'Amiri_400Regular',
    fontSize: 17, lineHeight: 36,
    textAlign: 'right', writingDirection: 'rtl',
    color: colors.navy[900],
  },
  flowingPage: {
    marginHorizontal: spacing.lg,
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: spacing.xl,
    ...shadow.sm,
  },
  flowingText: {
    color: colors.navy[950],
    textAlign: 'justify',
    writingDirection: 'rtl',
    fontFamily: 'Amiri_400Regular',
  },
});
