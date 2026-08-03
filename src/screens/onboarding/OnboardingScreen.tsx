import React, { useRef, useState } from 'react';
import {
  Animated, Dimensions, Easing, NativeScrollEvent, NativeSyntheticEvent,
  ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '../../store/useAppStore';
import { radius, spacing } from '../../theme';
import { IslamicPattern } from '../../components/common/IslamicPattern';

const { width, height } = Dimensions.get('window');

// ─── Slide Data ────────────────────────────────────────────────────────────────
const SLIDES = [
  {
    arabicWord: 'اقْرَأْ',
    transliteration: 'Iqra',
    meaning: 'Read',
    accentColor: '#F59E0B',
    gradientColors: ['#060C1F', '#0D1535', '#1A2462'] as [string, string, string],
    headline: 'The Holy Quran',
    tagline: 'Begin with the word of Allah',
    features: [
      '114 Surahs with full translation',
      'Arabic text with Tajweed marks',
      'Urdu & English side by side',
    ],
  },
  {
    arabicWord: 'عِلْم',
    transliteration: 'Ilm',
    meaning: 'Knowledge',
    accentColor: '#10B981',
    gradientColors: ['#050F0A', '#0A1F15', '#0F3024'] as [string, string, string],
    headline: 'Hadith · Prayer · AI',
    tagline: 'Deepen your understanding every day',
    features: [
      'Authentic Hadith collections',
      'Accurate GPS prayer times & Qibla',
      'AI scholar — ask any Islamic question',
    ],
  },
  {
    arabicWord: 'بِسْمِ اللهِ',
    transliteration: 'Bismillah',
    meaning: 'In the name of Allah',
    accentColor: '#8B5CF6',
    gradientColors: ['#0A0514', '#130A2A', '#1E1040'] as [string, string, string],
    headline: 'Begin Your Journey',
    tagline: 'A premium Islamic companion awaits',
    features: [
      'Works fully offline — no account needed',
      'Bookmarks, streaks & learning goals',
      'Beautiful dark design for night reading',
    ],
  },
];

const onboardingPatternStyle = {
  top: height * 0.08,
  alignSelf: 'center' as const,
};

// ─── Single slide ─────────────────────────────────────────────────────────────
function SlideContent({ slide, isActive }: { slide: typeof SLIDES[0]; isActive: boolean }) {
  const fadeAnim   = useRef(new Animated.Value(0)).current;
  const slideUpAnim = useRef(new Animated.Value(40)).current;
  const scaleAnim  = useRef(new Animated.Value(0.82)).current;

  React.useEffect(() => {
    if (isActive) {
      Animated.parallel([
        Animated.timing(fadeAnim,   { toValue: 1, duration: 550, useNativeDriver: true, easing: Easing.out(Easing.cubic) }),
        Animated.spring(slideUpAnim, { toValue: 0, useNativeDriver: true, tension: 180, friction: 18 }),
        Animated.spring(scaleAnim,  { toValue: 1, useNativeDriver: true, tension: 180, friction: 16 }),
      ]).start();
    } else {
      fadeAnim.setValue(0);
      slideUpAnim.setValue(40);
      scaleAnim.setValue(0.82);
    }
  }, [isActive]);

  return (
    <View style={[ss.slide, { width }]}>
      {/* Islamic geometric pattern backdrop */}
      <IslamicPattern accentColor={slide.accentColor} size={320} style={onboardingPatternStyle} />

      {/* Arabic calligraphy hero word */}
      <Animated.Text
        style={[
          ss.arabicHero,
          {
            color: slide.accentColor,
            fontFamily: 'Amiri_400Regular',
            opacity: fadeAnim,
            transform: [{ translateY: slideUpAnim }, { scale: scaleAnim }],
          },
        ]}
      >
        {slide.arabicWord}
      </Animated.Text>

      {/* Transliteration + meaning */}
      <Animated.View style={[ss.transRow, { opacity: fadeAnim }]}>
        <View style={[ss.transLine, { backgroundColor: slide.accentColor + '60' }]} />
        <Text style={[ss.transText, { color: slide.accentColor }]}>
          {slide.transliteration}  ·  {slide.meaning}
        </Text>
        <View style={[ss.transLine, { backgroundColor: slide.accentColor + '60' }]} />
      </Animated.View>

      {/* Headline */}
      <Animated.Text
        style={[ss.headline, { opacity: fadeAnim, transform: [{ translateY: slideUpAnim }] }]}
      >
        {slide.headline}
      </Animated.Text>

      {/* Tagline */}
      <Animated.Text
        style={[ss.tagline, { opacity: fadeAnim, transform: [{ translateY: slideUpAnim }] }]}
      >
        {slide.tagline}
      </Animated.Text>

      {/* Feature list */}
      <Animated.View
        style={[ss.featureList, { opacity: fadeAnim, transform: [{ translateY: slideUpAnim }] }]}
      >
        {slide.features.map((f, i) => (
          <View key={i} style={ss.featureRow}>
            <View style={[ss.check, { backgroundColor: slide.accentColor + '22', borderColor: slide.accentColor + '55' }]}>
              <Text style={[ss.checkMark, { color: slide.accentColor }]}>✓</Text>
            </View>
            <Text style={ss.featureText}>{f}</Text>
          </View>
        ))}
      </Animated.View>
    </View>
  );
}

const ss = StyleSheet.create({
  slide: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
    paddingTop: 40,
    gap: 12,
  },
  arabicHero: {
    fontSize: 96,
    lineHeight: 130,
    textAlign: 'center',
    marginTop: 60,
    marginBottom: 0,
  },
  transRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  transLine: { flex: 1, height: 1 },
  transText: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 1.6,
    textTransform: 'uppercase',
  },
  headline: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: -0.4,
    marginTop: 4,
  },
  tagline: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.45)',
    textAlign: 'center',
    lineHeight: 22,
    fontWeight: '400',
    marginBottom: 8,
  },
  featureList: {
    width: '100%',
    gap: 10,
    marginTop: 8,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  check: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkMark: {
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 16,
  },
  featureText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.62)',
    fontWeight: '500',
    flex: 1,
  },
});

// ─── Main Screen ───────────────────────────────────────────────────────────────
export function OnboardingScreen() {
  const { t } = useTranslation();
  const setHasOnboarded = useAppStore(s => s.setHasOnboarded);
  const scrollRef = useRef<ScrollView>(null);
  const [idx, setIdx] = useState(0);

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const newIdx = Math.round(e.nativeEvent.contentOffset.x / width);
    if (newIdx !== idx) setIdx(newIdx);
  };

  const slide  = SLIDES[idx];
  const isLast = idx === SLIDES.length - 1;

  const handleNext = () => {
    if (isLast) {
      setHasOnboarded(true);
    } else {
      scrollRef.current?.scrollTo({ x: width * (idx + 1), animated: true });
    }
  };

  return (
    <LinearGradient colors={slide.gradientColors} style={styles.root}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* Ambient glow orb top-right */}
      <View
        style={[
          styles.glowOrb,
          { backgroundColor: slide.accentColor + '18' },
        ]}
      />

      {/* Skip button */}
      <TouchableOpacity style={styles.skip} onPress={() => setHasOnboarded(true)} activeOpacity={0.7}>
        <Text style={styles.skipText}>Skip</Text>
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
        decelerationRate="fast"
      >
        {SLIDES.map((s, i) => (
          <SlideContent key={i} slide={s} isActive={i === idx} />
        ))}
      </ScrollView>

      {/* ── Footer ── */}
      <View style={styles.footer}>
        {/* Pill progress dots */}
        <View style={styles.dots}>
          {SLIDES.map((_, i) => (
            <TouchableOpacity
              key={i}
              onPress={() => scrollRef.current?.scrollTo({ x: width * i, animated: true })}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <View
                style={[
                  styles.dot,
                  i === idx
                    ? { backgroundColor: slide.accentColor, width: 32, opacity: 1 }
                    : { backgroundColor: 'rgba(255,255,255,0.18)', width: 8, opacity: 0.7 },
                ]}
              />
            </TouchableOpacity>
          ))}
        </View>

        {/* CTA button */}
        <TouchableOpacity
          style={[styles.cta, { backgroundColor: slide.accentColor }]}
          onPress={handleNext}
          activeOpacity={0.86}
        >
          <Text style={styles.ctaText}>
            {isLast ? t('onboarding.getStarted') : t('onboarding.next')}
          </Text>
        </TouchableOpacity>

        {/* Bismillah watermark */}
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

  glowOrb: {
    position: 'absolute',
    width: 340,
    height: 340,
    borderRadius: 170,
    right: -120,
    top: -80,
  },

  skip: {
    alignSelf: 'flex-end',
    paddingHorizontal: 24,
    paddingTop: 56,
    paddingBottom: 8,
  },
  skipText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.28)',
    fontWeight: '500',
    letterSpacing: 0.3,
  },

  footer: {
    paddingHorizontal: 24,
    paddingBottom: 40,
    gap: 16,
    alignItems: 'center',
  },

  dots: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },

  cta: {
    width: '100%',
    borderRadius: radius.pill,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#060C1F',
    letterSpacing: 0.2,
  },

  bismillah: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.15)',
    textAlign: 'center',
  },
});
