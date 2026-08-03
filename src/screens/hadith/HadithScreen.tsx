import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { FlatList, Image, RefreshControl, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { LoadingView, ErrorView } from '../../components/common/AsyncStateView';
import { fetchHadithCollections } from '../../services/api/hadithApi';
import { HadithCollection } from '../../types/models';
import { FadeInRow } from '../../components/common/FadeInRow';
import { Haptics } from '../../services/haptics';
import { useThemeColors } from '../../hooks/useThemeColors';
import { colors, radius, shadow, spacing, typography } from '../../theme';
import type { RootStackParamList } from '../../navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type GradeFilter = 'all' | 'sahih' | 'authenticated';

const COLLECTION_COLORS: Record<string, string> = {
  bukhari: '#F59E0B',
  muslim:  '#4ADE80',
  nawawi:  '#38BDF8',
  qudsi:   '#A78BFA',
  abudawud: '#F472B6',
  tirmidhi: '#FB923C',
  ibnmajah: '#818CF8',
};

const COLLECTION_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  bukhari: 'book',
  muslim:  'book',
  nawawi:  'list',
  qudsi:   'star',
};

export function HadithScreen() {
  const navigation = useNavigation<Nav>();
  const { isDark, surface, textPrimary } = useThemeColors();
  const [collections, setCollections] = useState<HadithCollection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [gradeFilter, setGradeFilter] = useState<GradeFilter>('all');

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try { setCollections(await fetchHadithCollections()); }
    catch { setError('Could not load hadith collections. Check your connection.'); }
    finally { setIsLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try { setCollections(await fetchHadithCollections()); } catch {}
    setRefreshing(false);
  }, []);

  const getGrade = (id: string): 'sahih' | 'authenticated' => (id === 'bukhari' || id === 'muslim' ? 'sahih' : 'authenticated');

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return collections
      .filter(c => !q || c.name.toLowerCase().includes(q) || c.id.toLowerCase().includes(q))
      .filter(c => gradeFilter === 'all' || getGrade(c.id) === gradeFilter);
  }, [collections, searchQuery, gradeFilter]);

  const renderHeader = () => (
    <LinearGradient colors={['#060C1F', '#0B1330', '#162354']} style={styles.header}>
      <Image source={require('../../../assets/images/hadithscreenheader.png')} style={styles.headerBgImage} resizeMode="cover" />
      <View style={styles.headerScrim} />
      <View style={styles.headerDecor} />
      <StatusBar barStyle="light-content" />
      <Text style={[styles.headerAr, { fontFamily: 'Amiri_400Regular' }]}>الحديث الشريف</Text>
      <Text style={styles.headerEn}>Hadith Collections</Text>
      <Text style={styles.headerSub}>Authentic traditions of the Prophet ﷺ</Text>

      <View style={styles.searchRow}>
        <View style={[styles.searchBar, searchFocused && styles.searchBarFocused]}>
          <Ionicons name="search" size={15} color={searchFocused ? colors.gold[400] : 'rgba(255,255,255,0.35)'} />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search collections…"
            placeholderTextColor="rgba(255,255,255,0.25)"
            style={styles.searchInput}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={15} color="rgba(255,255,255,0.4)" />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity
          style={[styles.filterBtn, (filterOpen || gradeFilter !== 'all') && styles.filterBtnActive]}
          onPress={() => setFilterOpen(o => !o)}
          activeOpacity={0.8}
        >
          <Ionicons name="options-outline" size={18} color={filterOpen || gradeFilter !== 'all' ? colors.navy[900] : colors.gold[400]} />
        </TouchableOpacity>
      </View>

      {filterOpen && (
        <View style={styles.filterChipRow}>
          {([
            { key: 'all', label: 'All Grades' },
            { key: 'sahih', label: 'Sahih' },
            { key: 'authenticated', label: 'Authenticated' },
          ] as { key: GradeFilter; label: string }[]).map(f => (
            <TouchableOpacity
              key={f.key}
              style={[styles.filterChip, gradeFilter === f.key && styles.filterChipActive]}
              onPress={() => setGradeFilter(f.key)}
              activeOpacity={0.8}
            >
              <Text style={[styles.filterChipText, gradeFilter === f.key && styles.filterChipTextActive]}>{f.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      <View style={styles.statRow}>
        <View style={styles.statPill}>
          <Ionicons name="library-outline" size={11} color={colors.gold[400]} />
          <Text style={styles.statText}>{collections.length} Collections</Text>
        </View>
        <View style={styles.statDot} />
        <View style={styles.statPill}>
          <Ionicons name="checkmark-circle-outline" size={11} color="#4ADE80" />
          <Text style={styles.statText}>Scholar Graded</Text>
        </View>
      </View>

      {/* Gold divider */}
      <View style={styles.goldDivider}>
        <View style={styles.goldLine} />
        <Text style={styles.goldDividerIcon}>◆</Text>
        <View style={styles.goldLine} />
      </View>
    </LinearGradient>
  );

  if (isLoading) return <ScreenContainer dark><LoadingView /></ScreenContainer>;
  if (error) return <ScreenContainer><ErrorView message={error} onRetry={load} /></ScreenContainer>;

  return (
    <ScreenContainer noPadding>
      <FlatList
        data={filtered}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        ListHeaderComponent={renderHeader}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.gold[400]} colors={[colors.gold[400]]} />
        }
        ListEmptyComponent={
          <Text style={styles.emptyText}>No collections match "{searchQuery}"</Text>
        }
        renderItem={({ item, index }) => {
          const accent = COLLECTION_COLORS[item.id] ?? colors.gold[400];
          const icon = COLLECTION_ICONS[item.id] ?? 'book-outline';
          return (
            <FadeInRow index={index} delay={50}>
            <TouchableOpacity
              style={[styles.card, { backgroundColor: surface }]}
              onPress={() => { Haptics.impact('light'); navigation.navigate('HadithCollectionDetail', { collectionId: item.id, name: item.name }); }}
              activeOpacity={0.8}
            >
              <View style={[styles.cardAccent, { backgroundColor: accent }]} />
              <View style={[styles.cardIcon, { backgroundColor: accent + '22' }]}>
                <Ionicons name={icon} size={22} color={accent} />
              </View>
              <View style={styles.cardBody}>
                <Text style={[styles.cardName, { color: textPrimary }]}>{item.name}</Text>
                <View style={styles.cardMeta}>
                  {item.hasArabic && (
                    <View style={styles.arabicBadge}>
                      <Text style={[styles.arabicBadgeText, { fontFamily: 'Amiri_400Regular' }]}>عربي</Text>
                    </View>
                  )}
                  <View style={[styles.gradeBadge, { backgroundColor: '#1E6B4A22' }]}>
                    <Ionicons name="checkmark-circle" size={11} color="#1E6B4A" />
                    <Text style={[styles.gradeText, { color: '#1E6B4A' }]}>
                      {item.id === 'bukhari' || item.id === 'muslim' ? 'Sahih' : 'Authenticated'}
                    </Text>
                  </View>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={16} color={colors.parchment[300]} />
            </TouchableOpacity>
            </FadeInRow>
          );
        }}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingTop: 52, paddingBottom: spacing.xxl,
    paddingHorizontal: spacing.lg, alignItems: 'center', gap: spacing.sm,
    overflow: 'hidden', marginBottom: spacing.md,
  },
  headerBgImage: { position: 'absolute', right: 0, bottom: 0, width: '100%', height: '130%', opacity: 0.35 },
  headerScrim: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(6,12,31,0.38)' },
  headerDecor: { position: 'absolute', right: -50, top: -50, width: 180, height: 180, borderRadius: 90, borderWidth: 1, borderColor: 'rgba(56,189,248,0.1)' },
  headerAr: { fontSize: 30, color: colors.gold[300] },
  headerEn: { ...typography.heading, color: colors.white },
  headerSub: { ...typography.caption, color: 'rgba(255,255,255,0.35)', marginBottom: spacing.xs },
  searchRow: { width: '100%', flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  searchBar: {
    flex: 1, flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: radius.md,
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
  },
  searchBarFocused: { borderColor: 'rgba(245,158,11,0.45)' },
  searchInput: { flex: 1, ...typography.bodySmall, color: colors.white },
  filterBtn: {
    width: 40, height: 40, borderRadius: radius.md,
    backgroundColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
  },
  filterBtnActive: { backgroundColor: colors.gold[400], borderColor: colors.gold[400] },
  filterChipRow: { flexDirection: 'row', gap: spacing.xs, width: '100%', flexWrap: 'wrap' },
  filterChip: {
    borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: 6,
    backgroundColor: 'rgba(255,255,255,0.07)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)',
  },
  filterChipActive: { backgroundColor: colors.gold[400], borderColor: colors.gold[400] },
  filterChipText: { fontSize: 11, fontWeight: '700', color: 'rgba(255,255,255,0.6)' },
  filterChipTextActive: { color: colors.navy[900] },
  statRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  statPill: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: radius.pill, paddingHorizontal: spacing.sm, paddingVertical: 4 },
  statText: { fontSize: 11, color: 'rgba(255,255,255,0.55)', fontWeight: '600' },
  statDot: { width: 3, height: 3, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.2)' },
  goldDivider: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingTop: spacing.md, paddingBottom: 2 },
  goldLine: { flex: 1, height: 1, backgroundColor: 'rgba(245,158,11,0.3)' },
  goldDividerIcon: { fontSize: 8, color: 'rgba(245,158,11,0.5)' },

  list: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxxl },
  card: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    backgroundColor: colors.white, borderRadius: radius.md,
    padding: spacing.lg, marginBottom: spacing.sm,
    overflow: 'hidden', ...shadow.sm,
  },
  cardAccent: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 3 },
  cardIcon: { width: 46, height: 46, borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center' },
  cardBody: { flex: 1, gap: spacing.xs },
  cardName: { ...typography.bodyMedium, color: colors.parchment[950] },
  cardMeta: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, flexWrap: 'wrap' },
  arabicBadge: { backgroundColor: 'rgba(245,158,11,0.12)', borderRadius: radius.pill, paddingHorizontal: spacing.sm, paddingVertical: 2, borderWidth: 1, borderColor: 'rgba(245,158,11,0.25)' },
  arabicBadgeText: { fontSize: 11, color: colors.gold[600] },
  gradeBadge: { flexDirection: 'row', alignItems: 'center', gap: 3, borderRadius: radius.pill, paddingHorizontal: spacing.sm, paddingVertical: 2 },
  gradeText: { fontSize: 10, fontWeight: '700' },
  emptyText: { ...typography.body, color: colors.parchment[500], textAlign: 'center', marginTop: spacing.xxl },
});
