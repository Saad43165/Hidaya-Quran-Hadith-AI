import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthTextInput } from '../../components/auth/AuthTextInput';
import { AuthButton } from '../../components/auth/AuthButton';
import { signInWithEmail } from '../../services/firebase/auth';
import { getAuthErrorMessage } from '../../services/firebase/authErrors';
import { isFirebaseConfigured } from '../../services/firebase/config';
import { useAuthStore } from '../../store/useAuthStore';
import { colors, radius, shadow, spacing, typography } from '../../theme';
import type { AuthStackParamList } from '../../navigation/types';

type Nav = NativeStackNavigationProp<AuthStackParamList>;

export function LoginScreen() {
  const { t } = useTranslation();
  const nav = useNavigation<Nav>();
  const continueAsGuest = useAuthStore(s => s.continueAsGuest);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(isFirebaseConfigured() ? null : t('auth.notConfiguredNotice'));
  const [notice, setNotice] = useState<string | null>(null);

  const handleSignIn = async () => {
    setError(null); setNotice(null); setIsLoading(true);
    try { await signInWithEmail(email.trim(), password); }
    catch (e) { setError(getAuthErrorMessage(e)); }
    finally { setIsLoading(false); }
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" />

      {/* Top hero panel */}
      <LinearGradient colors={['#060C1F', '#0B1330', '#1E2F6B']} style={styles.topPanel}>
        <View style={styles.heroDecor1} />
        <View style={styles.heroDecor2} />

        {/* Logo */}
        <View style={styles.logoWrap}>
          <Text style={[styles.logoAr, { fontFamily: 'Amiri_400Regular' }]}>كِتَاب</Text>
          <LinearGradient colors={['rgba(212,169,62,0.2)', 'rgba(212,169,62,0.05)']} style={styles.logoIcon}>
            <Ionicons name="book" size={28} color={colors.gold[400]} />
          </LinearGradient>
        </View>
        <Text style={styles.appName}>{t('common.appName')}</Text>
        <Text style={styles.tagline}>{t('auth.welcomeSubtitle')}</Text>
      </LinearGradient>

      {/* Form */}
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
        <ScrollView
          contentContainerStyle={styles.form}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.formTitle}>{t('auth.signIn')}</Text>

          {error  && (
            <View style={styles.errorBanner}>
              <Ionicons name="alert-circle-outline" size={15} color={colors.semantic.error} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}
          {notice && (
            <View style={styles.successBanner}>
              <Ionicons name="checkmark-circle-outline" size={15} color={colors.semantic.success} />
              <Text style={styles.successText}>{notice}</Text>
            </View>
          )}

          <AuthTextInput
            label={t('auth.email')}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            textContentType="emailAddress"
          />
          <AuthTextInput
            label={t('auth.password')}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            textContentType="password"
          />

          <TouchableOpacity onPress={() => nav.navigate('ForgotPassword')} style={styles.forgotLink}>
            <Text style={styles.link}>{t('auth.forgotPassword')}</Text>
          </TouchableOpacity>

          <AuthButton label={t('auth.signIn')} onPress={handleSignIn} isLoading={isLoading} />

          <View style={styles.dividerRow}>
            <View style={styles.divLine} />
            <Text style={styles.divText}>or continue with</Text>
            <View style={styles.divLine} />
          </View>

          <View style={styles.socialRow}>
            <TouchableOpacity style={[styles.socialBtn, { opacity: 0.5 }]} onPress={() => alert('Phone auth requires native recaptcha integration (coming soon).')} activeOpacity={1}>
              <Ionicons name="call-outline" size={18} color={colors.navy[700]} />
              <Text style={styles.socialLabel}>Phone</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.socialBtn, { opacity: 0.5 }]} onPress={() => alert('Google Sign-In requires native module configuration (coming soon).')} activeOpacity={1}>
              <Text style={styles.socialGoogleG}>G</Text>
              <Text style={styles.socialLabel}>Google</Text>
            </TouchableOpacity>
          </View>

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

  // Hero
  topPanel: {
    paddingTop: spacing.xxxl + spacing.lg,
    paddingBottom: spacing.xxl,
    paddingHorizontal: spacing.xl,
    alignItems: 'center',
    gap: spacing.sm,
    borderBottomLeftRadius: radius.xl,
    borderBottomRightRadius: radius.xl,
    overflow: 'hidden',
  },
  heroDecor1: {
    position: 'absolute', right: -60, top: -60,
    width: 200, height: 200, borderRadius: 100,
    borderWidth: 1, borderColor: 'rgba(212,169,62,0.12)',
  },
  heroDecor2: {
    position: 'absolute', left: -40, bottom: -40,
    width: 140, height: 140, borderRadius: 70,
    borderWidth: 1, borderColor: 'rgba(212,169,62,0.07)',
  },
  logoWrap: { alignItems: 'center', gap: spacing.xs },
  logoAr: { fontSize: 18, color: colors.gold[500], letterSpacing: 2 },
  logoIcon: {
    width: 64,
    height: 64,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(212,169,62,0.25)',
  },
  appName: { ...typography.displayMd, color: colors.white },
  tagline: { ...typography.bodySmall, color: 'rgba(255,255,255,0.4)', textAlign: 'center' },

  // Form
  form: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xxl,
    paddingBottom: spacing.xxxl,
    gap: spacing.md,
  },
  formTitle: { ...typography.displayMd, color: colors.parchment[950], marginBottom: spacing.sm },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    backgroundColor: colors.semantic.errorLight,
    borderRadius: radius.sm,
    padding: spacing.md,
    borderLeftWidth: 3,
    borderLeftColor: colors.semantic.error,
  },
  errorText: { ...typography.bodySmall, color: colors.semantic.error, flex: 1 },
  successBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    backgroundColor: colors.semantic.successLight,
    borderRadius: radius.sm,
    padding: spacing.md,
    borderLeftWidth: 3,
    borderLeftColor: colors.semantic.success,
  },
  successText: { ...typography.bodySmall, color: colors.semantic.success, flex: 1 },
  forgotLink: { alignSelf: 'flex-end', marginTop: -spacing.xs },
  link: { ...typography.bodySmall, color: colors.gold[600], fontWeight: '700' },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginVertical: spacing.xs,
  },
  divLine: { flex: 1, height: 1, backgroundColor: colors.parchment[200] },
  divText: { ...typography.caption, color: colors.parchment[500] },

  // Social
  socialRow: { flexDirection: 'row', gap: spacing.sm },
  socialBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.white,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    borderWidth: 1.5,
    borderColor: colors.parchment[200],
    ...shadow.xs,
  },
  socialLabel: { ...typography.bodySmall, color: colors.parchment[950], fontWeight: '600' },
  socialGoogleG: { fontSize: 16, fontWeight: '700', color: '#4285F4' },

  guestBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.parchment[200],
    borderStyle: 'dashed',
  },
  guestText: { ...typography.bodySmall, color: colors.parchment[600], fontWeight: '500' },
  switchLink: { alignSelf: 'center', marginTop: spacing.sm },
  switchText: { ...typography.bodySmall, color: colors.parchment[500] },
});
