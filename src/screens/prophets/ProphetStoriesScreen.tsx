import React, { useState, useCallback } from 'react';
import {
  FlatList, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { BackButton } from '../../components/common/BackButton';
import { PROPHETS, Prophet } from '../../data/prophetsData';
import { useThemeColors } from '../../hooks/useThemeColors';
import { colors, radius, shadow, spacing, typography } from '../../theme';

type Lang = 'en' | 'ur';
type Tab = 'story' | 'miracle' | 'lesson';

const ERA_FILTERS = [
  { id: 'all',        label: 'All',           labelUr: 'سب' },
  { id: 'pre-flood',  label: 'Pre-Flood',     labelUr: 'طوفان سے پہلے' },
  { id: 'post-flood', label: 'Post-Flood',    labelUr: 'طوفان کے بعد' },
  { id: 'israel',     label: "Bani Israel",   labelUr: 'بنی اسرائیل' },
  { id: 'final',      label: 'Final',         labelUr: 'آخری' },
];

function getEraGroup(p: Prophet): string {
  if (['adam', 'idris'].includes(p.id))                        return 'pre-flood';
  if (['nuh','hud','salih','ibrahim','lut','ismail','ishaq','yaqub','yusuf','shuaib'].includes(p.id)) return 'post-flood';
  if (['musa','harun','dhulkifl','dawud','sulayman','ilyas','alyasa','yunus','zakariya','yahya','isa'].includes(p.id)) return 'israel';
  return 'final';
}

export function ProphetStoriesScreen() {
  const { isDark, surface, bg, border, textPrimary, textSecondary } = useThemeColors();
  const [lang, setLang]       = useState<Lang>('en');
  const [filter, setFilter]   = useState('all');
  const [expanded, setExpanded] = useState<string | null>(null);
  const [tab, setTab]         = useState<Tab>('story');

  const isUrdu = lang === 'ur';
  const filtered = filter === 'all' ? PROPHETS : PROPHETS.filter(p => getEraGroup(p) === filter);

  const toggle = useCallback((id: string) => {
    setExpanded(prev => { if (prev === id) return null; setTab('story'); return id; });
  }, []);

  return (
    <ScreenContainer noPadding>
      {/* ── Gradient Header ── */}
      <LinearGradient colors={['#060C1F', '#1A0A2E', '#2D1254']} style={styles.header}>
        <Image source={require('../../../assets/images/islamicbackground.png')} style={styles.headerBg} resizeMode="cover" />
        <Image source={require('../../../assets/images/kalma.png')} style={styles.headerDeco} resizeMode="contain" />

        <View style={styles.headerTop}>
          <BackButton />
          <View style={styles.langToggle}>
            <TouchableOpacity style={[styles.langBtn, !isUrdu && styles.langActive]} onPress={() => setLang('en')} activeOpacity={0.8}>
              <Text style={[styles.langTxt, !isUrdu && styles.langActiveTxt]}>EN</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.langBtn, isUrdu && styles.langActive]} onPress={() => setLang('ur')} activeOpacity={0.8}>
              <Text style={[styles.langTxt, isUrdu && styles.langActiveTxt]}>اردو</Text>
            </TouchableOpacity>
          </View>
        </View>

        <Text style={[styles.headerAr, { fontFamily: 'Amiri_400Regular' }]}>قصص الأنبياء</Text>
        <Text style={styles.headerEn}>{isUrdu ? 'انبیاء کی کہانیاں' : 'Stories of the Prophets'}</Text>
        <Text style={styles.headerSub}>{isUrdu ? '۲۵ قرآنی انبیاء — اردو اور انگریزی میں' : '25 Quranic Prophets · English & Urdu'}</Text>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
          {ERA_FILTERS.map(f => (
            <TouchableOpacity
              key={f.id}
              style={[styles.chip, filter === f.id && styles.chipActive]}
              onPress={() => setFilter(f.id)}
              activeOpacity={0.8}
            >
              <Text style={[styles.chipTxt, filter === f.id && { color: colors.navy[900] }]}>
                {isUrdu ? f.labelUr : f.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </LinearGradient>

      <FlatList
        data={filtered}
        keyExtractor={p => p.id}
        contentContainerStyle={[styles.list, { backgroundColor: bg }]}
        style={{ backgroundColor: bg }}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={[styles.statsBar, { backgroundColor: surface, borderColor: border }]}>
            {[
              { n: `${PROPHETS.length}`, l: isUrdu ? 'انبیاء' : 'Prophets', c: colors.gold[400] },
              { n: '34+',               l: isUrdu ? 'سورتیں' : 'Surahs',   c: '#C084FC' },
              { n: '12+',               l: isUrdu ? 'قومیں' : 'Nations',   c: '#4ADE80' },
            ].map((s, i) => (
              <React.Fragment key={s.l}>
                {i > 0 && <View style={[styles.statDiv, { backgroundColor: border }]} />}
                <View style={styles.statItem}>
                  <Text style={[styles.statNum, { color: s.c }]}>{s.n}</Text>
                  <Text style={[styles.statLabel, { color: textSecondary }]}>{s.l}</Text>
                </View>
              </React.Fragment>
            ))}
          </View>
        }
        renderItem={({ item, index }) => {
          const isOpen = expanded === item.id;
          return (
            <View style={[styles.card, { backgroundColor: surface, borderColor: border }]}>
              <View style={[styles.accentStrip, { backgroundColor: item.color }]} />

              {/* Card header */}
              <View style={styles.cardTop}>
                <View style={[styles.numBadge, { backgroundColor: item.color + '25', borderColor: item.color + '40' }]}>
                  <Text style={[styles.numText, { color: item.color }]}>{index + 1}</Text>
                </View>
                <Text style={styles.prophetIcon}>{item.icon}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.prophetName, { color: textPrimary }, isUrdu && styles.urduTitle]}>
                    {isUrdu ? item.nameUrdu : item.name}
                  </Text>
                  <Text style={[styles.prophetArabic, { fontFamily: 'Amiri_400Regular', color: item.color }]}>
                    {item.nameArabic}
                  </Text>
                </View>
                <View style={[styles.eraBadge, { backgroundColor: item.color + '15', borderColor: item.color + '30' }]}>
                  <Text style={[styles.eraText, { color: item.color }]} numberOfLines={1}>{item.title}</Text>
                </View>
              </View>

              {/* Nation */}
              <View style={styles.metaRow}>
                <Ionicons name="people-outline" size={11} color={textSecondary} />
                <Text style={[styles.metaTxt, { color: textSecondary }]} numberOfLines={1}>
                  {isUrdu ? item.nationUr : item.nation} · {item.era}
                </Text>
              </View>

              {/* Summary */}
              <Text style={[styles.summary, { color: textSecondary }, isUrdu && styles.urduText]}>
                {isUrdu ? item.summaryUr : item.summary}
              </Text>

              {/* Expand button */}
              <TouchableOpacity
                style={[styles.expandBtn, { borderColor: item.color + '60' }]}
                onPress={() => toggle(item.id)}
                activeOpacity={0.8}
              >
                <Text style={[styles.expandBtnTxt, { color: item.color }]}>
                  {isOpen ? (isUrdu ? 'کم پڑھیں' : 'Read Less') : (isUrdu ? 'پوری کہانی' : 'Read Full Story')}
                </Text>
                <Ionicons name={isOpen ? 'chevron-up' : 'chevron-down'} size={13} color={item.color} />
              </TouchableOpacity>

              {/* Expanded body */}
              {isOpen && (
                <View style={[styles.body, { borderTopColor: border }]}>
                  {/* Tabs */}
                  <View style={styles.tabRow}>
                    {([
                      { id: 'story'  as Tab, label: isUrdu ? 'کہانی'  : 'Story',   icon: 'book-outline'     as const },
                      { id: 'miracle'as Tab, label: isUrdu ? 'معجزہ'  : 'Miracle', icon: 'sparkles-outline' as const },
                      { id: 'lesson' as Tab, label: isUrdu ? 'سبق'    : 'Lesson',  icon: 'bulb-outline'     as const },
                    ]).map(t => (
                      <TouchableOpacity
                        key={t.id}
                        style={[styles.tabBtn, tab === t.id && { borderBottomColor: item.color, borderBottomWidth: 2 }]}
                        onPress={() => setTab(t.id)}
                        activeOpacity={0.8}
                      >
                        <Ionicons name={t.icon} size={12} color={tab === t.id ? item.color : textSecondary} />
                        <Text style={[styles.tabLabel, { color: tab === t.id ? item.color : textSecondary }]}>{t.label}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  {tab === 'story' && (
                    <Text style={[styles.bodyTxt, { color: textPrimary }, isUrdu && styles.urduText]}>
                      {isUrdu ? item.storyUr : item.story}
                    </Text>
                  )}
                  {tab === 'miracle' && (
                    <View style={[styles.highlightBox, { backgroundColor: item.color + '0E', borderColor: item.color + '30', borderLeftColor: item.color }]}>
                      <Text style={[styles.highlightTitle, { color: item.color }]}>✨ {isUrdu ? 'معجزہ / نشانی' : 'Miracle / Sign'}</Text>
                      <Text style={[styles.bodyTxt, { color: textPrimary }, isUrdu && styles.urduText]}>{isUrdu ? item.miracleUr : item.miracle}</Text>
                    </View>
                  )}
                  {tab === 'lesson' && (
                    <View style={[styles.highlightBox, { backgroundColor: item.color + '0E', borderColor: item.color + '30', borderLeftColor: item.color }]}>
                      <Text style={[styles.highlightTitle, { color: item.color }]}>📚 {isUrdu ? 'زندگی کا سبق' : 'Life Lesson'}</Text>
                      <Text style={[styles.bodyTxt, { color: textPrimary }, isUrdu && styles.urduText]}>{isUrdu ? item.lessonUr : item.lesson}</Text>
                    </View>
                  )}

                  <View style={[styles.quranRef, { backgroundColor: colors.gold[400] + '10', borderColor: colors.gold[400] + '25' }]}>
                    <Ionicons name="book" size={11} color={colors.gold[400]} />
                    <Text style={[styles.quranRefTxt, { color: colors.gold[500] }]}>{item.quranSurahs}</Text>
                  </View>
                </View>
              )}
            </View>
          );
        }}
        ListFooterComponent={<View style={{ height: 40 }} />}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: { paddingTop: 52, paddingBottom: spacing.lg, paddingHorizontal: spacing.lg, overflow: 'hidden', gap: spacing.xs },
  headerBg: { position: 'absolute', right: 0, bottom: 0, width: '100%', height: '130%', opacity: 0.07 },
  headerDeco: { position: 'absolute', right: -10, bottom: 10, width: 120, height: 55, opacity: 0.08 },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.xs },
  langToggle: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: radius.pill, padding: 3, gap: 2 },
  langBtn: { paddingHorizontal: spacing.md, paddingVertical: 5, borderRadius: radius.pill },
  langActive: { backgroundColor: colors.gold[400] },
  langTxt: { fontSize: 12, fontWeight: '700', color: 'rgba(255,255,255,0.5)' },
  langActiveTxt: { color: colors.navy[900] },
  headerAr: { fontSize: 26, color: '#C084FC' },
  headerEn: { ...typography.heading, color: colors.white },
  headerSub: { fontSize: 12, color: 'rgba(255,255,255,0.4)', fontWeight: '500' },
  chips: { paddingTop: spacing.sm, gap: spacing.xs },
  chip: { paddingHorizontal: spacing.md, paddingVertical: 7, borderRadius: radius.pill, backgroundColor: 'rgba(255,255,255,0.07)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)' },
  chipActive: { backgroundColor: colors.gold[400], borderColor: colors.gold[400] },
  chipTxt: { fontSize: 12, fontWeight: '700', color: 'rgba(255,255,255,0.6)' },

  list: { paddingHorizontal: spacing.lg, paddingTop: spacing.xs, gap: spacing.md },
  statsBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', borderRadius: radius.lg, padding: spacing.md, borderWidth: 0.5, marginTop: spacing.md, marginBottom: spacing.sm },
  statItem: { alignItems: 'center', flex: 1 },
  statNum: { fontSize: 20, fontWeight: '800' },
  statLabel: { fontSize: 11, fontWeight: '600', marginTop: 2 },
  statDiv: { width: 1, height: 28 },

  card: { borderRadius: radius.lg, padding: spacing.lg, gap: spacing.sm, borderWidth: 0.5, ...shadow.sm, overflow: 'hidden' },
  accentStrip: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, borderTopLeftRadius: radius.lg, borderBottomLeftRadius: radius.lg },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  numBadge: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  numText: { fontSize: 12, fontWeight: '800' },
  prophetIcon: { fontSize: 24 },
  prophetName: { ...typography.bodyMedium, fontWeight: '700' },
  prophetArabic: { fontSize: 16, lineHeight: 26 },
  eraBadge: { borderRadius: radius.pill, paddingHorizontal: spacing.sm, paddingVertical: 3, borderWidth: 1 },
  eraText: { fontSize: 10, fontWeight: '700' },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaTxt: { fontSize: 11 },
  summary: { ...typography.body, lineHeight: 22 },

  expandBtn: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, alignSelf: 'flex-start', borderWidth: 1, borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: 5, marginTop: spacing.xs },
  expandBtnTxt: { fontSize: 12, fontWeight: '700' },

  body: { borderTopWidth: 1, paddingTop: spacing.md, gap: spacing.md, marginTop: spacing.xs },
  tabRow: { flexDirection: 'row', gap: spacing.xs },
  tabBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 7, paddingHorizontal: spacing.sm, borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabLabel: { fontSize: 12, fontWeight: '700' },
  bodyTxt: { ...typography.body, lineHeight: 26 },
  highlightBox: { borderLeftWidth: 3, borderWidth: 1, borderRadius: radius.sm, padding: spacing.md, gap: spacing.xs },
  highlightTitle: { fontSize: 11, fontWeight: '800', letterSpacing: 0.5, marginBottom: 4 },
  quranRef: { flexDirection: 'row', alignItems: 'flex-start', gap: 6, borderRadius: radius.sm, padding: spacing.sm, borderWidth: 1 },
  quranRefTxt: { fontSize: 11, fontWeight: '600', flex: 1, lineHeight: 18 },

  urduText: { textAlign: 'right', fontFamily: 'Amiri_400Regular', fontSize: 15, lineHeight: 28 },
  urduTitle: { textAlign: 'right', fontFamily: 'Amiri_400Regular' },
});
