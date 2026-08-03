import React, { useState } from 'react';
import { Image, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthTextInput } from '../../components/auth/AuthTextInput';
import { AuthButton } from '../../components/auth/AuthButton';
import { BackButton } from '../../components/common/BackButton';
import { registerWithEmail } from '../../services/firebase/auth';
import { getAuthErrorMessage } from '../../services/firebase/authErrors';
import { isFirebaseConfigured } from '../../services/firebase/config';
import { colors, radius, spacing, typography } from '../../theme';
import type { AuthStackParamList } from '../../navigation/types';

type Nav = NativeStackNavigationProp<AuthStackParamList>;

export function SignUpScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation<Nav>();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(
    isFirebaseConfigured() ? null : t('auth.notConfiguredNotice')
  );

  const handleSignUp = async () => {
    setFormError(null);

    if (password.length < 6) {
      setFormError('Password should be at least 6 characters.');
      return;
    }

    setIsLoading(true);
    try {
      await registerWithEmail(name, email.trim(), password);
      // RootNavigator reacts to the auth state change automatically.
    } catch (e) {
      setFormError(getAuthErrorMessage(e));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.root}>
      <LinearGradient colors={['#060C1F', '#0B1330', '#1E2F6B']} style={styles.hero}>
        <Image source={require('../../../assets/images/homescreenheader.png')} style={styles.heroBgImage} resizeMode="cover" />
        <View style={styles.heroScrim} />
        <BackButton style={styles.backBtn} />
        <View style={styles.iconWrap}>
          <Ionicons name="person-add" size={28} color={colors.gold[400]} />
        </View>
        <Text style={styles.heroTitle}>{t('auth.signUp')}</Text>
        <Text style={styles.heroSub}>Join your Islamic companion</Text>
      </LinearGradient>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          {formError ? (
            <View style={styles.errorBanner}>
              <Ionicons name="alert-circle-outline" size={15} color={colors.semantic.error} />
              <Text style={styles.errorText}>{formError}</Text>
            </View>
          ) : null}

          <AuthTextInput label={t('auth.name')} value={name} onChangeText={setName} textContentType="name" />
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
            textContentType="newPassword"
          />

          <AuthButton label={t('auth.signUp')} onPress={handleSignUp} isLoading={isLoading} />

          <TouchableOpacity onPress={() => navigation.navigate('Login')} style={styles.switchLink}>
            <Text style={styles.linkText}>{t('auth.haveAccount')}</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.parchment[50] },
  flex: { flex: 1 },
  hero: {
    paddingTop: spacing.xxxl + spacing.lg,
    paddingBottom: spacing.xxl,
    paddingHorizontal: spacing.xl,
    alignItems: 'center',
    gap: spacing.xs,
    borderBottomLeftRadius: radius.xl,
    borderBottomRightRadius: radius.xl,
    overflow: 'hidden',
  },
  heroBgImage: { position: 'absolute', right: 0, bottom: 0, width: '100%', height: '130%', opacity: 0.28 },
  heroScrim: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(6,12,31,0.5)' },
  backBtn: { position: 'absolute', top: spacing.xxxl, left: spacing.lg },
  iconWrap: {
    width: 64, height: 64, borderRadius: 20,
    backgroundColor: 'rgba(212,169,62,0.15)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: 'rgba(212,169,62,0.3)',
    marginBottom: spacing.xs,
  },
  heroTitle: { ...typography.displayMd, color: colors.white },
  heroSub: { ...typography.bodySmall, color: 'rgba(255,255,255,0.5)' },
  scrollContent: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xxl,
    paddingBottom: spacing.xxxl,
    gap: spacing.md,
  },
  errorBanner: {
    flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm,
    backgroundColor: colors.semantic.errorLight, borderRadius: radius.sm,
    padding: spacing.md, borderLeftWidth: 3, borderLeftColor: colors.semantic.error,
  },
  errorText: { ...typography.bodySmall, color: colors.semantic.error, flex: 1 },
  switchLink: {
    alignSelf: 'center',
    marginTop: spacing.lg,
  },
  linkText: {
    ...typography.bodySmall,
    color: colors.gold[700],
    fontWeight: '600',
  },
});
