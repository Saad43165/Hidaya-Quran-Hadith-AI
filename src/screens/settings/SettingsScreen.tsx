import React, { useState } from 'react';
import { Alert, I18nManager, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SectionTitle } from '../../components/common/SectionTitle';
import { useAppStore } from '../../store/useAppStore';
import { useAuthStore } from '../../store/useAuthStore';
import { useThemeStore } from '../../store/useThemeStore';
import { useStreakStore } from '../../store/useStreakStore';
import { RTL_LANGUAGES } from '../../i18n';
import { getDb, ensureDatabaseReady } from '../../services/db/database';
import { SupportedLanguage } from '../../types/models';
import { colors, gradients, radius, shadow, spacing, typography } from '../../theme';
import type { RootStackParamList } from '../../navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const LANGS: { code: SupportedLanguage; label: string; native: string }[] = [
  { code: 'en', label: 'English', native: 'English' },
  { code: 'ur', label: 'Urdu',    native: 'اردو' },
  { code: 'ar', label: 'Arabic',  native: 'العربية' },
];

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

  const handleLang = async (code: SupportedLanguage) => {
    await setLanguage(code);
    await i18n.changeLanguage(code);
    if (I18nManager.isRTL !== RTL_LANGUAGES.includes(code)) I18nManager.forceRTL(RTL_LANGUAGES.includes(code));
  };

  const clearCache = () => Alert.alert(t('settings.clearCache'), 'Previously-viewed Quran and Hadith pages will re-fetch next time you open them. Bookmarks are kept.', [
    { text: 'Cancel', style: 'cancel' },
    { text: 'Clear', style: 'destructive', onPress: async () => {
      await ensureDatabaseReady(); await getDb().runAsync('DELETE FROM content_cache');
      setCacheCleared(true); setTimeout(() => setCacheCleared(false), 2500);
    }},
  ]);

  const clearBookmarks = () => Alert.alert(t('settings.clearBookmarks'), 'All saved ayahs and hadiths will be permanently deleted.', [
    { text: 'Cancel', style: 'cancel' },
    { text: 'Delete All', style: 'destructive', onPress: async () => {
      await ensureDatabaseReady(); await getDb().runAsync('DELETE FROM bookmarks');
    }},
  ]);

  return (
    <ScrollView style={styles.root} showsVerticalScrollIndicator={false}>
      {/* Account card */}
      <LinearGradient colors={gradients.heroNavy} style={styles.accountCard}>
        <View style={styles.accountAvatar}>
          <Text style={styles.avatarLetter}>
            {isGuest ? 'G' : (user?.displayName?.[0] ?? user?.email?.[0] ?? 'U')}
          </Text>
        </View>
        <View style={styles.accountInfo}>
          <Text style={styles.accountName} numberOfLines={1}>
            {isGuest ? t('settings.guestLabel') : (user?.displayName || user?.email)}
          </Text>
          <Text style={styles.accountSub}>{isGuest ? 'Guest session' : 'Signed in'}</Text>
        </View>
        <TouchableOpacity style={styles.signOutBtn} onPress={signOut}>
          <Ionicons name="log-out-outline" size={16} color={colors.gold[400]} />
          <Text style={styles.signOutText}>{t('settings.signOut')}</Text>
        </TouchableOpacity>
      </LinearGradient>

      <View style={styles.body}>
        {/* Language */}
        <SectionTitle title={t('settings.language')} />
        <View style={styles.langGrid}>
          {LANGS.map(lang => (
            <TouchableOpacity
              key={lang.code}
              style={[styles.langTile, language === lang.code && styles.langTileActive]}
              onPress={() => handleLang(lang.code)}
            >
              {language === lang.code && (
                <View style={styles.checkMark}><Ionicons name="checkmark" size={10} color={colors.white} /></View>
              )}
              <Text style={[styles.langNative, language === lang.code && styles.langTextActive]}>{lang.native}</Text>
              <Text style={[styles.langLabel, language === lang.code && styles.langSubActive]}>{lang.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Data */}
        {/* Reading Stats */}
        <SectionTitle title="Reading Stats" />
        <View style={styles.actionGroup}>
          <View style={styles.actionRow}>
            <Ionicons name="flame" size={18} color="#E8622A" />
            <Text style={styles.actionLabel}>Current Streak</Text>
            <Text style={styles.statValue}>{currentStreak} days</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.actionRow}>
            <Ionicons name="trophy-outline" size={18} color={colors.gold[600]} />
            <Text style={styles.actionLabel}>Longest Streak</Text>
            <Text style={styles.statValue}>{longestStreak} days</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.actionRow}>
            <Ionicons name="calendar-outline" size={18} color={colors.navy[600]} />
            <Text style={styles.actionLabel}>Total Days Read</Text>
            <Text style={styles.statValue}>{totalDaysRead} days</Text>
          </View>
        </View>

        {/* Appearance */}
        <SectionTitle title="Appearance" />
        <View style={styles.actionGroup}>
          <View style={styles.actionRow}>
            <Ionicons name={isDark ? 'moon' : 'sunny-outline'} size={18} color={isDark ? colors.gold[400] : colors.navy[700]} />
            <Text style={styles.actionLabel}>Dark Mode</Text>
            <Switch
              value={isDark}
              onValueChange={toggleTheme}
              trackColor={{ true: colors.navy[700], false: colors.parchment[300] }}
              thumbColor={colors.white}
            />
          </View>
        </View>

        <SectionTitle title={t('settings.dataStorage')} />
        <View style={styles.actionGroup}>
          <TouchableOpacity style={styles.actionRow} onPress={() => nav.navigate('Bookmarks')}>
            <Ionicons name="bookmark-outline" size={18} color={colors.navy[700]} />
            <Text style={styles.actionLabel}>{t('settings.viewBookmarks')}</Text>
            <Ionicons name="chevron-forward" size={14} color={colors.parchment[400]} />
          </TouchableOpacity>
          <View style={styles.divider} />
          <TouchableOpacity style={styles.actionRow} onPress={clearCache}>
            <Ionicons name="cloud-offline-outline" size={18} color={colors.navy[700]} />
            <View style={styles.actionTextBlock}>
              <Text style={styles.actionLabel}>{cacheCleared ? `✓ ${t('settings.cacheCleared')}` : t('settings.clearCache')}</Text>
              <Text style={styles.actionMeta}>{t('settings.clearCacheMeta')}</Text>
            </View>
          </TouchableOpacity>
          <View style={styles.divider} />
          <TouchableOpacity style={styles.actionRow} onPress={clearBookmarks}>
            <Ionicons name="trash-outline" size={18} color={colors.semantic.error} />
            <Text style={[styles.actionLabel, { color: colors.semantic.error }]}>{t('settings.clearBookmarks')}</Text>
          </TouchableOpacity>
        </View>

        {/* About */}
        <SectionTitle title={t('settings.about')} />
        <View style={styles.aboutCard}>
          <Text style={styles.aboutTitle}>KitaabAI</Text>
          <Text style={styles.aboutVersion}>Version 1.0.0</Text>
          <Text style={styles.aboutDesc}>
            Quran · Hadith · Prayer Times · Qibla{'\n'}
            Library · AI Assistant · Offline Mode
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.parchment[50] },
  accountCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.xl,
    paddingTop: spacing.xxl,
    gap: spacing.md,
  },
  accountAvatar: {
    width: 48, height: 48, borderRadius: 16,
    backgroundColor: 'rgba(212,169,62,0.2)',
    alignItems: 'center', justifyContent: 'center',
  },
  avatarLetter: { ...typography.heading, color: colors.gold[400] },
  accountInfo: { flex: 1 },
  accountName: { ...typography.subheading, color: colors.white },
  accountSub: { ...typography.caption, color: 'rgba(255,255,255,0.45)', marginTop: 2 },
  signOutBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  signOutText: { ...typography.caption, color: colors.gold[400], fontWeight: '600' },
  body: { padding: spacing.lg, gap: spacing.xl },
  langGrid: { flexDirection: 'row', gap: spacing.sm },
  langTile: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: radius.md,
    padding: spacing.md,
    alignItems: 'center',
    gap: 2,
    borderWidth: 1.5,
    borderColor: colors.parchment[200],
    ...shadow.sm,
    position: 'relative',
  },
  langTileActive: { backgroundColor: colors.navy[900], borderColor: colors.navy[900] },
  checkMark: {
    position: 'absolute', top: 6, right: 6,
    width: 16, height: 16, borderRadius: 8,
    backgroundColor: colors.gold[500],
    alignItems: 'center', justifyContent: 'center',
  },
  langNative: { fontSize: 17, fontWeight: '600', color: colors.parchment[950] },
  langLabel: { ...typography.caption, color: colors.parchment[500] },
  langTextActive: { color: colors.white },
  langSubActive: { color: 'rgba(255,255,255,0.5)' },
  actionGroup: {
    backgroundColor: colors.white,
    borderRadius: radius.md,
    overflow: 'hidden',
    ...shadow.sm,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  actionTextBlock: { flex: 1 },
  actionLabel: { ...typography.bodySmall, color: colors.parchment[950], fontWeight: '500', flex: 1 },
  actionMeta: { ...typography.caption, color: colors.parchment[500] },
  statValue: { ...typography.subheading, color: colors.navy[800] },
  divider: { height: 1, backgroundColor: colors.parchment[100], marginLeft: spacing.lg + 18 + spacing.md },
  aboutCard: {
    backgroundColor: colors.white,
    borderRadius: radius.md,
    padding: spacing.xl,
    alignItems: 'center',
    gap: spacing.xs,
    ...shadow.sm,
  },
  aboutTitle: { ...typography.displayMd, color: colors.navy[900] },
  aboutVersion: { ...typography.caption, color: colors.parchment[500] },
  aboutDesc: { ...typography.bodySmall, color: colors.parchment[600], textAlign: 'center', marginTop: spacing.sm, lineHeight: 22 },
});
