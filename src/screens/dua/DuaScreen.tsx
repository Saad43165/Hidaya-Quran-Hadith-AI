import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  Animated, FlatList, ScrollView, Share, StyleSheet,
  Text, TouchableOpacity, View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { BackButton } from '../../components/common/BackButton';
import { DUAS, DUA_CATEGORIES_META } from '../../data/duas';
import { useThemeStore } from '../../store/useThemeStore';
import { useThemeColors } from '../../hooks/useThemeColors';
import { colors, radius, shadow, spacing, typography } from '../../theme';

type Lang = 'en' | 'ur';

// ── Card component ─────────────────────────────────────────────────────────────

interface DuaCardProps {
  item: typeof DUAS[0];
  index: number;
  isExpanded: boolean;
  lang: Lang;
  isDark: boolean;
  surface: string;
  border: string;
  textPrimary: string;
  textSecondary: string;
  onToggle: () => void;
}

function DuaCard({
  item, index, isExpanded, lang, isDark,
  surface, border, textPrimary, textSecondary, onToggle,
}: DuaCardProps) {
  const rotateAnim = useRef(new Animated.Value(isExpanded ? 1 : 0)).current;

  const handleToggle = useCallback(() => {
    Animated.spring(rotateAnim, {
      toValue: isExpanded ? 0 : 1,
      useNativeDriver: true,
      tension: 120,
      friction: 8,
    }).start();
    onToggle();
  }, [isExpanded, onToggle, rotateAnim]);

  const rotation = rotateAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '180deg'] });

  const handleShare = async () => {
    const text = `${item.arabic}\n\n${item.transliteration}\n\n"${lang === 'ur' ? item.translationUrdu : item.translation}"\n\n— ${item.reference ?? ''}`;
    try { await Share.share({ message: text }); } catch {}
  };

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: surface, borderColor: border }]}
      onPress={handleToggle}
      onLongPress={handleShare}
      delayLongPress={500}
      activeOpacity={0.88}
    >
      {/* Card header row */}
      <View style={styles.cardHeader}>
        <View style={[styles.indexBadge, isDark && styles.indexBadgeDark]}>
          <Text style={[styles.indexText, isDark && { color: colors.gold[300] }]}>{index + 1}</Text>
        </View>
        <Text style={[styles.cardTitle, { color: textPrimary }]} numberOfLines={isExpanded ? undefined : 2}>
          {item.title}
        </Text>
        <Animated.View style={{ transform: [{ rotate: rotation }] }}>
          <Ionicons name="chevron-down" size={16} color={isDark ? 'rgba(255,255,255,0.3)' : colors.parchment[400]} />
        </Animated.View>
      </View>

      {/* Arabic — always visible */}
      <Text style={[styles.arabic, { fontFamily: 'Amiri_400Regular', color: textPrimary }]}>
        {item.arabic}
      </Text>

      {/* Expanded content */}
      {isExpanded && (
        <View style={styles.expandedBody}>
          <View style={[styles.divider, { backgroundColor: border }]} />

          {/* Transliteration */}
          <Text style={[styles.translit, { color: isDark ? 'rgba(255,255,255,0.45)' : colors.parchment[600] }]}>
            {item.transliteration}
          </Text>

          {/* Translation */}
          <View style={[styles.translationBox, {
            backgroundColor: isDark ? 'rgba(212,169,62,0.07)' : colors.gold[50],
            borderColor: isDark ? 'rgba(212,169,62,0.2)' : colors.gold[200],
          }]}>
            {lang === 'ur' ? (
              <Text style={[styles.translationUrdu, { fontFamily: 'Amiri_400Regular', color: textPrimary }]}>
                {item.translationUrdu}
              </Text>
            ) : (
              <Text style={[styles.translationEn, { color: textPrimary }]}>
                {item.translation}
              </Text>
            )}
          </View>

          {/* Reference + share */}
          <View style={styles.cardFooter}>
            {item.reference ? (
              <View style={[styles.refBadge, {
                backgroundColor: isDark ? 'rgba(212,169,62,0.1)' : colors.gold[50],
                borderColor: isDark ? 'rgba(212,169,62,0.25)' : colors.gold[200],
              }]}>
                <Ionicons name="book-outline" size={11} color={colors.gold[isDark ? 400 : 700]} />
                <Text style={[styles.refText, { color: colors.gold[isDark ? 400 : 700] }]}>{item.reference}</Text>
              </View>
            ) : <View />}
            <TouchableOpacity onPress={handleShare} style={styles.shareBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="share-outline" size={15} color={isDark ? 'rgba(255,255,255,0.3)' : colors.parchment[400]} />
            </TouchableOpacity>
          </View>
        </View>
      )}
    </TouchableOpacity>
  );
}

// ── Main screen ────────────────────────────────────────────────────────────────

export function DuaScreen() {
  const navigation = useNavigation();
  const { isDark } = useThemeColors();
  const { bg, surface, border, textPrimary, textSecondary } = useThemeColors();

  const [selectedCat, setSelectedCat] = useState(DUA_CATEGORIES_META[0].key);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [lang, setLang] = useState<Lang>('en');
  const catScrollRef = useRef<ScrollView>(null);

  const filtered = useMemo(() => DUAS.filter(d => d.category === selectedCat), [selectedCat]);
  const currentMeta = DUA_CATEGORIES_META.find(m => m.key === selectedCat)!;

  const handleCatSelect = useCallback((key: string) => {
    setSelectedCat(key);
    setExpandedId(null);
  }, []);

  const renderItem = useCallback(({ item, index }: { item: typeof DUAS[0]; index: number }) => (
    <DuaCard
      item={item}
      index={index}
      isExpanded={expandedId === item.id}
      lang={lang}
      isDark={isDark}
      surface={surface}
      border={border}
      textPrimary={textPrimary}
      textSecondary={textSecondary}
      onToggle={() => setExpandedId(prev => prev === item.id ? null : item.id)}
    />
  ), [expandedId, lang, isDark, surface, border, textPrimary, textSecondary]);

  return (
    <View style={[styles.root, { backgroundColor: bg }]}>

      {/* ── Compact Hero Header ── */}
      <LinearGradient colors={['#060C1F', '#0D1A45', '#1A2E7A']} style={styles.hero}>
        {/* Nav row */}
        <View style={styles.heroNav}>
          <BackButton />
          <View style={styles.heroTitleGroup}>
            <Text style={[styles.heroAr, { fontFamily: 'Amiri_700Bold' }]}>أَدْعِيَة</Text>
            <Text style={styles.heroEn}>Duas & Supplications</Text>
          </View>
          {/* Language toggle */}
          <View style={styles.langToggle}>
            <TouchableOpacity
              style={[styles.langBtn, lang === 'en' && styles.langBtnActive]}
              onPress={() => setLang('en')}
              activeOpacity={0.75}
            >
              <Text style={[styles.langBtnText, lang === 'en' && styles.langBtnTextActive]}>EN</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.langBtn, lang === 'ur' && styles.langBtnActive]}
              onPress={() => setLang('ur')}
              activeOpacity={0.75}
            >
              <Text style={[styles.langBtnText, lang === 'ur' && styles.langBtnTextActive]}>اردو</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Active category indicator */}
        <View style={styles.activeCatRow}>
          <Text style={styles.activeCatIcon}>{currentMeta.icon}</Text>
          <Text style={styles.activeCatLabel}>
            {lang === 'ur' ? currentMeta.labelUr : currentMeta.key}
          </Text>
          <View style={[styles.activeCatCount, { backgroundColor: 'rgba(212,169,62,0.2)' }]}>
            <Text style={styles.activeCatCountText}>{filtered.length}</Text>
          </View>
        </View>
      </LinearGradient>

      {/* ── Category pills ── */}
      <View style={[styles.pillsWrapper, { backgroundColor: isDark ? '#0A1128' : colors.navy[900] }]}>
        <ScrollView
          ref={catScrollRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.pillsRow}
        >
          {DUA_CATEGORIES_META.map(meta => {
            const active = selectedCat === meta.key;
            return (
              <TouchableOpacity
                key={meta.key}
                style={[
                  styles.pill,
                  active
                    ? styles.pillActive
                    : { backgroundColor: 'rgba(255,255,255,0.07)', borderColor: 'rgba(255,255,255,0.12)' },
                ]}
                onPress={() => handleCatSelect(meta.key)}
                activeOpacity={0.75}
              >
                <Text style={styles.pillIcon}>{meta.icon}</Text>
                <Text style={[styles.pillLabel, active && styles.pillLabelActive]}>
                  {lang === 'ur' ? meta.labelUr : meta.key.split(' ')[0]}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* ── Dua list ── */}
      <FlatList
        data={filtered}
        keyExtractor={item => item.id}
        style={{ backgroundColor: bg }}
        contentContainerStyle={styles.list}
        renderItem={renderItem}
        removeClippedSubviews
        maxToRenderPerBatch={8}
        initialNumToRender={6}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <Text style={[styles.listHint, { color: isDark ? 'rgba(255,255,255,0.25)' : colors.parchment[500] }]}>
            Long press any dua to share • Tap to expand
          </Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },

  // Hero
  hero: {
    paddingTop: 52,
    paddingBottom: spacing.md,
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  heroNav: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  heroTitleGroup: { flex: 1, gap: 1 },
  heroAr: { fontSize: 20, color: colors.gold[300], lineHeight: 28 },
  heroEn: { fontSize: 11, color: 'rgba(255,255,255,0.45)', fontWeight: '600', letterSpacing: 0.5 },
  activeCatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingTop: spacing.xs,
  },
  activeCatIcon: { fontSize: 16 },
  activeCatLabel: { flex: 1, color: colors.white, fontWeight: '700', fontSize: 15 },
  activeCatCount: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.pill,
  },
  activeCatCountText: { color: colors.gold[300], fontSize: 11, fontWeight: '700' },

  // Language toggle
  langToggle: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    padding: 2,
    gap: 2,
  },
  langBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.sm,
  },
  langBtnActive: { backgroundColor: colors.gold[400] },
  langBtnText: { fontSize: 11, fontWeight: '700', color: 'rgba(255,255,255,0.5)' },
  langBtnTextActive: { color: colors.navy[900] },

  // Category pills
  pillsWrapper: { paddingBottom: spacing.sm },
  pillsRow: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    gap: spacing.sm,
    flexDirection: 'row',
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: spacing.md,
    paddingVertical: 7,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  pillActive: {
    backgroundColor: colors.gold[400],
    borderColor: colors.gold[400],
  },
  pillIcon: { fontSize: 13 },
  pillLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.6)',
  },
  pillLabelActive: { color: colors.navy[900] },

  // List
  listHint: {
    ...typography.caption,
    textAlign: 'center',
    marginBottom: spacing.md,
    marginTop: spacing.xs,
  },
  list: { padding: spacing.lg, paddingBottom: 120, gap: spacing.md },

  // Dua card
  card: {
    borderRadius: radius.md,
    padding: spacing.lg,
    gap: spacing.md,
    borderWidth: 1,
    ...{ shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 3, elevation: 2 },
  },
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  indexBadge: {
    width: 28, height: 28, borderRadius: 8,
    backgroundColor: colors.gold[100],
    alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  indexBadgeDark: { backgroundColor: 'rgba(212,169,62,0.15)' },
  indexText: { ...typography.caption, fontWeight: '800', color: colors.gold[700] },
  cardTitle: { flex: 1, ...typography.subheading, lineHeight: 20 },
  arabic: {
    fontSize: 22,
    lineHeight: 44,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  expandedBody: { gap: spacing.md },
  divider: { height: 1 },
  translit: { ...typography.bodySmall, fontStyle: 'italic', lineHeight: 20 },
  translationBox: {
    borderRadius: radius.sm,
    borderWidth: 1,
    padding: spacing.md,
  },
  translationEn: { ...typography.body, lineHeight: 24 },
  translationUrdu: {
    fontSize: 17,
    lineHeight: 36,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  cardFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  refBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    borderRadius: radius.pill,
    borderWidth: 1,
    paddingHorizontal: spacing.sm, paddingVertical: 3,
  },
  refText: { fontSize: 11, fontWeight: '700' },
  shareBtn: { padding: 2 },
});
