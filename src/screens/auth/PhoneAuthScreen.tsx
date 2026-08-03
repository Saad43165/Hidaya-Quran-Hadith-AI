import React, { useRef, useState } from 'react';
import {
  Image, KeyboardAvoidingView, Modal, Platform, StatusBar, StyleSheet,
  Text, TouchableOpacity, View,
} from 'react-native';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { PhoneAuthProvider, signInWithCredential } from 'firebase/auth';
import { AuthTextInput } from '../../components/auth/AuthTextInput';
import { AuthButton } from '../../components/auth/AuthButton';
import { BackButton } from '../../components/common/BackButton';
import { getAuthErrorMessage } from '../../services/firebase/authErrors';
import { getFirebaseAuth } from '../../services/firebase/config';
import { colors, radius, spacing, typography } from '../../theme';

// Firebase config injected into WebView HTML for reCAPTCHA flow
const FIREBASE_CONFIG = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
};

function buildRecaptchaHtml(phoneNumber: string): string {
  const cfg = JSON.stringify(FIREBASE_CONFIG);
  return `<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width,initial-scale=1">
<style>
  body { margin:0; display:flex; align-items:center; justify-content:center;
         min-height:100vh; background:#060C1F; font-family:sans-serif; }
  #status { color:#fff; font-size:14px; text-align:center; padding:20px; }
</style>
</head>
<body>
<div id="status">Verifying…</div>
<div id="recaptcha-container"></div>
<script src="https://www.gstatic.com/firebasejs/10.14.0/firebase-app-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/10.14.0/firebase-auth-compat.js"></script>
<script>
  firebase.initializeApp(${cfg});
  var auth = firebase.auth();
  auth.useDeviceLanguage();
  var verifier = new firebase.auth.RecaptchaVerifier('recaptcha-container', {
    size: 'invisible',
    callback: function() {}
  });
  auth.signInWithPhoneNumber('${phoneNumber}', verifier)
    .then(function(result) {
      window.ReactNativeWebView.postMessage(JSON.stringify({
        type: 'VERIFICATION_ID',
        verificationId: result.verificationId
      }));
    })
    .catch(function(err) {
      window.ReactNativeWebView.postMessage(JSON.stringify({
        type: 'ERROR',
        message: err.message || 'Failed to send code'
      }));
    });
</script>
</body>
</html>`;
}

export function PhoneAuthScreen() {
  const nav = useNavigation();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationId, setVerificationId] = useState<string | null>(null);
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showWebView, setShowWebView] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSendCode = () => {
    if (!phoneNumber.trim()) {
      setError('Enter your phone number with country code (+92…)');
      return;
    }
    setError(null);
    setIsLoading(true);
    setShowWebView(true);
  };

  const handleWebViewMessage = (event: WebViewMessageEvent) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'VERIFICATION_ID') {
        setVerificationId(data.verificationId);
        setShowWebView(false);
        setIsLoading(false);
      } else if (data.type === 'ERROR') {
        setShowWebView(false);
        setIsLoading(false);
        setError(data.message);
      }
    } catch {
      setShowWebView(false);
      setIsLoading(false);
      setError('Verification failed. Try again.');
    }
  };

  const handleVerifyCode = async () => {
    if (!verificationId) return;
    if (!otp.trim() || otp.length < 6) {
      setError('Enter the 6-digit code from your SMS.');
      return;
    }
    setError(null);
    setIsLoading(true);
    try {
      const auth = getFirebaseAuth();
      if (!auth) throw new Error('Firebase is not configured yet — add EXPO_PUBLIC_FIREBASE_* keys to your .env file.');
      const credential = PhoneAuthProvider.credential(verificationId, otp.trim());
      await signInWithCredential(auth, credential);
    } catch (e) {
      setError(getAuthErrorMessage(e));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" />

      {/* reCAPTCHA WebView Modal */}
      <Modal
        visible={showWebView}
        animationType="fade"
        transparent
        onRequestClose={() => { setShowWebView(false); setIsLoading(false); }}
      >
        <View style={styles.webViewOverlay}>
          <WebView
            source={{ html: buildRecaptchaHtml(phoneNumber.trim()) }}
            onMessage={handleWebViewMessage}
            style={styles.webView}
            javaScriptEnabled
          />
        </View>
      </Modal>

      <LinearGradient colors={['#060C1F', '#0B1330', '#1E2F6B']} style={styles.hero}>
        <Image source={require('../../../assets/images/prayerscreenheader.png')} style={styles.heroBgImage} resizeMode="cover" />
        <View style={styles.heroScrim} />
        <BackButton color="rgba(255,255,255,0.7)" style={styles.backBtn} />
        <Ionicons name="call" size={40} color={colors.gold[400]} style={{ marginBottom: spacing.sm }} />
        <Text style={styles.heroTitle}>Phone Sign-In</Text>
        <Text style={styles.heroSub}>
          {verificationId ? 'Enter the code we sent you' : "We'll send a verification code"}
        </Text>
      </LinearGradient>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
        <View style={styles.form}>

          {error && (
            <View style={styles.errorBanner}>
              <Ionicons name="alert-circle-outline" size={15} color={colors.semantic.error} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {!verificationId ? (
            <>
              <Text style={styles.formTitle}>Your phone number</Text>
              <Text style={styles.formSub}>Include country code, e.g. +92 300 1234567</Text>
              <AuthTextInput
                label="Phone number"
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                keyboardType="phone-pad"
                textContentType="telephoneNumber"
              />
              <AuthButton label="Send verification code" onPress={handleSendCode} isLoading={isLoading} />
            </>
          ) : (
            <>
              <Text style={styles.formTitle}>Enter OTP</Text>
              <Text style={styles.formSub}>6-digit code sent to {phoneNumber}</Text>
              <AuthTextInput
                label="Verification code"
                value={otp}
                onChangeText={setOtp}
                keyboardType="number-pad"
                textContentType="oneTimeCode"
              />
              <AuthButton label="Verify & sign in" onPress={handleVerifyCode} isLoading={isLoading} />
              <TouchableOpacity
                onPress={() => { setVerificationId(null); setOtp(''); setError(null); }}
                style={styles.changeBtn}
              >
                <Text style={styles.changeText}>Change phone number</Text>
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
  webViewOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.85)',
    alignItems: 'center', justifyContent: 'center',
  },
  webView: { width: 1, height: 1, opacity: 0 },
  hero: {
    paddingTop: spacing.xxxl + spacing.lg,
    paddingBottom: spacing.xxl,
    paddingHorizontal: spacing.xl,
    alignItems: 'center',
    borderBottomLeftRadius: radius.xl,
    borderBottomRightRadius: radius.xl,
    overflow: 'hidden',
  },
  heroBgImage: { position: 'absolute', right: 0, bottom: 0, width: '100%', height: '130%', opacity: 0.24 },
  heroScrim: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(6,12,31,0.5)' },
  backBtn: { position: 'absolute', top: spacing.xxxl, left: spacing.lg },
  heroTitle: { ...typography.displayMd, color: colors.white },
  heroSub: { ...typography.bodySmall, color: 'rgba(255,255,255,0.4)', textAlign: 'center' },
  form: { flex: 1, paddingHorizontal: spacing.xl, paddingTop: spacing.xxl, gap: spacing.md },
  formTitle: { ...typography.displayMd, color: colors.parchment[950] },
  formSub: { ...typography.bodySmall, color: colors.parchment[500], marginTop: -spacing.xs },
  errorBanner: {
    flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm,
    backgroundColor: colors.semantic.errorLight, borderRadius: radius.sm,
    padding: spacing.md, borderLeftWidth: 3, borderLeftColor: colors.semantic.error,
  },
  errorText: { ...typography.bodySmall, color: colors.semantic.error, flex: 1 },
  changeBtn: { alignSelf: 'center', padding: spacing.sm },
  changeText: { ...typography.bodySmall, color: colors.gold[600], fontWeight: '700' },
});
