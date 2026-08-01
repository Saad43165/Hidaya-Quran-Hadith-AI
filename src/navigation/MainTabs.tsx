import React from 'react';
import { Platform } from 'react-native';
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
import { colors } from '../theme';

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

export function MainTabs() {
  const { t } = useTranslation();
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.gold[600],
        tabBarInactiveTintColor: colors.parchment[500],
        tabBarStyle: {
          backgroundColor: colors.white,
          borderTopColor: colors.parchment[200],
          borderTopWidth: 1,
          height: Platform.OS === 'ios' ? 88 : 64,
          paddingBottom: Platform.OS === 'ios' ? 28 : 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '600',
        },
        tabBarIcon: ({ color, focused }) => {
          const name = focused ? ICONS[route.name]?.active : ICONS[route.name]?.inactive;
          return <Ionicons name={name ?? 'ellipse-outline'} color={color} size={22} />;
        },
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
