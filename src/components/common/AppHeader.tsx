import React from 'react';
import { Image, ImageSourcePropType, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, gradients, spacing, typography } from '../../theme';
import { IslamicPattern } from './IslamicPattern';
import { BackButton } from './BackButton';

interface Props {
  title: string;
  subtitle?: string;
  arabicTitle?: string;
  gradientColors?: readonly [string, string, ...string[]];
  onBack?: () => void;
  rightSlot?: React.ReactNode;
  accentColor?: string;
  patternColor?: string;
  imageSource?: ImageSourcePropType;
}

export function AppHeader({
  title,
  subtitle,
  arabicTitle,
  gradientColors = gradients.heroNavy,
  onBack,
  rightSlot,
  accentColor = colors.gold[400],
  patternColor,
  imageSource,
}: Props) {
  return (
    <LinearGradient colors={gradientColors} style={styles.container}>
      {imageSource && (
        <Image source={imageSource} style={styles.bgImage} resizeMode="cover" />
      )}
      <View style={styles.bgScrim} />

      {patternColor !== undefined && (
        <IslamicPattern accentColor={patternColor} size={240} style={styles.pattern} />
      )}

      <View style={[styles.decor, { borderColor: accentColor + '15' }]} />

      {/* Top row: back + right slot */}
      <View style={styles.topRow}>
        {onBack !== undefined ? (
          <BackButton onPress={onBack} />
        ) : (
          <View style={{ width: 40 }} />
        )}
        <View style={{ flex: 1 }} />
        {rightSlot !== undefined ? rightSlot : null}
      </View>

      {arabicTitle !== undefined && (
        <Text style={[styles.arabicTitle, { color: accentColor }]}>{arabicTitle}</Text>
      )}
      <Text style={styles.title}>{title}</Text>
      {subtitle !== undefined && (
        <Text style={styles.subtitle}>{subtitle}</Text>
      )}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 44,
    paddingBottom: spacing.lg,
    paddingHorizontal: spacing.lg,
    overflow: 'hidden',
    gap: spacing.xs,
  },
  bgImage: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    width: '100%', height: '100%', opacity: 0.28,
  },
  bgScrim: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(6,12,31,0.35)',
  },
  decor: {
    position: 'absolute', right: -50, top: -50,
    width: 180, height: 180, borderRadius: 90, borderWidth: 1,
  },
  pattern: { right: -60, bottom: -60 },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  arabicTitle: {
    fontFamily: 'Amiri_400Regular',
    fontSize: 24,
    textAlign: 'center',
  },
  title: {
    ...typography.heading,
    color: colors.white,
    textAlign: 'center',
  },
  subtitle: {
    ...typography.caption,
    color: 'rgba(255,255,255,0.4)',
    textAlign: 'center',
  },
});
