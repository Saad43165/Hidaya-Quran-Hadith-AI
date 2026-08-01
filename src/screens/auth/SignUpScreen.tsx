import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { AuthTextInput } from '../../components/auth/AuthTextInput';
import { AuthButton } from '../../components/auth/AuthButton';
import { registerWithEmail } from '../../services/firebase/auth';
import { getAuthErrorMessage } from '../../services/firebase/authErrors';
import { isFirebaseConfigured } from '../../services/firebase/config';
import { colors, spacing, typography } from '../../theme';
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
    <ScreenContainer>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <Text style={styles.title}>{t('auth.signUp')}</Text>

          {formError ? <Text style={styles.errorBanner}>{formError}</Text> : null}

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
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scrollContent: {
    paddingTop: spacing.xxxl,
    paddingBottom: spacing.xxl,
  },
  title: {
    ...typography.displayMd,
    color: colors.navy[900],
    marginBottom: spacing.xl,
  },
  errorBanner: {
    ...typography.bodySmall,
    color: colors.semantic.error,
    backgroundColor: '#FBEAE5',
    padding: spacing.md,
    borderRadius: 10,
    marginBottom: spacing.lg,
  },
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
