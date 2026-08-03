import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Easing,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { TabAndStackNavigation } from '../../navigation/types';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { LoadingView, ErrorView } from '../../components/common/AsyncStateView';
import { SurahListItem } from '../../components/quran/SurahListItem';
import { fetchSurahList } from '../../services/api/quranApi';
import { getAllProgress } from '../../services/db/progressRepo';
import { useAudioStore } from '../../store/useAudioStore';
import { JUZ_LIST } from '../../data/juzData';
import { Surah, ReadingProgress } from '../../types/models';
import { FadeInRow } from '../../components/common/FadeInRow';
import { ReaderSettingsPanel } from '../../components/quran/ReaderSettingsPanel';
import { useThemeStore } from '../../store/useThemeStore';
import { darkColors } from '../../theme/darkColors';
import { colors, radius, shadow, spacing, typography } from '../../theme';
import { useMiniPlayerPadding } from '../../hooks/useMiniPlayerPadding';
import { OfflineBanner } from '../../components/common/OfflineBanner';
import { getTodayHijri } from '../../services/hijri/hijriCalendar';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_GAP = spacing.sm;
const CARD_WIDTH = (SCREEN_WIDTH - spacing.lg * 2 - CARD_GAP) / 2;
const FAV_KEY = 'ilmai.quran.favourites';

type Tab = 'surah' | 'juz' | 'favourites';

export function QuranScreen() {
  const navigation = useNavigation<TabAndStackNavigation>();
  const isDark = useThemeStore(s => s.isDark);
  const currentAudioSurah = useAudioStore(s => s.currentSurah);
  const miniPlayerPad = useMiniPlayerPadding();

  const [activeTab, setActiveTab] = useState<Tab>('surah');
  const [surahs, setSurahs] = useState<Surah[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [favourites, setFavourites] = useState<Set<number>>(new Set());
  const [lastSeenProgress, setLastSeenProgress] = useState<ReadingProgress | null>(null);
  const tabIndicator = useRef(new Animated.Value(0)).current;

  const load = useCallback(async () => {
    setIsLoading(true); setError(null);
    try { setSurahs(await fetchSurahList()); }
    catch { setError('Could not load surahs. Check your connection.'); }
    finally { setIsLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Load favourites from storage
  useEffect(() => {
    AsyncStorage.getItem(FAV_KEY).then(v => {
      if (v) setFavourites(new Set(JSON.parse(v) as number[]));
    }).catch(() => {});
  }, []);

  // Refresh Last Seen every time screen comes into focus
  useFocusEffect(useCallback(() => {
    getAllProgress().then(all => {
      const q = all.find(p => p.key === 'quran');
      setLastSeenProgress(q ?? null);
    }).catch(() => {});
  }, []));

  const toggleFavourite = useCallback(async (surahNumber: number) => {
    setFavourites(prev => {
      const next = new Set(prev);
      if (next.has(surahNumber)) next.delete(surahNumber);
      else next.add(surahNumber);
      AsyncStorage.setItem(FAV_KEY, JSON.stringify([...next])).catch(() => {});
      return next;
    });
  }, []);

  const switchTab = (tab: Tab) => {
    setActiveTab(tab);
    setSearchQuery('');
    Animated.timing(tabIndicator, {
      toValue: tab === 'surah' ? 0 : tab === 'juz' ? 1 : 2,
      duration: 200,
      useNativeDriver: false,
      easing: Easing.out(Easing.cubic),
    }).start();
  };

  const tabLeft = tabIndicator.interpolate({ inputRange: [0, 1, 2], outputRange: ['1%', '34%', '67%'] });

  const filteredSurahs = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return surahs;
    return surahs.filter(s =>
      s.englishName.toLowerCase().includes(q) ||
      s.name.includes(searchQuery) ||
      s.englishNameTranslation.toLowerCase().includes(q) ||
      String(s.number).startsWith(q),
    );
  }, [surahs, searchQuery]);

  const filteredJuz = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return JUZ_LIST;
    return JUZ_LIST.filter((j: any) =>
      j.english?.toLowerCase().includes(q) ||
      j.arabic?.includes(searchQuery) ||
      String(j.number).startsWith(q),
    );
  }, [searchQuery]);

  const favouriteSurahs = useMemo(() =>
    surahs.filter(s => favourites.has(s.number)),
    [surahs, favourites],
  );

  const surahNameMap = useMemo(() => {
    const map: Record<number, string> = {};
    surahs.forEach(s => { map[s.number] = s.englishName; });
    return map;
  }, [surahs]);

  const hijri = useMemo(() => getTodayHijri(), []);
  const bg = isDark ? darkColors.background : colors.parchment[50];
  const cardBg = isDark ? darkColors.surface : colors.white;
  const textPrimary = isDark ? darkColors.text.primary : colors.parchment[950];
  const textSecondary = isDark ? darkColors.text.secondary : colors.parchment[500];

  const renderHeader = () => (
    <View style={styles.headerWrap}>
      <LinearGradient colors={['#06091A', '#0B1330', '#162354']} style={styles.header}>
        <Image source={require('../../../assets/images/quranheaderfinal.png')} style={styles.bannerImage} resizeMode="cover" />
        {/* Hijri date pill */}
        <View style={styles.hijriPill}>
          <Text style={[styles.hijriPillAr, { fontFamily: 'Amiri_400Regular' }]}>{hijri.formattedAr}</Text>
          <Text style={styles.hijriPillEn}>{hijri.formatted}</Text>
        </View>
        {/* ── Last Seen + Last Audio quick-access row ── */}
        <View style={styles.quickRow}>
        {/* Last Seen */}
        <TouchableOpacity
          style={styles.quickCard}
          activeOpacity={0.82}
          onPress={() => {
            if (lastSeenProgress?.surahNumber) {
              navigation.navigate('SurahDetail', {
                surahNumber: lastSeenProgress.surahNumber,
                englishName: lastSeenProgress.surahName ?? '',
                initialAyahNumber: lastSeenProgress.ayahNumber,
              });
            }
          }}
        >
          <View style={styles.quickCardIcon}>
            <Ionicons name="eye-outline" size={20} color={colors.gold[400]} />
          </View>
          <Text style={styles.quickCardLabel}>Last Seen</Text>
          <Text style={styles.quickCardValue} numberOfLines={1}>
            {lastSeenProgress?.surahName ?? 'Not set'}
          </Text>
          {lastSeenProgress?.ayahNumber && (
            <Text style={styles.quickCardSub}>Ayah {lastSeenProgress.ayahNumber}</Text>
          )}
        </TouchableOpacity>

        {/* Last Audio */}
        <TouchableOpacity
          style={styles.quickCard}
          activeOpacity={0.82}
          onPress={() => {
            if (currentAudioSurah?.number && currentAudioSurah.number < 1000) {
              navigation.navigate('SurahDetail', {
                surahNumber: currentAudioSurah.number,
                englishName: currentAudioSurah.englishName,
              });
            }
          }}
        >
          <View style={[styles.quickCardIcon, { backgroundColor: 'rgba(74,222,128,0.15)' }]}>
            <Ionicons name="headset-outline" size={20} color="#4ADE80" />
          </View>
          <Text style={styles.quickCardLabel}>Last Audio</Text>
          <Text style={styles.quickCardValue} numberOfLines={1}>
            {currentAudioSurah && currentAudioSurah.number < 1000
              ? currentAudioSurah.englishName
              : 'Not set'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* ── Quick icon row (Bookmarks, Search) ── */}
      <View style={styles.iconRow}>
        {[
          { icon: 'bookmark-outline' as const, label: 'Bookmarks', onPress: () => navigation.navigate('Bookmarks') },
          { icon: 'search-outline' as const, label: 'Search', onPress: () => navigation.navigate('Search') },
          { icon: 'hand-left-outline' as const, label: 'Duas', onPress: () => navigation.navigate('Duas') },
          { icon: 'school-outline' as const, label: 'Review', onPress: () => navigation.navigate('ComprehensionReview') },
        ].map(item => (
          <TouchableOpacity key={item.label} style={styles.iconBtn} onPress={item.onPress} activeOpacity={0.7}>
            <Ionicons name={item.icon} size={20} color="rgba(255,255,255,0.65)" />
            <Text style={styles.iconBtnLabel}>{item.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* ── Search Row ── */}
      <View style={styles.searchRow}>
        <View style={[styles.searchBar, searchFocused && styles.searchBarFocused]}>
          <Ionicons name="search" size={15} color={searchFocused ? colors.gold[400] : 'rgba(255,255,255,0.35)'} />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder={activeTab === 'surah' ? 'Search surah name or number…' : activeTab === 'juz' ? 'Search juz…' : 'Search favourites…'}
            placeholderTextColor="rgba(255,255,255,0.25)"
            style={styles.searchInput}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')} activeOpacity={0.7}>
              <Ionicons name="close-circle" size={15} color="rgba(255,255,255,0.4)" />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity style={styles.settingsBtn} onPress={() => setSettingsOpen(true)} activeOpacity={0.8}>
          <Ionicons name="options-outline" size={20} color={colors.gold[400]} />
        </TouchableOpacity>
      </View>

      {/* ── 3-tab bar ── */}
      <View style={styles.tabContainer}>
        <View style={styles.tabBg}>
          <Animated.View style={[styles.tabIndicator, { left: tabLeft }]} />
          {([
            { key: 'surah',      icon: 'list-outline',     label: 'Surah' },
            { key: 'juz',        icon: 'apps-outline',     label: 'Para' },
            { key: 'favourites', icon: 'heart-outline',    label: 'Fav' },
          ] as const).map(tab => (
            <TouchableOpacity
              key={tab.key}
              style={styles.tabBtn}
              onPress={() => switchTab(tab.key)}
              activeOpacity={0.75}
            >
              <Ionicons
                name={activeTab === tab.key && tab.key === 'favourites' ? 'heart' : tab.icon}
                size={13}
                color={activeTab === tab.key ? colors.navy[900] : 'rgba(255,255,255,0.5)'}
              />
              <Text style={[styles.tabLabel, activeTab === tab.key && styles.tabLabelActive]}>
                {tab.label}
                {tab.key === 'favourites' && favourites.size > 0 ? ` (${favourites.size})` : ''}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {searchQuery.length > 0 && (
        <Text style={styles.resultCount}>
          {activeTab === 'surah' ? filteredSurahs.length : activeTab === 'juz' ? filteredJuz.length : favouriteSurahs.length} results
        </Text>
      )}

      {/* Gold bismillah divider */}
      <View style={styles.bismillahDivider}>
        <View style={styles.bismillahLine} />
        <Text style={[styles.bismillahText, { fontFamily: 'Amiri_400Regular' }]}>
          بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
        </Text>
        <View style={styles.bismillahLine} />
      </View>
      </LinearGradient>
    </View>
  );

  if (isLoading) return <ScreenContainer dark><LoadingView /></ScreenContainer>;
  if (error) return <ScreenContainer><ErrorView message={error} onRetry={load} /></ScreenContainer>;

  if (activeTab === 'juz') {
    return (
      <ScreenContainer noPadding>
        <OfflineBanner />
        <ReaderSettingsPanel visible={settingsOpen} onClose={() => setSettingsOpen(false)} />
        <FlatList
          key="juz-grid"
          data={filteredJuz as any[]}
          keyExtractor={item => String(item.number)}
          numColumns={2}
          columnWrapperStyle={styles.gridRow}
          contentContainerStyle={[styles.listContent, { backgroundColor: bg, paddingBottom: spacing.xxxl + miniPlayerPad }]}
          ListHeaderComponent={renderHeader}
          ListEmptyComponent={<Text style={[styles.emptyText, { color: textSecondary }]}>No results for "{searchQuery}"</Text>}
          renderItem={({ item }) => (
            <JuzGridCard
              item={item}
              cardBg={cardBg}
              textPrimary={textPrimary}
              textSecondary={textSecondary}
              startSurahName={surahNameMap[item.startSurah]}
              onPress={() => navigation.navigate('JuzDetail', { juzNumber: item.number })}
            />
          )}
        />
      </ScreenContainer>
    );
  }

  if (activeTab === 'favourites') {
    return (
      <ScreenContainer noPadding>
        <OfflineBanner />
        <ReaderSettingsPanel visible={settingsOpen} onClose={() => setSettingsOpen(false)} />
        <FlatList
          key="fav-list"
          data={favouriteSurahs}
          keyExtractor={item => String(item.number)}
          contentContainerStyle={[styles.listContent, { backgroundColor: bg, paddingBottom: spacing.xxxl + miniPlayerPad }]}
          ListHeaderComponent={renderHeader}
          ListEmptyComponent={
            <View style={styles.emptyFav}>
              <Ionicons name="heart-outline" size={40} color={colors.parchment[300]} />
              <Text style={[styles.emptyText, { color: textSecondary }]}>No favourites yet</Text>
              <Text style={[styles.emptySubText, { color: textSecondary }]}>Tap the heart on any surah to save it here</Text>
            </View>
          }
          renderItem={({ item, index }) => (
            <FadeInRow index={index} delay={30}>
              <SurahListItem
                surah={item}
                isFavourite={favourites.has(item.number)}
                onToggleFavourite={() => toggleFavourite(item.number)}
                onPress={() => navigation.navigate('SurahDetail', { surahNumber: item.number, englishName: item.englishName })}
              />
            </FadeInRow>
          )}
        />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer noPadding>
      <OfflineBanner />
      <ReaderSettingsPanel visible={settingsOpen} onClose={() => setSettingsOpen(false)} />
      <FlatList
        key="surah-list"
        data={filteredSurahs}
        keyExtractor={item => String(item.number)}
        contentContainerStyle={[styles.listContent, { backgroundColor: bg, paddingBottom: spacing.xxxl + miniPlayerPad }]}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={<Text style={[styles.emptyText, { color: textSecondary }]}>No surahs match "{searchQuery}"</Text>}
        renderItem={({ item, index }) => (
          <FadeInRow index={index} delay={30}>
            <SurahListItem
              surah={item}
              isFavourite={favourites.has(item.number)}
              onToggleFavourite={() => toggleFavourite(item.number)}
              onPress={() => navigation.navigate('SurahDetail', { surahNumber: item.number, englishName: item.englishName })}
            />
          </FadeInRow>
        )}
      />
    </ScreenContainer>
  );
}

// ─── Juz 2-column grid card ───────────────────────────────────────────────────
function JuzGridCard({ item, cardBg, textPrimary, textSecondary, startSurahName, onPress }: {
  item: any; cardBg: string; textPrimary: string; textSecondary: string; startSurahName?: string; onPress: () => void;
}) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const onPressIn  = () => Animated.spring(scaleAnim, { toValue: 0.95, useNativeDriver: true, tension: 300, friction: 10 }).start();
  const onPressOut = () => Animated.spring(scaleAnim, { toValue: 1,    useNativeDriver: true, tension: 300, friction: 10 }).start();
  const hue = (item.number * 24) % 360;
  const accentColor = `hsl(${hue}, 62%, 46%)`;
  const accentSoft = `hsla(${hue}, 62%, 46%, 0.14)`;

  return (
    <Animated.View style={[gridCardStyles.card, { transform: [{ scale: scaleAnim }], backgroundColor: cardBg, width: CARD_WIDTH, borderColor: accentSoft }]}>
      <TouchableOpacity onPress={onPress} onPressIn={onPressIn} onPressOut={onPressOut} activeOpacity={1} style={gridCardStyles.touchable}>
        <View style={[gridCardStyles.topRow]}>
          <View style={[gridCardStyles.numChip, { backgroundColor: accentSoft }]}>
            <Text style={[gridCardStyles.numChipText, { color: accentColor }]}>Juz {item.number}</Text>
          </View>
          <Ionicons name="book-outline" size={13} color={accentColor} style={{ opacity: 0.6 }} />
        </View>
        <Text style={[gridCardStyles.arabicName, { fontFamily: 'Amiri_400Regular', color: textPrimary }]} numberOfLines={1}>{item.arabic}</Text>
        <Text style={[gridCardStyles.englishName, { color: textSecondary }]} numberOfLines={1}>{item.english}</Text>
        <View style={[gridCardStyles.divider, { backgroundColor: accentSoft }]} />
        <View style={gridCardStyles.startRow}>
          <Ionicons name="play-forward" size={10} color={accentColor} />
          <Text style={[gridCardStyles.startText, { color: accentColor }]} numberOfLines={1}>
            {startSurahName ? startSurahName : `Surah ${item.startSurah}`}
          </Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const gridCardStyles = StyleSheet.create({
  card: { borderRadius: radius.lg, overflow: 'hidden', borderWidth: 1, ...shadow.sm },
  touchable: { padding: spacing.md, gap: 6 },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  numChip: { borderRadius: radius.pill, paddingHorizontal: spacing.sm, paddingVertical: 3 },
  numChipText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.3 },
  arabicName: { fontSize: 22, lineHeight: 34, marginTop: 2 },
  englishName: { fontSize: 12, fontWeight: '700' },
  divider: { height: 1, marginVertical: 2 },
  startRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  startText: { fontSize: 10, fontWeight: '700', flex: 1 },
});

const styles = StyleSheet.create({
  headerWrap: { overflow: 'hidden' },
  bannerImage: { position: 'absolute', right: 0, bottom: 0, width: '100%', height: '130%', opacity: 0.30 },
  hijriPill: { alignItems: 'center', gap: 2, backgroundColor: 'rgba(212,169,62,0.1)', borderRadius: radius.pill, paddingHorizontal: spacing.lg, paddingVertical: spacing.xs, borderWidth: 1, borderColor: 'rgba(212,169,62,0.2)' },
  hijriPillAr: { fontSize: 15, color: colors.gold[300], lineHeight: 22 },
  hijriPillEn: { fontSize: 10, color: 'rgba(255,255,255,0.35)', fontWeight: '500' },
  header: {
    paddingTop: 52, paddingBottom: spacing.xxl,
    paddingHorizontal: spacing.lg, alignItems: 'center', gap: spacing.md,
    overflow: 'hidden',
  },

  // Last Seen / Last Audio row
  quickRow: { flexDirection: 'row', gap: spacing.sm, width: '100%' },
  quickCard: {
    flex: 1, backgroundColor: 'rgba(255,255,255,0.07)',
    borderRadius: radius.md, padding: spacing.md, gap: 4,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
  },
  quickCardIcon: {
    width: 36, height: 36, borderRadius: radius.sm,
    backgroundColor: 'rgba(245,158,11,0.15)',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 4,
  },
  quickCardLabel: { fontSize: 9, fontWeight: '800', letterSpacing: 1.2, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase' },
  quickCardValue: { fontSize: 13, fontWeight: '700', color: colors.white },
  quickCardSub: { fontSize: 10, color: colors.gold[400], fontWeight: '600' },

  // Quick icon row
  iconRow: { flexDirection: 'row', width: '100%', gap: spacing.xs },
  iconBtn: {
    flex: 1, alignItems: 'center', gap: 5,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: radius.sm, borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    paddingVertical: spacing.sm,
  },
  iconBtnLabel: { fontSize: 9, color: 'rgba(255,255,255,0.5)', fontWeight: '700', letterSpacing: 0.3 },

  searchRow: { flexDirection: 'row', alignItems: 'center', width: '100%', gap: spacing.sm },
  searchBar: {
    flex: 1, flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: radius.md,
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
  },
  searchBarFocused: { borderColor: 'rgba(245,158,11,0.45)', backgroundColor: 'rgba(255,255,255,0.1)' },
  searchInput: { flex: 1, ...typography.bodySmall, color: colors.white },
  settingsBtn: {
    width: 44, height: 44, borderRadius: radius.md,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
  },

  // 3-tab bar
  tabContainer: { width: '100%' },
  tabBg: {
    flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.07)',
    borderRadius: radius.pill, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
    position: 'relative', height: 42, overflow: 'hidden',
  },
  tabIndicator: { position: 'absolute', width: '32%', height: 36, top: 3, borderRadius: radius.pill, backgroundColor: colors.gold[400] },
  tabBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.xs, zIndex: 1 },
  tabLabel: { ...typography.caption, color: 'rgba(255,255,255,0.5)', fontWeight: '700', fontSize: 10 },
  tabLabelActive: { color: colors.navy[900] },

  resultCount: { fontSize: 11, color: 'rgba(255,255,255,0.35)', fontWeight: '600', alignSelf: 'flex-start' },
  bismillahDivider: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, width: '100%', paddingTop: spacing.xs },
  bismillahLine: { flex: 1, height: 1, backgroundColor: 'rgba(245,158,11,0.25)' },
  bismillahText: { fontSize: 14, color: 'rgba(245,158,11,0.6)', textAlign: 'center' },

  listContent: { paddingBottom: spacing.xxxl },
  gridRow: { justifyContent: 'space-between', marginBottom: spacing.sm, paddingHorizontal: spacing.lg },
  emptyText: { ...typography.body, textAlign: 'center', marginTop: spacing.xl, marginHorizontal: spacing.xl },
  emptySubText: { ...typography.bodySmall, textAlign: 'center', marginTop: spacing.xs, marginHorizontal: spacing.xl },
  emptyFav: { alignItems: 'center', paddingTop: spacing.xxl, gap: spacing.sm },
});
