import React, { useEffect, useRef, useState } from 'react';
import {
  Animated, Easing, Image, KeyboardAvoidingView, Platform, ScrollView, StatusBar,
  StyleSheet, Text, TouchableOpacity, View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { AuthTextInput } from '../../components/auth/AuthTextInput';
import { AuthButton } from '../../components/auth/AuthButton';
import { signInWithEmail, signInWithGoogleAccessToken } from '../../services/firebase/auth';
import { getAuthErrorMessage } from '../../services/firebase/authErrors';
import { isFirebaseConfigured } from '../../services/firebase/config';
import { useAuthStore } from '../../store/useAuthStore';
import { colors, radius, shadow, spacing, typography } from '../../theme';
import type { AuthStackParamList } from '../../navigation/types';

WebBrowser.maybeCompleteAuthSession();

type Nav = NativeStackNavigationProp<AuthStackParamList>;
type Mode = 'choice' | 'email';

export function LoginScreen() {
  const { t } = useTranslation();
  const nav = useNavigation<Nav>();
  const continueAsGuest = useAuthStore(s => s.continueAsGuest);

  const [mode, setMode] = useState<Mode>('choice');
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(
    isFirebaseConfigured() ? null : t('auth.notConfiguredNotice'),
  );

  const morphAnim = useRef(new Animated.Value(0)).current;

  const [request, response, promptGoogleSignIn] = Google.useAuthRequest({
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
    androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
    scopes: ['profile', 'email'],
  });

  useEffect(() => {
    if (response?.type === 'success') {
      const accessToken = response.authentication?.accessToken ?? (response as any).params?.access_token;
      if (accessToken) {
        setGoogleLoading(true);
        signInWithGoogleAccessToken(accessToken)
          .catch(e => setError(getAuthErrorMessage(e)))
          .finally(() => setGoogleLoading(false));
      }
    } else if (response?.type === 'error') {
      setError('Google sign-in failed. Try again.');
    }
  }, [response]);

  const switchToEmail = () => {
    setError(null);
    setMode('email');
    Animated.timing(morphAnim, { toValue: 1, duration: 320, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
  };

  const switchToChoice = () => {
    setError(null);
    Animated.timing(morphAnim, { toValue: 0, duration: 260, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start(() => setMode('choice'));
  };

  const handleSignIn = async () => {
    setError(null); setIsLoading(true);
    try { await signInWithEmail(email.trim(), password); }
    catch (e) { setError(getAuthErrorMessage(e)); }
    finally { setIsLoading(false); }
  };

  const emailOpacity = morphAnim;
  const emailSlide = morphAnim.interpolate({ inputRange: [0, 1], outputRange: [16, 0] });
  const choiceOpacity = morphAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 0] });
  const choiceSlide = morphAnim.interpolate({ inputRange: [0, 1], outputRange: [0, -16] });

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" />

      <LinearGradient colors={['#060C1F', '#0B1330', '#1E2F6B']} style={styles.topPanel}>
        <Image source={require('../../../assets/images/homescreenheader.png')} style={styles.heroBgImage} resizeMode="cover" />
        <View style={styles.heroScrim} />
        <View style={styles.heroDecor1} />
        <View style={styles.heroDecor2} />
        <View style={styles.logoWrap}>
          <Text style={[styles.logoAr, { fontFamily: 'Amiri_400Regular' }]}>عِلْم</Text>
          <LinearGradient colors={['rgba(212,169,62,0.2)', 'rgba(212,169,62,0.05)']} style={styles.logoIcon}>
            <Ionicons name="book" size={28} color={colors.gold[400]} />
          </LinearGradient>
        </View>
        <Text style={styles.appName}>IlmAI</Text>
        <Text style={styles.tagline}>{t('auth.welcomeSubtitle')}</Text>
      </LinearGradient>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
        <ScrollView contentContainerStyle={styles.form} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

          {mode === 'email' ? (
            <TouchableOpacity onPress={switchToChoice} style={styles.backRow} activeOpacity={0.7}>
              <Ionicons name="chevron-back" size={16} color={colors.gold[600]} />
              <Text style={styles.backRowText}>All sign-in options</Text>
            </TouchableOpacity>
          ) : null}

          <Text style={styles.formTitle}>{t('auth.signIn')}</Text>

          {error && (
            <View style={styles.errorBanner}>
              <Ionicons name="alert-circle-outline" size={15} color={colors.semantic.error} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {mode === 'choice' ? (
            <Animated.View style={{ opacity: choiceOpacity, transform: [{ translateY: choiceSlide }], gap: spacing.md }}>
              <TouchableOpacity style={styles.choiceBtn} onPress={switchToEmail} activeOpacity={0.85}>
                <View style={[styles.choiceIconWrap, { backgroundColor: 'rgba(212,169,62,0.12)' }]}>
                  <Ionicons name="mail-outline" size={20} color={colors.gold[600]} />
                </View>
                <Text style={styles.choiceLabel}>Continue with Email</Text>
                <Ionicons name="chevron-forward" size={16} color={colors.parchment[400]} />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.choiceBtn}
                onPress={() => { setError(null); promptGoogleSignIn(); }}
                disabled={!request || googleLoading}
                activeOpacity={0.85}
              >
                <View style={[styles.choiceIconWrap, { backgroundColor: 'rgba(66,133,244,0.1)' }]}>
                  {googleLoading
                    ? <Ionicons name="sync" size={18} color="#4285F4" />
                    : <Text style={styles.choiceGoogleG}>G</Text>}
                </View>
                <Text style={styles.choiceLabel}>Continue with Google</Text>
                <Ionicons name="chevron-forward" size={16} color={colors.parchment[400]} />
              </TouchableOpacity>

              <TouchableOpacity style={styles.choiceBtn} onPress={() => nav.navigate('PhoneAuth')} activeOpacity={0.85}>
                <View style={[styles.choiceIconWrap, { backgroundColor: 'rgba(74,222,128,0.12)' }]}>
                  <Ionicons name="call-outline" size={20} color="#22A85C" />
                </View>
                <Text style={styles.choiceLabel}>Continue with Phone</Text>
                <Ionicons name="chevron-forward" size={16} color={colors.parchment[400]} />
              </TouchableOpacity>
            </Animated.View>
          ) : (
            <Animated.View style={{ opacity: emailOpacity, transform: [{ translateY: emailSlide }], gap: spacing.md }}>
              <AuthTextInput label={t('auth.email')} value={email} onChangeText={setEmail} keyboardType="email-address" textContentType="emailAddress" autoFocus />
              <AuthTextInput label={t('auth.password')} value={password} onChangeText={setPassword} secureTextEntry textContentType="password" />

              <TouchableOpacity onPress={() => nav.navigate('ForgotPassword')} style={styles.forgotLink}>
                <Text style={styles.link}>{t('auth.forgotPassword')}</Text>
              </TouchableOpacity>

              <AuthButton label={t('auth.signIn')} onPress={handleSignIn} isLoading={isLoading} />
            </Animated.View>
          )}

          {/* Guest */}
          <TouchableOpacity style={styles.guestBtn} onPress={continueAsGuest}>
            <Ionicons name="person-outline" size={16} color={colors.parchment[600]} />
            <Text style={styles.guestText}>{t('auth.continueAsGuest')}</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => nav.navigate('SignUp')} style={styles.switchLink}>
            <Text style={styles.switchText}>
              {t('auth.noAccount')}{' '}
              <Text style={styles.link}>Create account</Text>
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.parchment[50] },
  flex: { flex: 1 },
  topPanel: {
    paddingTop: spacing.xxxl + spacing.lg, paddingBottom: spacing.xxl,
    paddingHorizontal: spacing.xl, alignItems: 'center', gap: spacing.sm,
    borderBottomLeftRadius: radius.xl, borderBottomRightRadius: radius.xl, overflow: 'hidden',
  },
  heroBgImage: { position: 'absolute', right: 0, bottom: 0, width: '100%', height: '130%', opacity: 0.26 },
  heroScrim: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(6,12,31,0.5)' },
  heroDecor1: { position: 'absolute', right: -60, top: -60, width: 200, height: 200, borderRadius: 100, borderWidth: 1, borderColor: 'rgba(212,169,62,0.12)' },
  heroDecor2: { position: 'absolute', left: -40, bottom: -40, width: 140, height: 140, borderRadius: 70, borderWidth: 1, borderColor: 'rgba(212,169,62,0.07)' },
  logoWrap: { alignItems: 'center', gap: spacing.xs },
  logoAr: { fontSize: 18, color: colors.gold[500], letterSpacing: 2 },
  logoIcon: { width: 64, height: 64, borderRadius: 20, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(212,169,62,0.25)' },
  appName: { ...typography.displayMd, color: colors.white },
  tagline: { ...typography.bodySmall, color: 'rgba(255,255,255,0.4)', textAlign: 'center' },
  form: { paddingHorizontal: spacing.xl, paddingTop: spacing.xxl, paddingBottom: spacing.xxxl, gap: spacing.md },
  backRow: { flexDirection: 'row', alignItems: 'center', gap: 2, alignSelf: 'flex-start', marginBottom: -spacing.xs },
  backRowText: { ...typography.bodySmall, color: colors.gold[600], fontWeight: '700' },
  formTitle: { ...typography.displayMd, color: colors.parchment[950], marginBottom: spacing.sm },
  errorBanner: {
    flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm,
    backgroundColor: colors.semantic.errorLight, borderRadius: radius.sm,
    padding: spacing.md, borderLeftWidth: 3, borderLeftColor: colors.semantic.error,
  },
  errorText: { ...typography.bodySmall, color: colors.semantic.error, flex: 1 },
  forgotLink: { alignSelf: 'flex-end', marginTop: -spacing.xs },
  link: { ...typography.bodySmall, color: colors.gold[600], fontWeight: '700' },

  choiceBtn: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    backgroundColor: colors.white, borderRadius: radius.md,
    paddingHorizontal: spacing.lg, paddingVertical: spacing.md,
    borderWidth: 1.5, borderColor: colors.parchment[200], ...shadow.xs,
  },
  choiceIconWrap: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  choiceLabel: { ...typography.bodyMedium, color: colors.parchment[950], flex: 1, fontWeight: '600' },
  choiceGoogleG: { fontSize: 16, fontWeight: '700', color: '#4285F4' },

  guestBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm,
    paddingVertical: spacing.md, borderRadius: radius.md, borderWidth: 1.5,
    borderColor: colors.parchment[200], borderStyle: 'dashed', marginTop: spacing.sm,
  },
  guestText: { ...typography.bodySmall, color: colors.parchment[600], fontWeight: '500' },
  switchLink: { alignSelf: 'center', marginTop: spacing.sm },
  switchText: { ...typography.bodySmall, color: colors.parchment[500] },
});
