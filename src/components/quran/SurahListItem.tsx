import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Surah } from '../../types/models';
import { colors, radius, shadow, spacing, typography } from '../../theme';

interface Props {
  surah: Surah;
  onPress: () => void;
}

// Generate distinctive colors for surah badges using HSL
function getSurahColor(num: number): string {
  const hue = (num * 137.5) % 360;
  return `hsl(${hue}, 45%, 28%)`;
}

export function SurahListItem({ surah, onPress }: Props) {
  const { t } = useTranslation();
  const isMeccan = surah.revelationType === 'Meccan';
  const badgeColor = getSurahColor(surah.number);

  return (
    <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={0.78}>
      {/* Number badge with unique color per surah */}
      <View style={[styles.badge, { backgroundColor: badgeColor }]}>
        <Text style={styles.badgeText}>{surah.number}</Text>
      </View>

      {/* Middle info */}
      <View style={styles.middle}>
        <Text style={styles.englishName}>{surah.englishName}</Text>
        <View style={styles.metaRow}>
          <Text style={styles.meta}>{surah.numberOfAyahs} {t('quran.ayahs')}</Text>
          <View style={styles.metaDot} />
          <View style={[styles.typePill, isMeccan ? styles.meccanPill : styles.medinanPill]}>
            <Text style={[styles.typeText, isMeccan ? styles.meccanText : styles.medinanText]}>
              {isMeccan ? t('quran.meccan') : t('quran.medinan')}
            </Text>
          </View>
        </View>
      </View>

      {/* Arabic name */}
      <View style={styles.arabicWrap}>
        <Text style={[styles.arabicName, { fontFamily: 'Amiri_400Regular' }]}>{surah.name}</Text>
      </View>

      <Ionicons name="chevron-forward" size={14} color={colors.parchment[300]} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    gap: spacing.md,
    ...shadow.xs,
  },
  badge: {
    width: 40,
    height: 40,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  badgeText: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '700',
  },
  middle: {
    flex: 1,
    gap: 4,
  },
  englishName: {
    ...typography.subheading,
    color: colors.parchment[950],
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  meta: {
    ...typography.caption,
    color: colors.parchment[500],
  },
  metaDot: {
    width: 3,
    height: 3,
    borderRadius: 2,
    backgroundColor: colors.parchment[300],
  },
  typePill: {
    borderRadius: radius.pill,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  meccanPill: { backgroundColor: colors.gold[100] },
  medinanPill: { backgroundColor: '#EBF3FC' },
  typeText: { fontSize: 10, fontWeight: '700' },
  meccanText: { color: colors.gold[700] },
  medinanText: { color: colors.navy[600] },
  arabicWrap: { alignItems: 'flex-end' },
  arabicName: {
    fontSize: 20,
    color: colors.navy[800],
    lineHeight: 30,
  },
});
