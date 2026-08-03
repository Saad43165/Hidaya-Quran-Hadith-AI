import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator, FlatList, Keyboard, Share, StyleSheet,
  Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { FadeInRow } from '../../components/common/FadeInRow';
import { BackButton } from '../../components/common/BackButton';
import { searchQuran, searchHadiths } from '../../services/api/searchApi';
import { colors, radius, shadow, spacing, typography } from '../../theme';
import { darkColors } from '../../theme/darkColors';
import { useThemeStore } from '../../store/useThemeStore';
import type { TabAndStackNavigation } from '../../navigation/types';
import { LinearGradient } from 'expo-linear-gradient';
import { gradients } from '../../theme/colors';

type SearchTab = 'quran' | 'hadith';
const RECENT_KEY = 'kitaabai.search.recent';
const MAX_RECENT = 5;

export function SearchScreen() {
  const navigation = useNavigation<TabAndStackNavigation>();
  const isDark = useThemeStore(s => s.isDark);
  const [tab, setTab] = useState<SearchTab>('quran');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<unknown[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  useEffect(() => {
    AsyncStorage.getItem(RECENT_KEY).then(raw => {
      if (raw) try { setRecentSearches(JSON.parse(raw) as string[]); } catch {}
    }).catch(() => {});
  }, []);

  const saveRecent = useCallback(async (q: string) => {
    const next = [q, ...recentSearches.filter(r => r !== q)].slice(0, MAX_RECENT);
    setRecentSearches(next);
    await AsyncStorage.setItem(RECENT_KEY, JSON.stringify(next)).catch(() => {});
  }, [recentSearches]);

  const handleSearch = useCallback(async (q?: string) => {
    const searchQuery = (q ?? query).trim();
    if (!searchQuery) return;
    setQuery(searchQuery);
    Keyboard.dismiss();
    setIsLoading(true); setError(null); setSearched(true);
    await saveRecent(searchQuery);
    try {
      if (tab === 'quran') {
        setResults(await searchQuran(searchQuery));
      } else {
        setResults(await searchHadiths(searchQuery));
      }
    } catch {
      setError('Search failed. Check your connection and try again.');
    } finally {
      setIsLoading(false);
    }
  }, [query, tab, saveRecent]);

  const clearRecent = async () => {
    setRecentSearches([]);
    await AsyncStorage.removeItem(RECENT_KEY).catch(() => {});
  };

  const showRecent = !searched && query.length === 0 && recentSearches.length > 0;

  const listBg = isDark ? darkColors.background : colors.parchment[50];
  const cardBg = isDark ? darkColors.surface : colors.white;
  const textPrimary = isDark ? darkColors.text.primary : colors.navy[900];
  const textSecondary = isDark ? darkColors.text.secondary : colors.parchment[700];
  const textMuted = isDark ? darkColors.text.muted : colors.parchment[500];
  const borderColor = isDark ? darkColors.border : colors.parchment[200];

  return (
    <ScreenContainer noPadding>
      <LinearGradient colors={gradients.heroNavy} style={styles.header}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
          <BackButton />
          <Text style={styles.heading}>Search</Text>
        </View>

        <View style={styles.tabRow}>
          <View style={styles.tabPillTrack}>
            {(['quran', 'hadith'] as SearchTab[]).map(t => (
              <TouchableOpacity
                key={t}
                style={[styles.tabPill, tab === t && styles.tabPillActive]}
                onPress={() => { setTab(t); setResults([]); setSearched(false); setQuery(''); }}
                activeOpacity={0.75}
              >
                <Ionicons
                  name={t === 'quran' ? 'book' : 'chatbox-ellipses'}
                  size={13}
                  color={tab === t ? colors.navy[900] : 'rgba(255,255,255,0.55)'}
                  style={{ marginRight: 4 }}
                />
                <Text style={[styles.tabPillLabel, tab === t && styles.tabPillLabelActive]}>
                  {t === 'quran' ? 'Quran' : 'Hadith'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.searchRow}>
          <Ionicons name="search" size={18} color="rgba(255,255,255,0.5)" />
          <TextInput
            style={styles.input}
            value={query}
            onChangeText={setQuery}
            placeholder={tab === 'quran' ? 'Search by keyword, topic...' : 'Search hadiths...'}
            placeholderTextColor="rgba(255,255,255,0.35)"
            returnKeyType="search"
            onSubmitEditing={() => handleSearch()}
            autoFocus
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => { setQuery(''); setResults([]); setSearched(false); }}>
              <Ionicons name="close-circle" size={18} color="rgba(255,255,255,0.4)" />
            </TouchableOpacity>
          )}
        </View>
      </LinearGradient>

      {/* Recent searches */}
      {showRecent && (
        <View style={[styles.recentSection, { backgroundColor: listBg }]}>
          <View style={styles.recentHeader}>
            <Text style={[styles.recentTitle, { color: textMuted }]}>Recent Searches</Text>
            <TouchableOpacity onPress={clearRecent}>
              <Text style={styles.recentClear}>Clear</Text>
            </TouchableOpacity>
          </View>
          {recentSearches.map(r => (
            <TouchableOpacity key={r} style={[styles.recentRow, { borderBottomColor: borderColor }]} onPress={() => handleSearch(r)}>
              <Ionicons name="time-outline" size={15} color={textMuted} />
              <Text style={[styles.recentText, { color: textSecondary }]}>{r}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {isLoading ? (
        <View style={[styles.center, { backgroundColor: listBg }]}>
          <ActivityIndicator size="large" color={colors.gold[500]} />
          <Text style={[styles.loadingText, { color: textMuted }]}>Searching...</Text>
        </View>
      ) : error ? (
        <View style={[styles.center, { backgroundColor: listBg }]}>
          <Ionicons name="cloud-offline-outline" size={40} color={textMuted} />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => handleSearch()}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : !searched && !showRecent ? (
          <View style={[styles.center, { backgroundColor: listBg }]}>
            {/* Islamic Bismillah empty state */}
            <View style={[styles.bismillahBox, { borderColor }]}>
              <Text style={[styles.bismillahText, { fontFamily: 'Amiri_700Bold' }]}>
                بِسْمِ اللَّهِ
              </Text>
            </View>
            <Text style={[styles.emptyTitle, { color: textPrimary }]}>
              {tab === 'quran' ? 'Search the Quran' : 'Search Hadiths'}
            </Text>
            <Text style={[styles.emptyText, { color: textMuted }]}>
              {tab === 'quran'
                ? 'Search any word, topic, or phrase — results show the matching ayahs with their translation.'
                : 'Search keywords across all cached Hadith collections (e.g. Sahih al-Bukhari).'}
            </Text>
            <View style={styles.suggestionRow}>
              {(tab === 'quran'
                ? ['mercy', 'patience', 'prayer', 'paradise', 'light']
                : ['intentions', 'charity', 'knowledge', 'faith', 'parents']
              ).map(s => (
                <TouchableOpacity
                  key={s}
                  style={[styles.suggestionChip, { backgroundColor: cardBg, borderColor }]}
                  onPress={() => handleSearch(s)}
                >
                  <Text style={[styles.suggestionText, { color: colors.gold[700] }]}>{s}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
      ) : results.length === 0 && searched ? (
        <View style={[styles.center, { backgroundColor: listBg }]}>
          <Ionicons name="documents-outline" size={40} color={isDark ? darkColors.text.muted : colors.parchment[300]} />
          <Text style={[styles.emptyTitle, { color: isDark ? darkColors.text.primary : colors.parchment[800] }]}>No results found</Text>
          <Text style={[styles.emptyText, { color: textMuted }]}>
            {tab === 'quran'
              ? 'Try a different keyword or check the spelling.'
              : 'Make sure the hadith collection is loaded/cached first by opening it from the Hadith screen.'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={results}
          keyExtractor={(_, i) => `${tab}:${i}`}
          style={{ backgroundColor: listBg }}
          contentContainerStyle={styles.list}
          ListHeaderComponent={
            <Text style={[styles.resultCount, { color: textMuted }]}>{results.length} result{results.length !== 1 ? 's' : ''} for "{query}"</Text>
          }
          renderItem={({ item, index }) => {
            const r = item as Record<string, unknown>;
            const isQuran = tab === 'quran';
            const handleLongPress = async () => {
              const shareText = isQuran
                ? `${String(r.arabicText ?? '')}\n\n"${String(r.translationText ?? '')}"\n\n— Quran ${r.surahNumber}:${r.ayahNumber} (${String(r.surahEnglishName ?? '')})`
                : `${String(r.text ?? '')}\n\n— ${String(r.collectionName ?? '')} #${String(r.hadithNumber ?? '')}`;
              try { await Share.share({ message: shareText }); } catch { /* cancelled */ }
            };
            return (
              <FadeInRow index={index}>
                <TouchableOpacity
                  style={[styles.resultCard, { backgroundColor: cardBg }]}
                  onPress={() => {
                    if (isQuran) {
                      navigation.navigate('SurahDetail', {
                        surahNumber: r.surahNumber as number,
                        englishName: r.surahEnglishName as string,
                      });
                    } else {
                      navigation.navigate('HadithCollectionDetail', {
                        collectionId: r.collectionId as string,
                        name: r.collectionName as string,
                        initialHadithNumber: r.hadithNumber as number,
                      });
                    }
                  }}
                  onLongPress={handleLongPress}
                  delayLongPress={400}
                  activeOpacity={0.8}
                >
                  <View style={styles.resultHeader}>
                    <View style={styles.surahBadge}>
                      <Text style={[styles.surahBadgeName, { color: textPrimary }]}>
                        {isQuran ? (r.surahEnglishName as string) : (r.collectionName as string)}
                      </Text>
                      <Text style={styles.surahBadgeRef}>
                        {isQuran ? `${r.surahNumber}:${r.ayahNumber}` : `Hadith #${r.hadithNumber}`}
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={14} color={textMuted} />
                  </View>
                  {isQuran && r.arabicText ? (
                    <Text style={[styles.arabicText, { fontFamily: 'Amiri_400Regular', color: textPrimary }]} numberOfLines={2}>
                      {r.arabicText as string}
                    </Text>
                  ) : null}
                  <Text style={[styles.translationText, { color: textSecondary }]} numberOfLines={3}>
                    {isQuran ? (r.translationText as string) : (r.text as string)}
                  </Text>
                </TouchableOpacity>
              </FadeInRow>
            );
          }}
        />
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: { paddingTop: 52, paddingBottom: spacing.xl, paddingHorizontal: spacing.lg, gap: spacing.md, overflow: 'hidden' },
  heading: { ...typography.displayMd, color: colors.white },
  tabRow: { flexDirection: 'row' },
  tabPillTrack: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
    padding: 3,
    gap: 2,
  },
  tabPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
  },
  tabPillActive: { backgroundColor: colors.gold[400] },
  tabPillLabel: { ...typography.caption, color: 'rgba(255,255,255,0.6)', fontWeight: '700' },
  tabPillLabelActive: { color: colors.navy[900] },
  searchRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: radius.md, paddingHorizontal: spacing.md, paddingVertical: spacing.md },
  input: { flex: 1, ...typography.body, color: colors.white },

  recentSection: { padding: spacing.lg, gap: spacing.sm },

  // Islamic Bismillah empty state
  bismillahBox: {
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    marginBottom: spacing.sm,
  },
  bismillahText: {
    fontSize: 32,
    color: colors.gold[500],
    textAlign: 'center',
    lineHeight: 52,
  },
  recentHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.xs },
  recentTitle: { ...typography.caption, fontWeight: '700', letterSpacing: 1 },
  recentClear: { ...typography.caption, color: colors.gold[600], fontWeight: '600' },
  recentRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.sm },
  recentText: { ...typography.bodySmall },

  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xxl, gap: spacing.md },
  loadingText: { ...typography.bodySmall },
  errorText: { ...typography.body, color: colors.semantic.error, textAlign: 'center' },
  retryBtn: { backgroundColor: colors.navy[800], paddingHorizontal: spacing.xl, paddingVertical: spacing.sm, borderRadius: radius.pill },
  retryText: { ...typography.bodySmall, color: colors.white, fontWeight: '600' },
  emptyTitle: { ...typography.heading },
  emptyText: { ...typography.body, textAlign: 'center', lineHeight: 24 },
  suggestionRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, justifyContent: 'center', marginTop: spacing.sm },
  suggestionChip: { borderRadius: radius.pill, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, borderWidth: 1 },
  suggestionText: { ...typography.bodySmall, fontWeight: '600' },
  list: { padding: spacing.lg, paddingBottom: spacing.xxxl, gap: spacing.md },
  resultCount: { ...typography.caption, marginBottom: spacing.sm },
  resultCard: { borderRadius: radius.md, padding: spacing.lg, gap: spacing.sm, ...shadow.sm },
  resultHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  surahBadge: { gap: 2 },
  surahBadgeName: { ...typography.subheading },
  surahBadgeRef: { ...typography.caption, color: colors.gold[600] },
  arabicText: { fontSize: 18, textAlign: 'right', lineHeight: 32, writingDirection: 'rtl' },
  translationText: { ...typography.body, lineHeight: 22 },
});
