import React from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, gradients, radius, spacing, typography } from '../../theme';

interface Props {
  label: string;
  onPress: () => void;
  isLoading?: boolean;
  variant?: 'primary' | 'secondary';
}

export function AuthButton({ label, onPress, isLoading, variant = 'primary' }: Props) {
  if (variant === 'primary') {
    return (
      <TouchableOpacity onPress={onPress} disabled={isLoading} activeOpacity={0.85}>
        <LinearGradient
          colors={gradients.warmCard}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.primary}
        >
          {isLoading
            ? <ActivityIndicator color={colors.white} />
            : <Text style={styles.primaryLabel}>{label}</Text>
          }
        </LinearGradient>
      </TouchableOpacity>
    );
  }
  return (
    <TouchableOpacity style={styles.secondary} onPress={onPress} disabled={isLoading} activeOpacity={0.7}>
      {isLoading
        ? <ActivityIndicator color={colors.parchment[700]} />
        : <Text style={styles.secondaryLabel}>{label}</Text>
      }
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  primary: {
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
  },
  primaryLabel: { ...typography.subheading, color: colors.white },
  secondary: {
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
    borderWidth: 1.5,
    borderColor: colors.parchment[300],
    backgroundColor: colors.white,
  },
  secondaryLabel: { ...typography.subheading, color: colors.parchment[800] },
});
