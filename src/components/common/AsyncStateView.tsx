import React from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { colors, radius, shadow, spacing, typography } from '../../theme';

export function LoadingView({ message }: { message?: string }) {
  return (
    <View style={styles.center}>
      <View style={styles.loadingSpinner}>
        <ActivityIndicator size="large" color={colors.gold[500]} />
      </View>
      {message && <Text style={styles.message}>{message}</Text>}
    </View>
  );
}

export function ErrorView({ message, onRetry }: { message: string; onRetry?: () => void }) {
  const { t } = useTranslation();
  return (
    <View style={styles.center}>
      <View style={styles.errorCard}>
        <View style={styles.errorIcon}>
          <Ionicons name="cloud-offline-outline" size={32} color={colors.semantic.error} />
        </View>
        <Text style={styles.errorTitle}>Something went wrong</Text>
        <Text style={styles.errorText}>{message}</Text>
        {onRetry && (
          <TouchableOpacity style={styles.retryBtn} onPress={onRetry} activeOpacity={0.82}>
            <Ionicons name="refresh-outline" size={16} color={colors.white} />
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
  loadingSpinner: {
    width: 72,
    height: 72,
    borderRadius: 24,
    backgroundColor: colors.navy[900],
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.navy,
    marginBottom: spacing.md,
  },
  message: {
    ...typography.bodySmall,
    color: colors.parchment[500],
    textAlign: 'center',
  },
  errorCard: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: spacing.xxl,
    alignItems: 'center',
    gap: spacing.md,
    width: '100%',
    borderWidth: 1,
    borderColor: colors.parchment[200],
    ...shadow.md,
  },
  errorIcon: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: colors.semantic.errorLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  errorTitle: { ...typography.heading, color: colors.parchment[900] },
  errorText: {
    ...typography.bodySmall,
    color: colors.parchment[500],
    textAlign: 'center',
    lineHeight: 22,
  },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.navy[900],
    paddingHorizontal: spacing.xxl,
    paddingVertical: spacing.md,
    borderRadius: radius.pill,
    marginTop: spacing.sm,
    ...shadow.navy,
  },
  retryLabel: {
    ...typography.bodyMedium,
    color: colors.white,
  },
});
