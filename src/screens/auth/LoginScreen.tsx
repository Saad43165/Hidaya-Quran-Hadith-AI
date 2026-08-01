import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthTextInput } from '../../components/auth/AuthTextInput';
import { AuthButton } from '../../components/auth/AuthButton';
import { signInWithEmail, resetPassword } from '../../services/firebase/auth';
import { getAuthErrorMessage } from '../../services/firebase/authErrors';
import { isFirebaseConfigured } from '../../services/firebase/config';
import { useAuthStore } from '../../store/useAuthStore';
import { colors, radius, spacing, typography } from '../../theme';
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

  const handleForgotPassword = () => nav.navigate('ForgotPassword');

  return (
    <View style={styles.root}>
      {/* Top decorative panel */}
      <LinearGradient colors={[colors.navy[950], colors.navy[700]]} style={styles.topPanel}>
        <View style={styles.logoWrap}>
          <Ionicons name="book" size={32} color={colors.gold[400]} />
        </View>
        <Text style={styles.appName}>{t('common.appName')}</Text>
        <Text style={styles.tagline}>{t('auth.welcomeSubtitle')}</Text>
      </LinearGradient>

      {/* Form card */}
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
        <ScrollView
          contentContainerStyle={styles.form}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.formTitle}>{t('auth.signIn')}</Text>

          {error  && <View style={styles.banner}><Text style={styles.bannerError}>{error}</Text></View>}
          {notice && <View style={[styles.banner, styles.bannerSuccess]}><Text style={styles.bannerSuccessText}>{notice}</Text></View>}

          <AuthTextInput label={t('auth.email')} value={email} onChangeText={setEmail} keyboardType="email-address" textContentType="emailAddress" />
          <AuthTextInput label={t('auth.password')} value={password} onChangeText={setPassword} secureTextEntry textContentType="password" />

          <TouchableOpacity onPress={handleForgotPassword} style={styles.forgotLink}>
            <Text style={styles.link}>{t('auth.forgotPassword')}</Text>
          </TouchableOpacity>

          <AuthButton label={t('auth.signIn')} onPress={handleSignIn} isLoading={isLoading} />

          <View style={styles.dividerRow}>
            <View style={styles.divLine} /><Text style={styles.divText}>or</Text><View style={styles.divLine} />
          </View>

          <AuthButton label={t('auth.continueAsGuest')} onPress={continueAsGuest} variant="secondary" />

          <TouchableOpacity onPress={() => nav.navigate('SignUp')} style={styles.switchLink}>
            <Text style={styles.link}>{t('auth.noAccount')}</Text>
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
    paddingTop: spacing.xxxl,
    paddingBottom: spacing.xxl,
    paddingHorizontal: spacing.xl,
    alignItems: 'center',
    gap: spacing.sm,
    borderBottomLeftRadius: radius.xl,
    borderBottomRightRadius: radius.xl,
  },
  logoWrap: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: 'rgba(212,169,62,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  appName: { ...typography.displayMd, color: colors.white },
  tagline: { ...typography.bodySmall, color: 'rgba(255,255,255,0.5)', textAlign: 'center' },
  form: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xxl,
    paddingBottom: spacing.xxxl,
    gap: 0,
  },
  formTitle: { ...typography.displayMd, color: colors.parchment[950], marginBottom: spacing.xl },
  banner: {
    backgroundColor: colors.semantic.errorLight,
    borderRadius: radius.sm,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  bannerError: { ...typography.bodySmall, color: colors.semantic.error },
  bannerSuccess: { backgroundColor: colors.semantic.successLight },
  bannerSuccessText: { ...typography.bodySmall, color: colors.semantic.success },
  forgotLink: { alignSelf: 'flex-end', marginBottom: spacing.xl, marginTop: -spacing.sm },
  link: { ...typography.bodySmall, color: colors.gold[600], fontWeight: '600' },
  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginVertical: spacing.xl },
  divLine: { flex: 1, height: 1, backgroundColor: colors.parchment[300] },
  divText: { ...typography.caption, color: colors.parchment[500] },
  switchLink: { alignSelf: 'center', marginTop: spacing.lg },
});
