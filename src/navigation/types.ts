import type { CompositeNavigationProp } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

export type AuthStackParamList = {
  Login: undefined;
  SignUp: undefined;
  ForgotPassword: undefined;
};

export type TabParamList = {
  Home: undefined;
  Quran: undefined;
  Hadith: undefined;
  Prayer: undefined;
  Library: undefined;
  Assistant: undefined;
  Settings: undefined;
};

export type RootStackParamList = {
  Onboarding: undefined;
  Auth: undefined;
  MainTabs: undefined;
  SurahDetail: { surahNumber: number; englishName: string };
  JuzDetail: { juzNumber: number };
  HadithCollectionDetail: { collectionId: string; name: string };
  Bookmarks: undefined;
  Search: undefined;
  Tasbih: undefined;
  Duas: undefined;
  NamesOfAllah: undefined;
};

export type TabAndStackNavigation = CompositeNavigationProp<
  BottomTabNavigationProp<TabParamList>,
  NativeStackNavigationProp<RootStackParamList>
>;
