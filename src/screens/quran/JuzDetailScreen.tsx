import React, { useCallback, useEffect, useState } from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRoute, RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { LoadingView, ErrorView } from '../../components/common/AsyncStateView';
import { BookmarkButton } from '../../components/bookmarks/BookmarkButton';
import { fetchJuzDetail } from '../../services/api/quranApi';
import { playVerse, stopCurrentAudio } from '../../services/audio/quranAudio';
import { listBookmarks, addBookmark, removeBookmark } from '../../services/db/bookmarksRepo';
import { JUZ_LIST } from '../../data/juzData';
import { Ayah } from '../../types/models';
import { colors, radius, shadow, spacing, typography } from '../../theme';
import type { RootStackParamList } from '../../navigation/types';

type JuzDetailRoute = RouteProp<RootStackParamList, 'JuzDetail'>;

export function JuzDetailScreen() {
  const { params } = useRoute<JuzDetailRoute>();
  const juzInfo = JUZ_LIST[params.juzNumber - 1];
  const [ayahs, setAyahs] = useState<Ayah[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [playingVerse, setPlayingVerse] = useState<number | null>(null);
  const [bookmarkedAyahs, setBookmarkedAyahs] = useState<Set<number>>(new Set());

  const load = useCallback(async () => {
    setIsLoading(true); setError(null);
    try {
      const data = await fetchJuzDetail(params.juzNumber);
      setAyahs(data.ayahs);
    } catch { setError('Could not load Juz. Check your connection.'); }
    finally { setIsLoading(false); }
  }, [params.juzNumber]);

  useEffect(() => { load(); return () => { stopCurrentAudio().catch(() => {}); }; }, [load]);

  const handleAudio = async (ayah: Ayah) => {
    if (playingVerse === ayah.numberInSurah) {
      await stopCurrentAudio(); setPlayingVerse(null); return;
    }
    if (!ayah.number) return;
    setPlayingVerse(ayah.numberInSurah);
    try { await playVerse(ayah.number); }
    catch { /* audio not available offline */ }
    finally { setPlayingVerse(null); }
  };

  if (isLoading) return <ScreenContainer><LoadingView /></ScreenContainer>;
  if (error) return <ScreenContainer><ErrorView message={error} onRetry={load} /></ScreenContainer>;

  return (
    <ScreenContainer noPadding>
      <FlatList
        data={ayahs}
        keyExtractor={(_, i) => String(i)}
        contentContainerStyle={styles.list}
        initialNumToRender={8}
        maxToRenderPerBatch={8}
        windowSize={5}
        removeClippedSubviews
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.juzNumber}>Juz {params.juzNumber}</Text>
            <Text style={styles.juzArabic}>{juzInfo?.arabic}</Text>
            <Text style={styles.juzEnglish}>{juzInfo?.english}</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.ayahCard}>
            <View style={styles.ayahTop}>
              <View style={styles.ayahBadge}>
                <Text style={styles.ayahBadgeText}>{item.numberInSurah}</Text>
              </View>
              <View style={styles.ayahActions}>
                <TouchableOpacity onPress={() => handleAudio(item)} style={styles.audioBtn}>
                  <Ionicons
                    name={playingVerse === item.numberInSurah ? 'pause-circle' : 'play-circle'}
                    size={22}
                    color={colors.gold[600]}
                  />
                </TouchableOpacity>
                <BookmarkButton
                  isBookmarked={bookmarkedAyahs.has(item.numberInSurah)}
                  onToggle={() => {}}
                />
              </View>
            </View>
            <Text style={styles.arabicText}>{item.text}</Text>
            {item.translation ? <Text style={styles.translation}>{item.translation}</Text> : null}
          </View>
        )}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  list: { paddingBottom: spacing.xxxl },
  header: {
    backgroundColor: colors.navy[900],
    padding: spacing.xl,
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  juzNumber: { ...typography.label, color: colors.gold[500] },
  juzArabic: { fontSize: 28, color: colors.white },
  juzEnglish: { ...typography.subheading, color: 'rgba(255,255,255,0.5)' },
  ayahCard: {
    marginHorizontal: spacing.lg, marginBottom: spacing.md,
    backgroundColor: colors.white, borderRadius: radius.md,
    padding: spacing.lg, ...shadow.sm,
  },
  ayahTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  ayahBadge: {
    width: 28, height: 28, borderRadius: radius.pill,
    backgroundColor: colors.gold[100], alignItems: 'center', justifyContent: 'center',
  },
  ayahBadgeText: { ...typography.caption, color: colors.gold[700], fontWeight: '700' },
  ayahActions: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  audioBtn: { padding: 2 },
  arabicText: {
    fontSize: 24, lineHeight: 48, color: colors.navy[900],
    textAlign: 'right', writingDirection: 'rtl', marginBottom: spacing.md,
  },
  translation: {
    ...typography.body, color: colors.parchment[800], lineHeight: 24,
    borderTopWidth: 1, borderTopColor: colors.parchment[200], paddingTop: spacing.md,
  },
});
