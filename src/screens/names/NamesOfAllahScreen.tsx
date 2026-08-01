import React, { useState } from 'react';
import { FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { NAMES_OF_ALLAH } from '../../data/namesOfAllah';
import { colors, gradients, radius, shadow, spacing, typography } from '../../theme';

import { useNavigation } from '@react-navigation/native';

export function NamesOfAllahScreen() {
  const navigation = useNavigation();
  const [query, setQuery] = useState('');
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);

  const filtered = query.trim()
    ? NAMES_OF_ALLAH.filter(n =>
        n.transliteration.toLowerCase().includes(query.toLowerCase()) ||
        n.meaning.toLowerCase().includes(query.toLowerCase()) ||
        n.arabic.includes(query)
      )
    : NAMES_OF_ALLAH;

  return (
    <ScreenContainer noPadding>
      <FlatList
        data={filtered}
        keyExtractor={item => String(item.number)}
        contentContainerStyle={styles.list}
        initialNumToRender={10}
        maxToRenderPerBatch={10}
        windowSize={5}
        ListHeaderComponent={
          <View>
            <LinearGradient colors={gradients.heroNavy} style={styles.header}>
              <View style={styles.headerDecor} />
              <View style={{ flexDirection: 'row', alignItems: 'center', width: '100%', marginBottom: spacing.sm }}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 4, position: 'absolute', left: 0, zIndex: 10 }}>
                  <Ionicons name="arrow-back" size={24} color={colors.white} />
                </TouchableOpacity>
                <View style={{ flex: 1, alignItems: 'center' }}>
                  <Text style={[styles.headerArabic, { fontFamily: 'Amiri_700Bold' }]}>أسماء الله الحسنى</Text>
                </View>
              </View>
              <Text style={styles.headerSub}>The 99 Beautiful Names of Allah</Text>
              <View style={styles.searchBar}>
                <Ionicons name="search" size={16} color="rgba(255,255,255,0.5)" />
                <TextInput
                  style={styles.searchInput}
                  value={query}
                  onChangeText={setQuery}
                  placeholder="Search by name or meaning..."
                  placeholderTextColor="rgba(255,255,255,0.35)"
                />
                {query.length > 0 && (
                  <TouchableOpacity onPress={() => setQuery('')}>
                    <Ionicons name="close-circle" size={16} color="rgba(255,255,255,0.4)" />
                  </TouchableOpacity>
                )}
              </View>
            </LinearGradient>
            {filtered.length > 0 && (
              <Text style={styles.countText}>
                {filtered.length} name{filtered.length !== 1 ? 's' : ''}
              </Text>
            )}
          </View>
        }
        renderItem={({ item }) => {
          const isExpanded = expandedIdx === item.number;
          return (
            <TouchableOpacity
              style={styles.card}
              onPress={() => setExpandedIdx(isExpanded ? null : item.number)}
              activeOpacity={0.85}
            >
              <View style={styles.cardTop}>
                <View style={styles.numBadge}>
                  <Text style={styles.numText}>{item.number}</Text>
                </View>
                <View style={styles.cardMid}>
                  <Text style={[styles.arabic, { fontFamily: 'Amiri_700Bold' }]}>
                    {item.arabic}
                  </Text>
                  <Text style={styles.translit}>{item.transliteration}</Text>
                  <Text style={styles.meaning}>{item.meaning}</Text>
                </View>
                <Ionicons
                  name={isExpanded ? 'chevron-up' : 'chevron-down'}
                  size={16}
                  color={colors.parchment[400]}
                />
              </View>
              {isExpanded && (
                <View style={styles.explanation}>
                  <Text style={styles.explanationText}>{item.explanation}</Text>
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
  list: { paddingBottom: spacing.xxxl },
  header: {
    paddingTop: spacing.xxl, paddingBottom: spacing.xl,
    paddingHorizontal: spacing.xl, gap: spacing.md,
    overflow: 'hidden',
  },
  headerDecor: {
    position: 'absolute', right: -50, top: -50,
    width: 200, height: 200, borderRadius: 100,
    borderWidth: 1, borderColor: 'rgba(212,169,62,0.1)',
  },
  headerArabic: { fontSize: 30, color: colors.gold[300], textAlign: 'center' },
  headerSub: { ...typography.bodySmall, color: 'rgba(255,255,255,0.45)', textAlign: 'center' },
  searchBar: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: radius.md, paddingHorizontal: spacing.md, paddingVertical: spacing.md,
    marginTop: spacing.sm,
  },
  searchInput: { flex: 1, ...typography.body, color: colors.white },
  countText: {
    ...typography.caption, color: colors.parchment[500],
    paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.xs,
  },
  card: {
    marginHorizontal: spacing.lg, marginBottom: spacing.sm,
    backgroundColor: colors.white, borderRadius: radius.md,
    padding: spacing.md, ...shadow.sm,
  },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  numBadge: {
    width: 36, height: 36, borderRadius: radius.sm,
    backgroundColor: colors.navy[900],
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  numText: { ...typography.caption, color: colors.gold[400], fontWeight: '700' },
  cardMid: { flex: 1, gap: 2 },
  arabic: { fontSize: 22, color: colors.navy[900], textAlign: 'right' },
  translit: { ...typography.bodyMedium, color: colors.navy[800] },
  meaning: { ...typography.caption, color: colors.gold[600] },
  explanation: {
    marginTop: spacing.md, paddingTop: spacing.md,
    borderTopWidth: 1, borderTopColor: colors.parchment[200],
  },
  explanationText: {
    ...typography.body, color: colors.parchment[700], lineHeight: 24,
  },
});
