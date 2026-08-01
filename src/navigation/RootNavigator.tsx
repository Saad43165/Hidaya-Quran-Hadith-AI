import React, { useEffect, useState } from 'react';
import { I18nManager } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
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
import { MainTabs } from './MainTabs';
import { AuthNavigator } from './AuthNavigator';
import { useAppStore } from '../store/useAppStore';
import { useAuthStore } from '../store/useAuthStore';
import { useThemeStore } from '../store/useThemeStore';
import { useStreakStore } from '../store/useStreakStore';
import { useQuranStore } from '../store/useQuranStore';
import { LoadingView } from '../components/common/AsyncStateView';
import i18n, { RTL_LANGUAGES } from '../i18n';
import { colors } from '../theme';
import { darkColors } from '../theme/darkColors';
import type { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

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

  useEffect(() => {
    Promise.all([hydrate(), hydrateTheme(), hydrateStreak(), hydrateQuran()])
      .finally(() => setIsHydrated(true));
  }, [hydrate, hydrateTheme, hydrateStreak, hydrateQuran]);

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
    <NavigationContainer
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
              options={({ route }) => ({ headerShown: true, title: route.params.englishName, ...navHeaderStyle })} />
            <Stack.Screen name="JuzDetail" component={JuzDetailScreen}
              options={({ route }) => ({ headerShown: true, title: `Juz ${route.params.juzNumber}`, ...navHeaderStyle })} />
            <Stack.Screen name="HadithCollectionDetail" component={HadithCollectionDetailScreen}
              options={({ route }) => ({ headerShown: true, title: route.params.name, ...navHeaderStyle })} />
            <Stack.Screen name="Bookmarks" component={BookmarksScreen}
              options={{ headerShown: true, title: 'Bookmarks', ...navHeaderStyle }} />
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
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
