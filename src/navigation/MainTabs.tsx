import React from 'react';
import { Platform, View } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { HomeScreen } from '../screens/home/HomeScreen';
import { QuranScreen } from '../screens/quran/QuranScreen';
import { HadithScreen } from '../screens/hadith/HadithScreen';
import { AssistantScreen } from '../screens/assistant/AssistantScreen';
import { MoreScreen } from '../screens/more/MoreScreen';
import { colors, shadow } from '../theme';
import { darkColors } from '../theme/darkColors';
import { useThemeStore } from '../store/useThemeStore';
import { Haptics } from '../services/haptics';

const Tab = createBottomTabNavigator();

const ICONS: Record<string, { active: keyof typeof Ionicons.glyphMap; inactive: keyof typeof Ionicons.glyphMap }> = {
  Home:      { active: 'home',        inactive: 'home-outline' },
  Quran:     { active: 'book',        inactive: 'book-outline' },
  Hadith:    { active: 'chatbox',     inactive: 'chatbox-outline' },
  Assistant: { active: 'sparkles',    inactive: 'sparkles-outline' },
  More:      { active: 'grid',        inactive: 'grid-outline' },
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
  const isDark = useThemeStore(s => s.isDark);
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: '#F59E0B',
        tabBarInactiveTintColor: isDark ? 'rgba(255,255,255,0.4)' : '#94A3B8',
        tabBarStyle: {
          backgroundColor: isDark ? darkColors.surface : colors.white,
          borderTopWidth: 0,
          borderTopLeftRadius: 28,
          borderTopRightRadius: 28,
          marginHorizontal: 0,
          height: Platform.OS === 'ios' ? 88 : 68,
          paddingBottom: Platform.OS === 'ios' ? 28 : 10,
          paddingTop: 10,
          ...shadow.lg,
        },
        tabBarItemStyle: {
          justifyContent: 'center',
          alignItems: 'center',
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
      screenListeners={{
        tabPress: () => { Haptics.impact('light'); },
      }}
    >
      <Tab.Screen name="Home"      component={HomeScreen}      options={{ tabBarLabel: t('nav.home') }} />
      <Tab.Screen name="Quran"     component={QuranScreen}     options={{ tabBarLabel: t('nav.quran') }} />
      <Tab.Screen name="Hadith"    component={HadithScreen}    options={{ tabBarLabel: t('nav.hadith') }} />
      <Tab.Screen name="Assistant" component={AssistantScreen} options={{ tabBarLabel: t('nav.assistant') }} />
      <Tab.Screen name="More"      component={MoreScreen}      options={{ tabBarLabel: t('nav.more') }} />
    </Tab.Navigator>
  );
}
