import React, { useRef, useState } from 'react';
import { Dimensions, NativeScrollEvent, NativeSyntheticEvent, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '../../store/useAppStore';
import { colors, radius, spacing, typography } from '../../theme';

const { width } = Dimensions.get('window');

const SLIDES = [
  { icon: 'book' as const,                   titleKey: 'onboarding.title1', subtitleKey: 'onboarding.subtitle1', color: '#D4A93E' },
  { icon: 'library' as const,                titleKey: 'onboarding.title2', subtitleKey: 'onboarding.subtitle2', color: '#2E7D5B' },
  { icon: 'chatbubble-ellipses' as const,    titleKey: 'onboarding.title3', subtitleKey: 'onboarding.subtitle3', color: '#1E6B80' },
];

export function OnboardingScreen() {
  const { t } = useTranslation();
  const setHasOnboarded = useAppStore(s => s.setHasOnboarded);
  const scrollRef = useRef<ScrollView>(null);
  const [idx, setIdx] = useState(0);

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) =>
    setIdx(Math.round(e.nativeEvent.contentOffset.x / width));

  const isLast = idx === SLIDES.length - 1;
  const slide = SLIDES[idx];

  return (
    <LinearGradient colors={[colors.navy[950], colors.navy[800]]} style={styles.root}>
      {/* Skip */}
      <TouchableOpacity style={styles.skip} onPress={() => setHasOnboarded(true)}>
        <Text style={styles.skipText}>{t('onboarding.skip')}</Text>
      </TouchableOpacity>

      {/* Slides */}
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScroll}
        style={styles.flex}
      >
        {SLIDES.map((s, i) => (
          <View key={i} style={[styles.slide, { width }]}>
            <View style={[styles.iconCircle, { borderColor: s.color + '40', backgroundColor: s.color + '18' }]}>
              <Ionicons name={s.icon} size={56} color={s.color} />
            </View>
            <Text style={styles.title}>{t(s.titleKey)}</Text>
            <Text style={styles.subtitle}>{t(s.subtitleKey)}</Text>
          </View>
        ))}
      </ScrollView>

      {/* Dots + CTA */}
      <View style={styles.footer}>
        <View style={styles.dots}>
          {SLIDES.map((_, i) => (
            <View
              key={i}
              style={[styles.dot, i === idx && { backgroundColor: slide.color, width: 24 }]}
            />
          ))}
        </View>
        <TouchableOpacity
          style={[styles.cta, { backgroundColor: slide.color }]}
          onPress={() => {
            if (isLast) setHasOnboarded(true);
            else scrollRef.current?.scrollTo({ x: width * (idx + 1), animated: true });
          }}
        >
          <Text style={styles.ctaText}>{isLast ? t('onboarding.getStarted') : 'Next'}</Text>
          <Ionicons name={isLast ? 'checkmark' : 'arrow-forward'} size={18} color={colors.navy[900]} />
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  flex: { flex: 1 },
  skip: { alignSelf: 'flex-end', paddingHorizontal: spacing.xl, paddingTop: spacing.xl },
  skipText: { ...typography.bodySmall, color: 'rgba(255,255,255,0.4)' },
  slide: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xxl,
    gap: spacing.xl,
  },
  iconCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  title: { ...typography.displayMd, color: colors.white, textAlign: 'center' },
  subtitle: { ...typography.body, color: 'rgba(255,255,255,0.55)', textAlign: 'center', lineHeight: 24 },
  footer: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xxxl,
    gap: spacing.xl,
  },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: spacing.sm },
  dot: {
    height: 6,
    width: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  cta: {
    borderRadius: radius.md,
    paddingVertical: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  ctaText: { ...typography.subheading, color: colors.navy[900] },
});
