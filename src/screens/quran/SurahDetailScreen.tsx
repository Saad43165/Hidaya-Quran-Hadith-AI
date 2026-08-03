import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Image, Modal, Pressable, ScrollView, Share, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { FlashList, ViewToken } from '@shopify/flash-list';
import { useRoute, useNavigation, useFocusEffect, RouteProp } from '@react-navigation/native';
import * as Clipboard from 'expo-clipboard';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { ContextualAssistant } from '../../components/assistant/ContextualAssistant';
import { LoadingView, ErrorView } from '../../components/common/AsyncStateView';
import { BookmarkButton } from '../../components/bookmarks/BookmarkButton';
import { ReaderSettingsPanel } from '../../components/quran/ReaderSettingsPanel';
import MushafReader from '../../components/quran/MushafReader';
import { WordDetailModal } from '../../components/quran/WordDetailModal';
import { fetchSurahDetail } from '../../services/api/quranApi';
import { fetchWordByWordSurah, WordByWordAyah } from '../../services/api/wordApi';
import { useAudioStore } from '../../store/useAudioStore';
import { listBookmarks, addBookmark, removeBookmark } from '../../services/db/bookmarksRepo';
import { setQuranProgress } from '../../services/db/progressRepo';
import { useQuranStore } from '../../store/useQuranStore';
import { saveComprehension, getComprehensionForAyah } from '../../services/db/comprehensionRepo';
import { fetchWithCache } from '../../services/db/cacheRepo';
import { Haptics } from '../../services/haptics';
import { SurahDetail, Ayah, VocabularyWord, WordToken, ComprehensionLevel } from '../../types/models';
import { RECITERS } from '../../data/reciters';
import { BackButton } from '../../components/common/BackButton';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useMiniPlayerPadding } from '../../hooks/useMiniPlayerPadding';
import { colors, gradients, radius, shadow, spacing, typography } from '../../theme';
import type { RootStackParamList } from '../../navigation/types';

type SurahDetailRoute = RouteProp<RootStackParamList, 'SurahDetail'>;

const IMG_ISLAMIC_BG = require('../../../assets/images/islamicbackground.png');

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
  const navigation = useNavigation();
  const { params } = useRoute<SurahDetailRoute>();
  const { fontSize, translationLang, wordByWordEnabled, readingMode, setWordByWordEnabled, setTranslationLang, hydrate } = useQuranStore();
  const { currentSurah, currentAyahIndex, isPlaying, play: playAudio, pause: pauseAudio, resume: resumeAudio, selectedReciterId, setReciter, repeatMode, cycleRepeatMode } = useAudioStore();
  const { isDark, bg, surface, border, textPrimary, textSecondary } = useThemeColors();
  const miniPlayerPad = useMiniPlayerPadding();

  const [surah, setSurah] = useState<SurahDetail | null>(null);
  const [readProgressAyah, setReadProgressAyah] = useState(0);
  const [wordData, setWordData] = useState<Map<number, WordByWordAyah>>(new Map());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bookmarkedAyahs, setBookmarkedAyahs] = useState<Set<number>>(new Set());
  const [comprehensionMap, setComprehensionMap] = useState<Map<number, ComprehensionLevel>>(new Map());
  const [compPromptForAyah, setCompPromptForAyah] = useState<number | null>(null);
  const [tafsirForAyah, setTafsirForAyah] = useState<number | null>(null);
  const [tafsirText, setTafsirText] = useState<Map<number, string>>(new Map());
  const [tafsirLoading, setTafsirLoading] = useState(false);
  const tafsirCache = useRef(new Map<string, string>());
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [reciterOpen, setReciterOpen] = useState(false);
  const [assistantOpen, setAssistantOpen] = useState(false);
  const [selectedWord, setSelectedWord] = useState<VocabularyWord | null>(null);
  const [actionSheetAyah, setActionSheetAyah] = useState<Ayah | null>(null);
  const [copiedFeedback, setCopiedFeedback] = useState(false);
  const listRef = useRef<any>(null);
  const lastVisibleAyahRef = useRef<number>(params.initialAyahNumber ?? 1);

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

  // Scroll to initial ayah if navigated from bookmark or "Continue reading"
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

  // Auto-scroll to the ayah currently playing so the highlight stays in view
  useEffect(() => {
    if (
      readingMode === 'cards' &&
      surah &&
      currentSurah?.number === params.surahNumber &&
      currentAyahIndex >= 0 &&
      isPlaying
    ) {
      const timeout = setTimeout(() => {
        try {
          listRef.current?.scrollToIndex({
            index: currentAyahIndex,
            animated: true,
            viewPosition: 0.25,
          });
        } catch { /* index momentarily out of range during layout */ }
      }, 120);
      return () => clearTimeout(timeout);
    }
  }, [currentAyahIndex, isPlaying, currentSurah?.number, params.surahNumber, surah, readingMode]);

  // Track last-visible ayah for "continue reading" persistence and progress bar
  const onViewableItemsChanged = useCallback(({ viewableItems }: { viewableItems: ViewToken<Ayah>[] }) => {
    if (viewableItems.length > 0) {
      const item = viewableItems[0].item as Ayah | undefined;
      if (item) {
        lastVisibleAyahRef.current = item.numberInSurah;
        setReadProgressAyah(item.numberInSurah);
      }
    }
  }, []);

  // Persist last-read position whenever the screen loses focus / unmounts
  useFocusEffect(
    useCallback(() => {
      return () => {
        if (surah) {
          setQuranProgress(params.surahNumber, surah.englishName, lastVisibleAyahRef.current).catch(() => {});
        }
      };
    }, [surah, params.surahNumber])
  );

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

  const handleCopyAyah = async (ayah: Ayah) => {
    const ref = `${surah?.englishName} (${params.surahNumber}:${ayah.numberInSurah})`;
    const text = ayah.translation
      ? `${ayah.text}\n\n"${ayah.translation}"\n\n— Quran, ${ref}`
      : `${ayah.text}\n\n— Quran, ${ref}`;
    await Clipboard.setStringAsync(text);
    setCopiedFeedback(true);
    Haptics.impact('light');
    setTimeout(() => setCopiedFeedback(false), 1500);
  };

  const handlePlayFromHere = async (ayah: Ayah) => {
    if (!surah) return;
    const index = surah.ayahs.findIndex(a => a.numberInSurah === ayah.numberInSurah);
    if (index === -1) return;
    await playAudio(surah, index);
  };

  interface TafsirApiResponse {
    verse?: {
      tafsirs?: Array<{ text?: string }>;
    };
  }

  const handleFetchTafsir = async (ayahNumber: number) => {
    const cacheKey = `tafsir:169:${params.surahNumber}:${ayahNumber}`;
    // Toggle off if already open
    if (tafsirForAyah === ayahNumber) {
      setTafsirForAyah(null);
      return;
    }
    setTafsirForAyah(ayahNumber);
    // Already in session memory
    if (tafsirCache.current.has(cacheKey)) {
      const cached = tafsirCache.current.get(cacheKey)!;
      setTafsirText(prev => new Map(prev).set(ayahNumber, cached));
      return;
    }
    setTafsirLoading(true);
    try {
      const text = await fetchWithCache<string>(cacheKey, async () => {
        const url = `https://api.qurancdn.com/api/qdc/verses/by_key/${params.surahNumber}:${ayahNumber}?tafsirs=169&language=en`;
        const res = await fetch(url);
        const json = (await res.json()) as TafsirApiResponse;
        const raw = json.verse?.tafsirs?.[0]?.text ?? '';
        return raw.replace(/<[^>]*>/g, '').trim();
      });
      tafsirCache.current.set(cacheKey, text);
      setTafsirText(prev => new Map(prev).set(ayahNumber, text));
    } catch {
      const errorMsg = 'Failed to load tafsir. Check your connection.';
      setTafsirText(prev => new Map(prev).set(ayahNumber, errorMsg));
    } finally {
      setTafsirLoading(false);
    }
  };

  const handleComprehension = async (ayah: Ayah, level: ComprehensionLevel) => {
    if (!surah) return;
    const entry = {
      id: `comp:${params.surahNumber}:${ayah.numberInSurah}`,
      surahNumber: params.surahNumber,
      surahName: surah.englishName,
      ayahNumber: ayah.numberInSurah,
      arabicText: ayah.text,
      translation: ayah.translation ?? '',
      level,
      savedAt: Date.now(),
    };
    await saveComprehension(entry).catch(() => {});
    setComprehensionMap(prev => new Map(prev).set(ayah.numberInSurah, level));
    setCompPromptForAyah(null);
    Haptics.impact(level === 'yes' ? 'light' : 'medium');
  };

  if (isLoading) return <ScreenContainer><LoadingView /></ScreenContainer>;
  if (error || !surah) return <ScreenContainer><ErrorView message={error ?? 'Not found'} onRetry={load} /></ScreenContainer>;

  const renderHeader = (
    <LinearGradient colors={gradients.heroNavy} style={styles.header}>
      <Image source={IMG_ISLAMIC_BG} style={styles.headerBgPattern} resizeMode="cover" />
      <View style={styles.headerDecor} />
      <BackButton style={styles.headerBackBtn} />
      {/* Settings + WBW toggle */}
      <View style={styles.headerBtns}>
        <TouchableOpacity
          style={styles.headerIconBtn}
          onPress={() => {
            const next = translationLang === 'en.sahih' ? 'ur.ahmedali' : translationLang === 'ur.ahmedali' ? 'none' : 'en.sahih';
            setTranslationLang(next as Parameters<typeof setTranslationLang>[0]);
          }}
        >
          <Text style={[styles.wbwBtnText, { fontSize: 10, letterSpacing: 0 }]}>
            {translationLang === 'none' ? 'AR' : translationLang === 'ur.ahmedali' ? 'UR' : 'EN'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.headerIconBtn, wordByWordEnabled && styles.headerIconBtnActive]}
          onPress={() => setWordByWordEnabled(!wordByWordEnabled)}
        >
          <Text style={[styles.wbwBtnText, wordByWordEnabled && { color: colors.navy[900] }]}>Aa</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.settingsBtn, repeatMode !== 'off' && styles.headerIconBtnActive]}
          onPress={cycleRepeatMode}
        >
          <Ionicons
            name={repeatMode === 'surah' ? 'repeat' : 'repeat'}
            size={16}
            color={repeatMode !== 'off' ? colors.navy[900] : colors.gold[400]}
          />
          {repeatMode === 'verse' && (
            <Text style={[styles.wbwBtnText, { color: colors.navy[900], fontSize: 9 }]}>1</Text>
          )}
        </TouchableOpacity>
        <TouchableOpacity style={styles.settingsBtn} onPress={() => setReciterOpen(true)}>
          <Ionicons name="mic-outline" size={16} color={colors.gold[400]} />
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
    <View style={{ flex: 1, backgroundColor: bg }}>
      {/* Reciter Picker Modal */}
      <Modal visible={reciterOpen} transparent animationType="slide" onRequestClose={() => setReciterOpen(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setReciterOpen(false)}>
          <Pressable style={[styles.reciterSheet, { backgroundColor: surface }]} onPress={() => {}}>
            <View style={[styles.reciterSheetHandle, { backgroundColor: border }]} />
            <Text style={[styles.reciterSheetTitle, { color: textPrimary }]}>Choose Reciter</Text>
            {RECITERS.map(r => {
              const isSelected = r.id === selectedReciterId;
              return (
                <TouchableOpacity
                  key={r.id}
                  style={[
                    styles.reciterRow,
                    {
                      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.03)' : colors.parchment[50],
                      borderColor: border,
                    },
                    isSelected && [
                      styles.reciterRowActive,
                      {
                        borderColor: colors.gold[400],
                        backgroundColor: isDark ? 'rgba(212,169,62,0.1)' : colors.gold[50],
                      }
                    ]
                  ]}
                  onPress={() => { setReciter(r.id); setReciterOpen(false); }}
                  activeOpacity={0.75}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.reciterName, { color: textPrimary }, isSelected && { color: colors.gold[400] }]}>{r.name}</Text>
                    <Text style={[styles.reciterMeta, { color: textSecondary }]}>{r.arabicName} · {r.style}</Text>
                  </View>
                  {isSelected && <Ionicons name="checkmark-circle" size={22} color={colors.gold[400]} />}
                </TouchableOpacity>
              );
            })}
          </Pressable>
        </Pressable>
      </Modal>

      <ScreenContainer noPadding>
        <ReaderSettingsPanel visible={settingsOpen} onClose={() => setSettingsOpen(false)} hideTranslation={readingMode === 'flowing'} />
        {/* Reading progress bar */}
        {surah && readingMode === 'cards' && (
          <View style={styles.progressBarTrack}>
            <View style={[styles.progressBarFill, { width: `${Math.max(2, (readProgressAyah / surah.numberOfAyahs) * 100)}%` as any }]} />
          </View>
        )}
        {readingMode === 'flowing' ? (
          <MushafReader surah={surah} surahNumber={params.surahNumber} onClose={() => navigation.goBack()} />
        ) : (
          <FlashList
            ref={listRef}
            data={surah.ayahs}
            keyExtractor={item => String(item.numberInSurah)}
            style={{ backgroundColor: bg }}
            contentContainerStyle={[styles.list, { paddingBottom: spacing.xxxl + miniPlayerPad }]}
            estimatedItemSize={250}
            ListHeaderComponent={renderHeader}
            onViewableItemsChanged={onViewableItemsChanged}
            viewabilityConfig={{ itemVisiblePercentThreshold: 40 }}
          renderItem={({ item }) => {
            const wbwAyah = wordData.get(item.numberInSurah);
            const ayahIdx = surah?.ayahs.findIndex(a => a.numberInSurah === item.numberInSurah) ?? -1;
            const isActiveAyah = currentSurah?.number === params.surahNumber && currentAyahIndex === ayahIdx;
            const isPlayingThisAyah = isActiveAyah && isPlaying;

            return (
              <Pressable
                onLongPress={() => { Haptics.impact('light'); setActionSheetAyah(item); }}
                delayLongPress={280}
              >
              <View style={[
                styles.ayahCard,
                { backgroundColor: surface },
                (isPlayingThisAyah || isActiveAyah) && [
                  styles.ayahCardActive,
                  { backgroundColor: isDark ? 'rgba(212,169,62,0.1)' : colors.gold[50] }
                ]
              ]}>
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
                    <TouchableOpacity onPress={() => setCompPromptForAyah(compPromptForAyah === item.numberInSurah ? null : item.numberInSurah)}>
                      <Ionicons
                        name={comprehensionMap.has(item.numberInSurah) ? 'school' : 'school-outline'}
                        size={20}
                        color={comprehensionMap.get(item.numberInSurah) === 'yes' ? '#4ADE80' : comprehensionMap.get(item.numberInSurah) === 'no' ? '#F87171' : comprehensionMap.has(item.numberInSurah) ? colors.gold[400] : colors.parchment[400]}
                      />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleFetchTafsir(item.numberInSurah)}>
                      <Ionicons
                        name={tafsirForAyah === item.numberInSurah ? 'book' : 'book-outline'}
                        size={20}
                        color={tafsirForAyah === item.numberInSurah ? colors.gold[500] : colors.parchment[400]}
                      />
                    </TouchableOpacity>
                    <BookmarkButton
                      isBookmarked={bookmarkedAyahs.has(item.numberInSurah)}
                      onToggle={() => handleToggleBookmark(item)}
                    />
                  </View>
                </View>

                {/* Verse number diamond separator */}
                <View style={styles.verseSepRow}>
                  <View style={[styles.verseSepLine, { backgroundColor: border }]} />
                  <Text style={[styles.verseSepNum, { fontFamily: 'Amiri_400Regular' }]}>
                    {`◆${item.numberInSurah}`}
                  </Text>
                  <View style={[styles.verseSepLine, { backgroundColor: border }]} />
                </View>

                {/* Arabic text: word-by-word chips or flowing */}
                {wordByWordEnabled && wbwAyah && wbwAyah.words.length > 0 ? (
                  <View style={styles.wbwRow}>
                    {[...wbwAyah.words].reverse().map((w, wi) => (
                      <TouchableOpacity
                        key={wi}
                        style={[
                          styles.wordChip,
                          {
                            backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : colors.parchment[50],
                            borderColor: border,
                          }
                        ]}
                        onPress={() => handleWordTap(w, item.numberInSurah, wi)}
                        activeOpacity={0.75}
                      >
                        <Text style={[styles.wordChipArabic, { fontSize, fontFamily: 'Amiri_400Regular', color: textPrimary }]}>
                          {w.arabic}
                        </Text>
                        {w.translation ? (
                          <Text style={[styles.wordChipGloss, { color: textSecondary }]} numberOfLines={1}>{w.translation}</Text>
                        ) : null}
                      </TouchableOpacity>
                    ))}
                  </View>
                ) : (
                  <Text style={[styles.arabicText, { fontSize, lineHeight: fontSize * 2, fontFamily: 'Amiri_400Regular', color: textPrimary }]}>
                    {item.numberInSurah === 1 && params.surahNumber !== 1 && params.surahNumber !== 9
                      ? item.text.replace(/^بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ ?/g, '').replace(/^بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ ?/g, '').trim()
                      : item.text}
                  </Text>
                )}

                {item.translation ? (
                  <View style={[styles.translationWrap, { borderTopColor: border }]}>
                    <Text style={[
                      styles.translation,
                      { color: textSecondary },
                      translationLang === 'ur.ahmedali' && [styles.translationUrdu, { color: textPrimary }],
                    ]}>
                      {item.translation}
                    </Text>
                  </View>
                ) : null}

                {compPromptForAyah === item.numberInSurah && (
                  <View style={[styles.compPrompt, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.03)' : colors.parchment[50], borderColor: border }]}>
                    <Text style={[styles.compPromptLabel, { color: textSecondary }]}>Did you understand this ayah?</Text>
                    <View style={styles.compBtns}>
                      {([['yes', '✓ Yes', '#4ADE80'], ['partially', '~ Partially', colors.gold[400]], ['no', '✗ No', '#F87171']] as [ComprehensionLevel, string, string][]).map(([lvl, label, color]) => (
                        <TouchableOpacity
                          key={lvl}
                          style={[styles.compBtn, { borderColor: color + '55', backgroundColor: color + '18' }]}
                          onPress={() => handleComprehension(item, lvl)}
                          activeOpacity={0.8}
                        >
                          <Text style={[styles.compBtnText, { color }]}>{label}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                )}

                {tafsirForAyah === item.numberInSurah && (
                  <View style={[styles.tafsirPanel, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.03)' : colors.parchment[50], borderColor: isDark ? 'rgba(212,169,62,0.3)' : colors.gold[200] }]}>
                    <View style={styles.tafsirHeader}>
                      <Ionicons name="book-outline" size={14} color={colors.gold[600]} />
                      <Text style={styles.tafsirTitle}>Tafsir Ibn Kathir</Text>
                      <TouchableOpacity onPress={() => setTafsirForAyah(null)} style={{ marginLeft: 'auto' }}>
                        <Ionicons name="close" size={16} color={textSecondary} />
                      </TouchableOpacity>
                    </View>
                    {tafsirLoading && !tafsirText.has(item.numberInSurah) ? (
                      <View style={styles.tafsirLoading}>
                        <ActivityIndicator size="small" color={colors.gold[500]} />
                        <Text style={[styles.tafsirLoadingText, { color: textSecondary }]}>Loading tafsir…</Text>
                      </View>
                    ) : (
                      <ScrollView style={styles.tafsirScroll} nestedScrollEnabled>
                        <Text style={[styles.tafsirBody, { color: textSecondary }]}>
                          {tafsirText.get(item.numberInSurah) ?? ''}
                        </Text>
                      </ScrollView>
                    )}
                  </View>
                )}
              </View>
              </Pressable>
            );
          }}
        />
        )}
      </ScreenContainer>

      {/* Verse action sheet — long-press on any ayah */}
      <Modal visible={!!actionSheetAyah} transparent animationType="fade" onRequestClose={() => setActionSheetAyah(null)}>
        <Pressable style={styles.modalOverlay} onPress={() => setActionSheetAyah(null)}>
          <Pressable style={[styles.actionSheet, { backgroundColor: surface }]} onPress={() => {}}>
            <View style={[styles.reciterSheetHandle, { backgroundColor: border }]} />
            <Text style={[styles.actionSheetTitle, { color: textPrimary }]}>
              {actionSheetAyah ? `Ayah ${actionSheetAyah.numberInSurah}` : ''}
            </Text>
            <View style={styles.actionSheetGrid}>
              <TouchableOpacity
                style={[
                  styles.actionSheetItem,
                  {
                    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.03)' : colors.parchment[50],
                    borderColor: border,
                  }
                ]}
                onPress={() => { if (actionSheetAyah) handlePlayFromHere(actionSheetAyah); setActionSheetAyah(null); }}
              >
                <Ionicons name="play-circle-outline" size={22} color={colors.gold[600]} />
                <Text style={[styles.actionSheetLabel, { color: textSecondary }]}>Play from here</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.actionSheetItem,
                  {
                    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.03)' : colors.parchment[50],
                    borderColor: border,
                  }
                ]}
                onPress={() => { if (actionSheetAyah) handleToggleBookmark(actionSheetAyah); setActionSheetAyah(null); }}
              >
                <Ionicons
                  name={actionSheetAyah && bookmarkedAyahs.has(actionSheetAyah.numberInSurah) ? 'bookmark' : 'bookmark-outline'}
                  size={22}
                  color={colors.gold[600]}
                />
                <Text style={[styles.actionSheetLabel, { color: textSecondary }]}>Bookmark</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.actionSheetItem,
                  {
                    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.03)' : colors.parchment[50],
                    borderColor: border,
                  }
                ]}
                onPress={() => { if (actionSheetAyah) handleCopyAyah(actionSheetAyah); }}
              >
                <Ionicons name={copiedFeedback ? 'checkmark-circle' : 'copy-outline'} size={22} color={colors.gold[600]} />
                <Text style={[styles.actionSheetLabel, { color: textSecondary }]}>{copiedFeedback ? 'Copied!' : 'Copy'}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.actionSheetItem,
                  {
                    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.03)' : colors.parchment[50],
                    borderColor: border,
                  }
                ]}
                onPress={() => { if (actionSheetAyah) handleShareAyah(actionSheetAyah); setActionSheetAyah(null); }}
              >
                <Ionicons name="share-social-outline" size={22} color={colors.gold[600]} />
                <Text style={[styles.actionSheetLabel, { color: textSecondary }]}>Share</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.actionSheetItem,
                  {
                    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.03)' : colors.parchment[50],
                    borderColor: border,
                  }
                ]}
                onPress={() => { if (actionSheetAyah) handleFetchTafsir(actionSheetAyah.numberInSurah); setActionSheetAyah(null); }}
              >
                <Ionicons name="book-outline" size={22} color={colors.gold[600]} />
                <Text style={[styles.actionSheetLabel, { color: textSecondary }]}>Tafsir</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

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
  progressBarTrack: { height: 2, backgroundColor: 'rgba(212,169,62,0.12)' },
  progressBarFill: { height: 2, backgroundColor: colors.gold[400] },
  header: {
    paddingTop: 52, paddingBottom: spacing.lg,
    paddingHorizontal: spacing.xl, alignItems: 'center',
    marginBottom: spacing.md, overflow: 'hidden',
    gap: 2,
  },
  headerBgPattern: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, width: '100%', height: '100%', opacity: 0.06 },
  headerDecor: {
    position: 'absolute', right: -60, top: -60,
    width: 220, height: 220, borderRadius: 110,
    borderWidth: 1, borderColor: 'rgba(212,169,62,0.1)',
  },
  headerBackBtn: {
    position: 'absolute', top: spacing.md + spacing.lg, left: spacing.md,
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
  arabicTitle: { fontSize: 34, color: colors.gold[300], lineHeight: 48 },
  englishTitle: { ...typography.heading, color: colors.white },
  meaning: { ...typography.caption, color: 'rgba(255,255,255,0.4)', marginBottom: spacing.sm },
  pills: {
    flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.sm,
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
  ayahCardActive: {
    borderWidth: 1.5,
    borderColor: colors.gold[400],
    backgroundColor: colors.gold[50],
  },
  ayahTop: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: spacing.sm,
  },
  ayahBadge: {
    width: 34, height: 34, borderRadius: radius.pill,
    backgroundColor: colors.navy[900],
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: colors.gold[400],
    ...shadow.sm,
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
  compPrompt: {
    marginTop: spacing.sm, backgroundColor: colors.parchment[50],
    borderRadius: radius.sm, padding: spacing.md, gap: spacing.sm,
    borderWidth: 1, borderColor: colors.parchment[200],
  },
  compPromptLabel: { fontSize: 12, color: colors.parchment[600], fontWeight: '600', textAlign: 'center' },
  compBtns: { flexDirection: 'row', gap: spacing.sm },
  compBtn: { flex: 1, borderRadius: radius.sm, borderWidth: 1, paddingVertical: spacing.sm, alignItems: 'center' },
  compBtnText: { fontSize: 12, fontWeight: '700' },

  // Tafsir panel
  tafsirPanel: {
    marginTop: spacing.sm, backgroundColor: colors.parchment[50],
    borderRadius: radius.sm, padding: spacing.md,
    borderWidth: 1, borderColor: colors.gold[200],
    gap: spacing.sm,
  },
  tafsirHeader: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.xs,
  },
  tafsirTitle: { fontSize: 12, color: colors.gold[700], fontWeight: '700' },
  tafsirLoading: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  tafsirLoadingText: { ...typography.caption, color: colors.parchment[500] },
  tafsirScroll: { maxHeight: 200 },
  tafsirBody: {
    ...typography.body, color: colors.parchment[800], lineHeight: 24,
  },

  // Reciter picker modal
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end',
  },
  reciterSheet: {
    backgroundColor: colors.white, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl,
    paddingTop: spacing.sm, paddingBottom: spacing.xxxl, paddingHorizontal: spacing.lg,
  },
  reciterSheetHandle: {
    width: 40, height: 4, borderRadius: 2, backgroundColor: colors.parchment[200],
    alignSelf: 'center', marginBottom: spacing.lg,
  },
  reciterSheetTitle: { ...typography.heading, color: colors.navy[900], marginBottom: spacing.md },
  reciterRow: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.md,
    paddingHorizontal: spacing.md, borderRadius: radius.md,
    borderWidth: 1, borderColor: colors.parchment[100], marginBottom: spacing.sm,
    backgroundColor: colors.parchment[50],
  },
  reciterRowActive: {
    borderColor: colors.gold[300], backgroundColor: colors.gold[50],
  },
  reciterName: { ...typography.bodyMedium, color: colors.navy[900] },
  reciterMeta: { ...typography.caption, color: colors.parchment[500], marginTop: 2 },

  // Verse action sheet
  actionSheet: {
    backgroundColor: colors.white, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl,
    paddingTop: spacing.sm, paddingBottom: spacing.xxxl, paddingHorizontal: spacing.lg,
  },
  actionSheetTitle: {
    ...typography.heading, color: colors.navy[900], textAlign: 'center', marginBottom: spacing.lg,
  },
  actionSheetGrid: {
    flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between',
  },
  actionSheetItem: {
    width: '30%', alignItems: 'center', gap: spacing.xs,
    paddingVertical: spacing.md, marginBottom: spacing.sm,
    backgroundColor: colors.parchment[50], borderRadius: radius.md,
    borderWidth: 1, borderColor: colors.parchment[100],
  },
  actionSheetLabel: { fontSize: 11, color: colors.parchment[700], fontWeight: '600', textAlign: 'center' },
});
