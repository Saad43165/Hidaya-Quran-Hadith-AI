import React, { useCallback, useState } from 'react';
import { FlatList, Linking, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { LoadingView, ErrorView } from '../../components/common/AsyncStateView';
import { BookCard } from '../../components/library/BookCard';
import { searchGutenberg, searchGoogleBooks } from '../../services/api/booksApi';
import { Book } from '../../types/models';
import { colors, gradients, radius, spacing, typography } from '../../theme';

type Source = 'gutenberg' | 'google_books';

const QUICK_SEARCHES = ['Islam', 'Quran', 'History', 'Philosophy'];

export function LibraryScreen() {
  const { t } = useTranslation();
  const [source, setSource] = useState<Source>('gutenberg');
  const [query, setQuery] = useState('');
  const [books, setBooks] = useState<Book[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  const runSearch = useCallback(async (q: string, src: Source) => {
    if (!q.trim()) return;
    setIsLoading(true); setError(null); setHasSearched(true);
    try {
      setBooks(src === 'gutenberg' ? await searchGutenberg(q) : await searchGoogleBooks(q));
    } catch { setError('Search failed. Check your connection and try again.'); }
    finally { setIsLoading(false); }
  }, []);

  const handleOpenBook = async (book: Book) => {
    if (book.sourceUrl && await Linking.canOpenURL(book.sourceUrl)) Linking.openURL(book.sourceUrl);
  };

  return (
    <ScreenContainer noPadding>
      <LinearGradient colors={gradients.heroNavy} style={styles.header}>
        <Text style={styles.heading}>{t('library.discover')}</Text>

        {/* Source toggle */}
        <View style={styles.sourceRow}>
          {(['gutenberg', 'google_books'] as Source[]).map(src => (
            <TouchableOpacity
              key={src}
              style={[styles.sourceChip, source === src && styles.sourceChipActive]}
              onPress={() => { setSource(src); if (hasSearched) runSearch(query, src); }}
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

        {/* Search bar */}
        <View style={styles.searchBar}>
          <Ionicons name="search" size={16} color={colors.parchment[400]} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder={t('library.searchPlaceholder')}
            placeholderTextColor={colors.parchment[400]}
            style={styles.searchInput}
            returnKeyType="search"
            onSubmitEditing={() => runSearch(query, source)}
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => { setQuery(''); setBooks([]); setHasSearched(false); }}>
              <Ionicons name="close-circle" size={16} color={colors.parchment[400]} />
            </TouchableOpacity>
          )}
        </View>
      </LinearGradient>

      {isLoading ? <LoadingView /> : error ? (
        <ErrorView message={error} onRetry={() => runSearch(query, source)} />
      ) : (
        <FlatList
          data={books}
          keyExtractor={b => b.id}
          numColumns={2}
          columnWrapperStyle={styles.gridRow}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            hasSearched ? (
              <Text style={styles.emptyText}>No books found — try a different search.</Text>
            ) : (
              <View style={styles.quickSearchWrap}>
                <Text style={styles.quickSearchLabel}>Popular searches</Text>
                <View style={styles.quickSearchRow}>
                  {QUICK_SEARCHES.map(q => (
                    <TouchableOpacity
                      key={q}
                      style={styles.quickChip}
                      onPress={() => { setQuery(q); runSearch(q, source); }}
                    >
                      <Text style={styles.quickChipText}>{q}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )
          }
          renderItem={({ item }) => <BookCard book={item} onPress={() => handleOpenBook(item)} />}
        />
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: { paddingTop: spacing.lg, paddingBottom: spacing.xl, paddingHorizontal: spacing.lg, gap: spacing.md },
  heading: { ...typography.displayMd, color: colors.white },
  sourceRow: { flexDirection: 'row', gap: spacing.sm },
  sourceChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  sourceChipActive: { backgroundColor: colors.gold[400] },
  sourceLabel: { ...typography.caption, color: 'rgba(255,255,255,0.6)', fontWeight: '600' },
  sourceLabelActive: { color: colors.navy[900] },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  searchInput: { flex: 1, ...typography.body, color: colors.white },
  gridRow: { justifyContent: 'space-between', paddingHorizontal: spacing.lg },
  listContent: { paddingTop: spacing.lg, paddingBottom: spacing.xxxl, gap: spacing.lg },
  emptyText: { ...typography.body, color: colors.parchment[500], textAlign: 'center', marginTop: spacing.xxl },
  quickSearchWrap: { paddingHorizontal: spacing.lg, paddingTop: spacing.xl, gap: spacing.md },
  quickSearchLabel: { ...typography.label, color: colors.parchment[600] },
  quickSearchRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  quickChip: {
    backgroundColor: colors.white,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: colors.parchment[200],
  },
  quickChipText: { ...typography.bodySmall, color: colors.navy[700], fontWeight: '600' },
});
