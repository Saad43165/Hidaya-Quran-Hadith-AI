import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { navigate } from '../../navigation/navigationRef';
import { useAudioStore } from '../../store/useAudioStore';
import { useThemeStore } from '../../store/useThemeStore';
import { colors, radius, shadow, spacing, typography } from '../../theme';
import { darkColors } from '../../theme/darkColors';

export function MiniPlayer() {
  const { currentSurah, currentAyahIndex, isPlaying, resume, pause, playNext, playPrev, stop } = useAudioStore();
  const { isDark } = useThemeStore();

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
        <TouchableOpacity onPress={playPrev} style={styles.controlBtn}>
          <Ionicons name="play-back" size={18} color={isDark ? darkColors.text.secondary : colors.parchment[600]} />
        </TouchableOpacity>

        <TouchableOpacity 
          onPress={isPlaying ? pause : resume} 
          style={[
            styles.playBtn, 
            { backgroundColor: isPlaying ? 'rgba(214,40,40,0.1)' : 'rgba(212,169,62,0.1)' }
          ]}
        >
          <Ionicons 
            name={isPlaying ? 'pause' : 'play'} 
            size={18} 
            color={isPlaying ? '#D62828' : colors.gold[600]} 
          />
        </TouchableOpacity>

        <TouchableOpacity onPress={playNext} style={styles.controlBtn}>
          <Ionicons name="play-forward" size={18} color={isDark ? darkColors.text.secondary : colors.parchment[600]} />
        </TouchableOpacity>

        <TouchableOpacity onPress={stop} style={[styles.controlBtn, styles.closeBtn]}>
          <Ionicons name="close" size={18} color="rgba(214,40,40,0.6)" />
        </TouchableOpacity>
      </View>
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
});
