import React from 'react';
import { Modal, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useQuranStore, TranslationLanguage, TRANSLATION_LABELS } from '../../store/useQuranStore';
import { colors, radius, shadow, spacing, typography } from '../../theme';

interface Props {
  visible: boolean;
  onClose: () => void;
}

const FONT_SIZES = [18, 20, 22, 24, 26, 28, 32];
const TRANSLATIONS: TranslationLanguage[] = ['en.sahih', 'ur.ahmedali', 'none'];

export function ReaderSettingsPanel({ visible, onClose }: Props) {
  const { fontSize, setFontSize, translationLang, setTranslationLang, readingMode, setReadingMode } = useQuranStore();

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.panel} onPress={() => {}}>
          {/* Handle */}
          <View style={styles.handle} />

          <Text style={styles.title}>Reader Settings</Text>

          {/* Reading Mode */}
          <Text style={styles.sectionLabel}>READING MODE</Text>
          <View style={styles.transGroup}>
            {(['cards', 'flowing'] as const).map((mode) => (
              <TouchableOpacity
                key={mode}
                style={[styles.transRow, readingMode === mode && styles.transRowActive]}
                onPress={() => setReadingMode(mode)}
              >
                <Text style={[styles.transLabel, readingMode === mode && styles.transLabelActive]}>
                  {mode === 'cards' ? 'Translation Cards' : 'Mushaf (Full Page)'}
                </Text>
                {readingMode === mode && (
                  <Ionicons name="checkmark" size={16} color={colors.gold[500]} />
                )}
              </TouchableOpacity>
            ))}
          </View>

          {/* Font size */}
          <Text style={[styles.sectionLabel, { marginTop: spacing.md }]}>ARABIC FONT SIZE</Text>
          <View style={styles.sizeRow}>
            <TouchableOpacity
              style={styles.sizeBtn}
              onPress={() => {
                const idx = FONT_SIZES.indexOf(fontSize);
                if (idx > 0) setFontSize(FONT_SIZES[idx - 1]);
              }}
            >
              <Ionicons name="remove" size={20} color={colors.navy[800]} />
            </TouchableOpacity>

            <View style={styles.sizePreview}>
              <Text style={[styles.sizePreviewText, { fontSize }]}>ب</Text>
              <Text style={styles.sizeValue}>{fontSize}px</Text>
            </View>

            <TouchableOpacity
              style={styles.sizeBtn}
              onPress={() => {
                const idx = FONT_SIZES.indexOf(fontSize);
                if (idx < FONT_SIZES.length - 1) setFontSize(FONT_SIZES[idx + 1]);
              }}
            >
              <Ionicons name="add" size={20} color={colors.navy[800]} />
            </TouchableOpacity>
          </View>

          {/* Translation */}
          <Text style={styles.sectionLabel}>TRANSLATION</Text>
          <View style={styles.transGroup}>
            {TRANSLATIONS.map((lang) => (
              <TouchableOpacity
                key={lang}
                style={[styles.transRow, translationLang === lang && styles.transRowActive]}
                onPress={() => setTranslationLang(lang)}
              >
                <Text style={[styles.transLabel, translationLang === lang && styles.transLabelActive]}>
                  {TRANSLATION_LABELS[lang]}
                </Text>
                {translationLang === lang && (
                  <Ionicons name="checkmark" size={16} color={colors.gold[500]} />
                )}
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity style={styles.doneBtn} onPress={onClose}>
            <Text style={styles.doneBtnText}>Done</Text>
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
    backgroundColor: colors.parchment[50],
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xxxl,
    gap: spacing.md,
    ...shadow.lg,
  },
  handle: {
    width: 36, height: 4, borderRadius: 2,
    backgroundColor: colors.parchment[300],
    alignSelf: 'center', marginVertical: spacing.md,
  },
  title: { ...typography.heading, color: colors.parchment[950], marginBottom: spacing.sm },
  sectionLabel: { ...typography.label, color: colors.parchment[500] },
  sizeRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.white, borderRadius: radius.md,
    padding: spacing.md, gap: spacing.lg, ...shadow.sm,
  },
  sizeBtn: {
    width: 40, height: 40, borderRadius: radius.sm,
    backgroundColor: colors.parchment[100],
    alignItems: 'center', justifyContent: 'center',
  },
  sizePreview: { flex: 1, alignItems: 'center', gap: spacing.xs },
  sizePreviewText: {
    fontFamily: 'Amiri_400Regular',
    color: colors.navy[900],
  },
  sizeValue: { ...typography.caption, color: colors.parchment[500] },
  transGroup: {
    backgroundColor: colors.white, borderRadius: radius.md,
    overflow: 'hidden', ...shadow.sm,
  },
  transRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.lg, paddingVertical: spacing.md,
    borderBottomWidth: 1, borderBottomColor: colors.parchment[100],
  },
  transRowActive: { backgroundColor: colors.gold[50] },
  transLabel: { ...typography.bodySmall, color: colors.parchment[800] },
  transLabelActive: { color: colors.navy[900], fontWeight: '600' },
  doneBtn: {
    backgroundColor: colors.navy[900], borderRadius: radius.md,
    paddingVertical: spacing.md, alignItems: 'center',
    marginTop: spacing.sm,
  },
  doneBtnText: { ...typography.subheading, color: colors.white },
});
