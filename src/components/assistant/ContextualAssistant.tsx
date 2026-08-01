import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator, Animated, FlatList, KeyboardAvoidingView,
  Platform, StyleSheet, Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { sendAssistantMessage, fetchContextPrompt, AssistantNotConfiguredError, ReadingContext } from '../../services/api/aiAssistantApi';
import { ChatMessage } from '../../types/models';
import { colors, radius, shadow, spacing, typography } from '../../theme';

interface Props {
  context: ReadingContext;
  /** Collapsed/expanded toggle from parent */
  isOpen: boolean;
  onToggle: () => void;
}

export function ContextualAssistant({ context, isOpen, onToggle }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [contextPrompt, setContextPrompt] = useState('');
  const [loadingPrompt, setLoadingPrompt] = useState(false);
  const slideAnim = useRef(new Animated.Value(0)).current;
  const listRef = useRef<FlatList>(null);

  // Fetch proactive AI insight when opened for the first time on a new context
  useEffect(() => {
    if (!isOpen || messages.length > 0) return;
    setLoadingPrompt(true);
    fetchContextPrompt(context)
      .then(p => { if (p) setContextPrompt(p); })
      .finally(() => setLoadingPrompt(false));
  }, [isOpen, context.surahNumber, context.chapterName]);

  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: isOpen ? 1 : 0,
      useNativeDriver: false,
      tension: 80,
      friction: 10,
    }).start();
  }, [isOpen, slideAnim]);

  const panelHeight = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [52, 380],
  });

  const handleSend = async (text?: string) => {
    const msg = (text ?? input).trim();
    if (!msg || isSending) return;
    const userMsg: ChatMessage = {
      id: `${Date.now()}-u`, role: 'user', content: msg, createdAt: Date.now(),
    };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsSending(true);
    setContextPrompt('');
    try {
      const reply = await sendAssistantMessage(messages, msg, context);
      setMessages(prev => [...prev, reply]);
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
    } catch (e) {
      const errMsg: ChatMessage = {
        id: `${Date.now()}-err`, role: 'assistant',
        content: e instanceof Error ? e.message : 'Something went wrong.',
        createdAt: Date.now(),
      };
      setMessages(prev => [...prev, errMsg]);
    } finally {
      setIsSending(false);
    }
  };

  const contextLabel = context.type === 'surah'
    ? `${context.surahName ?? 'Surah'} • Ask AI`
    : `${context.chapterName ?? 'Chapter'} • Ask AI`;

  return (
    <Animated.View style={[styles.container, { height: panelHeight }]}>
      {/* Header toggle */}
      <TouchableOpacity style={styles.header} onPress={onToggle} activeOpacity={0.8}>
        <View style={styles.headerLeft}>
          <View style={styles.aiDot} />
          <Text style={styles.headerLabel}>{contextLabel}</Text>
        </View>
        <Ionicons
          name={isOpen ? 'chevron-down' : 'chevron-up'}
          size={16}
          color={colors.gold[400]}
        />
      </TouchableOpacity>

      {/* Body — only rendered when open */}
      {isOpen && (
        <KeyboardAvoidingView
          style={styles.body}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          {/* AI context prompt / conversation */}
          <FlatList
            ref={listRef}
            data={messages}
            keyExtractor={m => m.id}
            contentContainerStyle={styles.chatList}
            showsVerticalScrollIndicator={false}
            ListHeaderComponent={
              loadingPrompt ? (
                <View style={styles.promptLoading}>
                  <ActivityIndicator size="small" color={colors.gold[500]} />
                  <Text style={styles.promptLoadingText}>AI reading your context...</Text>
                </View>
              ) : contextPrompt ? (
                <View style={styles.contextPromptCard}>
                  <View style={styles.aiAvatarSmall}>
                    <Text style={styles.aiAvatarLetter}>K</Text>
                  </View>
                  <View style={styles.contextPromptBubble}>
                    <Text style={styles.contextPromptText}>{contextPrompt}</Text>
                    {/* Quick reply suggestions */}
                    <View style={styles.quickReplies}>
                      {['Tell me more', 'What does this teach us?', 'Historical context'].map(q => (
                        <TouchableOpacity key={q} style={styles.quickChip} onPress={() => handleSend(q)}>
                          <Text style={styles.quickChipText}>{q}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                </View>
              ) : messages.length === 0 ? (
                <Text style={styles.emptyHint}>
                  Ask anything about what you're reading — meaning, context, grammar, lessons.
                </Text>
              ) : null
            }
            renderItem={({ item }) => (
              <View style={[styles.msgRow, item.role === 'user' ? styles.msgUser : styles.msgAssistant]}>
                {item.role === 'assistant' && (
                  <View style={styles.aiAvatarSmall}>
                    <Text style={styles.aiAvatarLetter}>K</Text>
                  </View>
                )}
                <View style={[styles.bubble, item.role === 'user' ? styles.bubbleUser : styles.bubbleAI]}>
                  <Text style={[styles.bubbleText, item.role === 'user' ? styles.bubbleTextUser : styles.bubbleTextAI]}>
                    {item.content}
                  </Text>
                </View>
              </View>
            )}
            ListFooterComponent={
              isSending ? (
                <View style={[styles.msgRow, styles.msgAssistant]}>
                  <View style={styles.aiAvatarSmall}><Text style={styles.aiAvatarLetter}>K</Text></View>
                  <View style={styles.bubbleAI}>
                    <ActivityIndicator size="small" color={colors.gold[500]} />
                  </View>
                </View>
              ) : null
            }
          />

          {/* Input */}
          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              value={input}
              onChangeText={setInput}
              placeholder="Ask about this content..."
              placeholderTextColor={colors.parchment[400]}
              onSubmitEditing={() => handleSend()}
              returnKeyType="send"
              editable={!isSending}
            />
            <TouchableOpacity
              style={[styles.sendBtn, (!input.trim() || isSending) && styles.sendBtnOff]}
              onPress={() => handleSend()}
              disabled={!input.trim() || isSending}
            >
              <Ionicons name="send" size={14} color={colors.white} />
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.navy[900],
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    overflow: 'hidden',
    ...shadow.lg,
  },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.lg, paddingVertical: spacing.md,
    borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  aiDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.gold[500] },
  headerLabel: { ...typography.bodySmall, color: colors.gold[300], fontWeight: '600' },
  body: { flex: 1 },
  chatList: { padding: spacing.md, gap: spacing.sm, flexGrow: 1 },
  promptLoading: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: spacing.sm },
  promptLoadingText: { ...typography.caption, color: 'rgba(255,255,255,0.4)' },
  contextPromptCard: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.sm },
  aiAvatarSmall: {
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: colors.navy[700], alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  aiAvatarLetter: { fontSize: 10, fontWeight: '700', color: colors.gold[400] },
  contextPromptBubble: {
    flex: 1, backgroundColor: 'rgba(255,255,255,0.07)',
    borderRadius: radius.md, padding: spacing.md, gap: spacing.sm,
  },
  contextPromptText: { ...typography.bodySmall, color: 'rgba(255,255,255,0.85)', lineHeight: 20 },
  quickReplies: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  quickChip: {
    backgroundColor: 'rgba(212,169,62,0.18)', borderRadius: radius.pill,
    paddingHorizontal: spacing.sm, paddingVertical: 4,
  },
  quickChipText: { fontSize: 11, color: colors.gold[300], fontWeight: '600' },
  emptyHint: {
    ...typography.caption, color: 'rgba(255,255,255,0.3)',
    textAlign: 'center', paddingVertical: spacing.lg,
  },
  msgRow: { flexDirection: 'row', alignItems: 'flex-end', gap: spacing.sm, marginBottom: spacing.sm },
  msgUser: { justifyContent: 'flex-end' },
  msgAssistant: { justifyContent: 'flex-start' },
  bubble: { maxWidth: '80%', borderRadius: radius.md, padding: spacing.sm },
  bubbleUser: { backgroundColor: colors.gold[700] },
  bubbleAI: { backgroundColor: 'rgba(255,255,255,0.09)', padding: spacing.md },
  bubbleText: { ...typography.bodySmall, lineHeight: 20 },
  bubbleTextUser: { color: colors.white },
  bubbleTextAI: { color: 'rgba(255,255,255,0.85)' },
  inputRow: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.06)',
  },
  input: {
    flex: 1, backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    ...typography.bodySmall, color: colors.white,
  },
  sendBtn: {
    width: 30, height: 30, borderRadius: radius.pill,
    backgroundColor: colors.gold[600], alignItems: 'center', justifyContent: 'center',
  },
  sendBtnOff: { backgroundColor: 'rgba(255,255,255,0.1)' },
});
