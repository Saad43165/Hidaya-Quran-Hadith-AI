import React, { useState } from 'react';
import { FlatList, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { BackButton } from '../../components/common/BackButton';
import { SEERAH_STORIES, SEERAH_CATEGORIES } from '../../data/seerahData';
import { useThemeColors } from '../../hooks/useThemeColors';
import { colors, radius, shadow, spacing, typography } from '../../theme';

type Lang = 'en' | 'ur';

export function SeerahScreen() {
  const { isDark, surface, bg, border, textPrimary, textSecondary } = useThemeColors();
  const [lang, setLang] = useState<Lang>('en');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [expanded, setExpanded] = useState<string | null>(null);

  const filtered = activeCategory === 'all'
    ? SEERAH_STORIES
    : SEERAH_STORIES.filter(s => s.category === activeCategory);

  const isUrdu = lang === 'ur';

  return (
    <ScreenContainer noPadding>
      {/* Header */}
      <LinearGradient colors={['#060C1F', '#1A0A2E', '#2D1254']} style={styles.header}>
        <Image source={require('../../../assets/images/islamicbackground.png')} style={styles.headerBg} resizeMode="cover" />
        <Image source={require('../../../assets/images/kalma.png')} style={styles.headerKalma} resizeMode="contain" />

        <View style={styles.headerTop}>
          <BackButton />
          {/* Language toggle — local to this screen only */}
          <View style={styles.langToggle}>
            <TouchableOpacity
              style={[styles.langBtn, !isUrdu && styles.langBtnActive]}
              onPress={() => setLang('en')}
              activeOpacity={0.8}
            >
              <Text style={[styles.langBtnText, !isUrdu && styles.langBtnTextActive]}>EN</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.langBtn, isUrdu && styles.langBtnActive]}
              onPress={() => setLang('ur')}
              activeOpacity={0.8}
            >
              <Text style={[styles.langBtnText, isUrdu && styles.langBtnTextActive]}>اردو</Text>
            </TouchableOpacity>
          </View>
        </View>

        <Text style={[styles.headerAr, { fontFamily: 'Amiri_400Regular' }]}>السيرة النبوية</Text>
        <Text style={styles.headerEn}>{isUrdu ? 'حیاتِ نبوی ﷺ' : 'Life of the Prophet ﷺ'}</Text>
        <Text style={styles.headerSub}>
          {isUrdu ? 'سیرت کی کہانیاں اور اسباق' : 'Stories & Lessons from the Seerah'}
        </Text>

        {/* Category filter */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.catRow}>
          <TouchableOpacity
            style={[styles.catChip, activeCategory === 'all' && styles.catChipActive]}
            onPress={() => setActiveCategory('all')}
            activeOpacity={0.8}
          >
            <Text style={[styles.catLabel, activeCategory === 'all' && { color: colors.navy[900] }]}>
              {isUrdu ? 'سب' : 'All'}
            </Text>
          </TouchableOpacity>
          {SEERAH_CATEGORIES.map(cat => {
            const isActive = activeCategory === cat.id;
            return (
              <TouchableOpacity
                key={cat.id}
                style={[styles.catChip, isActive && { backgroundColor: cat.color, borderColor: cat.color }]}
                onPress={() => setActiveCategory(cat.id)}
                activeOpacity={0.8}
              >
                <Text style={[styles.catLabel, isActive && { color: colors.navy[900] }]}>
                  {isUrdu ? cat.labelUr : cat.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </LinearGradient>

      <FlatList
        data={filtered}
        keyExtractor={item => item.id}
        contentContainerStyle={[styles.list, { backgroundColor: bg }]}
        style={{ backgroundColor: bg }}
        renderItem={({ item }) => {
          const isExpanded = expanded === item.id;
          const catInfo = SEERAH_CATEGORIES.find(c => c.id === item.category);
          const summary = isUrdu ? item.summaryUr : item.summary;
          const content = isUrdu ? item.contentUr : item.content;
          const lesson = isUrdu ? item.lessonUr : item.lesson;
          const catLabel = catInfo ? (isUrdu ? catInfo.labelUr : catInfo.label) : '';

          return (
            <View style={[styles.storyCard, { backgroundColor: surface, borderColor: border }]}>
              {/* Accent strip */}
              <View style={[styles.accentStrip, { backgroundColor: item.color }]} />

              {/* Top row: period + category */}
              <View style={styles.storyTop}>
                <View style={[styles.periodBadge, { backgroundColor: item.color + '18', borderColor: item.color + '35' }]}>
                  <Text style={styles.periodIcon}>{item.icon}</Text>
                  <Text style={[styles.periodText, { color: item.color }]}>{item.period}</Text>
                </View>
                {catInfo && (
                  <View style={[styles.catBadge, { backgroundColor: catInfo.color + '18', borderColor: catInfo.color + '35' }]}>
                    <Text style={[styles.catBadgeText, { color: catInfo.color }]}>{catLabel}</Text>
                  </View>
                )}
                {item.year && (
                  <View style={[styles.yearBadge, { borderColor: border }]}>
                    <Ionicons name="calendar-outline" size={10} color={textSecondary} />
                    <Text style={[styles.yearText, { color: textSecondary }]} numberOfLines={1}>{item.year}</Text>
                  </View>
                )}
              </View>

              {/* Title */}
              <Text style={[styles.storyAr, { fontFamily: 'Amiri_400Regular', color: item.color }]}>
                {item.arabicTitle}
              </Text>
              <Text style={[styles.storyTitle, { color: textPrimary }]}>
                {item.title}
              </Text>

              {/* Summary */}
              <Text
                style={[
                  styles.storySummary,
                  { color: textSecondary },
                  isUrdu && styles.urduText,
                ]}
              >
                {summary}
              </Text>

              {/* Expand button */}
              <TouchableOpacity
                style={[styles.expandBtn, { borderColor: item.color + '60' }]}
                onPress={() => setExpanded(isExpanded ? null : item.id)}
                activeOpacity={0.8}
              >
                <Text style={[styles.expandBtnText, { color: item.color }]}>
                  {isExpanded
                    ? (isUrdu ? 'کم پڑھیں' : 'Read Less')
                    : (isUrdu ? 'پوری کہانی پڑھیں' : 'Read Full Story')}
                </Text>
                <Ionicons name={isExpanded ? 'chevron-up' : 'chevron-down'} size={14} color={item.color} />
              </TouchableOpacity>

              {/* Expanded content */}
              {isExpanded && (
                <View style={[styles.expandedBody, { borderTopColor: border }]}>
                  <Text style={[styles.fullContent, { color: textPrimary }, isUrdu && styles.urduText]}>
                    {content}
                  </Text>

                  {item.quranRef && (
                    <View style={[styles.quranRef, { backgroundColor: item.color + '12', borderColor: item.color + '30' }]}>
                      <Ionicons name="book" size={13} color={item.color} />
                      <Text style={[styles.quranRefText, { color: item.color }]}>{item.quranRef}</Text>
                    </View>
                  )}

                  <View style={[styles.lessonBox, { backgroundColor: item.color + '10', borderColor: item.color + '25', borderLeftColor: item.color }]}>
                    <Text style={[styles.lessonTitle, { color: item.color }]}>
                      {isUrdu ? '📚 سبق' : '📚 LESSON'}
                    </Text>
                    <Text style={[styles.lessonText, { color: textPrimary }, isUrdu && styles.urduText]}>
                      {lesson}
                    </Text>
                  </View>
                </View>
              )}
            </View>
          );
        }}
        ListHeaderComponent={
          <View style={[styles.statsRow, { backgroundColor: surface, borderColor: border }]}>
            <View style={styles.statItem}>
              <Text style={[styles.statNum, { color: colors.gold[400] }]}>{SEERAH_STORIES.length}</Text>
              <Text style={[styles.statLabel, { color: textSecondary }]}>{isUrdu ? 'کہانیاں' : 'Stories'}</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: border }]} />
            <View style={styles.statItem}>
              <Text style={[styles.statNum, { color: colors.gold[400] }]}>{SEERAH_CATEGORIES.length}</Text>
              <Text style={[styles.statLabel, { color: textSecondary }]}>{isUrdu ? 'موضوعات' : 'Topics'}</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: border }]} />
            <View style={styles.statItem}>
              <Text style={[styles.statNum, { color: '#4ADE80' }]}>٢</Text>
              <Text style={[styles.statLabel, { color: textSecondary }]}>{isUrdu ? 'زبانیں' : 'Languages'}</Text>
            </View>
          </View>
        }
        ListFooterComponent={<View style={{ height: spacing.xxxl }} />}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: { paddingTop: 52, paddingBottom: spacing.lg, paddingHorizontal: spacing.lg, overflow: 'hidden', gap: spacing.xs },
  headerBg: { position: 'absolute', right: 0, bottom: 0, width: '100%', height: '130%', opacity: 0.08 },
  headerKalma: { position: 'absolute', right: -10, bottom: 20, width: 120, height: 50, opacity: 0.1 },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.xs },
  langToggle: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: radius.pill, padding: 3, gap: 2 },
  langBtn: { paddingHorizontal: spacing.md, paddingVertical: 5, borderRadius: radius.pill },
  langBtnActive: { backgroundColor: colors.gold[400] },
  langBtnText: { fontSize: 12, fontWeight: '700', color: 'rgba(255,255,255,0.5)' },
  langBtnTextActive: { color: colors.navy[900] },
  headerAr: { fontSize: 26, color: '#C084FC' },
  headerEn: { ...typography.heading, color: colors.white },
  headerSub: { fontSize: 12, color: 'rgba(255,255,255,0.4)', fontWeight: '500' },
  catRow: { paddingTop: spacing.sm, gap: spacing.xs },
  catChip: { paddingHorizontal: spacing.md, paddingVertical: 7, borderRadius: radius.pill, backgroundColor: 'rgba(255,255,255,0.07)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)' },
  catChipActive: { backgroundColor: colors.gold[400], borderColor: colors.gold[400] },
  catLabel: { fontSize: 12, fontWeight: '700', color: 'rgba(255,255,255,0.6)' },

  statsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', marginHorizontal: spacing.lg, marginTop: spacing.md, marginBottom: spacing.sm, borderRadius: radius.lg, padding: spacing.md, borderWidth: 0.5 },
  statItem: { alignItems: 'center', flex: 1 },
  statNum: { fontSize: 22, fontWeight: '800' },
  statLabel: { fontSize: 11, fontWeight: '600', marginTop: 2 },
  statDivider: { width: 1, height: 30 },

  list: { paddingHorizontal: spacing.lg, paddingTop: spacing.xs, gap: spacing.md },
  storyCard: { borderRadius: radius.lg, padding: spacing.lg, gap: spacing.sm, borderWidth: 0.5, ...shadow.sm, overflow: 'hidden' },
  accentStrip: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, borderTopLeftRadius: radius.lg, borderBottomLeftRadius: radius.lg },
  storyTop: { flexDirection: 'row', gap: spacing.xs, alignItems: 'center', flexWrap: 'wrap' },
  periodBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, borderRadius: radius.pill, paddingHorizontal: spacing.sm, paddingVertical: 3, borderWidth: 1 },
  periodIcon: { fontSize: 12 },
  periodText: { fontSize: 11, fontWeight: '700' },
  catBadge: { borderRadius: radius.pill, paddingHorizontal: spacing.sm, paddingVertical: 3, borderWidth: 1 },
  catBadgeText: { fontSize: 10, fontWeight: '700' },
  yearBadge: { flexDirection: 'row', alignItems: 'center', gap: 3, borderRadius: radius.pill, paddingHorizontal: spacing.sm, paddingVertical: 3, borderWidth: 1, maxWidth: 160 },
  yearText: { fontSize: 9, fontWeight: '600' },
  storyTitle: { ...typography.heading, lineHeight: 26, paddingLeft: spacing.xs },
  storyAr: { fontSize: 20, lineHeight: 34, textAlign: 'right', paddingLeft: spacing.xs },
  storySummary: { ...typography.body, lineHeight: 23, paddingLeft: spacing.xs },
  expandBtn: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, alignSelf: 'flex-start', borderWidth: 1, borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: 5, marginTop: spacing.xs },
  expandBtnText: { fontSize: 12, fontWeight: '700' },
  expandedBody: { borderTopWidth: 1, paddingTop: spacing.md, gap: spacing.md },
  fullContent: { ...typography.body, lineHeight: 26 },
  quranRef: { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: radius.sm, padding: spacing.sm, borderWidth: 1 },
  quranRefText: { fontSize: 12, fontWeight: '700', flex: 1 },
  lessonBox: { borderLeftWidth: 3, borderWidth: 1, borderRadius: radius.sm, padding: spacing.md, gap: spacing.xs },
  lessonTitle: { fontSize: 11, fontWeight: '800', letterSpacing: 1 },
  lessonText: { ...typography.body, lineHeight: 23 },

  urduText: { textAlign: 'right', fontFamily: 'Amiri_400Regular', fontSize: 15, lineHeight: 28 },
  urduTitle: { textAlign: 'right', fontFamily: 'Amiri_400Regular', fontSize: 17 },
});
