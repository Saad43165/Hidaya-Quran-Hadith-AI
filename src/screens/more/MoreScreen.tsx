import React from 'react';
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radius, shadow, spacing, typography } from '../../theme';

import { darkColors } from '../../theme/darkColors';
import { useThemeStore } from '../../store/useThemeStore';
import type { TabAndStackNavigation } from '../../navigation/types';

interface FeatureItem {
  icon: keyof typeof Ionicons.glyphMap;
  imageSource?: any;
  label: string;
  description: string;
  color: string;
  badge?: string;
  onPress: () => void;
}

interface FeatureSection {
  title: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
  items: FeatureItem[];
}

export function MoreScreen() {
  const navigation = useNavigation<TabAndStackNavigation>();
  const insets = useSafeAreaInsets();
  const isDark = useThemeStore(s => s.isDark);

  const bg            = isDark ? darkColors.background      : colors.parchment[50];
  const cardBg        = isDark ? darkColors.surface         : colors.white;
  const border        = isDark ? darkColors.border          : colors.parchment[200];
  const textPrimary   = isDark ? darkColors.text.primary    : colors.parchment[950];
  const textSecondary = isDark ? darkColors.text.secondary  : colors.parchment[500];
  const textMuted     = isDark ? darkColors.text.muted      : colors.parchment[400];
  const sectionHdr    = isDark ? 'rgba(255,255,255,0.22)'   : colors.parchment[400];

  const SECTIONS: FeatureSection[] = [
    {
      title: 'WORSHIP & PRAYER',
      subtitle: 'Daily acts of ibadah',
      icon: 'moon-outline',
      items: [
        {
          icon: 'checkmark-circle-outline',
          imageSource: require('../../../assets/images/prayer.png'),
          label: 'Salah Tracker',
          description: 'Track 5 daily prayers',
          color: '#4ADE80',
          onPress: () => navigation.navigate('SalahTracker'),
        },
        {
          icon: 'radio-button-on-outline',
          imageSource: require('../../../assets/images/prayerbeads.png'),
          label: 'Tasbih Counter',
          description: 'Digital dhikr beads',
          color: '#C084FC',
          onPress: () => navigation.navigate('Tasbih'),
        },
        {
          icon: 'hand-left-outline',
          imageSource: require('../../../assets/images/prayer.png'),
          label: 'Duas',
          description: 'Islamic supplications',
          color: '#F59E0B',
          onPress: () => navigation.navigate('Duas'),
        },
        {
          icon: 'compass-outline',
          imageSource: require('../../../assets/images/compass.png'),
          label: 'Qibla Direction',
          description: 'Find Mecca direction',
          color: '#38BDF8',
          onPress: () => navigation.navigate('Qibla'),
        },
        {
          icon: 'sunny-outline',
          imageSource: require('../../../assets/images/adhkar.png'),
          label: 'Daily Adhkar',
          description: 'Morning & evening dhikr',
          color: '#4ADE80',
          onPress: () => navigation.navigate('Adhkar'),
        },
      ],
    },
    {
      title: 'QURAN & LEARNING',
      subtitle: 'Knowledge & understanding',
      icon: 'book-outline',
      items: [
        {
          icon: 'star-outline',
          imageSource: require('../../../assets/images/kalma.png'),
          label: '99 Names of Allah',
          description: 'Asma ul Husna',
          color: '#F472B6',
          onPress: () => navigation.navigate('NamesOfAllah'),
        },
        {
          icon: 'book-outline',
          imageSource: require('../../../assets/images/mushaf.png'),
          label: 'Vocabulary',
          description: 'Quranic words & roots',
          color: '#818CF8',
          onPress: () => navigation.navigate('Vocabulary'),
        },
        {
          icon: 'school-outline',
          label: 'Comprehension',
          description: 'Test your knowledge',
          color: '#4ADE80',
          onPress: () => navigation.navigate('ComprehensionReview'),
        },
        {
          icon: 'cash-outline',
          label: 'Zakat Calculator',
          description: 'Calculate your zakat',
          color: '#F59E0B',
          onPress: () => navigation.navigate('ZakatCalculator'),
        },
      ],
    },
    {
      title: 'HISTORY & SEERAH',
      subtitle: 'Islamic heritage & knowledge',
      icon: 'library-outline',
      items: [
        {
          icon: 'person-outline',
          imageSource: require('../../../assets/images/kalma.png'),
          label: 'Seerah',
          description: 'Life of the Prophet ﷺ',
          color: '#C084FC',
          onPress: () => navigation.navigate('Seerah'),
        },
        {
          icon: 'person-circle-outline',
          label: 'Stories of Prophets',
          description: '25 Quranic prophets',
          color: '#8B5CF6',
          badge: '🕌',
          onPress: () => navigation.navigate('ProphetStories'),
        },
        {
          icon: 'people-circle-outline',
          label: 'Sahaba Profiles',
          description: 'Noble companions ﷺ',
          color: '#D4A93E',
          badge: '⭐',
          onPress: () => navigation.navigate('Sahaba'),
        },
        {
          icon: 'globe-outline',
          label: 'Islamic History',
          description: 'Battles, caliphates, scholars',
          color: '#EF4444',
          badge: '🏛️',
          onPress: () => navigation.navigate('IslamicHistory'),
        },
        {
          icon: 'flag-outline',
          imageSource: require('../../../assets/images/kabba.png'),
          label: 'Hajj & Umrah',
          description: 'Step-by-step pilgrimage guide',
          color: colors.gold[400],
          badge: '🕋',
          onPress: () => navigation.navigate('HajjGuide'),
        },
      ],
    },
    {
      title: 'CALENDAR & EVENTS',
      subtitle: 'Islamic dates & occasions',
      icon: 'calendar-outline',
      items: [
        {
          icon: 'moon-outline',
          imageSource: require('../../../assets/images/ramadan.png'),
          label: 'Ramadan Mode',
          description: 'Countdown & tracker',
          color: '#F59E0B',
          badge: '✨',
          onPress: () => navigation.navigate('Ramadan'),
        },
        {
          icon: 'calendar-outline',
          imageSource: require('../../../assets/images/ramadan.png'),
          label: 'Islamic Events',
          description: 'Hijri calendar & events',
          color: '#38BDF8',
          onPress: () => navigation.navigate('IslamicEvents'),
        },
      ],
    },
    {
      title: 'PERSONAL',
      subtitle: 'Your content & settings',
      icon: 'person-outline',
      items: [
        {
          icon: 'bookmark-outline',
          label: 'Bookmarks',
          description: 'Saved ayahs & hadiths',
          color: '#60A5FA',
          onPress: () => navigation.navigate('Bookmarks'),
        },
        {
          icon: 'search-outline',
          label: 'Search',
          description: 'Find anything in the app',
          color: '#4ADE80',
          onPress: () => navigation.navigate('Search'),
        },
        {
          icon: 'settings-outline',
          label: 'Settings',
          description: 'Themes, language & more',
          color: '#94A3B8',
          onPress: () => navigation.navigate('Settings'),
        },
      ],
    },
  ];

  return (
    <View style={[styles.container, { backgroundColor: bg }]}>
      {/* ── Navy Gradient Header ── */}
      <LinearGradient
        colors={['#060C1F', '#0B1330', '#162354']}
        style={[styles.header, { paddingTop: insets.top + spacing.md }]}
      >
        <Image source={require('../../../assets/images/islamicbackground.png')} style={styles.headerBgImage} resizeMode="cover" />
        <View style={styles.headerScrim} />
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.headerTitle}>Explore</Text>
            <Text style={styles.headerSubtitle}>All features in one place</Text>
          </View>
          <View style={styles.headerBadge}>
            <Text style={styles.headerBadgeNum}>{SECTIONS.reduce((acc, s) => acc + s.items.length, 0)}</Text>
            <Text style={styles.headerBadgeLabel}>Features</Text>
          </View>
        </View>
      </LinearGradient>

      {/* ── Feature Sections ── */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + spacing.xxxl }]}
      >
        {SECTIONS.map(section => (
          <View key={section.title}>
            {/* Section header */}
            <View style={styles.sectionHeaderRow}>
              <View style={[styles.sectionIconWrap, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)' }]}>
                <Ionicons name={section.icon} size={13} color={sectionHdr} />
              </View>
              <View>
                <Text style={[styles.sectionTitle, { color: textMuted }]}>{section.title}</Text>
                <Text style={[styles.sectionSub, { color: isDark ? 'rgba(255,255,255,0.12)' : colors.parchment[300] }]}>{section.subtitle}</Text>
              </View>
            </View>

            {/* 2-column grid */}
            <View style={styles.grid}>
              {section.items.map(item => (
                <TouchableOpacity
                  key={item.label}
                  style={[styles.card, { backgroundColor: cardBg, borderColor: border }]}
                  onPress={item.onPress}
                  activeOpacity={0.7}
                >
                  {item.badge && (
                    <View style={styles.badgeWrap}>
                      <Text style={styles.badgeText}>{item.badge}</Text>
                    </View>
                  )}

                  <View style={[styles.iconCircle, { backgroundColor: item.color + '18' }]}>
                    {item.imageSource ? (
                      <Image source={item.imageSource} style={[styles.cardImage, { tintColor: item.color }]} resizeMode="contain" />
                    ) : (
                      <Ionicons name={item.icon} size={26} color={item.color} />
                    )}
                  </View>

                  <Text style={[styles.cardLabel, { color: textPrimary }]} numberOfLines={2}>
                    {item.label}
                  </Text>
                  <Text style={[styles.cardDesc, { color: textSecondary }]} numberOfLines={2}>
                    {item.description}
                  </Text>

                  {/* Color bar at bottom */}
                  <View style={[styles.cardBar, { backgroundColor: item.color }]} />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  header: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
    overflow: 'hidden',
  },
  headerBgImage: {
    position: 'absolute', right: 0, bottom: 0, width: '100%', height: '130%', opacity: 0.12,
  },
  headerScrim: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(6,12,31,0.4)',
  },
  headerContent: {
    flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between',
  },
  headerTitle: { ...typography.displayMd, color: colors.white, marginBottom: 4 },
  headerSubtitle: { ...typography.body, color: 'rgba(255,255,255,0.5)' },
  headerBadge: {
    backgroundColor: 'rgba(245,158,11,0.15)',
    borderRadius: radius.md, padding: spacing.sm,
    alignItems: 'center', minWidth: 52,
    borderWidth: 1, borderColor: 'rgba(245,158,11,0.2)',
  },
  headerBadgeNum: { fontSize: 22, fontWeight: '800', color: colors.gold[300] },
  headerBadgeLabel: { fontSize: 9, fontWeight: '700', color: 'rgba(255,255,255,0.35)', letterSpacing: 0.5, marginTop: 1 },

  scrollContent: { paddingHorizontal: spacing.lg, paddingTop: spacing.md },

  sectionHeaderRow: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    marginTop: spacing.xl, marginBottom: spacing.sm, paddingLeft: 2,
  },
  sectionIconWrap: {
    width: 26, height: 26, borderRadius: 8,
    alignItems: 'center', justifyContent: 'center',
  },
  sectionTitle: { fontSize: 10, fontWeight: '800', letterSpacing: 2 },
  sectionSub: { fontSize: 9, fontWeight: '500', letterSpacing: 0.3, marginTop: 1 },

  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },

  card: {
    width: '47.5%',
    borderRadius: radius.lg,
    padding: spacing.lg,
    alignItems: 'center',
    minHeight: 138,
    borderWidth: 1,
    ...shadow.sm,
    gap: 5,
    overflow: 'hidden',
  },
  cardImage: { width: 30, height: 30 },
  iconCircle: {
    width: 52, height: 52, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center', marginBottom: 2,
  },
  cardLabel: { ...typography.bodyMedium, textAlign: 'center', lineHeight: 18 },
  cardDesc: { fontSize: 11, fontWeight: '400', textAlign: 'center', lineHeight: 15 },
  cardBar: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 2.5, borderBottomLeftRadius: radius.lg, borderBottomRightRadius: radius.lg },

  badgeWrap: {
    position: 'absolute', top: spacing.xs, right: spacing.xs,
    backgroundColor: 'rgba(245,158,11,0.15)',
    borderRadius: radius.pill, paddingHorizontal: 5, paddingVertical: 1,
  },
  badgeText: { fontSize: 11 },
});
