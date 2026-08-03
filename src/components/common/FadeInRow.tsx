import React, { useEffect, useRef } from 'react';
import { Animated, Easing, ViewStyle } from 'react-native';

interface Props {
  index: number;
  children: React.ReactNode;
  style?: ViewStyle;
  delay?: number;
}

/** Staggered fade+slide-up animation for list items. Use index prop for stagger. */
export function FadeInRow({ index, children, style, delay = 60 }: Props) {
  const opacity   = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(18)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1, duration: 320, delay: index * delay,
        useNativeDriver: true, easing: Easing.out(Easing.cubic),
      }),
      Animated.timing(translateY, {
        toValue: 0, duration: 320, delay: index * delay,
        useNativeDriver: true, easing: Easing.out(Easing.cubic),
      }),
    ]).start();
  }, []);

  return (
    <Animated.View style={[style, { opacity, transform: [{ translateY }] }]}>
      {children}
    </Animated.View>
  );
}
