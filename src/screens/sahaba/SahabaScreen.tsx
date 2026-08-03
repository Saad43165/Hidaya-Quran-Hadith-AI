import React, { useState, useMemo, useCallback } from 'react';
import { FlatList, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { BackButton } from '../../components/common/BackButton';
import { SAHABA, SAHABA_CATEGORIES, Sahabi } from '../../data/sahabaData';
import { useThemeColors } from '../../hooks/useThemeColors';
import { colors, radius, shadow, spacing, typography } from '../../theme';

type Lang = 'en' | 'ur';
type Tab = 'bio' | 'hadith' | 'lesson';

export function SahabaScreen() {
  const { isDark, surface, bg, border, textPrimary, textSecondary } = useThemeColors();
  const [lang, setLang]         = useState<Lang>('en');
  const [filterCat, setFilterCat] = useState('all');
  const [expanded, setExpanded] = useState<string | null>(null);
  const [tab, setTab]           = useState<Tab>('bio');

  const isUrdu = lang === 'ur';
  const filtered = useMemo(
    () => filterCat === 'all' ? SAHABA : SAHABA.filter(s => s.category === filterCat),
    [filterCat],
  );

  const toggle = useCallback((id: string) => {
    setExpanded(prev => { if (prev === id) return null; setTab('bio'); return id; });
  }, []);

  return (
    <ScreenContainer noPadding>
      {/* ── Gradient Header ── */}
      <LinearGradient colors={['#060C1F', '#1A1002', '#2E2008']} style={styles.header}>
        <Image source={require('../../../assets/images/islamicbackground.png')} style={styles.headerBg} resizeMode="cover" />
        <Image source={require('../../../assets/images/masjid.png')} style={styles.headerDeco} resizeMode="contain" />

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

        <Text style={[styles.headerAr, { fontFamily: 'Amiri_400Regular' }]}>الصحابة الكرام</Text>
        <Text style={styles.headerEn}>{isUrdu ? 'صحابہ کرام' : 'Companions of the Prophet ﷺ'}</Text>
        <Text style={styles.headerSub}>{isUrdu ? 'نبی ﷺ کے عظیم صحابہ کی زندگیاں' : 'Lives of the Noble Companions · EN & Urdu'}</Text>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
          <TouchableOpacity
            style={[styles.chip, filterCat === 'all' && styles.chipActive]}
            onPress={() => setFilterCat('all')}
            activeOpacity={0.8}
          >
            <Text style={[styles.chipTxt, filterCat === 'all' && { color: colors.navy[900] }]}>
              {isUrdu ? 'سب' : 'All'}
            </Text>
          </TouchableOpacity>
          {SAHABA_CATEGORIES.map(cat => (
            <TouchableOpacity
              key={cat.id}
              style={[styles.chip, filterCat === cat.id && styles.chipActive, filterCat === cat.id && { backgroundColor: cat.color }]}
              onPress={() => setFilterCat(filterCat === cat.id ? 'all' : cat.id)}
              activeOpacity={0.8}
            >
              <Text style={styles.chipIcon}>{cat.icon}</Text>
              <Text style={[styles.chipTxt, filterCat === cat.id && { color: '#FFF' }]}>
                {isUrdu ? cat.labelUr : cat.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </LinearGradient>

      <FlatList
        data={filtered}
        keyExtractor={s => s.id}
        contentContainerStyle={[styles.list, { backgroundColor: bg }]}
        style={{ backgroundColor: bg }}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={[styles.statsBar, { backgroundColor: surface, borderColor: border }]}>
            {[
              { n: `${SAHABA.length}`,                   l: isUrdu ? 'صحابہ' : 'Companions',  c: colors.gold[400] },
              { n: `${SAHABA_CATEGORIES.length}`,         l: isUrdu ? 'درجے' : 'Categories',   c: '#4ADE80' },
              { n: '2',                                   l: isUrdu ? 'زبانیں' : 'Languages',  c: '#C084FC' },
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
        renderItem={({ item }: { item: Sahabi }) => {
          const isOpen = expanded === item.id;
          const cat = SAHABA_CATEGORIES.find(c => c.id === item.category);
          return (
            <View style={[styles.card, { backgroundColor: surface, borderColor: border }]}>
              <View style={[styles.accentStrip, { backgroundColor: item.color }]} />

              {/* Card header */}
              <TouchableOpacity style={styles.cardTop} onPress={() => toggle(item.id)} activeOpacity={0.8}>
                <View style={[styles.avatar, { backgroundColor: item.color + '22' }]}>
                  <Text style={styles.avatarIcon}>{item.icon}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.sahabaName, { color: textPrimary }, isUrdu && styles.urduTitle]}>
                    {isUrdu ? item.nameUrdu : item.name}
                  </Text>
                  <Text style={[styles.sahabaArabic, { fontFamily: 'Amiri_400Regular', color: item.color }]}>
                    {item.nameArabic}
                  </Text>
                  <Text style={[styles.sahabaTitle, { color: textSecondary }]} numberOfLines={1}>
                    {isUrdu ? item.titleUr : item.title}
                  </Text>
                </View>
                <View style={styles.headerRight}>
                  {cat && (
                    <View style={[styles.catBadge, { backgroundColor: cat.color + '20', borderColor: cat.color + '30' }]}>
                      <Text style={styles.catBadgeIcon}>{cat.icon}</Text>
                    </View>
                  )}
                  <Ionicons name={isOpen ? 'chevron-up' : 'chevron-down'} size={15} color={textSecondary} />
                </View>
              </TouchableOpacity>

              {/* Era + tribe */}
              <View style={styles.metaRow}>
                <Ionicons name="time-outline" size={11} color={textSecondary} />
                <Text style={[styles.metaTxt, { color: textSecondary }]}>{item.era}</Text>
                <Text style={[styles.metaDot, { color: textSecondary }]}>·</Text>
                <Ionicons name="people-outline" size={11} color={textSecondary} />
                <Text style={[styles.metaTxt, { color: textSecondary }]}>{isUrdu ? item.tribeUr : item.tribe}</Text>
              </View>

              {/* Expanded */}
              {isOpen && (
                <View style={[styles.body, { borderTopColor: border }]}>
                  <View style={styles.tabRow}>
                    {([
                      { id: 'bio'    as Tab, label: isUrdu ? 'سوانح' : 'Biography' },
                      { id: 'hadith' as Tab, label: isUrdu ? 'حدیث'  : 'Hadith'    },
                      { id: 'lesson' as Tab, label: isUrdu ? 'سبق'   : 'Lesson'    },
                    ]).map(t => (
                      <TouchableOpacity
                        key={t.id}
                        style={[styles.tabBtn, tab === t.id && { borderBottomColor: item.color, borderBottomWidth: 2 }]}
                        onPress={() => setTab(t.id)}
                        activeOpacity={0.8}
                      >
                        <Text style={[styles.tabLabel, { color: tab === t.id ? item.color : textSecondary }]}>{t.label}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  {tab === 'bio' && (
                    <View style={{ gap: spacing.sm }}>
                      <Text style={[styles.bodyTxt, { color: textPrimary }, isUrdu && styles.urduText]}>
                        {isUrdu ? item.biographyUr : item.biography}
                      </Text>
                      <View style={[styles.contribBox, { backgroundColor: item.color + '0E', borderColor: item.color + '30', borderLeftColor: item.color }]}>
                        <Text style={[styles.contribLabel, { color: item.color }]}>
                          {isUrdu ? '⭐ اہم خدمات' : '⭐ Key Contribution'}
                        </Text>
                        <Text style={[styles.bodyTxt, { color: textPrimary }, isUrdu && styles.urduText]}>
                          {isUrdu ? item.keyContributionUr : item.keyContribution}
                        </Text>
                      </View>
                    </View>
                  )}

                  {tab === 'hadith' && (
                    <View style={[styles.hadithBox, { backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.02)', borderColor: border }]}>
                      <Ionicons name="chatbubble-ellipses-outline" size={20} color={item.color} style={{ marginBottom: 8 }} />
                      <Text style={[styles.hadithTxt, { color: textPrimary }, isUrdu && styles.urduText]}>
                        {isUrdu ? item.hadithUr : item.hadith}
                      </Text>
                    </View>
                  )}

                  {tab === 'lesson' && (
                    <View style={[styles.contribBox, { backgroundColor: item.color + '0E', borderColor: item.color + '30', borderLeftColor: item.color }]}>
                      <Text style={[styles.contribLabel, { color: item.color }]}>💡 {isUrdu ? 'ہمارے لیے سبق' : 'Lesson for Us'}</Text>
                      <Text style={[styles.bodyTxt, { color: textPrimary }, isUrdu && styles.urduText]}>
                        {isUrdu ? item.lessonUr : item.lesson}
                      </Text>
                    </View>
                  )}
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
  headerDeco: { position: 'absolute', right: -5, bottom: 10, width: 100, height: 55, opacity: 0.1 },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.xs },
  langToggle: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: radius.pill, padding: 3, gap: 2 },
  langBtn: { paddingHorizontal: spacing.md, paddingVertical: 5, borderRadius: radius.pill },
  langActive: { backgroundColor: colors.gold[400] },
  langTxt: { fontSize: 12, fontWeight: '700', color: 'rgba(255,255,255,0.5)' },
  langActiveTxt: { color: colors.navy[900] },
  headerAr: { fontSize: 26, color: colors.gold[300] },
  headerEn: { ...typography.heading, color: colors.white },
  headerSub: { fontSize: 12, color: 'rgba(255,255,255,0.4)', fontWeight: '500' },
  chips: { paddingTop: spacing.sm, gap: spacing.xs },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: spacing.md, paddingVertical: 7, borderRadius: radius.pill, backgroundColor: 'rgba(255,255,255,0.07)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)' },
  chipActive: { borderColor: colors.gold[400] },
  chipTxt: { fontSize: 12, fontWeight: '700', color: 'rgba(255,255,255,0.6)' },
  chipIcon: { fontSize: 12 },

  list: { paddingHorizontal: spacing.lg, paddingTop: spacing.xs, gap: spacing.md },
  statsBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', borderRadius: radius.lg, padding: spacing.md, borderWidth: 0.5, marginTop: spacing.md, marginBottom: spacing.sm },
  statItem: { alignItems: 'center', flex: 1 },
  statNum: { fontSize: 20, fontWeight: '800' },
  statLabel: { fontSize: 11, fontWeight: '600', marginTop: 2 },
  statDiv: { width: 1, height: 28 },

  card: { borderRadius: radius.lg, padding: spacing.lg, gap: spacing.sm, borderWidth: 0.5, ...shadow.sm, overflow: 'hidden' },
  accentStrip: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, borderTopLeftRadius: radius.lg, borderBottomLeftRadius: radius.lg },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  avatar: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  avatarIcon: { fontSize: 22 },
  sahabaName: { ...typography.bodyMedium, fontWeight: '700' },
  sahabaArabic: { fontSize: 16, lineHeight: 26 },
  sahabaTitle: { fontSize: 11, marginTop: 1 },
  headerRight: { alignItems: 'flex-end', gap: 6 },
  catBadge: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  catBadgeIcon: { fontSize: 14 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4, flexWrap: 'wrap' },
  metaTxt: { fontSize: 11 },
  metaDot: { fontSize: 11 },

  body: { borderTopWidth: 1, paddingTop: spacing.md, gap: spacing.md, marginTop: spacing.xs },
  tabRow: { flexDirection: 'row' },
  tabBtn: { flex: 1, alignItems: 'center', paddingVertical: 8, borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabLabel: { fontSize: 13, fontWeight: '700' },
  bodyTxt: { ...typography.body, lineHeight: 24 },
  contribBox: { borderLeftWidth: 3, borderWidth: 1, borderRadius: radius.sm, padding: spacing.md, gap: spacing.xs },
  contribLabel: { fontSize: 11, fontWeight: '800', letterSpacing: 0.4, marginBottom: 4 },
  hadithBox: { borderRadius: radius.md, padding: spacing.md, borderWidth: 1 },
  hadithTxt: { ...typography.body, lineHeight: 24, fontStyle: 'italic' },

  urduText: { textAlign: 'right', fontFamily: 'Amiri_400Regular', fontSize: 15, lineHeight: 28 },
  urduTitle: { textAlign: 'right', fontFamily: 'Amiri_400Regular' },
});
