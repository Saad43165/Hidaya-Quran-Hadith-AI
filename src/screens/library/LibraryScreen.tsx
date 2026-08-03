import React, { useCallback, useRef, useState } from 'react';
import {
  Animated, Dimensions, FlatList, Image, Modal, ScrollView,
  StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import * as WebBrowser from 'expo-web-browser';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { BackButton } from '../../components/common/BackButton';
import { ErrorView } from '../../components/common/AsyncStateView';
import { searchGutenberg, searchGoogleBooks } from '../../services/api/booksApi';
import { Book } from '../../types/models';
import { colors, gradients, radius, shadow, spacing, typography } from '../../theme';
import { darkColors } from '../../theme/darkColors';
import { useThemeStore } from '../../store/useThemeStore';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
type Source = 'gutenberg' | 'google_books';

const ISLAMIC_SEARCHES = ['Islam', 'Quran', 'Hadith', 'Fiqh', 'Seerah', 'Tafsir'];

type IoniconName = keyof typeof Ionicons.glyphMap;

interface LibraryCategory {
  key: string;
  label: string;
  icon: IoniconName;
  query: string;
}

const LIBRARY_CATEGORIES: LibraryCategory[] = [
  { key: 'tafsir', label: 'Tafsir', icon: 'book-outline', query: 'tafsir quran commentary' },
  { key: 'hadith', label: 'Hadith', icon: 'chatbox-outline', query: 'hadith collection sunnah' },
  { key: 'fiqh', label: 'Fiqh', icon: 'scale-outline', query: 'fiqh islamic jurisprudence' },
  { key: 'seerah', label: 'Seerah', icon: 'person-outline', query: 'prophet muhammad biography seerah' },
  { key: 'history', label: 'History', icon: 'time-outline', query: 'islamic history caliphate' },
  { key: 'aqeedah', label: 'Aqeedah', icon: 'library-outline', query: 'aqeedah islamic theology creed' },
  { key: 'duas', label: 'Duas & Adhkar', icon: 'hand-left-outline', query: 'dua adhkar remembrance of allah' },
];

// ─── Shimmer skeleton ──────────────────────────────────────────────────────────
function BookSkeleton() {
  const shimmer = useRef(new Animated.Value(0)).current;
  React.useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, { toValue: 1, duration: 900, useNativeDriver: true }),
        Animated.timing(shimmer, { toValue: 0, duration: 900, useNativeDriver: true }),
      ])
    ).start();
  }, []);
  const opacity = shimmer.interpolate({ inputRange: [0, 1], outputRange: [0.25, 0.55] });
  return (
    <View style={skeleStyles.grid}>
      {[1, 2, 3, 4].map(i => (
        <Animated.View key={i} style={[skeleStyles.card, { opacity }]}>
          <View style={skeleStyles.cover} />
          <View style={skeleStyles.line1} />
          <View style={skeleStyles.line2} />
        </Animated.View>
      ))}
    </View>
  );
}

const skeleStyles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md, paddingHorizontal: spacing.lg, paddingTop: spacing.lg },
  card: { width: (SCREEN_WIDTH - spacing.lg * 2 - spacing.md) / 2, backgroundColor: colors.parchment[200], borderRadius: radius.md, overflow: 'hidden' },
  cover: { width: '100%', aspectRatio: 2 / 3, backgroundColor: colors.parchment[300] },
  line1: { margin: spacing.sm, height: 12, borderRadius: 6, backgroundColor: colors.parchment[300] },
  line2: { marginHorizontal: spacing.sm, marginBottom: spacing.sm, height: 10, width: '60%', borderRadius: 5, backgroundColor: colors.parchment[300] },
});

// ─── Book detail modal ─────────────────────────────────────────────────────────
function BookDetailModal({ book, visible, onClose, isDark, cardBg, textPrimary, textSecondary, textMuted }: {
  book: Book | null; visible: boolean; onClose: () => void;
  isDark: boolean; cardBg: string; textPrimary: string; textSecondary: string; textMuted: string;
}) {
  const slideAnim = useRef(new Animated.Value(300)).current;
  const backdropAnim = useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, tension: 280, friction: 26 }),
        Animated.timing(backdropAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.spring(slideAnim, { toValue: 300, useNativeDriver: true, tension: 280, friction: 26 }),
        Animated.timing(backdropAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  if (!book) return null;

  const handleOpen = async () => {
    if (book.sourceUrl) {
      await WebBrowser.openBrowserAsync(book.sourceUrl, {
        toolbarColor: colors.navy[900],
        controlsColor: colors.gold[400],
        presentationStyle: WebBrowser.WebBrowserPresentationStyle.PAGE_SHEET,
      });
    }
  };

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <Animated.View style={[StyleSheet.absoluteFill, detailStyles.backdrop, { opacity: backdropAnim }]}>
        <TouchableOpacity style={StyleSheet.absoluteFill} onPress={onClose} activeOpacity={1} />
      </Animated.View>
      <Animated.View style={[detailStyles.sheet, { backgroundColor: cardBg, transform: [{ translateY: slideAnim }] }]}>
        <View style={[detailStyles.handle, { backgroundColor: isDark ? 'rgba(255,255,255,0.15)' : colors.parchment[300] }]} />
        <ScrollView showsVerticalScrollIndicator={false} style={{ backgroundColor: cardBg }}>
          {/* Cover + title */}
          <View style={detailStyles.coverRow}>
            {book.coverUrl ? (
              <Image source={{ uri: book.coverUrl }} style={detailStyles.cover} resizeMode="cover" />
            ) : (
              <LinearGradient colors={['#0F1C42', '#1A2A5E']} style={[detailStyles.cover, detailStyles.coverFallback]}>
                <Ionicons name="book" size={40} color={colors.gold[300]} />
              </LinearGradient>
            )}
            <View style={detailStyles.coverMeta}>
              <View style={[detailStyles.sourceBadge, { backgroundColor: book.source === 'gutenberg' ? 'rgba(74,222,128,0.15)' : 'rgba(56,189,248,0.15)' }]}>
                <Text style={[detailStyles.sourceBadgeText, { color: book.source === 'gutenberg' ? '#4ADE80' : '#38BDF8' }]}>
                  {book.source === 'gutenberg' ? 'Free Classic' : 'Google Books'}
                </Text>
              </View>
              <Text style={[detailStyles.detailTitle, { color: textPrimary }]}>{book.title}</Text>
              <Text style={[detailStyles.detailAuthor, { color: textSecondary }]}>{book.author}</Text>
              {book.language && (
                <Text style={[detailStyles.detailLang, { color: textMuted }]}>{book.language.toUpperCase()}</Text>
              )}
            </View>
          </View>

          {book.description ? (
            <>
              <Text style={[detailStyles.sectionLabel, { color: textMuted }]}>ABOUT THIS BOOK</Text>
              <Text style={[detailStyles.description, { color: textSecondary }]}>{book.description}</Text>
            </>
          ) : null}

          <TouchableOpacity
            style={detailStyles.readBtn}
            onPress={handleOpen}
            activeOpacity={0.85}
            disabled={!book.sourceUrl}
          >
            <LinearGradient colors={['#0F1C42', '#1A2A5E']} style={detailStyles.readBtnGrad}>
              <Ionicons name="book-outline" size={18} color={colors.gold[300]} />
              <Text style={detailStyles.readBtnText}>Read In-App</Text>
              <Ionicons name="arrow-forward" size={16} color={colors.gold[400]} />
            </LinearGradient>
          </TouchableOpacity>
          {!book.sourceUrl && (
            <Text style={[detailStyles.noLinkText, { color: textMuted }]}>No reading link available for this book.</Text>
          )}
        </ScrollView>
      </Animated.View>
    </Modal>
  );
}

const detailStyles = StyleSheet.create({
  backdrop: { backgroundColor: 'rgba(6,12,31,0.6)', zIndex: 10 },
  sheet: { position: 'absolute', bottom: 0, left: 0, right: 0, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, zIndex: 11, paddingHorizontal: spacing.lg, paddingBottom: spacing.xxxl + spacing.md, maxHeight: '85%' },
  handle: { width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginTop: spacing.md, marginBottom: spacing.lg },
  coverRow: { flexDirection: 'row', gap: spacing.lg, marginBottom: spacing.lg },
  cover: { width: 110, height: 165, borderRadius: radius.md, ...shadow.md },
  coverFallback: { alignItems: 'center', justifyContent: 'center' },
  coverMeta: { flex: 1, gap: spacing.sm, paddingTop: spacing.xs },
  sourceBadge: { alignSelf: 'flex-start', borderRadius: radius.pill, paddingHorizontal: spacing.sm, paddingVertical: 3 },
  sourceBadgeText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
  detailTitle: { ...typography.subheading, lineHeight: 22 },
  detailAuthor: { ...typography.caption },
  detailLang: { fontSize: 10, fontWeight: '700', letterSpacing: 1 },
  sectionLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 1.8, marginBottom: spacing.sm },
  description: { ...typography.bodySmall, lineHeight: 22, marginBottom: spacing.lg },
  readBtn: { borderRadius: radius.md, overflow: 'hidden', marginTop: spacing.md },
  readBtnGrad: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.md, paddingVertical: spacing.lg },
  readBtnText: { ...typography.subheading, color: colors.white, flex: 1, textAlign: 'center' },
  noLinkText: { ...typography.caption, textAlign: 'center', marginTop: spacing.sm },
});

// ─── Enhanced BookCard ─────────────────────────────────────────────────────────
function EnhancedBookCard({ book, onPress, cardBg, textPrimary, textSecondary }: {
  book: Book; onPress: () => void; cardBg: string; textPrimary: string; textSecondary: string;
}) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const onPressIn  = () => Animated.spring(scaleAnim, { toValue: 0.95, useNativeDriver: true, tension: 300, friction: 10 }).start();
  const onPressOut = () => Animated.spring(scaleAnim, { toValue: 1,    useNativeDriver: true, tension: 300, friction: 10 }).start();
  return (
    <Animated.View style={[bookCardStyles.card, { backgroundColor: cardBg, transform: [{ scale: scaleAnim }] }]}>
      <TouchableOpacity onPress={onPress} onPressIn={onPressIn} onPressOut={onPressOut} activeOpacity={1} style={{ flex: 1 }}>
        {book.coverUrl ? (
          <Image source={{ uri: book.coverUrl }} style={bookCardStyles.cover} resizeMode="cover" />
        ) : (
          <LinearGradient colors={['#0F1C42', '#1A2A5E']} style={[bookCardStyles.cover, bookCardStyles.coverFallback]}>
            <Text style={[bookCardStyles.fallbackAr, { fontFamily: 'Amiri_400Regular' }]}>كِتَاب</Text>
            <Ionicons name="book" size={22} color={colors.gold[300]} />
          </LinearGradient>
        )}
        <View style={bookCardStyles.info}>
          <Text style={[bookCardStyles.title, { color: textPrimary }]} numberOfLines={2}>{book.title}</Text>
          <Text style={[bookCardStyles.author, { color: textSecondary }]} numberOfLines={1}>{book.author}</Text>
          <View style={[bookCardStyles.badge, { backgroundColor: book.source === 'gutenberg' ? 'rgba(74,222,128,0.12)' : 'rgba(56,189,248,0.12)' }]}>
            <Text style={[bookCardStyles.badgeText, { color: book.source === 'gutenberg' ? '#4ADE80' : '#38BDF8' }]}>
              {book.source === 'gutenberg' ? '✓ Free' : 'Google'}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const bookCardStyles = StyleSheet.create({
  card: { width: (SCREEN_WIDTH - spacing.lg * 2 - spacing.md) / 2, borderRadius: radius.md, overflow: 'hidden', ...shadow.sm },
  cover: { width: '100%', aspectRatio: 2 / 3 },
  coverFallback: { alignItems: 'center', justifyContent: 'center', gap: spacing.xs },
  fallbackAr: { fontSize: 18, color: colors.gold[300] },
  info: { padding: spacing.sm, gap: 4 },
  title: { ...typography.bodySmall, fontWeight: '600', lineHeight: 17 },
  author: { ...typography.caption },
  badge: { alignSelf: 'flex-start', borderRadius: radius.pill, paddingHorizontal: spacing.sm, paddingVertical: 2, marginTop: 2 },
  badgeText: { fontSize: 10, fontWeight: '700' },
});

// ─── Main screen ───────────────────────────────────────────────────────────────
export function LibraryScreen() {
  const { t } = useTranslation();
  const isDark = useThemeStore(s => s.isDark);
  const [source, setSource] = useState<Source>('gutenberg');
  const [query, setQuery] = useState('');
  const [books, setBooks] = useState<Book[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const runSearch = useCallback(async (q: string, src: Source) => {
    if (!q.trim()) return;
    setIsLoading(true); setError(null); setHasSearched(true); setBooks([]);
    try {
      setBooks(src === 'gutenberg' ? await searchGutenberg(q) : await searchGoogleBooks(q));
    } catch { setError('Search failed. Check your connection and try again.'); }
    finally { setIsLoading(false); }
  }, []);

  // Screen loads with categories visible, no auto search — browsing is primary
  const handleCategoryPress = (category: LibraryCategory) => {
    setActiveCategory(category.key);
    setQuery('');
    runSearch(category.query, source);
  };

  const handleManualSearch = () => {
    setActiveCategory(null);
    runSearch(query, source);
  };

  const handleClearSearch = () => {
    setQuery('');
    setActiveCategory(null);
    setBooks([]);
    setHasSearched(false);
  };

  const handleOpenBook = (book: Book) => {
    setSelectedBook(book);
    setModalVisible(true);
  };

  const bg = isDark ? darkColors.background : colors.parchment[50];
  const cardBg = isDark ? darkColors.surface : colors.white;
  const textPrimary = isDark ? darkColors.text.primary : colors.parchment[950];
  const textSecondary = isDark ? darkColors.text.secondary : colors.parchment[500];
  const textMuted = isDark ? darkColors.text.muted : colors.parchment[400];
  const border = isDark ? darkColors.border : colors.parchment[200];

  const headerComponent = (
    <>
      <LinearGradient colors={gradients.heroNavy} style={styles.header}>
        <View style={styles.headerDecor1} />
        <View style={styles.headerDecor2} />
        <StatusBar barStyle="light-content" />
        <View style={styles.headerNavRow}>
          <BackButton />
        </View>
        <Text style={[styles.headerAr, { fontFamily: 'Amiri_400Regular' }]}>مَكْتَبَة</Text>
        <Text style={styles.heading}>{t('library.discover')}</Text>
        <Text style={styles.headerSub}>Islamic books & classics</Text>

        {/* Source toggle */}
        <View style={styles.sourceRow}>
          {(['gutenberg', 'google_books'] as Source[]).map(src => (
            <TouchableOpacity
              key={src}
              style={[styles.sourceChip, source === src && styles.sourceChipActive]}
              onPress={() => {
                setSource(src);
                if (activeCategory) {
                  const cat = LIBRARY_CATEGORIES.find(c => c.key === activeCategory);
                  if (cat) runSearch(cat.query, src);
                } else if (hasSearched) {
                  runSearch(query, src);
                }
              }}
              activeOpacity={0.8}
            >
              <Ionicons
                name={src === 'gutenberg' ? 'library-outline' : 'search-outline'}
                size={13}
                color={source === src ? colors.navy[900] : 'rgba(255,255,255,0.5)'}
              />
              <Text style={[styles.sourceLabel, source === src && styles.sourceLabelActive]}>
                {src === 'gutenberg' ? 'Free Classics' : 'Google Books'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Search bar (secondary — manual free-text search) */}
        <View style={styles.searchBar}>
          <Ionicons name="search" size={16} color={colors.parchment[400]} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder={t('library.searchPlaceholder')}
            placeholderTextColor="rgba(255,255,255,0.25)"
            style={styles.searchInput}
            returnKeyType="search"
            onSubmitEditing={handleManualSearch}
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={handleClearSearch}>
              <Ionicons name="close-circle" size={16} color="rgba(255,255,255,0.4)" />
            </TouchableOpacity>
          )}
        </View>
      </LinearGradient>

      {/* Curated category grid — primary browsing entry point */}
      <View style={[styles.categorySection, { backgroundColor: bg }]}>
        <Text style={[styles.categorySectionLabel, { color: textSecondary }]}>BROWSE BY CATEGORY</Text>
        <View style={styles.categoryGrid}>
          {LIBRARY_CATEGORIES.map(category => {
            const active = activeCategory === category.key;
            return (
              <TouchableOpacity
                key={category.key}
                style={[
                  styles.categoryCard,
                  { backgroundColor: cardBg, borderColor: border },
                  active && styles.categoryCardActive,
                ]}
                onPress={() => handleCategoryPress(category)}
                activeOpacity={0.85}
              >
                <View style={[styles.categoryIconWrap, active && styles.categoryIconWrapActive]}>
                  <Ionicons
                    name={category.icon}
                    size={20}
                    color={active ? colors.navy[900] : colors.gold[600]}
                  />
                </View>
                <Text
                  style={[styles.categoryLabel, { color: active ? colors.navy[900] : textPrimary }]}
                  numberOfLines={2}
                >
                  {category.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
        {hasSearched && (
          <Text style={[styles.resultsHeading, { color: textPrimary }]}>
            {activeCategory
              ? LIBRARY_CATEGORIES.find(c => c.key === activeCategory)?.label
              : `Results for "${query}"`}
          </Text>
        )}
      </View>
    </>
  );

  return (
    <ScreenContainer noPadding>
      {isLoading ? (
        <>
          {headerComponent}
          <BookSkeleton />
        </>
      ) : error ? (
        <>
          {headerComponent}
          <ErrorView message={error} onRetry={() => runSearch(activeCategory ? (LIBRARY_CATEGORIES.find(c => c.key === activeCategory)?.query ?? query) : query, source)} />
        </>
      ) : (
        <FlatList
          data={books}
          keyExtractor={b => b.id}
          numColumns={2}
          columnWrapperStyle={styles.gridRow}
          contentContainerStyle={[styles.listContent, { backgroundColor: bg }]}
          style={{ backgroundColor: bg }}
          ListHeaderComponent={headerComponent}
          ListEmptyComponent={
            hasSearched ? (
              <View style={styles.emptyWrap}>
                <Ionicons name="search-outline" size={48} color={colors.parchment[300]} />
                <Text style={[styles.emptyText, { color: textSecondary }]}>No books found</Text>
                <Text style={[styles.emptySubText, { color: textMuted }]}>Try a different search term</Text>
              </View>
            ) : (
              <View style={styles.quickSearchWrap}>
                <Text style={[styles.quickSearchLabel, { color: textMuted }]}>QUICK SEARCH</Text>
                <View style={styles.quickSearchRow}>
                  {ISLAMIC_SEARCHES.map(q => (
                    <TouchableOpacity
                      key={q}
                      style={[styles.quickChip, { backgroundColor: cardBg, borderColor: border }]}
                      onPress={() => { setActiveCategory(null); setQuery(q); runSearch(q, source); }}
                      activeOpacity={0.8}
                    >
                      <Text style={[styles.quickChipText, { color: textPrimary }]}>{q}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <Text style={[styles.tipText, { color: textMuted }]}>Tap a category above, a quick topic, or search manually</Text>
              </View>
            )
          }
          renderItem={({ item }) => (
            <EnhancedBookCard book={item} onPress={() => handleOpenBook(item)} cardBg={cardBg} textPrimary={textPrimary} textSecondary={textSecondary} />
          )}
        />
      )}
      <BookDetailModal
        book={selectedBook}
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        isDark={isDark}
        cardBg={cardBg}
        textPrimary={textPrimary}
        textSecondary={textSecondary}
        textMuted={textMuted}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: { paddingTop: 48, paddingBottom: spacing.xl, paddingHorizontal: spacing.lg, gap: spacing.sm, overflow: 'hidden' },
  headerNavRow: { marginBottom: spacing.xs },
  headerDecor1: { position: 'absolute', right: -50, top: -50, width: 180, height: 180, borderRadius: 90, borderWidth: 1, borderColor: 'rgba(245,158,11,0.12)' },
  headerDecor2: { position: 'absolute', left: -30, bottom: -20, width: 120, height: 120, borderRadius: 60, borderWidth: 1, borderColor: 'rgba(245,158,11,0.07)' },
  headerAr: { fontSize: 28, color: colors.gold[300], alignSelf: 'center' },
  heading: { ...typography.displayMd, color: colors.white, alignSelf: 'center' },
  headerSub: { ...typography.caption, color: 'rgba(255,255,255,0.35)', alignSelf: 'center', marginBottom: spacing.xs },
  sourceRow: { flexDirection: 'row', gap: spacing.sm },
  sourceChip: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: radius.pill, backgroundColor: 'rgba(255,255,255,0.12)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)' },
  sourceChipActive: { backgroundColor: colors.gold[400], borderColor: colors.gold[300] },
  sourceLabel: { ...typography.caption, color: 'rgba(255,255,255,0.6)', fontWeight: '600' },
  sourceLabelActive: { color: colors.navy[900] },
  searchBar: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: radius.md, paddingHorizontal: spacing.md, paddingVertical: spacing.md, borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)' },
  searchInput: { flex: 1, ...typography.body, color: colors.white },
  categorySection: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg, paddingBottom: spacing.sm, gap: spacing.md },
  categorySectionLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 1.8 },
  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  categoryCard: { width: (SCREEN_WIDTH - spacing.lg * 2 - spacing.sm * 2) / 3, alignItems: 'center', justifyContent: 'center', gap: spacing.xs, paddingVertical: spacing.md, paddingHorizontal: spacing.xs, borderRadius: radius.md, borderWidth: 1, ...shadow.xs },
  categoryCardActive: { borderColor: colors.gold[400], backgroundColor: colors.gold[50] },
  categoryIconWrap: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.gold[50], alignItems: 'center', justifyContent: 'center' },
  categoryIconWrapActive: { backgroundColor: colors.gold[400] },
  categoryLabel: { ...typography.caption, fontWeight: '700', textAlign: 'center' },
  resultsHeading: { ...typography.subheading, marginTop: spacing.sm },
  gridRow: { justifyContent: 'space-between', paddingHorizontal: spacing.lg },
  listContent: { paddingTop: spacing.lg, paddingBottom: spacing.xxxl, gap: spacing.md },
  emptyWrap: { alignItems: 'center', paddingTop: spacing.xxxl, gap: spacing.md },
  emptyText: { ...typography.subheading, color: colors.parchment[600] },
  emptySubText: { ...typography.caption, color: colors.parchment[400] },
  quickSearchWrap: { paddingHorizontal: spacing.lg, paddingTop: spacing.xl, gap: spacing.md },
  quickSearchLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 1.8, color: colors.parchment[400] },
  quickSearchRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  quickChip: { borderRadius: radius.pill, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, borderWidth: 1, ...shadow.xs },
  quickChipText: { ...typography.bodySmall, fontWeight: '700' },
  tipText: { ...typography.caption, color: colors.parchment[400], textAlign: 'center' },
});
