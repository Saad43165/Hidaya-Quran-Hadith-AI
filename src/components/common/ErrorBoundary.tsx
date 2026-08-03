import React, { Component, PropsWithChildren } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors, spacing, typography } from '../../theme';

interface State {
  hasError: boolean;
  error: string;
}

export class ErrorBoundary extends Component<PropsWithChildren, State> {
  state: State = { hasError: false, error: '' };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error: error.message };
  }

  componentDidCatch(error: Error) {
    console.warn('[KitaabAI] Uncaught error:', error.message);
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <Text style={styles.emoji}>📖</Text>
          <Text style={styles.title}>Something went wrong</Text>
          <Text style={styles.message}>{this.state.error}</Text>
          <TouchableOpacity
            style={styles.btn}
            onPress={() => this.setState({ hasError: false, error: '' })}
            activeOpacity={0.8}
          >
            <Text style={styles.btnText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1, backgroundColor: colors.parchment[50],
    alignItems: 'center', justifyContent: 'center',
    padding: spacing.xxl, gap: spacing.lg,
  },
  emoji: { fontSize: 48 },
  title: { ...typography.displayMd, color: colors.navy[900], textAlign: 'center' },
  message: { ...typography.bodySmall, color: colors.parchment[600], textAlign: 'center' },
  btn: {
    backgroundColor: colors.navy[900], borderRadius: 12,
    paddingHorizontal: spacing.xxl, paddingVertical: spacing.md,
  },
  btnText: { ...typography.subheading, color: colors.white },
});
