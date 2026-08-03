import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { colors, radius, spacing, typography } from '../../theme';
import type { TabAndStackNavigation } from '../../navigation/types';

// ── Arabic detection ───────────────────────────────────────────────────────────

function isArabicHeavy(text: string): boolean {
  const clean = text.trim();
  if (!clean || clean.length < 3) return false;
  const arabicChars = (clean.match(/[؀-ۿݐ-ݿ]/g) ?? []).length;
  return arabicChars / clean.replace(/\s/g, '').length > 0.45;
}

// ── Inline text parser (bold, italic, inline citations) ───────────────────────

type InlinePart =
  | { type: 'text';     text: string }
  | { type: 'bold';     text: string }
  | { type: 'italic';   text: string }
  | { type: 'citation'; label: string; surah?: number; ayah?: number };

function parseInline(text: string): InlinePart[] {
  const parts: InlinePart[] = [];
  // Tokenize with combined regex
  const regex = /(\*\*[^*]+\*\*|\*[^*]+\*|\[Quran\s+\d+:\d+\]|\[(Bukhari|Muslim|Tirmidhi|Abu Dawud|Nasai|Ibn Majah|Ahmad)[^\]]+\])/gi;
  let last = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > last) {
      parts.push({ type: 'text', text: text.slice(last, match.index) });
    }
    const token = match[0];
    if (token.startsWith('**')) {
      parts.push({ type: 'bold', text: token.slice(2, -2) });
    } else if (token.startsWith('*')) {
      parts.push({ type: 'italic', text: token.slice(1, -1) });
    } else {
      // Citation
      const quranMatch = token.match(/\[Quran\s+(\d+):(\d+)\]/i);
      if (quranMatch) {
        parts.push({ type: 'citation', label: token.slice(1, -1), surah: parseInt(quranMatch[1]), ayah: parseInt(quranMatch[2]) });
      } else {
        parts.push({ type: 'citation', label: token.slice(1, -1) });
      }
    }
    last = match.index + token.length;
  }
  if (last < text.length) parts.push({ type: 'text', text: text.slice(last) });
  return parts;
}

// ── Segment types ──────────────────────────────────────────────────────────────

type Segment =
  | { type: 'paragraph'; parts: InlinePart[] }
  | { type: 'arabic';    text: string }
  | { type: 'bullet';    parts: InlinePart[] }
  | { type: 'divider' };

function parseContent(raw: string): Segment[] {
  const segments: Segment[] = [];
  // Split into paragraphs by blank lines, then process each line
  const paragraphs = raw.split(/\n\n+/);

  for (const para of paragraphs) {
    const lines = para.split('\n').filter(l => l.trim());
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      // Separator lines
      if (/^[-─═*]{3,}$/.test(trimmed)) {
        segments.push({ type: 'divider' });
        continue;
      }

      // Bullet point
      if (/^[•\-\*]\s+/.test(trimmed) || /^\d+\.\s+/.test(trimmed)) {
        const text = trimmed.replace(/^[•\-\*]\s+/, '').replace(/^\d+\.\s+/, '');
        segments.push({ type: 'bullet', parts: parseInline(text) });
        continue;
      }

      // Arabic-heavy line → Arabic block
      if (isArabicHeavy(trimmed)) {
        segments.push({ type: 'arabic', text: trimmed });
        continue;
      }

      // Regular paragraph
      const prev = segments[segments.length - 1];
      if (prev?.type === 'paragraph') {
        // Merge consecutive non-bullet lines into one paragraph
        prev.parts.push({ type: 'text', text: ' ' }, ...parseInline(trimmed));
      } else {
        segments.push({ type: 'paragraph', parts: parseInline(trimmed) });
      }
    }
  }

  return segments;
}

// ── Streaming cursor ───────────────────────────────────────────────────────────

function StreamingCursor() {
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0, duration: 500, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 1, duration: 500, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);

  return <Animated.Text style={[styles.cursor, { opacity }]}>▊</Animated.Text>;
}

// ── RichMessage ────────────────────────────────────────────────────────────────

interface Props {
  content: string;
  isStreaming?: boolean;
  isDark: boolean;
  textColor: string;
  mutedColor: string;
}

export function RichMessage({ content, isStreaming, isDark, textColor, mutedColor }: Props) {
  const navigation = useNavigation<TabAndStackNavigation>();
  const segments = parseContent(content);

  function renderInline(parts: InlinePart[], key: string) {
    return (
      <Text key={key} style={[styles.bodyText, { color: textColor }]}>
        {parts.map((part, i) => {
          if (part.type === 'bold')   return <Text key={i} style={styles.bold}>{part.text}</Text>;
          if (part.type === 'italic') return <Text key={i} style={styles.italic}>{part.text}</Text>;
          if (part.type === 'citation') {
            const onPress = part.surah != null
              ? () => navigation.navigate('SurahDetail', { surahNumber: part.surah!, englishName: '' })
              : undefined;
            return (
              <Text key={i} onPress={onPress} style={[styles.inlineCitation, onPress && styles.inlineCitationTap]}>
                {' '}{part.label}{' '}
              </Text>
            );
          }
          return <Text key={i}>{part.text}</Text>;
        })}
        {isStreaming && segments[segments.length - 1].type === 'paragraph' && <StreamingCursor />}
      </Text>
    );
  }

  return (
    <View style={styles.root}>
      {segments.map((seg, i) => {
        if (seg.type === 'arabic') {
          return (
            <View key={i} style={[styles.arabicBlock, isDark ? styles.arabicBlockDark : styles.arabicBlockLight]}>
              <Text style={[styles.arabicText, { fontFamily: 'Amiri_400Regular', color: textColor }]}>
                {seg.text}
              </Text>
            </View>
          );
        }

        if (seg.type === 'bullet') {
          return (
            <View key={i} style={styles.bulletRow}>
              <View style={[styles.bulletDot, { backgroundColor: colors.gold[isDark ? 400 : 600] }]} />
              {renderInline(seg.parts, `b${i}`)}
            </View>
          );
        }

        if (seg.type === 'divider') {
          return <View key={i} style={[styles.divider, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : colors.parchment[200] }]} />;
        }

        // Paragraph
        return (
          <Text key={i} style={[styles.bodyText, { color: textColor }]}>
            {seg.parts.map((part, pi) => {
              if (part.type === 'bold')   return <Text key={pi} style={styles.bold}>{part.text}</Text>;
              if (part.type === 'italic') return <Text key={pi} style={styles.italic}>{part.text}</Text>;
              if (part.type === 'citation') {
                const onPress = part.surah != null
                  ? () => navigation.navigate('SurahDetail', { surahNumber: part.surah!, englishName: '' })
                  : undefined;
                return (
                  <Text key={pi} onPress={onPress} style={[styles.inlineCitation, onPress && styles.inlineCitationTap]}>
                    {' '}{part.label}{' '}
                  </Text>
                );
              }
              return <Text key={pi}>{part.text}</Text>;
            })}
            {isStreaming && i === segments.length - 1 && <StreamingCursor />}
          </Text>
        );
      })}
      {isStreaming && segments.length === 0 && <StreamingCursor />}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: 8 },
  bodyText: { ...typography.body, lineHeight: 24 },
  bold:   { fontWeight: '700' },
  italic: { fontStyle: 'italic' },

  arabicBlock: {
    borderRadius: radius.sm,
    padding: spacing.md,
    marginVertical: spacing.xs,
    borderLeftWidth: 3,
    borderLeftColor: colors.gold[400],
  },
  arabicBlockLight: { backgroundColor: colors.gold[50] },
  arabicBlockDark:  { backgroundColor: 'rgba(212,169,62,0.08)' },
  arabicText: {
    fontSize: 22,
    lineHeight: 44,
    textAlign: 'right',
    writingDirection: 'rtl',
  },

  bulletRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  bulletDot: { width: 6, height: 6, borderRadius: 3, marginTop: 9, flexShrink: 0 },

  divider: { height: 1, marginVertical: spacing.xs },

  inlineCitation: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.gold[600],
    backgroundColor: colors.gold[50],
    borderRadius: 4,
    paddingHorizontal: 3,
  },
  inlineCitationTap: {
    color: colors.navy[700],
    backgroundColor: 'rgba(30,41,139,0.08)',
    textDecorationLine: 'underline',
  },

  cursor: { color: colors.gold[500], fontWeight: '700' },
});
