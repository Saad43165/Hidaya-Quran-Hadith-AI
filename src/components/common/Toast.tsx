import React, { createContext, useCallback, useContext, useRef, useState } from 'react';
import { Animated, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing, typography } from '../../theme';

type ToastType = 'success' | 'error' | 'info';

interface ToastItem {
  id: number;
  message: string;
  type: ToastType;
}

interface ToastContextValue {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside ToastProvider');
  return ctx;
}

const ICON_MAP: Record<ToastType, keyof typeof Ionicons.glyphMap> = {
  success: 'checkmark-circle',
  error: 'close-circle',
  info: 'information-circle',
};

const BG_MAP: Record<ToastType, string> = {
  success: colors.semantic.success,
  error: colors.semantic.error,
  info: colors.gold[700],
};

function ToastBanner({ item, onDismiss }: { item: ToastItem; onDismiss: () => void }) {
  const translateY = useRef(new Animated.Value(120)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.parallel([
      Animated.spring(translateY, { toValue: 0, useNativeDriver: true, tension: 200, friction: 20 }),
      Animated.timing(opacity, { toValue: 1, duration: 180, useNativeDriver: true }),
    ]).start();

    const timer = setTimeout(() => dismiss(), 3000);
    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const dismiss = useCallback(() => {
    Animated.parallel([
      Animated.timing(translateY, { toValue: 120, duration: 200, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 0, duration: 200, useNativeDriver: true }),
    ]).start(() => onDismiss());
  }, [translateY, opacity, onDismiss]);

  const bg = BG_MAP[item.type];
  const icon = ICON_MAP[item.type];

  return (
    <Animated.View style={[styles.toast, { backgroundColor: bg, transform: [{ translateY }], opacity }]}>
      <TouchableOpacity style={styles.toastInner} onPress={dismiss} activeOpacity={0.9}>
        <Ionicons name={icon} size={20} color={colors.white} />
        <Text style={styles.toastText}>{item.message}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

export function Toast() {
  const [items, setItems] = useState<ToastItem[]>([]);

  const remove = useCallback((id: number) => {
    setItems(prev => prev.filter(t => t.id !== id));
  }, []);

  if (items.length === 0) return null;

  return (
    <View style={styles.container} pointerEvents="box-none">
      {items.map(item => (
        <ToastBanner key={item.id} item={item} onDismiss={() => remove(item.id)} />
      ))}
    </View>
  );
}

let nextId = 1;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);

  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = nextId++;
    setItems(prev => [...prev.slice(-2), { id, message, type }]);
  }, []);

  const remove = useCallback((id: number) => {
    setItems(prev => prev.filter(t => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <View style={styles.container} pointerEvents="box-none">
        {items.map(item => (
          <ToastBanner key={item.id} item={item} onDismiss={() => remove(item.id)} />
        ))}
      </View>
    </ToastContext.Provider>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: spacing.xxxl + spacing.xl,
    left: spacing.lg,
    right: spacing.lg,
    alignItems: 'stretch',
    gap: spacing.sm,
    zIndex: 9999,
  },
  toast: {
    borderRadius: radius.md,
    overflow: 'hidden',
    ...{
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 8,
      elevation: 8,
    },
  },
  toastInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  toastText: {
    ...typography.bodySmall,
    color: colors.white,
    flex: 1,
    fontWeight: '600',
  },
});
