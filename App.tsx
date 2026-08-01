import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import './src/i18n';
import { ensureDatabaseReady } from './src/services/db/database';
import { configureNotificationHandler } from './src/services/notifications/prayerNotifications';
import { useArabicFonts } from './src/services/font/fonts';
import { ErrorBoundary } from './src/components/common/ErrorBoundary';
import { RootNavigator } from './src/navigation/RootNavigator';
import { colors } from './src/theme';

// Must be called at module level before any render
try {
  configureNotificationHandler();
} catch (e) {
  console.warn('[KitaabAI] Notification handler setup failed:', e);
}

export default function App() {
  const [fontsLoaded, fontError] = useArabicFonts();
  const [dbReady, setDbReady] = useState(false);

  useEffect(() => {
    ensureDatabaseReady()
      .catch(e => console.warn('[KitaabAI] DB init:', e))
      .finally(() => setDbReady(true));
  }, []);

  // If fonts fail to load (e.g. no internet on first install), continue with system font
  const ready = (fontsLoaded || fontError) && dbReady;

  if (!ready) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.navy[900] }} />
    );
  }

  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <StatusBar style="light" />
        <RootNavigator />
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}
