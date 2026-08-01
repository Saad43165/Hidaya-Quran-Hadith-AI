import React, { useEffect, useRef, useState } from 'react';
import {
  Alert, Animated, ScrollView, StyleSheet, Text,
  TextInput, TouchableOpacity, View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Haptics } from '../../services/haptics';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { colors, gradients, radius, shadow, spacing, typography } from '../../theme';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';

interface ZikrOption {
  arabic: string;
  transliteration: string;
  translation: string;
  target: number;
  color: string;
}

const ZIKR_OPTIONS: ZikrOption[] = [
  { arabic: 'سُبْحَانَ اللَّهِ',  transliteration: 'SubhanAllah',  translation: 'Glory be to Allah',       target: 33,  color: '#2E7D5B' },
  { arabic: 'الْحَمْدُ لِلَّهِ',  transliteration: 'Alhamdulillah', translation: 'All praise is to Allah',   target: 33,  color: '#1E6B80' },
  { arabic: 'اللَّهُ أَكْبَرُ',   transliteration: 'Allahu Akbar',  translation: 'Allah is the Greatest',   target: 34,  color: '#6B4E8A' },
  { arabic: 'لَا إِلَٰهَ إِلَّا اللَّهُ', transliteration: 'La ilaha illAllah', translation: 'There is no god but Allah', target: 100, color: '#8A4B1A' },
  { arabic: 'أَسْتَغْفِرُ اللَّهَ', transliteration: 'Astaghfirullah', translation: 'I seek forgiveness of Allah', target: 100, color: '#9A6F14' },
  { arabic: 'صَلِّ عَلَى النَّبِيِّ', transliteration: 'Salawat',     translation: 'Blessings on the Prophet',  target: 100, color: '#1E4A80' },
  { arabic: 'حَسْبُنَا اللَّهُ',  transliteration: 'HasbunAllah',  translation: 'Allah is sufficient for us', target: 100, color: '#5A3A7A' },
];

const STORAGE_KEY      = 'kitaabai.tasbih.total';
const LAST_ZIKR_KEY    = 'kitaabai.tasbih.lastZikr';
const CUSTOM_TARGET_KEY = 'kitaabai.tasbih.customTarget';

export function TasbihScreen() {
  const navigation = useNavigation();
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [count, setCount] = useState(0);
  const [totalAllTime, setTotalAllTime] = useState(0);
  const [customTarget, setCustomTarget] = useState<number | null>(null);
  const [editingTarget, setEditingTarget] = useState(false);
  const [targetInput, setTargetInput] = useState('');
  const [completedOnce, setCompletedOnce] = useState(false);
  const scaleAnim  = useRef(new Animated.Value(1)).current;
  const rippleAnim = useRef(new Animated.Value(0)).current;
  const glowAnim   = useRef(new Animated.Value(0)).current;

  const selected = ZIKR_OPTIONS[selectedIdx];
  const effectiveTarget = customTarget ?? selected.target;
  const progress  = Math.min(count / effectiveTarget, 1);
  const laps      = Math.floor(count / effectiveTarget);
  const remainder = count % effectiveTarget;

  useEffect(() => {
    Promise.all([
      AsyncStorage.getItem(STORAGE_KEY),
      AsyncStorage.getItem(LAST_ZIKR_KEY),
      AsyncStorage.getItem(CUSTOM_TARGET_KEY),
    ]).then(([total, lastIdx, target]) => {
      if (total) setTotalAllTime(parseInt(total, 10));
      if (lastIdx) setSelectedIdx(parseInt(lastIdx, 10));
      if (target) setCustomTarget(parseInt(target, 10));
    }).catch(() => {});
  }, []);

  const animateTap = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 0.92, duration: 60, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, tension: 300, friction: 7 }),
    ]).start();
    Animated.sequence([
      Animated.timing(rippleAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.timing(rippleAnim, { toValue: 0, duration: 0, useNativeDriver: true }),
    ]).start();
  };

  const animateCompletion = () => {
    Animated.sequence([
      Animated.timing(glowAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
      Animated.timing(glowAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
    ]).start();
  };

  const handleCount = () => {
    animateTap();
    Haptics.impact('medium');
    const newCount = count + 1;
    setCount(newCount);
    const newTotal = totalAllTime + 1;
    setTotalAllTime(newTotal);
    AsyncStorage.setItem(STORAGE_KEY, String(newTotal)).catch(() => {});
    if (newCount % effectiveTarget === 0) {
      Haptics.success();
      animateCompletion();
      setCompletedOnce(true);
    }
  };

  const handleLongPress = () => {
    if (count <= 0) return;
    Haptics.impact('light');
    setCount(c => Math.max(0, c - 1));
    const newTotal = Math.max(0, totalAllTime - 1);
    setTotalAllTime(newTotal);
    AsyncStorage.setItem(STORAGE_KEY, String(newTotal)).catch(() => {});
  };

  const handleReset = () => {
    Haptics.impact('light');
    setCount(0);
    setCompletedOnce(false);
  };

  const handleSelectZikr = (i: number) => {
    setSelectedIdx(i);
    setCount(0);
    setCompletedOnce(false);
    setCustomTarget(null);
    AsyncStorage.setItem(LAST_ZIKR_KEY, String(i)).catch(() => {});
    AsyncStorage.removeItem(CUSTOM_TARGET_KEY).catch(() => {});
  };

  const handleSetCustomTarget = () => {
    const n = parseInt(targetInput, 10);
    if (!isNaN(n) && n > 0) {
      setCustomTarget(n);
      setCount(0);
      AsyncStorage.setItem(CUSTOM_TARGET_KEY, String(n)).catch(() => {});
    }
    setEditingTarget(false);
  };

  const rippleScale   = rippleAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 2.2] });
  const rippleOpacity = rippleAnim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.3, 0.1, 0] });
  const glowOpacity   = glowAnim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, 0.6, 0] });

  return (
    <ScreenContainer noPadding>
      <LinearGradient colors={gradients.heroNavy} style={styles.header}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.xs }}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 4 }}>
            <Ionicons name="arrow-back" size={24} color={colors.white} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Tasbih Counter</Text>
        </View>
        <Text style={styles.headerSub}>Total: {totalAllTime.toLocaleString()} dhikr</Text>
      </LinearGradient>

      <ScrollView horizontal showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.selectorRow} style={styles.selectorScroll}>
        {ZIKR_OPTIONS.map((z, i) => (
          <TouchableOpacity
            key={i}
            style={[styles.selectorChip, selectedIdx === i && { backgroundColor: z.color }]}
            onPress={() => handleSelectZikr(i)}
          >
            <Text style={[styles.selectorTranslit, selectedIdx === i && styles.selectorTranslitActive]}>
              {z.transliteration}
            </Text>
            <Text style={[styles.selectorTarget, selectedIdx === i && { color: 'rgba(255,255,255,0.6)' }]}>
              ×{z.target}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View style={styles.counterArea}>
        <View style={styles.zikrTextCard}>
          <Text style={[styles.zikrArabic, { fontFamily: 'Amiri_400Regular', color: selected.color }]}>
            {selected.arabic}
          </Text>
          <Text style={styles.zikrTranslit}>{selected.transliteration}</Text>
          <Text style={styles.zikrTranslation}>{selected.translation}</Text>

          {/* Custom target row */}
          <View style={styles.targetRow}>
            {editingTarget ? (
              <View style={styles.targetInputRow}>
                <TextInput
                  style={styles.targetInput}
                  value={targetInput}
                  onChangeText={setTargetInput}
                  keyboardType="number-pad"
                  placeholder="Enter target"
                  placeholderTextColor={colors.parchment[400]}
                  autoFocus
                  onSubmitEditing={handleSetCustomTarget}
                />
                <TouchableOpacity onPress={handleSetCustomTarget} style={styles.targetConfirmBtn}>
                  <Ionicons name="checkmark" size={16} color={colors.white} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setEditingTarget(false)}>
                  <Ionicons name="close" size={16} color={colors.parchment[400]} />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.targetBtn}
                onPress={() => { setTargetInput(String(effectiveTarget)); setEditingTarget(true); }}
              >
                <Ionicons name="options-outline" size={13} color={colors.parchment[500]} />
                <Text style={styles.targetBtnText}>
                  Target: {effectiveTarget}{customTarget ? ' (custom)' : ''}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Completion glow */}
        {completedOnce && (
          <Animated.View style={[styles.completionGlow, { backgroundColor: selected.color, opacity: glowOpacity }]} />
        )}

        <View style={styles.circleWrap}>
          <Animated.View style={[
            styles.ripple,
            { borderColor: selected.color, transform: [{ scale: rippleScale }], opacity: rippleOpacity }
          ]} />
          <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
            <TouchableOpacity
              style={[styles.counterBtn, { borderColor: selected.color }]}
              onPress={handleCount}
              onLongPress={handleLongPress}
              delayLongPress={400}
              activeOpacity={1}
            >
              <LinearGradient colors={[selected.color + '30', selected.color + '10']} style={styles.counterBtnGrad}>
                <Text style={[styles.countNumber, { color: selected.color }]}>
                  {remainder || (laps > 0 ? effectiveTarget : 0)}
                </Text>
                {laps > 0 && <Text style={styles.lapText}>{laps} × {effectiveTarget}</Text>}
                <Text style={styles.tapHint}>tap · hold −1</Text>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        </View>

        <View style={styles.progressWrap}>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${progress * 100}%`, backgroundColor: selected.color }]} />
          </View>
          <Text style={styles.progressText}>{remainder} / {effectiveTarget}</Text>
        </View>

        <View style={styles.controls}>
          <TouchableOpacity style={styles.resetBtn} onPress={handleReset}>
            <Ionicons name="refresh" size={20} color={colors.parchment[500]} />
            <Text style={styles.resetText}>Reset</Text>
          </TouchableOpacity>
          <View style={styles.totalBadge}>
            <Text style={styles.totalLabel}>SESSION</Text>
            <Text style={styles.totalCount}>{count.toLocaleString()}</Text>
          </View>
        </View>
      </View>
    </ScreenContainer>
  );
}

const BTN_SIZE = 200;

const styles = StyleSheet.create({
  header: { paddingTop: spacing.lg, paddingBottom: spacing.xl, paddingHorizontal: spacing.xl, gap: spacing.xs },
  headerTitle: { ...typography.displayMd, color: colors.white },
  headerSub: { ...typography.caption, color: 'rgba(255,255,255,0.4)' },
  selectorScroll: { maxHeight: 72, flexGrow: 0 },
  selectorRow: { paddingHorizontal: spacing.lg, paddingVertical: spacing.md, gap: spacing.sm },
  selectorChip: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: radius.md, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.parchment[200], alignItems: 'center', minWidth: 90, ...shadow.sm },
  selectorTranslit: { ...typography.caption, color: colors.navy[800], fontWeight: '700' },
  selectorTranslitActive: { color: colors.white },
  selectorTarget: { fontSize: 10, color: colors.parchment[500] },
  counterArea: { flex: 1, alignItems: 'center', justifyContent: 'space-evenly', paddingHorizontal: spacing.xl, paddingBottom: spacing.xl },
  zikrTextCard: { alignItems: 'center', gap: spacing.xs, backgroundColor: colors.white, borderRadius: radius.lg, paddingHorizontal: spacing.xl, paddingVertical: spacing.lg, width: '100%', ...shadow.sm },
  zikrArabic: { fontSize: 28, lineHeight: 52, textAlign: 'center' },
  zikrTranslit: { ...typography.subheading, color: colors.parchment[700] },
  zikrTranslation: { ...typography.bodySmall, color: colors.parchment[500], textAlign: 'center' },
  targetRow: { marginTop: spacing.sm },
  targetBtn: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, paddingVertical: 4, paddingHorizontal: spacing.sm },
  targetBtnText: { fontSize: 11, color: colors.parchment[500] },
  targetInputRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  targetInput: { backgroundColor: colors.parchment[100], borderRadius: radius.sm, paddingHorizontal: spacing.sm, paddingVertical: 4, fontSize: 13, color: colors.navy[900], minWidth: 80 },
  targetConfirmBtn: { backgroundColor: colors.navy[800], borderRadius: radius.sm, padding: 6 },
  completionGlow: { position: 'absolute', width: 300, height: 300, borderRadius: 150, alignSelf: 'center' },
  circleWrap: { alignItems: 'center', justifyContent: 'center', width: BTN_SIZE + 80, height: BTN_SIZE + 80 },
  ripple: { position: 'absolute', width: BTN_SIZE, height: BTN_SIZE, borderRadius: BTN_SIZE / 2, borderWidth: 2 },
  counterBtn: { width: BTN_SIZE, height: BTN_SIZE, borderRadius: BTN_SIZE / 2, borderWidth: 3, overflow: 'hidden', ...shadow.gold },
  counterBtnGrad: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.xs },
  countNumber: { fontSize: 56, fontWeight: '800', lineHeight: 64 },
  lapText: { ...typography.bodySmall, color: colors.parchment[500] },
  tapHint: { ...typography.label, color: colors.parchment[400], fontSize: 10 },
  progressWrap: { width: '100%', gap: spacing.xs },
  progressTrack: { height: 6, backgroundColor: colors.parchment[200], borderRadius: radius.pill, overflow: 'hidden' },
  progressFill: { height: 6, borderRadius: radius.pill },
  progressText: { ...typography.caption, color: colors.parchment[500], textAlign: 'center' },
  controls: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%' },
  resetBtn: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, backgroundColor: colors.white, borderRadius: radius.md, paddingHorizontal: spacing.lg, paddingVertical: spacing.md, ...shadow.sm },
  resetText: { ...typography.bodySmall, color: colors.parchment[500], fontWeight: '600' },
  totalBadge: { alignItems: 'center', backgroundColor: colors.navy[900], borderRadius: radius.md, paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  totalLabel: { ...typography.label, color: colors.gold[500], fontSize: 9 },
  totalCount: { ...typography.heading, color: colors.white },
});
