import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator, Alert, Image, Linking, Platform, ScrollView, Share, StatusBar,
  StyleSheet, Text, TouchableOpacity, View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { BackButton } from '../../components/common/BackButton';
import { useAppStore } from '../../store/useAppStore';
import { useAuthStore } from '../../store/useAuthStore';
import { useThemeStore, ThemeMode } from '../../store/useThemeStore';
import { useStreakStore } from '../../store/useStreakStore';
import { getDb, ensureDatabaseReady } from '../../services/db/database';
import { fetchSurahDetail } from '../../services/api/quranApi';
import { CustomAlert } from '../../components/common/CustomAlert';
import { colors, radius, shadow, spacing, typography } from '../../theme';
import { darkColors } from '../../theme/darkColors';
import type { RootStackParamList } from '../../navigation/types';
import {
  loadNotifOffsets, saveNotifOffsets,
  NotifOffset, PrayerNotifOffsets, DEFAULT_OFFSETS,
  loadNotifSound, saveNotifSound, NotifSound,
} from '../../services/notifications/prayerNotifications';
import { PrayerName, PRAYER_NAMES } from '../../types/models';

type Nav = NativeStackNavigationProp<RootStackParamList>;

// Icon badge config
interface RowCfg { icon: keyof typeof Ionicons.glyphMap; iconColor: string; iconBg: string }
const ROW_CFG: Record<string, RowCfg> = {
  bookmarks:  { icon: 'bookmark',         iconColor: '#60A5FA', iconBg: 'rgba(96,165,250,0.15)'  },
  cache:      { icon: 'cloud-offline',    iconColor: '#C084FC', iconBg: 'rgba(192,132,252,0.15)' },
  download:   { icon: 'cloud-download',   iconColor: '#4ADE80', iconBg: 'rgba(74,222,128,0.15)'  },
  delete:     { icon: 'trash',            iconColor: '#F87171', iconBg: 'rgba(248,113,113,0.12)' },
  dark:       { icon: 'moon',             iconColor: '#818CF8', iconBg: 'rgba(129,140,248,0.15)' },
  light:      { icon: 'sunny',            iconColor: '#F59E0B', iconBg: 'rgba(245,158,11,0.15)'  },
  rate:       { icon: 'star',             iconColor: '#F59E0B', iconBg: 'rgba(245,158,11,0.15)'  },
  share:      { icon: 'share-social',     iconColor: '#4ADE80', iconBg: 'rgba(74,222,128,0.15)'  },
};

function SettingRow({ cfgKey, label, subtitle, right, onPress, destructive, isDark }: {
  cfgKey: keyof typeof ROW_CFG;
  label: string;
  subtitle?: string;
  right?: React.ReactNode;
  onPress?: () => void;
  destructive?: boolean;
  isDark?: boolean;
}) {
  const cfg = ROW_CFG[cfgKey];
  const Wrapper = onPress ? TouchableOpacity : View;
  return (
    <Wrapper style={styles.settingRow} onPress={onPress} activeOpacity={0.72}>
      <View style={[styles.settingIcon, { backgroundColor: cfg.iconBg }]}>
        <Ionicons name={cfg.icon} size={17} color={cfg.iconColor} />
      </View>
      <View style={styles.settingText}>
        <Text style={[styles.settingLabel, { color: isDark ? '#F4F1EC' : colors.parchment[950] }, destructive && { color: '#F87171' }]}>{label}</Text>
        {subtitle ? <Text style={[styles.settingSubtitle, { color: isDark ? 'rgba(244,241,236,0.45)' : colors.parchment[500] }]}>{subtitle}</Text> : null}
      </View>
      {right ?? (onPress ? <Ionicons name="chevron-forward" size={14} color={isDark ? 'rgba(244,241,236,0.3)' : colors.parchment[400]} /> : null)}
    </Wrapper>
  );
}

function Divider({ isDark }: { isDark?: boolean }) {
  return <View style={[styles.groupDivider, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : colors.parchment[100] }]} />;
}

function GroupLabel({ label, isDark }: { label: string; isDark?: boolean }) {
  return <Text style={[styles.groupLabel, { color: isDark ? 'rgba(244,241,236,0.35)' : colors.parchment[500] }]}>{label}</Text>;
}

function SettingCard({ children, isDark }: { children: React.ReactNode; isDark?: boolean }) {
  return <View style={[styles.settingCard, { backgroundColor: isDark ? '#0F1C42' : colors.white }]}>{children}</View>;
}

export function SettingsScreen() {
  const { t } = useTranslation();
  const nav = useNavigation<Nav>();
  const user = useAuthStore(s => s.user);
  const isGuest = useAuthStore(s => s.isGuest);
  const signOut = useAuthStore(s => s.signOut);
  const { mode: themeMode, isDark, setTheme } = useThemeStore();
  const { currentStreak, longestStreak, totalDaysRead } = useStreakStore();
  const [cacheCleared, setCacheCleared] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState<number | null>(null);
  const [notifOffsets, setNotifOffsets] = useState<PrayerNotifOffsets>({ ...DEFAULT_OFFSETS });
  const [notifSound, setNotifSound] = useState<NotifSound>('adhan');

  useEffect(() => {
    loadNotifOffsets().then(setNotifOffsets);
    loadNotifSound().then(setNotifSound);
  }, []);

  const handleOffsetChange = async (prayer: PrayerName, offset: NotifOffset) => {
    const next = { ...notifOffsets, [prayer]: offset };
    setNotifOffsets(next);
    await saveNotifOffsets(next);
  };

  const handleSoundChange = async (sound: NotifSound) => {
    setNotifSound(sound);
    await saveNotifSound(sound);
  };

  const [alertConfig, setAlertConfig] = useState<{
    visible: boolean; title: string; message?: string; buttons?: any[];
  }>({ visible: false, title: '' });
  const showAlert = (title: string, message?: string, buttons?: any[]) => setAlertConfig({ visible: true, title, message, buttons });
  const hideAlert = () => setAlertConfig(prev => ({ ...prev, visible: false }));

  const handleRateApp = () => {
    const url = Platform.OS === 'ios'
      ? 'itms-apps://itunes.apple.com/app/id'
      : 'market://details?id=com.ilmai.app';
    Linking.openURL(url).catch(() => {
      Linking.openURL('https://play.google.com/store/apps/details?id=com.ilmai.app').catch(() => {});
    });
  };

  const handleShareApp = () => {
    Share.share({
      message: 'I\'ve been using IlmAI — a beautiful Islamic app with Quran, Hadith, Prayer Times, and an AI assistant. Check it out!',
      url: 'https://play.google.com/store/apps/details?id=com.ilmai.app',
    }).catch(() => {});
  };

  const handleSignOut = () => showAlert('Sign Out', 'Are you sure you want to sign out?', [
    { text: 'Cancel', style: 'cancel' },
    { text: 'Sign Out', style: 'destructive', onPress: () => signOut() },
  ]);

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

  const handleDownloadQuran = async () => {
    if (downloadProgress !== null) return;
    setDownloadProgress(0);
    try {
      for (let i = 1; i <= 114; i++) {
        await fetchSurahDetail(i);
        setDownloadProgress(Math.round((i / 114) * 100));
      }
      showAlert('Download Complete', 'All 114 Surahs are now available offline.');
    } catch {
      showAlert('Download Failed', 'Check your connection and try again.');
    } finally {
      setDownloadProgress(null);
    }
  };

  // Derive auth provider from Firebase providerData
  const provider = user?.providerData?.[0]?.providerId ?? null;
  const isGoogle  = provider === 'google.com';
  const isPhone   = provider === 'phone';
  const isEmail   = provider === 'password';

  const displayName = isGuest
    ? 'Guest User'
    : user?.displayName
    || (isPhone ? user?.phoneNumber ?? 'Phone user' : null)
    || user?.email
    || 'User';

  const displaySub = isGuest
    ? 'Guest session — sign in to save progress'
    : isGoogle  ? `Google · ${user?.email ?? ''}`
    : isPhone   ? `Phone · ${user?.phoneNumber ?? ''}`
    : user?.email ?? 'Signed in';

  const providerLabel = isGoogle ? 'Google' : isPhone ? 'Phone' : isEmail ? 'Email' : null;
  const providerColor = isGoogle ? '#4285F4' : isPhone ? '#4ADE80' : '#F59E0B';

  const avatarLetter = isGuest ? 'G' : (user?.displayName?.[0] ?? user?.email?.[0] ?? user?.phoneNumber?.[3] ?? 'U').toUpperCase();
  const photoUrl = isGoogle ? user?.photoURL : null;

  return (
    <>
    <ScrollView style={[styles.root, { backgroundColor: isDark ? darkColors.background : colors.parchment[50] }]} showsVerticalScrollIndicator={false}>
      <StatusBar barStyle="light-content" />

      {/* ── Account Hero ── */}
      <LinearGradient colors={['#060C1F', '#0B1330', '#1E2F6B']} style={styles.accountHero}>
        <Image source={require('../../../assets/images/islamicbackground.png')} style={styles.heroBgPattern} resizeMode="cover" />
        <Image source={require('../../../assets/images/masjid.png')} style={styles.heroMasjid} resizeMode="contain" />
        <View style={styles.heroDecor1} />
        <View style={styles.heroDecor2} />
        <BackButton style={styles.settingsBackBtn} />

        <View style={styles.accountRow}>
          {/* Avatar — show Google photo or letter */}
          {photoUrl ? (
            <Image source={{ uri: photoUrl }} style={styles.avatarImg} />
          ) : (
            <LinearGradient colors={['rgba(245,158,11,0.3)', 'rgba(245,158,11,0.1)']} style={styles.avatar}>
              <Text style={styles.avatarLetter}>{avatarLetter}</Text>
            </LinearGradient>
          )}

          <View style={styles.accountInfo}>
            <Text style={styles.accountName} numberOfLines={1}>{displayName}</Text>
            <Text style={styles.statusText} numberOfLines={1}>{displaySub}</Text>
            {providerLabel && (
              <View style={[styles.providerBadge, { backgroundColor: providerColor + '22', borderColor: providerColor + '55' }]}>
                <View style={[styles.providerDot, { backgroundColor: providerColor }]} />
                <Text style={[styles.providerText, { color: providerColor }]}>{providerLabel}</Text>
              </View>
            )}
          </View>

          {isGuest ? (
            <TouchableOpacity style={styles.signInBtn} onPress={() => useAuthStore.getState().signOut()}>
              <Ionicons name="log-in-outline" size={14} color={colors.gold[300]} />
              <Text style={styles.signOutText}>Sign in</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut}>
              <Ionicons name="log-out-outline" size={14} color={colors.gold[300]} />
              <Text style={styles.signOutText}>Sign out</Text>
            </TouchableOpacity>
          )}
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

        {/* ── Appearance ── */}
        <GroupLabel label="APPEARANCE" isDark={isDark} />
        <View style={[styles.settingCard, { backgroundColor: isDark ? '#0F1C42' : colors.white }]}>
          <View style={[styles.settingRow, { paddingBottom: spacing.sm }]}>
            <View style={[styles.settingIcon, { backgroundColor: 'rgba(129,140,248,0.15)' }]}>
              <Ionicons name="color-palette-outline" size={17} color="#818CF8" />
            </View>
            <Text style={[styles.settingLabel, { color: isDark ? '#F4F1EC' : colors.parchment[950] }]}>Theme</Text>
          </View>
          <View style={styles.themePickerRow}>
            {([
              { mode: 'light' as ThemeMode, icon: 'sunny' as const, label: 'Light', color: '#F59E0B' },
              { mode: 'dark' as ThemeMode, icon: 'moon' as const, label: 'Dark', color: '#818CF8' },
              { mode: 'amoled' as ThemeMode, icon: 'phone-portrait-outline' as const, label: 'AMOLED', color: '#000', outline: '#818CF8' },
            ] as const).map(t => (
              <TouchableOpacity
                key={t.mode}
                style={[
                  styles.themeOption,
                  { borderColor: themeMode === t.mode ? t.outline ?? t.color : isDark ? 'rgba(255,255,255,0.1)' : colors.parchment[200] },
                  themeMode === t.mode && { backgroundColor: (t.outline ?? t.color) + '18' },
                ]}
                onPress={() => setTheme(t.mode)}
                activeOpacity={0.75}
              >
                <Ionicons name={t.icon} size={18} color={themeMode === t.mode ? (t.outline ?? t.color) : (isDark ? 'rgba(255,255,255,0.4)' : colors.parchment[400])} />
                <Text style={[styles.themeOptionLabel, {
                  color: themeMode === t.mode ? (t.outline ?? t.color) : (isDark ? 'rgba(255,255,255,0.5)' : colors.parchment[500]),
                  fontWeight: themeMode === t.mode ? '700' : '500',
                }]}>{t.label}</Text>
                {themeMode === t.mode && (
                  <View style={[styles.themeCheck, { backgroundColor: t.outline ?? t.color }]}>
                    <Ionicons name="checkmark" size={10} color="#fff" />
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
          <Text style={[styles.themeHint, { color: isDark ? 'rgba(244,241,236,0.3)' : colors.parchment[400] }]}>
            AMOLED uses true black — saves battery on OLED screens
          </Text>
        </View>

        {/* ── Notifications ── */}
        <GroupLabel label="PRAYER NOTIFICATIONS" isDark={isDark} />
        <View style={[styles.settingCard, { backgroundColor: isDark ? '#0F1C42' : colors.white }]}>
          {/* Sound picker */}
          <View style={[styles.settingRow, { paddingBottom: spacing.sm }]}>
            <View style={[styles.settingIcon, { backgroundColor: 'rgba(96,165,250,0.15)' }]}>
              <Ionicons name="musical-notes-outline" size={17} color="#60A5FA" />
            </View>
            <View style={styles.settingText}>
              <Text style={[styles.settingLabel, { color: isDark ? '#F4F1EC' : colors.parchment[950] }]}>Reminder Sound</Text>
            </View>
            <View style={styles.soundChipRow}>
              {([
                { value: 'default' as NotifSound, label: 'Chime', icon: 'notifications' as const },
                { value: 'adhan' as NotifSound,   label: 'Adhan', icon: 'mic' as const },
              ]).map(opt => {
                const active = notifSound === opt.value;
                return (
                  <TouchableOpacity
                    key={opt.value}
                    style={[
                      styles.soundChip,
                      { borderColor: active ? colors.gold[400] : (isDark ? 'rgba(255,255,255,0.12)' : colors.parchment[200]) },
                      active && { backgroundColor: colors.gold[400] + '22' },
                    ]}
                    onPress={() => handleSoundChange(opt.value)}
                    activeOpacity={0.7}
                  >
                    <Ionicons name={opt.icon} size={13} color={active ? colors.gold[isDark ? 300 : 600] : (isDark ? 'rgba(255,255,255,0.4)' : colors.parchment[400])} />
                    <Text style={[
                      styles.soundChipText,
                      { color: active ? colors.gold[isDark ? 300 : 700] : (isDark ? 'rgba(255,255,255,0.4)' : colors.parchment[500]) },
                      active && { fontWeight: '700' },
                    ]}>{opt.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
          <View style={[styles.groupDivider, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : colors.parchment[100] }]} />

          {/* Per-prayer timing */}
          <View style={[styles.settingRow, { paddingBottom: spacing.xs }]}>
            <View style={[styles.settingIcon, { backgroundColor: 'rgba(74,222,128,0.15)' }]}>
              <Ionicons name="notifications-outline" size={17} color="#4ADE80" />
            </View>
            <View style={styles.settingText}>
              <Text style={[styles.settingLabel, { color: isDark ? '#F4F1EC' : colors.parchment[950] }]}>Remind me before prayer</Text>
              <Text style={[styles.settingSubtitle, { color: isDark ? 'rgba(244,241,236,0.45)' : colors.parchment[500] }]}>Off = no reminder for that prayer</Text>
            </View>
          </View>
          {PRAYER_NAMES.map((prayer, i) => {
            const current = notifOffsets[prayer] ?? '0';
            return (
              <View key={prayer}>
                {i > 0 && <View style={[styles.groupDivider, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : colors.parchment[100] }]} />}
                <View style={styles.notifRow}>
                  <Text style={[styles.notifPrayerName, { color: isDark ? '#F4F1EC' : colors.parchment[900] }]}>{prayer}</Text>
                  <View style={styles.notifChipRow}>
                    {(['off', '0', '5', '10', '15'] as NotifOffset[]).map(opt => {
                      const isActive = current === opt;
                      return (
                        <TouchableOpacity
                          key={opt}
                          style={[
                            styles.notifChip,
                            { borderColor: isActive ? colors.gold[400] : (isDark ? 'rgba(255,255,255,0.12)' : colors.parchment[200]) },
                            isActive && { backgroundColor: colors.gold[400] + '22' },
                          ]}
                          onPress={() => handleOffsetChange(prayer, opt)}
                          activeOpacity={0.7}
                        >
                          <Text style={[
                            styles.notifChipText,
                            { color: isActive ? colors.gold[isDark ? 300 : 700] : (isDark ? 'rgba(255,255,255,0.4)' : colors.parchment[500]) },
                            isActive && { fontWeight: '700' },
                          ]}>
                            {opt === 'off' ? 'Off' : opt === '0' ? 'Now' : `-${opt}m`}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              </View>
            );
          })}
          <Text style={[styles.themeHint, { color: isDark ? 'rgba(244,241,236,0.3)' : colors.parchment[400] }]}>
            Changes apply at next prayer time fetch
          </Text>
        </View>

        {/* ── Data ── */}
        <GroupLabel label="DATA & PRIVACY" isDark={isDark} />
        <SettingCard isDark={isDark}>
          <SettingRow isDark={isDark} cfgKey="bookmarks" label="My Bookmarks" subtitle="View saved ayahs and hadiths" onPress={() => nav.navigate('Bookmarks')} />
          <Divider isDark={isDark} />
          <SettingRow
            isDark={isDark}
            cfgKey="download"
            label={downloadProgress !== null ? `Downloading… ${downloadProgress}%` : 'Download Quran Offline'}
            subtitle={downloadProgress !== null ? `${downloadProgress} of 114 Surahs cached` : 'Cache all 114 Surahs for offline use'}
            onPress={handleDownloadQuran}
            right={downloadProgress !== null ? <ActivityIndicator size="small" color="#4ADE80" /> : undefined}
          />
          <Divider isDark={isDark} />
          <SettingRow
            isDark={isDark}
            cfgKey="cache"
            label={cacheCleared ? 'Cache Cleared' : 'Clear Content Cache'}
            subtitle="Re-fetches pages on next view"
            onPress={clearCache}
          />
          <Divider isDark={isDark} />
          <SettingRow isDark={isDark} cfgKey="delete" label="Delete All Bookmarks" subtitle="Cannot be undone" onPress={clearBookmarks} destructive />
        </SettingCard>

        {/* ── About ── */}
        <GroupLabel label="ABOUT" isDark={isDark} />
        <SettingCard isDark={isDark}>
          <SettingRow isDark={isDark} cfgKey="rate" label="Rate the App" subtitle="Support us with a review" onPress={handleRateApp} />
          <Divider isDark={isDark} />
          <SettingRow isDark={isDark} cfgKey="share" label="Share App" subtitle="Recommend to friends & family" onPress={handleShareApp} />
        </SettingCard>

        <View style={styles.aboutCard}>
          <LinearGradient colors={['#0B1330', '#162354']} style={styles.aboutGrad}>
            <View style={styles.aboutDecor} />
            <Text style={[styles.aboutAr, { fontFamily: 'Amiri_400Regular' }]}>عِلْم</Text>
            <Text style={styles.aboutTitle}>IlmAI</Text>
            <Text style={styles.aboutVersion}>Version 1.0.0</Text>
          </LinearGradient>
          <View style={[styles.aboutBody, { backgroundColor: isDark ? '#0F1C42' : colors.white }]}>
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
                  <Text style={[styles.featureTitle, { color: isDark ? '#F4F1EC' : colors.parchment[950] }]}>{f.title}</Text>
                  <Text style={[styles.featureDesc, { color: isDark ? 'rgba(244,241,236,0.45)' : colors.parchment[500] }]}>{f.desc}</Text>
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
  accountHero: { paddingTop: 52, paddingBottom: spacing.xl, paddingHorizontal: spacing.lg, gap: spacing.xl, overflow: 'hidden', position: 'relative' },
  settingsBackBtn: { position: 'absolute', top: spacing.md + 4, left: spacing.lg, zIndex: 10 },
  heroBgPattern: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, width: '100%', height: '100%', opacity: 0.07 },
  heroMasjid: { position: 'absolute', right: -10, bottom: 0, width: 120, height: 90, opacity: 0.18 },
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
  signInBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(74,222,128,0.1)', borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: 6, borderWidth: 1, borderColor: 'rgba(74,222,128,0.3)' },
  avatarImg: { width: 52, height: 52, borderRadius: 26, borderWidth: 2, borderColor: 'rgba(245,158,11,0.4)' },
  providerBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: radius.pill, paddingHorizontal: 7, paddingVertical: 3, borderWidth: 1, alignSelf: 'flex-start', marginTop: 3 },
  providerDot: { width: 5, height: 5, borderRadius: 3 },
  providerText: { fontSize: 10, fontWeight: '700' },
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

  // Setting group card
  settingCard: { backgroundColor: colors.white, borderRadius: radius.md, overflow: 'hidden', ...shadow.sm },
  settingRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingHorizontal: spacing.lg, paddingVertical: spacing.md + 2 },
  settingIcon: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  settingText: { flex: 1 },
  settingLabel: { ...typography.bodySmall, color: colors.parchment[950], fontWeight: '500' },
  settingSubtitle: { fontSize: 11, color: colors.parchment[500], marginTop: 2 },
  groupDivider: { height: 1, backgroundColor: colors.parchment[100], marginLeft: spacing.lg + 34 + spacing.md },
  themePickerRow: { flexDirection: 'row', gap: spacing.sm, paddingHorizontal: spacing.lg, paddingBottom: spacing.sm },
  themeOption: { flex: 1, alignItems: 'center', gap: spacing.xs, paddingVertical: spacing.md, borderRadius: spacing.md, borderWidth: 1.5 },
  themeOptionLabel: { fontSize: 11, textAlign: 'center' },
  themeCheck: { width: 16, height: 16, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  themeHint: { fontSize: 10, paddingHorizontal: spacing.lg, paddingBottom: spacing.md, textAlign: 'center' },
  soundChipRow: { flexDirection: 'row', gap: spacing.sm },
  soundChip: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: spacing.md, paddingVertical: 7, borderRadius: radius.md, borderWidth: 1.5 },
  soundChipText: { fontSize: 12, fontWeight: '500' },
  notifRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, gap: spacing.sm },
  notifPrayerName: { width: 58, ...typography.bodySmall, fontWeight: '600' },
  notifChipRow: { flex: 1, flexDirection: 'row', gap: 5, flexWrap: 'nowrap' },
  notifChip: { flex: 1, alignItems: 'center', paddingVertical: 5, borderRadius: radius.sm, borderWidth: 1 },
  notifChipText: { fontSize: 10, fontWeight: '500' },

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
