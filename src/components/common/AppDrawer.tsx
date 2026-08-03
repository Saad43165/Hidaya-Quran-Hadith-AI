import React, { useMemo } from 'react';
import { Animated, Image, ImageSourcePropType, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useDrawer } from '../../context/DrawerContext';
import { navigationRef } from '../../navigation/navigationRef';
import { useStreakStore } from '../../store/useStreakStore';
import { getTodayHijri } from '../../services/hijri/hijriCalendar';
import { colors, radius, shadow, spacing, typography } from '../../theme';

const DRAWER_WIDTH = 285;

interface NavItem {
  icon: keyof typeof Ionicons.glyphMap;
  imageSource?: ImageSourcePropType;
  label: string;
  onPress: () => void;
  badge?: string;
  accent?: string;
}

function NavRow({ item, onClose }: { item: NavItem; onClose: () => void }) {
  const handlePress = () => { onClose(); setTimeout(() => item.onPress(), 150); };
  return (
    <TouchableOpacity style={styles.navRow} onPress={handlePress} activeOpacity={0.7}>
      <View style={[styles.navIcon, item.accent ? { backgroundColor: item.accent + '20' } : {}]}>
        {item.imageSource ? (
          <Image source={item.imageSource} style={[styles.navImage, item.accent ? { tintColor: item.accent } : undefined]} resizeMode="contain" />
        ) : (
          <Ionicons name={item.icon} size={17} color={item.accent ?? colors.parchment[400]} />
        )}
      </View>
      <Text style={styles.navLabel}>{item.label}</Text>
      {item.badge && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{item.badge}</Text>
        </View>
      )}
      <Ionicons name="chevron-forward" size={12} color="rgba(255,255,255,0.16)" />
    </TouchableOpacity>
  );
}

function Section({ label, items, onClose }: { label: string; items: NavItem[]; onClose: () => void }) {
  return (
    <>
      <Text style={styles.sectionTitle}>{label}</Text>
      <View style={styles.sectionCard}>
        {items.map((item, i) => (
          <React.Fragment key={item.label}>
            <NavRow item={item} onClose={onClose} />
            {i < items.length - 1 && <View style={styles.separator} />}
          </React.Fragment>
        ))}
      </View>
    </>
  );
}

export function AppDrawer() {
  const { isOpen, slideAnim, backdropAnim, closeDrawer } = useDrawer();
  const { currentStreak } = useStreakStore();
  const hijri = useMemo(() => getTodayHijri(), []);

  const navigate = (screen: string, params?: Record<string, unknown>) => {
    if (navigationRef.isReady()) {
      (navigationRef.current as any)?.navigate(screen, params);
    }
  };

  if (!isOpen) return null;

  const WORSHIP: NavItem[] = [
    { icon: 'time-outline',             imageSource: require('../../../assets/images/masjid.png'),       label: 'Prayer Times',    onPress: () => navigate('Prayer'),       accent: '#818CF8' },
    { icon: 'checkmark-circle-outline', imageSource: require('../../../assets/images/prayer.png'),       label: 'Salah Tracker',   onPress: () => navigate('SalahTracker'), accent: '#4ADE80' },
    { icon: 'compass-outline',          imageSource: require('../../../assets/images/compass.png'),      label: 'Qibla Direction', onPress: () => navigate('Qibla'),        accent: '#38BDF8' },
    { icon: 'radio-button-on-outline',  imageSource: require('../../../assets/images/prayerbeads.png'),  label: 'Tasbih Counter',  onPress: () => navigate('Tasbih'),       accent: '#C084FC' },
    { icon: 'hand-left-outline',                                                                         label: 'Duas',            onPress: () => navigate('Duas'),         accent: '#F59E0B' },
    { icon: 'sunny-outline',            imageSource: require('../../../assets/images/adhkar.png'),       label: 'Daily Adhkar',    onPress: () => navigate('Adhkar'),       accent: '#4ADE80' },
  ];

  const LEARN: NavItem[] = [
    { icon: 'star-outline',    imageSource: require('../../../assets/images/kalma.png'),  label: '99 Names of Allah',    onPress: () => navigate('NamesOfAllah'),        accent: '#F472B6' },
    { icon: 'book-outline',    imageSource: require('../../../assets/images/mushaf.png'), label: 'Vocabulary',           onPress: () => navigate('Vocabulary'),          accent: '#A78BFA' },
    { icon: 'school-outline',                                                             label: 'Comprehension Review', onPress: () => navigate('ComprehensionReview'), accent: '#4ADE80' },
    { icon: 'moon-outline',    imageSource: require('../../../assets/images/ramadan.png'),label: 'Ramadan Mode',         onPress: () => navigate('Ramadan'),             accent: colors.gold[400], badge: '✨' },
    { icon: 'calendar-outline',                                                           label: 'Islamic Events',       onPress: () => navigate('IslamicEvents'),       accent: '#38BDF8' },
    { icon: 'cash-outline',                                                               label: 'Zakat Calculator',     onPress: () => navigate('ZakatCalculator'),     accent: '#F59E0B' },
  ];

  const HISTORY: NavItem[] = [
    { icon: 'person-outline',        imageSource: require('../../../assets/images/kalma.png'), label: 'Seerah',             onPress: () => navigate('Seerah'),         accent: '#C084FC' },
    { icon: 'flag-outline',          imageSource: require('../../../assets/images/kabba.png'), label: 'Hajj & Umrah Guide', onPress: () => navigate('HajjGuide'),      accent: colors.gold[400], badge: '🕋' },
    { icon: 'person-circle-outline',                                                           label: 'Stories of Prophets',onPress: () => navigate('ProphetStories'), accent: '#8B5CF6', badge: '🕌' },
    { icon: 'people-circle-outline',                                                           label: 'Sahaba Profiles',    onPress: () => navigate('Sahaba'),         accent: '#D4A93E', badge: '⭐' },
    { icon: 'globe-outline',                                                                   label: 'Islamic History',    onPress: () => navigate('IslamicHistory'), accent: '#EF4444', badge: '🏛️' },
  ];

  const LIBRARY: NavItem[] = [
    { icon: 'bookmark-outline', label: 'Bookmarks', onPress: () => navigate('Bookmarks'), accent: '#60A5FA' },
    { icon: 'search-outline',   label: 'Search',    onPress: () => navigate('Search'),    accent: '#4ADE80' },
  ];

  return (
    <>
      <Animated.View
        style={[StyleSheet.absoluteFill, styles.backdrop, { opacity: backdropAnim }]}
        pointerEvents="auto"
      >
        <TouchableOpacity style={StyleSheet.absoluteFill} onPress={closeDrawer} activeOpacity={1} />
      </Animated.View>

      <Animated.View style={[styles.drawer, { transform: [{ translateX: slideAnim }] }]}>
        <LinearGradient colors={['#060C1F', '#0B1330', '#0D1A3F']} style={styles.fill}>

          {/* ── Header ── */}
          <LinearGradient colors={['#0F1C42', '#162354']} style={styles.drawerHeader}>
            <Image source={require('../../../assets/images/islamicbackground.png')} style={styles.drawerHeaderBg} resizeMode="cover" />
            <Image source={require('../../../assets/images/kabba.png')} style={styles.drawerKabba} resizeMode="contain" />
            <View style={styles.drawerHeaderDecor} />

            <View style={styles.appLogoRow}>
              <Image source={require('../../../assets/icon.png')} style={styles.appIcon} resizeMode="cover" />
              <View style={{ flex: 1 }}>
                <Text style={styles.appName}>IlmAI</Text>
                <Text style={styles.appTagline}>Your Islamic Companion</Text>
              </View>
              <TouchableOpacity onPress={closeDrawer} style={styles.closeBtn} activeOpacity={0.7}>
                <Ionicons name="close" size={20} color="rgba(255,255,255,0.35)" />
              </TouchableOpacity>
            </View>

            {/* Hijri date + streak */}
            <View style={styles.metaRow}>
              <View style={styles.metaPill}>
                <Ionicons name="moon-outline" size={10} color={colors.gold[400]} />
                <Text style={styles.metaPillText}>{hijri.formatted}</Text>
              </View>
              {currentStreak > 0 && (
                <View style={styles.streakPill}>
                  <Ionicons name="flame" size={10} color="#F97316" />
                  <Text style={styles.streakText}>{currentStreak} day streak</Text>
                </View>
              )}
            </View>
          </LinearGradient>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
            <Section label="PRAYER & WORSHIP"  items={WORSHIP}  onClose={closeDrawer} />
            <Section label="LEARN & DISCOVER"  items={LEARN}    onClose={closeDrawer} />
            <Section label="HISTORY & SEERAH"  items={HISTORY}  onClose={closeDrawer} />
            <Section label="LIBRARY"            items={LIBRARY}  onClose={closeDrawer} />

            {/* Settings standalone */}
            <TouchableOpacity
              style={styles.settingsRow}
              onPress={() => { closeDrawer(); setTimeout(() => navigate('Settings'), 150); }}
              activeOpacity={0.7}
            >
              <View style={[styles.navIcon, { backgroundColor: 'rgba(148,163,184,0.12)' }]}>
                <Ionicons name="settings-outline" size={17} color="rgba(255,255,255,0.35)" />
              </View>
              <Text style={styles.settingsLabel}>Settings</Text>
              <Ionicons name="chevron-forward" size={12} color="rgba(255,255,255,0.16)" />
            </TouchableOpacity>

            <View style={styles.footer}>
              <Text style={styles.footerText}>IlmAI v1.0.0</Text>
              <Text style={styles.footerSub}>No ads · No tracking · Open knowledge</Text>
            </View>
          </ScrollView>
        </LinearGradient>
      </Animated.View>
    </>
  );
}

const styles = StyleSheet.create({
  backdrop: { backgroundColor: 'rgba(6,12,31,0.72)', zIndex: 100 },
  drawer: {
    position: 'absolute', left: 0, top: 0, bottom: 0,
    width: DRAWER_WIDTH, zIndex: 101, ...shadow.lg,
  },
  fill: { flex: 1 },

  drawerHeader: {
    paddingTop: spacing.xxxl + spacing.lg,
    paddingBottom: spacing.lg,
    paddingHorizontal: spacing.lg,
    overflow: 'hidden',
    gap: spacing.md,
  },
  drawerHeaderBg: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    width: '100%', height: '100%', opacity: 0.1,
  },
  drawerKabba: {
    position: 'absolute', right: -8, bottom: -8,
    width: 70, height: 70, opacity: 0.25,
  },
  drawerHeaderDecor: {
    position: 'absolute', right: -30, top: -30,
    width: 120, height: 120, borderRadius: 60,
    borderWidth: 1, borderColor: 'rgba(245,158,11,0.12)',
  },
  navImage: { width: 18, height: 18 },

  appLogoRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  appIcon: { width: 42, height: 42, borderRadius: radius.sm },
  appName: { ...typography.heading, color: colors.white, fontSize: 17 },
  appTagline: { fontSize: 10, color: 'rgba(255,255,255,0.3)', marginTop: 2 },
  closeBtn: { padding: 4 },

  metaRow: { flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' },
  metaPill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(245,158,11,0.10)',
    borderRadius: radius.pill, borderWidth: 1,
    borderColor: 'rgba(245,158,11,0.18)',
    paddingHorizontal: 8, paddingVertical: 4,
  },
  metaPillText: { fontSize: 10, color: colors.gold[300], fontWeight: '600' },
  streakPill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(249,115,22,0.10)',
    borderRadius: radius.pill, borderWidth: 1,
    borderColor: 'rgba(249,115,22,0.18)',
    paddingHorizontal: 8, paddingVertical: 4,
  },
  streakText: { fontSize: 10, color: '#FD8A4B', fontWeight: '600' },

  content: { paddingBottom: spacing.xxxl, paddingTop: spacing.xs },

  sectionTitle: {
    fontSize: 9, fontWeight: '800', letterSpacing: 2.2,
    color: 'rgba(255,255,255,0.16)',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl, paddingBottom: spacing.sm,
  },
  sectionCard: {
    marginHorizontal: spacing.md,
    backgroundColor: 'rgba(255,255,255,0.035)',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    overflow: 'hidden',
  },
  separator: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.04)',
    marginLeft: 52 + spacing.md * 2,
  },

  navRow: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    paddingHorizontal: spacing.md, paddingVertical: 11,
  },
  navIcon: {
    width: 32, height: 32, borderRadius: radius.xs,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.055)',
  },
  navLabel: { ...typography.bodySmall, color: 'rgba(255,255,255,0.72)', flex: 1, fontWeight: '500' },
  badge: {
    backgroundColor: 'rgba(245,158,11,0.15)', borderRadius: radius.pill,
    paddingHorizontal: 6, paddingVertical: 2,
    borderWidth: 1, borderColor: 'rgba(245,158,11,0.22)',
  },
  badgeText: { fontSize: 10, color: colors.gold[300] },

  settingsRow: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    marginHorizontal: spacing.md, marginTop: spacing.lg,
    paddingHorizontal: spacing.md, paddingVertical: 11,
    backgroundColor: 'rgba(255,255,255,0.025)',
    borderRadius: radius.md, borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  settingsLabel: { ...typography.bodySmall, color: 'rgba(255,255,255,0.4)', flex: 1, fontWeight: '500' },

  footer: { paddingHorizontal: spacing.lg, paddingTop: spacing.xl, gap: 3 },
  footerText: { fontSize: 11, color: 'rgba(255,255,255,0.18)', fontWeight: '700' },
  footerSub: { fontSize: 10, color: 'rgba(255,255,255,0.10)' },
});
