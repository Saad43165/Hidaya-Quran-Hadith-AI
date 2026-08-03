import React, { useState } from 'react';
import {
  FlatList, Image, StyleSheet, Text, TouchableOpacity, View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { BackButton } from '../../components/common/BackButton';
import { ISLAMIC_EVENTS, HIJRI_MONTHS } from '../../data/islamicEvents';
import { getTodayHijri } from '../../services/hijri/hijriCalendar';
import { useThemeColors } from '../../hooks/useThemeColors';
import { colors, radius, shadow, spacing, typography } from '../../theme';

const CATEGORY_COLORS: Record<string, string> = {
  obligatory: '#EF4444',
  sunnah: '#4ADE80',
  historical: '#38BDF8',
};

const CATEGORY_LABELS: Record<string, string> = {
  all: 'All Events',
  obligatory: 'Obligatory',
  sunnah: 'Sunnah',
  historical: 'Historical',
};

export function IslamicEventsScreen() {
  const navigation = useNavigation();
  const { isDark, surface, bg, border, textPrimary, textSecondary } = useThemeColors();
  const [filter, setFilter] = useState<string>('all');
  const [expanded, setExpanded] = useState<string | null>(null);
  const hijri = getTodayHijri();

  const filtered = filter === 'all' ? ISLAMIC_EVENTS : ISLAMIC_EVENTS.filter(e => e.category === filter);

  return (
    <ScreenContainer noPadding>
      {/* Header */}
      <LinearGradient colors={['#060C1F', '#0B1A3D', '#0B2E4A']} style={styles.header}>
        <Image source={require('../../../assets/images/islamicbackground.png')} style={styles.headerBg} resizeMode="cover" />
        <Image source={require('../../../assets/images/ramadan.png')} style={styles.headerDecorImg} resizeMode="contain" />

        <BackButton />

        <Text style={[styles.headerAr, { fontFamily: 'Amiri_400Regular' }]}>المناسبات الإسلامية</Text>
        <Text style={styles.headerEn}>Islamic Calendar</Text>

        {/* Current Hijri date pill */}
        <View style={styles.hijriPill}>
          <Ionicons name="moon" size={12} color={colors.gold[400]} />
          <Text style={styles.hijriText}>{hijri.formatted}</Text>
        </View>

        {/* Filter chips */}
        <View style={styles.filterRow}>
          {Object.keys(CATEGORY_LABELS).map(cat => (
            <TouchableOpacity
              key={cat}
              style={[styles.filterChip, filter === cat && styles.filterChipActive, filter === cat && { borderColor: CATEGORY_COLORS[cat] ?? colors.gold[400] }]}
              onPress={() => setFilter(cat)}
              activeOpacity={0.8}
            >
              {cat !== 'all' && <View style={[styles.filterDot, { backgroundColor: CATEGORY_COLORS[cat] }]} />}
              <Text style={[styles.filterLabel, filter === cat && { color: CATEGORY_COLORS[cat] ?? colors.gold[400] }]}>{CATEGORY_LABELS[cat]}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </LinearGradient>

      <FlatList
        data={filtered}
        keyExtractor={item => item.id}
        contentContainerStyle={[styles.list, { backgroundColor: bg }]}
        style={{ backgroundColor: bg }}
        renderItem={({ item }) => {
          const isExpanded = expanded === item.id;
          const catColor = CATEGORY_COLORS[item.category];
          return (
            <TouchableOpacity
              style={[styles.card, { backgroundColor: surface, borderLeftColor: item.color, borderColor: border }]}
              onPress={() => setExpanded(isExpanded ? null : item.id)}
              activeOpacity={0.85}
            >
              {/* Top row */}
              <View style={styles.cardTop}>
                <Text style={styles.cardIcon}>{item.icon}</Text>
                <View style={{ flex: 1, gap: 3 }}>
                  <Text style={[styles.cardName, { color: textPrimary }]}>{item.name}</Text>
                  <Text style={[styles.cardArabic, { fontFamily: 'Amiri_400Regular', color: item.color }]}>{item.arabicName}</Text>
                </View>
                <Ionicons name={isExpanded ? 'chevron-up' : 'chevron-down'} size={15} color={textSecondary} />
              </View>

              {/* Hijri date row */}
              <View style={styles.dateRow}>
                <View style={[styles.hijriDateBadge, { backgroundColor: item.color + '18', borderColor: item.color + '35' }]}>
                  <Text style={[styles.hijriDateText, { color: item.color }]}>
                    {item.hijriDay}{item.hijriEndDay ? `–${item.hijriEndDay}` : ''} {item.hijriMonthName}
                  </Text>
                </View>
                <View style={[styles.catBadge, { backgroundColor: catColor + '15', borderColor: catColor + '30' }]}>
                  <Text style={[styles.catLabel, { color: catColor }]}>{item.category}</Text>
                </View>
              </View>

              {/* Gregorian approx */}
              <View style={styles.gregRow}>
                <Ionicons name="calendar-outline" size={12} color={textSecondary} />
                <Text style={[styles.gregText, { color: textSecondary }]}>~{item.approxGregorian2026}</Text>
              </View>

              {/* Expanded description */}
              {isExpanded && (
                <View style={[styles.expandedBody, { borderTopColor: border }]}>
                  <Text style={[styles.description, { color: textPrimary }]}>{item.description}</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        }}
        ListFooterComponent={<View style={{ height: spacing.xxxl }} />}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: { paddingTop: 52, paddingBottom: spacing.lg, paddingHorizontal: spacing.lg, overflow: 'hidden', gap: spacing.sm },
  headerBg: { position: 'absolute', right: 0, bottom: 0, width: '100%', height: '130%', opacity: 0.08 },
  headerDecorImg: { position: 'absolute', right: 10, top: spacing.xl + spacing.lg, width: 70, height: 70, opacity: 0.25 },
  backBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  headerAr: { fontSize: 24, color: colors.gold[300] },
  headerEn: { ...typography.heading, color: colors.white },
  hijriPill: { flexDirection: 'row', alignItems: 'center', gap: 5, alignSelf: 'flex-start', backgroundColor: 'rgba(245,158,11,0.15)', borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: 4, borderWidth: 1, borderColor: 'rgba(245,158,11,0.25)' },
  hijriText: { fontSize: 12, color: colors.gold[300], fontWeight: '700' },
  filterRow: { flexDirection: 'row', gap: spacing.xs, flexWrap: 'wrap', marginTop: spacing.xs },
  filterChip: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: spacing.md, paddingVertical: 6, borderRadius: radius.pill, backgroundColor: 'rgba(255,255,255,0.07)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)' },
  filterChipActive: { backgroundColor: 'rgba(255,255,255,0.04)' },
  filterDot: { width: 6, height: 6, borderRadius: 3 },
  filterLabel: { fontSize: 11, fontWeight: '700', color: 'rgba(255,255,255,0.5)' },

  list: { paddingHorizontal: spacing.lg, paddingTop: spacing.md, gap: spacing.md },
  card: { borderRadius: radius.md, padding: spacing.lg, gap: spacing.sm, borderLeftWidth: 4, borderWidth: 0.5, ...shadow.sm },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  cardIcon: { fontSize: 24, lineHeight: 32 },
  cardName: { ...typography.subheading },
  cardArabic: { fontSize: 18, lineHeight: 28 },
  dateRow: { flexDirection: 'row', gap: spacing.sm, alignItems: 'center' },
  hijriDateBadge: { borderRadius: radius.pill, paddingHorizontal: spacing.sm, paddingVertical: 3, borderWidth: 1 },
  hijriDateText: { fontSize: 11, fontWeight: '800' },
  catBadge: { borderRadius: radius.pill, paddingHorizontal: spacing.sm, paddingVertical: 3, borderWidth: 1 },
  catLabel: { fontSize: 10, fontWeight: '700', textTransform: 'capitalize' },
  gregRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  gregText: { fontSize: 11, fontWeight: '500' },
  expandedBody: { borderTopWidth: 1, paddingTop: spacing.md, marginTop: spacing.xs },
  description: { ...typography.body, lineHeight: 24 },
});
