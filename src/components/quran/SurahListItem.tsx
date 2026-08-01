import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Surah } from '../../types/models';
import { colors, radius, shadow, spacing, typography } from '../../theme';

interface Props {
  surah: Surah;
  onPress: () => void;
}

export function SurahListItem({ surah, onPress }: Props) {
  const { t } = useTranslation();
  const isMeccan = surah.revelationType === 'Meccan';

  return (
    <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={0.75}>
      {/* Number badge */}
      <View style={styles.badge}>
        <Text style={styles.badgeText}>{surah.number}</Text>
      </View>

      {/* Middle — English info */}
      <View style={styles.middle}>
        <Text style={styles.englishName}>{surah.englishName}</Text>
        <View style={styles.metaRow}>
          <Text style={styles.meta}>{surah.numberOfAyahs} {t('quran.ayahs')}</Text>
          <View style={[styles.typePill, isMeccan ? styles.meccanPill : styles.medinanPill]}>
            <Text style={[styles.typeText, isMeccan ? styles.meccanText : styles.medinanText]}>
              {isMeccan ? t('quran.meccan') : t('quran.medinan')}
            </Text>
          </View>
        </View>
      </View>

      {/* Arabic name */}
      <Text style={styles.arabicName}>{surah.name}</Text>
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
    ...shadow.sm,
  },
  badge: {
    width: 38,
    height: 38,
    borderRadius: radius.sm,
    backgroundColor: colors.navy[900],
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  badgeText: {
    ...typography.caption,
    color: colors.gold[400],
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
    gap: spacing.sm,
  },
  meta: {
    ...typography.caption,
    color: colors.parchment[600],
  },
  typePill: {
    borderRadius: radius.pill,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  meccanPill: { backgroundColor: colors.gold[100] },
  medinanPill: { backgroundColor: '#E8F0FC' },
  typeText: { fontSize: 10, fontWeight: '600' },
  meccanText: { color: colors.gold[700] },
  medinanText: { color: colors.navy[600] },
  arabicName: {
    fontSize: 20,
    color: colors.navy[800],
    fontWeight: '400',
  },
});
