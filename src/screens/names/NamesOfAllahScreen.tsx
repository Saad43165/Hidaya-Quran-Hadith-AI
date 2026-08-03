import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  FlatList,
  Modal,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { createAudioPlayer, type AudioPlayer } from 'expo-audio';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { IslamicPattern } from '../../components/common/IslamicPattern';
import { BackButton } from '../../components/common/BackButton';
import { NAMES_OF_ALLAH, NameOfAllah, NameCategory } from '../../data/namesOfAllah';
import { NAMES_OF_MUHAMMAD, NameOfMuhammad } from '../../data/namesOfMuhammad';
import { colors, gradients, radius, shadow, spacing, typography } from '../../theme';
import { darkColors } from '../../theme/darkColors';
import { useThemeStore } from '../../store/useThemeStore';
import { useAudioStore } from '../../store/useAudioStore';
import { useNavigation } from '@react-navigation/native';

const SCREEN_HEIGHT = Dimensions.get('window').height;

type FilterCategory = 'all' | NameCategory;

interface CategoryChip {
  key: FilterCategory;
  label: string;
}

const CATEGORY_CHIPS: CategoryChip[] = [
  { key: 'all',   label: 'All' },
  { key: 'jamal', label: 'Names of Beauty (Jamal)' },
  { key: 'jalal', label: 'Names of Majesty (Jalal)' },
  { key: 'kamal', label: 'Names of Perfection (Kamal)' },
];

let nameAudioPlayer: AudioPlayer | null = null;
let currentPlayingNumber = -1;

function speakName(arabicText: string, isProphetName: boolean, number: number) {
  try {
    const quranPlayState = useAudioStore.getState();
    if (quranPlayState.isPlaying) {
      quranPlayState.pause();
    }

    if (nameAudioPlayer) {
      nameAudioPlayer.pause();
      try {
        nameAudioPlayer.remove();
      } catch (err) {
        console.warn('Error removing name audio player:', err);
      }
      nameAudioPlayer = null;
    }

    let url = '';
    if (!isProphetName) {
      const pad = (n: number) => String(n).padStart(3, '0');
      // islamicity files are 1-indexed for the 99 traditional names starting at Ar-Rahman.
      // Our data has Allah as #1, so the audio index = number - 1.
      // For Allah (#1) there is no dedicated file → fall back to Google TTS.
      if (number <= 1) {
        url = `https://translate.google.com/translate_tts?ie=UTF-8&tl=ar&client=tw-ob&q=${encodeURIComponent(arabicText)}`;
      } else {
        url = `https://www.islamicity.org/mediaassets/MP3/other/covers/99-names-of-Allah/${pad(number - 1)}.mp3?v06092021`;
      }
    } else {
      url = `https://translate.google.com/translate_tts?ie=UTF-8&tl=ar&client=tw-ob&q=${encodeURIComponent(arabicText)}`;
    }

    currentPlayingNumber = number;
    nameAudioPlayer = createAudioPlayer(url);
    nameAudioPlayer.play();
  } catch (err) {
    console.warn('Failed to play name audio:', err);
  }
}

function stopNameAudio() {
  if (nameAudioPlayer) {
    nameAudioPlayer.pause();
    try {
      nameAudioPlayer.remove();
    } catch (err) {
      console.warn('Error removing name audio player:', err);
    }
    nameAudioPlayer = null;
  }
}

function toArabicIndic(n: number): string {
  return String(n).replace(/\d/g, d => '٠١٢٣٤٥٦٧٨٩'[Number(d)]);
}

function categoryLabel(cat: NameCategory): string {
  if (cat === 'jamal') return 'Names of Beauty (Jamal)';
  if (cat === 'jalal') return 'Names of Majesty (Jalal)';
  return 'Names of Perfection (Kamal)';
}

function categoryColor(cat: NameCategory): string {
  if (cat === 'jamal') return '#D4A93E';
  if (cat === 'jalal') return '#6B7FD4';
  return '#4ADE80';
}

interface NameDetailModalProps {
  name: NameOfAllah | NameOfMuhammad | null;
  isProphetName: boolean;
  onClose: () => void;
  isDark: boolean;
}

function NameDetailModal({ name, isProphetName, onClose, isDark }: NameDetailModalProps) {
  const sheetBg = isDark ? darkColors.surface : colors.white;
  const handleBg = isDark ? 'rgba(255,255,255,0.15)' : colors.parchment[300];
  const translitColor = isDark ? darkColors.text.primary : colors.navy[900];
  const meaningColor = isDark ? darkColors.text.secondary : colors.parchment[600];
  const dividerColor = isDark ? darkColors.border : colors.parchment[200];
  const sectionLabelColor = isDark ? darkColors.text.muted : colors.parchment[500];
  const sectionBodyColor = isDark ? darkColors.text.primary : colors.parchment[800];
  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (name) {
      slideAnim.setValue(SCREEN_HEIGHT);
      backdropOpacity.setValue(0);
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          useNativeDriver: true,
          tension: 65,
          friction: 11,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [name]);

  const handleClose = () => {
    stopNameAudio();
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: SCREEN_HEIGHT,
        duration: 280,
        useNativeDriver: true,
      }),
      Animated.timing(backdropOpacity, {
        toValue: 0,
        duration: 220,
        useNativeDriver: true,
      }),
    ]).start(() => onClose());
  };

  const handleShare = async () => {
    if (!name) return;
    try {
      const categoryStr = !isProphetName && 'category' in name ? ` (${categoryLabel(name.category)})` : '';
      const benefitStr = !isProphetName && 'benefits' in name ? `\n\nBenefit: ${name.benefits}` : '';
      const attribution = isProphetName 
        ? `— One of the noble Names of Prophet Muhammad (peace be upon him) (#${name.number})`
        : `— One of the 99 Beautiful Names of Allah (#${name.number})`;

      await Share.share({
        message:
          `${name.arabic}\n\n` +
          `${name.transliteration} — ${name.meaning}${categoryStr}\n\n` +
          `${name.explanation}` +
          benefitStr + `\n\n` +
          attribution,
      });
    } catch {
      // user cancelled
    }
  };

  const isAllahName = name && !isProphetName && 'category' in name;

  return (
    <Modal
      visible={name !== null}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={handleClose}
    >
      <View style={mStyles.root}>
        <TouchableWithoutFeedback onPress={handleClose}>
          <Animated.View style={[mStyles.backdrop, { opacity: backdropOpacity }]} />
        </TouchableWithoutFeedback>

        <Animated.View style={[mStyles.sheet, { backgroundColor: sheetBg, transform: [{ translateY: slideAnim }] }]}>
          {/* Handle bar */}
          <View style={[mStyles.handle, { backgroundColor: handleBg }]} />

          {/* Number badge — absolute top-right */}
          {name && (
            <View style={mStyles.numBadge}>
              <Text style={[mStyles.numBadgeText, { fontFamily: 'Amiri_700Bold' }]}>
                {toArabicIndic(name.number)}
              </Text>
            </View>
          )}

          {/* Category pill / Prophet Pill */}
          {name && (
            <View
              style={[
                mStyles.catPill,
                isAllahName ? {
                  backgroundColor: categoryColor((name as NameOfAllah).category) + '22',
                  borderColor: categoryColor((name as NameOfAllah).category) + '55',
                } : {
                  backgroundColor: colors.gold[50] + '44',
                  borderColor: colors.gold[200],
                },
              ]}
            >
              <Text style={[mStyles.catPillText, isAllahName ? { color: categoryColor((name as NameOfAllah).category) } : { color: colors.gold[600] }]}>
                {isAllahName ? categoryLabel((name as NameOfAllah).category) : "Prophet Muhammad's Name (PBUH)"}
              </Text>
            </View>
          )}

          {/* Large Arabic */}
          {name && (
            <Text style={[mStyles.arabicLarge, { fontFamily: 'Amiri_700Bold' }]}>
              {name.arabic}
            </Text>
          )}

          {/* Transliteration */}
          {name && (
            <View style={mStyles.translitRow}>
              <Text style={[mStyles.translit, { color: translitColor }]}>{name.transliteration}</Text>
              <TouchableOpacity
                style={mStyles.playBtn}
                onPress={() => name && speakName(name.arabic, isProphetName, name.number)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                activeOpacity={0.75}
              >
                <Ionicons name="volume-medium-outline" size={18} color={colors.navy[900]} />
              </TouchableOpacity>
            </View>
          )}

          {/* Meaning */}
          {name && <Text style={[mStyles.meaningText, { color: meaningColor }]}>{name.meaning}</Text>}

          <View style={[mStyles.divider, { backgroundColor: dividerColor }]} />

          {/* Explanation */}
          {name && (
            <View style={mStyles.section}>
              <Text style={[mStyles.sectionLabel, { color: sectionLabelColor }]}>ABOUT THIS NAME</Text>
              <Text style={[mStyles.sectionBody, { color: sectionBodyColor }]}>{name.explanation}</Text>
            </View>
          )}

          {/* Benefits / Blessings */}
          {name && (
            isAllahName && 'benefits' in name ? (
              <View style={[mStyles.section, mStyles.benefitsBox]}>
                <View style={mStyles.benefitsHeader}>
                  <Ionicons name="star" size={13} color={colors.gold[500]} />
                  <Text style={[mStyles.sectionLabel, { color: colors.gold[700] }]}>BENEFIT</Text>
                </View>
                <Text style={mStyles.benefitsText}>{name.benefits}</Text>
              </View>
            ) : (
              <View style={[mStyles.section, mStyles.blessingBox]}>
                <View style={mStyles.benefitsHeader}>
                  <Ionicons name="heart" size={13} color={colors.red[500]} />
                  <Text style={[mStyles.sectionLabel, { color: colors.navy[700] }]}>DURUUD & BLESSINGS</Text>
                </View>
                <Text style={mStyles.blessingText}>
                  "Indeed, Allah and His angels send blessings upon the Prophet. O you who have believed, ask [Allah to send] blessings upon him and ask for him peace." (Quran 33:56)
                </Text>
              </View>
            )
          )}

          {/* Share button */}
          <TouchableOpacity style={mStyles.shareBtn} onPress={handleShare} activeOpacity={0.8}>
            <Ionicons name="share-social-outline" size={18} color={colors.navy[900]} />
            <Text style={mStyles.shareBtnText}>Share this Name</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
}

export function NamesOfAllahScreen() {
  const navigation = useNavigation();
  useEffect(() => {
    return () => {
      stopNameAudio();
    };
  }, []);
  const isDark = useThemeStore(s => s.isDark);
  const [activeTab, setActiveTab] = useState<'allah' | 'muhammad'>('allah');
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<FilterCategory>('all');
  const [selectedName, setSelectedName] = useState<NameOfAllah | NameOfMuhammad | null>(null);

  const filteredAllah = NAMES_OF_ALLAH.filter(n => {
    const matchesCategory = activeCategory === 'all' || n.category === activeCategory;
    if (!matchesCategory) return false;
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    return (
      n.transliteration.toLowerCase().includes(q) ||
      n.meaning.toLowerCase().includes(q) ||
      n.arabic.includes(query)
    );
  });

  const filteredMuhammad = NAMES_OF_MUHAMMAD.filter(n => {
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    return (
      n.transliteration.toLowerCase().includes(q) ||
      n.meaning.toLowerCase().includes(q) ||
      n.arabic.includes(query)
    );
  });

  const currentList = activeTab === 'allah' ? filteredAllah : filteredMuhammad;

  const cardBg = isDark ? darkColors.surface : colors.white;
  const listBg = isDark ? darkColors.background : colors.parchment[50];
  const textPrimary = isDark ? darkColors.text.primary : colors.navy[900];
  const textSecondary = isDark ? darkColors.text.secondary : colors.parchment[600];
  const borderColor = isDark ? darkColors.border : colors.parchment[200];

  return (
    <ScreenContainer noPadding>
      <FlatList
        data={currentList}
        keyExtractor={item => `${activeTab}_${item.number}`}
        style={{ backgroundColor: listBg }}
        contentContainerStyle={styles.list}
        initialNumToRender={10}
        maxToRenderPerBatch={10}
        windowSize={5}
        ListHeaderComponent={
          <View>
            <LinearGradient colors={activeTab === 'allah' ? gradients.heroNavy : ['#1E1B4B', '#312E81']} style={styles.header}>
              <IslamicPattern accentColor={colors.gold[400]} size={260} style={styles.headerPattern} />
              <View style={styles.headerDecor} />
              <View style={styles.headerRow}>
                <BackButton />
                <View style={styles.headerCenter}>
                  <Text style={[styles.headerArabic, { fontFamily: 'Amiri_700Bold' }]}>
                    {activeTab === 'allah' ? 'أسماء الله الحسنى' : 'أسماء محمد صلى الله عليه وسلم'}
                  </Text>
                </View>
              </View>
              <Text style={styles.headerSub}>
                {activeTab === 'allah' ? 'The 99 Beautiful Names of Allah' : 'The Noble Names of Prophet Muhammad (pbuh)'}
              </Text>

              {/* Segmented Tab Control */}
              <View style={styles.segmentedControl}>
                <TouchableOpacity
                  style={[styles.segmentButton, activeTab === 'allah' && styles.segmentButtonActive]}
                  onPress={() => { setActiveTab('allah'); setQuery(''); }}
                >
                  <Text style={[styles.segmentText, activeTab === 'allah' && styles.segmentTextActive]}>
                    Allah's Names
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.segmentButton, activeTab === 'muhammad' && styles.segmentButtonActive]}
                  onPress={() => { setActiveTab('muhammad'); setQuery(''); }}
                >
                  <Text style={[styles.segmentText, activeTab === 'muhammad' && styles.segmentTextActive]}>
                    Muhammad's Names
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={styles.searchBar}>
                <Ionicons name="search" size={16} color="rgba(255,255,255,0.5)" />
                <TextInput
                  style={styles.searchInput}
                  value={query}
                  onChangeText={setQuery}
                  placeholder={activeTab === 'allah' ? "Search by name or meaning..." : "Search Prophet's names..."}
                  placeholderTextColor="rgba(255,255,255,0.35)"
                />
                {query.length > 0 && (
                  <TouchableOpacity onPress={() => setQuery('')}>
                    <Ionicons name="close-circle" size={16} color="rgba(255,255,255,0.4)" />
                  </TouchableOpacity>
                )}
              </View>
            </LinearGradient>

            {/* Category filter chips - only for Allah's names */}
            {activeTab === 'allah' && (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.chipRow}
                style={styles.chipScroll}
              >
                {CATEGORY_CHIPS.map(chip => (
                  <TouchableOpacity
                    key={chip.key}
                    style={[
                      styles.chip,
                      { borderColor },
                      activeCategory === chip.key && styles.chipActive,
                    ]}
                    onPress={() => setActiveCategory(chip.key)}
                    activeOpacity={0.75}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        { color: isDark ? darkColors.text.secondary : colors.parchment[700] },
                        activeCategory === chip.key && styles.chipTextActive,
                      ]}
                    >
                      {chip.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}

            {currentList.length > 0 && (
              <Text
                style={[
                  styles.countText,
                  { color: isDark ? darkColors.text.muted : colors.parchment[500] },
                ]}
              >
                {currentList.length} name{currentList.length !== 1 ? 's' : ''} found
              </Text>
            )}
          </View>
        }
        renderItem={({ item }) => {
          const accentColor = activeTab === 'allah'
            ? categoryColor((item as NameOfAllah).category ?? 'kamal')
            : colors.indigo[500];
          return (
            <TouchableOpacity
              style={[styles.card, { backgroundColor: cardBg }]}
              onPress={() => setSelectedName(item)}
              activeOpacity={0.85}
            >
              {/* Category color bar */}
              <View style={[styles.cardAccentBar, { backgroundColor: accentColor }]} />
              <View style={styles.cardTop}>
                {/* Number badge */}
                <View style={[styles.numBadge, { backgroundColor: accentColor + '20', borderColor: accentColor + '50', borderWidth: 1 }]}>
                  <Text style={[styles.numText, { color: accentColor }]}>{item.number}</Text>
                </View>

                {/* Arabic + transliteration + meaning */}
                <View style={styles.cardMid}>
                  <Text style={[styles.arabic, { fontFamily: 'Amiri_700Bold', color: textPrimary }]}>
                    {item.arabic}
                  </Text>
                  <Text style={[styles.translit, { color: textPrimary }]}>{item.transliteration}</Text>
                  <Text style={[styles.meaning, { color: accentColor }]}>{item.meaning}</Text>
                </View>

                {/* Play + expand */}
                <View style={styles.cardActions}>
                  <TouchableOpacity
                    style={[styles.playBtn, { backgroundColor: accentColor + '18' }]}
                    onPress={(e) => { e.stopPropagation?.(); speakName(item.arabic, activeTab === 'muhammad', item.number); }}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="volume-medium-outline" size={17} color={accentColor} />
                  </TouchableOpacity>
                  <Ionicons name="chevron-forward" size={15} color={isDark ? darkColors.text.muted : colors.parchment[400]} />
                </View>
              </View>
            </TouchableOpacity>
          );
        }}
      />

      <NameDetailModal
        name={selectedName}
        isProphetName={activeTab === 'muhammad'}
        onClose={() => setSelectedName(null)}
        isDark={isDark}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  list: { paddingBottom: spacing.xxxl },
  header: {
    paddingTop: 52,
    paddingBottom: spacing.xl,
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
    overflow: 'hidden',
  },
  headerDecor: {
    position: 'absolute', right: -50, top: -50,
    width: 200, height: 200, borderRadius: 100,
    borderWidth: 1, borderColor: 'rgba(212,169,62,0.1)',
  },
  headerPattern: {
    right: -80, bottom: -90,
  },
  headerRow: {
    flexDirection: 'row', alignItems: 'center', width: '100%',
    marginBottom: spacing.xs,
  },
  backBtn: { padding: 4, position: 'absolute', left: 0, zIndex: 10 },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerArabic: { fontSize: 26, color: colors.gold[300], textAlign: 'center' },
  headerSub: { ...typography.bodySmall, color: 'rgba(255,255,255,0.45)', textAlign: 'center', marginBottom: spacing.xs },
  
  segmentedControl: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: radius.pill,
    padding: 3,
    marginHorizontal: spacing.sm,
  },
  segmentButton: {
    flex: 1,
    paddingVertical: spacing.sm - 2,
    alignItems: 'center',
    borderRadius: radius.pill,
  },
  segmentButtonActive: {
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  segmentText: {
    ...typography.bodyMedium,
    color: 'rgba(255,255,255,0.6)',
    fontWeight: '600',
  },
  segmentTextActive: {
    color: colors.white,
    fontWeight: '700',
  },

  searchBar: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: radius.md, paddingHorizontal: spacing.md, paddingVertical: spacing.md,
    marginTop: spacing.xs,
  },
  searchInput: { flex: 1, ...typography.body, color: colors.white },
  chipScroll: { marginTop: spacing.sm },
  chipRow: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: radius.pill,
    backgroundColor: 'transparent',
    borderWidth: 1,
  },
  chipActive: {
    backgroundColor: colors.navy[900],
    borderColor: colors.gold[500],
  },
  chipText: { ...typography.caption, fontWeight: '600' },
  chipTextActive: { color: colors.gold[400] },
  countText: {
    ...typography.caption,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xs,
    paddingBottom: spacing.xs,
  },
  card: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    borderRadius: radius.md,
    overflow: 'hidden',
    ...shadow.sm,
  },
  cardAccentBar: { height: 3 },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.md },
  numBadge: {
    width: 38, height: 38, borderRadius: radius.sm,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  numText: { ...typography.caption, fontWeight: '800' },
  cardMid: { flex: 1, gap: 3 },
  cardActions: { flexDirection: 'column', alignItems: 'center', gap: 6 },
  playBtn: {
    width: 34, height: 34, borderRadius: radius.pill,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  arabic: { fontSize: 24, textAlign: 'right', lineHeight: 36 },
  translit: { ...typography.bodyMedium, fontWeight: '600' },
  meaning: { ...typography.caption, fontWeight: '700' },
});

const mStyles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(6,12,31,0.72)',
  },
  sheet: {
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xxxl,
    paddingTop: spacing.lg,
    alignItems: 'center',
    gap: spacing.sm,
    maxHeight: SCREEN_HEIGHT * 0.82,
  },
  handle: {
    width: 40, height: 4, borderRadius: 2,
    marginBottom: spacing.sm,
  },
  numBadge: {
    position: 'absolute',
    top: spacing.lg,
    right: spacing.xl,
    width: 44, height: 44, borderRadius: radius.pill,
    backgroundColor: colors.navy[900],
    alignItems: 'center', justifyContent: 'center',
  },
  numBadgeText: {
    fontSize: 18, color: colors.gold[400],
  },
  catPill: {
    borderRadius: radius.pill,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    marginBottom: spacing.xs,
  },
  catPillText: { fontSize: 11, fontWeight: '700', letterSpacing: 0.5 },
  arabicLarge: {
    fontSize: 52,
    color: colors.gold[500],
    textAlign: 'center',
    lineHeight: 78,
  },
  translitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  translit: {
    ...typography.heading,
    fontWeight: '700',
    textAlign: 'center',
  },
  playBtn: {
    width: 34, height: 34, borderRadius: radius.pill,
    backgroundColor: colors.gold[100],
    alignItems: 'center', justifyContent: 'center',
  },
  meaningText: {
    ...typography.body,
    textAlign: 'center',
  },
  divider: {
    width: '100%', height: 1,
    marginVertical: spacing.sm,
  },
  section: {
    width: '100%', gap: spacing.xs,
  },
  sectionLabel: {
    ...typography.caption,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  sectionBody: {
    ...typography.body,
    lineHeight: 24,
  },
  benefitsBox: {
    backgroundColor: colors.gold[50],
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.gold[200],
  },
  benefitsHeader: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.xs,
  },
  benefitsText: {
    ...typography.body,
    color: colors.gold[700],
    lineHeight: 24,
    fontWeight: '600',
  },
  blessingBox: {
    backgroundColor: colors.indigo[50],
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.indigo[200],
  },
  blessingText: {
    ...typography.body,
    color: colors.indigo[900],
    lineHeight: 24,
    fontStyle: 'italic',
  },
  shareBtn: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    backgroundColor: colors.gold[400],
    borderRadius: radius.pill,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    marginTop: spacing.md,
    alignSelf: 'stretch',
    justifyContent: 'center',
  },
  shareBtnText: {
    ...typography.bodyMedium,
    color: colors.navy[900],
    fontWeight: '700',
  },
});
