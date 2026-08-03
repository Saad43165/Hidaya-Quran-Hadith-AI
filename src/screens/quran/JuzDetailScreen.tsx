import React, { useCallback, useEffect, useState } from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View, ScrollView } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { LoadingView, ErrorView } from '../../components/common/AsyncStateView';
import { BookmarkButton } from '../../components/bookmarks/BookmarkButton';
import { ReaderSettingsPanel } from '../../components/quran/ReaderSettingsPanel';
import MushafReader from '../../components/quran/MushafReader';
import { fetchJuzDetail } from '../../services/api/quranApi';
import { useAudioStore } from '../../store/useAudioStore';
import { listBookmarks, addBookmark, removeBookmark } from '../../services/db/bookmarksRepo';
import { useQuranStore } from '../../store/useQuranStore';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useMiniPlayerPadding } from '../../hooks/useMiniPlayerPadding';
import { JUZ_LIST } from '../../data/juzData';
import { Ayah } from '../../types/models';
import { colors, radius, shadow, spacing, typography } from '../../theme';
import type { RootStackParamList } from '../../navigation/types';

type JuzDetailRoute = RouteProp<RootStackParamList, 'JuzDetail'>;

export function JuzDetailScreen() {
  const { params } = useRoute<JuzDetailRoute>();
  const navigation = useNavigation();
  const juzInfo = JUZ_LIST[params.juzNumber - 1];
  const { fontSize, hydrate } = useQuranStore();
  const [showMushaf, setShowMushaf] = useState(true);
  const miniPlayerPad = useMiniPlayerPadding();
  const { currentSurah, currentAyahIndex, isPlaying, play: playAudio, pause: pauseAudio, resume: resumeAudio } = useAudioStore();
  const { isDark, bg, surface, border, textPrimary, textSecondary } = useThemeColors();

  const [ayahs, setAyahs] = useState<Ayah[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
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
  }, [load, loadBookmarks, hydrate]);

  const handleAudio = async (ayah: Ayah) => {
    const index = ayahs.findIndex(a => a.number === ayah.number);
    if (index === -1) return;

    const dummySurah = {
      number: params.juzNumber * 1000,
      name: `Juz ${params.juzNumber}`,
      englishName: `Juz ${params.juzNumber}`,
      englishNameTranslation: '',
      revelationType: 'Meccan' as const,
      numberOfAyahs: ayahs.length,
      ayahs: ayahs,
    };

    if (currentSurah?.number === dummySurah.number && currentAyahIndex === index) {
      if (isPlaying) {
        pauseAudio();
      } else {
        resumeAudio();
      }
    } else {
      await playAudio(dummySurah, index);
    }
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

  const renderHeader = (
    <View style={styles.header}>
      <Image source={require('../../../assets/images/islamicbackground.png')} style={styles.headerBgPattern} resizeMode="cover" />
      <TouchableOpacity style={styles.settingsBtn} onPress={() => setSettingsOpen(true)}>
        <Ionicons name="text" size={16} color={colors.gold[400]} />
        <Ionicons name="settings-outline" size={14} color="rgba(255,255,255,0.4)" />
      </TouchableOpacity>
      <Text style={styles.juzNumber}>Para {params.juzNumber} / Juz {params.juzNumber}</Text>
      <Text style={[styles.juzArabic, { fontFamily: 'Amiri_700Bold' }]}>{juzInfo?.arabic}</Text>
      <Text style={styles.juzEnglish}>{juzInfo?.english}</Text>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: bg }}>
      <ScreenContainer noPadding>
        <ReaderSettingsPanel visible={settingsOpen} onClose={() => setSettingsOpen(false)} hideTranslation />
        {showMushaf ? (
          <>
            <MushafReader
              surah={{
                number: params.juzNumber * 1000,
                name: juzInfo?.arabic ?? `جزء ${params.juzNumber}` ,
                englishName: `Para ${params.juzNumber}` ,
                englishNameTranslation: juzInfo?.english ?? '',
                revelationType: 'Meccan',
                numberOfAyahs: ayahs.length,
                ayahs,
              }}
              surahNumber={params.juzNumber * 1000}
              onClose={() => navigation.goBack()}
            />
            <TouchableOpacity style={styles.floatSettingsBtn} onPress={() => setSettingsOpen(true)}>
              <Ionicons name="options-outline" size={18} color={colors.gold[400]} />
            </TouchableOpacity>
          </>
        ) : (
          <FlashList
            data={ayahs}
            keyExtractor={(_, i) => String(i)}
            style={{ backgroundColor: bg }}
            contentContainerStyle={[styles.list, { paddingBottom: spacing.xxxl + miniPlayerPad }]}
            estimatedItemSize={250}
            ListHeaderComponent={renderHeader}
            renderItem={({ item }) => {
              const isBookmarked = item.surah
                ? bookmarkedAyahs.has(`${item.surah.number}:${item.numberInSurah}`)
                : false;
              
              const itemIndex = ayahs.findIndex(a => a.number === item.number);
              const isPlayingThisAyah = currentSurah?.number === params.juzNumber * 1000 &&
                currentAyahIndex === itemIndex &&
                isPlaying;

              return (
                <View style={[styles.ayahCard, { backgroundColor: surface }]}>
                  <View style={styles.ayahTop}>
                    <View style={styles.ayahBadgeRow}>
                      <View style={[styles.ayahBadge, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : colors.gold[100] }]}>
                        <Text style={[styles.ayahBadgeText, { color: isDark ? colors.gold[300] : colors.gold[700] }]}>{item.numberInSurah}</Text>
                      </View>
                      {item.surah && (
                        <Text style={[styles.surahNameText, { color: textSecondary }]}>
                          {item.surah.englishName}
                        </Text>
                      )}
                    </View>
                    <View style={styles.ayahActions}>
                      <TouchableOpacity onPress={() => handleAudio(item)} style={styles.audioBtn}>
                        <Ionicons
                          name={isPlayingThisAyah ? 'pause-circle' : 'play-circle'}
                          size={22}
                          color={isPlayingThisAyah ? '#D62828' : colors.gold[600]}
                        />
                      </TouchableOpacity>
                      <BookmarkButton
                        isBookmarked={isBookmarked}
                        onToggle={() => handleToggleBookmark(item)}
                      />
                    </View>
                  </View>
                  <Text style={[styles.arabicText, { fontSize, lineHeight: fontSize * 2, fontFamily: 'Amiri_400Regular', color: textPrimary }]}>
                    {item.text}
                  </Text>
                  {item.translation ? (
                    <Text style={[styles.translation, { color: textSecondary, borderTopColor: border }]}>
                      {item.translation}
                    </Text>
                  ) : null}
                </View>
              );
            }}
          />
        )}
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
    overflow: 'hidden',
  },
  headerBgPattern: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, width: '100%', height: '100%', opacity: 0.07 },
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
  floatSettingsBtn: {
    position: 'absolute', bottom: 80, right: 16,
    backgroundColor: colors.navy[900],
    borderRadius: radius.pill, padding: 10,
    borderWidth: 1, borderColor: colors.gold[700],
    ...shadow.md,
  },
  flowingPage: {
    marginHorizontal: spacing.lg,
    borderRadius: radius.lg,
    padding: spacing.xl,
    borderWidth: 1,
    ...shadow.sm,
  },
  flowingText: {
    textAlign: 'justify',
    writingDirection: 'rtl',
    fontFamily: 'Amiri_400Regular',
  },
});
