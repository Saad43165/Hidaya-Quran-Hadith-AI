import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNetworkStatus } from '../../hooks/useNetworkStatus';
import { spacing, typography } from '../../theme';

export function OfflineBanner() {
  const { isOnline } = useNetworkStatus();
  const slideAnim = useRef(new Animated.Value(-40)).current;

  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: isOnline ? -40 : 0,
      useNativeDriver: true,
      tension: 80,
      friction: 10,
    }).start();
  }, [isOnline]);

  return (
    <Animated.View style={[styles.banner, { transform: [{ translateY: slideAnim }] }]}>
      <Ionicons name="cloud-offline-outline" size={13} color="#fff" />
      <Text style={styles.text}>Offline — showing cached content</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  banner: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 999,
    backgroundColor: '#374151',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.xs + 2,
    paddingHorizontal: spacing.lg,
  },
  text: {
    ...typography.caption,
    color: '#fff',
    fontWeight: '600',
  },
});
