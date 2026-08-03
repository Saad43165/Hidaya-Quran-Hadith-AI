import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated, Pressable, ScrollView, StyleSheet,
  Text, View, ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';

import { useThemeColors } from '../../hooks/useThemeColors';
import { colors, radius, spacing, typography } from '../../theme';
import { BackButton } from '../../components/common/BackButton';
import { Haptics } from '../../services/haptics';
import {
  getTodaySalah, toggleSalah, getWeeklySalah,
  getTotalCompleted, getLongestStreak, PRAYERS, PrayerName,
} from '../../services/db/salahRepo';

// ── Types & constants ──────────────────────────────────────────────────────────

type WeekDay = { date: string; prayers: Record<string, boolean> };

const PRAYER_META: Record<PrayerName, {
  arabic: string; icon: keyof typeof Ionicons.glyphMap; timeLabel: string; timeApprox: string;
}> = {
  Fajr:    { arabic: 'فجر',  icon: 'sunny-outline',   timeLabel: 'Pre-Dawn',  timeApprox: '~5:00 AM' },
  Dhuhr:   { arabic: 'ظهر',  icon: 'sunny',           timeLabel: 'Midday',    timeApprox: '~1:00 PM' },
  Asr:     { arabic: 'عصر',  icon: 'partly-sunny',    timeLabel: 'Afternoon', timeApprox: '~4:30 PM' },
  Maghrib: { arabic: 'مغرب', icon: 'moon',            timeLabel: 'Sunset',    timeApprox: '~7:00 PM' },
  Isha:    { arabic: 'عشاء', icon: 'moon-outline',    timeLabel: 'Night',     timeApprox: '~9:00 PM' },
};

// Which prayer is "current" based on hour
function getCurrentPrayer(): PrayerName | null {
  const h = new Date().getHours();
  if (h >= 4  && h < 12) return 'Fajr';
  if (h >= 12 && h < 16) return 'Dhuhr';
  if (h >= 16 && h < 19) return 'Asr';
  if (h >= 19 && h < 21) return 'Maghrib';
  if (h >= 21 || h < 4)  return 'Isha';
  return null;
}

function todayStr(): string { return new Date().toISOString().slice(0, 10); }

function countCompleted(prayers: Record<string, boolean>): number {
  return Object.values(prayers).filter(Boolean).length;
}

function getDayLabel(dateStr: string): string {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short' }).slice(0, 3);
}

function calcCurrentStreak(weekly: WeekDay[]): number {
  let streak = 0;
  const sorted = [...weekly].reverse();
  for (const day of sorted) {
    if (countCompleted(day.prayers) === 5) streak++;
    else break;
  }
  return streak;
}

const MOTIVATION: string[] = [
  'Every prayer is a conversation with Allah.',
  'The first thing you will be asked about on the Day of Judgment is your salah.',
  'Prayer is the pillar of the Deen.',
  '"Verily, I am Allah. There is no god but Me, so worship Me and establish prayer for My remembrance." [20:14]',
  'Between a man and disbelief is the abandonment of salah. — Hadith, Muslim',
  '"And seek help through patience and prayer." [2:45]',
  'The coolness of my eyes is in the prayer. — Prophet ﷺ',
  'Salah is the light of the believer.',
];

function getMotivation(count: number): string {
  if (count === 5) return '🎉 MāshāAllah! All 5 prayers completed. May Allah accept!';
  return MOTIVATION[(new Date().getDate() + count) % MOTIVATION.length];
}

// ── Ring Progress ──────────────────────────────────────────────────────────────

function RingProgress({ count, isDark }: { count: number; isDark: boolean }) {
  const pct = count / 5;
  // Two-half trick: left half + right half clipped rotation
  const leftDeg  = pct > 0.5 ? 180 : pct * 360;
  const rightDeg = pct > 0.5 ? (pct - 0.5) * 360 : 0;

  const SIZE = 140;
  const THICK = 12;
  const trackColor = isDark ? 'rgba(255,255,255,0.08)' : colors.parchment[200];

  return (
    <View style={{ width: SIZE, height: SIZE, alignItems: 'center', justifyContent: 'center' }}>
      {/* Track */}
      <View style={{
        position: 'absolute', width: SIZE, height: SIZE,
        borderRadius: SIZE / 2, borderWidth: THICK, borderColor: trackColor,
      }} />

      {/* Right half (0–50%) */}
      <View style={{
        position: 'absolute', width: SIZE, height: SIZE,
        overflow: 'hidden',
        // Show only right half
      }}>
        <View style={{ position: 'absolute', right: 0, width: SIZE / 2, height: SIZE, overflow: 'hidden' }}>
          <View style={{
            position: 'absolute', left: -SIZE / 2, width: SIZE, height: SIZE,
            borderRadius: SIZE / 2, borderWidth: THICK, borderColor: 'transparent',
            borderRightColor: colors.gold[400], borderTopColor: rightDeg > 90 ? colors.gold[400] : 'transparent',
            transform: [{ rotate: `${rightDeg}deg` }],
          }} />
        </View>
      </View>

      {/* Left half (50–100%) */}
      <View style={{ position: 'absolute', left: 0, width: SIZE / 2, height: SIZE, overflow: 'hidden' }}>
        <View style={{
          position: 'absolute', right: -SIZE / 2, width: SIZE, height: SIZE,
          borderRadius: SIZE / 2, borderWidth: THICK, borderColor: 'transparent',
          borderLeftColor: pct > 0.5 ? colors.gold[400] : 'transparent',
          borderBottomColor: leftDeg > 90 ? colors.gold[400] : 'transparent',
          transform: [{ rotate: `${leftDeg}deg` }],
        }} />
      </View>

      {/* Center */}
      <View style={{ alignItems: 'center', gap: 2 }}>
        <Text style={{ fontSize: 34, fontWeight: '900', color: count === 5 ? colors.gold[400] : (isDark ? colors.white : colors.navy[900]) }}>
          {count}
        </Text>
        <Text style={{ fontSize: 11, fontWeight: '600', color: isDark ? 'rgba(255,255,255,0.4)' : colors.parchment[500], letterSpacing: 0.5 }}>
          of 5
        </Text>
      </View>
    </View>
  );
}

// ── Weekly heatmap dot ─────────────────────────────────────────────────────────

function HeatDot({ count, isToday }: { count: number; isToday: boolean }) {
  const bg =
    count === 5 ? colors.gold[400] :
    count >= 3  ? colors.gold[600] + 'AA' :
    count >= 1  ? colors.gold[800] + '66' :
                  'transparent';
  return (
    <View style={{
      width: 26, height: 26, borderRadius: 6,
      backgroundColor: bg,
      borderWidth: isToday ? 2 : 1,
      borderColor: isToday ? colors.gold[400] : (count > 0 ? colors.gold[600] + '55' : 'rgba(255,255,255,0.08)'),
      alignItems: 'center', justifyContent: 'center',
    }}>
      {count > 0 && count < 5 && (
        <Text style={{ fontSize: 9, fontWeight: '800', color: colors.gold[300] }}>{count}</Text>
      )}
      {count === 5 && (
        <Ionicons name="checkmark" size={12} color={colors.navy[950]} />
      )}
    </View>
  );
}

// ── Prayer Row Card ────────────────────────────────────────────────────────────

function PrayerCard({
  prayer, done, isCurrent, isToggling, isDark, surface, border, onToggle,
}: {
  prayer: PrayerName; done: boolean; isCurrent: boolean; isToggling: boolean;
  isDark: boolean; surface: string; border: string;
  onToggle: () => void;
}) {
  const meta = PRAYER_META[prayer];
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePress = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 0.96, duration: 80, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 1,    duration: 120, useNativeDriver: true }),
    ]).start();
    onToggle();
  };

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <Pressable
        onPress={handlePress}
        style={[
          styles.prayerCard,
          {
            backgroundColor: done
              ? (isDark ? '#0F1C42' : '#EDF3FF')
              : surface,
            borderColor: done
              ? colors.gold[isDark ? 500 : 400]
              : isCurrent
                ? colors.gold[isDark ? 700 : 500] + '80'
                : border,
            borderWidth: done || isCurrent ? 2 : 1,
          },
        ]}
        android_ripple={{ color: 'rgba(212,169,62,0.1)' }}
      >
        {/* Current prayer indicator */}
        {isCurrent && !done && (
          <View style={styles.currentBadge}>
            <View style={styles.currentDot} />
            <Text style={styles.currentText}>Now</Text>
          </View>
        )}

        {/* Icon */}
        <View style={[
          styles.iconWrap,
          { backgroundColor: done ? colors.gold[900] + '40' : (isDark ? 'rgba(255,255,255,0.06)' : colors.parchment[100]) },
        ]}>
          <Ionicons
            name={meta.icon}
            size={20}
            color={done ? colors.gold[400] : (isDark ? 'rgba(255,255,255,0.5)' : colors.navy[600])}
          />
        </View>

        {/* Info */}
        <View style={styles.prayerInfo}>
          <View style={styles.prayerNameRow}>
            <Text style={[styles.prayerName, { color: done ? colors.gold[isDark ? 300 : 600] : (isDark ? colors.white : colors.navy[900]) }]}>
              {prayer}
            </Text>
            <Text style={[styles.prayerArabic, { color: done ? colors.gold[isDark ? 500 : 500] : (isDark ? 'rgba(255,255,255,0.35)' : colors.parchment[600]), fontFamily: 'Amiri_400Regular' }]}>
              {meta.arabic}
            </Text>
          </View>
          <Text style={[styles.prayerTime, { color: isDark ? 'rgba(255,255,255,0.3)' : colors.parchment[500] }]}>
            {meta.timeLabel} · {meta.timeApprox}
          </Text>
        </View>

        {/* Check */}
        <View style={[
          styles.checkCircle,
          {
            backgroundColor: done ? colors.gold[500] : 'transparent',
            borderColor: done ? colors.gold[400] : (isDark ? 'rgba(255,255,255,0.2)' : colors.parchment[300]),
          },
        ]}>
          {isToggling
            ? <ActivityIndicator size="small" color={done ? colors.navy[950] : colors.gold[400]} />
            : done
              ? <Ionicons name="checkmark" size={16} color={colors.navy[950]} />
              : null}
        </View>
      </Pressable>
    </Animated.View>
  );
}

// ── Main Screen ────────────────────────────────────────────────────────────────

export function SalahTrackerScreen() {
  const insets = useSafeAreaInsets();
  const { isDark, bg, surface, border, textPrimary, textSecondary, textMuted } = useThemeColors();

  const [todayPrayers, setTodayPrayers] = useState<Record<string, boolean>>({
    Fajr: false, Dhuhr: false, Asr: false, Maghrib: false, Isha: false,
  });
  const [weekly, setWeekly]             = useState<WeekDay[]>([]);
  const [totalCompleted, setTotal]      = useState(0);
  const [longestStreak, setLongest]     = useState(0);
  const [loading, setLoading]           = useState(true);
  const [toggling, setToggling]         = useState<string | null>(null);

  const today = todayStr();
  const todayCount     = countCompleted(todayPrayers);
  const currentStreak  = calcCurrentStreak(weekly);
  const currentPrayer  = getCurrentPrayer();
  const allDone        = todayCount === 5;

  // Congrats banner anim
  const bannerAnim = useRef(new Animated.Value(0)).current;
  const prevCount  = useRef(todayCount);
  useEffect(() => {
    if (todayCount === 5 && prevCount.current !== 5) {
      Animated.spring(bannerAnim, { toValue: 1, tension: 60, friction: 8, useNativeDriver: true }).start();
    }
    if (todayCount < 5) bannerAnim.setValue(0);
    prevCount.current = todayCount;
  }, [todayCount, bannerAnim]);

  const loadData = useCallback(async () => {
    try {
      const [tp, wk, total, longest] = await Promise.all([
        getTodaySalah(), getWeeklySalah(), getTotalCompleted(), getLongestStreak(),
      ]);
      setTodayPrayers(tp);
      setWeekly(wk);
      setTotal(total);
      setLongest(longest);
    } catch (e) {
      console.warn('[SalahTracker] load error:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => {
    setLoading(true);
    loadData();
  }, [loadData]));

  const handleToggle = useCallback(async (prayer: string) => {
    if (toggling) return;
    setToggling(prayer);
    Haptics.impact('light');
    const newVal = !todayPrayers[prayer];
    setTodayPrayers(prev => ({ ...prev, [prayer]: newVal }));
    try {
      await toggleSalah(prayer, newVal);
      const [wk, total, longest] = await Promise.all([getWeeklySalah(), getTotalCompleted(), getLongestStreak()]);
      setWeekly(wk);
      setTotal(total);
      setLongest(longest);
    } catch {
      setTodayPrayers(prev => ({ ...prev, [prayer]: !newVal }));
    } finally {
      setToggling(null);
    }
  }, [todayPrayers, toggling]);

  return (
    <View style={[styles.root, { backgroundColor: bg }]}>

      {/* ── Header ── */}
      <LinearGradient colors={['#060C1F', '#0B1330', '#0F1C42']} style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <View style={styles.navRow}>
          <BackButton />
          <View style={styles.headerTitles}>
            <Text style={styles.headerTitle}>Salah Tracker</Text>
            <Text style={styles.headerSub}>{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</Text>
          </View>
          <View style={styles.streakBadge}>
            <Text style={styles.streakBadgeEmoji}>🔥</Text>
            <Text style={styles.streakBadgeText}>{currentStreak}d</Text>
          </View>
        </View>

        {/* Ring + today info */}
        <View style={styles.ringSection}>
          <RingProgress count={todayCount} isDark={isDark} />
          <View style={styles.ringInfo}>
            <Text style={styles.ringInfoLabel}>TODAY'S PROGRESS</Text>
            <Text style={[styles.motivationText, { color: allDone ? colors.gold[300] : 'rgba(255,255,255,0.6)' }]}>
              {getMotivation(todayCount)}
            </Text>
          </View>
        </View>

        {/* Gold progress bar */}
        <View style={styles.progressBarBg}>
          <View style={[styles.progressBarFill, { width: `${(todayCount / 5) * 100}%` as any }]} />
        </View>
      </LinearGradient>

      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={colors.gold[400]} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 32 }]}
          showsVerticalScrollIndicator={false}
        >
          {/* ── Congrats banner ── */}
          <Animated.View style={[
            styles.congratsBanner,
            {
              opacity: bannerAnim,
              transform: [{ translateY: bannerAnim.interpolate({ inputRange: [0, 1], outputRange: [-20, 0] }) }],
            },
          ]}>
            <LinearGradient colors={[colors.gold[600], colors.gold[400]]} style={styles.congratsGrad}>
              <Text style={styles.congratsText}>🎉 MāshāAllah! All 5 prayers completed!</Text>
            </LinearGradient>
          </Animated.View>

          {/* ── Today's Prayers ── */}
          <Text style={[styles.sectionLabel, { color: textMuted }]}>Today's Prayers</Text>
          {PRAYERS.map(prayer => (
            <PrayerCard
              key={prayer}
              prayer={prayer}
              done={!!todayPrayers[prayer]}
              isCurrent={currentPrayer === prayer}
              isToggling={toggling === prayer}
              isDark={isDark}
              surface={surface}
              border={border}
              onToggle={() => handleToggle(prayer)}
            />
          ))}

          {/* ── Weekly Heatmap ── */}
          <Text style={[styles.sectionLabel, { color: textMuted, marginTop: 24 }]}>Last 7 Days</Text>
          <View style={[styles.heatmapCard, { backgroundColor: surface, borderColor: border }]}>
            {/* Day labels */}
            <View style={styles.heatRow}>
              <View style={styles.heatLabelCol} />
              {weekly.map(day => (
                <View key={day.date} style={styles.heatDayCol}>
                  <Text style={[styles.heatDayLabel, { color: day.date === today ? colors.gold[400] : textMuted }]}>
                    {getDayLabel(day.date)}
                  </Text>
                </View>
              ))}
            </View>

            {/* Prayer dot rows */}
            {PRAYERS.map(prayer => (
              <View key={prayer} style={styles.heatRow}>
                <View style={styles.heatLabelCol}>
                  <Text style={[styles.heatPrayerLabel, { color: textMuted }]}>{prayer.slice(0, 3)}</Text>
                </View>
                {weekly.map(day => {
                  const done = day.prayers[prayer];
                  return (
                    <View key={day.date} style={styles.heatDayCol}>
                      <View style={[
                        styles.heatDot,
                        {
                          backgroundColor: done ? colors.gold[400] : 'transparent',
                          borderColor: done ? colors.gold[400] : (isDark ? 'rgba(255,255,255,0.1)' : colors.parchment[200]),
                          borderWidth: day.date === today && !done ? 1.5 : 1,
                          borderStyle: day.date === today && !done ? 'dashed' : 'solid',
                        },
                      ]} />
                    </View>
                  );
                })}
              </View>
            ))}

            {/* Completion count row */}
            <View style={[styles.heatRow, { marginTop: 6, borderTopWidth: 1, borderTopColor: border, paddingTop: 8 }]}>
              <View style={styles.heatLabelCol}>
                <Text style={[styles.heatPrayerLabel, { color: textMuted }]}>Total</Text>
              </View>
              {weekly.map(day => {
                const c = countCompleted(day.prayers);
                return (
                  <View key={day.date} style={styles.heatDayCol}>
                    <HeatDot count={c} isToday={day.date === today} />
                  </View>
                );
              })}
            </View>
          </View>

          {/* ── Stats ── */}
          <Text style={[styles.sectionLabel, { color: textMuted, marginTop: 24 }]}>Statistics</Text>
          <View style={styles.statsRow}>
            <StatCard icon="today-outline"          value={`${todayCount}/5`}      label="Today"          isDark={isDark} surface={surface} border={border} textPrimary={textPrimary} textSecondary={textSecondary} />
            <StatCard icon="flame-outline"           value={`${currentStreak}d`}    label="Streak"         isDark={isDark} surface={surface} border={border} textPrimary={textPrimary} textSecondary={textSecondary} />
            <StatCard icon="trophy-outline"          value={`${longestStreak}d`}    label="Best"           isDark={isDark} surface={surface} border={border} textPrimary={textPrimary} textSecondary={textSecondary} />
            <StatCard icon="checkmark-done-outline"  value={`${totalCompleted}`}    label="All-time"       isDark={isDark} surface={surface} border={border} textPrimary={textPrimary} textSecondary={textSecondary} />
          </View>

          {/* Weekly completion rate */}
          <View style={[styles.weekRateCard, { backgroundColor: surface, borderColor: border }]}>
            <View>
              <Text style={[styles.weekRateLabel, { color: textSecondary }]}>7-Day Completion Rate</Text>
              <Text style={[styles.weekRateValue, { color: textPrimary }]}>
                {Math.round((weekly.reduce((acc, d) => acc + countCompleted(d.prayers), 0) / 35) * 100)}%
              </Text>
            </View>
            <View style={[styles.weekRateBar, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : colors.parchment[200] }]}>
              <View style={[styles.weekRateFill, {
                width: `${Math.round((weekly.reduce((acc, d) => acc + countCompleted(d.prayers), 0) / 35) * 100)}%` as any,
              }]} />
            </View>
          </View>
        </ScrollView>
      )}
    </View>
  );
}

// ── StatCard ──────────────────────────────────────────────────────────────────

function StatCard({ icon, value, label, isDark, surface, border, textPrimary, textSecondary }: {
  icon: keyof typeof Ionicons.glyphMap;
  value: string; label: string; isDark: boolean;
  surface: string; border: string; textPrimary: string; textSecondary: string;
}) {
  return (
    <View style={[styles.statCard, { backgroundColor: surface, borderColor: border }]}>
      <Ionicons name={icon} size={18} color={colors.gold[400]} />
      <Text style={[styles.statValue, { color: textPrimary }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: textSecondary }]}>{label}</Text>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1 },

  header: { paddingHorizontal: spacing.lg, paddingBottom: spacing.lg, gap: spacing.md },

  navRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  headerTitles: { flex: 1, gap: 2 },
  headerTitle: { fontSize: 18, fontWeight: '800', color: colors.white, letterSpacing: 0.2 },
  headerSub:   { fontSize: 12, color: 'rgba(255,255,255,0.4)', fontWeight: '500' },

  streakBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(212,169,62,0.15)',
    borderRadius: radius.pill, borderWidth: 1, borderColor: 'rgba(212,169,62,0.3)',
    paddingHorizontal: 10, paddingVertical: 5,
  },
  streakBadgeEmoji: { fontSize: 14 },
  streakBadgeText:  { fontSize: 13, fontWeight: '800', color: colors.gold[300] },

  ringSection: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg },
  ringInfo: { flex: 1, gap: spacing.sm },
  ringInfoLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 1.2, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase' },
  motivationText: { fontSize: 13, lineHeight: 20, fontWeight: '500', fontStyle: 'italic' },

  progressBarBg:   { height: 3, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 2, overflow: 'hidden' },
  progressBarFill: { height: 3, backgroundColor: colors.gold[400], borderRadius: 2 },

  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  scroll: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg, gap: spacing.sm },

  congratsBanner: { marginBottom: spacing.sm, borderRadius: radius.md, overflow: 'hidden' },
  congratsGrad:   { paddingVertical: spacing.md, paddingHorizontal: spacing.lg, alignItems: 'center' },
  congratsText:   { fontSize: 14, fontWeight: '800', color: colors.navy[950] },

  sectionLabel: { ...typography.caption, fontWeight: '800', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 4 },

  // Prayer cards
  prayerCard: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: radius.md, padding: 14, gap: 12,
    marginBottom: spacing.sm,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 1,
  },
  currentBadge: {
    position: 'absolute', top: 8, right: 52,
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(212,169,62,0.15)', borderRadius: radius.pill,
    paddingHorizontal: 6, paddingVertical: 2,
  },
  currentDot:   { width: 5, height: 5, borderRadius: 3, backgroundColor: colors.gold[400] },
  currentText:  { fontSize: 9, fontWeight: '800', color: colors.gold[400], letterSpacing: 0.5 },
  iconWrap: { width: 42, height: 42, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  prayerInfo:   { flex: 1, gap: 3 },
  prayerNameRow: { flexDirection: 'row', alignItems: 'baseline', gap: 8 },
  prayerName:   { fontSize: 15, fontWeight: '700' },
  prayerArabic: { fontSize: 16 },
  prayerTime:   { fontSize: 11, fontWeight: '500', letterSpacing: 0.2 },
  checkCircle:  {
    width: 30, height: 30, borderRadius: 15, borderWidth: 2,
    alignItems: 'center', justifyContent: 'center',
  },

  // Heatmap
  heatmapCard: { borderRadius: radius.md, borderWidth: 1, padding: spacing.md, gap: 8 },
  heatRow:     { flexDirection: 'row', alignItems: 'center' },
  heatLabelCol: { width: 36 },
  heatPrayerLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 0.3 },
  heatDayCol:  { flex: 1, alignItems: 'center', gap: 3 },
  heatDayLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 0.3, marginBottom: 4 },
  heatDot: { width: 14, height: 14, borderRadius: 4, borderWidth: 1 },

  // Stats
  statsRow: { flexDirection: 'row', gap: spacing.sm },
  statCard: {
    flex: 1, borderRadius: radius.md, borderWidth: 1, padding: spacing.md,
    alignItems: 'center', gap: 4,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 2, elevation: 1,
  },
  statValue: { fontSize: 18, fontWeight: '900' },
  statLabel: { fontSize: 9, fontWeight: '700', letterSpacing: 0.5, textTransform: 'uppercase', textAlign: 'center' },

  weekRateCard: {
    borderRadius: radius.md, borderWidth: 1, padding: spacing.lg, gap: spacing.md, marginTop: spacing.sm,
  },
  weekRateLabel: { fontSize: 12, fontWeight: '600', marginBottom: 4 },
  weekRateValue: { fontSize: 26, fontWeight: '900' },
  weekRateBar:   { height: 6, borderRadius: 3, overflow: 'hidden' },
  weekRateFill:  { height: 6, backgroundColor: colors.gold[400], borderRadius: 3 },
});
