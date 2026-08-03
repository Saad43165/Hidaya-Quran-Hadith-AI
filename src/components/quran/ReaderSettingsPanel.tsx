import React from 'react';
import { Modal, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useQuranStore, TranslationLanguage, TRANSLATION_LABELS } from '../../store/useQuranStore';
import { useThemeColors } from '../../hooks/useThemeColors';
import { colors, radius, shadow, spacing, typography } from '../../theme';

interface Props {
  visible: boolean;
  onClose: () => void;
  hideTranslation?: boolean;
  hideReadingMode?: boolean;
}

const FONT_SIZES = [18, 20, 22, 24, 26, 28, 32];
const TRANSLATIONS: TranslationLanguage[] = ['en.sahih', 'ur.ahmedali', 'none'];

export function ReaderSettingsPanel({ visible, onClose, hideTranslation, hideReadingMode }: Props) {
  const { fontSize, setFontSize, translationLang, setTranslationLang, readingMode, setReadingMode } = useQuranStore();
  const theme = useThemeColors();

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable 
          style={[styles.panel, { backgroundColor: theme.bg }]} 
          onPress={() => {}}
        >
          {/* Handle */}
          <View style={[styles.handle, { backgroundColor: theme.isDark ? 'rgba(255,255,255,0.15)' : colors.parchment[300] }]} />

          <Text style={[styles.title, { color: theme.textPrimary }]}>Reader Settings</Text>

          {/* Reading Mode */}
          {!hideReadingMode && (
            <>
              <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>READING MODE</Text>
              <View style={[styles.transGroup, { backgroundColor: theme.surface, borderColor: theme.border, borderWidth: 1 }]}>
                {(['cards', 'flowing'] as const).map((mode) => (
                  <TouchableOpacity
                    key={mode}
                    style={[
                      styles.transRow,
                      { borderBottomColor: theme.border },
                      readingMode === mode && { backgroundColor: theme.isDark ? 'rgba(212,169,62,0.1)' : colors.gold[50] }
                    ]}
                    onPress={() => setReadingMode(mode)}
                  >
                    <Text style={[
                      styles.transLabel,
                      { color: theme.textSecondary },
                      readingMode === mode && { color: theme.textPrimary, fontWeight: '600' }
                    ]}>
                      {mode === 'cards' ? 'Translation Cards' : 'Mushaf (Full Page)'}
                    </Text>
                    {readingMode === mode && (
                      <Ionicons name="checkmark" size={16} color={colors.gold[500]} />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </>
          )}

          {/* Font size */}
          <Text style={[styles.sectionLabel, { marginTop: spacing.md, color: theme.textSecondary }]}>ARABIC FONT SIZE</Text>
          <View style={[styles.sizeRow, { backgroundColor: theme.surface }]}>
            <TouchableOpacity
              style={[styles.sizeBtn, { backgroundColor: theme.surfaceElevated }]}
              onPress={() => {
                const idx = FONT_SIZES.indexOf(fontSize);
                if (idx > 0) setFontSize(FONT_SIZES[idx - 1]);
              }}
            >
              <Ionicons name="remove" size={20} color={theme.textPrimary} />
            </TouchableOpacity>

            <View style={styles.sizePreview}>
              <Text style={[styles.sizePreviewText, { fontSize, color: theme.textPrimary }]}>ب</Text>
              <Text style={[styles.sizeValue, { color: theme.textSecondary }]}>{fontSize}px</Text>
            </View>

            <TouchableOpacity
              style={[styles.sizeBtn, { backgroundColor: theme.surfaceElevated }]}
              onPress={() => {
                const idx = FONT_SIZES.indexOf(fontSize);
                if (idx < FONT_SIZES.length - 1) setFontSize(FONT_SIZES[idx + 1]);
              }}
            >
              <Ionicons name="add" size={20} color={theme.textPrimary} />
            </TouchableOpacity>
          </View>

          {/* Translation */}
          {!hideTranslation && (
            <>
              <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>TRANSLATION</Text>
              <View style={[styles.transGroup, { backgroundColor: theme.surface, borderColor: theme.border, borderWidth: 1 }]}>
                {TRANSLATIONS.map((lang) => (
                  <TouchableOpacity
                    key={lang}
                    style={[
                      styles.transRow,
                      { borderBottomColor: theme.border },
                      translationLang === lang && { backgroundColor: theme.isDark ? 'rgba(212,169,62,0.1)' : colors.gold[50] }
                    ]}
                    onPress={() => setTranslationLang(lang)}
                  >
                    <Text style={[
                      styles.transLabel,
                      { color: theme.textSecondary },
                      translationLang === lang && { color: theme.textPrimary, fontWeight: '600' }
                    ]}>
                      {TRANSLATION_LABELS[lang]}
                    </Text>
                    {translationLang === lang && (
                      <Ionicons name="checkmark" size={16} color={colors.gold[500]} />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </>
          )}

          <TouchableOpacity 
            style={[
              styles.doneBtn, 
              { backgroundColor: theme.isDark ? colors.gold[400] : colors.navy[900] }
            ]} 
            onPress={onClose}
          >
            <Text style={[
              styles.doneBtnText, 
              { color: theme.isDark ? colors.navy[900] : colors.white }
            ]}>Done</Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  panel: {
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xxxl,
    gap: spacing.md,
    ...shadow.lg,
  },
  handle: {
    width: 36, height: 4, borderRadius: 2,
    alignSelf: 'center', marginVertical: spacing.md,
  },
  title: { ...typography.heading, marginBottom: spacing.sm },
  sectionLabel: { ...typography.label },
  sizeRow: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: radius.md,
    padding: spacing.md, gap: spacing.lg, ...shadow.sm,
  },
  sizeBtn: {
    width: 40, height: 40, borderRadius: radius.sm,
    alignItems: 'center', justifyContent: 'center',
  },
  sizePreview: { flex: 1, alignItems: 'center', gap: spacing.xs },
  sizePreviewText: {
    fontFamily: 'Amiri_400Regular',
  },
  sizeValue: { ...typography.caption },
  transGroup: {
    borderRadius: radius.md,
    overflow: 'hidden', ...shadow.sm,
  },
  transRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.lg, paddingVertical: spacing.md,
    borderBottomWidth: 1,
  },
  transLabel: { ...typography.bodySmall },
  doneBtn: {
    borderRadius: radius.md,
    paddingVertical: spacing.md, alignItems: 'center',
    marginTop: spacing.sm,
  },
  doneBtnText: { ...typography.subheading, fontWeight: '700' },
});
