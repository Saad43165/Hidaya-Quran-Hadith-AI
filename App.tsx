import React, { useEffect, useState, useRef } from 'react';
import { Animated, View, Text } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import './src/i18n';
import { ensureDatabaseReady } from './src/services/db/database';
import { configureNotificationHandler } from './src/services/notifications/prayerNotifications';
import { useArabicFonts } from './src/services/font/fonts';
import { ErrorBoundary } from './src/components/common/ErrorBoundary';
import { RootNavigator } from './src/navigation/RootNavigator';
import { colors } from './src/theme';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

// Must be called at module level before any render
try {
  configureNotificationHandler();
} catch (e) {
  console.warn('[KitaabAI] Notification handler setup failed:', e);
}

function KitaabSplash() {
  const scale = useRef(new Animated.Value(0.9)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1, tension: 50, friction: 8, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: colors.navy[900], alignItems: 'center', justifyContent: 'center' }}>
      <Animated.View style={{ opacity, transform: [{ scale }], alignItems: 'center', gap: 16 }}>
        <LinearGradient
          colors={['rgba(212,169,62,0.2)', 'rgba(212,169,62,0.05)']}
          style={{ width: 80, height: 80, borderRadius: 24, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(212,169,62,0.3)' }}
        >
          <Ionicons name="book" size={36} color={colors.gold[400]} />
        </LinearGradient>
        <View style={{ alignItems: 'center', gap: 4 }}>
          <Text style={{ fontSize: 24, color: colors.white, fontWeight: '700', letterSpacing: 3 }}>KITAAB AI</Text>
          <Text style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', letterSpacing: 1 }}>YOUR ISLAMIC COMPANION</Text>
        </View>
      </Animated.View>
    </View>
  );
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
    return <KitaabSplash />;
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
