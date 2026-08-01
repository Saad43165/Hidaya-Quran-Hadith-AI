import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { TabAndStackNavigation } from '../../navigation/types';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { QuickAccessGrid } from '../../components/home/QuickAccessGrid';
import { ContinueReadingCard } from '../../components/home/ContinueReadingCard';
import { getAllProgress } from '../../services/db/progressRepo';
import { fetchDailyAyah, fetchDailyHadith, DailyAyah, DailyHadith } from '../../services/api/dailyContentApi';
import { getTodayHijri } from '../../services/hijri/hijriCalendar';
import { useStreakStore } from '../../store/useStreakStore';
import { useThemeStore } from '../../store/useThemeStore';
import { ReadingProgress } from '../../types/models';
import { colors, gradients, radius, shadow, spacing, typography } from '../../theme';
import { darkColors } from '../../theme/darkColors';

export function HomeScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation<TabAndStackNavigation>();
  const isDark = useThemeStore(s => s.isDark);
  const { currentStreak, longestStreak, recordToday } = useStreakStore();

  const [progress, setProgress] = useState<ReadingProgress[]>([]);
  const [dailyAyah, setDailyAyah] = useState<DailyAyah | null>(null);
  const [dailyHadith, setDailyHadith] = useState<DailyHadith | null>(null);
  const [loadingContent, setLoadingContent] = useState(true);

  const hijri = useMemo(() => getTodayHijri(), []);
  const bg = isDark ? darkColors.background : colors.parchment[50];
  const cardBg = isDark ? darkColors.surface : colors.white;
  const textPrimary = isDark ? darkColors.text.primary : colors.parchment[950];
  const textSecondary = isDark ? darkColors.text.secondary : colors.parchment[600];

  useFocusEffect(useCallback(() => {
    getAllProgress().then(setProgress).catch(() => {});
    recordToday();
  }, [recordToday]));

  useEffect(() => {
    Promise.all([
      fetchDailyAyah().then(setDailyAyah).catch(() => {}),
      fetchDailyHadith().then(setDailyHadith).catch(() => {}),
    ]).finally(() => setLoadingContent(false));
  }, []);

  const quranProgress = progress.find(p => p.key === 'quran');
  const hadithProgress = progress.find(p => p.key === 'hadith');
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  return (
    <ScrollView style={[styles.root, { backgroundColor: bg }]}
      showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

      {/* ── Hero Header ── */}
      <LinearGradient colors={gradients.heroNavy} style={styles.hero}>
        <View style={styles.heroDecor1} />
        <View style={styles.heroDecor2} />
        <View style={styles.heroTop}>
          <View>
            <Text style={styles.heroGreg}>{today}</Text>
            <Text style={styles.heroGreeting}>السَّلَامُ عَلَيْكُمْ</Text>
          </View>
          <View style={styles.hijriBox}>
            <Text style={[styles.hijriAr, { fontFamily: 'Amiri_400Regular' }]}>{hijri.formattedAr}</Text>
            <Text style={styles.hijriEn}>{hijri.formatted}</Text>
            {hijri.isSpecial && (
              <View style={styles.specialBadge}>
                <Text style={styles.specialText}>🌙 {hijri.specialName}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Streak row */}
        {currentStreak > 0 && (
          <View style={styles.streakRow}>
            <Ionicons name="flame" size={14} color={colors.gold[400]} />
            <Text style={styles.streakText}>{currentStreak} day streak</Text>
            {longestStreak > 1 && <Text style={styles.streakBest}>Best: {longestStreak}</Text>}
          </View>
        )}
      </LinearGradient>

      <View style={styles.body}>

        {/* ── Daily Ayah ── */}
        <Text style={[styles.sectionLabel, { color: textSecondary }]}>AYAH OF THE DAY</Text>
        {loadingContent ? (
          <View style={[styles.loadCard, { backgroundColor: cardBg }]}>
            <ActivityIndicator color={colors.gold[500]} />
          </View>
        ) : dailyAyah ? (
          <TouchableOpacity
            style={styles.ayahCard}
            onPress={() => navigation.navigate('SurahDetail', { surahNumber: dailyAyah.surahNumber, englishName: dailyAyah.surahEnglishName })}
            activeOpacity={0.88}
          >
            <LinearGradient colors={['#0B1330', '#1E2F6B']} style={styles.ayahGrad}>
              <View style={styles.ayahTop}>
                <View>
                  <Text style={styles.ayahSurah}>{dailyAyah.surahEnglishName}</Text>
                  <Text style={styles.ayahRef}>{dailyAyah.surahNumber}:{dailyAyah.ayahNumber}</Text>
                </View>
                <View style={styles.ayahPlayBtn}>
                  <Ionicons name="volume-high-outline" size={16} color={colors.gold[400]} />
                </View>
              </View>
              <Text style={[styles.ayahAr, { fontFamily: 'Amiri_400Regular' }]}>{dailyAyah.arabicText}</Text>
              <Text style={styles.ayahTrans} numberOfLines={3}>{dailyAyah.translation}</Text>
            </LinearGradient>
          </TouchableOpacity>
        ) : null}

        {/* ── Daily Hadith ── */}
        <Text style={[styles.sectionLabel, { color: textSecondary }]}>HADITH OF THE DAY</Text>
        {loadingContent ? (
          <View style={[styles.loadCard, { backgroundColor: cardBg }]}>
            <ActivityIndicator color={colors.gold[500]} />
          </View>
        ) : dailyHadith ? (
          <View style={[styles.hadithCard, { backgroundColor: cardBg }]}>
            <View style={styles.hadithHeader}>
              <View style={styles.hadithIcon}>
                <Ionicons name="chatbox" size={14} color={colors.gold[600]} />
              </View>
              <Text style={[styles.hadithSource, { color: textSecondary }]}>
                {dailyHadith.collectionName} · #{dailyHadith.hadithNumber}
              </Text>
            </View>
            <Text style={[styles.hadithAr, { fontFamily: 'Amiri_400Regular' }]}>{dailyHadith.arabicText}</Text>
            <Text style={[styles.hadithTrans, { color: textPrimary }]}>{dailyHadith.translation}</Text>
          </View>
        ) : null}

        {/* ── Quick Access ── */}
        <Text style={[styles.sectionLabel, { color: textSecondary }]}>{t('home.quickAccess').toUpperCase()}</Text>
        <QuickAccessGrid items={[
          { key: 'quran',    label: t('nav.quran'),    icon: 'book-outline',                onPress: () => navigation.navigate('Quran')     },
          { key: 'hadith',   label: t('nav.hadith'),   icon: 'chatbox-outline',             onPress: () => navigation.navigate('Hadith')    },
          { key: 'prayer',   label: t('nav.prayer'),   icon: 'time-outline',                onPress: () => navigation.navigate('Prayer')    },
          { key: 'tasbih',   label: 'Tasbih',          icon: 'radio-button-on-outline',     onPress: () => navigation.navigate('Tasbih')    },
          { key: 'duas',     label: 'Duas',             icon: 'hand-left-outline',           onPress: () => navigation.navigate('Duas')      },
          { key: 'names',    label: '99 Names',         icon: 'star-outline',                onPress: () => navigation.navigate('NamesOfAllah') },
          { key: 'library',  label: t('nav.library'),  icon: 'library-outline',             onPress: () => navigation.navigate('Library')   },
          { key: 'search',   label: 'Search',           icon: 'search-outline',              onPress: () => navigation.navigate('Search')    },
          { key: 'assistant',label: t('nav.assistant'),icon: 'chatbubble-ellipses-outline', onPress: () => navigation.navigate('Assistant') },
        ]} />

        {/* ── Continue Reading ── */}
        {(quranProgress || hadithProgress) ? (
          <>
            <Text style={[styles.sectionLabel, { color: textSecondary }]}>{t('home.continueReading').toUpperCase()}</Text>
            {quranProgress?.surahNumber ? (
              <ContinueReadingCard
                title={quranProgress.surahName ?? 'Quran'}
                subtitle={`Surah ${quranProgress.surahNumber}`}
                icon="book-outline"
                onPress={() => navigation.navigate('SurahDetail', { surahNumber: quranProgress.surahNumber!, englishName: quranProgress.surahName ?? '' })}
              />
            ) : null}
            {hadithProgress?.collectionId ? (
              <ContinueReadingCard
                title={hadithProgress.collectionName ?? 'Hadith'}
                subtitle={t('hadith.continueReading')}
                icon="chatbox-outline"
                onPress={() => navigation.navigate('HadithCollectionDetail', { collectionId: hadithProgress.collectionId!, name: hadithProgress.collectionName ?? '' })}
              />
            ) : null}
          </>
        ) : null}

      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { paddingBottom: spacing.xxxl },
  hero: { paddingTop: spacing.xl, paddingBottom: spacing.xl, paddingHorizontal: spacing.lg, overflow: 'hidden' },
  heroDecor1: { position: 'absolute', right: -50, top: -50, width: 180, height: 180, borderRadius: 90, borderWidth: 1, borderColor: 'rgba(212,169,62,0.12)' },
  heroDecor2: { position: 'absolute', right: 40, bottom: -40, width: 100, height: 100, borderRadius: 50, borderWidth: 1, borderColor: 'rgba(212,169,62,0.07)' },
  heroTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing.md },
  heroGreg: { ...typography.label, color: colors.gold[500], marginBottom: spacing.xs },
  heroGreeting: { fontFamily: 'Amiri_400Regular', fontSize: 22, color: colors.white },
  hijriBox: { alignItems: 'flex-end', gap: 3 },
  hijriAr: { fontSize: 16, color: colors.gold[300] },
  hijriEn: { ...typography.caption, color: 'rgba(255,255,255,0.4)' },
  specialBadge: {
    backgroundColor: 'rgba(212,169,62,0.2)', borderRadius: radius.pill,
    paddingHorizontal: spacing.sm, paddingVertical: 2, marginTop: 4,
  },
  specialText: { fontSize: 10, color: colors.gold[300], fontWeight: '600' },
  streakRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginTop: spacing.sm },
  streakText: { ...typography.caption, color: colors.gold[400], fontWeight: '600' },
  streakBest: { ...typography.caption, color: 'rgba(255,255,255,0.35)', marginLeft: spacing.sm },
  body: { padding: spacing.lg, gap: spacing.md },
  sectionLabel: { ...typography.label, letterSpacing: 1.2, marginTop: spacing.sm },
  loadCard: { height: 80, borderRadius: radius.lg, alignItems: 'center', justifyContent: 'center', ...shadow.sm },
  ayahCard: { borderRadius: radius.lg, overflow: 'hidden', ...shadow.lg },
  ayahGrad: { padding: spacing.xl, gap: spacing.md },
  ayahTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  ayahSurah: { ...typography.subheading, color: colors.gold[400] },
  ayahRef: { ...typography.caption, color: 'rgba(255,255,255,0.4)' },
  ayahPlayBtn: { width: 32, height: 32, borderRadius: radius.pill, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' },
  ayahAr: { fontSize: 22, lineHeight: 44, color: colors.white, textAlign: 'right', writingDirection: 'rtl' },
  ayahTrans: { ...typography.body, color: 'rgba(255,255,255,0.6)', lineHeight: 22, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.1)', paddingTop: spacing.md },
  hadithCard: { borderRadius: radius.lg, padding: spacing.lg, gap: spacing.md, ...shadow.sm },
  hadithHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  hadithIcon: { width: 26, height: 26, borderRadius: 8, backgroundColor: colors.gold[50], alignItems: 'center', justifyContent: 'center' },
  hadithSource: { ...typography.caption, fontWeight: '600' },
  hadithAr: { fontSize: 18, lineHeight: 38, color: colors.navy[900], textAlign: 'right', writingDirection: 'rtl' },
  hadithTrans: { ...typography.body, lineHeight: 24 },
});
