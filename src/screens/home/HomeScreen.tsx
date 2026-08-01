import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, RefreshControl, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { TabAndStackNavigation } from '../../navigation/types';
import { QuickAccessGrid } from '../../components/home/QuickAccessGrid';
import { ContinueReadingCard } from '../../components/home/ContinueReadingCard';
import { getAllProgress } from '../../services/db/progressRepo';
import { getWordCount } from '../../services/db/vocabularyRepo';
import { fetchDailyAyah, fetchDailyHadith, DailyAyah, DailyHadith } from '../../services/api/dailyContentApi';
import { getTodayHijri } from '../../services/hijri/hijriCalendar';
import { useStreakStore } from '../../store/useStreakStore';
import { useThemeStore } from '../../store/useThemeStore';
import { ReadingProgress } from '../../types/models';
import { colors, gradients, radius, shadow, spacing, typography } from '../../theme';
import { darkColors } from '../../theme/darkColors';

function SkeletonCard({ height = 160 }: { height?: number }) {
  const shimmer = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.timing(shimmer, {
        toValue: 1, duration: 1200, useNativeDriver: true,
        easing: Easing.inOut(Easing.ease),
      })
    ).start();
  }, []);
  const opacity = shimmer.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.3, 0.6, 0.3] });
  return <Animated.View style={[styles.skeleton, { height, opacity }]} />;
}

export function HomeScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation<TabAndStackNavigation>();
  const isDark = useThemeStore(s => s.isDark);
  const { currentStreak, longestStreak, recordToday } = useStreakStore();

  const [progress, setProgress] = useState<ReadingProgress[]>([]);
  const [dailyAyah, setDailyAyah] = useState<DailyAyah | null>(null);
  const [dailyHadith, setDailyHadith] = useState<DailyHadith | null>(null);
  const [loadingContent, setLoadingContent] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [vocabCount, setVocabCount] = useState(0);

  const heroOpacity = useRef(new Animated.Value(0)).current;
  const heroSlide = useRef(new Animated.Value(-20)).current;
  const contentOpacity = useRef(new Animated.Value(0)).current;
  const contentSlide = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(heroOpacity, { toValue: 1, duration: 500, useNativeDriver: true, easing: Easing.out(Easing.cubic) }),
      Animated.timing(heroSlide, { toValue: 0, duration: 500, useNativeDriver: true, easing: Easing.out(Easing.cubic) }),
    ]).start();
  }, []);

  const hijri = useMemo(() => getTodayHijri(), []);
  const bg = isDark ? darkColors.background : colors.parchment[50];
  const cardBg = isDark ? darkColors.surface : colors.white;
  const textPrimary = isDark ? darkColors.text.primary : colors.parchment[950];
  const textSecondary = isDark ? darkColors.text.secondary : colors.parchment[500];

  useFocusEffect(useCallback(() => {
    getAllProgress().then(setProgress).catch(() => {});
    getWordCount().then(setVocabCount).catch(() => {});
    recordToday();
  }, [recordToday]));

  const loadContent = useCallback(async () => {
    setLoadingContent(true);
    await Promise.all([
      fetchDailyAyah().then(setDailyAyah).catch(() => {}),
      fetchDailyHadith().then(setDailyHadith).catch(() => {}),
    ]);
    setLoadingContent(false);
    Animated.parallel([
      Animated.timing(contentOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.timing(contentSlide, { toValue: 0, duration: 400, useNativeDriver: true, easing: Easing.out(Easing.cubic) }),
    ]).start();
  }, []);

  useEffect(() => { loadContent(); }, []);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadContent();
    setRefreshing(false);
  }, [loadContent]);

  const quranProgress = progress.find(p => p.key === 'quran');
  const hadithProgress = progress.find(p => p.key === 'hadith');
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  return (
    <ScrollView
      style={[styles.root, { backgroundColor: bg }]}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.scroll}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          tintColor={colors.gold[400]}
          colors={[colors.gold[400]]}
        />
      }
    >
      <StatusBar barStyle="light-content" />

      {/* ── Hero Header ── */}
      <LinearGradient colors={['#060C1F', '#0B1330', '#162354']} style={styles.hero}>
        <View style={styles.decor1} />
        <View style={styles.decor2} />
        <View style={styles.decor3} />

        <Animated.View style={[styles.heroInner, { opacity: heroOpacity, transform: [{ translateY: heroSlide }] }]}>
          <View style={styles.heroTop}>
            <View style={styles.heroLeft}>
              <Text style={styles.gregDate}>{today}</Text>
              <Text style={[styles.greeting, { fontFamily: 'Amiri_400Regular' }]}>
                اَلسَّلَامُ عَلَيْكُمْ وَرَحْمَةُ اللهِ
              </Text>
            </View>
            <View style={styles.hijriBox}>
              <Text style={[styles.hijriAr, { fontFamily: 'Amiri_400Regular' }]}>{hijri.formattedAr}</Text>
              <Text style={styles.hijriEn}>{hijri.formatted}</Text>
              {hijri.isSpecial && (
                <View style={styles.specialBadge}>
                  <Ionicons name="moon" size={9} color={colors.gold[300]} />
                  <Text style={styles.specialText}>{hijri.specialName}</Text>
                </View>
              )}
            </View>
          </View>

          {/* Special day banner */}
          {hijri.isSpecial && (
            <View style={styles.specialBanner}>
              <Text style={styles.specialBannerText}>🌙 {hijri.specialName}</Text>
            </View>
          )}

          {currentStreak > 0 ? (
            <View style={styles.streakRow}>
              <View style={styles.streakPill}>
                <Ionicons name="flame" size={14} color="#F97316" />
                <Text style={styles.streakText}>{currentStreak} day streak</Text>
                {longestStreak > 1 && (
                  <>
                    <View style={styles.streakDivider} />
                    <Ionicons name="trophy-outline" size={12} color={colors.gold[400]} />
                    <Text style={styles.streakBest}>Best: {longestStreak}</Text>
                  </>
                )}
              </View>
            </View>
          ) : (
            <View style={styles.streakRow}>
              <View style={styles.streakPillMuted}>
                <Ionicons name="flame-outline" size={14} color="rgba(255,255,255,0.3)" />
                <Text style={styles.streakTextMuted}>Start your reading streak today</Text>
              </View>
            </View>
          )}
        </Animated.View>
      </LinearGradient>

      <View style={[styles.body, { backgroundColor: bg }]}>

        {/* ── Daily Ayah ── */}
        <SectionHeader icon="book-outline" iconColor="#F59E0B" label="AYAH OF THE DAY" />
        {loadingContent ? (
          <SkeletonCard height={180} />
        ) : dailyAyah ? (
          <AyahCard ayah={dailyAyah} onPress={() => navigation.navigate('SurahDetail', { surahNumber: dailyAyah.surahNumber, englishName: dailyAyah.surahEnglishName })} />
        ) : null}

        {/* ── Daily Hadith ── */}
        <SectionHeader icon="chatbox-outline" iconColor="#38BDF8" label="HADITH OF THE DAY" />
        {loadingContent ? (
          <SkeletonCard height={180} />
        ) : dailyHadith ? (
          <HadithCard hadith={dailyHadith} cardBg={cardBg} textPrimary={textPrimary} textSecondary={textSecondary} />
        ) : null}

        {/* ── Vocabulary Word Count Card ── */}
        {vocabCount > 0 && (
          <TouchableOpacity
            style={[styles.vocabCard, { backgroundColor: cardBg }]}
            onPress={() => navigation.navigate('Vocabulary')}
            activeOpacity={0.85}
          >
            <View style={styles.vocabCardInner}>
              <Text style={styles.vocabEmoji}>📖</Text>
              <View style={{ flex: 1 }}>
                <Text style={[styles.vocabCount, { color: textPrimary }]}>
                  <Text style={styles.vocabCountNum}>{vocabCount}</Text> Quranic words learned
                </Text>
                <Text style={[styles.vocabSub, { color: textSecondary }]}>Tap to practice with flashcards</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={colors.parchment[400]} />
            </View>
          </TouchableOpacity>
        )}

        {/* ── Quick Access ── */}
        <SectionHeader icon="grid-outline" iconColor={colors.gold[400]} label={t('home.quickAccess').toUpperCase()} />
        <QuickAccessGrid items={[
          { key: 'quran',      label: t('nav.quran'),     icon: 'book-outline',                onPress: () => navigation.navigate('Quran')        },
          { key: 'hadith',     label: t('nav.hadith'),    icon: 'chatbox-outline',             onPress: () => navigation.navigate('Hadith')       },
          { key: 'prayer',     label: t('nav.prayer'),    icon: 'time-outline',                onPress: () => navigation.navigate('Prayer')       },
          { key: 'tasbih',     label: 'Tasbih',            icon: 'radio-button-on-outline',     onPress: () => navigation.navigate('Tasbih')       },
          { key: 'duas',       label: 'Duas',               icon: 'hand-left-outline',           onPress: () => navigation.navigate('Duas')         },
          { key: 'names',      label: '99 Names',           icon: 'star-outline',                onPress: () => navigation.navigate('NamesOfAllah') },
          { key: 'library',    label: t('nav.library'),   icon: 'library-outline',             onPress: () => navigation.navigate('Library')      },
          { key: 'vocabulary', label: 'Vocabulary',        icon: 'language-outline',            onPress: () => navigation.navigate('Vocabulary')   },
          { key: 'assistant',  label: t('nav.assistant'), icon: 'chatbubble-ellipses-outline', onPress: () => navigation.navigate('Assistant')    },
        ]} />

        {/* ── Continue Reading ── */}
        {(quranProgress || hadithProgress) && (
          <>
            <SectionHeader icon="play-forward-outline" iconColor="#4ADE80" label={t('home.continueReading').toUpperCase()} />
            {quranProgress?.surahNumber && (
              <ContinueReadingCard
                title={quranProgress.surahName ?? 'Quran'}
                subtitle={`Surah ${quranProgress.surahNumber}`}
                icon="book-outline"
                accentColor="#F59E0B"
                onPress={() => navigation.navigate('SurahDetail', { surahNumber: quranProgress.surahNumber!, englishName: quranProgress.surahName ?? '' })}
              />
            )}
            {hadithProgress?.collectionId && (
              <ContinueReadingCard
                title={hadithProgress.collectionName ?? 'Hadith'}
                subtitle={t('hadith.continueReading')}
                icon="chatbox-outline"
                accentColor="#38BDF8"
                onPress={() => navigation.navigate('HadithCollectionDetail', { collectionId: hadithProgress.collectionId!, name: hadithProgress.collectionName ?? '' })}
              />
            )}
          </>
        )}
      </View>
    </ScrollView>
  );
}

function SectionHeader({ icon, iconColor, label }: { icon: keyof typeof Ionicons.glyphMap; iconColor: string; label: string }) {
  return (
    <View style={styles.sectionHeader}>
      <Ionicons name={icon} size={14} color={iconColor} />
      <Text style={[styles.sectionLabel, { color: iconColor }]}>{label}</Text>
    </View>
  );
}

function AyahCard({ ayah, onPress }: { ayah: DailyAyah; onPress: () => void }) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const onPressIn = () => Animated.spring(scaleAnim, { toValue: 0.97, useNativeDriver: true, tension: 300, friction: 10 }).start();
  const onPressOut = () => Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, tension: 300, friction: 10 }).start();
  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }], borderRadius: radius.md, overflow: 'hidden', ...shadow.xl }}>
      <TouchableOpacity onPress={onPress} onPressIn={onPressIn} onPressOut={onPressOut} activeOpacity={1}>
        <LinearGradient colors={['#060C1F', '#0F1C42', '#1A2A5E']} style={styles.ayahGrad}>
          <View style={styles.ayahDecor} />
          <View style={styles.ayahTop}>
            <View>
              <Text style={styles.ayahSurah}>{ayah.surahEnglishName}</Text>
              <Text style={styles.ayahRef}>Surah {ayah.surahNumber}  ·  Verse {ayah.ayahNumber}</Text>
            </View>
            <View style={styles.ayahPlayBtn}>
              <Ionicons name="volume-high" size={16} color={colors.gold[300]} />
            </View>
          </View>
          <Text style={[styles.ayahAr, { fontFamily: 'Amiri_400Regular' }]}>{ayah.arabicText}</Text>
          <View style={styles.ayahDivider} />
          <Text style={styles.ayahTrans} numberOfLines={4}>{ayah.translation}</Text>
          <View style={styles.ayahFooter}>
            <Text style={styles.ayahFooterText}>Read in Quran</Text>
            <Ionicons name="arrow-forward" size={12} color={colors.gold[400]} />
          </View>
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
}

function HadithCard({ hadith, cardBg, textPrimary, textSecondary }: {
  hadith: DailyHadith; cardBg: string; textPrimary: string; textSecondary: string;
}) {
  return (
    <View style={[styles.hadithCard, { backgroundColor: cardBg }]}>
      <View style={styles.hadithAccentBar} />
      <View style={styles.hadithHeader}>
        <View style={styles.hadithIconWrap}>
          <Ionicons name="chatbox" size={14} color="#38BDF8" />
        </View>
        <Text style={[styles.hadithSource, { color: textSecondary }]}>{hadith.collectionName}</Text>
        <View style={styles.hadithNumBadge}>
          <Text style={styles.hadithNum}>No. {hadith.hadithNumber}</Text>
        </View>
      </View>
      <Text style={[styles.hadithAr, { fontFamily: 'Amiri_400Regular' }]}>{hadith.arabicText}</Text>
      <View style={styles.hadithDivider} />
      <Text style={[styles.hadithTrans, { color: textPrimary }]}>{hadith.translation}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { paddingBottom: spacing.xxxl },
  skeleton: { backgroundColor: colors.parchment[200], borderRadius: radius.md },

  hero: {
    paddingTop: spacing.xl + spacing.xl,
    paddingBottom: spacing.xxl,
    paddingHorizontal: spacing.lg,
    overflow: 'hidden',
  },
  heroInner: {},
  decor1: { position: 'absolute', right: -60, top: -60, width: 220, height: 220, borderRadius: 110, borderWidth: 1, borderColor: 'rgba(212,169,62,0.15)' },
  decor2: { position: 'absolute', right: 20, bottom: -80, width: 160, height: 160, borderRadius: 80, borderWidth: 1, borderColor: 'rgba(212,169,62,0.08)' },
  decor3: { position: 'absolute', left: -50, top: 40, width: 140, height: 140, borderRadius: 70, borderWidth: 1, borderColor: 'rgba(255,255,255,0.04)' },
  heroTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing.lg },
  heroLeft: { flex: 1, gap: 5 },
  gregDate: { fontSize: 11, fontWeight: '700', letterSpacing: 1.2, color: colors.gold[500], textTransform: 'uppercase' },
  greeting: { fontSize: 17, color: 'rgba(255,255,255,0.88)', lineHeight: 28 },
  hijriBox: { alignItems: 'flex-end', gap: 4, marginLeft: spacing.md },
  hijriAr: { fontSize: 16, color: colors.gold[300], lineHeight: 24 },
  hijriEn: { fontSize: 11, color: 'rgba(255,255,255,0.3)', fontWeight: '500' },
  specialBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(212,169,62,0.2)', borderRadius: radius.pill, borderWidth: 1, borderColor: 'rgba(212,169,62,0.35)', paddingHorizontal: spacing.sm, paddingVertical: 3 },
  specialText: { fontSize: 10, color: colors.gold[300], fontWeight: '700' },
  specialBanner: {
    backgroundColor: 'rgba(212,169,62,0.15)', borderRadius: radius.md,
    borderWidth: 1, borderColor: 'rgba(212,169,62,0.3)',
    paddingHorizontal: spacing.lg, paddingVertical: spacing.sm,
    marginBottom: spacing.sm,
  },
  specialBannerText: { fontSize: 13, color: colors.gold[300], fontWeight: '700', textAlign: 'center' },
  streakRow: { marginTop: spacing.xs },
  streakPill: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, backgroundColor: 'rgba(249,115,22,0.15)', borderRadius: radius.pill, borderWidth: 1, borderColor: 'rgba(249,115,22,0.3)', paddingHorizontal: spacing.md, paddingVertical: 5, alignSelf: 'flex-start' },
  streakText: { fontSize: 12, color: '#FB923C', fontWeight: '700' },
  streakDivider: { width: 1, height: 12, backgroundColor: 'rgba(255,255,255,0.15)', marginHorizontal: 2 },
  streakBest: { fontSize: 11, color: colors.gold[400], fontWeight: '600' },
  streakPillMuted: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: 5, alignSelf: 'flex-start' },
  streakTextMuted: { fontSize: 12, color: 'rgba(255,255,255,0.4)', fontWeight: '500' },

  body: { padding: spacing.lg, gap: spacing.md },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.sm, marginBottom: -spacing.xs },
  sectionLabel: { fontSize: 11, fontWeight: '800', letterSpacing: 1.5, textTransform: 'uppercase' },

  // Vocabulary card
  vocabCard: { borderRadius: radius.md, ...shadow.sm },
  vocabCardInner: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.lg },
  vocabEmoji: { fontSize: 24 },
  vocabCount: { ...typography.bodySmall, fontWeight: '500' },
  vocabCountNum: { fontWeight: '800', color: colors.navy[800] },
  vocabSub: { fontSize: 11, marginTop: 2 },

  ayahGrad: { padding: spacing.xl, gap: spacing.md, overflow: 'hidden' },
  ayahDecor: { position: 'absolute', right: -40, top: -40, width: 160, height: 160, borderRadius: 80, backgroundColor: 'rgba(245,158,11,0.06)' },
  ayahTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  ayahSurah: { ...typography.subheading, color: colors.gold[300] },
  ayahRef: { fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 2, fontWeight: '500' },
  ayahPlayBtn: { width: 38, height: 38, borderRadius: radius.pill, backgroundColor: 'rgba(245,158,11,0.15)', borderWidth: 1, borderColor: 'rgba(245,158,11,0.3)', alignItems: 'center', justifyContent: 'center' },
  ayahAr: { fontSize: 24, lineHeight: 50, color: 'rgba(255,255,255,0.92)', textAlign: 'right', writingDirection: 'rtl' },
  ayahDivider: { height: 1, backgroundColor: 'rgba(255,255,255,0.07)' },
  ayahTrans: { ...typography.body, color: 'rgba(255,255,255,0.55)', lineHeight: 24 },
  ayahFooter: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  ayahFooterText: { fontSize: 12, color: colors.gold[400], fontWeight: '700' },

  hadithCard: { borderRadius: radius.md, padding: spacing.lg, gap: spacing.md, ...shadow.sm, overflow: 'hidden' },
  hadithAccentBar: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, backgroundColor: '#38BDF8' },
  hadithHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  hadithIconWrap: { width: 30, height: 30, borderRadius: 9, backgroundColor: 'rgba(56,189,248,0.15)', borderWidth: 1, borderColor: 'rgba(56,189,248,0.25)', alignItems: 'center', justifyContent: 'center' },
  hadithSource: { ...typography.caption, fontWeight: '700', flex: 1 },
  hadithNumBadge: { backgroundColor: colors.parchment[100], borderRadius: radius.pill, paddingHorizontal: spacing.sm, paddingVertical: 2 },
  hadithNum: { fontSize: 10, color: colors.parchment[600], fontWeight: '700' },
  hadithDivider: { height: 1, backgroundColor: colors.parchment[100] },
  hadithAr: { fontSize: 20, lineHeight: 42, color: colors.navy[900], textAlign: 'right', writingDirection: 'rtl' },
  hadithTrans: { ...typography.body, lineHeight: 26 },
});
