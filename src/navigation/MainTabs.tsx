import React from 'react';
import { Platform, View } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { HomeScreen } from '../screens/home/HomeScreen';
import { QuranScreen } from '../screens/quran/QuranScreen';
import { HadithScreen } from '../screens/hadith/HadithScreen';
import { PrayerScreen } from '../screens/prayer/PrayerScreen';
import { LibraryScreen } from '../screens/library/LibraryScreen';
import { AssistantScreen } from '../screens/assistant/AssistantScreen';
import { SettingsScreen } from '../screens/settings/SettingsScreen';
import { colors, shadow } from '../theme';

const Tab = createBottomTabNavigator();

const ICONS: Record<string, { active: keyof typeof Ionicons.glyphMap; inactive: keyof typeof Ionicons.glyphMap }> = {
  Home:      { active: 'home',                   inactive: 'home-outline' },
  Quran:     { active: 'book',                   inactive: 'book-outline' },
  Hadith:    { active: 'chatbox',                inactive: 'chatbox-outline' },
  Prayer:    { active: 'time',                   inactive: 'time-outline' },
  Library:   { active: 'library',                inactive: 'library-outline' },
  Assistant: { active: 'chatbubble-ellipses',    inactive: 'chatbubble-ellipses-outline' },
  Settings:  { active: 'settings',               inactive: 'settings-outline' },
};

function TabIcon({ name, color, focused }: { name: string; color: string; focused: boolean }) {
  const icon = focused ? ICONS[name]?.active : ICONS[name]?.inactive;
  return (
    <View style={{
      alignItems: 'center',
      justifyContent: 'center',
      width: 44,
      height: 30,
    }}>
      {focused && (
        <View style={{
          position: 'absolute',
          top: -8,
          width: 28,
          height: 3,
          borderRadius: 2,
          backgroundColor: colors.gold[500],
        }} />
      )}
      <Ionicons name={icon ?? 'ellipse-outline'} color={color} size={focused ? 24 : 22} />
    </View>
  );
}

export function MainTabs() {
  const { t } = useTranslation();
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.navy[900],
        tabBarInactiveTintColor: colors.parchment[400],
        tabBarStyle: {
          backgroundColor: colors.white,
          borderTopColor: colors.parchment[100],
          borderTopWidth: 1,
          height: Platform.OS === 'ios' ? 88 : 68,
          paddingBottom: Platform.OS === 'ios' ? 28 : 10,
          paddingTop: 10,
          ...shadow.md,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '600',
          letterSpacing: 0.2,
          marginTop: 2,
        },
        tabBarIcon: ({ color, focused }) => (
          <TabIcon name={route.name} color={color} focused={focused} />
        ),
      })}
    >
      <Tab.Screen name="Home"      component={HomeScreen}      options={{ tabBarLabel: t('nav.home') }} />
      <Tab.Screen name="Quran"     component={QuranScreen}     options={{ tabBarLabel: t('nav.quran') }} />
      <Tab.Screen name="Hadith"    component={HadithScreen}    options={{ tabBarLabel: t('nav.hadith') }} />
      <Tab.Screen name="Prayer"    component={PrayerScreen}    options={{ tabBarLabel: t('nav.prayer') }} />
      <Tab.Screen name="Library"   component={LibraryScreen}   options={{ tabBarLabel: t('nav.library') }} />
      <Tab.Screen name="Assistant" component={AssistantScreen} options={{ tabBarLabel: t('nav.assistant') }} />
      <Tab.Screen name="Settings"  component={SettingsScreen}  options={{ tabBarLabel: t('nav.settings') }} />
    </Tab.Navigator>
  );
}
