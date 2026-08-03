import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator, Alert, Animated, FlatList, KeyboardAvoidingView,
  Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ChatMessage } from '../../types/models';
import {
  sendAssistantMessageStreaming,
  AssistantNotConfiguredError,
} from '../../services/api/aiAssistantApi';
import {
  useAIStore,
  CONVERSATION_MODES,
  Madhab,
  KnowledgeLevel,
  ConversationMode,
  AILanguage,
} from '../../store/useAIStore';
import { RichMessage } from '../../components/assistant/RichMessage';
import { useSmartSuggestions } from '../../hooks/useSmartSuggestions';
import { useThemeColors } from '../../hooks/useThemeColors';
import { colors, radius, spacing, typography } from '../../theme';

const MESSAGES_KEY = 'kitaabai.assistant.messages';
const MAX_STORED   = 60;

// ── Onboarding card ────────────────────────────────────────────────────────────

interface OnboardingCardProps {
  onDone: (madhab: Madhab, level: KnowledgeLevel) => void;
  isDark: boolean;
  surface: string;
  border: string;
  textPrimary: string;
  textSecondary: string;
}

const MADHABS: { key: Madhab; label: string }[] = [
  { key: 'hanafi',  label: 'Hanafi'   },
  { key: 'shafii',  label: "Shafi'i"  },
  { key: 'maliki',  label: 'Maliki'   },
  { key: 'hanbali', label: 'Hanbali'  },
  { key: 'none',    label: 'No preference' },
];

const LEVELS: { key: KnowledgeLevel; label: string; desc: string }[] = [
  { key: 'beginner',     label: 'Beginner',     desc: 'New to Islam / learning basics' },
  { key: 'intermediate', label: 'Intermediate', desc: 'Know the pillars, studying more' },
  { key: 'advanced',     label: 'Advanced',     desc: 'Scholarly reading, Arabic knowledge' },
];

function OnboardingCard({ onDone, isDark, surface, border, textPrimary, textSecondary }: OnboardingCardProps) {
  const [madhab, setMadhab] = useState<Madhab>('none');
  const [level,  setLevel]  = useState<KnowledgeLevel>('intermediate');

  return (
    <View style={[styles.onboardCard, { backgroundColor: surface, borderColor: border }]}>
      <LinearGradient colors={['#1A2E7A', '#060C1F']} style={styles.onboardGrad}>
        <Text style={[styles.onboardIcon]}>🧠</Text>
        <Text style={styles.onboardTitle}>Personalise IlmAI</Text>
        <Text style={styles.onboardSub}>Help the AI give you better answers</Text>
      </LinearGradient>

      <View style={styles.onboardBody}>
        {/* Madhab */}
        <Text style={[styles.onboardLabel, { color: textSecondary }]}>Your Madhab (school of jurisprudence)</Text>
        <View style={styles.onboardChips}>
          {MADHABS.map(m => (
            <TouchableOpacity
              key={m.key}
              style={[styles.onboardChip, { borderColor: border },
                madhab === m.key && styles.onboardChipActive]}
              onPress={() => setMadhab(m.key)}
              activeOpacity={0.75}
            >
              <Text style={[styles.onboardChipText, { color: textPrimary },
                madhab === m.key && styles.onboardChipTextActive]}>
                {m.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Knowledge level */}
        <Text style={[styles.onboardLabel, { color: textSecondary, marginTop: spacing.sm }]}>Your Knowledge Level</Text>
        <View style={styles.onboardLevels}>
          {LEVELS.map(l => (
            <TouchableOpacity
              key={l.key}
              style={[styles.onboardLevel, { borderColor: border },
                level === l.key && styles.onboardLevelActive]}
              onPress={() => setLevel(l.key)}
              activeOpacity={0.75}
            >
              <Text style={[styles.onboardLevelTitle, { color: textPrimary },
                level === l.key && styles.onboardChipTextActive]}>
                {l.label}
              </Text>
              <Text style={[styles.onboardLevelDesc, { color: textSecondary }]}>{l.desc}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          style={styles.onboardBtn}
          onPress={() => onDone(madhab, level)}
          activeOpacity={0.85}
        >
          <Text style={styles.onboardBtnText}>Start Chatting →</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ── Bubble ─────────────────────────────────────────────────────────────────────

interface BubbleProps {
  msg: ChatMessage;
  isStreaming: boolean;
  isDark: boolean;
  surface: string;
  border: string;
  textPrimary: string;
  textSecondary: string;
  onLongPress: () => void;
}

function Bubble({ msg, isStreaming, isDark, surface, border, textPrimary, textSecondary, onLongPress }: BubbleProps) {
  const isUser = msg.role === 'user';

  return (
    <TouchableOpacity
      activeOpacity={0.88}
      onLongPress={onLongPress}
      delayLongPress={500}
      disabled={isUser || msg.isError}
    >
      <View style={[
        styles.bubbleRow,
        isUser ? styles.bubbleRowUser : styles.bubbleRowAi,
      ]}>
        {!isUser && (
          <LinearGradient colors={['#1A2E7A', '#0D1A45']} style={styles.aiAvatar}>
            <Text style={{ fontSize: 14 }}>🕌</Text>
          </LinearGradient>
        )}

        <View style={[
          styles.bubble,
          isUser
            ? styles.bubbleUser
            : [styles.bubbleAi, { backgroundColor: surface, borderColor: border }],
          msg.isError && styles.bubbleError,
        ]}>
          {isUser ? (
            <Text style={styles.bubbleUserText}>{msg.content}</Text>
          ) : msg.isError ? (
            <Text style={[styles.bubbleErrorText, { color: textSecondary }]}>{msg.content}</Text>
          ) : (
            <RichMessage
              content={msg.content}
              isStreaming={isStreaming}
              isDark={isDark}
              textColor={textPrimary}
              mutedColor={textSecondary}
            />
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

// ── Main Screen ────────────────────────────────────────────────────────────────

const LANG_LABELS: Record<AILanguage, string> = { en: 'EN', ur: 'اُردو', ar: 'عربی' };
const AI_LANGS: AILanguage[] = ['en', 'ur', 'ar'];

export function AssistantScreen() {
  const { isDark, bg, surface, border, textPrimary, textSecondary, textMuted } = useThemeColors();

  // Store
  const {
    madhab, level, language, mode, savedAnswers, onboarded,
    setLanguage, setMode, saveAnswer, completeOnboarding, hydrate,
  } = useAIStore();

  // Local UI state
  const [messages, setMessages]         = useState<ChatMessage[]>([]);
  const [input, setInput]               = useState('');
  const [isSending, setIsSending]       = useState(false);
  const [streamingId, setStreamingId]   = useState<string | null>(null);
  const [streamBuffer, setStreamBuffer] = useState('');
  const [langOpen, setLangOpen]         = useState(false);
  const listRef = useRef<FlatList>(null);

  // Smart suggestions for empty state
  const suggestions = useSmartSuggestions(mode);

  // Hydrate store once
  useEffect(() => {
    hydrate();
  }, [hydrate]);

  // Load persisted messages
  useEffect(() => {
    AsyncStorage.getItem(MESSAGES_KEY).then(raw => {
      if (raw) try { setMessages(JSON.parse(raw)); } catch {}
    }).catch(() => {});
  }, []);

  function persist(msgs: ChatMessage[]) {
    AsyncStorage.setItem(MESSAGES_KEY, JSON.stringify(msgs.slice(-MAX_STORED))).catch(() => {});
  }

  const scrollToBottom = useCallback(() => {
    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 80);
  }, []);

  const handleSend = useCallback(async (text?: string) => {
    const msg = (text ?? input).trim();
    if (!msg || isSending) return;

    const userMsg: ChatMessage = {
      id: `${Date.now()}-u`, role: 'user', content: msg, createdAt: Date.now(),
    };
    const withUser = [...messages, userMsg];
    setMessages(withUser);
    persist(withUser);
    setInput('');
    setIsSending(true);
    setStreamBuffer('');

    const streamId = `${Date.now()}-ai`;
    setStreamingId(streamId);

    // Insert placeholder so user can see it typing
    const placeholder: ChatMessage = {
      id: streamId, role: 'assistant', content: '', createdAt: Date.now(),
    };
    const withPlaceholder = [...withUser, placeholder];
    setMessages(withPlaceholder);
    scrollToBottom();

    let accumulated = '';

    try {
      const reply = await sendAssistantMessageStreaming(
        messages.filter(m => !m.isError),
        msg,
        {
          prefs: { madhab, level, language, mode },
          onToken: (token) => {
            accumulated += token;
            setStreamBuffer(prev => prev + token);
            setMessages(prev => prev.map(m =>
              m.id === streamId ? { ...m, content: accumulated } : m
            ));
          },
        }
      );

      const final = { ...reply, id: streamId };
      setMessages(prev => {
        const updated = prev.map(m => m.id === streamId ? final : m);
        persist(updated);
        return updated;
      });
      scrollToBottom();
    } catch (e) {
      const errText = e instanceof AssistantNotConfiguredError
        ? e.message
        : e instanceof Error
          ? e.message
          : 'Something went wrong.';
      const errMsg: ChatMessage = {
        id: streamId, role: 'assistant', content: errText, createdAt: Date.now(), isError: true,
      };
      setMessages(prev => {
        const updated = prev.map(m => m.id === streamId ? errMsg : m);
        persist(updated);
        return updated;
      });
    } finally {
      setIsSending(false);
      setStreamingId(null);
      setStreamBuffer('');
    }
  }, [input, isSending, messages, madhab, level, language, mode, scrollToBottom]);

  const handleClear = () => {
    Alert.alert('Clear conversation?', 'This will erase all messages.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear', style: 'destructive', onPress: () => {
          setMessages([]);
          AsyncStorage.removeItem(MESSAGES_KEY).catch(() => {});
        }
      },
    ]);
  };

  const handleSave = useCallback((msg: ChatMessage) => {
    const userQ = [...messages].reverse().find(m => m.role === 'user' && m.createdAt < msg.createdAt);
    saveAnswer(userQ?.content ?? 'Question', msg.content, mode);
    Alert.alert('Saved!', 'Answer saved to your library.');
  }, [messages, mode, saveAnswer]);

  const currentMode = CONVERSATION_MODES.find(m => m.key === mode)!;
  const placeholder = language === 'ur'
    ? currentMode.placeholderUr
    : currentMode.placeholder;

  const isEmpty = messages.length === 0;

  return (
    <KeyboardAvoidingView
      style={[styles.root, { backgroundColor: bg }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={0}
    >
      {/* ── Header ── */}
      <LinearGradient colors={['#060C1F', '#0D1A45']} style={styles.header}>
        {/* Row 1: avatar + title + lang toggle + clear */}
        <View style={styles.headerRow}>
          <LinearGradient colors={['#1A2E7A', '#0A1245']} style={styles.headerAvatar}>
            <Text style={{ fontSize: 20 }}>🕌</Text>
          </LinearGradient>
          <View style={styles.headerTitles}>
            <Text style={styles.headerTitle}>IlmAI</Text>
            <Text style={styles.headerSub}>Islamic Knowledge Assistant</Text>
          </View>

          {/* Language toggle button */}
          <View style={{ position: 'relative' }}>
            <TouchableOpacity
              style={styles.langPill}
              onPress={() => setLangOpen(v => !v)}
              activeOpacity={0.75}
            >
              <Ionicons name="globe-outline" size={13} color={colors.gold[300]} />
              <Text style={styles.langPillText}>{LANG_LABELS[language]}</Text>
              <Ionicons name={langOpen ? 'chevron-up' : 'chevron-down'} size={11} color="rgba(255,255,255,0.4)" />
            </TouchableOpacity>
            {langOpen && (
              <View style={[styles.langDropdown, { backgroundColor: isDark ? '#1A2E7A' : '#0D1A45' }]}>
                {AI_LANGS.map(l => (
                  <TouchableOpacity
                    key={l}
                    style={[styles.langOption, language === l && styles.langOptionActive]}
                    onPress={() => { setLanguage(l); setLangOpen(false); }}
                    activeOpacity={0.75}
                  >
                    <Text style={[styles.langOptionText, language === l && { color: colors.gold[300] }]}>
                      {LANG_LABELS[l]}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {messages.length > 0 && (
            <TouchableOpacity onPress={handleClear} style={styles.clearBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="trash-outline" size={18} color="rgba(255,255,255,0.35)" />
            </TouchableOpacity>
          )}
        </View>

        {/* Row 2: Mode chips */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.modesRow}>
          {CONVERSATION_MODES.map(m => {
            const active = mode === m.key;
            return (
              <TouchableOpacity
                key={m.key}
                style={[
                  styles.modeChip,
                  active
                    ? { backgroundColor: m.color + '28', borderColor: m.color }
                    : { backgroundColor: 'rgba(255,255,255,0.06)', borderColor: 'rgba(255,255,255,0.12)' },
                ]}
                onPress={() => setMode(m.key)}
                activeOpacity={0.75}
              >
                <Text style={styles.modeIcon}>{m.icon}</Text>
                <Text style={[styles.modeLabel, active && { color: m.color }]}>
                  {language === 'ur' ? m.labelUr : m.labelEn}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </LinearGradient>

      {/* ── Content ── */}
      {isEmpty ? (
        <ScrollView
          style={styles.emptyScroll}
          contentContainerStyle={styles.emptyContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Onboarding card — shown only first time */}
          {!onboarded && (
            <OnboardingCard
              onDone={(m, l) => completeOnboarding(m, l)}
              isDark={isDark}
              surface={surface}
              border={border}
              textPrimary={textPrimary}
              textSecondary={textSecondary}
            />
          )}

          {/* Smart suggestions */}
          <View style={styles.suggestionsSection}>
            <Text style={[styles.suggestionsLabel, { color: textMuted }]}>
              {language === 'ur' ? '💡 آج کیا پوچھنا چاہتے ہیں؟' : '💡 Try asking…'}
            </Text>
            {suggestions.map((s, i) => {
              const modeInfo = CONVERSATION_MODES.find(m => m.key === s.mode)!;
              return (
                <TouchableOpacity
                  key={i}
                  style={[styles.suggestionCard, { backgroundColor: surface, borderColor: border }]}
                  onPress={() => handleSend(language === 'ur' ? s.textUr : s.text)}
                  activeOpacity={0.8}
                >
                  <View style={[styles.suggestionMode, { backgroundColor: modeInfo.color + '18' }]}>
                    <Text style={{ fontSize: 12 }}>{modeInfo.icon}</Text>
                  </View>
                  <Text style={[styles.suggestionText, { color: textPrimary }]} numberOfLines={2}>
                    {language === 'ur' ? s.textUr : s.text}
                  </Text>
                  <Ionicons name="arrow-forward" size={14} color={isDark ? 'rgba(255,255,255,0.2)' : colors.parchment[300]} />
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>
      ) : (
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={item => item.id}
          style={{ flex: 1, backgroundColor: bg }}
          contentContainerStyle={styles.messageList}
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
          renderItem={({ item }) => (
            <Bubble
              msg={item}
              isStreaming={item.id === streamingId}
              isDark={isDark}
              surface={surface}
              border={border}
              textPrimary={textPrimary}
              textSecondary={textSecondary}
              onLongPress={() => item.role === 'assistant' && !item.isError && handleSave(item)}
            />
          )}
          ListFooterComponent={isSending && !streamingId ? (
            <View style={styles.typingRow}>
              <ActivityIndicator size="small" color={colors.gold[400]} />
              <Text style={[styles.typingText, { color: textMuted }]}>
                {language === 'ur' ? 'جواب تیار ہو رہا ہے…' : 'Thinking…'}
              </Text>
            </View>
          ) : null}
        />
      )}

      {/* Save hint */}
      {!isEmpty && (
        <Text style={[styles.saveHint, { color: textMuted }]}>
          {language === 'ur' ? 'جواب محفوظ کرنے کے لیے دبا کر رکھیں' : 'Long-press any answer to save it'}
        </Text>
      )}

      {/* ── Input ── */}
      <View style={[styles.inputBar, { backgroundColor: surface, borderTopColor: border }]}>
        <TextInput
          style={[styles.input, { color: textPrimary, backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : colors.parchment[50] }]}
          value={input}
          onChangeText={setInput}
          placeholder={placeholder}
          placeholderTextColor={textMuted}
          multiline
          maxLength={1200}
          returnKeyType="default"
          textAlign={language === 'ar' || language === 'ur' ? 'right' : 'left'}
        />
        <TouchableOpacity
          style={[styles.sendBtn, (!input.trim() || isSending) && styles.sendBtnDisabled]}
          onPress={() => handleSend()}
          disabled={!input.trim() || isSending}
          activeOpacity={0.8}
        >
          {isSending
            ? <ActivityIndicator size="small" color={colors.white} />
            : <Ionicons name="send" size={18} color={colors.white} />}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },

  // ── Header ──
  header: {
    paddingTop: 50,
    paddingBottom: spacing.sm,
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  headerAvatar: {
    width: 40, height: 40, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitles: { flex: 1 },
  headerTitle:  { fontSize: 17, fontWeight: '800', color: colors.white, letterSpacing: 0.2 },
  headerSub:    { fontSize: 11, color: 'rgba(255,255,255,0.4)', fontWeight: '500' },

  // Lang toggle
  langPill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: radius.pill,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)',
    paddingHorizontal: 10, paddingVertical: 6,
  },
  langPillText: { fontSize: 12, fontWeight: '700', color: colors.white },
  langDropdown: {
    position: 'absolute', top: 36, right: 0,
    borderRadius: radius.md, overflow: 'hidden',
    zIndex: 99, minWidth: 100,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)',
  },
  langOption: { paddingHorizontal: spacing.md, paddingVertical: 10 },
  langOptionActive: { backgroundColor: 'rgba(212,169,62,0.15)' },
  langOptionText: { fontSize: 13, fontWeight: '600', color: 'rgba(255,255,255,0.7)' },

  clearBtn: { padding: 4 },

  // Mode chips
  modesRow: { paddingBottom: spacing.xs, paddingHorizontal: 2, gap: spacing.sm },
  modeChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: spacing.md, paddingVertical: 6,
    borderRadius: radius.pill, borderWidth: 1,
  },
  modeIcon:  { fontSize: 13 },
  modeLabel: { fontSize: 12, fontWeight: '600', color: 'rgba(255,255,255,0.5)' },

  // ── Empty state ──
  emptyScroll: { flex: 1 },
  emptyContent: { padding: spacing.lg, paddingBottom: 120, gap: spacing.lg },

  suggestionsSection: { gap: spacing.sm },
  suggestionsLabel:   { ...typography.caption, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8 },
  suggestionCard: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    borderRadius: radius.md, padding: spacing.md,
    borderWidth: 1,
  },
  suggestionMode: { width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  suggestionText: { flex: 1, ...typography.bodySmall, lineHeight: 20 },

  // ── Onboarding ──
  onboardCard: { borderRadius: radius.lg, overflow: 'hidden', borderWidth: 1 },
  onboardGrad: {
    padding: spacing.xl,
    alignItems: 'center',
    gap: spacing.xs,
  },
  onboardIcon: { fontSize: 36 },
  onboardTitle: { fontSize: 18, fontWeight: '800', color: colors.white },
  onboardSub:   { fontSize: 13, color: 'rgba(255,255,255,0.5)' },
  onboardBody:  { padding: spacing.lg, gap: spacing.sm },
  onboardLabel: { ...typography.caption, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8 },
  onboardChips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  onboardChip: {
    paddingHorizontal: spacing.md, paddingVertical: 7,
    borderRadius: radius.pill, borderWidth: 1,
    backgroundColor: 'transparent',
  },
  onboardChipActive: { backgroundColor: colors.gold[400], borderColor: colors.gold[400] },
  onboardChipText:   { fontSize: 13, fontWeight: '600' },
  onboardChipTextActive: { color: colors.navy[900] },
  onboardLevels: { gap: spacing.sm },
  onboardLevel: {
    padding: spacing.md, borderRadius: radius.md, borderWidth: 1,
  },
  onboardLevelActive: { borderColor: colors.gold[400], backgroundColor: 'rgba(212,169,62,0.07)' },
  onboardLevelTitle:  { fontSize: 14, fontWeight: '700' },
  onboardLevelDesc:   { fontSize: 12, marginTop: 2 },
  onboardBtn: {
    marginTop: spacing.sm,
    backgroundColor: colors.gold[400],
    borderRadius: radius.pill,
    paddingVertical: 14,
    alignItems: 'center',
  },
  onboardBtnText: { fontSize: 15, fontWeight: '800', color: colors.navy[900] },

  // ── Messages ──
  messageList: { padding: spacing.lg, paddingBottom: 140, gap: spacing.md },

  bubbleRow:     { flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-end' },
  bubbleRowUser: { justifyContent: 'flex-end' },
  bubbleRowAi:   { justifyContent: 'flex-start' },

  aiAvatar: {
    width: 34, height: 34, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
    flexShrink: 0, marginBottom: 2,
  },

  bubble: { maxWidth: '82%', borderRadius: radius.md, padding: spacing.md, borderWidth: 1 },
  bubbleUser: {
    backgroundColor: colors.navy[700],
    borderColor: colors.navy[600],
  },
  bubbleAi: { /* uses surface/border from props */ },
  bubbleError: { borderColor: '#EF4444', backgroundColor: 'rgba(239,68,68,0.06)' },

  bubbleUserText:  { ...typography.body, color: colors.white, lineHeight: 22 },
  bubbleErrorText: { ...typography.body, fontStyle: 'italic', lineHeight: 22 },

  typingRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.sm },
  typingText: { ...typography.bodySmall, fontStyle: 'italic' },

  saveHint: { textAlign: 'center', ...typography.caption, paddingBottom: 4, paddingTop: 2 },

  // ── Input bar ──
  inputBar: {
    flexDirection: 'row', alignItems: 'flex-end', gap: spacing.sm,
    paddingHorizontal: spacing.lg, paddingVertical: spacing.md,
    paddingBottom: Platform.OS === 'ios' ? 28 : spacing.md,
    borderTopWidth: 1,
  },
  input: {
    flex: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: Platform.OS === 'ios' ? 10 : 8,
    fontSize: 15,
    maxHeight: 120,
    lineHeight: 22,
  },
  sendBtn: {
    width: 44, height: 44, borderRadius: 12,
    backgroundColor: colors.gold[500],
    alignItems: 'center', justifyContent: 'center',
  },
  sendBtnDisabled: { backgroundColor: 'rgba(150,150,150,0.3)' },
});
