import React, { useCallback, useEffect, useState } from 'react';
import { FlatList, Image, SectionList, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useRoute, RouteProp, useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import type { TabAndStackNavigation } from '../../navigation/types';
import { Ionicons } from '@expo/vector-icons';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { LoadingView, ErrorView } from '../../components/common/AsyncStateView';
import { HadithCard } from '../../components/hadith/HadithCard';
import { ScholarNotesPanel } from '../../components/hadith/ScholarNotesPanel';
import { ContextualAssistant } from '../../components/assistant/ContextualAssistant';
import { CHAPTER_SCHOLAR_NOTES } from '../../data/hadithGrades';
import { fetchHadithCollectionDetail, HadithChapter, HadithCollectionWithChapters } from '../../services/api/hadithApi';
import { BackButton } from '../../components/common/BackButton';
import { listBookmarks, addBookmark, removeBookmark } from '../../services/db/bookmarksRepo';
import { setHadithProgress } from '../../services/db/progressRepo';
import { useThemeStore } from '../../store/useThemeStore';
import { useMiniPlayerPadding } from '../../hooks/useMiniPlayerPadding';
import { colors, radius, shadow, spacing, typography } from '../../theme';
import { darkColors } from '../../theme/darkColors';
import type { RootStackParamList } from '../../navigation/types';

type RouteType = RouteProp<RootStackParamList, 'HadithCollectionDetail'>;
type ViewMode = 'chapters' | 'chapter';

export function HadithCollectionDetailScreen() {
  const { params } = useRoute<RouteType>();
  const navigation = useNavigation<TabAndStackNavigation>();
  const isDark = useThemeStore(s => s.isDark);
  const miniPlayerPad = useMiniPlayerPadding();

  const bg = isDark ? darkColors.background : colors.parchment[50];
  const cardBg = isDark ? darkColors.surface : colors.white;
  const textPrimary = isDark ? darkColors.text.primary : colors.parchment[950];
  const textSecondary = isDark ? darkColors.text.secondary : colors.parchment[500];

  const [collection, setCollection] = useState<HadithCollectionWithChapters | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('chapters');
  const [selectedChapter, setSelectedChapter] = useState<HadithChapter | null>(null);
  const [bookmarkedHadiths, setBookmarkedHadiths] = useState<Set<number>>(new Set());
  const [assistantOpen, setAssistantOpen] = useState(false);
  const [chapterFilter, setChapterFilter] = useState('');

  const bookmarkId = (n: number) => `hadith:${params.collectionId}:${n}`;

  const load = useCallback(async () => {
    setIsLoading(true); setError(null);
    try {
      const data = await fetchHadithCollectionDetail(params.collectionId);
      setCollection(data);
      setHadithProgress(params.collectionId, data.name).catch(() => {});
      if (params.initialHadithNumber) {
        const matchingChapter = data.chapters.find(ch =>
          ch.hadiths.some(h => h.hadithNumber === params.initialHadithNumber)
        );
        if (matchingChapter) {
          setSelectedChapter(matchingChapter);
          setViewMode('chapter');
        }
      }
    } catch { setError('Could not load collection. Check your connection.'); }
    finally { setIsLoading(false); }
  }, [params.collectionId, params.initialHadithNumber]);

  const loadBookmarks = useCallback(async () => {
    const all = await listBookmarks();
    setBookmarkedHadiths(new Set(
      all.filter(b => b.type === 'hadith' && b.collectionId === params.collectionId)
         .map(b => b.hadithNumber!)
    ));
  }, [params.collectionId]);

  useEffect(() => { load(); loadBookmarks(); }, [load, loadBookmarks]);

  const handleToggleBookmark = async (hadithNumber: number, text: string) => {
    const id = bookmarkId(hadithNumber);
    if (bookmarkedHadiths.has(hadithNumber)) {
      await removeBookmark(id);
      setBookmarkedHadiths(p => { const n = new Set(p); n.delete(hadithNumber); return n; });
    } else {
      await addBookmark({ id, type: 'hadith', collectionId: params.collectionId, collectionName: collection?.name, hadithNumber, snippet: text.slice(0, 140) });
      setBookmarkedHadiths(p => new Set(p).add(hadithNumber));
    }
  };

  if (isLoading) return <ScreenContainer><LoadingView message="Loading collection..." /></ScreenContainer>;
  if (error || !collection) return <ScreenContainer><ErrorView message={error ?? 'Not found'} onRetry={load} /></ScreenContainer>;

  // Chapter list view
  if (viewMode === 'chapters') {
    return (
      <View style={{ flex: 1 }}>
        <ScreenContainer noPadding>
          <FlatList
            data={chapterFilter ? collection.chapters.filter(c => c.name.toLowerCase().includes(chapterFilter.toLowerCase())) : collection.chapters}
            keyExtractor={item => String(item.bookNumber)}
            style={{ backgroundColor: bg }}
            contentContainerStyle={[styles.list, { paddingBottom: spacing.xxxl + miniPlayerPad }]}
            ListHeaderComponent={
              <>
                <View style={styles.collectionHeader}>
                  <Image source={require('../../../assets/images/islamicbackground.png')} style={styles.collectionHeaderBgPattern} resizeMode="cover" />
                  <BackButton style={styles.collectionHeaderBack} />
                  <Text style={styles.collectionName}>{collection.name}</Text>
                  <Text style={styles.collectionMeta}>
                    {collection.chapters.length} chapters · {collection.hadiths.length} hadiths
                  </Text>
                </View>
                <View style={[styles.filterRow, { backgroundColor: cardBg, borderColor: isDark ? 'rgba(255,255,255,0.1)' : colors.parchment[200] }]}>
                  <Ionicons name="search-outline" size={15} color={textSecondary} />
                  <TextInput
                    style={[styles.filterInput, { color: textPrimary }]}
                    value={chapterFilter}
                    onChangeText={setChapterFilter}
                    placeholder="Filter chapters..."
                    placeholderTextColor={isDark ? 'rgba(255,255,255,0.25)' : colors.parchment[400]}
                  />
                  {chapterFilter.length > 0 && (
                    <TouchableOpacity onPress={() => setChapterFilter('')}>
                      <Ionicons name="close-circle" size={15} color={textSecondary} />
                    </TouchableOpacity>
                  )}
                </View>
              </>
            }
            renderItem={({ item, index }) => (
              <TouchableOpacity
                style={[styles.chapterRow, { backgroundColor: cardBg }]}
                onPress={() => { setSelectedChapter(item); setViewMode('chapter'); }}
                activeOpacity={0.75}
              >
                <View style={[styles.chapterIndex, isDark && styles.chapterIndexDark]}>
                  <Text style={[styles.chapterIndexText, isDark && { color: colors.gold[400] }]}>{index + 1}</Text>
                </View>
                <View style={styles.chapterInfo}>
                  <Text style={[styles.chapterName, { color: textPrimary }]}>{item.name}</Text>
                  <Text style={[styles.chapterMeta, { color: textSecondary }]}>{item.hadiths.length} hadiths</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={colors.parchment[400]} />
              </TouchableOpacity>
            )}
          />
        </ScreenContainer>
        <TouchableOpacity
          style={styles.fab}
          onPress={() => navigation.navigate('MainTabs', { screen: 'Assistant' } as any)}
          activeOpacity={0.85}
        >
          <LinearGradient
            colors={[colors.gold[400], colors.gold[600]]}
            style={styles.fabGradient}
          >
            <Ionicons name="sparkles" size={24} color={colors.white} />
          </LinearGradient>
        </TouchableOpacity>
      </View>
    );
  }

  // Individual chapter view
  const scholarNotes = CHAPTER_SCHOLAR_NOTES[selectedChapter?.name ?? ''] ?? [];
  return (
    <View style={[{ flex: 1 }, isDark && { backgroundColor: bg }]}>
      <ScreenContainer noPadding>
        <FlatList
          data={selectedChapter!.hadiths}
        keyExtractor={item => String(item.hadithNumber)}
        style={{ backgroundColor: bg }}
        contentContainerStyle={styles.list}
        initialNumToRender={8}
        maxToRenderPerBatch={8}
        windowSize={5}
        removeClippedSubviews
        ListHeaderComponent={
          <View>
            <TouchableOpacity
              style={[styles.backRow, isDark && { backgroundColor: bg }]}
              onPress={() => setViewMode('chapters')}
            >
              <Ionicons name="chevron-back" size={18} color={isDark ? darkColors.text.secondary : colors.navy[700]} />
              <Text style={[styles.backText, { color: isDark ? darkColors.text.secondary : colors.navy[700] }]}>All Chapters</Text>
            </TouchableOpacity>
            <View style={styles.chapterHeader}>
              <Text style={styles.chapterHeaderName}>{selectedChapter!.name}</Text>
              <Text style={styles.chapterHeaderMeta}>
                {collection.name} · Chapter {selectedChapter!.bookNumber}
              </Text>
            </View>
          </View>
        }
        renderItem={({ item }) => (
          <HadithCard
            hadith={item}
            collectionId={params.collectionId}
            collectionName={collection.name}
            isBookmarked={bookmarkedHadiths.has(item.hadithNumber)}
            onToggleBookmark={() => handleToggleBookmark(item.hadithNumber, item.text)}
          />
        )}
      />
        {scholarNotes.length > 0 && (
          <ScholarNotesPanel chapterName={selectedChapter!.name} notes={scholarNotes} />
        )}
    </ScreenContainer>
      <ContextualAssistant
        context={{
          type: 'hadith',
          collectionName: collection?.name,
          chapterName: selectedChapter?.name,
        }}
        isOpen={assistantOpen}
        onToggle={() => setAssistantOpen(o => !o)}
      />
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('MainTabs', { screen: 'Assistant' } as any)}
        activeOpacity={0.85}
      >
        <LinearGradient
          colors={[colors.gold[400], colors.gold[600]]}
          style={styles.fabGradient}
        >
          <Ionicons name="sparkles" size={24} color={colors.white} />
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  list: { paddingBottom: spacing.xxxl },
  collectionHeader: {
    backgroundColor: colors.navy[900],
    paddingTop: 52, paddingHorizontal: spacing.xl, paddingBottom: spacing.xl,
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
    overflow: 'hidden',
  },
  collectionHeaderBack: { position: 'absolute', top: spacing.md + spacing.lg, left: spacing.md },
  collectionHeaderBgPattern: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, width: '100%', height: '100%', opacity: 0.07 },
  filterRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginHorizontal: spacing.lg, marginBottom: spacing.md, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: radius.md, borderWidth: 1 },
  filterInput: { flex: 1, ...typography.bodySmall },
  collectionName: { ...typography.displayMd, color: colors.gold[300], textAlign: 'center' },
  collectionMeta: { ...typography.caption, color: 'rgba(255,255,255,0.4)' },
  chapterRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.white, borderRadius: radius.md,
    padding: spacing.md, marginHorizontal: spacing.lg,
    marginBottom: spacing.sm, gap: spacing.md, ...shadow.sm,
  },
  chapterIndex: {
    width: 36, height: 36, borderRadius: radius.sm,
    backgroundColor: colors.gold[100],
    alignItems: 'center', justifyContent: 'center',
  },
  chapterIndexDark: {
    backgroundColor: 'rgba(212,169,62,0.15)',
  },
  chapterIndexText: { ...typography.subheading, color: colors.gold[700] },
  chapterInfo: { flex: 1 },
  chapterName: { ...typography.bodyMedium, color: colors.parchment[950] },
  chapterMeta: { ...typography.caption, color: colors.parchment[500], marginTop: 2 },
  backRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: spacing.lg, paddingVertical: spacing.md,
    gap: spacing.xs,
  },
  backText: { ...typography.bodySmall, color: colors.navy[700], fontWeight: '600' },
  chapterHeader: {
    backgroundColor: colors.navy[900],
    padding: spacing.xl, marginBottom: spacing.md, gap: spacing.xs,
  },
  chapterHeaderName: { ...typography.displayMd, color: colors.white },
  chapterHeaderMeta: { ...typography.caption, color: 'rgba(255,255,255,0.4)' },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    overflow: 'hidden',
    ...shadow.md,
  },
  fabGradient: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
