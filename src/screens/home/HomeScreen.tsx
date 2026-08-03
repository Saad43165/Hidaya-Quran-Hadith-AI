import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Dimensions, Easing, Image, RefreshControl, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { TabAndStackNavigation } from '../../navigation/types';
import { ContinueReadingCard } from '../../components/home/ContinueReadingCard';
import { OfflineBanner } from '../../components/common/OfflineBanner';
import { getAllProgress } from '../../services/db/progressRepo';
import { getWordCount } from '../../services/db/vocabularyRepo';
import { getGapCount } from '../../services/db/comprehensionRepo';
import { useDrawer } from '../../context/DrawerContext';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { fetchDailyAyah, fetchDailyHadith, DailyAyah, DailyHadith } from '../../services/api/dailyContentApi';
import { PROPHETS } from '../../data/prophetsData';
import { SAHABA } from '../../data/sahabaData';
import { getTodayHijri } from '../../services/hijri/hijriCalendar';
import { fetchPrayerTimesByCoords, fetchPrayerTimesByCity } from '../../services/api/prayerTimesApi';
import { useStreakStore } from '../../store/useStreakStore';
import { useThemeStore } from '../../store/useThemeStore';
import { useAudioStore } from '../../store/useAudioStore';
import { ReadingProgress, PrayerTimes, PRAYER_NAMES, SurahDetail } from '../../types/models';
import { getCurrentPrayer, getNextPrayer, getMinutesUntil, formatTime12 as fmtTime } from '../../utils/prayerUtils';
import { colors, gradients, radius, shadow, spacing, typography } from '../../theme';
import { darkColors } from '../../theme/darkColors';

const SCREEN_WIDTH = Dimensions.get('window').width;
const IMG_HOME_HEADER = require('../../../assets/images/homescreenheader.png');
const IMG_ISLAMIC_BG  = require('../../../assets/images/islamicbackground.png');
const IMG_RAMADAN     = require('../../../assets/images/ramadan.png');
const GRID_COLS = 3;
const GRID_GAP = spacing.sm;
const GRID_CARD_SIZE = (SCREEN_WIDTH - spacing.lg * 2 - GRID_GAP * (GRID_COLS - 1)) / GRID_COLS;

const QUICK_ACCESS = [
  { label: 'Quran', icon: 'book' as const, image: require('../../../assets/images/mushaf.png'), accent: '#F59E0B', nav: 'Quran' as const },
  { label: 'Hadith', icon: 'chatbox' as const, image: require('../../../assets/images/kalma.png'), accent: '#38BDF8', nav: 'Hadith' as const },
  { label: 'Prayer', icon: 'time' as const, image: require('../../../assets/images/prayer.png'), accent: '#4ADE80', nav: 'Prayer' as const },
  { label: 'Qibla', icon: 'compass' as const, image: require('../../../assets/images/compass.png'), accent: '#A78BFA', nav: 'Qibla' as const },
  { label: 'Adhkar', icon: 'heart' as const, image: require('../../../assets/images/prayerbeads.png'), accent: '#F472B6', nav: 'Adhkar' as const },
  { label: 'AI Scholar', icon: 'sparkles' as const, image: require('../../../assets/images/kabba.png'), accent: '#FB923C', nav: 'Assistant' as const },
] as const;

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
  const { openDrawer } = useDrawer();

  const [progress, setProgress] = useState<ReadingProgress[]>([]);
  const [dailyAyah, setDailyAyah] = useState<DailyAyah | null>(null);
  const [dailyHadith, setDailyHadith] = useState<DailyHadith | null>(null);
  const [ayahLang, setAyahLang] = useState<'en' | 'ur'>('en');
  const [hadithLang, setHadithLang] = useState<'en' | 'ur'>('en');
  const [prayerTimes, setPrayerTimes] = useState<PrayerTimes | null>(null);
  const [loadingContent, setLoadingContent] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [vocabCount, setVocabCount] = useState(0);
  const [gapCount, setGapCount] = useState(0);
  const [, setTick] = useState(0);

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
    getGapCount().then(setGapCount).catch(() => {});
    recordToday();
  }, [recordToday]));

  const loadContent = useCallback(async () => {
    setLoadingContent(true);
    try {
      const storedMethod = await AsyncStorage.getItem('kitaabai.prayer.method').catch(() => null);
      const method = storedMethod ? parseInt(storedMethod, 10) : 2;
      const { status } = await Location.requestForegroundPermissionsAsync().catch(() => ({ status: 'denied' }));
      let times;
      if (status === 'granted') {
        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        times = await fetchPrayerTimesByCoords(loc.coords.latitude, loc.coords.longitude, method);
      } else {
        times = await fetchPrayerTimesByCity('Karachi', 'Pakistan', method);
      }
      setPrayerTimes(times);
    } catch (e) {
      console.log('Error loading prayer times', e);
    }

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

  // Tick every minute to refresh the prayer countdown
  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 60000);
    return () => clearInterval(id);
  }, []);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadContent();
    setRefreshing(false);
  }, [loadContent]);

  const quranProgress = progress.find(p => p.key === 'quran');
  const hadithProgress = progress.find(p => p.key === 'hadith');
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  return (
    <>
    <OfflineBanner />
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
        {/* Home hero background artwork */}
        <Image source={IMG_HOME_HEADER} style={styles.heroBgImage} resizeMode="cover" />
        <View style={styles.heroScrim} />
        <View style={styles.decor1} />
        <View style={styles.decor2} />
        <View style={styles.decor3} />

        <Animated.View style={[styles.heroInner, { opacity: heroOpacity, transform: [{ translateY: heroSlide }] }]}>
          <View style={styles.heroTop}>
            <TouchableOpacity style={styles.hamburger} onPress={openDrawer} activeOpacity={0.7}>
              <Ionicons name="menu" size={22} color="rgba(255,255,255,0.7)" />
            </TouchableOpacity>
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

        {/* ── Prayer Times Strip (prominent, first) ── */}
        <TouchableOpacity activeOpacity={0.9} onPress={() => navigation.navigate('Prayer')}>
          <LinearGradient colors={['#0B1330', '#162354', '#0F1C42']} style={styles.prayerStrip}>
            <Image source={IMG_ISLAMIC_BG} style={styles.stripBgPattern} resizeMode="cover" />
            <View style={styles.prayerStripDecor} />
            {prayerTimes ? (() => {
              const nextPrayer = getNextPrayer(prayerTimes);
              const mins = getMinutesUntil(prayerTimes, nextPrayer);
              const h = Math.floor(mins / 60);
              const m = mins % 60;
              const countdownStr = h > 0 ? `${h}h ${m}m` : `${m}m`;
              return (
                <>
                  <View style={styles.prayerStripHeader}>
                    <View style={styles.prayerStripTitleRow}>
                      <Ionicons name="time-outline" size={14} color={colors.gold[300]} />
                      <Text style={styles.prayerStripTitle}>PRAYER TIMES</Text>
                    </View>
                    <View style={styles.nextPrayerChip}>
                      <Text style={styles.nextPrayerChipLabel}>Next: {nextPrayer}</Text>
                      <View style={styles.nextPrayerChipDot} />
                      <Text style={styles.nextPrayerChipTime}>{countdownStr}</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={14} color="rgba(255,255,255,0.4)" />
                  </View>
                  <View style={styles.prayerStripRow}>
                    {PRAYER_NAMES.map(name => {
                      const isActive = getCurrentPrayer(prayerTimes) === name;
                      const isNext = nextPrayer === name;
                      return (
                        <View key={name} style={[styles.prayerStripItem, isActive && styles.prayerStripItemActive, isNext && !isActive && styles.prayerStripItemNext]}>
                          <Text style={[styles.prayerStripName, isActive && styles.prayerStripNameActive, isNext && !isActive && styles.prayerStripNameNext]}>{name}</Text>
                          <Text style={[styles.prayerStripTime, isActive && styles.prayerStripTimeActive, isNext && !isActive && styles.prayerStripTimeNext]}>{fmtTime(prayerTimes[name])}</Text>
                          {isActive && <View style={styles.prayerStripDot} />}
                          {isNext && !isActive && <View style={styles.prayerStripDotNext} />}
                        </View>
                      );
                    })}
                  </View>
                </>
              );
            })() : (
              <>
                <View style={styles.prayerStripHeader}>
                  <View style={styles.prayerStripTitleRow}>
                    <Ionicons name="time-outline" size={14} color={colors.gold[300]} />
                    <Text style={styles.prayerStripTitle}>PRAYER TIMES</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={14} color="rgba(255,255,255,0.4)" />
                </View>
                <SkeletonCard height={70} />
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>

        {/* ── Quick Access Grid ── */}
        <View style={styles.gridWrap}>
          {QUICK_ACCESS.map(item => (
            <TouchableOpacity
              key={item.label}
              style={styles.gridCard}
              onPress={() => {
                if (item.nav === 'Quran' || item.nav === 'Hadith' || item.nav === 'Assistant') {
                  navigation.navigate('MainTabs', { screen: item.nav } as any);
                } else {
                  navigation.navigate(item.nav as any);
                }
              }}
              activeOpacity={0.82}
            >
              <LinearGradient
                colors={[item.accent + '22', item.accent + '08']}
                style={[styles.gridCardInner, { borderColor: item.accent + '30' }]}
              >
                <Image source={item.image} style={styles.gridCardImg} resizeMode="contain" />
                <View style={[styles.gridIconWrap, { backgroundColor: item.accent + '20' }]}>
                  <Ionicons name={item.icon as any} size={18} color={item.accent} />
                </View>
                <Text style={[styles.gridLabel, { color: isDark ? '#fff' : colors.navy[900] }]} numberOfLines={1}>{item.label}</Text>
              </LinearGradient>
            </TouchableOpacity>
          ))}
        </View>

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
                onPress={() => navigation.navigate('SurahDetail', { surahNumber: quranProgress.surahNumber!, englishName: quranProgress.surahName ?? '', initialAyahNumber: quranProgress.ayahNumber })}
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

        {/* ── Daily Ayah ── */}
        <SectionHeader icon="book-outline" iconColor="#F59E0B" label="AYAH OF THE DAY" />
        {loadingContent ? (
          <SkeletonCard height={180} />
        ) : dailyAyah ? (
          <AyahCard ayah={dailyAyah} lang={ayahLang} onToggleLang={() => setAyahLang(l => l === 'en' ? 'ur' : 'en')} onPress={() => navigation.navigate('SurahDetail', { surahNumber: dailyAyah.surahNumber, englishName: dailyAyah.surahEnglishName })} />
        ) : null}

        {/* ── Daily Hadith ── */}
        <SectionHeader icon="chatbox-outline" iconColor="#38BDF8" label="HADITH OF THE DAY" />
        {loadingContent ? (
          <SkeletonCard height={180} />
        ) : dailyHadith ? (
          <HadithCard hadith={dailyHadith} lang={hadithLang} onToggleLang={() => setHadithLang(l => l === 'en' ? 'ur' : 'en')} cardBg={cardBg} textPrimary={textPrimary} textSecondary={textSecondary} />
        ) : null}

        {/* ── Prophet of the Day ── */}
        {(() => {
          const dayIndex = Math.floor(Date.now() / 86400000) % PROPHETS.length;
          const prophet = PROPHETS[dayIndex];
          return (
            <TouchableOpacity
              style={[styles.dailyProphetCard, { backgroundColor: cardBg, borderColor: prophet.color + '40' }]}
              onPress={() => navigation.navigate('ProphetStories')}
              activeOpacity={0.85}
            >
              <View style={[styles.dailyProphetAccent, { backgroundColor: prophet.color }]} />
              <View style={styles.dailyProphetInner}>
                <View style={[styles.dailyProphetIconWrap, { backgroundColor: prophet.color + '22' }]}>
                  <Text style={styles.dailyProphetIcon}>{prophet.icon}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.dailyCardLabel, { color: prophet.color }]}>PROPHET OF THE DAY</Text>
                  <Text style={[styles.dailyProphetName, { color: textPrimary }]}>{prophet.name}</Text>
                  <Text style={[styles.dailyProphetArabic]}>{prophet.nameArabic}</Text>
                  <Text style={[styles.dailyProphetSummary, { color: textSecondary }]} numberOfLines={2}>
                    {prophet.summary}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={prophet.color} />
              </View>
            </TouchableOpacity>
          );
        })()}

        {/* ── Sahaba of the Day ── */}
        {(() => {
          const dayIndex = Math.floor(Date.now() / 86400000) % SAHABA.length;
          const sahabi = SAHABA[dayIndex];
          return (
            <TouchableOpacity
              style={[styles.dailyProphetCard, { backgroundColor: cardBg, borderColor: sahabi.color + '40' }]}
              onPress={() => navigation.navigate('Sahaba')}
              activeOpacity={0.85}
            >
              <View style={[styles.dailyProphetAccent, { backgroundColor: sahabi.color }]} />
              <View style={styles.dailyProphetInner}>
                <View style={[styles.dailyProphetIconWrap, { backgroundColor: sahabi.color + '22' }]}>
                  <Text style={styles.dailyProphetIcon}>{sahabi.icon}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.dailyCardLabel, { color: sahabi.color }]}>SAHABI OF THE DAY</Text>
                  <Text style={[styles.dailyProphetName, { color: textPrimary }]}>{sahabi.name}</Text>
                  <Text style={[styles.dailyProphetArabic]}>{sahabi.nameArabic}</Text>
                  <Text style={[styles.dailyProphetSummary, { color: textSecondary }]} numberOfLines={2}>
                    {sahabi.title}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={sahabi.color} />
              </View>
            </TouchableOpacity>
          );
        })()}

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

        {/* ── Ramadan banner ── */}
        <TouchableOpacity
          style={[styles.ramadanCard, { backgroundColor: cardBg }]}
          onPress={() => navigation.navigate('Ramadan')}
          activeOpacity={0.85}
        >
          <LinearGradient colors={['#0F1C42', '#1A2A5E']} style={styles.ramadanInner}>
            <Image source={IMG_ISLAMIC_BG} style={styles.ramadanBgPattern} resizeMode="cover" />
            <View style={styles.ramadanDecor} />
            <Image source={IMG_RAMADAN} style={styles.ramadanIcon} resizeMode="contain" />
            <View style={{ flex: 1 }}>
              <Text style={styles.ramadanTitle}>Ramadan Mode</Text>
              <Text style={styles.ramadanSub}>Iftar countdown · Juz tracker · Zakat</Text>
            </View>
            <Ionicons name="chevron-forward" size={14} color={colors.gold[400]} />
          </LinearGradient>
        </TouchableOpacity>

        {/* ── Comprehension gaps ── */}
        {gapCount > 0 && (
          <TouchableOpacity
            style={[styles.gapCard, { backgroundColor: cardBg }]}
            onPress={() => navigation.navigate('ComprehensionReview')}
            activeOpacity={0.85}
          >
            <View style={styles.gapInner}>
              <View style={styles.gapIcon}>
                <Ionicons name="school-outline" size={20} color="#818CF8" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.gapTitle, { color: textPrimary }]}>
                  <Text style={styles.gapCount}>{gapCount}</Text> ayahs to review
                </Text>
                <Text style={[styles.gapSub, { color: textSecondary }]}>Tap to review your comprehension gaps</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={colors.parchment[400]} />
            </View>
          </TouchableOpacity>
        )}

      </View>
    </ScrollView>
    </>
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

function LangToggle({ lang, onToggle, dark = true }: { lang: 'en' | 'ur'; onToggle: () => void; dark?: boolean }) {
  return (
    <TouchableOpacity
      onPress={onToggle}
      style={[styles.langToggle, !dark && styles.langToggleLight]}
      activeOpacity={0.8}
    >
      <Text style={[styles.langToggleOpt, !dark && styles.langToggleOptLight, lang === 'en' && (dark ? styles.langToggleActive : styles.langToggleActiveDark)]}>EN</Text>
      <Text style={[styles.langToggleSep, !dark && { color: 'rgba(0,0,0,0.2)' }]}>|</Text>
      <Text style={[styles.langToggleOpt, !dark && styles.langToggleOptLight, lang === 'ur' && (dark ? styles.langToggleActive : styles.langToggleActiveDark)]}>UR</Text>
    </TouchableOpacity>
  );
}

function AyahCard({ ayah, lang, onToggleLang, onPress }: { ayah: DailyAyah; lang: 'en' | 'ur'; onToggleLang: () => void; onPress: () => void }) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const onPressIn = () => Animated.spring(scaleAnim, { toValue: 0.97, useNativeDriver: true, tension: 300, friction: 10 }).start();
  const onPressOut = () => Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, tension: 300, friction: 10 }).start();
  
  const { isPlaying, currentSurah, currentAyahIndex, play, pause, resume } = useAudioStore();
  const isCurrentAyah = currentSurah?.number === ayah.surahNumber &&
    currentSurah?.ayahs[currentAyahIndex]?.number === ayah.globalVerseNumber;
  const isThisPlaying = isCurrentAyah && isPlaying;

  const handlePlayPress = (e: any) => {
    e.stopPropagation?.();
    if (isThisPlaying) {
      pause();
    } else if (isCurrentAyah) {
      resume();
    } else {
      const mockSurah: SurahDetail = {
        number: ayah.surahNumber,
        name: ayah.surahEnglishName,
        englishName: ayah.surahEnglishName,
        englishNameTranslation: ayah.surahEnglishName,
        numberOfAyahs: 1,
        revelationType: 'Meccan',
        ayahs: [{
          numberInSurah: ayah.ayahNumber,
          text: ayah.arabicText,
          translation: ayah.translation,
          number: ayah.globalVerseNumber,
        }]
      };
      play(mockSurah, 0);
    }
  };

  const translation = lang === 'ur' && ayah.translationUrdu ? ayah.translationUrdu : ayah.translation;
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
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
              <LangToggle lang={lang} onToggle={onToggleLang} />
              <TouchableOpacity style={styles.ayahPlayBtn} onPress={handlePlayPress} activeOpacity={0.8}>
                <Ionicons name={isThisPlaying ? "pause" : "volume-high"} size={16} color={colors.gold[300]} />
              </TouchableOpacity>
            </View>
          </View>
          <Text style={[styles.ayahAr, { fontFamily: 'Amiri_400Regular' }]}>{ayah.arabicText}</Text>
          <View style={styles.ayahDivider} />
          <Text style={[styles.ayahTrans, lang === 'ur' && styles.ayahTransUrdu]} numberOfLines={4}>{translation}</Text>
          <View style={styles.ayahFooter}>
            <Text style={styles.ayahFooterText}>Read in Quran</Text>
            <Ionicons name="arrow-forward" size={12} color={colors.gold[400]} />
          </View>
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
}

function HadithCard({ hadith, lang, onToggleLang, cardBg, textPrimary, textSecondary }: {
  hadith: DailyHadith; lang: 'en' | 'ur'; onToggleLang: () => void; cardBg: string; textPrimary: string; textSecondary: string;
}) {
  const isDark = useThemeStore(s => s.isDark);
  const arabicColor = isDark ? '#F1F5F9' : '#1E293B';
  const translation = lang === 'ur' && hadith.translationUrdu ? hadith.translationUrdu : hadith.translation;
  return (
    <View style={[styles.hadithCard, { backgroundColor: cardBg }]}>
      <View style={styles.hadithAccentBar} />
      <View style={styles.hadithHeader}>
        <View style={styles.hadithIconWrap}>
          <Ionicons name="chatbox" size={14} color="#38BDF8" />
        </View>
        <Text style={[styles.hadithSource, { color: textSecondary }]}>{hadith.collectionName}</Text>
        <LangToggle lang={lang} onToggle={onToggleLang} dark={false} />
        <View style={styles.hadithNumBadge}>
          <Text style={styles.hadithNum}>No. {hadith.hadithNumber}</Text>
        </View>
      </View>
      <Text style={[styles.hadithAr, { fontFamily: 'Amiri_400Regular', color: arabicColor }]}>{hadith.arabicText}</Text>
      <View style={styles.hadithDivider} />
      <Text style={[styles.hadithTrans, { color: textPrimary }, lang === 'ur' && styles.hadithTransUrdu]}>{translation}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { paddingBottom: spacing.xxxl },
  skeleton: { backgroundColor: colors.parchment[200], borderRadius: radius.md },

  hero: {
    paddingTop: 52,
    paddingBottom: spacing.xxl,
    paddingHorizontal: spacing.lg,
    overflow: 'hidden',
  },
  heroBgImage: {
    position: 'absolute', right: 0, bottom: 0, width: '100%', height: '130%', opacity: 0.36,
  },
  heroScrim: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(6,12,31,0.4)',
  },
  stripBgPattern: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    width: '100%', height: '100%', opacity: 0.06,
  },
  ramadanBgPattern: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    width: '100%', height: '100%', opacity: 0.08,
  },
  ramadanIcon: { width: 28, height: 28 },
  heroInner: {},
  decor1: { position: 'absolute', right: -60, top: -60, width: 220, height: 220, borderRadius: 110, borderWidth: 1, borderColor: 'rgba(212,169,62,0.15)' },
  decor2: { position: 'absolute', right: 20, bottom: -80, width: 160, height: 160, borderRadius: 80, borderWidth: 1, borderColor: 'rgba(212,169,62,0.08)' },
  decor3: { position: 'absolute', left: -50, top: 40, width: 140, height: 140, borderRadius: 70, borderWidth: 1, borderColor: 'rgba(255,255,255,0.04)' },
  heroTop: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: spacing.lg, gap: spacing.sm },
  hamburger: { paddingTop: 2, paddingRight: spacing.xs },
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
  gridWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: GRID_GAP },
  gridCard: { width: GRID_CARD_SIZE, height: GRID_CARD_SIZE },
  gridCardInner: {
    flex: 1, borderRadius: radius.lg, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center', gap: spacing.xs,
    overflow: 'hidden', padding: spacing.sm,
  },
  gridCardImg: { position: 'absolute', right: -8, bottom: -8, width: GRID_CARD_SIZE * 0.55, height: GRID_CARD_SIZE * 0.55, opacity: 0.18 },
  gridIconWrap: { width: 36, height: 36, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  gridLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 0.2, textAlign: 'center' },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.sm, marginBottom: -spacing.xs },
  sectionLabel: { fontSize: 11, fontWeight: '800', letterSpacing: 1.5, textTransform: 'uppercase' },

  // Prayer strip (prominent, first section)
  prayerStrip: { borderRadius: radius.lg, padding: spacing.md, gap: spacing.sm, overflow: 'hidden', ...shadow.md },
  prayerStripDecor: { position: 'absolute', right: -40, top: -40, width: 140, height: 140, borderRadius: 70, backgroundColor: 'rgba(212,169,62,0.06)' },
  prayerStripHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  prayerStripTitleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  prayerStripTitle: { fontSize: 11, fontWeight: '800', letterSpacing: 1.2, color: colors.gold[300] },
  prayerStripRow: { flexDirection: 'row', justifyContent: 'space-between' },
  prayerStripItem: { alignItems: 'center', flex: 1, paddingVertical: spacing.sm, borderRadius: radius.sm, gap: 2 },
  prayerStripItemActive: { backgroundColor: 'rgba(212, 169, 62, 0.15)', borderWidth: 1, borderColor: 'rgba(212, 169, 62, 0.35)' },
  prayerStripName: { fontSize: 10, fontWeight: '700', color: 'rgba(255, 255, 255, 0.5)', textTransform: 'uppercase' },
  prayerStripNameActive: { color: colors.gold[300] },
  prayerStripTime: { fontSize: 13, fontWeight: '700', color: 'rgba(255, 255, 255, 0.85)' },
  prayerStripTimeActive: { fontSize: 17, fontWeight: '800', color: colors.gold[100] },
  prayerStripDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: colors.gold[300], marginTop: 2 },
  prayerStripItemNext: { backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)' },
  prayerStripNameNext: { color: 'rgba(255,255,255,0.75)' },
  prayerStripTimeNext: { color: colors.white },
  prayerStripDotNext: { width: 4, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.5)', marginTop: 2 },
  nextPrayerChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    flex: 1, justifyContent: 'center',
    backgroundColor: 'rgba(212,169,62,0.12)',
    borderRadius: radius.pill, borderWidth: 1,
    borderColor: 'rgba(212,169,62,0.25)',
    paddingHorizontal: spacing.md, paddingVertical: 4,
    marginHorizontal: spacing.sm,
  },
  nextPrayerChipLabel: { fontSize: 11, fontWeight: '700', color: colors.gold[300] },
  nextPrayerChipDot: { width: 3, height: 3, borderRadius: 2, backgroundColor: colors.gold[500] },
  nextPrayerChipTime: { fontSize: 11, fontWeight: '800', color: colors.gold[100] },

  // Vocabulary card (deprioritized)
  vocabCard: { borderRadius: radius.sm, ...shadow.sm, opacity: 0.92 },
  vocabCardInner: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: spacing.sm },
  vocabEmoji: { fontSize: 18 },
  vocabCount: { fontSize: 12, fontWeight: '500' },
  vocabCountNum: { fontWeight: '800', color: colors.navy[800] },
  vocabSub: { fontSize: 10, marginTop: 1 },

  ramadanCard: { borderRadius: radius.sm, overflow: 'hidden', ...shadow.sm, opacity: 0.92 },
  ramadanInner: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: spacing.sm, overflow: 'hidden' },
  ramadanDecor: { position: 'absolute', right: -30, top: -30, width: 100, height: 100, borderRadius: 50, borderWidth: 1, borderColor: 'rgba(245,158,11,0.15)' },
  ramadanTitle: { fontSize: 12, color: colors.white, fontWeight: '700' },
  ramadanSub: { fontSize: 10, color: 'rgba(255,255,255,0.4)', marginTop: 1 },

  gapCard: { borderRadius: radius.sm, ...shadow.sm, opacity: 0.92 },
  gapInner: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: spacing.sm },
  gapIcon: { width: 30, height: 30, borderRadius: radius.sm, backgroundColor: 'rgba(129,140,248,0.15)', alignItems: 'center', justifyContent: 'center' },
  gapTitle: { fontSize: 12, fontWeight: '500' },
  gapCount: { fontWeight: '800', color: '#818CF8' },
  gapSub: { fontSize: 10, marginTop: 1 },

  ayahGrad: { padding: spacing.xl, gap: spacing.md, overflow: 'hidden' },
  ayahDecor: { position: 'absolute', right: -40, top: -40, width: 160, height: 160, borderRadius: 80, backgroundColor: 'rgba(245,158,11,0.06)' },
  ayahTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  ayahSurah: { ...typography.subheading, color: colors.gold[300] },
  ayahRef: { fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 2, fontWeight: '500' },
  ayahPlayBtn: { width: 38, height: 38, borderRadius: radius.pill, backgroundColor: 'rgba(245,158,11,0.15)', borderWidth: 1, borderColor: 'rgba(245,158,11,0.3)', alignItems: 'center', justifyContent: 'center' },
  ayahAr: { fontSize: 24, lineHeight: 50, color: 'rgba(255,255,255,0.92)', textAlign: 'right', writingDirection: 'rtl' },
  ayahDivider: { height: 1, backgroundColor: 'rgba(255,255,255,0.07)' },
  ayahTrans: { ...typography.body, color: 'rgba(255,255,255,0.55)', lineHeight: 24 },
  ayahTransUrdu: { textAlign: 'right', writingDirection: 'rtl', lineHeight: 26 },
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
  hadithAr: { fontSize: 20, lineHeight: 42, textAlign: 'right', writingDirection: 'rtl' },
  hadithTrans: { ...typography.body, lineHeight: 26 },
  hadithTransUrdu: { textAlign: 'right', writingDirection: 'rtl' },
  langToggle: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: radius.pill, paddingHorizontal: 7, paddingVertical: 3, gap: 4 },
  langToggleLight: { backgroundColor: 'rgba(56,189,248,0.1)', borderWidth: 1, borderColor: 'rgba(56,189,248,0.2)' },
  langToggleOpt: { fontSize: 10, fontWeight: '700', color: 'rgba(255,255,255,0.4)', letterSpacing: 0.5 },
  langToggleOptLight: { color: colors.parchment[400] },
  langToggleActive: { color: colors.gold[300] },
  langToggleActiveDark: { color: '#38BDF8' },
  langToggleSep: { fontSize: 9, color: 'rgba(255,255,255,0.2)' },

  dailyProphetCard: { borderRadius: radius.md, borderWidth: 1, overflow: 'hidden', ...shadow.sm },
  dailyProphetAccent: { height: 3 },
  dailyProphetInner: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.md },
  dailyProphetIconWrap: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  dailyProphetIcon: { fontSize: 26 },
  dailyCardLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 1.5, marginBottom: 2 },
  dailyProphetName: { fontSize: 16, fontWeight: '700' },
  dailyProphetArabic: { fontSize: 14, fontFamily: 'Amiri_400Regular', color: '#94A3B8', marginBottom: 2 },
  dailyProphetSummary: { fontSize: 12, lineHeight: 17 },
});
