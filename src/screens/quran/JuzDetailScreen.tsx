import React, { useCallback, useEffect, useState } from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRoute, RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { LoadingView, ErrorView } from '../../components/common/AsyncStateView';
import { BookmarkButton } from '../../components/bookmarks/BookmarkButton';
import { ReaderSettingsPanel } from '../../components/quran/ReaderSettingsPanel';
import { fetchJuzDetail } from '../../services/api/quranApi';
import { playVerse, stopCurrentAudio } from '../../services/audio/quranAudio';
import { listBookmarks, addBookmark, removeBookmark } from '../../services/db/bookmarksRepo';
import { useQuranStore } from '../../store/useQuranStore';
import { JUZ_LIST } from '../../data/juzData';
import { Ayah } from '../../types/models';
import { colors, radius, shadow, spacing, typography } from '../../theme';
import type { RootStackParamList } from '../../navigation/types';

type JuzDetailRoute = RouteProp<RootStackParamList, 'JuzDetail'>;

export function JuzDetailScreen() {
  const { params } = useRoute<JuzDetailRoute>();
  const juzInfo = JUZ_LIST[params.juzNumber - 1];
  const { fontSize, hydrate } = useQuranStore();
  const [ayahs, setAyahs] = useState<Ayah[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [playingVerse, setPlayingVerse] = useState<number | null>(null);
  const [bookmarkedAyahs, setBookmarkedAyahs] = useState<Set<string>>(new Set());
  const [settingsOpen, setSettingsOpen] = useState(false);

  const load = useCallback(async () => {
    setIsLoading(true); setError(null);
    try {
      const data = await fetchJuzDetail(params.juzNumber);
      setAyahs(data.ayahs);
    } catch { setError('Could not load Juz. Check your connection.'); }
    finally { setIsLoading(false); }
  }, [params.juzNumber]);

  const loadBookmarks = useCallback(async () => {
    const all = await listBookmarks();
    setBookmarkedAyahs(new Set(
      all.filter(b => b.type === 'ayah')
         .map(b => `${b.surahNumber}:${b.ayahNumber}`)
    ));
  }, []);

  useEffect(() => {
    hydrate();
    load();
    loadBookmarks();
    return () => { stopCurrentAudio().catch(() => {}); };
  }, [load, loadBookmarks, hydrate]);

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

  const handleToggleBookmark = async (ayah: Ayah) => {
    if (!ayah.surah) return;
    const surahNum = ayah.surah.number;
    const ayahNum = ayah.numberInSurah;
    const key = `${surahNum}:${ayahNum}`;
    const id = `ayah:${surahNum}:${ayahNum}`;

    if (bookmarkedAyahs.has(key)) {
      await removeBookmark(id);
      setBookmarkedAyahs(p => {
        const n = new Set(p);
        n.delete(key);
        return n;
      });
    } else {
      await addBookmark({
        id,
        type: 'ayah',
        surahNumber: surahNum,
        surahName: ayah.surah.englishName,
        ayahNumber: ayahNum,
        snippet: ayah.text,
      });
      setBookmarkedAyahs(p => new Set(p).add(key));
    }
  };

  if (isLoading) return <ScreenContainer><LoadingView /></ScreenContainer>;
  if (error) return <ScreenContainer><ErrorView message={error} onRetry={load} /></ScreenContainer>;

  return (
    <View style={{ flex: 1 }}>
      <ScreenContainer noPadding>
        <ReaderSettingsPanel visible={settingsOpen} onClose={() => setSettingsOpen(false)} />
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
              <TouchableOpacity style={styles.settingsBtn} onPress={() => setSettingsOpen(true)}>
                <Ionicons name="text" size={16} color={colors.gold[400]} />
                <Ionicons name="settings-outline" size={14} color="rgba(255,255,255,0.4)" />
              </TouchableOpacity>
              <Text style={styles.juzNumber}>Juz {params.juzNumber}</Text>
              <Text style={[styles.juzArabic, { fontFamily: 'Amiri_700Bold' }]}>{juzInfo?.arabic}</Text>
              <Text style={styles.juzEnglish}>{juzInfo?.english}</Text>
            </View>
          }
          renderItem={({ item }) => {
            const isBookmarked = item.surah
              ? bookmarkedAyahs.has(`${item.surah.number}:${item.numberInSurah}`)
              : false;

            return (
              <View style={styles.ayahCard}>
                <View style={styles.ayahTop}>
                  <View style={styles.ayahBadgeRow}>
                    <View style={styles.ayahBadge}>
                      <Text style={styles.ayahBadgeText}>{item.numberInSurah}</Text>
                    </View>
                    {item.surah && (
                      <Text style={styles.surahNameText}>
                        {item.surah.englishName}
                      </Text>
                    )}
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
                      isBookmarked={isBookmarked}
                      onToggle={() => handleToggleBookmark(item)}
                    />
                  </View>
                </View>
                <Text style={[styles.arabicText, { fontSize, lineHeight: fontSize * 2, fontFamily: 'Amiri_400Regular' }]}>
                  {item.text}
                </Text>
                {item.translation ? <Text style={styles.translation}>{item.translation}</Text> : null}
              </View>
            );
          }}
        />
      </ScreenContainer>
    </View>
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
    position: 'relative',
  },
  settingsBtn: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  juzNumber: { ...typography.label, color: colors.gold[500] },
  juzArabic: { fontSize: 28, color: colors.white },
  juzEnglish: { ...typography.subheading, color: 'rgba(255,255,255,0.5)' },
  ayahCard: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    backgroundColor: colors.white,
    borderRadius: radius.md,
    padding: spacing.lg,
    ...shadow.sm,
  },
  ayahTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  ayahBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  ayahBadge: {
    width: 28,
    height: 28,
    borderRadius: radius.pill,
    backgroundColor: colors.gold[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  ayahBadgeText: { ...typography.caption, color: colors.gold[700], fontWeight: '700' },
  surahNameText: { ...typography.bodySmall, color: colors.parchment[600], fontWeight: '600' },
  ayahActions: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  audioBtn: { padding: 2 },
  arabicText: {
    color: colors.navy[900],
    textAlign: 'right',
    writingDirection: 'rtl',
    marginBottom: spacing.md,
  },
  translation: {
    ...typography.body,
    color: colors.parchment[800],
    lineHeight: 24,
    borderTopWidth: 1,
    borderTopColor: colors.parchment[200],
    paddingTop: spacing.md,
  },
});
