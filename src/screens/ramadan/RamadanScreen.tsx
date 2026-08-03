import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated, Easing, Image, ScrollView, StatusBar, StyleSheet, Text,
  TextInput, TouchableOpacity, View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { BackButton } from '../../components/common/BackButton';
import { useThemeStore } from '../../store/useThemeStore';
import { darkColors } from '../../theme/darkColors';
import { colors, radius, shadow, spacing, typography } from '../../theme';
import { RamadanJuzEntry } from '../../types/models';

const JUZ_KEY = 'kitaabai.ramadan.juz';
const ZAKAT_NISAB_GRAMS = 87.48; // grams of gold
const GOLD_PRICE_USD_PER_GRAM = 62; // approximate — shown as estimate

function getCountdown(targetHHMM: string): string {
  const now = new Date();
  const [h, m] = targetHHMM.split(':').map(Number);
  const target = new Date(now);
  target.setHours(h, m, 0, 0);
  if (target <= now) target.setDate(target.getDate() + 1);
  const diff = target.getTime() - now.getTime();
  const totalMin = Math.floor(diff / 60000);
  const hrs = Math.floor(totalMin / 60);
  const mins = totalMin % 60;
  return `${hrs}h ${mins}m`;
}

function RamadanBanner() {
  const pulse = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.04, duration: 1800, useNativeDriver: true, easing: Easing.inOut(Easing.ease) }),
        Animated.timing(pulse, { toValue: 1, duration: 1800, useNativeDriver: true, easing: Easing.inOut(Easing.ease) }),
      ])
    ).start();
  }, []);
  return (
    <Animated.View style={{ transform: [{ scale: pulse }] }}>
      <LinearGradient colors={['#0F1C42', '#1A2A5E', '#0F1C42']} style={styles.banner}>
        <Image source={require('../../../assets/images/islamicbackground.png')} style={styles.bannerBgPattern} resizeMode="cover" />
        <Image source={require('../../../assets/images/ramadan.png')} style={styles.bannerIcon} resizeMode="contain" />
        <View style={styles.bannerDecor1} />
        <View style={styles.bannerDecor2} />
        <Text style={[styles.bannerAr, { fontFamily: 'Amiri_400Regular' }]}>رَمَضَانُ الْمُبَارَك</Text>
        <Text style={styles.bannerEn}>Ramadan Mubarak</Text>
        <Text style={styles.bannerSub}>The blessed month of the Quran</Text>
      </LinearGradient>
    </Animated.View>
  );
}

function CountdownCard({ label, icon, time, color, isDark }: { label: string; icon: keyof typeof Ionicons.glyphMap; time: string; color: string; isDark: boolean }) {
  const cardBg = isDark ? darkColors.surface : colors.white;
  const labelColor = isDark ? darkColors.text.secondary : colors.parchment[500];
  const inColor = isDark ? darkColors.text.muted : colors.parchment[400];
  return (
    <View style={[styles.countCard, { borderLeftColor: color, backgroundColor: cardBg }]}>
      <View style={[styles.countIconWrap, { backgroundColor: color + '20' }]}>
        <Ionicons name={icon} size={20} color={color} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.countLabel, { color: labelColor }]}>{label}</Text>
        <Text style={[styles.countTime, { color }]}>{time}</Text>
      </View>
      <Text style={[styles.countIn, { color: inColor }]}>in</Text>
    </View>
  );
}

function JuzTracker({ completedJuz, onToggle, isDark }: { completedJuz: Set<number>; onToggle: (juz: number) => void; isDark: boolean }) {
  const done = completedJuz.size;
  const progress = done / 30;
  const sectionBg = isDark ? darkColors.surface : colors.white;
  const titleColor = isDark ? darkColors.text.primary : colors.parchment[950];
  const cellBg = isDark ? 'rgba(255,255,255,0.08)' : colors.parchment[100];
  const cellTextColor = isDark ? darkColors.text.secondary : colors.parchment[600];
  return (
    <View style={[styles.juzSection, { backgroundColor: sectionBg }]}>
      <View style={styles.juzHeader}>
        <Text style={[styles.cardTitle, { color: titleColor }]}>30-Day Quran Tracker</Text>
        <Text style={styles.juzProgress}>{done}/30 Juz</Text>
      </View>
      {/* Progress bar */}
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${Math.round(progress * 100)}%` as `${number}%` }]} />
      </View>
      <View style={styles.juzGrid}>
        {Array.from({ length: 30 }, (_, i) => i + 1).map(juz => {
          const done = completedJuz.has(juz);
          return (
            <TouchableOpacity
              key={juz}
              style={[styles.juzCell, { backgroundColor: cellBg }, done && styles.juzCellDone]}
              onPress={() => onToggle(juz)}
              activeOpacity={0.75}
            >
              <Text style={[styles.juzCellText, { color: cellTextColor }, done && styles.juzCellTextDone]}>{juz}</Text>
              {done && <Ionicons name="checkmark" size={9} color={colors.white} style={styles.juzCheck} />}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

function ZakatCalculator({ isDark }: { isDark: boolean }) {
  const [wealth, setWealth] = useState('');
  const [result, setResult] = useState<{ due: boolean; amount: number; nisabValue: number } | null>(null);
  const cardBg = isDark ? darkColors.surface : colors.white;
  const titleColor = isDark ? darkColors.text.primary : colors.parchment[950];
  const descColor = isDark ? darkColors.text.secondary : colors.parchment[500];
  const inputBorder = isDark ? darkColors.border : colors.parchment[200];
  const inputTextColor = isDark ? darkColors.text.primary : colors.parchment[900];
  const currencyColor = isDark ? darkColors.text.secondary : colors.parchment[600];

  const calculate = () => {
    const w = parseFloat(wealth);
    if (isNaN(w) || w <= 0) return;
    const nisabValue = ZAKAT_NISAB_GRAMS * GOLD_PRICE_USD_PER_GRAM;
    const due = w >= nisabValue;
    setResult({ due, amount: due ? w * 0.025 : 0, nisabValue });
  };

  return (
    <View style={[styles.zakatCard, { backgroundColor: cardBg }]}>
      <View style={styles.zakatHeader}>
        <View style={styles.zakatIconWrap}>
          <Ionicons name="calculator-outline" size={18} color={colors.gold[400]} />
        </View>
        <Text style={[styles.cardTitle, { color: titleColor }]}>Zakat Calculator</Text>
      </View>
      <Text style={[styles.zakatDesc, { color: descColor }]}>
        Nisab threshold: ~${(ZAKAT_NISAB_GRAMS * GOLD_PRICE_USD_PER_GRAM).toFixed(0)} USD
        ({ZAKAT_NISAB_GRAMS}g gold × ${GOLD_PRICE_USD_PER_GRAM}/g est.)
      </Text>
      <View style={[styles.zakatInputRow, { borderColor: inputBorder }]}>
        <Text style={[styles.zakatCurrency, { color: currencyColor }]}>$</Text>
        <TextInput
          value={wealth}
          onChangeText={setWealth}
          keyboardType="numeric"
          placeholder="Enter your total wealth (USD)"
          placeholderTextColor={isDark ? 'rgba(255,255,255,0.3)' : colors.parchment[400]}
          style={[styles.zakatInput, { color: inputTextColor }]}
          returnKeyType="done"
          onSubmitEditing={calculate}
        />
      </View>
      <TouchableOpacity style={styles.zakatBtn} onPress={calculate} activeOpacity={0.8}>
        <Text style={styles.zakatBtnText}>Calculate Zakat</Text>
      </TouchableOpacity>
      {result && (
        <View style={[styles.zakatResult, { backgroundColor: result.due ? 'rgba(245,158,11,0.1)' : 'rgba(74,222,128,0.1)', borderColor: result.due ? 'rgba(245,158,11,0.3)' : 'rgba(74,222,128,0.3)' }]}>
          {result.due ? (
            <>
              <Text style={[styles.zakatResultTitle, { color: colors.gold[400] }]}>Zakat is due ✓</Text>
              <Text style={styles.zakatResultAmount}>${result.amount.toFixed(2)} <Text style={styles.zakatResultSub}>(2.5% of wealth)</Text></Text>
            </>
          ) : (
            <>
              <Text style={[styles.zakatResultTitle, { color: '#4ADE80' }]}>Zakat not due</Text>
              <Text style={styles.zakatResultSub}>Your wealth is below the nisab threshold of ${result.nisabValue.toFixed(0)}</Text>
            </>
          )}
        </View>
      )}
    </View>
  );
}

function LaylatCard({ isDark, textPrimary }: { isDark: boolean; textPrimary: string }) {
  const ramadanOddNights = [21, 23, 25, 27, 29];
  const cardBg = isDark ? darkColors.surface : colors.white;
  return (
    <View style={[styles.laylatCard, { backgroundColor: cardBg }]}>
      <LinearGradient colors={['rgba(167,139,250,0.15)', 'rgba(167,139,250,0.05)']} style={styles.laylatGrad}>
        <View style={styles.laylatHeader}>
          <Ionicons name="moon" size={20} color="#A78BFA" />
          <Text style={[styles.cardTitle, { color: '#A78BFA' }]}>Laylat al-Qadr</Text>
        </View>
        <Text style={[styles.laylatDesc, { color: textPrimary }]}>
          Seek it in the last 10 nights of Ramadan — especially the odd nights.
        </Text>
        <View style={styles.nightsRow}>
          {ramadanOddNights.map(n => (
            <View key={n} style={styles.nightCell}>
              <Text style={styles.nightNum}>{n}</Text>
              <Text style={styles.nightLabel}>Ramadan</Text>
            </View>
          ))}
        </View>
        <Text style={[styles.laylatDesc, { marginTop: spacing.md, fontStyle: 'italic', color: textPrimary }]}>
          {"\"The Night of Decree is better than a thousand months.\""}
        </Text>
        <Text style={styles.laylatRef}>— Al-Qadr 97:3</Text>
      </LinearGradient>
    </View>
  );
}

export function RamadanScreen() {
  const navigation = useNavigation();
  const isDark = useThemeStore(s => s.isDark);
  const [completedJuz, setCompletedJuz] = useState<Set<number>>(new Set());
  const bg = isDark ? darkColors.background : colors.parchment[50];
  const cardBg = isDark ? darkColors.surface : colors.white;
  const textPrimary = isDark ? darkColors.text.primary : colors.parchment[950];
  const textMuted = isDark ? darkColors.text.muted : colors.parchment[400];

  // Simulated prayer times for countdown demo (real app would load from prayerTimesApi)
  const suhoorTime = '04:45';
  const iftarTime  = '18:32';

  useEffect(() => {
    AsyncStorage.getItem(JUZ_KEY).then(raw => {
      if (raw) {
        try {
          const list = JSON.parse(raw) as number[];
          setCompletedJuz(new Set(list));
        } catch {}
      }
    }).catch(() => {});
  }, []);

  const handleToggleJuz = useCallback(async (juz: number) => {
    setCompletedJuz(prev => {
      const next = new Set(prev);
      if (next.has(juz)) next.delete(juz); else next.add(juz);
      AsyncStorage.setItem(JUZ_KEY, JSON.stringify([...next])).catch(() => {});
      return next;
    });
  }, []);

  return (
    <ScreenContainer noPadding>
      <StatusBar barStyle="light-content" />
      {/* Header */}
      <LinearGradient colors={['#0A0F2E', '#0F1C42', '#1A2A5E']} style={styles.header}>
        <BackButton />
        <Text style={styles.headerTitle}>Ramadan Mode</Text>
        <View style={{ width: 40 }} />
      </LinearGradient>

      <ScrollView showsVerticalScrollIndicator={false} style={{ backgroundColor: bg }} contentContainerStyle={styles.content}>
        <RamadanBanner />

        {/* Suhoor / Iftar countdown */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: textMuted }]}>TODAY'S TIMES</Text>
          <CountdownCard label="Suhoor ends (Fajr)" icon="sunny-outline" time={getCountdown(suhoorTime)} color="#818CF8" isDark={isDark} />
          <CountdownCard label="Iftar (Maghrib)"    icon="moon-outline"  time={getCountdown(iftarTime)}  color={colors.gold[400]} isDark={isDark} />
          <Text style={[styles.noteText, { color: textMuted }]}>Times are loaded from your Prayer screen settings.</Text>
        </View>

        {/* Juz tracker */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: textMuted }]}>QURAN COMPLETION</Text>
          <JuzTracker completedJuz={completedJuz} onToggle={handleToggleJuz} isDark={isDark} />
        </View>

        {/* Zakat */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: textMuted }]}>ZAKAT</Text>
          <ZakatCalculator isDark={isDark} />
        </View>

        {/* Sunnah acts */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: textMuted }]}>RAMADAN ACTS</Text>
          <View style={[styles.sunnahCard, { backgroundColor: cardBg }]}>
            {[
              { icon: 'book-outline', text: 'Complete one Juz daily', color: colors.gold[400] },
              { icon: 'hand-left-outline', text: 'Increase in Dua & Dhikr', color: '#818CF8' },
              { icon: 'heart-outline', text: 'Give Sadaqah daily', color: '#F472B6' },
              { icon: 'people-outline', text: 'Strengthen family bonds', color: '#4ADE80' },
              { icon: 'moon-outline', text: 'Pray Taraweeh at night', color: '#A78BFA' },
              { icon: 'restaurant-outline', text: 'Share Iftar with others', color: '#F59E0B' },
            ].map(({ icon, text, color }) => (
              <View key={text} style={styles.sunnahRow}>
                <View style={[styles.sunnahIcon, { backgroundColor: color + '22' }]}>
                  <Ionicons name={icon as keyof typeof Ionicons.glyphMap} size={16} color={color} />
                </View>
                <Text style={[styles.sunnahText, { color: textPrimary }]}>{text}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Last 10 nights */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: textMuted }]}>LAST 10 NIGHTS</Text>
          <LaylatCard isDark={isDark} textPrimary={textPrimary} />
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 52, paddingBottom: spacing.lg, paddingHorizontal: spacing.lg },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { ...typography.heading, color: colors.white },

  content: { padding: spacing.lg, gap: spacing.lg, paddingBottom: spacing.xxxl },

  banner: { borderRadius: radius.md, padding: spacing.xl, alignItems: 'center', gap: spacing.xs, overflow: 'hidden', ...shadow.navy },
  bannerBgPattern: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, width: '100%', height: '100%', opacity: 0.08 },
  bannerIcon: { position: 'absolute', right: -8, bottom: -8, width: 70, height: 70, opacity: 0.2 },
  bannerDecor1: { position: 'absolute', right: -40, top: -40, width: 140, height: 140, borderRadius: 70, borderWidth: 1, borderColor: 'rgba(245,158,11,0.15)' },
  bannerDecor2: { position: 'absolute', left: -30, bottom: -30, width: 100, height: 100, borderRadius: 50, borderWidth: 1, borderColor: 'rgba(245,158,11,0.08)' },
  bannerAr: { fontSize: 28, color: colors.gold[300] },
  bannerEn: { ...typography.heading, color: colors.white },
  bannerSub: { ...typography.caption, color: 'rgba(255,255,255,0.45)' },

  section: { gap: spacing.sm },
  sectionLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 1.8, color: colors.parchment[400] },

  countCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, backgroundColor: colors.white, borderRadius: radius.md, padding: spacing.lg, borderLeftWidth: 3, ...shadow.sm },
  countIconWrap: { width: 40, height: 40, borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center' },
  countLabel: { ...typography.caption, color: colors.parchment[500] },
  countTime: { ...typography.heading, fontSize: 22 },
  countIn: { ...typography.caption, color: colors.parchment[400] },

  noteText: { fontSize: 10, color: colors.parchment[400], fontStyle: 'italic' },

  juzSection: { backgroundColor: colors.white, borderRadius: radius.md, padding: spacing.lg, ...shadow.sm, gap: spacing.md },
  juzHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  juzProgress: { ...typography.caption, color: colors.gold[600], fontWeight: '700' },
  progressTrack: { height: 6, backgroundColor: colors.parchment[100], borderRadius: radius.pill, overflow: 'hidden' },
  progressFill: { height: 6, backgroundColor: colors.gold[400], borderRadius: radius.pill },
  juzGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  juzCell: { width: 38, height: 38, borderRadius: radius.xs, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.parchment[100], position: 'relative' },
  juzCellDone: { backgroundColor: colors.navy[800] },
  juzCellText: { fontSize: 12, fontWeight: '700', color: colors.parchment[600] },
  juzCellTextDone: { color: colors.white },
  juzCheck: { position: 'absolute', top: 2, right: 2 },

  zakatCard: { backgroundColor: colors.white, borderRadius: radius.md, padding: spacing.lg, gap: spacing.md, ...shadow.sm },
  zakatHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  zakatIconWrap: { width: 36, height: 36, borderRadius: radius.xs, backgroundColor: 'rgba(245,158,11,0.12)', alignItems: 'center', justifyContent: 'center' },
  zakatDesc: { ...typography.caption, color: colors.parchment[500], lineHeight: 18 },
  zakatInputRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, borderWidth: 1.5, borderColor: colors.parchment[200], borderRadius: radius.sm, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  zakatCurrency: { ...typography.bodySmall, color: colors.parchment[600], fontWeight: '700' },
  zakatInput: { flex: 1, ...typography.body, color: colors.parchment[900] },
  zakatBtn: { backgroundColor: colors.navy[800], borderRadius: radius.sm, paddingVertical: spacing.md, alignItems: 'center' },
  zakatBtnText: { ...typography.bodySmall, color: colors.white, fontWeight: '700' },
  zakatResult: { borderRadius: radius.sm, borderWidth: 1, padding: spacing.md, gap: 4 },
  zakatResultTitle: { ...typography.subheading },
  zakatResultAmount: { ...typography.body, color: colors.parchment[900] },
  zakatResultSub: { ...typography.caption, color: colors.parchment[500] },

  laylatCard: { borderRadius: radius.md, overflow: 'hidden', ...shadow.sm },
  laylatGrad: { padding: spacing.lg, gap: spacing.sm },
  laylatHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  laylatDesc: { ...typography.bodySmall, color: colors.parchment[600], lineHeight: 20 },
  nightsRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xs },
  nightCell: { flex: 1, alignItems: 'center', backgroundColor: 'rgba(167,139,250,0.15)', borderRadius: radius.sm, paddingVertical: spacing.sm, borderWidth: 1, borderColor: 'rgba(167,139,250,0.3)' },
  nightNum: { ...typography.subheading, color: '#A78BFA' },
  nightLabel: { fontSize: 9, color: 'rgba(167,139,250,0.6)', fontWeight: '700' },
  laylatRef: { fontSize: 11, color: colors.parchment[400], fontStyle: 'italic' },

  cardTitle: { ...typography.subheading, color: colors.parchment[900] },

  sunnahCard: { backgroundColor: colors.white, borderRadius: radius.md, padding: spacing.lg, gap: spacing.md, ...shadow.sm },
  sunnahRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  sunnahIcon: { width: 34, height: 34, borderRadius: radius.xs, alignItems: 'center', justifyContent: 'center' },
  sunnahText: { ...typography.bodySmall, color: colors.parchment[800], flex: 1 },
});
