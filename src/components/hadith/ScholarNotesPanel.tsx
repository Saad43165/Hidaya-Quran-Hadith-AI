import React, { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ScholarNote } from '../../data/hadithGrades';
import { colors, radius, shadow, spacing, typography } from '../../theme';

interface Props {
  chapterName: string;
  notes: ScholarNote[];
}

export function ScholarNotesPanel({ chapterName, notes }: Props) {
  const [visible, setVisible] = useState(false);
  if (notes.length === 0) return null;

  return (
    <>
      <TouchableOpacity style={styles.trigger} onPress={() => setVisible(true)}>
        <Ionicons name="school-outline" size={14} color={colors.navy[700]} />
        <Text style={styles.triggerText}>Scholar Notes · {notes.length}</Text>
        <Ionicons name="chevron-forward" size={12} color={colors.parchment[400]} />
      </TouchableOpacity>

      <Modal visible={visible} transparent animationType="slide" onRequestClose={() => setVisible(false)}>
        <Pressable style={styles.overlay} onPress={() => setVisible(false)}>
          <Pressable style={styles.panel} onPress={() => {}}>
            <View style={styles.handle} />
            <View style={styles.panelHeader}>
              <Ionicons name="school" size={18} color={colors.navy[800]} />
              <Text style={styles.panelTitle}>Scholar Notes</Text>
            </View>
            <Text style={styles.chapterLabel}>{chapterName}</Text>
            <ScrollView contentContainerStyle={styles.notesList} showsVerticalScrollIndicator={false}>
              {notes.map((note, i) => (
                <View key={i} style={styles.noteCard}>
                  <View style={styles.noteHeader}>
                    <Text style={styles.scholarName}>{note.scholar}</Text>
                    {note.madhab && (
                      <View style={styles.madhabBadge}>
                        <Text style={styles.madhabText}>{note.madhab}</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.noteText}>{note.note}</Text>
                </View>
              ))}
              <View style={styles.disclaimer}>
                <Ionicons name="information-circle-outline" size={14} color={colors.parchment[500]} />
                <Text style={styles.disclaimerText}>
                  Scholar notes are for educational purposes. Consult a qualified scholar for personal rulings.
                </Text>
              </View>
            </ScrollView>
            <TouchableOpacity style={styles.closeBtn} onPress={() => setVisible(false)}>
              <Text style={styles.closeBtnText}>Close</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  trigger: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.xs,
    backgroundColor: '#EEF2FF', borderRadius: radius.pill,
    paddingHorizontal: spacing.md, paddingVertical: spacing.xs,
    alignSelf: 'flex-start', marginHorizontal: spacing.lg, marginBottom: spacing.sm,
  },
  triggerText: { ...typography.caption, color: colors.navy[700], fontWeight: '600' },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  panel: {
    backgroundColor: colors.parchment[50],
    borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl,
    paddingHorizontal: spacing.xl, paddingBottom: spacing.xxxl,
    maxHeight: '70%', ...shadow.lg,
  },
  handle: { width: 36, height: 4, borderRadius: 2, backgroundColor: colors.parchment[300], alignSelf: 'center', marginVertical: spacing.md },
  panelHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.xs },
  panelTitle: { ...typography.heading, color: colors.navy[900] },
  chapterLabel: { ...typography.caption, color: colors.parchment[500], marginBottom: spacing.lg },
  notesList: { gap: spacing.md, paddingBottom: spacing.xl },
  noteCard: {
    backgroundColor: colors.white, borderRadius: radius.md,
    padding: spacing.lg, gap: spacing.sm, ...shadow.sm,
  },
  noteHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  scholarName: { ...typography.subheading, color: colors.navy[900] },
  madhabBadge: {
    backgroundColor: colors.gold[50], borderRadius: radius.pill,
    paddingHorizontal: spacing.sm, paddingVertical: 2,
  },
  madhabText: { fontSize: 10, color: colors.gold[700], fontWeight: '600' },
  noteText: { ...typography.body, color: colors.parchment[700], lineHeight: 23 },
  disclaimer: {
    flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start',
    backgroundColor: colors.parchment[100], borderRadius: radius.md, padding: spacing.md,
  },
  disclaimerText: { ...typography.caption, color: colors.parchment[600], flex: 1, lineHeight: 18 },
  closeBtn: {
    backgroundColor: colors.navy[900], borderRadius: radius.md,
    paddingVertical: spacing.md, alignItems: 'center', marginTop: spacing.md,
  },
  closeBtnText: { ...typography.subheading, color: colors.white },
});
