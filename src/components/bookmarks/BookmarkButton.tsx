import React from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme';

interface Props {
  isBookmarked: boolean;
  onToggle: () => void;
  size?: number;
}

export function BookmarkButton({ isBookmarked, onToggle, size = 20 }: Props) {
  return (
    <TouchableOpacity onPress={onToggle} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} style={styles.button}>
      <Ionicons
        name={isBookmarked ? 'bookmark' : 'bookmark-outline'}
        size={size}
        color={isBookmarked ? colors.gold[700] : colors.parchment[600]}
      />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    padding: 2,
  },
});
