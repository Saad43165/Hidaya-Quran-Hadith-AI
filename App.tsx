import React, { useEffect, useState, useRef } from 'react';
import { Animated, Easing, Image, StyleSheet, View, Text } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import './src/i18n';
import { ensureDatabaseReady } from './src/services/db/database';
import { configureNotificationHandler } from './src/services/notifications/prayerNotifications';
import { useArabicFonts } from './src/services/font/fonts';
import { ErrorBoundary } from './src/components/common/ErrorBoundary';
import { RootNavigator } from './src/navigation/RootNavigator';
import { colors } from './src/theme';

try {
  configureNotificationHandler();
} catch (e) {
  console.warn('[IlmAI] Notification handler setup failed:', e);
}

function IlmAISplash() {
  const iconOpacity = useRef(new Animated.Value(0)).current;
  const iconScale = useRef(new Animated.Value(0.8)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  const textSlide = useRef(new Animated.Value(12)).current;
  const creditOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(iconOpacity, { toValue: 1, duration: 600, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        Animated.spring(iconScale, { toValue: 1, tension: 50, friction: 7, useNativeDriver: true }),
      ]),
      Animated.delay(100),
      Animated.parallel([
        Animated.timing(textOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.timing(textSlide, { toValue: 0, duration: 500, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      ]),
      Animated.delay(300),
      Animated.timing(creditOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <View style={splashStyles.root}>
      {/* Icon */}
      <Animated.View style={[splashStyles.iconWrap, { opacity: iconOpacity, transform: [{ scale: iconScale }] }]}>
        <Image source={require('./assets/icon.png')} style={splashStyles.icon} resizeMode="cover" />
      </Animated.View>

      {/* App name + subtitle */}
      <Animated.View style={{ alignItems: 'center', gap: 6, opacity: textOpacity, transform: [{ translateY: textSlide }] }}>
        <Text style={splashStyles.appName}>ILMAI</Text>
        <Text style={splashStyles.subtitle}>Your Islamic Companion</Text>
      </Animated.View>

      {/* Developer credit */}
      <Animated.Text style={[splashStyles.credit, { opacity: creditOpacity }]}>
        Developed by SAAD IKRAM
      </Animated.Text>
    </View>
  );
}

const splashStyles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#050C1E',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 28,
  },
  iconWrap: {
    width: 110,
    height: 110,
    borderRadius: 28,
    overflow: 'hidden',
    shadowColor: colors.gold[400],
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 12,
  },
  icon: { width: 110, height: 110 },
  appName: {
    fontSize: 32,
    fontWeight: '800',
    color: colors.white,
    letterSpacing: 6,
  },
  subtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.4)',
    letterSpacing: 1.5,
    fontWeight: '500',
  },
  credit: {
    position: 'absolute',
    bottom: 52,
    fontSize: 11,
    color: 'rgba(255,255,255,0.25)',
    letterSpacing: 1,
    fontWeight: '500',
  },
});

export default function App() {
  const [fontsLoaded, fontError] = useArabicFonts();
  const [dbReady, setDbReady] = useState(false);
  const [minTimeElapsed, setMinTimeElapsed] = useState(false);

  useEffect(() => {
    ensureDatabaseReady()
      .catch(e => console.warn('[IlmAI] DB init:', e))
      .finally(() => setDbReady(true));

    // Ensure splash is visible for at least 2.2 seconds
    const t = setTimeout(() => setMinTimeElapsed(true), 2200);

    return () => { clearTimeout(t); };
  }, []);

  const ready = (fontsLoaded || fontError) && dbReady && minTimeElapsed;

  if (!ready) return <IlmAISplash />;

  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <StatusBar style="light" />
        <RootNavigator />
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}
