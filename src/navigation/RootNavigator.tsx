import React, { useEffect, useRef, useState } from 'react';
import { Animated, I18nManager, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { MiniPlayer } from '../components/audio/MiniPlayer';
import { AppDrawer } from '../components/common/AppDrawer';
import { ToastProvider } from '../components/common/Toast';
import { DrawerProvider } from '../context/DrawerContext';
import { navigationRef } from './navigationRef';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import { OnboardingScreen } from '../screens/onboarding/OnboardingScreen';
import { SurahDetailScreen } from '../screens/quran/SurahDetailScreen';
import { JuzDetailScreen } from '../screens/quran/JuzDetailScreen';
import { HadithCollectionDetailScreen } from '../screens/hadith/HadithCollectionDetailScreen';
import { BookmarksScreen } from '../screens/bookmarks/BookmarksScreen';
import { SearchScreen } from '../screens/search/SearchScreen';
import { TasbihScreen } from '../screens/tasbih/TasbihScreen';
import { DuaScreen } from '../screens/dua/DuaScreen';
import { NamesOfAllahScreen } from '../screens/names/NamesOfAllahScreen';
import { VocabularyScreen } from '../screens/vocabulary/VocabularyScreen';
import { RamadanScreen } from '../screens/ramadan/RamadanScreen';
import { ComprehensionReviewScreen } from '../screens/comprehension/ComprehensionReviewScreen';
import { QiblaScreen } from '../screens/qibla/QiblaScreen';
import { SalahTrackerScreen } from '../screens/salah/SalahTrackerScreen';
import { AdhkarScreen } from '../screens/adhkar/AdhkarScreen';
import { IslamicEventsScreen } from '../screens/events/IslamicEventsScreen';
import { ZakatCalculatorScreen } from '../screens/zakat/ZakatCalculatorScreen';
import { SeerahScreen } from '../screens/seerah/SeerahScreen';
import { HajjGuideScreen } from '../screens/hajj/HajjGuideScreen';
import { ProphetStoriesScreen } from '../screens/prophets/ProphetStoriesScreen';
import { SahabaScreen } from '../screens/sahaba/SahabaScreen';
import { IslamicHistoryScreen } from '../screens/history/IslamicHistoryScreen';
import { PrayerScreen } from '../screens/prayer/PrayerScreen';
import { LibraryScreen } from '../screens/library/LibraryScreen';
import { SettingsScreen } from '../screens/settings/SettingsScreen';
import { MainTabs } from './MainTabs';
import { AuthNavigator } from './AuthNavigator';
import { useAppStore } from '../store/useAppStore';
import { useAuthStore } from '../store/useAuthStore';
import { useThemeStore } from '../store/useThemeStore';
import { useStreakStore } from '../store/useStreakStore';
import { useQuranStore } from '../store/useQuranStore';
import { useAudioStore } from '../store/useAudioStore';
import { LoadingView } from '../components/common/AsyncStateView';
import i18n, { RTL_LANGUAGES } from '../i18n';
import { colors } from '../theme';
import { darkColors } from '../theme/darkColors';
import type { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

function OfflineBanner({ isOnline }: { isOnline: boolean }) {
  const insets = useSafeAreaInsets();
  const anim = useRef(new Animated.Value(0)).current;
  const [rendered, setRendered] = useState(isOnline ? false : true);

  useEffect(() => {
    if (!isOnline) {
      setRendered(true);
      Animated.timing(anim, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(anim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (finished) setRendered(false);
      });
    }
  }, [isOnline, anim]);

  if (!rendered) return null;

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.offlineBanner,
        {
          paddingTop: insets.top + 6,
          opacity: anim,
          transform: [
            {
              translateY: anim.interpolate({
                inputRange: [0, 1],
                outputRange: [-20, 0],
              }),
            },
          ],
        },
      ]}
    >
      <Ionicons name="cloud-offline-outline" size={14} color={colors.white} />
      <Text style={styles.offlineBannerText}>You're offline — showing cached content</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  offlineBanner: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 999,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingBottom: 8,
    backgroundColor: '#B45309',
  },
  offlineBannerText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '600',
  },
});

export function RootNavigator() {
  const hasOnboarded = useAppStore(s => s.hasOnboarded);
  const hydrate = useAppStore(s => s.hydrate);
  const language = useAppStore(s => s.language);
  const [isHydrated, setIsHydrated] = useState(false);

  const user = useAuthStore(s => s.user);
  const isGuest = useAuthStore(s => s.isGuest);
  const isAuthInit = useAuthStore(s => s.isInitializing);
  const initAuth = useAuthStore(s => s.initialize);

  const { isDark, hydrate: hydrateTheme } = useThemeStore();
  const hydrateStreak = useStreakStore(s => s.hydrate);
  const hydrateQuran = useQuranStore(s => s.hydrate);
  const hydrateAudio = useAudioStore(s => s.hydrate);
  const { isOnline } = useNetworkStatus();

  useEffect(() => {
    Promise.all([hydrate(), hydrateTheme(), hydrateStreak(), hydrateQuran(), hydrateAudio()])
      .finally(() => setIsHydrated(true));
  }, [hydrate, hydrateTheme, hydrateStreak, hydrateQuran, hydrateAudio]);

  useEffect(() => { const u = initAuth(); return u; }, [initAuth]);

  useEffect(() => {
    const shouldBeRTL = RTL_LANGUAGES.includes(language);
    if (I18nManager.isRTL !== shouldBeRTL) I18nManager.forceRTL(shouldBeRTL);
    i18n.changeLanguage(language);
  }, [language]);

  if (!isHydrated || isAuthInit) return <LoadingView />;

  const bg = isDark ? darkColors.background : colors.parchment[50];
  const card = isDark ? darkColors.surface : colors.white;
  const text = isDark ? darkColors.text.primary : colors.parchment[950];
  const border = isDark ? darkColors.border : colors.parchment[200];

  const navHeaderStyle = {
    headerStyle: { backgroundColor: colors.navy[900] },
    headerTintColor: colors.gold[400],
    headerTitleStyle: { color: colors.white, fontWeight: '600' as const },
    headerShadowVisible: false,
    contentStyle: { backgroundColor: bg },
  };

  return (
    <ToastProvider>
    <DrawerProvider>
      <View style={{ flex: 1 }}>
        <NavigationContainer
          ref={navigationRef}
          theme={{
            dark: isDark,
            colors: { primary: colors.navy[800], background: bg, card, text, border, notification: colors.gold[500] },
            fonts: {
              regular: { fontFamily: 'System', fontWeight: '400' },
              medium: { fontFamily: 'System', fontWeight: '500' },
              bold: { fontFamily: 'System', fontWeight: '700' },
              heavy: { fontFamily: 'System', fontWeight: '800' },
            },
          }}
        >
          <Stack.Navigator screenOptions={{ headerShown: false, contentStyle: { backgroundColor: bg } }}>
            {!hasOnboarded ? (
              <Stack.Screen name="Onboarding" component={OnboardingScreen} />
            ) : !(user || isGuest) ? (
              <Stack.Screen name="Auth" component={AuthNavigator} />
            ) : (
              <>
                <Stack.Screen name="MainTabs" component={MainTabs} />
                <Stack.Screen name="SurahDetail" component={SurahDetailScreen}
                  options={{ headerShown: false }} />
                <Stack.Screen name="JuzDetail" component={JuzDetailScreen}
                  options={{ headerShown: false }} />
                <Stack.Screen name="HadithCollectionDetail" component={HadithCollectionDetailScreen}
                  options={{ headerShown: false }} />
                <Stack.Screen name="Prayer" component={PrayerScreen}
                  options={{ headerShown: false }} />
                <Stack.Screen name="Library" component={LibraryScreen}
                  options={{ headerShown: false }} />
                <Stack.Screen name="Settings" component={SettingsScreen}
                  options={{ headerShown: false }} />
                <Stack.Screen name="Bookmarks" component={BookmarksScreen}
                  options={{ headerShown: false }} />
                <Stack.Screen name="Search" component={SearchScreen}
                  options={{ headerShown: false }} />
                <Stack.Screen name="Tasbih" component={TasbihScreen}
                  options={{ headerShown: false }} />
                <Stack.Screen name="Duas" component={DuaScreen}
                  options={{ headerShown: false }} />
                <Stack.Screen name="NamesOfAllah" component={NamesOfAllahScreen}
                  options={{ headerShown: false }} />
                <Stack.Screen name="Vocabulary" component={VocabularyScreen}
                  options={{ headerShown: false }} />
                <Stack.Screen name="Ramadan" component={RamadanScreen}
                  options={{ headerShown: false }} />
                <Stack.Screen name="ComprehensionReview" component={ComprehensionReviewScreen}
                  options={{ headerShown: false }} />
                <Stack.Screen name="Qibla" component={QiblaScreen}
                  options={{ headerShown: false }} />
                <Stack.Screen name="SalahTracker" component={SalahTrackerScreen}
                  options={{ headerShown: false }} />
                <Stack.Screen name="Adhkar" component={AdhkarScreen}
                  options={{ headerShown: false }} />
                <Stack.Screen name="IslamicEvents" component={IslamicEventsScreen}
                  options={{ headerShown: false }} />
                <Stack.Screen name="ZakatCalculator" component={ZakatCalculatorScreen}
                  options={{ headerShown: false }} />
                <Stack.Screen name="Seerah" component={SeerahScreen}
                  options={{ headerShown: false }} />
                <Stack.Screen name="HajjGuide" component={HajjGuideScreen}
                  options={{ headerShown: false }} />
                <Stack.Screen name="ProphetStories" component={ProphetStoriesScreen}
                  options={{ headerShown: false }} />
                <Stack.Screen name="Sahaba" component={SahabaScreen}
                  options={{ headerShown: false }} />
                <Stack.Screen name="IslamicHistory" component={IslamicHistoryScreen}
                  options={{ headerShown: false }} />
              </>
            )}
          </Stack.Navigator>
        </NavigationContainer>
        <MiniPlayer />
        <AppDrawer />
        <OfflineBanner isOnline={isOnline} />
      </View>
    </DrawerProvider>
    </ToastProvider>
  );
}
