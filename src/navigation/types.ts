import type { CompositeNavigationProp } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

export type AuthStackParamList = {
  Login: undefined;
  SignUp: undefined;
  ForgotPassword: undefined;
  PhoneAuth: undefined;
};

export type TabParamList = {
  Home: undefined;
  Quran: undefined;
  Hadith: undefined;
  Assistant: undefined;
  More: undefined;
};

export type RootStackParamList = {
  Onboarding: undefined;
  Auth: undefined;
  MainTabs: undefined;
  SurahDetail: { surahNumber: number; englishName: string; initialAyahNumber?: number };
  JuzDetail: { juzNumber: number };
  HadithCollectionDetail: { collectionId: string; name: string; initialHadithNumber?: number };
  Prayer: undefined;
  Library: undefined;
  Settings: undefined;
  Bookmarks: undefined;
  Search: undefined;
  Tasbih: undefined;
  Duas: undefined;
  NamesOfAllah: undefined;
  Vocabulary: undefined;
  Ramadan: undefined;
  ComprehensionReview: undefined;
  Qibla: undefined;
  SalahTracker: undefined;
  Adhkar: undefined;
  IslamicEvents: undefined;
  ZakatCalculator: undefined;
  Seerah: undefined;
  HajjGuide: undefined;
  ProphetStories: undefined;
  Sahaba: undefined;
  IslamicHistory: undefined;
};

export type TabAndStackNavigation = CompositeNavigationProp<
  BottomTabNavigationProp<TabParamList>,
  NativeStackNavigationProp<RootStackParamList>
>;
