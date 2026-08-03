import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ChatMessage } from '../../types/models';
import { useThemeStore } from '../../store/useThemeStore';
import { darkColors } from '../../theme/darkColors';
import { colors, radius, spacing, typography } from '../../theme';

function renderMarkdownText(text: string, baseStyle: any) {
  const parts = text.split(/(\*\*.*?\*\*|\*.*?\*)/g);
  return (
    <Text style={baseStyle}>
      {parts.map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <Text key={i} style={{ fontWeight: 'bold' }}>{part.slice(2, -2)}</Text>;
        }
        if (part.startsWith('*') && part.endsWith('*')) {
          return <Text key={i} style={{ fontStyle: 'italic' }}>{part.slice(1, -1)}</Text>;
        }
        return <Text key={i}>{part}</Text>;
      })}
    </Text>
  );
}

export function ChatBubble({ message, onRetry }: { message: ChatMessage; onRetry?: () => void }) {
  const isDark = useThemeStore(s => s.isDark);
  const isUser = message.role === 'user';
  const assistantBg = isDark ? darkColors.surface : colors.white;
  const assistantBorder = isDark ? darkColors.border : colors.parchment[200];
  const assistantTextColor = isDark ? darkColors.text.primary : colors.parchment[900];

  if (message.isError) {
    return (
      <View style={[styles.row, styles.rowAssistant]}>
        <View style={[styles.avatar, styles.avatarError]}>
          <Ionicons name="alert" size={14} color={colors.white} />
        </View>
        <View style={[styles.bubble, styles.errorBubble]}>
          <Text style={styles.errorText}>{message.content}</Text>
          {onRetry && (
            <TouchableOpacity style={styles.retryBtn} onPress={onRetry} activeOpacity={0.8}>
              <Ionicons name="refresh-outline" size={14} color={colors.semantic.error} />
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.row, isUser ? styles.rowUser : styles.rowAssistant]}>
      {!isUser && (
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>K</Text>
        </View>
      )}
      <View style={[styles.bubble, isUser ? styles.userBubble : { backgroundColor: assistantBg, borderColor: assistantBorder, borderWidth: 1, borderBottomLeftRadius: radius.xs }]}>
        {renderMarkdownText(message.content, isUser ? styles.userText : [styles.assistantText, { color: assistantTextColor }])}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-end', gap: spacing.sm, marginBottom: spacing.sm },
  rowUser: { justifyContent: 'flex-end' },
  rowAssistant: { justifyContent: 'flex-start' },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: radius.pill,
    backgroundColor: colors.navy[800],
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  avatarText: { ...typography.caption, color: colors.gold[400], fontWeight: '700' },
  avatarError: { backgroundColor: colors.semantic.error },
  bubble: {
    maxWidth: '78%',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
  },
  userBubble: {
    backgroundColor: colors.navy[800],
    borderBottomRightRadius: radius.xs,
  },
  assistantBubble: {
    backgroundColor: colors.white,
    borderBottomLeftRadius: radius.xs,
    borderWidth: 1,
    borderColor: colors.parchment[200],
  },
  userText: { ...typography.body, color: colors.white, lineHeight: 22 },
  assistantText: { ...typography.body, color: colors.parchment[900], lineHeight: 22 },

  errorBubble: {
    backgroundColor: colors.semantic.errorLight,
    borderBottomLeftRadius: radius.xs,
    borderWidth: 1,
    borderColor: 'rgba(220,38,38,0.25)',
    gap: spacing.sm,
  },
  errorText: { ...typography.bodySmall, color: colors.semantic.error, lineHeight: 20 },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: 'rgba(220,38,38,0.3)',
  },
  retryText: { ...typography.caption, color: colors.semantic.error, fontWeight: '700' },
});
