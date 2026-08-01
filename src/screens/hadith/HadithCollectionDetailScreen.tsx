import React, { useCallback, useEffect, useState } from 'react';
import { FlatList, SectionList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';import { useRoute, RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { LoadingView, ErrorView } from '../../components/common/AsyncStateView';
import { HadithCard } from '../../components/hadith/HadithCard';
import { ScholarNotesPanel } from '../../components/hadith/ScholarNotesPanel';
import { ContextualAssistant } from '../../components/assistant/ContextualAssistant';
import { CHAPTER_SCHOLAR_NOTES } from '../../data/hadithGrades';
import { fetchHadithCollectionDetail, HadithChapter, HadithCollectionWithChapters } from '../../services/api/hadithApi';
import { listBookmarks, addBookmark, removeBookmark } from '../../services/db/bookmarksRepo';
import { setHadithProgress } from '../../services/db/progressRepo';
import { colors, radius, shadow, spacing, typography } from '../../theme';
import type { RootStackParamList } from '../../navigation/types';

type RouteType = RouteProp<RootStackParamList, 'HadithCollectionDetail'>;
type ViewMode = 'chapters' | 'chapter';

export function HadithCollectionDetailScreen() {
  const { params } = useRoute<RouteType>();
  const [collection, setCollection] = useState<HadithCollectionWithChapters | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('chapters');
  const [selectedChapter, setSelectedChapter] = useState<HadithChapter | null>(null);
  const [bookmarkedHadiths, setBookmarkedHadiths] = useState<Set<number>>(new Set());
  const [assistantOpen, setAssistantOpen] = useState(false);

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
      <ScreenContainer noPadding>
        <FlatList
          data={collection.chapters}
          keyExtractor={item => String(item.bookNumber)}
          contentContainerStyle={styles.list}
          ListHeaderComponent={
            <View style={styles.collectionHeader}>
              <Text style={styles.collectionName}>{collection.name}</Text>
              <Text style={styles.collectionMeta}>
                {collection.chapters.length} chapters · {collection.hadiths.length} hadiths
              </Text>
            </View>
          }
          renderItem={({ item, index }) => (
            <TouchableOpacity
              style={styles.chapterRow}
              onPress={() => { setSelectedChapter(item); setViewMode('chapter'); }}
              activeOpacity={0.75}
            >
              <View style={styles.chapterIndex}>
                <Text style={styles.chapterIndexText}>{index + 1}</Text>
              </View>
              <View style={styles.chapterInfo}>
                <Text style={styles.chapterName}>{item.name}</Text>
                <Text style={styles.chapterMeta}>{item.hadiths.length} hadiths</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={colors.parchment[400]} />
            </TouchableOpacity>
          )}
        />
      </ScreenContainer>
    );
  }

  // Individual chapter view
  const scholarNotes = CHAPTER_SCHOLAR_NOTES[selectedChapter?.name ?? ''] ?? [];
  return (
    <View style={{ flex: 1 }}>
      <ScreenContainer noPadding>
        <FlatList
          data={selectedChapter!.hadiths}
        keyExtractor={item => String(item.hadithNumber)}
        contentContainerStyle={styles.list}
        initialNumToRender={8}
        maxToRenderPerBatch={8}
        windowSize={5}
        removeClippedSubviews
        ListHeaderComponent={
          <View>
            <TouchableOpacity
              style={styles.backRow}
              onPress={() => setViewMode('chapters')}
            >
              <Ionicons name="chevron-back" size={18} color={colors.navy[700]} />
              <Text style={styles.backText}>All Chapters</Text>
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
    </View>
  );
}

const styles = StyleSheet.create({
  list: { paddingBottom: spacing.xxxl },
  collectionHeader: {
    backgroundColor: colors.navy[900],
    padding: spacing.xl,
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
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
});
