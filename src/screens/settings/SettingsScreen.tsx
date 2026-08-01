import React, { useState } from 'react';
import {
  Alert, I18nManager, Linking, Platform, ScrollView, Share, StatusBar,
  StyleSheet, Switch, Text, TouchableOpacity, View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAppStore } from '../../store/useAppStore';
import { useAuthStore } from '../../store/useAuthStore';
import { useThemeStore } from '../../store/useThemeStore';
import { useStreakStore } from '../../store/useStreakStore';
import { RTL_LANGUAGES } from '../../i18n';
import { getDb, ensureDatabaseReady } from '../../services/db/database';
import { SupportedLanguage } from '../../types/models';
import { CustomAlert } from '../../components/common/CustomAlert';
import { colors, radius, shadow, spacing, typography } from '../../theme';
import { darkColors } from '../../theme/darkColors';
import type { RootStackParamList } from '../../navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const LANGS: { code: SupportedLanguage; label: string; native: string; flag: string }[] = [
  { code: 'en', label: 'English',  native: 'English',  flag: 'US' },
  { code: 'ur', label: 'Urdu',     native: 'اردو',      flag: 'PK' },
  { code: 'ar', label: 'Arabic',   native: 'العربية',   flag: 'SA' },
];

// Icon badge config
interface RowCfg { icon: keyof typeof Ionicons.glyphMap; iconColor: string; iconBg: string }
const ROW_CFG: Record<string, RowCfg> = {
  bookmarks:  { icon: 'bookmark',         iconColor: '#60A5FA', iconBg: 'rgba(96,165,250,0.15)'  },
  cache:      { icon: 'cloud-offline',    iconColor: '#C084FC', iconBg: 'rgba(192,132,252,0.15)' },
  delete:     { icon: 'trash',            iconColor: '#F87171', iconBg: 'rgba(248,113,113,0.12)' },
  dark:       { icon: 'moon',             iconColor: '#818CF8', iconBg: 'rgba(129,140,248,0.15)' },
  light:      { icon: 'sunny',            iconColor: '#F59E0B', iconBg: 'rgba(245,158,11,0.15)'  },
  rate:       { icon: 'star',             iconColor: '#F59E0B', iconBg: 'rgba(245,158,11,0.15)'  },
  share:      { icon: 'share-social',     iconColor: '#4ADE80', iconBg: 'rgba(74,222,128,0.15)'  },
};

function SettingRow({ cfgKey, label, subtitle, right, onPress, destructive }: {
  cfgKey: keyof typeof ROW_CFG;
  label: string;
  subtitle?: string;
  right?: React.ReactNode;
  onPress?: () => void;
  destructive?: boolean;
}) {
  const cfg = ROW_CFG[cfgKey];
  const Wrapper = onPress ? TouchableOpacity : View;
  return (
    <Wrapper style={styles.settingRow} onPress={onPress} activeOpacity={0.72}>
      <View style={[styles.settingIcon, { backgroundColor: cfg.iconBg }]}>
        <Ionicons name={cfg.icon} size={17} color={cfg.iconColor} />
      </View>
      <View style={styles.settingText}>
        <Text style={[styles.settingLabel, destructive && { color: '#F87171' }]}>{label}</Text>
        {subtitle ? <Text style={styles.settingSubtitle}>{subtitle}</Text> : null}
      </View>
      {right ?? (onPress ? <Ionicons name="chevron-forward" size={14} color={colors.parchment[400]} /> : null)}
    </Wrapper>
  );
}

function Divider() {
  return <View style={styles.groupDivider} />;
}

function GroupLabel({ label }: { label: string }) {
  return <Text style={styles.groupLabel}>{label}</Text>;
}

function SettingCard({ children }: { children: React.ReactNode }) {
  return <View style={styles.settingCard}>{children}</View>;
}

export function SettingsScreen() {
  const { t, i18n } = useTranslation();
  const nav = useNavigation<Nav>();
  const language = useAppStore(s => s.language);
  const setLanguage = useAppStore(s => s.setLanguage);
  const user = useAuthStore(s => s.user);
  const isGuest = useAuthStore(s => s.isGuest);
  const signOut = useAuthStore(s => s.signOut);
  const { isDark, toggleTheme } = useThemeStore();
  const { currentStreak, longestStreak, totalDaysRead } = useStreakStore();
  const [cacheCleared, setCacheCleared] = useState(false);

  const [alertConfig, setAlertConfig] = useState<{
    visible: boolean; title: string; message?: string; buttons?: any[];
  }>({ visible: false, title: '' });
  const showAlert = (title: string, message?: string, buttons?: any[]) => setAlertConfig({ visible: true, title, message, buttons });
  const hideAlert = () => setAlertConfig(prev => ({ ...prev, visible: false }));

  const handleRateApp = () => {
    const url = Platform.OS === 'ios'
      ? 'itms-apps://itunes.apple.com/app/id'
      : 'market://details?id=com.hidaya.app';
    Linking.openURL(url).catch(() => {
      Linking.openURL('https://play.google.com/store/apps/details?id=com.hidaya.app').catch(() => {});
    });
  };

  const handleShareApp = () => {
    Share.share({
      message: 'I\'ve been using Hidaya — a beautiful Islamic app with Quran, Hadith, Prayer Times, and an AI assistant. Check it out!',
      url: 'https://play.google.com/store/apps/details?id=com.hidaya.app',
    }).catch(() => {});
  };

  const handleLang = async (code: SupportedLanguage) => {
    await setLanguage(code);
    await i18n.changeLanguage(code);
    
    const shouldBeRTL = RTL_LANGUAGES.includes(code);
    if (I18nManager.isRTL !== shouldBeRTL) {
      I18nManager.forceRTL(shouldBeRTL);
      showAlert(
        'Language Changed',
        'Please restart the application for the layout changes (RTL/LTR) to take full effect.',
        [{ text: 'OK' }]
      );
    }
  };

  const clearCache = () => showAlert('Clear Cache', 'Quran and Hadith pages will re-fetch on next view. Bookmarks are kept.', [
    { text: 'Cancel', style: 'cancel' },
    { text: 'Clear', style: 'destructive', onPress: async () => {
      await ensureDatabaseReady(); await getDb().runAsync('DELETE FROM content_cache');
      setCacheCleared(true); setTimeout(() => setCacheCleared(false), 3000);
    }},
  ]);

  const clearBookmarks = () => showAlert('Delete All Bookmarks', 'This cannot be undone.', [
    { text: 'Cancel', style: 'cancel' },
    { text: 'Delete', style: 'destructive', onPress: async () => {
      await ensureDatabaseReady(); await getDb().runAsync('DELETE FROM bookmarks');
    }},
  ]);

  const avatarLetter = isGuest ? 'G' : (user?.displayName?.[0] ?? user?.email?.[0] ?? 'U').toUpperCase();

  return (
    <>
    <ScrollView style={[styles.root, { backgroundColor: isDark ? darkColors.background : colors.parchment[50] }]} showsVerticalScrollIndicator={false}>
      <StatusBar barStyle="light-content" />

      {/* ── Account Hero ── */}
      <LinearGradient colors={['#060C1F', '#0B1330', '#1E2F6B']} style={styles.accountHero}>
        <View style={styles.heroDecor1} />
        <View style={styles.heroDecor2} />

        <View style={styles.accountRow}>
          {/* Avatar */}
          <LinearGradient colors={['rgba(245,158,11,0.3)', 'rgba(245,158,11,0.1)']} style={styles.avatar}>
            <Text style={styles.avatarLetter}>{avatarLetter}</Text>
          </LinearGradient>
          <View style={styles.accountInfo}>
            <Text style={styles.accountName} numberOfLines={1}>
              {isGuest ? 'Guest User' : (user?.displayName || user?.email || 'User')}
            </Text>
            <View style={styles.statusRow}>
              <View style={[styles.statusDot, { backgroundColor: isGuest ? '#FB923C' : '#4ADE80' }]} />
              <Text style={styles.statusText}>{isGuest ? 'Guest session' : 'Signed in'}</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.signOutBtn} onPress={signOut}>
            <Ionicons name="log-out-outline" size={14} color={colors.gold[300]} />
            <Text style={styles.signOutText}>Sign out</Text>
          </TouchableOpacity>
        </View>

        {/* Stats row */}
        <View style={styles.statsRow}>
          {[
            { label: 'STREAK',     value: `${currentStreak}`, unit: 'd', color: '#F97316', icon: 'flame' as const     },
            { label: 'BEST',       value: `${longestStreak}`, unit: 'd', color: '#F59E0B', icon: 'trophy-outline' as const },
            { label: 'TOTAL DAYS', value: `${totalDaysRead}`, unit: 'd', color: '#60A5FA', icon: 'calendar-outline' as const },
          ].map((s, i) => (
            <View key={i} style={styles.statBox}>
              <Ionicons name={s.icon} size={15} color={s.color} />
              <Text style={[styles.statValue, { color: s.color }]}>{s.value}<Text style={styles.statUnit}>{s.unit}</Text></Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </View>
      </LinearGradient>

      <View style={styles.body}>

        {/* ── Language ── */}
        <GroupLabel label="LANGUAGE" />
        <View style={styles.langGrid}>
          {LANGS.map(lang => (
            <TouchableOpacity
              key={lang.code}
              style={[styles.langTile, language === lang.code && styles.langTileActive]}
              onPress={() => handleLang(lang.code)}
              activeOpacity={0.8}
            >
              {language === lang.code && (
                <View style={styles.langCheck}>
                  <Ionicons name="checkmark" size={10} color={colors.white} />
                </View>
              )}
              {/* Country code badge instead of emoji flag */}
              <View style={[styles.langFlagBadge, language === lang.code && { backgroundColor: colors.gold[500] }]}>
                <Text style={[styles.langFlagText, language === lang.code && { color: colors.navy[900] }]}>
                  {lang.flag}
                </Text>
              </View>
              <Text style={[styles.langNative, language === lang.code && { color: colors.white }]}>{lang.native}</Text>
              <Text style={[styles.langLabel, language === lang.code && { color: 'rgba(255,255,255,0.45)' }]}>{lang.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── Appearance ── */}
        <GroupLabel label="APPEARANCE" />
        <SettingCard>
          <SettingRow
            cfgKey={isDark ? 'dark' : 'light'}
            label="Dark Mode"
            subtitle="Switch between light and dark theme"
            right={
              <Switch
                value={isDark}
                onValueChange={toggleTheme}
                trackColor={{ true: colors.navy[600], false: colors.parchment[300] }}
                thumbColor={colors.white}
              />
            }
          />
        </SettingCard>

        {/* ── Data ── */}
        <GroupLabel label="DATA & PRIVACY" />
        <SettingCard>
          <SettingRow cfgKey="bookmarks" label="My Bookmarks" subtitle="View saved ayahs and hadiths" onPress={() => nav.navigate('Bookmarks')} />
          <Divider />
          <SettingRow
            cfgKey="cache"
            label={cacheCleared ? 'Cache Cleared' : 'Clear Content Cache'}
            subtitle="Re-fetches pages on next view"
            onPress={clearCache}
          />
          <Divider />
          <SettingRow cfgKey="delete" label="Delete All Bookmarks" subtitle="Cannot be undone" onPress={clearBookmarks} destructive />
        </SettingCard>

        {/* ── About ── */}
        <GroupLabel label="ABOUT" />
        <SettingCard>
          <SettingRow cfgKey="rate" label="Rate the App" subtitle="Support us with a review" onPress={handleRateApp} />
          <Divider />
          <SettingRow cfgKey="share" label="Share App" subtitle="Recommend to friends & family" onPress={handleShareApp} />
        </SettingCard>

        <View style={styles.aboutCard}>
          <LinearGradient colors={['#0B1330', '#162354']} style={styles.aboutGrad}>
            <View style={styles.aboutDecor} />
            <Text style={[styles.aboutAr, { fontFamily: 'Amiri_400Regular' }]}>كِتَاب</Text>
            <Text style={styles.aboutTitle}>KitaabAI</Text>
            <Text style={styles.aboutVersion}>Version 1.0.0</Text>
          </LinearGradient>
          <View style={styles.aboutBody}>
            {[
              { icon: 'book-outline' as const,                color: '#F59E0B', title: 'Quran',          desc: 'All 114 Surahs with translation'   },
              { icon: 'chatbox-outline' as const,             color: '#38BDF8', title: 'Hadith',         desc: 'Authentic collections'             },
              { icon: 'time-outline' as const,                color: '#4ADE80', title: 'Prayer Times',   desc: 'GPS-based accurate prayer times'   },
              { icon: 'radio-button-on-outline' as const,     color: '#C084FC', title: 'Qibla',          desc: 'Compass-based direction'           },
              { icon: 'chatbubble-ellipses-outline' as const, color: '#60A5FA', title: 'AI Assistant',   desc: 'Context-aware Islamic AI'          },
              { icon: 'cloud-offline-outline' as const,       color: '#818CF8', title: 'Offline Access', desc: 'View content without internet'     },
            ].map(f => (
              <View key={f.title} style={styles.featureRow}>
                <View style={[styles.featureIconWrap, { backgroundColor: f.color + '18' }]}>
                  <Ionicons name={f.icon} size={16} color={f.color} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.featureTitle}>{f.title}</Text>
                  <Text style={styles.featureDesc}>{f.desc}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

      </View>
    </ScrollView>
    <CustomAlert
      visible={alertConfig.visible}
      title={alertConfig.title}
      message={alertConfig.message}
      buttons={alertConfig.buttons}
      onDismiss={hideAlert}
    />
    </>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.parchment[50] },

  // Account hero
  accountHero: { paddingTop: spacing.xl + spacing.xl, paddingBottom: spacing.xl, paddingHorizontal: spacing.lg, gap: spacing.xl, overflow: 'hidden' },
  heroDecor1: { position: 'absolute', right: -50, top: -50, width: 180, height: 180, borderRadius: 90, borderWidth: 1, borderColor: 'rgba(245,158,11,0.15)' },
  heroDecor2: { position: 'absolute', left: -30, bottom: -40, width: 120, height: 120, borderRadius: 60, borderWidth: 1, borderColor: 'rgba(245,158,11,0.08)' },
  accountRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  avatar: { width: 52, height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(245,158,11,0.35)' },
  avatarLetter: { ...typography.heading, color: '#F59E0B' },
  accountInfo: { flex: 1, gap: 4 },
  accountName: { ...typography.subheading, color: colors.white },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { ...typography.caption, color: 'rgba(255,255,255,0.4)' },
  signOutBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(245,158,11,0.1)', borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: 6, borderWidth: 1, borderColor: 'rgba(245,158,11,0.22)' },
  signOutText: { fontSize: 12, color: colors.gold[300], fontWeight: '600' },

  // Stats
  statsRow: { flexDirection: 'row', gap: spacing.sm, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: radius.md, padding: spacing.md, borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)' },
  statBox: { flex: 1, alignItems: 'center', gap: 3 },
  statValue: { fontSize: 22, fontWeight: '800', letterSpacing: -0.5 },
  statUnit: { fontSize: 13, fontWeight: '600' },
  statLabel: { fontSize: 9, color: 'rgba(255,255,255,0.3)', fontWeight: '700', letterSpacing: 1.2 },

  // Body
  body: { padding: spacing.lg, gap: spacing.md },
  groupLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 1.8, color: colors.parchment[500], marginTop: spacing.sm, marginBottom: -spacing.xs, paddingLeft: 2 },

  // Language
  langGrid: { flexDirection: 'row', gap: spacing.sm },
  langTile: { flex: 1, backgroundColor: colors.white, borderRadius: radius.md, padding: spacing.md, alignItems: 'center', gap: 4, borderWidth: 1.5, borderColor: colors.parchment[200], ...shadow.xs, position: 'relative', overflow: 'hidden' },
  langTileActive: { backgroundColor: colors.navy[900], borderColor: colors.navy[700] },
  langCheck: { position: 'absolute', top: 6, right: 6, width: 16, height: 16, borderRadius: 8, backgroundColor: colors.gold[500], alignItems: 'center', justifyContent: 'center' },
  langFlagBadge: { width: 36, height: 28, borderRadius: 6, backgroundColor: colors.parchment[100], alignItems: 'center', justifyContent: 'center' },
  langFlagText: { fontSize: 11, fontWeight: '800', color: colors.parchment[600], letterSpacing: 0.5 },
  langNative: { fontSize: 15, fontWeight: '700', color: colors.parchment[950] },
  langLabel: { fontSize: 11, color: colors.parchment[500], fontWeight: '500' },

  // Setting group card
  settingCard: { backgroundColor: colors.white, borderRadius: radius.md, overflow: 'hidden', ...shadow.sm },
  settingRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingHorizontal: spacing.lg, paddingVertical: spacing.md + 2 },
  settingIcon: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  settingText: { flex: 1 },
  settingLabel: { ...typography.bodySmall, color: colors.parchment[950], fontWeight: '500' },
  settingSubtitle: { fontSize: 11, color: colors.parchment[500], marginTop: 2 },
  groupDivider: { height: 1, backgroundColor: colors.parchment[100], marginLeft: spacing.lg + 34 + spacing.md },

  // About
  aboutCard: { borderRadius: radius.md, overflow: 'hidden', ...shadow.md },
  aboutGrad: { padding: spacing.xl, alignItems: 'center', gap: spacing.xs, overflow: 'hidden' },
  aboutDecor: { position: 'absolute', right: -40, top: -40, width: 160, height: 160, borderRadius: 80, borderWidth: 1, borderColor: 'rgba(245,158,11,0.1)' },
  aboutAr: { fontSize: 28, color: colors.gold[300] },
  aboutTitle: { ...typography.displayMd, color: colors.white },
  aboutVersion: { ...typography.caption, color: 'rgba(255,255,255,0.3)' },
  aboutBody: { backgroundColor: colors.white, padding: spacing.lg, gap: spacing.md },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  featureIconWrap: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  featureTitle: { ...typography.bodySmall, color: colors.parchment[950], fontWeight: '600' },
  featureDesc: { fontSize: 11, color: colors.parchment[500], marginTop: 1 },
});
