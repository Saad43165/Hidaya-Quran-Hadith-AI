import React, { createContext, useCallback, useContext, useRef, useState } from 'react';
import { Animated } from 'react-native';

interface DrawerContextValue {
  isOpen: boolean;
  slideAnim: Animated.Value;
  backdropAnim: Animated.Value;
  openDrawer: () => void;
  closeDrawer: () => void;
}

const DrawerContext = createContext<DrawerContextValue>({
  isOpen: false,
  slideAnim: new Animated.Value(-300),
  backdropAnim: new Animated.Value(0),
  openDrawer: () => {},
  closeDrawer: () => {},
});

export function DrawerProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const slideAnim = useRef(new Animated.Value(-300)).current;
  const backdropAnim = useRef(new Animated.Value(0)).current;

  const openDrawer = useCallback(() => {
    setIsOpen(true);
    Animated.parallel([
      Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, tension: 280, friction: 24 }),
      Animated.timing(backdropAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
    ]).start();
  }, [slideAnim, backdropAnim]);

  const closeDrawer = useCallback(() => {
    Animated.parallel([
      Animated.spring(slideAnim, { toValue: -300, useNativeDriver: true, tension: 280, friction: 24 }),
      Animated.timing(backdropAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
    ]).start(() => setIsOpen(false));
  }, [slideAnim, backdropAnim]);

  return (
    <DrawerContext.Provider value={{ isOpen, slideAnim, backdropAnim, openDrawer, closeDrawer }}>
      {children}
    </DrawerContext.Provider>
  );
}

export function useDrawer(): DrawerContextValue {
  return useContext(DrawerContext);
}
