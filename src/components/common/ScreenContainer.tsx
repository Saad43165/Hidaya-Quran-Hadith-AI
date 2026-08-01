import React, { PropsWithChildren } from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../../theme';

interface Props {
  style?: ViewStyle;
  noPadding?: boolean;
  dark?: boolean;
}

export function ScreenContainer({ children, style, noPadding, dark }: PropsWithChildren<Props>) {
  return (
    <SafeAreaView
      style={[styles.safeArea, dark && styles.safeAreaDark]}
      edges={['top', 'left', 'right']}
    >
      <View style={[styles.content, !noPadding && styles.padded, style]}>
        {children}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.parchment[50],
  },
  safeAreaDark: {
    backgroundColor: colors.navy[900],
  },
  content: {
    flex: 1,
  },
  padded: {
    paddingHorizontal: 20,
  },
});
