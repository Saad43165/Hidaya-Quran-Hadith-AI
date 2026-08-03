import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  Animated, FlatList, Image, PanResponder, StatusBar, StyleSheet, Text,
  TouchableOpacity, View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { FadeInRow } from '../../components/common/FadeInRow';
import { BackButton } from '../../components/common/BackButton';
import { listBookmarks, removeBookmark } from '../../services/db/bookmarksRepo';
import { Bookmark } from '../../types/models';
import { Haptics } from '../../services/haptics';
import { colors, radius, shadow, spacing, typography } from '../../theme';
import { darkColors } from '../../theme/darkColors';
import { useThemeStore } from '../../store/useThemeStore';
import type { RootStackParamList } from '../../navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type FilterTab = 'all' | 'quran' | 'hadith';
type SortMode = 'recent' | 'surah' | 'collection';

function SwipeableRow({ bookmark, onOpen, onRemove, cardBg, textPrimary, textSecondary, textMuted }: {
  bookmark: Bookmark; onOpen: () => void; onRemove: () => void;
  cardBg: string; textPrimary: string; textSecondary: string; textMuted: string;
}) {
  const translateX = useRef(new Animated.Value(0)).current;
  const DELETE_WIDTH = 72;

  const panResponder = useRef(PanResponder.create({
    onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 8 && Math.abs(g.dy) < 20,
    onPanResponderMove: (_, g) => {
      const clamp = Math.max(-DELETE_WIDTH, Math.min(0, g.dx));
      translateX.setValue(clamp);
    },
    onPanResponderRelease: (_, g) => {
      if (g.dx < -DELETE_WIDTH * 0.5) {
        Animated.spring(translateX, { toValue: -DELETE_WIDTH, useNativeDriver: true, tension: 300, friction: 20 }).start();
      } else {
        Animated.spring(translateX, { toValue: 0, useNativeDriver: true, tension: 300, friction: 20 }).start();
      }
    },
  })).current;

  const isQuran = bookmark.type === 'ayah';
  const accent = isQuran ? colors.gold[400] : '#38BDF8';

  return (
    <View style={styles.swipeContainer}>
      {/* Delete button revealed on swipe */}
      <View style={styles.deleteReveal}>
        <TouchableOpacity style={styles.deleteBtn} onPress={onRemove} activeOpacity={0.7}>
          <Ionicons name="trash-outline" size={20} color={colors.white} />
        </TouchableOpacity>
      </View>

      {/* Swipeable card */}
      <Animated.View style={[styles.card, { backgroundColor: cardBg, transform: [{ translateX }] }]} {...panResponder.panHandlers}>
        <View style={[styles.cardAccent, { backgroundColor: accent }]} />
        <TouchableOpacity style={styles.cardInner} onPress={onOpen} activeOpacity={0.8}>
          <View style={[styles.typeIcon, { backgroundColor: accent + '20' }]}>
            <Ionicons name={isQuran ? 'book-outline' : 'chatbox-outline'} size={18} color={accent} />
          </View>
          <View style={styles.cardBody}>
            <View style={styles.cardTitleRow}>
              <Text style={[styles.cardTitle, { color: textPrimary }]} numberOfLines={1}>
                {isQuran
                  ? `${bookmark.surahName ?? 'Surah'} · Ayah ${bookmark.ayahNumber}`
                  : `${bookmark.collectionName} · No. ${bookmark.hadithNumber}`}
              </Text>
              <View style={[styles.typeBadge, { backgroundColor: accent + '18' }]}>
                <Text style={[styles.typeBadgeText, { color: accent }]}>{isQuran ? 'Quran' : 'Hadith'}</Text>
              </View>
            </View>
            {bookmark.snippet ? (
              <Text style={[styles.snippet, { color: textSecondary }]} numberOfLines={2}>{bookmark.snippet}</Text>
            ) : null}
            <Text style={[styles.dateText, { color: textMuted }]}>
              {new Date(bookmark.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={14} color={colors.parchment[300]} />
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

export function BookmarksScreen() {
  const navigation = useNavigation<Nav>();
  const isDark = useThemeStore(s => s.isDark);
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [filter, setFilter] = useState<FilterTab>('all');
  const [sort, setSort] = useState<SortMode>('recent');

  const bg = isDark ? darkColors.background : colors.parchment[50];
  const cardBg = isDark ? darkColors.surface : colors.white;
  const filterBg = isDark ? darkColors.surface : colors.white;
  const filterBorder = isDark ? darkColors.border : colors.parchment[100];
  const textPrimary = isDark ? darkColors.text.primary : colors.parchment[950];
  const textSecondary = isDark ? darkColors.text.secondary : colors.parchment[500];
  const textMuted = isDark ? darkColors.text.muted : colors.parchment[300];

  const load = useCallback(async () => {
    setBookmarks(await listBookmarks());
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const filtered = useMemo(() => {
    let list = bookmarks;
    if (filter === 'quran') list = list.filter(b => b.type === 'ayah');
    if (filter === 'hadith') list = list.filter(b => b.type === 'hadith');
    switch (sort) {
      case 'recent': return [...list].sort((a, b) => b.createdAt - a.createdAt);
      case 'surah':  return [...list].sort((a, b) => (a.surahNumber ?? 999) - (b.surahNumber ?? 999));
      case 'collection': return [...list].sort((a, b) => (a.collectionId ?? '').localeCompare(b.collectionId ?? ''));
    }
  }, [bookmarks, filter, sort]);

  const handleOpen = (bookmark: Bookmark) => {
    if (bookmark.type === 'ayah' && bookmark.surahNumber) {
      navigation.navigate('SurahDetail', {
        surahNumber: bookmark.surahNumber,
        englishName: bookmark.surahName ?? '',
        initialAyahNumber: bookmark.ayahNumber,
      });
    } else if (bookmark.type === 'hadith' && bookmark.collectionId) {
      navigation.navigate('HadithCollectionDetail', {
        collectionId: bookmark.collectionId,
        name: bookmark.collectionName ?? '',
        initialHadithNumber: bookmark.hadithNumber,
      });
    }
  };

  const handleRemove = async (id: string) => {
    Haptics.impact('light');
    await removeBookmark(id);
    setBookmarks(prev => prev.filter(b => b.id !== id));
  };

  const SORT_OPTIONS: { key: SortMode; label: string }[] = [
    { key: 'recent', label: 'Recent' },
    { key: 'surah', label: 'Surah' },
    { key: 'collection', label: 'Collection' },
  ];

  return (
    <ScreenContainer noPadding>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <LinearGradient colors={['#060C1F', '#0B1330', '#162354']} style={styles.header}>
        <Image source={require('../../../assets/images/mushaf.png')} style={styles.headerBgImage} resizeMode="contain" />
        <View style={styles.headerScrim} />
        <View style={styles.headerDecor} />
        <BackButton />
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Bookmarks</Text>
          <Text style={styles.headerSub}>{bookmarks.length} saved</Text>
        </View>
      </LinearGradient>

      {/* Filter tabs */}
      <View style={[styles.filterRow, { backgroundColor: filterBg, borderBottomColor: filterBorder }]}>
        {(['all', 'quran', 'hadith'] as FilterTab[]).map(f => (
          <TouchableOpacity
            key={f}
            style={[styles.filterTab, { backgroundColor: isDark ? darkColors.surfaceElevated : colors.parchment[100] }, filter === f && styles.filterTabActive]}
            onPress={() => setFilter(f)}
            activeOpacity={0.8}
          >
            <Text style={[styles.filterTabText, { color: textSecondary }, filter === f && styles.filterTabTextActive]}>
              {f === 'all' ? 'All' : f === 'quran' ? 'Quran' : 'Hadith'}
            </Text>
          </TouchableOpacity>
        ))}
        <View style={styles.filterSpacer} />
        {/* Sort button */}
        <View style={styles.sortRow}>
          {SORT_OPTIONS.map(opt => (
            <TouchableOpacity
              key={opt.key}
              style={[styles.sortBtn, sort === opt.key && styles.sortBtnActive]}
              onPress={() => setSort(opt.key)}
              activeOpacity={0.8}
            >
              <Text style={[styles.sortBtnText, { color: textMuted }, sort === opt.key && styles.sortBtnTextActive]}>{opt.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={item => item.id}
        style={{ backgroundColor: bg }}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="bookmark-outline" size={48} color={colors.parchment[300]} />
            <Text style={[styles.emptyTitle, { color: textPrimary }]}>No bookmarks yet</Text>
            <Text style={[styles.emptyDesc, { color: textMuted }]}>Tap the bookmark icon on any ayah or hadith to save it here.</Text>
          </View>
        }
        renderItem={({ item, index }) => (
          <FadeInRow index={index} delay={40}>
            <SwipeableRow
              bookmark={item}
              onOpen={() => handleOpen(item)}
              onRemove={() => handleRemove(item.id)}
              cardBg={cardBg}
              textPrimary={textPrimary}
              textSecondary={textSecondary}
              textMuted={textMuted}
            />
          </FadeInRow>
        )}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingTop: 52, paddingBottom: spacing.xl, paddingHorizontal: spacing.lg, overflow: 'hidden' },
  headerBgImage: { position: 'absolute', right: 0, bottom: 0, width: '70%', height: '130%', opacity: 0.14 },
  headerScrim: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(6,12,31,0.3)' },
  headerDecor: { position: 'absolute', right: -40, top: -40, width: 140, height: 140, borderRadius: 70, borderWidth: 1, borderColor: 'rgba(245,158,11,0.12)' },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { ...typography.heading, color: colors.white },
  headerSub: { ...typography.caption, color: 'rgba(255,255,255,0.35)', marginTop: 2 },

  filterRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, paddingHorizontal: spacing.lg, paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.parchment[100], backgroundColor: colors.white, flexWrap: 'wrap' },
  filterTab: { paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: radius.pill, backgroundColor: colors.parchment[100] },
  filterTabActive: { backgroundColor: colors.navy[800] },
  filterTabText: { fontSize: 12, fontWeight: '700', color: colors.parchment[500] },
  filterTabTextActive: { color: colors.white },
  filterSpacer: { flex: 1 },
  sortRow: { flexDirection: 'row', gap: 4 },
  sortBtn: { paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, borderRadius: radius.pill },
  sortBtnActive: { backgroundColor: colors.gold[50] },
  sortBtnText: { fontSize: 11, color: colors.parchment[400], fontWeight: '600' },
  sortBtnTextActive: { color: colors.gold[700], fontWeight: '700' },

  list: { padding: spacing.lg, gap: spacing.sm, paddingBottom: spacing.xxxl },

  swipeContainer: { position: 'relative', marginBottom: spacing.sm },
  deleteReveal: { position: 'absolute', right: 0, top: 0, bottom: 0, width: 72, alignItems: 'center', justifyContent: 'center', borderRadius: radius.md, backgroundColor: colors.semantic.error },
  deleteBtn: { alignItems: 'center', justifyContent: 'center', width: 72, height: '100%' as any },

  card: { backgroundColor: colors.white, borderRadius: radius.md, overflow: 'hidden', ...shadow.sm },
  cardAccent: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 3 },
  cardInner: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.lg },
  typeIcon: { width: 40, height: 40, borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center' },
  cardBody: { flex: 1, gap: 4 },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  cardTitle: { ...typography.bodySmall, color: colors.parchment[950], fontWeight: '700', flex: 1 },
  typeBadge: { borderRadius: radius.pill, paddingHorizontal: spacing.xs, paddingVertical: 2 },
  typeBadgeText: { fontSize: 10, fontWeight: '700' },
  snippet: { ...typography.caption, color: colors.parchment[500], lineHeight: 17 },
  dateText: { fontSize: 10, color: colors.parchment[300], fontWeight: '600' },

  empty: { alignItems: 'center', paddingTop: spacing.xxxl * 1.5, gap: spacing.md, paddingHorizontal: spacing.xl },
  emptyTitle: { ...typography.heading, color: colors.parchment[600] },
  emptyDesc: { ...typography.bodySmall, color: colors.parchment[400], textAlign: 'center', lineHeight: 21 },
});
