import React, { useState, useCallback } from 'react';
import { ActivityIndicator, FlatList, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { BackButton } from '../../components/common/BackButton';
import {
  HISTORY_TOPICS, HISTORY_CATEGORIES,
  fetchWikiSummary, WikiSummary, HistoryTopic,
} from '../../services/api/islamicHistoryApi';
import { useThemeColors } from '../../hooks/useThemeColors';
import { colors, radius, shadow, spacing, typography } from '../../theme';

interface TopicState { loading: boolean; data: WikiSummary | null; error: string | null }

export function IslamicHistoryScreen() {
  const { isDark, surface, bg, border, textPrimary, textSecondary } = useThemeColors();
  const [activeCategory, setActiveCategory] = useState('all');
  const [expanded, setExpanded]             = useState<string | null>(null);
  const [cache, setCache]                   = useState<Record<string, TopicState>>({});

  const filtered = activeCategory === 'all'
    ? HISTORY_TOPICS
    : HISTORY_TOPICS.filter(t => t.category === activeCategory);

  const handleExpand = useCallback(async (topic: HistoryTopic) => {
    if (expanded === topic.id) { setExpanded(null); return; }
    setExpanded(topic.id);
    if (cache[topic.id]) return;
    setCache(prev => ({ ...prev, [topic.id]: { loading: true, data: null, error: null } }));
    try {
      const data = await fetchWikiSummary(topic.wikiTitle);
      setCache(prev => ({ ...prev, [topic.id]: { loading: false, data, error: null } }));
    } catch {
      setCache(prev => ({ ...prev, [topic.id]: { loading: false, data: null, error: 'Failed to load. Check connection.' } }));
    }
  }, [expanded, cache]);

  return (
    <ScreenContainer noPadding>
      {/* ── Gradient Header ── */}
      <LinearGradient colors={['#060C1F', '#1A0505', '#2E0D0D']} style={styles.header}>
        <Image source={require('../../../assets/images/islamicbackground.png')} style={styles.headerBg} resizeMode="cover" />
        <Image source={require('../../../assets/images/mosque.png')} style={styles.headerDeco} resizeMode="contain" />

        <View style={styles.headerTop}>
          <BackButton />
        </View>

        <Text style={[styles.headerAr, { fontFamily: 'Amiri_400Regular' }]}>التاريخ الإسلامي</Text>
        <Text style={styles.headerEn}>Islamic History</Text>
        <Text style={styles.headerSub}>{HISTORY_TOPICS.length} topics · Powered by Wikipedia</Text>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
          <TouchableOpacity
            style={[styles.chip, activeCategory === 'all' && styles.chipActive]}
            onPress={() => setActiveCategory('all')}
            activeOpacity={0.8}
          >
            <Text style={[styles.chipTxt, activeCategory === 'all' && { color: colors.navy[900] }]}>All</Text>
          </TouchableOpacity>
          {HISTORY_CATEGORIES.map(cat => (
            <TouchableOpacity
              key={cat.id}
              style={[
                styles.chip,
                activeCategory === cat.id && { backgroundColor: cat.color, borderColor: cat.color },
              ]}
              onPress={() => setActiveCategory(activeCategory === cat.id ? 'all' : cat.id)}
              activeOpacity={0.8}
            >
              <Text style={styles.chipIcon}>{cat.icon}</Text>
              <Text style={[styles.chipTxt, activeCategory === cat.id && { color: '#FFF' }]}>{cat.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </LinearGradient>

      <FlatList
        data={filtered}
        keyExtractor={t => t.id}
        contentContainerStyle={[styles.list, { backgroundColor: bg }]}
        style={{ backgroundColor: bg }}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={[styles.statsBar, { backgroundColor: surface, borderColor: border }]}>
            {[
              { n: `${HISTORY_TOPICS.length}`,       l: 'Topics',      c: '#EF4444' },
              { n: `${HISTORY_CATEGORIES.length}`,   l: 'Categories',  c: colors.gold[400] },
              { n: 'Wiki',                            l: 'Source',      c: '#60A5FA' },
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
        renderItem={({ item }: { item: HistoryTopic }) => {
          const isOpen = expanded === item.id;
          const state  = cache[item.id];
          const cat    = HISTORY_CATEGORIES.find(c => c.id === item.category);

          return (
            <View style={[styles.card, { backgroundColor: surface, borderColor: border }]}>
              <View style={[styles.accentStrip, { backgroundColor: item.color }]} />

              <TouchableOpacity style={styles.cardTop} onPress={() => handleExpand(item)} activeOpacity={0.8}>
                <View style={[styles.iconCircle, { backgroundColor: item.color + '20' }]}>
                  <Text style={styles.topicIcon}>{item.icon}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.topicTitle, { color: textPrimary }]}>{item.title}</Text>
                  <View style={styles.badgeRow}>
                    <View style={[styles.eraBadge, { backgroundColor: item.color + '18', borderColor: item.color + '30' }]}>
                      <Ionicons name="time-outline" size={10} color={item.color} />
                      <Text style={[styles.eraText, { color: item.color }]}>{item.era}</Text>
                    </View>
                    {cat && (
                      <View style={[styles.catBadge, { backgroundColor: cat.color + '14', borderColor: cat.color + '25' }]}>
                        <Text style={styles.catBadgeTxt}>{cat.icon} {cat.label}</Text>
                      </View>
                    )}
                  </View>
                </View>
                <Ionicons name={isOpen ? 'chevron-up' : 'chevron-down'} size={18} color={textSecondary} />
              </TouchableOpacity>

              {isOpen && (
                <View style={[styles.body, { borderTopColor: border }]}>
                  {state?.loading && (
                    <View style={styles.loadRow}>
                      <ActivityIndicator size="small" color={item.color} />
                      <Text style={[styles.loadTxt, { color: textSecondary }]}>Loading from Wikipedia…</Text>
                    </View>
                  )}

                  {state?.error && (
                    <View style={styles.errorRow}>
                      <Ionicons name="wifi-outline" size={18} color={textSecondary} />
                      <Text style={[styles.errorTxt, { color: textSecondary }]}>{state.error}</Text>
                      <TouchableOpacity onPress={() => {
                        setCache(prev => { const n = { ...prev }; delete n[item.id]; return n; });
                        handleExpand(item);
                      }}>
                        <Text style={[styles.retryTxt, { color: item.color }]}>Retry</Text>
                      </TouchableOpacity>
                    </View>
                  )}

                  {state?.data && (
                    <View style={{ gap: spacing.sm }}>
                      {state.data.thumbnailUrl && (
                        <Image source={{ uri: state.data.thumbnailUrl }} style={[styles.thumbnail, { backgroundColor: border }]} resizeMode="cover" />
                      )}
                      <Text style={[styles.wikiDesc, { color: textSecondary }]}>{state.data.description}</Text>
                      <Text style={[styles.wikiExtract, { color: textPrimary }]}>{state.data.extract}</Text>
                      <View style={[styles.wikiFooter, { backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)', borderColor: border }]}>
                        <Ionicons name="globe-outline" size={13} color={textSecondary} />
                        <Text style={[styles.wikiSrc, { color: textSecondary }]}>Source: Wikipedia · Free Encyclopedia</Text>
                      </View>
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
  headerDeco: { position: 'absolute', right: -5, bottom: 5, width: 90, height: 55, opacity: 0.1 },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.xs },
  headerAr: { fontSize: 26, color: '#FCA5A5' },
  headerEn: { ...typography.heading, color: colors.white },
  headerSub: { fontSize: 12, color: 'rgba(255,255,255,0.4)', fontWeight: '500' },
  chips: { paddingTop: spacing.sm, gap: spacing.xs },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: spacing.md, paddingVertical: 7, borderRadius: radius.pill, backgroundColor: 'rgba(255,255,255,0.07)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)' },
  chipActive: { backgroundColor: colors.gold[400], borderColor: colors.gold[400] },
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
  iconCircle: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  topicIcon: { fontSize: 22 },
  topicTitle: { ...typography.bodyMedium, fontWeight: '700', marginBottom: 5 },
  badgeRow: { flexDirection: 'row', gap: spacing.xs, flexWrap: 'wrap' },
  eraBadge: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 6, paddingVertical: 2, borderRadius: radius.xs, borderWidth: 1 },
  eraText: { fontSize: 10, fontWeight: '600' },
  catBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: radius.xs, borderWidth: 1 },
  catBadgeTxt: { fontSize: 10, color: 'rgba(255,255,255,0.6)' },

  body: { borderTopWidth: 1, paddingTop: spacing.md, gap: spacing.sm, marginTop: spacing.xs },
  loadRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  loadTxt: { fontSize: 13 },
  errorRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  errorTxt: { fontSize: 13, flex: 1 },
  retryTxt: { fontSize: 13, fontWeight: '700' },
  thumbnail: { width: '100%', height: 160, borderRadius: radius.md },
  wikiDesc: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  wikiExtract: { ...typography.body, lineHeight: 24 },
  wikiFooter: { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: radius.sm, padding: spacing.sm, borderWidth: 1 },
  wikiSrc: { fontSize: 11 },
});
