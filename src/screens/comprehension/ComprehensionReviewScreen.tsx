import React, { useCallback, useState } from 'react';
import { FlatList, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { LoadingView } from '../../components/common/AsyncStateView';
import { BackButton } from '../../components/common/BackButton';
import { listGaps, updateComprehensionLevel } from '../../services/db/comprehensionRepo';
import { ComprehensionEntry, ComprehensionLevel } from '../../types/models';
import { colors, radius, shadow, spacing, typography } from '../../theme';
import type { RootStackParamList } from '../../navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const LEVEL_CONFIG: Record<ComprehensionLevel, { label: string; color: string; bg: string; icon: keyof typeof Ionicons.glyphMap }> = {
  yes:       { label: 'Understood',  color: '#4ADE80', bg: 'rgba(74,222,128,0.12)',  icon: 'checkmark-circle' },
  partially: { label: 'Partially',   color: colors.gold[500], bg: 'rgba(245,158,11,0.12)', icon: 'help-circle' },
  no:        { label: 'Needs work',  color: '#F87171',         bg: 'rgba(248,113,113,0.12)', icon: 'close-circle' },
};

export function ComprehensionReviewScreen() {
  const navigation = useNavigation<Nav>();
  const [entries, setEntries] = useState<ComprehensionEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(async () => {
    setIsLoading(true);
    try { setEntries(await listGaps()); }
    catch {}
    finally { setIsLoading(false); }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const handleMarkDone = async (entry: ComprehensionEntry) => {
    await updateComprehensionLevel(entry.id, 'yes');
    setEntries(prev => prev.filter(e => e.id !== entry.id));
  };

  const handleNavigate = (entry: ComprehensionEntry) => {
    navigation.navigate('SurahDetail', {
      surahNumber: entry.surahNumber,
      englishName: entry.surahName,
      initialAyahNumber: entry.ayahNumber,
    });
  };

  return (
    <ScreenContainer noPadding>
      <StatusBar barStyle="light-content" />
      <LinearGradient colors={['#0A0F2E', '#0F1C42']} style={styles.header}>
        <BackButton />
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Study Gaps</Text>
          <Text style={styles.headerSub}>{entries.length} ayahs to review</Text>
        </View>
      </LinearGradient>

      {isLoading ? <LoadingView /> : (
        <FlatList
          data={entries}
          keyExtractor={e => e.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="checkmark-circle" size={48} color={colors.gold[400]} />
              <Text style={styles.emptyTitle}>All caught up!</Text>
              <Text style={styles.emptyDesc}>No gaps to review. Mark ayahs while reading to track your understanding.</Text>
            </View>
          }
          renderItem={({ item }) => {
            const cfg = LEVEL_CONFIG[item.level];
            return (
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <View style={[styles.levelBadge, { backgroundColor: cfg.bg }]}>
                    <Ionicons name={cfg.icon} size={13} color={cfg.color} />
                    <Text style={[styles.levelText, { color: cfg.color }]}>{cfg.label}</Text>
                  </View>
                  <Text style={styles.ref}>{item.surahName} · Ayah {item.ayahNumber}</Text>
                </View>
                <Text style={[styles.arabic, { fontFamily: 'Amiri_400Regular' }]}>{item.arabicText}</Text>
                <Text style={styles.translation} numberOfLines={3}>{item.translation}</Text>
                <View style={styles.actions}>
                  <TouchableOpacity style={styles.actionBtn} onPress={() => handleNavigate(item)} activeOpacity={0.8}>
                    <Ionicons name="book-outline" size={15} color={colors.navy[700]} />
                    <Text style={styles.actionText}>Read in Quran</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.actionBtn, styles.actionBtnGold]} onPress={() => handleMarkDone(item)} activeOpacity={0.8}>
                    <Ionicons name="checkmark" size={15} color={colors.gold[700]} />
                    <Text style={[styles.actionText, { color: colors.gold[700] }]}>Mark done</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          }}
        />
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingTop: 52, paddingBottom: spacing.lg, paddingHorizontal: spacing.lg },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { ...typography.heading, color: colors.white },
  headerSub: { ...typography.caption, color: 'rgba(255,255,255,0.4)', marginTop: 2 },
  list: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xxxl },
  card: { backgroundColor: colors.white, borderRadius: radius.md, padding: spacing.lg, gap: spacing.md, ...shadow.sm },
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  levelBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: radius.pill, paddingHorizontal: spacing.sm, paddingVertical: 3 },
  levelText: { fontSize: 11, fontWeight: '700' },
  ref: { ...typography.caption, color: colors.parchment[500] },
  arabic: { fontSize: 20, lineHeight: 42, color: colors.navy[900], textAlign: 'right', writingDirection: 'rtl' },
  translation: { ...typography.bodySmall, color: colors.parchment[600], lineHeight: 20 },
  actions: { flexDirection: 'row', gap: spacing.sm },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.xs, borderRadius: radius.sm, paddingVertical: spacing.sm, backgroundColor: colors.parchment[100] },
  actionBtnGold: { backgroundColor: 'rgba(245,158,11,0.1)' },
  actionText: { fontSize: 12, fontWeight: '700', color: colors.navy[700] },
  empty: { alignItems: 'center', paddingTop: spacing.xxxl * 2, gap: spacing.md, paddingHorizontal: spacing.xl },
  emptyTitle: { ...typography.heading, color: colors.parchment[900] },
  emptyDesc: { ...typography.body, color: colors.parchment[500], textAlign: 'center', lineHeight: 22 },
});
