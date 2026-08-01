import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator, FlatList, Keyboard, StyleSheet,
  Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { searchQuran, QuranSearchResult } from '../../services/api/searchApi';
import { colors, gradients, radius, shadow, spacing, typography } from '../../theme';
import type { TabAndStackNavigation } from '../../navigation/types';
import { LinearGradient } from 'expo-linear-gradient';

type SearchTab = 'quran' | 'hadith';

export function SearchScreen() {
  const navigation = useNavigation<TabAndStackNavigation>();
  const [tab, setTab] = useState<SearchTab>('quran');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<QuranSearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = useCallback(async () => {
    if (!query.trim()) return;
    Keyboard.dismiss();
    setIsLoading(true); setError(null); setSearched(true);
    try {
      const res = await searchQuran(query.trim());
      setResults(res);
    } catch {
      setError('Search failed. Check your connection and try again.');
    } finally {
      setIsLoading(false);
    }
  }, [query]);

  return (
    <ScreenContainer noPadding>
      <LinearGradient colors={gradients.heroNavy} style={styles.header}>
        <Text style={styles.heading}>Search</Text>

        {/* Tabs */}
        <View style={styles.tabRow}>
          {(['quran', 'hadith'] as SearchTab[]).map(t => (
            <TouchableOpacity
              key={t}
              style={[styles.tabBtn, tab === t && styles.tabBtnActive]}
              onPress={() => { setTab(t); setResults([]); setSearched(false); }}
            >
              <Text style={[styles.tabLabel, tab === t && styles.tabLabelActive]}>
                {t === 'quran' ? 'Quran' : 'Hadith'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Search input */}
        <View style={styles.searchRow}>
          <Ionicons name="search" size={18} color="rgba(255,255,255,0.5)" />
          <TextInput
            style={styles.input}
            value={query}
            onChangeText={setQuery}
            placeholder={tab === 'quran' ? 'Search by keyword, topic...' : 'Search hadiths...'}
            placeholderTextColor="rgba(255,255,255,0.35)"
            returnKeyType="search"
            onSubmitEditing={handleSearch}
            autoFocus
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => { setQuery(''); setResults([]); setSearched(false); }}>
              <Ionicons name="close-circle" size={18} color="rgba(255,255,255,0.4)" />
            </TouchableOpacity>
          )}
        </View>
      </LinearGradient>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.gold[500]} />
          <Text style={styles.loadingText}>Searching...</Text>
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Ionicons name="cloud-offline-outline" size={40} color={colors.parchment[400]} />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={handleSearch}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : !searched ? (
        <View style={styles.center}>
          <Ionicons name="search-outline" size={48} color={colors.parchment[300]} />
          <Text style={styles.emptyTitle}>Search the Quran</Text>
          <Text style={styles.emptyText}>
            Search any word, topic, or phrase — results show the matching ayahs with their translation.
          </Text>
          <View style={styles.suggestionRow}>
            {['mercy', 'patience', 'prayer', 'paradise', 'light'].map(s => (
              <TouchableOpacity
                key={s}
                style={styles.suggestionChip}
                onPress={() => { setQuery(s); }}
              >
                <Text style={styles.suggestionText}>{s}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      ) : results.length === 0 ? (
        <View style={styles.center}>
          <Ionicons name="documents-outline" size={40} color={colors.parchment[300]} />
          <Text style={styles.emptyTitle}>No results found</Text>
          <Text style={styles.emptyText}>Try a different keyword or check the spelling.</Text>
        </View>
      ) : (
        <FlatList
          data={results}
          keyExtractor={(item, i) => `${item.surahNumber}:${item.ayahNumber}:${i}`}
          contentContainerStyle={styles.list}
          ListHeaderComponent={
            <Text style={styles.resultCount}>{results.length} result{results.length !== 1 ? 's' : ''} for "{query}"</Text>
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.resultCard}
              onPress={() => navigation.navigate('SurahDetail', {
                surahNumber: item.surahNumber,
                englishName: item.surahEnglishName,
              })}
              activeOpacity={0.8}
            >
              <View style={styles.resultHeader}>
                <View style={styles.surahBadge}>
                  <Text style={styles.surahBadgeName}>{item.surahEnglishName}</Text>
                  <Text style={styles.surahBadgeRef}>{item.surahNumber}:{item.ayahNumber}</Text>
                </View>
                <Ionicons name="chevron-forward" size={14} color={colors.parchment[400]} />
              </View>
              <Text style={styles.translationText} numberOfLines={3}>{item.translationText}</Text>
            </TouchableOpacity>
          )}
        />
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: { paddingTop: spacing.lg, paddingBottom: spacing.xl, paddingHorizontal: spacing.lg, gap: spacing.md },
  heading: { ...typography.displayMd, color: colors.white },
  tabRow: { flexDirection: 'row', gap: spacing.sm },
  tabBtn: {
    paddingHorizontal: spacing.lg, paddingVertical: spacing.sm,
    borderRadius: radius.pill, backgroundColor: 'rgba(255,255,255,0.1)',
  },
  tabBtnActive: { backgroundColor: colors.gold[400] },
  tabLabel: { ...typography.caption, color: 'rgba(255,255,255,0.6)', fontWeight: '600' },
  tabLabelActive: { color: colors.navy[900] },
  searchRow: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: radius.md, paddingHorizontal: spacing.md, paddingVertical: spacing.md,
  },
  input: { flex: 1, ...typography.body, color: colors.white },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xxl, gap: spacing.md },
  loadingText: { ...typography.bodySmall, color: colors.parchment[500] },
  errorText: { ...typography.body, color: colors.semantic.error, textAlign: 'center' },
  retryBtn: { backgroundColor: colors.navy[800], paddingHorizontal: spacing.xl, paddingVertical: spacing.sm, borderRadius: radius.pill },
  retryText: { ...typography.bodySmall, color: colors.white, fontWeight: '600' },
  emptyTitle: { ...typography.heading, color: colors.parchment[800] },
  emptyText: { ...typography.body, color: colors.parchment[500], textAlign: 'center', lineHeight: 24 },
  suggestionRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, justifyContent: 'center', marginTop: spacing.sm },
  suggestionChip: {
    backgroundColor: colors.white, borderRadius: radius.pill,
    paddingHorizontal: spacing.lg, paddingVertical: spacing.sm,
    borderWidth: 1, borderColor: colors.parchment[200],
  },
  suggestionText: { ...typography.bodySmall, color: colors.navy[700], fontWeight: '600' },
  list: { padding: spacing.lg, paddingBottom: spacing.xxxl, gap: spacing.md },
  resultCount: { ...typography.caption, color: colors.parchment[500], marginBottom: spacing.sm },
  resultCard: {
    backgroundColor: colors.white, borderRadius: radius.md,
    padding: spacing.lg, gap: spacing.sm, ...shadow.sm,
  },
  resultHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  surahBadge: { gap: 2 },
  surahBadgeName: { ...typography.subheading, color: colors.navy[900] },
  surahBadgeRef: { ...typography.caption, color: colors.gold[600] },
  translationText: { ...typography.body, color: colors.parchment[700], lineHeight: 22 },
});
