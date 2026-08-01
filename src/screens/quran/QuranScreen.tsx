import React, { useCallback, useEffect, useState } from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
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
import { colors, gradients, radius, shadow, spacing, typography } from '../../theme';

type Tab = 'surah' | 'juz';

export function QuranScreen() {
  const navigation = useNavigation<TabAndStackNavigation>();
  const [activeTab, setActiveTab] = useState<Tab>('surah');
  const [surahs, setSurahs] = useState<Surah[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true); setError(null);
    try { setSurahs(await fetchSurahList()); }
    catch { setError('Could not load surahs. Check your connection.'); }
    finally { setIsLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const renderHeader = () => (
    <LinearGradient colors={gradients.heroNavy} style={styles.header}>
      <Text style={styles.headerTitle}>القرآن الكريم</Text>
      <Text style={styles.headerSub}>The Noble Quran</Text>
      <View style={styles.tabRow}>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'surah' && styles.tabBtnActive]}
          onPress={() => setActiveTab('surah')}
        >
          <Ionicons name="list-outline" size={14} color={activeTab === 'surah' ? colors.navy[900] : 'rgba(255,255,255,0.6)'} />
          <Text style={[styles.tabLabel, activeTab === 'surah' && styles.tabLabelActive]}>By Surah</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'juz' && styles.tabBtnActive]}
          onPress={() => setActiveTab('juz')}
        >
          <Ionicons name="apps-outline" size={14} color={activeTab === 'juz' ? colors.navy[900] : 'rgba(255,255,255,0.6)'} />
          <Text style={[styles.tabLabel, activeTab === 'juz' && styles.tabLabelActive]}>By Juz / Para</Text>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );

  if (isLoading) return <ScreenContainer dark><LoadingView /></ScreenContainer>;
  if (error) return <ScreenContainer><ErrorView message={error} onRetry={load} /></ScreenContainer>;

  if (activeTab === 'juz') {
    return (
      <ScreenContainer noPadding>
        {renderHeader()}
        <FlatList
          data={JUZ_LIST}
          keyExtractor={item => String(item.number)}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.juzCard}
              onPress={() => navigation.navigate('JuzDetail', { juzNumber: item.number })}
              activeOpacity={0.75}
            >
              <View style={styles.juzBadge}>
                <Text style={styles.juzBadgeNum}>{item.number}</Text>
                <Text style={styles.juzBadgeLabel}>Juz</Text>
              </View>
              <View style={styles.juzInfo}>
                <Text style={styles.juzEnglish}>{item.english}</Text>
                <Text style={styles.juzUrdu}>{item.arabic}</Text>
              </View>
              <View style={styles.juzStartBadge}>
                <Text style={styles.juzStartText}>Surah {item.startSurah}</Text>
              </View>
            </TouchableOpacity>
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
            onPress={() => navigation.navigate('SurahDetail', {
              surahNumber: item.number,
              englishName: item.englishName,
            })}
          />
        )}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingTop: spacing.xl,
    paddingBottom: spacing.xl,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  headerTitle: { fontSize: 30, color: colors.gold[300], textAlign: 'center' },
  headerSub: { ...typography.caption, color: 'rgba(255,255,255,0.4)', textAlign: 'center', marginBottom: spacing.lg },
  tabRow: { flexDirection: 'row', gap: spacing.sm, justifyContent: 'center' },
  tabBtn: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.xs,
    paddingHorizontal: spacing.lg, paddingVertical: spacing.sm,
    borderRadius: radius.pill, backgroundColor: 'rgba(255,255,255,0.1)',
  },
  tabBtnActive: { backgroundColor: colors.gold[400] },
  tabLabel: { ...typography.caption, color: 'rgba(255,255,255,0.6)', fontWeight: '600' },
  tabLabelActive: { color: colors.navy[900] },
  listContent: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxxl },
  juzCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.white, borderRadius: radius.md,
    padding: spacing.md, marginBottom: spacing.sm, gap: spacing.md,
    ...shadow.sm,
  },
  juzBadge: {
    width: 52, height: 52, borderRadius: radius.sm,
    backgroundColor: colors.navy[900],
    alignItems: 'center', justifyContent: 'center', gap: 1,
  },
  juzBadgeNum: { ...typography.heading, color: colors.gold[400] },
  juzBadgeLabel: { fontSize: 9, color: 'rgba(255,255,255,0.4)', fontWeight: '600', textTransform: 'uppercase' },
  juzInfo: { flex: 1 },
  juzEnglish: { ...typography.subheading, color: colors.parchment[950] },
  juzUrdu: { fontSize: 16, color: colors.parchment[500], marginTop: 2 },
  juzStartBadge: {
    backgroundColor: colors.gold[50], borderRadius: radius.pill,
    paddingHorizontal: spacing.sm, paddingVertical: 3,
  },
  juzStartText: { fontSize: 10, color: colors.gold[700], fontWeight: '600' },
});
