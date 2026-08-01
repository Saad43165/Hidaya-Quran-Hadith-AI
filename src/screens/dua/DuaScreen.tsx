import React, { useState } from 'react';
import { FlatList, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { DUAS, DUA_CATEGORIES, Dua } from '../../data/duas';
import { colors, gradients, radius, shadow, spacing, typography } from '../../theme';

import { useNavigation } from '@react-navigation/native';

export function DuaScreen() {
  const navigation = useNavigation();
  const [selectedCategory, setSelectedCategory] = useState<string>(DUA_CATEGORIES[0]);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = DUAS.filter(d => d.category === selectedCategory);

  return (
    <ScreenContainer noPadding>
      <LinearGradient colors={gradients.heroNavy} style={styles.header}>
        <View style={styles.headerDecor} />
        <View style={{ flexDirection: 'row', alignItems: 'center', width: '100%' }}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 4, position: 'absolute', left: 0, zIndex: 10 }}>
            <Ionicons name="arrow-back" size={24} color={colors.white} />
          </TouchableOpacity>
          <View style={{ flex: 1, alignItems: 'center' }}>
            <Text style={styles.headerArabic}>أَدْعِيَة</Text>
          </View>
        </View>
        <Text style={styles.headerSub}>Daily Duas & Supplications</Text>
      </LinearGradient>

      {/* Category tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoryRow} style={styles.categoryScroll}>
        {DUA_CATEGORIES.map(cat => (
          <TouchableOpacity
            key={cat}
            style={[styles.catChip, selectedCategory === cat && styles.catChipActive]}
            onPress={() => { setSelectedCategory(cat); setExpandedId(null); }}
          >
            <Text style={[styles.catLabel, selectedCategory === cat && styles.catLabelActive]}>
              {cat}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <FlatList
        data={filtered}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => {
          const isExpanded = expandedId === item.id;
          return (
            <TouchableOpacity
              style={styles.duaCard}
              onPress={() => setExpandedId(isExpanded ? null : item.id)}
              activeOpacity={0.85}
            >
              <View style={styles.duaHeader}>
                <View style={styles.duaIcon}>
                  <Ionicons name="hand-left-outline" size={16} color={colors.gold[600]} />
                </View>
                <Text style={styles.duaTitle}>{item.title}</Text>
                <Ionicons
                  name={isExpanded ? 'chevron-up' : 'chevron-down'}
                  size={16} color={colors.parchment[400]}
                />
              </View>

              {/* Always show Arabic */}
              <Text style={[styles.arabic, { fontFamily: 'Amiri_400Regular' }]}>
                {item.arabic}
              </Text>

              {/* Expanded: transliteration + translation + reference */}
              {isExpanded && (
                <View style={styles.expandedBody}>
                  <View style={styles.divider} />
                  <Text style={styles.translit}>{item.transliteration}</Text>
                  <Text style={styles.translation}>{item.translation}</Text>
                  {item.reference && (
                    <View style={styles.refBadge}>
                      <Ionicons name="book-outline" size={11} color={colors.gold[600]} />
                      <Text style={styles.refText}>{item.reference}</Text>
                    </View>
                  )}
                </View>
              )}
            </TouchableOpacity>
          );
        }}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingTop: spacing.xl, paddingBottom: spacing.xl,
    paddingHorizontal: spacing.xl, alignItems: 'center',
    gap: spacing.xs, overflow: 'hidden',
  },
  headerDecor: {
    position: 'absolute', right: -40, top: -40, width: 160, height: 160,
    borderRadius: 80, borderWidth: 1, borderColor: 'rgba(212,169,62,0.12)',
  },
  headerArabic: {
    fontFamily: 'Amiri_700Bold', fontSize: 32, color: colors.gold[300],
  },
  headerSub: { ...typography.bodySmall, color: 'rgba(255,255,255,0.45)' },
  categoryScroll: { flexGrow: 0 },
  categoryRow: {
    paddingHorizontal: spacing.lg, paddingVertical: spacing.md, gap: spacing.sm,
  },
  catChip: {
    paddingHorizontal: spacing.lg, paddingVertical: spacing.sm,
    borderRadius: radius.pill, backgroundColor: colors.white,
    borderWidth: 1, borderColor: colors.parchment[200], ...shadow.sm,
  },
  catChipActive: { backgroundColor: colors.navy[900], borderColor: colors.navy[900] },
  catLabel: { ...typography.caption, color: colors.parchment[800], fontWeight: '600' },
  catLabelActive: { color: colors.white },
  list: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxxl, gap: spacing.sm },
  duaCard: {
    backgroundColor: colors.white, borderRadius: radius.md,
    padding: spacing.lg, gap: spacing.md, ...shadow.sm,
  },
  duaHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  duaIcon: {
    width: 28, height: 28, borderRadius: radius.sm,
    backgroundColor: colors.gold[50], alignItems: 'center', justifyContent: 'center',
  },
  duaTitle: { ...typography.subheading, color: colors.navy[900], flex: 1 },
  arabic: {
    fontSize: 20, lineHeight: 40, color: colors.navy[900],
    textAlign: 'right', writingDirection: 'rtl',
  },
  expandedBody: { gap: spacing.sm },
  divider: { height: 1, backgroundColor: colors.parchment[200] },
  translit: { ...typography.bodySmall, color: colors.parchment[600], fontStyle: 'italic' },
  translation: { ...typography.body, color: colors.parchment[800], lineHeight: 23 },
  refBadge: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.xs,
    alignSelf: 'flex-start', backgroundColor: colors.gold[50],
    borderRadius: radius.pill, paddingHorizontal: spacing.sm, paddingVertical: 3,
  },
  refText: { fontSize: 11, color: colors.gold[700], fontWeight: '600' },
});
