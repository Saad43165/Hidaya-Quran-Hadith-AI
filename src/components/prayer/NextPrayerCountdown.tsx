import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { PrayerName, PrayerTimes, PRAYER_NAMES } from '../../types/models';
import { colors, spacing, typography } from '../../theme';

function parseMinutes(t: string) {
  const m = t.match(/^(\d{1,2}):(\d{2})/);
  return m ? parseInt(m[1]) * 60 + parseInt(m[2]) : -1;
}

function fmt(total: number) {
  const h = Math.floor(total / 60), m = total % 60;
  return h > 0 ? `${h}h ${m}m` : `${m} min`;
}

export function NextPrayerCountdown({ prayerTimes }: { prayerTimes: PrayerTimes }) {
  const { t } = useTranslation();
  const [now, setNow] = useState(new Date());
  useEffect(() => { const id = setInterval(() => setNow(new Date()), 60000); return () => clearInterval(id); }, []);

  const nowMins = now.getHours() * 60 + now.getMinutes();
  let next: PrayerName = 'Fajr', mins = 0;
  for (const p of PRAYER_NAMES) {
    const pm = parseMinutes(prayerTimes[p]);
    if (pm > nowMins) { next = p; mins = pm - nowMins; break; }
  }
  if (!mins) { mins = 1440 - nowMins + parseMinutes(prayerTimes.Fajr); }

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{t('prayer.nextPrayer')}</Text>
      <Text style={styles.prayerName}>{next}</Text>
      <View style={styles.countdownPill}>
        <Text style={styles.countdown}>{fmt(mins)}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', paddingVertical: spacing.xl, gap: spacing.sm },
  label: { ...typography.label, color: colors.gold[400] },
  prayerName: { ...typography.displayXl, color: colors.white },
  countdownPill: {
    backgroundColor: 'rgba(212,169,62,0.18)',
    borderRadius: 99,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm,
  },
  countdown: { ...typography.heading, color: colors.gold[300] },
});
