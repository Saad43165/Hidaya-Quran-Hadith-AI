import React, { useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { navigate } from '../../navigation/navigationRef';
import { useAudioStore } from '../../store/useAudioStore';
import { useThemeStore } from '../../store/useThemeStore';
import { Haptics } from '../../services/haptics';
import { colors, radius, shadow, spacing, typography } from '../../theme';
import { darkColors } from '../../theme/darkColors';

const SLEEP_TIMER_PRESETS = [5, 15, 30, 45, 60];

export function MiniPlayer() {
  const {
    currentSurah, currentAyahIndex, isPlaying, resume, pause, playNext, playPrev, stop,
    repeatMode, cycleRepeatMode, sleepTimerEndsAt, setSleepTimer,
  } = useAudioStore();
  const { isDark } = useThemeStore();
  const [sleepMenuVisible, setSleepMenuVisible] = useState(false);
  const [remainingLabel, setRemainingLabel] = useState<string | null>(null);

  useEffect(() => {
    if (!sleepTimerEndsAt) {
      setRemainingLabel(null);
      return;
    }

    const updateLabel = () => {
      const msLeft = sleepTimerEndsAt - Date.now();
      if (msLeft <= 0) {
        setRemainingLabel(null);
        return;
      }
      const minsLeft = Math.max(1, Math.round(msLeft / 60000));
      setRemainingLabel(`${minsLeft}m`);
    };

    updateLabel();
    const interval = setInterval(updateLabel, 30000);
    return () => clearInterval(interval);
  }, [sleepTimerEndsAt]);

  if (!currentSurah || currentAyahIndex === -1) return null;

  const currentAyah = currentSurah.ayahs[currentAyahIndex];
  if (!currentAyah) return null;

  const activeColors = isDark ? darkColors : {
    background: colors.white,
    text: colors.navy[900],
    border: colors.parchment[200],
  };

  const handlePlayerPress = () => {
    navigate('SurahDetail', {
      surahNumber: currentSurah.number,
      englishName: currentSurah.englishName,
    });
  };

  const handlePlayPause = () => {
    Haptics.impact('light');
    isPlaying ? pause() : resume();
  };

  const handlePrev = () => { Haptics.impact('light'); playPrev(); };
  const handleNext = () => { Haptics.impact('light'); playNext(); };
  const handleStop = () => { Haptics.impact('light'); stop(); };
  const handleRepeat = () => { Haptics.impact('light'); cycleRepeatMode(); };
  const handleOpenSleepMenu = () => { Haptics.impact('light'); setSleepMenuVisible(true); };
  const handleSelectSleepPreset = (minutes: number | null) => {
    Haptics.impact('light');
    setSleepTimer(minutes);
    setSleepMenuVisible(false);
  };

  return (
    <View style={[
      styles.container,
      {
        backgroundColor: isDark ? darkColors.surface : colors.white,
        borderColor: isDark ? darkColors.border : colors.parchment[200],
      }
    ]}>
      {/* Background Decor */}
      <View style={styles.decor} />

      <TouchableOpacity style={styles.content} onPress={handlePlayerPress} activeOpacity={0.8}>
        <View style={styles.logoIcon}>
          <Ionicons name="book" size={16} color={colors.gold[400]} />
        </View>
        <View style={styles.info}>
          <Text numberOfLines={1} style={[styles.title, { color: isDark ? darkColors.text.primary : colors.navy[900] }]}>
            {currentSurah.englishName}
          </Text>
          <Text numberOfLines={1} style={styles.subtitle}>
            Ayah {currentAyah.numberInSurah} of {currentSurah.numberOfAyahs}
          </Text>
        </View>
      </TouchableOpacity>

      <View style={styles.controls}>
        <TouchableOpacity onPress={handleRepeat} style={styles.controlBtn} activeOpacity={0.7}>
          <Ionicons
            name={repeatMode === 'verse' ? 'repeat' : 'repeat'}
            size={16}
            color={repeatMode === 'off' ? (isDark ? darkColors.text.secondary : colors.parchment[400]) : colors.gold[600]}
          />
          {repeatMode === 'verse' && (
            <Text style={styles.repeatBadge}>1</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={handlePrev} style={styles.controlBtn} activeOpacity={0.7}>
          <Ionicons name="play-back" size={18} color={isDark ? darkColors.text.secondary : colors.parchment[600]} />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handlePlayPause}
          style={[
            styles.playBtn,
            { backgroundColor: isPlaying ? 'rgba(214,40,40,0.1)' : 'rgba(212,169,62,0.1)' }
          ]}
          activeOpacity={0.7}
        >
          <Ionicons
            name={isPlaying ? 'pause' : 'play'}
            size={18}
            color={isPlaying ? '#D62828' : colors.gold[600]}
          />
        </TouchableOpacity>

        <TouchableOpacity onPress={handleNext} style={styles.controlBtn} activeOpacity={0.7}>
          <Ionicons name="play-forward" size={18} color={isDark ? darkColors.text.secondary : colors.parchment[600]} />
        </TouchableOpacity>

        <TouchableOpacity onPress={handleOpenSleepMenu} style={styles.controlBtn} activeOpacity={0.7}>
          <Ionicons
            name={remainingLabel ? 'moon' : 'moon-outline'}
            size={16}
            color={remainingLabel ? colors.gold[600] : (isDark ? darkColors.text.secondary : colors.parchment[400])}
          />
          {remainingLabel && (
            <Text style={styles.sleepBadge}>{remainingLabel}</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={handleStop} style={[styles.controlBtn, styles.closeBtn]} activeOpacity={0.7}>
          <Ionicons name="close" size={18} color="rgba(214,40,40,0.6)" />
        </TouchableOpacity>
      </View>

      <Modal
        visible={sleepMenuVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setSleepMenuVisible(false)}
      >
        <Pressable style={styles.sheetOverlay} onPress={() => setSleepMenuVisible(false)}>
          <Pressable
            style={[
              styles.sheetContent,
              { backgroundColor: isDark ? darkColors.surface : colors.white, borderColor: isDark ? darkColors.border : colors.parchment[200] },
            ]}
            onPress={() => {}}
          >
            <Text style={[styles.sheetTitle, { color: isDark ? darkColors.text.primary : colors.navy[900] }]}>
              Sleep Timer
            </Text>
            {SLEEP_TIMER_PRESETS.map((minutes) => (
              <TouchableOpacity
                key={minutes}
                style={styles.sheetOption}
                onPress={() => handleSelectSleepPreset(minutes)}
                activeOpacity={0.7}
              >
                <Text style={[styles.sheetOptionText, { color: isDark ? darkColors.text.primary : colors.navy[900] }]}>
                  {minutes} min
                </Text>
                {sleepTimerEndsAt !== null && useAudioStore.getState().sleepTimerMinutes === minutes && (
                  <Ionicons name="checkmark" size={18} color={colors.gold[600]} />
                )}
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={styles.sheetOption}
              onPress={() => handleSelectSleepPreset(null)}
              activeOpacity={0.7}
            >
              <Text style={[styles.sheetOptionText, { color: '#D62828' }]}>Off</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 80, // Hangs beautifully above main tabs
    left: spacing.md,
    right: spacing.md,
    height: 64,
    borderRadius: radius.lg,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    overflow: 'hidden',
    ...shadow.md,
  },
  decor: {
    position: 'absolute',
    right: -20,
    top: -20,
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 1,
    borderColor: 'rgba(212,169,62,0.05)',
  },
  content: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  logoIcon: {
    width: 32,
    height: 32,
    borderRadius: radius.md,
    backgroundColor: 'rgba(212,169,62,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(212,169,62,0.15)',
  },
  info: {
    flex: 1,
  },
  title: {
    ...typography.bodySmall,
    fontWeight: '700',
  },
  subtitle: {
    ...typography.caption,
    color: colors.parchment[500],
    marginTop: 1,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  controlBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.pill,
  },
  repeatBadge: {
    position: 'absolute',
    top: 2,
    right: 2,
    fontSize: 8,
    fontWeight: '800',
    color: colors.gold[600],
  },
  playBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.pill,
  },
  closeBtn: {
    marginLeft: spacing.xs,
  },
  sleepBadge: {
    position: 'absolute',
    bottom: -2,
    fontSize: 8,
    fontWeight: '800',
    color: colors.gold[600],
  },
  sheetOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  sheetContent: {
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    borderWidth: 1,
    borderBottomWidth: 0,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  sheetTitle: {
    ...typography.bodySmall,
    fontWeight: '700',
    marginBottom: spacing.sm,
  },
  sheetOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
  },
  sheetOptionText: {
    ...typography.body,
  },
});
