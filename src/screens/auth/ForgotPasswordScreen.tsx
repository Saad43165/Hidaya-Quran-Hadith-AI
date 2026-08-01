import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthTextInput } from '../../components/auth/AuthTextInput';
import { AuthButton } from '../../components/auth/AuthButton';
import { resetPassword } from '../../services/firebase/auth';
import { getAuthErrorMessage } from '../../services/firebase/authErrors';
import { colors, gradients, radius, spacing, typography } from '../../theme';
import type { AuthStackParamList } from '../../navigation/types';

type Nav = NativeStackNavigationProp<AuthStackParamList>;

export function ForgotPasswordScreen() {
  const nav = useNavigation<Nav>();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const handleReset = async () => {
    if (!email.trim()) { setError('Please enter your email address.'); return; }
    setError(null); setIsLoading(true);
    try {
      await resetPassword(email.trim());
      setSent(true);
    } catch (e) {
      setError(getAuthErrorMessage(e));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.root}>
      <LinearGradient colors={gradients.heroNavy} style={styles.topPanel}>
        <TouchableOpacity style={styles.backBtn} onPress={() => nav.goBack()}>
          <Ionicons name="chevron-back" size={22} color={colors.gold[400]} />
        </TouchableOpacity>
        <View style={styles.iconWrap}>
          <Ionicons name="mail-unread-outline" size={32} color={colors.gold[400]} />
        </View>
        <Text style={styles.panelTitle}>Reset Password</Text>
        <Text style={styles.panelSub}>
          Enter your email and we'll send you a link to reset your password.
        </Text>
      </LinearGradient>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
        <View style={styles.form}>
          {sent ? (
            <View style={styles.successCard}>
              <Ionicons name="checkmark-circle" size={48} color={colors.semantic.success} />
              <Text style={styles.successTitle}>Email Sent!</Text>
              <Text style={styles.successText}>
                Check your inbox for a password reset link. It may take a few minutes to arrive.
              </Text>
              <TouchableOpacity style={styles.backToLogin} onPress={() => nav.goBack()}>
                <Text style={styles.backToLoginText}>Back to Sign In</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              {error && (
                <View style={styles.errorBanner}>
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              )}
              <AuthTextInput
                label="Email Address"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                textContentType="emailAddress"
                placeholder="your@email.com"
                autoFocus
              />
              <AuthButton label="Send Reset Link" onPress={handleReset} isLoading={isLoading} />
              <TouchableOpacity style={styles.cancelBtn} onPress={() => nav.goBack()}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.parchment[50] },
  flex: { flex: 1 },
  topPanel: {
    paddingTop: spacing.xl,
    paddingBottom: spacing.xxl,
    paddingHorizontal: spacing.xl,
    gap: spacing.sm,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: radius.sm,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: spacing.md,
  },
  iconWrap: {
    width: 64, height: 64, borderRadius: 20,
    backgroundColor: 'rgba(212,169,62,0.15)',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  panelTitle: { ...typography.displayMd, color: colors.white },
  panelSub: { ...typography.bodySmall, color: 'rgba(255,255,255,0.5)', lineHeight: 22 },
  form: {
    padding: spacing.xl,
    flex: 1,
    gap: spacing.lg,
  },
  errorBanner: {
    backgroundColor: colors.semantic.errorLight,
    borderRadius: radius.sm,
    padding: spacing.md,
  },
  errorText: { ...typography.bodySmall, color: colors.semantic.error },
  cancelBtn: { alignSelf: 'center', paddingVertical: spacing.sm },
  cancelText: { ...typography.bodySmall, color: colors.parchment[500] },
  successCard: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    gap: spacing.lg, paddingHorizontal: spacing.md,
  },
  successTitle: { ...typography.displayMd, color: colors.parchment[950] },
  successText: { ...typography.body, color: colors.parchment[600], textAlign: 'center', lineHeight: 24 },
  backToLogin: {
    backgroundColor: colors.navy[900],
    paddingHorizontal: spacing.xxl,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    marginTop: spacing.md,
  },
  backToLoginText: { ...typography.subheading, color: colors.white },
});
