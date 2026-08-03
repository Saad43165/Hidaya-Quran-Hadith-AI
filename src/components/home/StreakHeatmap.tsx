import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useStreakStore } from '../../store/useStreakStore';
import { useThemeStore } from '../../store/useThemeStore';
import { colors, spacing, typography } from '../../theme';
import { darkColors } from '../../theme/darkColors';

const TOTAL_DAYS = 70; // 10 weeks
const DAYS_PER_COL = 7;
const CELL_SIZE = 10;
const CELL_MARGIN = 2;
const DAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

function getDateStr(daysAgo: number): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().slice(0, 10);
}

export function StreakHeatmap() {
  const isDark = useThemeStore(s => s.isDark);
  const { readDays, currentStreak, totalDaysRead } = useStreakStore();

  const textSecondary = isDark ? darkColors.text.secondary : colors.parchment[500];
  const activeColor = colors.gold[400];
  const inactiveColor = isDark ? 'rgba(255,255,255,0.08)' : colors.parchment[200];

  // Build last TOTAL_DAYS dates, oldest first
  const dates = useMemo(() => {
    const result: string[] = [];
    for (let i = TOTAL_DAYS - 1; i >= 0; i--) {
      result.push(getDateStr(i));
    }
    return result;
  }, []);

  // Split into columns of 7 (each column = one week)
  const weeks = useMemo(() => {
    const cols: string[][] = [];
    for (let i = 0; i < dates.length; i += DAYS_PER_COL) {
      cols.push(dates.slice(i, i + DAYS_PER_COL));
    }
    return cols;
  }, [dates]);

  return (
    <View style={styles.container}>
      {/* Day labels row */}
      <View style={styles.labelRow}>
        {DAY_LABELS.map((label, i) => (
          <Text key={i} style={[styles.dayLabel, { color: textSecondary }]}>{label}</Text>
        ))}
      </View>

      {/* Grid: rows = days of week, columns = weeks */}
      <View style={styles.grid}>
        {Array.from({ length: DAYS_PER_COL }, (_, dayIndex) => (
          <View key={dayIndex} style={styles.gridRow}>
            {weeks.map((week, weekIndex) => {
              const dateStr = week[dayIndex];
              const active = dateStr !== undefined && readDays.has(dateStr);
              return (
                <View
                  key={weekIndex}
                  style={[
                    styles.cell,
                    { backgroundColor: active ? activeColor : inactiveColor },
                  ]}
                />
              );
            })}
          </View>
        ))}
      </View>

      {/* Stats row */}
      <View style={styles.statsRow}>
        <Text style={[styles.statsText, { color: textSecondary }]}>
          <Text style={[styles.statsNumber, { color: activeColor }]}>{currentStreak}</Text>
          {' day streak'}
          {'  ·  '}
          <Text style={[styles.statsNumber, { color: activeColor }]}>{totalDaysRead}</Text>
          {' total days'}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingVertical: spacing.sm },
  labelRow: {
    flexDirection: 'column',
    position: 'absolute',
    left: 0,
    top: 0,
    gap: CELL_MARGIN,
  },
  dayLabel: {
    fontSize: 9,
    fontWeight: '600',
    width: CELL_SIZE + CELL_MARGIN,
    height: CELL_SIZE + CELL_MARGIN,
    lineHeight: CELL_SIZE + CELL_MARGIN,
    textAlign: 'center',
  },
  grid: {
    marginLeft: CELL_SIZE + CELL_MARGIN + spacing.xs,
    gap: CELL_MARGIN,
  },
  gridRow: {
    flexDirection: 'row',
    gap: CELL_MARGIN,
    marginBottom: CELL_MARGIN,
  },
  cell: {
    width: CELL_SIZE,
    height: CELL_SIZE,
    borderRadius: 2,
  },
  statsRow: {
    marginTop: spacing.sm,
    marginLeft: CELL_SIZE + CELL_MARGIN + spacing.xs,
  },
  statsText: {
    ...typography.caption,
  },
  statsNumber: {
    fontWeight: '700',
  },
});
