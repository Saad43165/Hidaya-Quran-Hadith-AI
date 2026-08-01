import React, { useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
// import { FirebaseRecaptchaVerifierModal } from 'expo-firebase-recaptcha'; // UNINSTALLED
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import { AuthTextInput } from '../../components/auth/AuthTextInput';
import { AuthButton } from '../../components/auth/AuthButton';
import { sendPhoneVerificationCode } from '../../services/firebase/auth';
import { getAuthErrorMessage } from '../../services/firebase/authErrors';
import { colors, radius, spacing, typography } from '../../theme';
import { getApps, getApp } from 'firebase/app';
import type { ConfirmationResult } from 'firebase/auth';

export function PhoneAuthScreen() {
  const { t } = useTranslation();
  const nav = useNavigation();
  const recaptchaVerifier = useRef(null);
  
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationId, setVerificationId] = useState<ConfirmationResult | null>(null);
  const [verificationCode, setVerificationCode] = useState('');
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const app = getApps().length ? getApp() : undefined;

  const handleSendCode = async () => {
    setError(null); setIsLoading(true);
    try {
      const result = await sendPhoneVerificationCode(phoneNumber, recaptchaVerifier.current as any);
      setVerificationId(result);
    } catch (e) {
      setError(getAuthErrorMessage(e));
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!verificationId) return;
    setError(null); setIsLoading(true);
    try {
      await verificationId.confirm(verificationCode);
      // Navigation is handled by auth state listener in RootNavigator
    } catch (e) {
      setError(getAuthErrorMessage(e));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.root}>
      {/* app && (
        <FirebaseRecaptchaVerifierModal
          ref={recaptchaVerifier}
          firebaseConfig={app.options}
          attemptInvisibleVerification={true}
        />
      ) */}
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
        <ScrollView contentContainerStyle={styles.form} keyboardShouldPersistTaps="handled">
          <Text style={styles.formTitle}>Phone Authentication</Text>

          {error && <View style={styles.banner}><Text style={styles.bannerError}>{error}</Text></View>}

          {!verificationId ? (
            <View style={{ gap: spacing.md }}>
              <AuthTextInput 
                label="Phone Number" 
                value={phoneNumber} 
                onChangeText={setPhoneNumber} 
                keyboardType="phone-pad" 
                textContentType="telephoneNumber" 
                placeholder="+1 234 567 8900"
              />
              <AuthButton label="Send Verification Code" onPress={handleSendCode} isLoading={isLoading} />
            </View>
          ) : (
            <View style={{ gap: spacing.md }}>
              <AuthTextInput 
                label="Verification Code" 
                value={verificationCode} 
                onChangeText={setVerificationCode} 
                keyboardType="number-pad" 
                textContentType="oneTimeCode" 
              />
              <AuthButton label="Verify Code" onPress={handleVerifyCode} isLoading={isLoading} />
              <AuthButton label="Back" onPress={() => setVerificationId(null)} variant="secondary" />
            </View>
          )}

          <View style={{ marginTop: spacing.xl }}>
            <AuthButton label="Cancel" onPress={() => nav.goBack()} variant="secondary" />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.parchment[50] },
  flex: { flex: 1 },
  form: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xxl,
    paddingBottom: spacing.xxxl,
    gap: spacing.lg,
  },
  formTitle: { ...typography.displayMd, color: colors.parchment[950], marginBottom: spacing.xl },
  banner: {
    backgroundColor: colors.semantic.errorLight,
    borderRadius: radius.sm,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  bannerError: { ...typography.bodySmall, color: colors.semantic.error },
});
