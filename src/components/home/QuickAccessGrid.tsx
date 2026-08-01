import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, shadow, spacing, typography } from '../../theme';

interface QuickAccessItem {
  key: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
}

interface Props {
  items: QuickAccessItem[];
}

// Strong, saturated, professional color theme per feature
const FEATURE_CONFIG: Record<string, {
  gradientColors: [string, string];
  iconColor: string;
  iconBg: string;
}> = {
  'book-outline': {
    gradientColors: ['#0F1C42', '#1E3A8A'],
    iconColor: '#F59E0B',
    iconBg: 'rgba(245,158,11,0.25)',
  },
  'chatbox-outline': {
    gradientColors: ['#0C2A4A', '#1E4976'],
    iconColor: '#38BDF8',
    iconBg: 'rgba(56,189,248,0.25)',
  },
  'time-outline': {
    gradientColors: ['#052E16', '#166534'],
    iconColor: '#4ADE80',
    iconBg: 'rgba(74,222,128,0.25)',
  },
  'radio-button-on-outline': {
    gradientColors: ['#1E0A3C', '#4C1D95'],
    iconColor: '#C084FC',
    iconBg: 'rgba(192,132,252,0.25)',
  },
  'hand-left-outline': {
    gradientColors: ['#431407', '#7C2D12'],
    iconColor: '#FB923C',
    iconBg: 'rgba(251,146,60,0.25)',
  },
  'star-outline': {
    gradientColors: ['#4A044E', '#86198F'],
    iconColor: '#E879F9',
    iconBg: 'rgba(232,121,249,0.25)',
  },
  'library-outline': {
    gradientColors: ['#0F172A', '#312E81'],
    iconColor: '#818CF8',
    iconBg: 'rgba(129,140,248,0.25)',
  },
  'search-outline': {
    gradientColors: ['#0C1A2E', '#1E3A5F'],
    iconColor: '#60A5FA',
    iconBg: 'rgba(96,165,250,0.25)',
  },
  'chatbubble-ellipses-outline': {
    gradientColors: ['#042F2E', '#134E4A'],
    iconColor: '#2DD4BF',
    iconBg: 'rgba(45,212,191,0.25)',
  },
  'language-outline': {
    gradientColors: ['#1C0633', '#3B0764'],
    iconColor: '#A78BFA',
    iconBg: 'rgba(167,139,250,0.25)',
  },
};

function AnimatedTile({ item, index }: { item: QuickAccessItem; index: number }) {
  const cfg = FEATURE_CONFIG[item.icon] ?? FEATURE_CONFIG['book-outline'];
  const scaleAnim = useRef(new Animated.Value(0.92)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const pressAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 280,
        delay: index * 60,
        useNativeDriver: true,
        easing: Easing.out(Easing.cubic),
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        delay: index * 60,
        tension: 120,
        friction: 10,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const onPressIn = () => {
    Animated.spring(pressAnim, {
      toValue: 0.94,
      tension: 300,
      friction: 10,
      useNativeDriver: true,
    }).start();
  };

  const onPressOut = () => {
    Animated.spring(pressAnim, {
      toValue: 1,
      tension: 300,
      friction: 10,
      useNativeDriver: true,
    }).start();
  };

  return (
    <Animated.View
      style={[
        styles.tileWrap,
        { opacity: opacityAnim, transform: [{ scale: scaleAnim }] },
      ]}
    >
      <TouchableOpacity
        onPress={item.onPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        activeOpacity={1}
        style={{ flex: 1 }}
      >
        <Animated.View style={{ transform: [{ scale: pressAnim }], flex: 1 }}>
          <LinearGradient
            colors={cfg.gradientColors}
            style={styles.tile}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            {/* Top corner accent */}
            <View style={[styles.cornerAccent, { backgroundColor: cfg.iconColor + '20' }]} />

            <View style={[styles.iconWrap, { backgroundColor: cfg.iconBg }]}>
              <Ionicons name={item.icon} size={22} color={cfg.iconColor} />
            </View>
            <Text style={styles.label} numberOfLines={1}>{item.label}</Text>
          </LinearGradient>
        </Animated.View>
      </TouchableOpacity>
    </Animated.View>
  );
}

export function QuickAccessGrid({ items }: Props) {
  const rows: QuickAccessItem[][] = [];
  for (let i = 0; i < items.length; i += 3) rows.push(items.slice(i, i + 3));

  return (
    <View style={styles.container}>
      {rows.map((row, ri) => (
        <View key={ri} style={styles.row}>
          {row.map((item, ci) => (
            <AnimatedTile key={item.key} item={item} index={ri * 3 + ci} />
          ))}
          {row.length < 3 && Array.from({ length: 3 - row.length }).map((_, i) => (
            <View key={`empty-${i}`} style={[styles.tileWrap, { backgroundColor: 'transparent' }]} />
          ))}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.sm },
  row: { flexDirection: 'row', gap: spacing.sm },
  tileWrap: {
    flex: 1,
    borderRadius: radius.md,
    overflow: 'hidden',
    ...shadow.md,
  },
  tile: {
    paddingVertical: spacing.md + 4,
    paddingHorizontal: spacing.sm,
    alignItems: 'center',
    gap: spacing.sm,
    overflow: 'hidden',
  },
  cornerAccent: {
    position: 'absolute',
    top: -20,
    right: -20,
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  iconWrap: {
    width: 46,
    height: 46,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});
