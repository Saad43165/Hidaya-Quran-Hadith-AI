import React, { useRef, useState } from 'react';
import {
  ActivityIndicator, FlatList, KeyboardAvoidingView,
  Platform, StyleSheet, Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { ChatBubble } from '../../components/assistant/ChatBubble';
import {
  sendAssistantMessage,
  AssistantNotConfiguredError,
} from '../../services/api/aiAssistantApi';
import { ChatMessage } from '../../types/models';
import { colors, gradients, radius, spacing, typography } from '../../theme';

const SUGGESTIONS = [
  'What is the meaning of Surah Al-Fatiha?',
  'Explain the importance of Salah',
  'What does Sabr (patience) mean in Islam?',
  'How should I perform Wuzu?',
  'What are the pillars of Islam?',
];

export function AssistantScreen() {
  const { t } = useTranslation();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const listRef = useRef<FlatList>(null);

  const handleSend = async (text?: string) => {
    const msg = (text ?? input).trim();
    if (!msg || isSending) return;
    const userMsg: ChatMessage = {
      id: `${Date.now()}-u`, role: 'user', content: msg, createdAt: Date.now(),
    };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsSending(true);
    setNotice(null);
    try {
      const reply = await sendAssistantMessage(messages, msg);
      setMessages(prev => [...prev, reply]);
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
    } catch (e) {
      if (e instanceof AssistantNotConfiguredError) {
        setNotice(e.message);
      } else {
        setNotice(e instanceof Error ? e.message : 'Something went wrong.');
      }
    } finally {
      setIsSending(false);
    }
  };

  return (
    <ScreenContainer noPadding>
      {/* Header */}
      <LinearGradient colors={gradients.heroNavy} style={styles.header}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.headerTitle}>{t('assistant.title')}</Text>
            <Text style={styles.headerSub}>Powered by Groq · Context-aware Islamic AI</Text>
          </View>
          <View style={styles.aiStatus}>
            <View style={styles.aiDot} />
            <Text style={styles.aiStatusText}>Ready</Text>
          </View>
        </View>
      </LinearGradient>

      {/* Notice banner */}
      {notice && (
        <View style={styles.noticeBanner}>
          <Ionicons name="alert-circle-outline" size={14} color={colors.semantic.warning} />
          <Text style={styles.noticeText}>{notice}</Text>
          <TouchableOpacity onPress={() => setNotice(null)}>
            <Ionicons name="close" size={14} color={colors.semantic.warning} />
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
          contentContainerStyle={messages.length === 0 ? styles.emptyContent : styles.listContent}
          onContentSizeChange={() => {
            if (messages.length > 0) listRef.current?.scrollToEnd({ animated: true });
          }}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <View style={styles.emptyIcon}>
                <Ionicons name="sparkles" size={32} color={colors.gold[500]} />
              </View>
              <Text style={styles.emptyTitle}>Ask anything Islamic</Text>
              <Text style={styles.emptyText}>
                I know what you're reading. Open a Surah or Hadith chapter and ask questions in context — I'll answer based on exactly what's on your screen.
              </Text>
              <View style={styles.suggestionList}>
                {SUGGESTIONS.map(s => (
                  <TouchableOpacity
                    key={s}
                    style={styles.suggestionChip}
                    onPress={() => handleSend(s)}
                  >
                    <Text style={styles.suggestionText}>{s}</Text>
                    <Ionicons name="arrow-forward" size={12} color={colors.navy[500]} />
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          }
          renderItem={({ item }) => <ChatBubble message={item} />}
          ListFooterComponent={
            isSending ? (
              <View style={styles.typingRow}>
                <View style={styles.typingAvatar}>
                  <Text style={styles.typingAvatarText}>K</Text>
                </View>
                <View style={styles.typingBubble}>
                  <ActivityIndicator size="small" color={colors.gold[600]} />
                  <Text style={styles.typingText}>{t('assistant.thinking')}</Text>
                </View>
              </View>
            ) : null
          }
        />

        {/* Input */}
        <View style={styles.inputWrap}>
          <View style={styles.inputRow}>
            <TextInput
              value={input}
              onChangeText={setInput}
              placeholder={t('assistant.placeholder')}
              placeholderTextColor={colors.parchment[400]}
              style={styles.input}
              editable={!isSending}
              multiline
              maxLength={500}
              onSubmitEditing={() => handleSend()}
            />
            <TouchableOpacity
              style={[styles.sendBtn, (!input.trim() || isSending) && styles.sendBtnOff]}
              onPress={() => handleSend()}
              disabled={!input.trim() || isSending}
            >
              <Ionicons name="send" size={16} color={colors.white} />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  header: { paddingTop: spacing.lg, paddingBottom: spacing.xl, paddingHorizontal: spacing.lg },
  headerRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  headerTitle: { ...typography.displayMd, color: colors.white },
  headerSub: { ...typography.caption, color: 'rgba(255,255,255,0.4)', marginTop: 4 },
  aiStatus: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: 6 },
  aiDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#2ECC71' },
  aiStatusText: { ...typography.caption, color: 'rgba(255,255,255,0.7)', fontWeight: '600' },
  noticeBanner: {
    flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm,
    backgroundColor: colors.semantic.warningLight,
    paddingHorizontal: spacing.lg, paddingVertical: spacing.sm,
  },
  noticeText: { ...typography.caption, color: colors.semantic.warning, flex: 1 },
  listContent: { paddingHorizontal: spacing.lg, paddingVertical: spacing.lg, gap: spacing.sm },
  emptyContent: { flex: 1 },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl, gap: spacing.lg },
  emptyIcon: {
    width: 72, height: 72, borderRadius: 24,
    backgroundColor: colors.navy[900], alignItems: 'center', justifyContent: 'center',
  },
  emptyTitle: { ...typography.heading, color: colors.parchment[900] },
  emptyText: { ...typography.body, color: colors.parchment[500], textAlign: 'center', lineHeight: 24 },
  suggestionList: { width: '100%', gap: spacing.sm },
  suggestionChip: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: colors.white, borderRadius: radius.md,
    paddingHorizontal: spacing.lg, paddingVertical: spacing.md,
    borderWidth: 1, borderColor: colors.parchment[200],
  },
  suggestionText: { ...typography.bodySmall, color: colors.navy[700], flex: 1 },
  typingRow: { flexDirection: 'row', alignItems: 'flex-end', gap: spacing.sm, paddingHorizontal: spacing.lg, paddingBottom: spacing.sm },
  typingAvatar: { width: 28, height: 28, borderRadius: 14, backgroundColor: colors.navy[800], alignItems: 'center', justifyContent: 'center' },
  typingAvatarText: { fontSize: 11, fontWeight: '700', color: colors.gold[400] },
  typingBubble: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, backgroundColor: colors.white, borderRadius: radius.md, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderWidth: 1, borderColor: colors.parchment[200] },
  typingText: { ...typography.caption, color: colors.parchment[500] },
  inputWrap: { paddingHorizontal: spacing.lg, paddingVertical: spacing.md, borderTopWidth: 1, borderTopColor: colors.parchment[200], backgroundColor: colors.parchment[50] },
  inputRow: { flexDirection: 'row', alignItems: 'flex-end', gap: spacing.sm, backgroundColor: colors.white, borderRadius: radius.md, borderWidth: 1, borderColor: colors.parchment[300], paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  input: { flex: 1, ...typography.body, color: colors.parchment[950], maxHeight: 100, paddingVertical: Platform.OS === 'ios' ? spacing.sm : 0 },
  sendBtn: { width: 38, height: 38, borderRadius: radius.pill, backgroundColor: colors.navy[800], alignItems: 'center', justifyContent: 'center' },
  sendBtnOff: { backgroundColor: colors.parchment[300] },
});
