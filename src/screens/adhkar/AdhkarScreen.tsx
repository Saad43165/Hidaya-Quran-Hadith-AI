import React, { useRef, useState } from 'react';
import {
  Animated, FlatList, Image, ScrollView, StyleSheet,
  Text, TouchableOpacity, View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { BackButton } from '../../components/common/BackButton';
import { ADHKAR_SECTIONS, AdhkarItem } from '../../data/adhkar';
import { useThemeColors } from '../../hooks/useThemeColors';
import { colors, radius, shadow, spacing, typography } from '../../theme';

const TIME_ICONS: Record<string, string> = {
  morning: '☀️',
  evening: '🌙',
  afterPrayer: '🤲',
  sleep: '💤',
  general: '📿',
};

export function AdhkarScreen() {
  const navigation = useNavigation();
  const { isDark, surface, bg, border, textPrimary, textSecondary } = useThemeColors();
  const [activeSection, setActiveSection] = useState(ADHKAR_SECTIONS[0].id);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [done, setDone] = useState<Record<string, boolean>>({});

  const section = ADHKAR_SECTIONS.find(s => s.id === activeSection)!;

  const increment = (itemId: string, target: number) => {
    setCounts(prev => {
      const next = (prev[itemId] ?? 0) + 1;
      if (next >= target) {
        setDone(d => ({ ...d, [itemId]: true }));
        return { ...prev, [itemId]: next };
      }
      return { ...prev, [itemId]: next };
    });
  };

  const reset = (itemId: string) => {
    setCounts(prev => ({ ...prev, [itemId]: 0 }));
    setDone(prev => ({ ...prev, [itemId]: false }));
  };

  const completedAll = section.items.every(item => done[item.id]);

  return (
    <ScreenContainer noPadding>
      {/* Header */}
      <LinearGradient colors={['#060C1F', '#0B1330', '#162354']} style={styles.header}>
        <Image source={require('../../../assets/images/islamicbackground.png')} style={styles.headerBg} resizeMode="cover" />
        <Image source={require('../../../assets/images/adhkar.png')} style={styles.headerBeads} resizeMode="contain" />

        <View style={styles.headerTop}>
          <BackButton />
          <View style={{ flex: 1 }} />
        </View>

        <Text style={[styles.headerAr, { fontFamily: 'Amiri_400Regular' }]}>الأذكار</Text>
        <Text style={styles.headerEn}>Daily Remembrances</Text>
        <Text style={styles.headerSub}>From Hisnul Muslim · Fortress of the Muslim</Text>

        {/* Section tabs */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsRow}>
          {ADHKAR_SECTIONS.map(sec => (
            <TouchableOpacity
              key={sec.id}
              style={[styles.tabChip, activeSection === sec.id && { backgroundColor: sec.color, borderColor: sec.color }]}
              onPress={() => { setActiveSection(sec.id); }}
              activeOpacity={0.8}
            >
              <Text style={styles.tabChipEmoji}>{TIME_ICONS[sec.time]}</Text>
              <Text style={[styles.tabChipLabel, activeSection === sec.id && { color: colors.navy[900] }]}>{sec.title}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </LinearGradient>

      {/* Progress bar */}
      <View style={[styles.progressRow, { backgroundColor: isDark ? '#111827' : colors.parchment[100] }]}>
        <View style={styles.progressLeft}>
          <Text style={[styles.progressLabel, { color: textSecondary }]}>
            {section.items.filter(i => done[i.id]).length} / {section.items.length} completed
          </Text>
        </View>
        {completedAll && (
          <View style={[styles.completedBadge, { backgroundColor: section.color + '22', borderColor: section.color + '44' }]}>
            <Ionicons name="checkmark-circle" size={13} color={section.color} />
            <Text style={[styles.completedText, { color: section.color }]}>All Done!</Text>
          </View>
        )}
      </View>

      {/* Adhkar list */}
      <FlatList
        data={section.items}
        keyExtractor={item => item.id}
        contentContainerStyle={[styles.list, { backgroundColor: bg }]}
        style={{ backgroundColor: bg }}
        renderItem={({ item, index }) => (
          <AdhkarCard
            item={item}
            index={index}
            count={counts[item.id] ?? 0}
            isDone={done[item.id] ?? false}
            accentColor={section.color}
            isDark={isDark}
            surface={surface}
            textPrimary={textPrimary}
            textSecondary={textSecondary}
            border={border}
            onIncrement={() => increment(item.id, item.count)}
            onReset={() => reset(item.id)}
          />
        )}
        ListFooterComponent={<View style={{ height: spacing.xxxl }} />}
      />
    </ScreenContainer>
  );
}

function AdhkarCard({ item, index, count, isDone, accentColor, isDark, surface, textPrimary, textSecondary, border, onIncrement, onReset }: {
  item: AdhkarItem; index: number; count: number; isDone: boolean;
  accentColor: string; isDark: boolean; surface: string;
  textPrimary: string; textSecondary: string; border: string;
  onIncrement: () => void; onReset: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePress = () => {
    if (!isDone) {
      Animated.sequence([
        Animated.timing(scaleAnim, { toValue: 0.96, duration: 80, useNativeDriver: true }),
        Animated.timing(scaleAnim, { toValue: 1, duration: 100, useNativeDriver: true }),
      ]).start();
      onIncrement();
    }
  };

  const progress = Math.min(count / item.count, 1);

  return (
    <Animated.View style={[styles.card, { backgroundColor: surface, transform: [{ scale: scaleAnim }], borderColor: isDone ? accentColor + '40' : border, borderWidth: isDone ? 1.5 : 0.5 }]}>
      {/* Counter badge */}
      <View style={styles.cardTop}>
        <View style={[styles.indexBadge, { backgroundColor: accentColor + '18' }]}>
          <Text style={[styles.indexText, { color: accentColor }]}>{index + 1}</Text>
        </View>
        <View style={{ flex: 1 }} />
        {/* Count indicator */}
        <TouchableOpacity onPress={() => setExpanded(e => !e)} style={styles.expandBtn} activeOpacity={0.7}>
          <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={14} color={textSecondary} />
        </TouchableOpacity>
      </View>

      {/* Arabic text */}
      <Text style={[styles.arabic, { fontFamily: 'Amiri_400Regular', color: textPrimary }]}>{item.arabic}</Text>

      {/* Progress bar if count > 1 */}
      {item.count > 1 && (
        <View style={[styles.progressBar, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : colors.parchment[100] }]}>
          <View style={[styles.progressFill, { width: `${progress * 100}%`, backgroundColor: isDone ? accentColor : accentColor + 'AA' }]} />
        </View>
      )}

      {/* Expanded: transliteration + translation + reference */}
      {expanded && (
        <View style={[styles.expandedBody, { borderTopColor: border }]}>
          <Text style={[styles.translit, { color: textSecondary }]}>{item.transliteration}</Text>
          <Text style={[styles.translation, { color: textPrimary }]}>{item.translation}</Text>
          {item.benefits && (
            <View style={[styles.benefitBox, { backgroundColor: accentColor + '12', borderColor: accentColor + '30' }]}>
              <Ionicons name="star" size={11} color={accentColor} />
              <Text style={[styles.benefitText, { color: accentColor }]}>{item.benefits}</Text>
            </View>
          )}
          <View style={styles.refRow}>
            <Ionicons name="book-outline" size={11} color={textSecondary} />
            <Text style={[styles.refText, { color: textSecondary }]}>{item.reference}</Text>
          </View>
        </View>
      )}

      {/* Counter button row */}
      <View style={styles.counterRow}>
        <View style={[styles.countBadge, { backgroundColor: isDone ? accentColor + '20' : (isDark ? 'rgba(255,255,255,0.07)' : colors.parchment[100]) }]}>
          <Text style={[styles.countText, { color: isDone ? accentColor : textSecondary }]}>
            {count} / {item.count}
          </Text>
        </View>
        <View style={styles.counterBtns}>
          {count > 0 && (
            <TouchableOpacity onPress={onReset} style={styles.resetBtn} activeOpacity={0.7}>
              <Ionicons name="refresh-outline" size={14} color={textSecondary} />
            </TouchableOpacity>
          )}
          <TouchableOpacity
            onPress={handlePress}
            activeOpacity={0.8}
            style={[styles.countBtn, { backgroundColor: isDone ? accentColor + '20' : accentColor, opacity: isDone ? 0.6 : 1 }]}
          >
            {isDone
              ? <Ionicons name="checkmark" size={18} color={accentColor} />
              : <Text style={styles.countBtnText}>+1</Text>
            }
          </TouchableOpacity>
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  header: { paddingTop: 52, paddingBottom: spacing.lg, paddingHorizontal: spacing.lg, overflow: 'hidden', gap: spacing.xs },
  headerBg: { position: 'absolute', right: 0, bottom: 0, width: '100%', height: '130%', opacity: 0.08 },
  headerBeads: { position: 'absolute', right: -5, top: spacing.xl + spacing.xl, width: 80, height: 80, opacity: 0.25 },
  headerTop: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.xs },
  backBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  headerAr: { fontSize: 28, color: colors.gold[300], textAlign: 'center' },
  headerEn: { ...typography.heading, color: colors.white, textAlign: 'center' },
  headerSub: { fontSize: 11, color: 'rgba(255,255,255,0.35)', textAlign: 'center', fontWeight: '500' },
  tabsRow: { paddingTop: spacing.sm, gap: spacing.xs },
  tabChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: spacing.md, paddingVertical: 7,
    borderRadius: radius.pill, borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    backgroundColor: 'rgba(255,255,255,0.07)',
  },
  tabChipEmoji: { fontSize: 12 },
  tabChipLabel: { fontSize: 12, fontWeight: '700', color: 'rgba(255,255,255,0.6)' },

  progressRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingVertical: spacing.sm },
  progressLeft: {},
  progressLabel: { fontSize: 12, fontWeight: '600' },
  completedBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: radius.pill, paddingHorizontal: spacing.sm, paddingVertical: 3, borderWidth: 1 },
  completedText: { fontSize: 11, fontWeight: '700' },

  list: { paddingHorizontal: spacing.lg, paddingTop: spacing.md, gap: spacing.md },

  card: { borderRadius: radius.md, padding: spacing.lg, gap: spacing.md, ...shadow.sm },
  cardTop: { flexDirection: 'row', alignItems: 'center' },
  indexBadge: { width: 28, height: 28, borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center' },
  indexText: { fontSize: 12, fontWeight: '800' },
  expandBtn: { padding: 4 },

  arabic: { fontSize: 22, lineHeight: 44, textAlign: 'right', writingDirection: 'rtl' },

  progressBar: { height: 3, borderRadius: 2, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 2 },

  expandedBody: { borderTopWidth: 1, paddingTop: spacing.md, gap: spacing.sm },
  translit: { fontSize: 13, fontStyle: 'italic', lineHeight: 20 },
  translation: { ...typography.body, lineHeight: 24 },
  benefitBox: { flexDirection: 'row', alignItems: 'flex-start', gap: 6, borderRadius: radius.sm, padding: spacing.sm, borderWidth: 1 },
  benefitText: { fontSize: 12, flex: 1, lineHeight: 18, fontWeight: '500' },
  refRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  refText: { fontSize: 11, fontWeight: '600' },

  counterRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  countBadge: { borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: 4 },
  countText: { fontSize: 13, fontWeight: '800' },
  counterBtns: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  resetBtn: { padding: 6 },
  countBtn: { width: 48, height: 36, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
  countBtnText: { color: colors.white, fontSize: 16, fontWeight: '800' },
});
