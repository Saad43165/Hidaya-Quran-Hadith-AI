import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator, Alert, Animated, Easing, FlatList, KeyboardAvoidingView,
  Platform, Share, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { ChatBubble } from '../../components/assistant/ChatBubble';
import { sendAssistantMessage, AssistantNotConfiguredError } from '../../services/api/aiAssistantApi';
import { ChatMessage } from '../../types/models';
import { colors, radius, shadow, spacing, typography } from '../../theme';

const MESSAGES_KEY = 'kitaabai.assistant.messages';
const MAX_STORED   = 50;

const SUGGESTIONS: { text: string; icon: keyof typeof Ionicons.glyphMap; color: string }[] = [
  { text: 'What is the meaning of Surah Al-Fatiha?',    icon: 'book-outline',    color: '#F59E0B' },
  { text: 'Explain the importance of Salah in Islam',    icon: 'time-outline',    color: '#4ADE80' },
  { text: 'What does Sabr (patience) mean in Islam?',    icon: 'heart-outline',   color: '#F472B6' },
  { text: 'What are the five pillars of Islam?',          icon: 'layers-outline',  color: '#38BDF8' },
  { text: 'How to perform Wudu step by step?',            icon: 'water-outline',   color: '#818CF8' },
];

export function AssistantScreen() {
  const { t } = useTranslation();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const listRef = useRef<FlatList>(null);
  const inputScaleAnim = useRef(new Animated.Value(1)).current;

  // Persist messages
  useEffect(() => {
    AsyncStorage.getItem(MESSAGES_KEY).then(raw => {
      if (raw) {
        try { setMessages(JSON.parse(raw) as ChatMessage[]); } catch {}
      }
    }).catch(() => {});
  }, []);

  const persistMessages = (msgs: ChatMessage[]) => {
    const toStore = msgs.slice(-MAX_STORED);
    AsyncStorage.setItem(MESSAGES_KEY, JSON.stringify(toStore)).catch(() => {});
  };

  const handleSend = async (text?: string) => {
    const msg = (text ?? input).trim();
    if (!msg || isSending) return;
    const userMsg: ChatMessage = {
      id: `${Date.now()}-u`, role: 'user', content: msg, createdAt: Date.now(),
    };
    const updatedWithUser = [...messages, userMsg];
    setMessages(updatedWithUser);
    persistMessages(updatedWithUser);
    setInput('');
    setIsSending(true);
    setNotice(null);
    try {
      const reply = await sendAssistantMessage(messages, msg);
      const updatedWithReply = [...updatedWithUser, reply];
      setMessages(updatedWithReply);
      persistMessages(updatedWithReply);
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
    } catch (e) {
      if (e instanceof AssistantNotConfiguredError) setNotice(e.message);
      else setNotice(e instanceof Error ? e.message : 'Something went wrong.');
    } finally {
      setIsSending(false);
    }
  };

  const handleClearChat = () => {
    Alert.alert('Clear Conversation', 'This will remove all messages permanently.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Clear', style: 'destructive', onPress: () => {
        setMessages([]);
        AsyncStorage.removeItem(MESSAGES_KEY).catch(() => {});
      }},
    ]);
  };

  const handleShareMessage = async (content: string) => {
    try { await Share.share({ message: content }); } catch {}
  };

  const onInputFocus = () => Animated.spring(inputScaleAnim, { toValue: 1.01, useNativeDriver: true, tension: 300, friction: 10 }).start();
  const onInputBlur  = () => Animated.spring(inputScaleAnim, { toValue: 1, useNativeDriver: true, tension: 300, friction: 10 }).start();

  const hasMessages = messages.length > 0;
  const charCount   = input.length;

  return (
    <ScreenContainer noPadding>
      <StatusBar barStyle="light-content" />

      {/* ── Header ── */}
      <LinearGradient colors={['#060C1F', '#0B1330', '#041923']} style={styles.header}>
        <View style={styles.headerDecor} />
        <View style={styles.headerRow}>
          <View style={styles.headerLeft}>
            <LinearGradient colors={['rgba(56,189,248,0.2)', 'rgba(56,189,248,0.08)']} style={styles.aiAvatar}>
              <Text style={[styles.aiAvatarText, { fontFamily: 'Amiri_400Regular' }]}>ك</Text>
            </LinearGradient>
            <View>
              <Text style={styles.headerTitle}>AI Assistant</Text>
              <Text style={styles.headerSub}>Islamic context · Powered by Groq</Text>
            </View>
          </View>
          <View style={styles.headerRight}>
            <View style={styles.statusBadge}>
              <View style={styles.statusDot} />
              <Text style={styles.statusText}>Online</Text>
            </View>
            {hasMessages && (
              <TouchableOpacity onPress={handleClearChat} style={styles.clearBtn}>
                <Ionicons name="trash-outline" size={18} color="rgba(255,255,255,0.5)" />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </LinearGradient>

      {/* ── Notice ── */}
      {notice && (
        <View style={styles.noticeBanner}>
          <Ionicons name="alert-circle" size={15} color="#FCD34D" />
          <Text style={styles.noticeText}>{notice}</Text>
          <TouchableOpacity onPress={() => setNotice(null)}>
            <Ionicons name="close" size={15} color="#FCD34D" />
          </TouchableOpacity>
        </View>
      )}

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={90}
      >
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={m => m.id}
          contentContainerStyle={hasMessages ? styles.listContent : styles.emptyContent}
          onContentSizeChange={() => { if (hasMessages) listRef.current?.scrollToEnd({ animated: true }); }}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <LinearGradient colors={['#0B1330', '#1E2F6B']} style={styles.emptyIconWrap}>
                <Text style={[styles.emptyIconAr, { fontFamily: 'Amiri_400Regular' }]}>بِسْم</Text>
                <Ionicons name="sparkles" size={16} color={colors.gold[400]} />
              </LinearGradient>
              <Text style={styles.emptyTitle}>Ask me anything Islamic</Text>
              <Text style={styles.emptyDesc}>
                I can answer questions about the Quran, Hadith, Islamic history, and more. Ask in any language.
              </Text>
              <Text style={styles.suggestLabel}>SUGGESTED QUESTIONS</Text>
              {SUGGESTIONS.map(s => (
                <TouchableOpacity
                  key={s.text}
                  style={styles.suggestionRow}
                  onPress={() => handleSend(s.text)}
                  activeOpacity={0.78}
                >
                  <View style={[styles.suggestIconWrap, { backgroundColor: s.color + '18' }]}>
                    <Ionicons name={s.icon} size={16} color={s.color} />
                  </View>
                  <Text style={styles.suggestionText}>{s.text}</Text>
                  <Ionicons name="arrow-forward" size={13} color={colors.parchment[300]} />
                </TouchableOpacity>
              ))}
            </View>
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              onLongPress={() => item.role === 'assistant' && handleShareMessage(item.content)}
              activeOpacity={1}
            >
              <ChatBubble message={item} />
            </TouchableOpacity>
          )}
          ListFooterComponent={
            isSending ? (
              <View style={styles.typingRow}>
                <LinearGradient colors={['#0B1330', '#1E2F6B']} style={styles.typingAvatar}>
                  <Text style={[styles.typingAvatarText, { fontFamily: 'Amiri_400Regular' }]}>ك</Text>
                </LinearGradient>
                <View style={styles.typingBubble}>
                  <ActivityIndicator size="small" color="#38BDF8" />
                  <Text style={styles.typingText}>Thinking…</Text>
                </View>
              </View>
            ) : null
          }
        />

        {/* ── Input ── */}
        <View style={styles.inputWrap}>
          <Animated.View style={[styles.inputRow, { transform: [{ scale: inputScaleAnim }] }]}>
            <TextInput
              value={input}
              onChangeText={setInput}
              placeholder="Ask a question…"
              placeholderTextColor={colors.parchment[400]}
              style={styles.input}
              editable={!isSending}
              multiline
              maxLength={500}
              onFocus={onInputFocus}
              onBlur={onInputBlur}
            />
            <TouchableOpacity
              style={[styles.sendBtn, (!input.trim() || isSending) && styles.sendBtnOff]}
              onPress={() => handleSend()}
              disabled={!input.trim() || isSending}
            >
              {isSending
                ? <ActivityIndicator size="small" color={colors.white} />
                : <Ionicons name="send" size={16} color={colors.white} />
              }
            </TouchableOpacity>
          </Animated.View>
          <View style={styles.inputFooter}>
            <Text style={styles.disclaimer}>AI-generated responses — verify with qualified scholars.</Text>
            {charCount > 0 && (
              <Text style={[styles.charCount, charCount > 450 && { color: colors.semantic.error }]}>
                {charCount}/500
              </Text>
            )}
          </View>
        </View>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },

  header: { paddingTop: spacing.xl + spacing.lg, paddingBottom: spacing.xl, paddingHorizontal: spacing.lg, overflow: 'hidden' },
  headerDecor: { position: 'absolute', right: -40, top: -40, width: 160, height: 160, borderRadius: 80, borderWidth: 1, borderColor: 'rgba(56,189,248,0.12)' },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  aiAvatar: { width: 46, height: 46, borderRadius: 14, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(56,189,248,0.3)' },
  aiAvatarText: { fontSize: 22, color: '#38BDF8' },
  headerTitle: { ...typography.heading, color: colors.white },
  headerSub: { ...typography.caption, color: 'rgba(255,255,255,0.3)', marginTop: 2 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(74,222,128,0.15)', borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: 5, borderWidth: 1, borderColor: 'rgba(74,222,128,0.3)' },
  statusDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#4ADE80' },
  statusText: { fontSize: 11, color: '#4ADE80', fontWeight: '700' },
  clearBtn: { padding: spacing.xs },

  noticeBanner: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm, backgroundColor: 'rgba(252,211,77,0.1)', paddingHorizontal: spacing.lg, paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: 'rgba(252,211,77,0.15)' },
  noticeText: { ...typography.caption, color: '#FCD34D', flex: 1 },

  listContent: { paddingHorizontal: spacing.lg, paddingVertical: spacing.lg, gap: spacing.sm },
  emptyContent: { flex: 1 },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl, gap: spacing.lg },
  emptyIconWrap: { width: 80, height: 80, borderRadius: 22, alignItems: 'center', justifyContent: 'center', gap: 4, ...shadow.navy },
  emptyIconAr: { fontSize: 22, color: colors.gold[300] },
  emptyTitle: { ...typography.heading, color: colors.parchment[900], textAlign: 'center' },
  emptyDesc: { ...typography.bodySmall, color: colors.parchment[500], textAlign: 'center', lineHeight: 22 },
  suggestLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 1.8, color: colors.parchment[400], alignSelf: 'flex-start' },
  suggestionRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, width: '100%', backgroundColor: colors.white, borderRadius: radius.md, paddingHorizontal: spacing.lg, paddingVertical: spacing.md, borderWidth: 1, borderColor: colors.parchment[200], ...shadow.xs },
  suggestIconWrap: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  suggestionText: { ...typography.bodySmall, color: colors.navy[700], flex: 1 },

  typingRow: { flexDirection: 'row', alignItems: 'flex-end', gap: spacing.sm, paddingHorizontal: spacing.lg, paddingBottom: spacing.sm },
  typingAvatar: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  typingAvatarText: { fontSize: 17, color: colors.gold[400] },
  typingBubble: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, backgroundColor: colors.white, borderRadius: radius.md, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, ...shadow.xs },
  typingText: { ...typography.caption, color: colors.parchment[500] },

  inputWrap: { paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: Platform.OS === 'ios' ? spacing.xl : spacing.md, borderTopWidth: 1, borderTopColor: colors.parchment[200], backgroundColor: colors.parchment[50], gap: spacing.xs },
  inputRow: { flexDirection: 'row', alignItems: 'flex-end', gap: spacing.sm, backgroundColor: colors.white, borderRadius: radius.md, borderWidth: 1.5, borderColor: colors.parchment[300], paddingHorizontal: spacing.md, paddingVertical: spacing.sm, ...shadow.xs },
  input: { flex: 1, ...typography.body, color: colors.parchment[950], maxHeight: 100, paddingVertical: Platform.OS === 'ios' ? spacing.sm : 0 },
  sendBtn: { width: 38, height: 38, borderRadius: radius.pill, backgroundColor: colors.navy[800], alignItems: 'center', justifyContent: 'center', ...shadow.sm },
  sendBtnOff: { backgroundColor: colors.parchment[300] },
  inputFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  disclaimer: { fontSize: 10, color: colors.parchment[400], letterSpacing: 0.2, flex: 1 },
  charCount: { fontSize: 10, color: colors.parchment[400], fontWeight: '600' },
});
