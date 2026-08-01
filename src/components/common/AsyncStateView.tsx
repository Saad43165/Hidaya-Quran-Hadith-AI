import React from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { colors, radius, spacing, typography } from '../../theme';

export function LoadingView({ message }: { message?: string }) {
  const { t } = useTranslation();
  return (
    <View style={styles.center}>
      <ActivityIndicator size="large" color={colors.gold[500]} />
      {message && <Text style={styles.message}>{message}</Text>}
    </View>
  );
}

export function ErrorView({ message, onRetry }: { message: string; onRetry?: () => void }) {
  const { t } = useTranslation();
  return (
    <View style={styles.center}>
      <View style={styles.errorCard}>
        <Text style={styles.errorText}>{message}</Text>
        {onRetry && (
          <TouchableOpacity style={styles.retryBtn} onPress={onRetry}>
            <Text style={styles.retryLabel}>{t('common.retry')}</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  message: {
    ...typography.bodySmall,
    color: colors.parchment[600],
    marginTop: spacing.md,
    textAlign: 'center',
  },
  errorCard: {
    backgroundColor: colors.semantic.errorLight,
    borderRadius: radius.md,
    padding: spacing.xl,
    alignItems: 'center',
    gap: spacing.lg,
    width: '100%',
  },
  errorText: {
    ...typography.body,
    color: colors.semantic.error,
    textAlign: 'center',
  },
  retryBtn: {
    backgroundColor: colors.navy[800],
    paddingHorizontal: spacing.xxl,
    paddingVertical: spacing.md,
    borderRadius: radius.pill,
  },
  retryLabel: {
    ...typography.bodyMedium,
    color: colors.white,
  },
});
