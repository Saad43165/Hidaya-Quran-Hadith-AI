import React from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View, Animated, Easing } from 'react-native';
import { useThemeStore } from '../../store/useThemeStore';
import { colors, radius, spacing, typography } from '../../theme';
import { darkColors } from '../../theme/darkColors';
import { useTranslation } from 'react-i18next';

export interface CustomAlertButton {
  text: string;
  onPress?: () => void;
  style?: 'cancel' | 'destructive' | 'default';
}

interface CustomAlertProps {
  visible: boolean;
  title: string;
  message?: string;
  buttons?: CustomAlertButton[];
  onDismiss: () => void;
}

export function CustomAlert({ visible, title, message, buttons = [], onDismiss }: CustomAlertProps) {
  const isDark = useThemeStore(s => s.isDark);
  const { t } = useTranslation();

  // Animation values
  const [show, setShow] = React.useState(visible);
  const scale = React.useRef(new Animated.Value(0.9)).current;
  const opacity = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    if (visible) {
      setShow(true);
      Animated.parallel([
        Animated.spring(scale, { toValue: 1, tension: 60, friction: 8, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(scale, { toValue: 0.9, duration: 150, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0, duration: 150, useNativeDriver: true }),
      ]).start(() => setShow(false));
    }
  }, [visible]);

  if (!show) return null;

  const bg = isDark ? darkColors.surface : colors.white;
  const textTitle = isDark ? darkColors.text.primary : colors.navy[900];
  const textMsg = isDark ? darkColors.text.secondary : colors.parchment[600];
  const border = isDark ? darkColors.border : colors.parchment[200];

  const defaultButtons: CustomAlertButton[] = [{ text: t('common.ok', 'OK'), onPress: onDismiss }];
  const activeButtons = buttons.length > 0 ? buttons : defaultButtons;

  return (
    <Modal visible={show} transparent animationType="none" onRequestClose={onDismiss}>
      <View style={styles.overlay}>
        <View style={[StyleSheet.absoluteFill, { backgroundColor: isDark ? 'rgba(0,0,0,0.7)' : 'rgba(0,0,0,0.5)' }]} />
        <Animated.View style={[styles.dialog, { backgroundColor: bg, borderColor: border, opacity, transform: [{ scale }] }]}>
          <Text style={[styles.title, { color: textTitle }]}>{title}</Text>
          {message && <Text style={[styles.message, { color: textMsg }]}>{message}</Text>}
          
          <View style={[styles.buttonContainer, { borderColor: border }]}>
            {activeButtons.map((btn, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.button,
                  index > 0 && { borderLeftWidth: 1, borderLeftColor: border }
                ]}
                onPress={() => {
                  btn.onPress?.();
                  onDismiss();
                }}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.buttonText,
                    btn.style === 'cancel' && { color: textMsg },
                    btn.style === 'destructive' && { color: colors.semantic.error }
                  ]}
                >
                  {btn.text}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  dialog: {
    width: '100%',
    maxWidth: 340,
    borderRadius: radius.xl,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
  title: {
    ...typography.heading,
    textAlign: 'center',
    marginTop: spacing.xl,
    marginHorizontal: spacing.lg,
  },
  message: {
    ...typography.body,
    textAlign: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.xl,
    marginHorizontal: spacing.lg,
  },
  buttonContainer: {
    flexDirection: 'row',
    borderTopWidth: 1,
  },
  button: {
    flex: 1,
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    ...typography.label,
    color: colors.gold[500],
    fontSize: 16,
  },
});
