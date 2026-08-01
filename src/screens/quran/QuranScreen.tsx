import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, Easing, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { TabAndStackNavigation } from '../../navigation/types';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { LoadingView, ErrorView } from '../../components/common/AsyncStateView';
import { SurahListItem } from '../../components/quran/SurahListItem';
import { fetchSurahList } from '../../services/api/quranApi';
import { JUZ_LIST } from '../../data/juzData';
import { Surah } from '../../types/models';
import { colors, radius, shadow, spacing, typography } from '../../theme';

type Tab = 'surah' | 'juz';

export function QuranScreen() {
  const navigation = useNavigation<TabAndStackNavigation>();
  const [activeTab, setActiveTab] = useState<Tab>('surah');
  const [surahs, setSurahs] = useState<Surah[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const tabIndicator = useRef(new Animated.Value(0)).current;

  const load = useCallback(async () => {
    setIsLoading(true); setError(null);
    try { setSurahs(await fetchSurahList()); }
    catch { setError('Could not load surahs. Check your connection.'); }
    finally { setIsLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const switchTab = (tab: Tab) => {
    setActiveTab(tab);
    Animated.timing(tabIndicator, {
      toValue: tab === 'surah' ? 0 : 1,
      duration: 200,
      useNativeDriver: false,
      easing: Easing.out(Easing.cubic),
    }).start();
  };

  const tabLeft = tabIndicator.interpolate({ inputRange: [0, 1], outputRange: ['2%', '52%'] });

  const renderHeader = () => (
    <LinearGradient colors={['#060C1F', '#0B1330', '#162354']} style={styles.header}>
      <View style={styles.headerDecor1} />
      <View style={styles.headerDecor2} />

      <Text style={[styles.headerAr, { fontFamily: 'Amiri_400Regular' }]}>القرآن الكريم</Text>
      <Text style={styles.headerEn}>The Noble Quran</Text>
      <View style={styles.headerMeta}>
        <View style={styles.metaPill}>
          <Ionicons name="book-outline" size={11} color={colors.gold[400]} />
          <Text style={styles.metaPillText}>114 Surahs</Text>
        </View>
        <View style={styles.metaDot} />
        <View style={styles.metaPill}>
          <Ionicons name="list-outline" size={11} color={colors.gold[400]} />
          <Text style={styles.metaPillText}>6,236 Verses</Text>
        </View>
      </View>

      {/* Animated tab bar */}
      <View style={styles.tabContainer}>
        <View style={styles.tabBg}>
          <Animated.View style={[styles.tabIndicator, { left: tabLeft }]} />
          {(['surah', 'juz'] as Tab[]).map(tab => (
            <TouchableOpacity
              key={tab}
              style={styles.tabBtn}
              onPress={() => switchTab(tab)}
            >
              <Ionicons
                name={tab === 'surah' ? 'list-outline' : 'apps-outline'}
                size={14}
                color={activeTab === tab ? colors.navy[900] : 'rgba(255,255,255,0.5)'}
              />
              <Text style={[styles.tabLabel, activeTab === tab && styles.tabLabelActive]}>
                {tab === 'surah' ? 'By Surah' : 'By Juz'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </LinearGradient>
  );

  if (isLoading) return <ScreenContainer dark><LoadingView /></ScreenContainer>;
  if (error) return <ScreenContainer><ErrorView message={error} onRetry={load} /></ScreenContainer>;

  if (activeTab === 'juz') {
    return (
      <ScreenContainer noPadding>
        <FlatList
          data={JUZ_LIST}
          keyExtractor={item => String(item.number)}
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={renderHeader}
          renderItem={({ item }) => (
            <JuzCard
              item={item}
              onPress={() => navigation.navigate('JuzDetail', { juzNumber: item.number })}
            />
          )}
        />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer noPadding>
      <FlatList
        data={surahs}
        keyExtractor={item => String(item.number)}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={renderHeader}
        renderItem={({ item }) => (
          <SurahListItem
            surah={item}
            onPress={() => navigation.navigate('SurahDetail', { surahNumber: item.number, englishName: item.englishName })}
          />
        )}
      />
    </ScreenContainer>
  );
}

function JuzCard({ item, onPress }: { item: any; onPress: () => void }) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const onPressIn  = () => Animated.spring(scaleAnim, { toValue: 0.97, useNativeDriver: true, tension: 300, friction: 10 }).start();
  const onPressOut = () => Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, tension: 300, friction: 10 }).start();
  const hue = (item.number * 25) % 360;
  const badgeColor = `hsl(${hue}, 55%, 28%)`;

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity style={styles.juzCard} onPress={onPress} onPressIn={onPressIn} onPressOut={onPressOut} activeOpacity={1}>
        <View style={[styles.juzBadge, { backgroundColor: badgeColor }]}>
          <Text style={styles.juzBadgeNum}>{item.number}</Text>
          <Text style={styles.juzBadgeLabel}>JUZ</Text>
        </View>
        <View style={styles.juzInfo}>
          <Text style={styles.juzEnglish}>{item.english}</Text>
          <Text style={[styles.juzArabic, { fontFamily: 'Amiri_400Regular' }]}>{item.arabic}</Text>
        </View>
        <View style={styles.juzStart}>
          <Text style={styles.juzStartText}>Surah {item.startSurah}</Text>
        </View>
        <Ionicons name="chevron-forward" size={14} color={colors.parchment[400]} />
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingTop: spacing.xl + spacing.xl, paddingBottom: spacing.xxl,
    paddingHorizontal: spacing.lg, alignItems: 'center', gap: spacing.sm,
    overflow: 'hidden', marginBottom: spacing.md,
  },
  headerDecor1: { position: 'absolute', right: -60, top: -60, width: 200, height: 200, borderRadius: 100, borderWidth: 1, borderColor: 'rgba(245,158,11,0.15)' },
  headerDecor2: { position: 'absolute', left: -40, bottom: -30, width: 140, height: 140, borderRadius: 70, borderWidth: 1, borderColor: 'rgba(245,158,11,0.08)' },
  headerAr: { fontSize: 34, color: colors.gold[300] },
  headerEn: { ...typography.subheading, color: 'rgba(255,255,255,0.6)', letterSpacing: 0.5 },
  headerMeta: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.md },
  metaPill: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(245,158,11,0.15)', borderRadius: radius.pill, paddingHorizontal: spacing.sm, paddingVertical: 4, borderWidth: 1, borderColor: 'rgba(245,158,11,0.25)' },
  metaPillText: { fontSize: 11, color: colors.gold[300], fontWeight: '700' },
  metaDot: { width: 3, height: 3, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.2)' },

  tabContainer: { width: '100%' },
  tabBg: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.07)', borderRadius: radius.pill, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', position: 'relative', height: 42, overflow: 'hidden' },
  tabIndicator: { position: 'absolute', width: '48%', height: 36, top: 3, borderRadius: radius.pill, backgroundColor: colors.gold[400] },
  tabBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.xs, zIndex: 1 },
  tabLabel: { ...typography.caption, color: 'rgba(255,255,255,0.5)', fontWeight: '700' },
  tabLabelActive: { color: colors.navy[900] },

  listContent: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxxl },

  juzCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.white, borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.sm, gap: spacing.md, ...shadow.sm },
  juzBadge: { width: 52, height: 52, borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center', gap: 0 },
  juzBadgeNum: { ...typography.heading, color: 'rgba(255,255,255,0.95)' },
  juzBadgeLabel: { fontSize: 8, color: 'rgba(255,255,255,0.45)', fontWeight: '800', letterSpacing: 1.5 },
  juzInfo: { flex: 1, gap: 2 },
  juzEnglish: { ...typography.subheading, color: colors.parchment[950] },
  juzArabic: { fontSize: 15, color: colors.parchment[500], lineHeight: 24 },
  juzStart: { backgroundColor: colors.parchment[100], borderRadius: radius.pill, paddingHorizontal: spacing.sm, paddingVertical: 3 },
  juzStartText: { fontSize: 10, color: colors.parchment[600], fontWeight: '700' },
});
