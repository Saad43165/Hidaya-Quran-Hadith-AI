import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, shadow, spacing, typography } from '../../theme';

interface Props {
  title: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  progress?: number;
  accentColor?: string;
}

export function ContinueReadingCard({ title, subtitle, icon, onPress, progress, accentColor = '#F59E0B' }: Props) {
  const translateX = useRef(new Animated.Value(-20)).current;
  const opacity    = useRef(new Animated.Value(0)).current;
  const scaleAnim  = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 350, useNativeDriver: true, easing: Easing.out(Easing.cubic) }),
      Animated.timing(translateX, { toValue: 0, duration: 350, useNativeDriver: true, easing: Easing.out(Easing.cubic) }),
    ]).start();
  }, []);

  const onPressIn  = () => Animated.spring(scaleAnim, { toValue: 0.97, useNativeDriver: true, tension: 300, friction: 10 }).start();
  const onPressOut = () => Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, tension: 300, friction: 10 }).start();

  return (
    <Animated.View style={{ opacity, transform: [{ translateX }, { scale: scaleAnim }], borderRadius: radius.md, overflow: 'hidden', ...shadow.lg }}>
      <TouchableOpacity onPress={onPress} onPressIn={onPressIn} onPressOut={onPressOut} activeOpacity={1}>
        <LinearGradient colors={['#0F1C42', '#162354']} style={styles.card}>
          {/* Accent bar */}
          <View style={[styles.accentBar, { backgroundColor: accentColor }]} />
          {/* Glow */}
          <View style={[styles.glow, { backgroundColor: accentColor + '12' }]} />

          <View style={[styles.iconWrap, { backgroundColor: accentColor + '22', borderColor: accentColor + '40' }]}>
            <Ionicons name={icon} size={22} color={accentColor} />
          </View>

          <View style={styles.textBlock}>
            <View style={styles.pillRow}>
              <View style={[styles.pill, { backgroundColor: accentColor + '25', borderColor: accentColor + '45' }]}>
                <View style={[styles.pillDot, { backgroundColor: accentColor }]} />
                <Text style={[styles.pillText, { color: accentColor }]}>CONTINUE</Text>
              </View>
            </View>
            <Text style={styles.title} numberOfLines={1}>{title}</Text>
            <Text style={styles.subtitle} numberOfLines={1}>{subtitle}</Text>
            {typeof progress === 'number' && (
              <View style={styles.progressTrack}>
                <Animated.View style={[styles.progressFill, { width: `${Math.round(progress * 100)}%`, backgroundColor: accentColor }]} />
              </View>
            )}
          </View>

          <View style={styles.chevronWrap}>
            <Ionicons name="chevron-forward" size={16} color={accentColor} />
          </View>
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    gap: spacing.md,
    overflow: 'hidden',
  },
  accentBar: {
    position: 'absolute', left: 0, top: 0, bottom: 0, width: 3,
  },
  glow: {
    position: 'absolute', right: -30, top: -30,
    width: 120, height: 120, borderRadius: 60,
  },
  iconWrap: {
    width: 48, height: 48, borderRadius: radius.sm,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1,
  },
  textBlock: { flex: 1, gap: 3 },
  pillRow: { flexDirection: 'row' },
  pill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    borderRadius: radius.pill, paddingHorizontal: spacing.sm, paddingVertical: 2,
    borderWidth: 1, alignSelf: 'flex-start',
  },
  pillDot: { width: 5, height: 5, borderRadius: 3 },
  pillText: { fontSize: 9, fontWeight: '800', letterSpacing: 1.2 },
  title: { ...typography.subheading, color: colors.white },
  subtitle: { ...typography.caption, color: 'rgba(255,255,255,0.4)' },
  progressTrack: { height: 2, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 1, marginTop: 6 },
  progressFill: { height: 2, borderRadius: 1 },
  chevronWrap: {
    width: 32, height: 32, borderRadius: radius.pill,
    backgroundColor: 'rgba(255,255,255,0.07)',
    alignItems: 'center', justifyContent: 'center',
  },
});
