import React, { useEffect, useRef, useState } from 'react';
import {
  Animated, Dimensions, ScrollView, StyleSheet, Text,
  TouchableOpacity, View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Haptics } from '../../services/haptics';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { BackButton } from '../../components/common/BackButton';
import { colors, radius, shadow, spacing, typography } from '../../theme';
import { darkColors } from '../../theme/darkColors';
import { useThemeStore } from '../../store/useThemeStore';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface ZikrOption {
  arabic: string;
  transliteration: string;
  translation: string;
  translationUr: string;
  defaultTarget: number;
  color: string;
  gradientColors: readonly [string, string];
}

const ZIKR_OPTIONS: ZikrOption[] = [
  {
    arabic: 'سُبْحَانَ اللَّهِ',
    transliteration: 'SubhanAllah',
    translation: 'Glory be to Allah',
    translationUr: 'اللہ پاک ہے',
    defaultTarget: 33,
    color: '#2E9E6B',
    gradientColors: ['#1A4A35', '#0D2820'],
  },
  {
    arabic: 'الْحَمْدُ لِلَّهِ',
    transliteration: 'Alhamdulillah',
    translation: 'All praise is to Allah',
    translationUr: 'تمام تعریف اللہ کے لیے',
    defaultTarget: 33,
    color: '#2E86B8',
    gradientColors: ['#1A3A50', '#0D2030'],
  },
  {
    arabic: 'اللَّهُ أَكْبَرُ',
    transliteration: 'Allahu Akbar',
    translation: 'Allah is the Greatest',
    translationUr: 'اللہ سب سے بڑا ہے',
    defaultTarget: 34,
    color: '#8B5CF6',
    gradientColors: ['#3B2070', '#1E1040'],
  },
  {
    arabic: 'لَا إِلَٰهَ إِلَّا اللَّهُ',
    transliteration: 'La ilaha illAllah',
    translation: 'There is no god but Allah',
    translationUr: 'اللہ کے سوا کوئی معبود نہیں',
    defaultTarget: 100,
    color: '#D4A93E',
    gradientColors: ['#4A3810', '#261E08'],
  },
  {
    arabic: 'أَسْتَغْفِرُ اللَّهَ',
    transliteration: 'Astaghfirullah',
    translation: 'I seek Allah\'s forgiveness',
    translationUr: 'میں اللہ سے معافی مانگتا ہوں',
    defaultTarget: 100,
    color: '#E27A4A',
    gradientColors: ['#4A2A18', '#261408'],
  },
  {
    arabic: 'اللَّهُمَّ صَلِّ عَلَى النَّبِيِّ',
    transliteration: 'Salawat an-Nabi',
    translation: 'Blessings upon the Prophet ﷺ',
    translationUr: 'نبی ﷺ پر درود',
    defaultTarget: 100,
    color: '#3B82F6',
    gradientColors: ['#162050', '#0A1228'],
  },
  {
    arabic: 'حَسْبُنَا اللَّهُ وَنِعْمَ الْوَكِيلُ',
    transliteration: 'HasbunAllah wa ni\'mal Wakeel',
    translation: 'Allah is sufficient, the best Guardian',
    translationUr: 'اللہ کافی ہے اور وہ بہترین وکیل ہے',
    defaultTarget: 100,
    color: '#EC4899',
    gradientColors: ['#4A1230', '#261018'],
  },
  {
    arabic: 'لَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللَّهِ',
    transliteration: 'La hawla wala quwwata',
    translation: 'No power except with Allah',
    translationUr: 'اللہ کے بغیر کوئی طاقت نہیں',
    defaultTarget: 33,
    color: '#10B981',
    gradientColors: ['#0A3828', '#061E18'],
  },
  {
    arabic: 'سُبْحَانَ اللَّهِ وَبِحَمْدِهِ',
    transliteration: 'SubhanAllahi wa bihamdihi',
    translation: 'Glory be to Allah and His praise',
    translationUr: 'اللہ پاک ہے اور اس کی تعریف ہے',
    defaultTarget: 100,
    color: '#F59E0B',
    gradientColors: ['#3A2008', '#1E1004'],
  },
];

const TARGET_PRESETS = [33, 50, 100];

const STORAGE_KEY     = 'kitaabai.tasbih.total';
const COUNT_KEY       = 'kitaabai.tasbih.count';
const LAST_ZIKR_KEY   = 'kitaabai.tasbih.lastZikr';
const TARGET_KEY      = 'kitaabai.tasbih.target';

const { width: SCREEN_W } = Dimensions.get('window');
const BEAD_RING_SIZE = Math.min(SCREEN_W - 80, 280);
const BEAD_RING_R = BEAD_RING_SIZE / 2 - 10;

// Compute bead positions in a circle
function getBeadPositions(total: number, ringR: number, center: number) {
  const positions: { x: number; y: number }[] = [];
  for (let i = 0; i < total; i++) {
    const angle = (i / total) * 2 * Math.PI - Math.PI / 2;
    positions.push({
      x: center + ringR * Math.cos(angle),
      y: center + ringR * Math.sin(angle),
    });
  }
  return positions;
}

function getBeadSize(total: number): number {
  if (total <= 33) return 14;
  if (total <= 50) return 11;
  return 7;
}

export function TasbihScreen() {
  const isDark = useThemeStore(s => s.isDark);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [count, setCount] = useState(0);
  const [totalAllTime, setTotalAllTime] = useState(0);
  const [target, setTarget] = useState(33);
  const [completedRounds, setCompletedRounds] = useState(0);

  const scaleAnim  = useRef(new Animated.Value(1)).current;
  const glowAnim   = useRef(new Animated.Value(0)).current;
  const pulseAnim  = useRef(new Animated.Value(1)).current;

  const selected = ZIKR_OPTIONS[selectedIdx];
  const beadCount = target;
  const currentBead = count % target; // which bead is "active" (0-indexed)
  const rounds = Math.floor(count / target);

  useEffect(() => {
    Promise.all([
      AsyncStorage.getItem(STORAGE_KEY),
      AsyncStorage.getItem(COUNT_KEY),
      AsyncStorage.getItem(LAST_ZIKR_KEY),
      AsyncStorage.getItem(TARGET_KEY),
    ]).then(([total, savedCount, lastIdx, savedTarget]) => {
      if (total) setTotalAllTime(parseInt(total, 10));
      if (savedCount) setCount(parseInt(savedCount, 10));
      if (lastIdx) setSelectedIdx(parseInt(lastIdx, 10));
      if (savedTarget) setTarget(parseInt(savedTarget, 10));
    }).catch(() => {});
  }, []);

  // Pulse the current bead
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.3, duration: 700, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 700, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);

  const animateTap = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 0.93, duration: 70, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, tension: 280, friction: 6 }),
    ]).start();
  };

  const animateRoundComplete = () => {
    Animated.sequence([
      Animated.timing(glowAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
      Animated.timing(glowAnim, { toValue: 0, duration: 600, useNativeDriver: true }),
    ]).start();
  };

  const handleCount = () => {
    animateTap();
    Haptics.impact('medium');
    const newCount = count + 1;
    setCount(newCount);
    AsyncStorage.setItem(COUNT_KEY, String(newCount)).catch(() => {});
    const newTotal = totalAllTime + 1;
    setTotalAllTime(newTotal);
    AsyncStorage.setItem(STORAGE_KEY, String(newTotal)).catch(() => {});
    if (newCount % target === 0) {
      Haptics.success();
      animateRoundComplete();
      setCompletedRounds(r => r + 1);
    }
  };

  const handleReset = () => {
    Haptics.impact('light');
    setCount(0);
    setCompletedRounds(0);
    AsyncStorage.setItem(COUNT_KEY, '0').catch(() => {});
  };

  const handleSelectZikr = (i: number) => {
    setSelectedIdx(i);
    setCount(0);
    setCompletedRounds(0);
    const newTarget = ZIKR_OPTIONS[i].defaultTarget;
    setTarget(newTarget);
    AsyncStorage.setItem(LAST_ZIKR_KEY, String(i)).catch(() => {});
    AsyncStorage.setItem(COUNT_KEY, '0').catch(() => {});
    AsyncStorage.setItem(TARGET_KEY, String(newTarget)).catch(() => {});
  };

  const handleSetTarget = (t: number) => {
    setTarget(t);
    setCount(0);
    setCompletedRounds(0);
    AsyncStorage.setItem(TARGET_KEY, String(t)).catch(() => {});
    AsyncStorage.setItem(COUNT_KEY, '0').catch(() => {});
  };

  const bg = isDark ? darkColors.background : colors.parchment[50];
  const cardBg = isDark ? darkColors.surface : colors.white;
  const cardBorder = isDark ? darkColors.border : colors.parchment[200];
  const textPrimary = isDark ? darkColors.text.primary : colors.navy[900];
  const textSecondary = isDark ? darkColors.text.secondary : colors.parchment[700];
  const textMuted = isDark ? darkColors.text.muted : colors.parchment[500];

  const center = BEAD_RING_SIZE / 2;
  const beadSize = getBeadSize(beadCount);
  const beadPositions = getBeadPositions(beadCount, BEAD_RING_R, center);

  const glowOpacity = glowAnim.interpolate({ inputRange: [0, 0.4, 1], outputRange: [0, 0.7, 0] });

  return (
    <ScreenContainer noPadding>
      {/* Header */}
      <LinearGradient colors={['#060C1F', '#0B1330', '#162354']} style={styles.header}>
        <View style={styles.headerRow}>
          <BackButton />
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>التسبيح</Text>
            <Text style={styles.headerSub}>Tasbih Counter</Text>
          </View>
          <View style={[styles.totalBadge, { borderColor: 'rgba(255,255,255,0.12)' }]}>
            <Text style={styles.totalLabel}>ALL TIME</Text>
            <Text style={styles.totalCount}>{totalAllTime.toLocaleString()}</Text>
          </View>
        </View>
      </LinearGradient>

      {/* Zikr selector chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipRow}
        style={[styles.chipScroll, { backgroundColor: bg }]}
      >
        {ZIKR_OPTIONS.map((z, i) => {
          const active = selectedIdx === i;
          return (
            <TouchableOpacity
              key={i}
              style={[
                styles.chip,
                { backgroundColor: cardBg, borderColor: cardBorder },
                active && { backgroundColor: z.color + '20', borderColor: z.color, borderWidth: 1.5 },
              ]}
              onPress={() => handleSelectZikr(i)}
              activeOpacity={0.75}
            >
              <Text style={[
                styles.chipAr,
                { fontFamily: 'Amiri_400Regular', color: active ? z.color : textPrimary },
              ]}>
                {z.arabic.split(' ').slice(0, 2).join(' ')}
              </Text>
              <Text style={[styles.chipTranslit, { color: active ? z.color : textSecondary }]}>
                {z.transliteration.split(' ')[0]}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Main content */}
      <View style={[styles.body, { backgroundColor: bg }]}>

        {/* Zikr info card */}
        <View style={[styles.zikrCard, { backgroundColor: selected.color + '12', borderColor: selected.color + '30' }]}>
          <Text style={[styles.zikrArabic, { fontFamily: 'Amiri_400Regular', color: selected.color }]}>
            {selected.arabic}
          </Text>
          <Text style={[styles.zikrTranslit, { color: textSecondary }]}>{selected.transliteration}</Text>
          <Text style={[styles.zikrMeaning, { color: textMuted }]}>{selected.translation}</Text>
        </View>

        {/* Target preset chips */}
        <View style={styles.targetRow}>
          <Text style={[styles.targetLabel, { color: textMuted }]}>Target:</Text>
          {TARGET_PRESETS.map(t => (
            <TouchableOpacity
              key={t}
              style={[
                styles.targetChip,
                { backgroundColor: cardBg, borderColor: cardBorder },
                target === t && { backgroundColor: selected.color, borderColor: selected.color },
              ]}
              onPress={() => handleSetTarget(t)}
              activeOpacity={0.8}
            >
              <Text style={[styles.targetChipText, { color: target === t ? colors.white : textSecondary }]}>
                {t}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Tasbeh bead ring + counter button */}
        <View style={styles.ringArea}>
          {/* Completion glow */}
          <Animated.View
            style={[
              styles.completionGlow,
              { backgroundColor: selected.color, opacity: glowOpacity },
            ]}
          />

          {/* Bead ring */}
          <View style={[styles.beadRing, { width: BEAD_RING_SIZE, height: BEAD_RING_SIZE }]}>
            {beadPositions.map((pos, i) => {
              const rem = count % target;
              const isCompletedAll = rem === 0 && count > 0;
              const isActive = !isCompletedAll && i === rem - 1 && count > 0;
              const isPast = !isCompletedAll && rem > 0 && i < rem - 1;

              return isActive ? (
                <Animated.View
                  key={i}
                  style={[
                    styles.bead,
                    {
                      left: pos.x - beadSize / 2,
                      top: pos.y - beadSize / 2,
                      width: beadSize,
                      height: beadSize,
                      borderRadius: beadSize / 2,
                      backgroundColor: selected.color,
                      transform: [{ scale: pulseAnim }],
                      shadowColor: selected.color,
                      shadowOpacity: 0.8,
                      shadowRadius: 6,
                      elevation: 6,
                    },
                  ]}
                />
              ) : (
                <View
                  key={i}
                  style={[
                    styles.bead,
                    {
                      left: pos.x - beadSize / 2,
                      top: pos.y - beadSize / 2,
                      width: beadSize,
                      height: beadSize,
                      borderRadius: beadSize / 2,
                      backgroundColor: isCompletedAll
                        ? selected.color
                        : isPast
                          ? selected.color + 'CC'
                          : isDark
                            ? 'rgba(255,255,255,0.08)'
                            : 'rgba(0,0,0,0.07)',
                    },
                  ]}
                />
              );
            })}

            {/* Center tap button */}
            <Animated.View
              style={[
                styles.centerButtonWrap,
                { transform: [{ scale: scaleAnim }] },
              ]}
            >
              <TouchableOpacity
                style={[styles.centerButton, { borderColor: selected.color + '50' }]}
                onPress={handleCount}
                activeOpacity={0.85}
              >
                <LinearGradient
                  colors={[selected.color + '30', selected.color + '08', 'transparent']}
                  style={styles.centerButtonGrad}
                >
                  <Text style={[styles.countDisplay, { color: selected.color }]}>
                    {count % target === 0 && count > 0 ? target : count % target}
                  </Text>
                  <Text style={[styles.countOf, { color: textMuted }]}>/ {target}</Text>
                  {rounds > 0 && (
                    <View style={[styles.roundBadge, { backgroundColor: selected.color + '25' }]}>
                      <Text style={[styles.roundText, { color: selected.color }]}>
                        {rounds}× round{rounds !== 1 ? 's' : ''}
                      </Text>
                    </View>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>
          </View>

          {/* Tap hint */}
          <Text style={[styles.tapHint, { color: textMuted }]}>Tap bead to count</Text>
        </View>

        {/* Bottom action row */}
        <View style={styles.actionRow}>
          <View style={[styles.statsCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
            <Text style={[styles.statsNum, { color: selected.color }]}>{rounds}</Text>
            <Text style={[styles.statsLabel, { color: textMuted }]}>Rounds</Text>
          </View>
          <TouchableOpacity
            style={[styles.resetBtn, { backgroundColor: cardBg, borderColor: cardBorder }]}
            onPress={handleReset}
            activeOpacity={0.75}
          >
            <Ionicons name="refresh-outline" size={18} color={textMuted} />
            <Text style={[styles.resetText, { color: textMuted }]}>Reset</Text>
          </TouchableOpacity>
          <View style={[styles.statsCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
            <Text style={[styles.statsNum, { color: selected.color }]}>{count}</Text>
            <Text style={[styles.statsLabel, { color: textMuted }]}>Total</Text>
          </View>
        </View>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: { paddingTop: 52, paddingBottom: spacing.lg, paddingHorizontal: spacing.lg },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  headerTitle: { fontFamily: 'Amiri_400Regular', fontSize: 22, color: colors.gold[300], lineHeight: 30 },
  headerSub: { fontSize: 12, color: 'rgba(255,255,255,0.35)', marginTop: 1 },
  totalBadge: { alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.07)', borderRadius: radius.md, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderWidth: 1 },
  totalLabel: { fontSize: 8, fontWeight: '800', color: 'rgba(255,255,255,0.3)', letterSpacing: 1.5 },
  totalCount: { fontSize: 20, fontWeight: '800', color: colors.white },

  chipScroll: { flexGrow: 0, maxHeight: 80 },
  chipRow: { paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, gap: spacing.sm, alignItems: 'center' },
  chip: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: radius.md, borderWidth: 1, alignItems: 'center', minWidth: 80 },
  chipAr: { fontSize: 14, lineHeight: 22 },
  chipTranslit: { fontSize: 9, fontWeight: '700', marginTop: 1, letterSpacing: 0.3 },

  body: { flex: 1, alignItems: 'center', paddingHorizontal: spacing.lg, paddingTop: spacing.sm, paddingBottom: spacing.lg, gap: spacing.md },

  zikrCard: { width: '100%', borderRadius: radius.lg, padding: spacing.lg, borderWidth: 1, alignItems: 'center', gap: 4 },
  zikrArabic: { fontSize: 26, lineHeight: 46, textAlign: 'center' },
  zikrTranslit: { fontSize: 14, fontWeight: '700', textAlign: 'center' },
  zikrMeaning: { fontSize: 12, textAlign: 'center' },

  targetRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  targetLabel: { fontSize: 12, fontWeight: '600' },
  targetChip: { paddingHorizontal: spacing.md, paddingVertical: 6, borderRadius: radius.pill, borderWidth: 1, minWidth: 46, alignItems: 'center' },
  targetChipText: { fontSize: 13, fontWeight: '700' },

  ringArea: { alignItems: 'center', gap: spacing.sm },
  completionGlow: { position: 'absolute', width: BEAD_RING_SIZE, height: BEAD_RING_SIZE, borderRadius: BEAD_RING_SIZE / 2, alignSelf: 'center' },
  beadRing: { position: 'relative', alignItems: 'center', justifyContent: 'center' },
  bead: { position: 'absolute' },
  centerButtonWrap: { alignItems: 'center', justifyContent: 'center' },
  centerButton: {
    // Inner circle = ring diameter minus 2× bead track width (≈ 40% of radius)
    width: BEAD_RING_SIZE * 0.55,
    height: BEAD_RING_SIZE * 0.55,
    borderRadius: 9999,
    borderWidth: 2,
    overflow: 'hidden',
  },
  centerButtonGrad: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 2 },
  countDisplay: { fontSize: 52, fontWeight: '800', lineHeight: 60 },
  countOf: { fontSize: 14, fontWeight: '600' },
  roundBadge: { borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: 3, marginTop: 2 },
  roundText: { fontSize: 11, fontWeight: '700' },
  tapHint: { fontSize: 11, fontWeight: '500', letterSpacing: 0.3 },

  actionRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, width: '100%' },
  statsCard: { flex: 1, borderRadius: radius.md, padding: spacing.md, borderWidth: 1, alignItems: 'center' },
  statsNum: { fontSize: 22, fontWeight: '800' },
  statsLabel: { fontSize: 11, fontWeight: '600', marginTop: 2 },
  resetBtn: { flex: 1.2, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, borderRadius: radius.md, paddingVertical: spacing.md, borderWidth: 1 },
  resetText: { fontSize: 13, fontWeight: '600' },
});
