import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { ChatMessage } from '../../types/models';
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

export function ChatBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === 'user';
  return (
    <View style={[styles.row, isUser ? styles.rowUser : styles.rowAssistant]}>
      {!isUser && (
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>K</Text>
        </View>
      )}
      <View style={[styles.bubble, isUser ? styles.userBubble : styles.assistantBubble]}>
        {renderMarkdownText(message.content, isUser ? styles.userText : styles.assistantText)}
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
});
