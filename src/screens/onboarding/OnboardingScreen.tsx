import React, { useRef, useState } from 'react';
import { Animated, Dimensions, Easing, NativeScrollEvent, NativeSyntheticEvent, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '../../store/useAppStore';
import { colors, radius, spacing, typography } from '../../theme';

const { width } = Dimensions.get('window');

const SLIDES = [
  {
    icon: 'book' as const,
    titleKey: 'onboarding.title1',
    subtitleKey: 'onboarding.subtitle1',
    accentColor: '#F59E0B',
    gradientColors: ['#0B0D1F', '#0F1C42', '#1A2A6C'] as [string, string, string],
    arabicText: 'اقْرَأْ',
    arabicMeaning: 'Iqra — Read',
    features: ['114 Surahs with translation', '6,236 verses', 'Arabic & Urdu'],
  },
  {
    icon: 'library' as const,
    titleKey: 'onboarding.title2',
    subtitleKey: 'onboarding.subtitle2',
    accentColor: '#4ADE80',
    gradientColors: ['#062316', '#0B3D2E', '#1A6B4A'] as [string, string, string],
    arabicText: 'عِلْم',
    arabicMeaning: 'Ilm — Knowledge',
    features: ['Authentic Hadith collections', 'Bookmarks & notes', 'Offline access'],
  },
  {
    icon: 'chatbubble-ellipses' as const,
    titleKey: 'onboarding.title3',
    subtitleKey: 'onboarding.subtitle3',
    accentColor: '#38BDF8',
    gradientColors: ['#041923', '#0B2A35', '#0E4A6B'] as [string, string, string],
    arabicText: 'نُور',
    arabicMeaning: 'Noor — Light',
    features: ['AI-powered assistant', 'Prayer times & Qibla', 'Context-aware answers'],
  },
  {
    icon: 'chatbubble-ellipses' as const,
    titleKey: 'onboarding.title4',
    subtitleKey: 'onboarding.subtitle4',
    accentColor: '#C084FC',
    gradientColors: ['#1C0633', '#3B0764', '#5B21B6'] as [string, string, string],
    arabicText: 'عَقْل',
    arabicMeaning: 'Aql — Intellect',
    features: ['Ask about any verse or hadith', 'Understands your reading context', 'Powered by advanced AI'],
  },
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
    <LinearGradient colors={slide.gradientColors} style={styles.root}>
      <StatusBar barStyle="light-content" />

      {/* Skip */}
      <TouchableOpacity style={styles.skip} onPress={() => setHasOnboarded(true)}>
        <Text style={styles.skipText}>Skip</Text>
        <Ionicons name="chevron-forward" size={13} color="rgba(255,255,255,0.3)" />
      </TouchableOpacity>

      {/* Slides */}
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScroll}
        style={styles.flex}
        scrollEventThrottle={16}
      >
        {SLIDES.map((s, i) => (
          <View key={i} style={[styles.slide, { width }]}>
            {/* Large Arabic word */}
            <Text style={[styles.arabicHero, { color: s.accentColor, fontFamily: 'Amiri_400Regular' }]}>
              {s.arabicText}
            </Text>
            <Text style={[styles.arabicMeaning, { color: `${s.accentColor}AA` }]}>
              {s.arabicMeaning}
            </Text>

            {/* Icon display */}
            <View style={styles.iconContainer}>
              <View style={[styles.iconRingOuter, { borderColor: `${s.accentColor}18` }]} />
              <View style={[styles.iconRingInner, { borderColor: `${s.accentColor}30` }]} />
              <View style={[styles.iconCircle, { backgroundColor: `${s.accentColor}18` }]}>
                <Ionicons name={s.icon} size={52} color={s.accentColor} />
              </View>
            </View>

            <Text style={styles.title}>{t(s.titleKey)}</Text>
            <Text style={styles.subtitle}>{t(s.subtitleKey)}</Text>

            {/* Feature list */}
            <View style={styles.featureList}>
              {s.features.map((f, fi) => (
                <View key={fi} style={styles.featureRow}>
                  <View style={[styles.featureDot, { backgroundColor: s.accentColor }]} />
                  <Text style={styles.featureText}>{f}</Text>
                </View>
              ))}
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        {/* Dots */}
        <View style={styles.dots}>
          {SLIDES.map((s, i) => (
            <TouchableOpacity
              key={i}
              onPress={() => scrollRef.current?.scrollTo({ x: width * i, animated: true })}
              style={[
                styles.dot,
                i === idx && { backgroundColor: slide.accentColor, width: 28 },
                i !== idx && { backgroundColor: 'rgba(255,255,255,0.2)' },
              ]}
            />
          ))}
        </View>

        {/* CTA */}
        <TouchableOpacity
          style={[styles.cta, { backgroundColor: slide.accentColor }]}
          onPress={() => {
            if (isLast) setHasOnboarded(true);
            else scrollRef.current?.scrollTo({ x: width * (idx + 1), animated: true });
          }}
          activeOpacity={0.88}
        >
          <Text style={styles.ctaText}>{isLast ? 'Get Started' : 'Next'}</Text>
          <Ionicons name={isLast ? 'checkmark' : 'arrow-forward'} size={18} color={colors.navy[900]} />
        </TouchableOpacity>

        {/* Bismillah */}
        <Text style={[styles.bismillah, { fontFamily: 'Amiri_400Regular' }]}>
          بِسْمِ اللهِ الرَّحْمٰنِ الرَّحِيْمِ
        </Text>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  flex: { flex: 1 },
  skip: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    alignSelf: 'flex-end', paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl + spacing.lg,
  },
  skipText: { fontSize: 13, color: 'rgba(255,255,255,0.3)', fontWeight: '500' },
  slide: {
    alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: spacing.xxl, gap: spacing.md,
    paddingTop: spacing.sm,
  },
  arabicHero: { fontSize: 72, paddingTop: spacing.lg, paddingBottom: spacing.sm },
  arabicMeaning: { fontSize: 14, fontWeight: '600', letterSpacing: 1.5 },

  // Icon rings
  iconContainer: { alignItems: 'center', justifyContent: 'center', width: 170, height: 170 },
  iconRingOuter: { position: 'absolute', width: 170, height: 170, borderRadius: 85, borderWidth: 1 },
  iconRingInner: { position: 'absolute', width: 140, height: 140, borderRadius: 70, borderWidth: 1 },
  iconCircle: {
    width: 110, height: 110, borderRadius: 55,
    alignItems: 'center', justifyContent: 'center',
  },

  title: { ...typography.displayMd, color: colors.white, textAlign: 'center' },
  subtitle: { ...typography.body, color: 'rgba(255,255,255,0.5)', textAlign: 'center', lineHeight: 26 },

  // Feature list
  featureList: { width: '100%', gap: spacing.sm, marginTop: spacing.xs },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  featureDot: { width: 6, height: 6, borderRadius: 3 },
  featureText: { ...typography.bodySmall, color: 'rgba(255,255,255,0.6)', fontWeight: '500' },

  // Footer
  footer: { paddingHorizontal: spacing.xl, paddingBottom: spacing.xxxl, gap: spacing.lg, alignItems: 'center' },
  dots: { flexDirection: 'row', gap: spacing.sm, justifyContent: 'center' },
  dot: { height: 6, borderRadius: 3, transition: 'width 0.3s' } as any,
  cta: {
    borderRadius: radius.pill, paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xxxl, flexDirection: 'row',
    alignItems: 'center', justifyContent: 'center', gap: spacing.sm, width: '100%',
  },
  ctaText: { ...typography.subheading, color: colors.navy[900] },
  bismillah: { fontSize: 16, color: 'rgba(255,255,255,0.2)', textAlign: 'center' },
});
