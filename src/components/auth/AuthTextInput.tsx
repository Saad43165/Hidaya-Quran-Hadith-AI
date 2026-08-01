import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, TextInputProps, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing, typography } from '../../theme';

interface Props extends TextInputProps {
  label: string;
  error?: string;
}

export function AuthTextInput({ label, error, secureTextEntry, style, ...rest }: Props) {
  const [hidden, setHidden] = useState(secureTextEntry ?? false);
  const isPassword = secureTextEntry;

  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.inputRow, error && styles.inputRowError]}>
        <TextInput
          style={[styles.input, style]}
          placeholderTextColor={colors.parchment[400]}
          autoCapitalize="none"
          autoCorrect={false}
          secureTextEntry={hidden}
          {...rest}
        />
        {isPassword && (
          <TouchableOpacity onPress={() => setHidden(h => !h)} style={styles.eyeBtn}>
            <Ionicons name={hidden ? 'eye-outline' : 'eye-off-outline'} size={18} color={colors.parchment[500]} />
          </TouchableOpacity>
        )}
      </View>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { marginBottom: spacing.lg },
  label: { ...typography.label, color: colors.parchment[700], marginBottom: spacing.sm, fontSize: 11 },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.parchment[300],
  },
  inputRowError: { borderColor: colors.semantic.error },
  input: {
    flex: 1,
    ...typography.body,
    color: colors.parchment[950],
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  eyeBtn: { paddingHorizontal: spacing.md },
  errorText: { ...typography.caption, color: colors.semantic.error, marginTop: spacing.xs },
});
