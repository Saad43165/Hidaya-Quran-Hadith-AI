/** Safe haptic feedback — lazy loads expo-haptics, never crashes */
export const Haptics = {
  impact: async (style: 'light' | 'medium' | 'heavy' = 'medium') => {
    try {
      const H = await import('expo-haptics');
      const map = {
        light: H.ImpactFeedbackStyle.Light,
        medium: H.ImpactFeedbackStyle.Medium,
        heavy: H.ImpactFeedbackStyle.Heavy,
      };
      await H.impactAsync(map[style]);
    } catch {}
  },
  success: async () => {
    try {
      const H = await import('expo-haptics');
      await H.notificationAsync(H.NotificationFeedbackType.Success);
    } catch {}
  },
};
