import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewToken,
} from 'react-native';
import { PinchGestureHandler, PinchGestureHandlerGestureEvent, State } from 'react-native-gesture-handler';
import { SurahDetail, Ayah } from '../../types/models';
import { colors, spacing, typography } from '../../theme';
import { useAudioStore } from '../../store/useAudioStore';
import {
  fetchTafsir, TAFSIR_OPTIONS, TafsirResult, TafsirId,
} from '../../services/api/quranComApi';

// ─── Constants ────────────────────────────────────────────────────────────────

const AYAHS_PER_PAGE = 12;
const SCREEN_WIDTH = Dimensions.get('window').width;

// Mushaf-specific design tokens (not in the general theme)
const PARCHMENT_BG = '#F5ECD7';
const BORDER_GOLD = '#C8A96E';
const INK_COLOR = '#1A1008';

// Defined outside component to satisfy the React Native viewability rules
const VIEWABILITY_CONFIG = { viewAreaCoveragePercentThreshold: 51 };

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toArabicIndic(n: number): string {
  return String(n).replace(/[0-9]/g, (d) => '٠١٢٣٤٥٦٧٨٩'[parseInt(d, 10)]);
}

const BISMILLAH = 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ';

// ─── Sub-components ───────────────────────────────────────────────────────────

interface PageProps {
  ayahs: Ayah[];
  pageIndex: number;
  totalPages: number;
  surahArabicName: string;
  surahNumber: number;
  isFirstPage: boolean;
  activeAyahNumber: number | null;
  onAyahPress: (ayah: Ayah) => void;
  fontSize: number;
}

function MushafPage({
  ayahs,
  pageIndex,
  totalPages,
  surahArabicName,
  surahNumber,
  isFirstPage,
  activeAyahNumber,
  onAyahPress,
  fontSize,
}: PageProps) {
  const showBismillah = isFirstPage && surahNumber !== 1 && surahNumber !== 9;

  return (
    <View style={styles.pageWrapper}>
      {/* Outer decorative border */}
      <View style={styles.outerBorder}>
        {/* Corner flourishes */}
        <Text style={[styles.corner, styles.cornerTL]}>◆</Text>
        <Text style={[styles.corner, styles.cornerTR]}>◆</Text>
        <Text style={[styles.corner, styles.cornerBL]}>◆</Text>
        <Text style={[styles.corner, styles.cornerBR]}>◆</Text>

        {/* Inner dashed border */}
        <View style={styles.innerBorder}>
          {/* Surah header — first page only */}
          {isFirstPage && (
            <View style={styles.surahHeader}>
              <Text style={styles.surahArabicName}>{surahArabicName}</Text>
              {showBismillah && (
                <Text style={styles.bismillah}>{BISMILLAH}</Text>
              )}
              <View style={styles.headerDivider} />
            </View>
          )}

          {/* Arabic text block */}
          <ScrollView
            style={styles.textScroll}
            contentContainerStyle={styles.textScrollContent}
            showsVerticalScrollIndicator={false}
          >
            <Text style={[styles.arabicText, { fontSize, lineHeight: fontSize * 2.1 }]}>
              {ayahs.map((a) => {
                const isActive = activeAyahNumber === a.numberInSurah;
                return (
                  <Text
                    key={a.numberInSurah}
                    onPress={() => onAyahPress(a)}
                    style={isActive ? styles.arabicTextActive : undefined}
                  >
                    {a.text}
                    <Text style={styles.ayahMarker}>
                      {' '}۝{toArabicIndic(a.numberInSurah)}{' '}
                    </Text>
                  </Text>
                );
              })}
            </Text>
          </ScrollView>

          {/* Page number */}
          <Text style={styles.pageNumber}>
            — {toArabicIndic(pageIndex + 1)} —
          </Text>
        </View>
      </View>
    </View>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

interface Props {
  surah: SurahDetail;
  surahNumber: number;
  onClose: () => void;
}

export default function MushafReader({ surah, surahNumber, onClose }: Props) {
  // Build pages
  const pages: Ayah[][] = [];
  for (let i = 0; i < surah.ayahs.length; i += AYAHS_PER_PAGE) {
    pages.push(surah.ayahs.slice(i, i + AYAHS_PER_PAGE));
  }
  const totalPages = pages.length;

  const [currentPage, setCurrentPage] = useState(0);
  const [fontSize, setFontSize] = useState(22);
  const pinchBaseSize = useRef(22);

  // ── Tafsir drawer ─────────────────────────────────────────────────────────
  const [tafsirAyah, setTafsirAyah] = useState<Ayah | null>(null);
  const [tafsirId, setTafsirId] = useState<TafsirId>(169);
  const [tafsirResult, setTafsirResult] = useState<TafsirResult | null>(null);
  const [tafsirLoading, setTafsirLoading] = useState(false);
  const [tafsirError, setTafsirError] = useState<string | null>(null);
  const flatListRef = useRef<FlatList<Ayah[]>>(null);

  const onPinchGestureEvent = useCallback((e: PinchGestureHandlerGestureEvent) => {
    const next = Math.min(36, Math.max(14, pinchBaseSize.current * e.nativeEvent.scale));
    setFontSize(Math.round(next));
  }, []);
  const onPinchStateChange = useCallback((e: PinchGestureHandlerGestureEvent) => {
    if ((e.nativeEvent as any).state === State.END || (e.nativeEvent as any).state === State.CANCELLED) {
      pinchBaseSize.current = fontSize;
    }
  }, [fontSize]);
  const { currentSurah, currentAyahIndex, isPlaying, play: playAudio } = useAudioStore();

  const isThisSurahPlaying = currentSurah?.number === surahNumber && currentAyahIndex >= 0;
  const activeAyahNumber = isThisSurahPlaying ? surah.ayahs[currentAyahIndex]?.numberInSurah ?? null : null;
  const activePageIndex = isThisSurahPlaying ? Math.floor(currentAyahIndex / AYAHS_PER_PAGE) : -1;

  // Auto page-turn to keep the playing ayah in view
  useEffect(() => {
    if (isPlaying && activePageIndex >= 0 && activePageIndex !== currentPage) {
      flatListRef.current?.scrollToIndex({ index: activePageIndex, animated: true });
    }
  }, [isPlaying, activePageIndex, currentPage]);

  const loadTafsir = useCallback(async (ayah: Ayah, tid: TafsirId) => {
    setTafsirLoading(true);
    setTafsirError(null);
    setTafsirResult(null);
    try {
      const result = await fetchTafsir(surahNumber, ayah.numberInSurah, tid);
      setTafsirResult(result);
    } catch {
      setTafsirError('Failed to load tafsir. Check your connection.');
    } finally {
      setTafsirLoading(false);
    }
  }, [surahNumber]);

  const onAyahPress = useCallback((ayah: Ayah) => {
    // Short tap opens tafsir; audio is controlled via the floating player
    setTafsirAyah(ayah);
    loadTafsir(ayah, tafsirId);
  }, [loadTafsir, tafsirId]);

  const onTafsirIdChange = useCallback((tid: TafsirId) => {
    setTafsirId(tid);
    if (tafsirAyah) loadTafsir(tafsirAyah, tid);
  }, [tafsirAyah, loadTafsir]);

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0 && viewableItems[0].index !== null) {
        setCurrentPage(viewableItems[0].index);
      }
    },
  ).current;

  const viewabilityConfigCallbackPairs = useRef([
    { viewabilityConfig: VIEWABILITY_CONFIG, onViewableItemsChanged },
  ]).current;

  const goToPrev = useCallback(() => {
    if (currentPage > 0) {
      flatListRef.current?.scrollToIndex({ index: currentPage - 1, animated: true });
    }
  }, [currentPage]);

  const goToNext = useCallback(() => {
    if (currentPage < totalPages - 1) {
      flatListRef.current?.scrollToIndex({ index: currentPage + 1, animated: true });
    }
  }, [currentPage, totalPages]);

  const renderItem = useCallback(
    ({ item, index }: { item: Ayah[]; index: number }) => (
      <MushafPage
        ayahs={item}
        pageIndex={index}
        totalPages={totalPages}
        surahArabicName={surah.name}
        surahNumber={surahNumber}
        isFirstPage={index === 0}
        activeAyahNumber={item.some(a => a.numberInSurah === activeAyahNumber) ? activeAyahNumber : null}
        onAyahPress={onAyahPress}
        fontSize={fontSize}
      />
    ),
    [totalPages, surah.name, surahNumber, activeAyahNumber, onAyahPress, fontSize],
  );

  const keyExtractor = useCallback((_: Ayah[], index: number) => String(index), []);

  return (
    <View style={styles.container}>
      {/* Top bar */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
          <Text style={styles.closeBtnText}>✕  Back</Text>
        </TouchableOpacity>
        <Text style={styles.topBarTitle} numberOfLines={1}>
          {surah.englishName}
        </Text>
        <Text style={styles.fontSizeHint}>Aa {fontSize}</Text>
      </View>

      {/* Paginated Mushaf — pinch to resize text */}
      <PinchGestureHandler onGestureEvent={onPinchGestureEvent} onHandlerStateChange={onPinchStateChange}>
        <FlatList
          ref={flatListRef}
          data={pages}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          viewabilityConfigCallbackPairs={viewabilityConfigCallbackPairs}
          getItemLayout={(_, index) => ({
            length: SCREEN_WIDTH,
            offset: SCREEN_WIDTH * index,
            index,
          })}
          initialNumToRender={2}
          maxToRenderPerBatch={2}
          windowSize={3}
        />
      </PinchGestureHandler>

      {/* Tafsir Modal */}
      <Modal
        visible={tafsirAyah !== null}
        animationType="slide"
        transparent
        onRequestClose={() => setTafsirAyah(null)}
      >
        <View style={styles.tafsirOverlay}>
          <TouchableOpacity style={styles.tafsirDismiss} onPress={() => setTafsirAyah(null)} />
          <View style={styles.tafsirSheet}>
            {/* Handle */}
            <View style={styles.tafsirHandle} />

            {/* Ayah reference */}
            <View style={styles.tafsirHeader}>
              <Text style={styles.tafsirAyahRef}>
                Surah {surahNumber} : Ayah {tafsirAyah?.numberInSurah}
              </Text>
              <TouchableOpacity onPress={() => setTafsirAyah(null)}>
                <Text style={styles.tafsirClose}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Tafsir selector chips */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tafsirChips}>
              {TAFSIR_OPTIONS.map(opt => (
                <TouchableOpacity
                  key={opt.id}
                  style={[styles.tafsirChip, tafsirId === opt.id && styles.tafsirChipActive]}
                  onPress={() => onTafsirIdChange(opt.id)}
                >
                  <Text style={[styles.tafsirChipText, tafsirId === opt.id && styles.tafsirChipTextActive]}>
                    {opt.short}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Content */}
            <ScrollView style={styles.tafsirScroll} showsVerticalScrollIndicator={false}>
              {tafsirLoading && (
                <View style={styles.tafsirCenter}>
                  <ActivityIndicator color={BORDER_GOLD} />
                  <Text style={styles.tafsirLoadingText}>Loading tafsir…</Text>
                </View>
              )}
              {tafsirError && (
                <Text style={styles.tafsirError}>{tafsirError}</Text>
              )}
              {tafsirResult && !tafsirLoading && (
                <Text style={styles.tafsirText}>{tafsirResult.text}</Text>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Bottom navigation bar */}
      <View style={styles.navBar}>
        <Text style={styles.versesLabel}>◆ {surah.numberOfAyahs} verses</Text>

        <View style={styles.navControls}>
          <TouchableOpacity
            onPress={goToPrev}
            disabled={currentPage === 0}
            style={[styles.navBtn, currentPage === 0 && styles.navBtnDisabled]}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.navBtnText,
                currentPage === 0 && styles.navBtnTextDisabled,
              ]}
            >
              «  Prev
            </Text>
          </TouchableOpacity>

          <Text style={styles.pageIndicator}>
            Page {currentPage + 1} / {totalPages}
          </Text>

          <TouchableOpacity
            onPress={goToNext}
            disabled={currentPage === totalPages - 1}
            style={[
              styles.navBtn,
              currentPage === totalPages - 1 && styles.navBtnDisabled,
            ]}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.navBtnText,
                currentPage === totalPages - 1 && styles.navBtnTextDisabled,
              ]}
            >
              Next  »
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.parchment[100],
  },

  // ── Top bar
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.parchment[200],
  },
  closeBtn: {
    paddingVertical: spacing.xs,
    paddingRight: spacing.md,
  },
  closeBtnText: {
    ...typography.bodyMedium,
    color: colors.gold[700],
  },
  topBarTitle: {
    flex: 1,
    textAlign: 'center',
    ...typography.subheading,
    color: colors.navy[900],
  },
  fontSizeHint: {
    width: 44, fontSize: 10, color: BORDER_GOLD, fontWeight: '600', textAlign: 'right',
  },

  // ── Page wrapper (one FlatList cell = full screen width)
  pageWrapper: {
    width: SCREEN_WIDTH,
    flex: 1,
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.sm,
    backgroundColor: colors.parchment[100],
  },

  // ── Decorative borders
  outerBorder: {
    flex: 1,
    borderWidth: 2,
    borderColor: BORDER_GOLD,
    borderRadius: 4,
    margin: 12,
    backgroundColor: PARCHMENT_BG,
    overflow: 'hidden',
  },
  innerBorder: {
    flex: 1,
    margin: 4,
    borderWidth: 1,
    borderColor: 'rgba(200,169,110,0.4)',
    borderStyle: 'dashed',
    borderRadius: 2,
    padding: spacing.md,
  },

  // ── Corner flourishes
  corner: {
    position: 'absolute',
    color: BORDER_GOLD,
    fontSize: 10,
    zIndex: 10,
  },
  cornerTL: { top: 4,  left:  6 },
  cornerTR: { top: 4,  right: 6 },
  cornerBL: { bottom: 4, left: 6  },
  cornerBR: { bottom: 4, right: 6 },

  // ── Surah header
  surahHeader: {
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  surahArabicName: {
    fontFamily: 'Amiri_700Bold',
    fontSize: 28,
    color: colors.gold[700],
    textAlign: 'center',
  },
  bismillah: {
    fontFamily: 'Amiri_400Regular',
    fontSize: 20,
    color: INK_COLOR,
    textAlign: 'center',
    marginTop: spacing.xs,
    lineHeight: 40,
  },
  headerDivider: {
    marginTop: spacing.sm,
    width: '60%',
    height: 1,
    backgroundColor: BORDER_GOLD,
    opacity: 0.5,
  },

  // ── Arabic text
  textScroll: {
    flex: 1,
  },
  textScrollContent: {
    flexGrow: 1,
  },
  arabicText: {
    fontFamily: 'Amiri_400Regular',
    fontSize: 22,
    lineHeight: 46,
    color: INK_COLOR,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  arabicTextActive: {
    backgroundColor: 'rgba(212,169,62,0.28)',
    color: INK_COLOR,
  },
  ayahMarker: {
    fontFamily: 'Amiri_400Regular',
    color: BORDER_GOLD,
    fontSize: 16,
  },

  // ── Page number
  pageNumber: {
    textAlign: 'center',
    fontSize: 12,
    color: colors.gold[700],
    fontFamily: 'Amiri_400Regular',
    marginTop: spacing.sm,
  },

  // ── Bottom navigation bar
  navBar: {
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.parchment[200],
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  versesLabel: {
    textAlign: 'center',
    ...typography.caption,
    color: colors.gold[700],
    marginBottom: spacing.xs,
  },
  navControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  navBtn: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.gold[400],
    backgroundColor: colors.gold[50],
  },
  navBtnDisabled: {
    borderColor: colors.parchment[300],
    backgroundColor: 'transparent',
  },
  navBtnText: {
    ...typography.bodyMedium,
    color: colors.gold[700],
  },
  navBtnTextDisabled: {
    color: colors.parchment[400],
  },
  pageIndicator: {
    ...typography.body,
    color: colors.navy[900],
  },

  // ── Tafsir modal
  tafsirOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.45)' },
  tafsirDismiss: { flex: 1 },
  tafsirSheet: {
    backgroundColor: '#FFF8EE', borderTopLeftRadius: 20, borderTopRightRadius: 20,
    maxHeight: '70%', paddingBottom: 32,
  },
  tafsirHandle: {
    width: 36, height: 4, backgroundColor: '#C8A96E', borderRadius: 2,
    alignSelf: 'center', marginTop: 10, marginBottom: 4,
  },
  tafsirHeader: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 8,
    borderBottomWidth: 1, borderBottomColor: '#EAD7AF',
  },
  tafsirAyahRef: { flex: 1, fontSize: 13, fontWeight: '700', color: '#1A1008' },
  tafsirClose: { fontSize: 16, color: '#7A6340', paddingHorizontal: 4 },
  tafsirChips: { paddingHorizontal: 16, gap: 8, paddingVertical: 10, alignItems: 'center' },
  tafsirChip: {
    paddingHorizontal: 12, paddingVertical: 5, borderRadius: 16,
    backgroundColor: '#F0E6CC', borderWidth: 1, borderColor: '#C8A96E',
  },
  tafsirChipActive: { backgroundColor: '#C8A96E' },
  tafsirChipText: { fontSize: 12, fontWeight: '600', color: '#7A6340' },
  tafsirChipTextActive: { color: '#FFF' },
  tafsirScroll: { paddingHorizontal: 16, paddingTop: 4 },
  tafsirCenter: { alignItems: 'center', paddingVertical: 24, gap: 8 },
  tafsirLoadingText: { fontSize: 13, color: '#7A6340' },
  tafsirError: { fontSize: 13, color: '#EF4444', padding: 16 },
  tafsirText: { fontSize: 15, color: '#1A1008', lineHeight: 26 },
});
