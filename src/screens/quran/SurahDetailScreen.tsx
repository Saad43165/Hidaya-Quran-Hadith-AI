import React, { useCallback, useEffect, useState } from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';import { useRoute, RouteProp } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { ContextualAssistant } from '../../components/assistant/ContextualAssistant';
import { LoadingView, ErrorView } from '../../components/common/AsyncStateView';
import { BookmarkButton } from '../../components/bookmarks/BookmarkButton';
import { ReaderSettingsPanel } from '../../components/quran/ReaderSettingsPanel';
import { fetchSurahDetail } from '../../services/api/quranApi';
import { playVerse, stopCurrentAudio } from '../../services/audio/quranAudio';
import { listBookmarks, addBookmark, removeBookmark } from '../../services/db/bookmarksRepo';
import { setQuranProgress } from '../../services/db/progressRepo';
import { useQuranStore } from '../../store/useQuranStore';
import { SurahDetail, Ayah } from '../../types/models';
import { colors, gradients, radius, shadow, spacing, typography } from '../../theme';
import type { RootStackParamList } from '../../navigation/types';

type SurahDetailRoute = RouteProp<RootStackParamList, 'SurahDetail'>;

export function SurahDetailScreen() {
  const { params } = useRoute<SurahDetailRoute>();
  const { fontSize, translationLang, hydrate } = useQuranStore();
  const [surah, setSurah] = useState<SurahDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [playingAyah, setPlayingAyah] = useState<number | null>(null);
  const [bookmarkedAyahs, setBookmarkedAyahs] = useState<Set<number>>(new Set());
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [assistantOpen, setAssistantOpen] = useState(false);

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
    return () => { stopCurrentAudio().catch(() => {}); };
  }, [load, loadBookmarks, hydrate]);

  // Reload when settings change
  useEffect(() => { if (surah) load(); }, [translationLang]);

  const handleAudio = async (ayah: Ayah) => {
    if (playingAyah === ayah.numberInSurah) {
      await stopCurrentAudio(); setPlayingAyah(null); return;
    }
    if (!ayah.number) return;
    setPlayingAyah(ayah.numberInSurah);
    try { await playVerse(ayah.number); }
    catch { /* silent fail offline */ }
    finally { setPlayingAyah(null); }
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

  if (isLoading) return <ScreenContainer><LoadingView /></ScreenContainer>;
  if (error || !surah) return <ScreenContainer><ErrorView message={error ?? 'Not found'} onRetry={load} /></ScreenContainer>;

  return (
    <View style={{ flex: 1 }}>
      <ScreenContainer noPadding>
        <ReaderSettingsPanel visible={settingsOpen} onClose={() => setSettingsOpen(false)} />
      <FlatList
        data={surah.ayahs}
        keyExtractor={item => String(item.numberInSurah)}
        contentContainerStyle={styles.list}
        initialNumToRender={5}
        maxToRenderPerBatch={5}
        windowSize={5}
        removeClippedSubviews
        ListHeaderComponent={
          <LinearGradient colors={gradients.heroNavy} style={styles.header}>
            <View style={styles.headerDecor} />
            {/* Settings button */}
            <TouchableOpacity style={styles.settingsBtn} onPress={() => setSettingsOpen(true)}>
              <Ionicons name="text" size={16} color={colors.gold[400]} />
              <Ionicons name="settings-outline" size={14} color="rgba(255,255,255,0.4)" />
            </TouchableOpacity>
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
        }
        renderItem={({ item }) => (
          <View style={styles.ayahCard}>
            <View style={styles.ayahTop}>
              <View style={styles.ayahBadge}>
                <Text style={styles.ayahBadgeText}>{item.numberInSurah}</Text>
              </View>
              <View style={styles.ayahActions}>
                <TouchableOpacity onPress={() => handleAudio(item)}>
                  <Ionicons
                    name={playingAyah === item.numberInSurah ? 'pause-circle' : 'play-circle-outline'}
                    size={26}
                    color={playingAyah === item.numberInSurah ? colors.gold[500] : colors.parchment[400]}
                  />
                </TouchableOpacity>
                <BookmarkButton
                  isBookmarked={bookmarkedAyahs.has(item.numberInSurah)}
                  onToggle={() => handleToggleBookmark(item)}
                />
              </View>
            </View>
            <Text style={[styles.arabicText, { fontSize, lineHeight: fontSize * 2, fontFamily: 'Amiri_400Regular' }]}>
              {item.text}
            </Text>
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
        )}
      />
    </ScreenContainer>
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
    paddingTop: spacing.xxl, paddingBottom: spacing.xxl,
    paddingHorizontal: spacing.xl, alignItems: 'center',
    marginBottom: spacing.md, overflow: 'hidden',
  },
  headerDecor: {
    position: 'absolute', right: -60, top: -60,
    width: 200, height: 200, borderRadius: 100,
    borderWidth: 1, borderColor: 'rgba(212,169,62,0.1)',
  },
  settingsBtn: {
    position: 'absolute', top: spacing.md, right: spacing.md,
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: radius.pill,
    paddingHorizontal: spacing.md, paddingVertical: spacing.xs,
  },
  arabicTitle: { fontSize: 42, color: colors.gold[300], marginBottom: spacing.xs },
  englishTitle: { ...typography.displayMd, color: colors.white },
  meaning: { ...typography.body, color: 'rgba(255,255,255,0.45)', marginBottom: spacing.lg },
  pills: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.lg, flexWrap: 'wrap', justifyContent: 'center' },
  pill: {
    backgroundColor: 'rgba(212,169,62,0.18)', borderRadius: radius.pill,
    paddingHorizontal: spacing.md, paddingVertical: 4,
  },
  pillText: { ...typography.caption, color: colors.gold[300], fontWeight: '600' },
  bismillah: {
    fontSize: 22, color: 'rgba(255,255,255,0.85)',
    marginTop: spacing.md, textAlign: 'center',
  },
  ayahCard: {
    marginHorizontal: spacing.lg, marginBottom: spacing.md,
    backgroundColor: colors.white, borderRadius: radius.md,
    padding: spacing.lg, ...shadow.sm,
  },
  ayahTop: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: spacing.md,
  },
  ayahBadge: {
    width: 30, height: 30, borderRadius: radius.pill,
    backgroundColor: colors.gold[100],
    alignItems: 'center', justifyContent: 'center',
  },
  ayahBadgeText: { ...typography.caption, color: colors.gold[700], fontWeight: '700' },
  ayahActions: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  arabicText: {
    color: colors.navy[900], textAlign: 'right',
    writingDirection: 'rtl', marginBottom: spacing.md,
  },
  translationWrap: {
    borderTopWidth: 1, borderTopColor: colors.parchment[200], paddingTop: spacing.md,
  },
  translation: {
    ...typography.body, color: colors.parchment[800], lineHeight: 24,
  },
  translationUrdu: {
    fontFamily: 'Amiri_400Regular',
    fontSize: 17, lineHeight: 36,
    textAlign: 'right', writingDirection: 'rtl',
    color: colors.navy[900],
  },
});
