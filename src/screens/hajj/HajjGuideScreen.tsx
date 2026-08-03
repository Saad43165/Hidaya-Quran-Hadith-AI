import React, { useState } from 'react';
import { FlatList, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { BackButton } from '../../components/common/BackButton';
import { HAJJ_STEPS, UMRAH_STEPS, HAJJ_TYPES, PRE_HAJJ_CHECKLIST } from '../../data/hajjGuide';
import { useThemeColors } from '../../hooks/useThemeColors';
import { colors, radius, shadow, spacing, typography } from '../../theme';

type Mode = 'hajj' | 'umrah' | 'checklist';
type Lang = 'en' | 'ur';

export function HajjGuideScreen() {
  const { isDark, surface, bg, border, textPrimary, textSecondary } = useThemeColors();
  const [mode, setMode] = useState<Mode>('hajj');
  const [lang, setLang] = useState<Lang>('en');
  const [expanded, setExpanded] = useState<string | null>(null);
  const [typeExpanded, setTypeExpanded] = useState(false);
  const [checked, setChecked] = useState<Set<string>>(new Set());

  const steps = mode === 'hajj' ? HAJJ_STEPS : UMRAH_STEPS;
  const isUrdu = lang === 'ur';

  const toggleCheck = (id: string) => {
    setChecked(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const checkedCount = checked.size;
  const checklistProgress = PRE_HAJJ_CHECKLIST.length > 0 ? checkedCount / PRE_HAJJ_CHECKLIST.length : 0;

  return (
    <ScreenContainer noPadding>
      {/* Header */}
      <LinearGradient colors={['#060C1F', '#1A1205', '#2E1F08']} style={styles.header}>
        <Image source={require('../../../assets/images/islamicbackground.png')} style={styles.headerBg} resizeMode="cover" />
        <Image source={require('../../../assets/images/kabba.png')} style={styles.headerKabba} resizeMode="contain" />

        <View style={styles.headerTop}>
          <BackButton />
          {/* Language toggle — local to this screen only */}
          <View style={styles.langToggle}>
            <TouchableOpacity
              style={[styles.langBtn, !isUrdu && styles.langBtnActive]}
              onPress={() => setLang('en')}
              activeOpacity={0.8}
            >
              <Text style={[styles.langBtnText, !isUrdu && styles.langBtnTextActive]}>EN</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.langBtn, isUrdu && styles.langBtnActive]}
              onPress={() => setLang('ur')}
              activeOpacity={0.8}
            >
              <Text style={[styles.langBtnText, isUrdu && styles.langBtnTextActive]}>اردو</Text>
            </TouchableOpacity>
          </View>
        </View>

        <Text style={[styles.headerAr, { fontFamily: 'Amiri_400Regular' }]}>دليل الحج والعمرة</Text>
        <Text style={styles.headerEn}>{isUrdu ? 'حج اور عمرہ گائیڈ' : 'Hajj & Umrah Guide'}</Text>
        <Text style={styles.headerSub}>
          {isUrdu ? 'مستند دعاؤں کے ساتھ مرحلہ وار رہنمائی' : 'Step-by-step guide with authentic duas'}
        </Text>

        {/* Mode toggle */}
        <View style={styles.modeRow}>
          {([
            { id: 'hajj', label: '🕋 Hajj', labelUr: '🕋 حج' },
            { id: 'umrah', label: '🕌 Umrah', labelUr: '🕌 عمرہ' },
            { id: 'checklist', label: '✅ Checklist', labelUr: '✅ چیک لسٹ' },
          ] as { id: Mode; label: string; labelUr: string }[]).map(m => (
            <TouchableOpacity
              key={m.id}
              style={[styles.modeBtn, mode === m.id && styles.modeBtnActive]}
              onPress={() => { setMode(m.id); setExpanded(null); }}
              activeOpacity={0.8}
            >
              <Text style={[styles.modeBtnText, mode === m.id && styles.modeBtnTextActive]}>
                {isUrdu ? m.labelUr : m.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </LinearGradient>

      {/* Checklist mode */}
      {mode === 'checklist' ? (
        <FlatList
          data={PRE_HAJJ_CHECKLIST}
          keyExtractor={item => item.id}
          contentContainerStyle={[styles.list, { backgroundColor: bg }]}
          style={{ backgroundColor: bg }}
          ListHeaderComponent={
            <View>
              <View style={[styles.checklistHeader, { backgroundColor: surface, borderColor: border }]}>
                <View style={styles.checklistProgress}>
                  <Text style={[styles.checklistTitle, { color: textPrimary }]}>
                    {isUrdu ? 'حج سے پہلے تیاری' : 'Pre-Hajj Preparation'}
                  </Text>
                  <Text style={[styles.checklistCount, { color: colors.gold[400] }]}>
                    {checkedCount}/{PRE_HAJJ_CHECKLIST.length} {isUrdu ? 'مکمل' : 'done'}
                  </Text>
                </View>
                <View style={[styles.progressBarBg, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : '#E5E7EB' }]}>
                  <View style={[styles.progressBarFill, { width: `${checklistProgress * 100}%` as any, backgroundColor: colors.gold[400] }]} />
                </View>
              </View>
            </View>
          }
          renderItem={({ item }) => {
            const done = checked.has(item.id);
            return (
              <TouchableOpacity
                style={[styles.checkItem, { backgroundColor: surface, borderColor: done ? colors.gold[400] + '60' : border, opacity: done ? 0.75 : 1 }]}
                onPress={() => toggleCheck(item.id)}
                activeOpacity={0.8}
              >
                <View style={[styles.checkCircle, { borderColor: done ? colors.gold[400] : border, backgroundColor: done ? colors.gold[400] : 'transparent' }]}>
                  {done && <Ionicons name="checkmark" size={13} color={colors.navy[900]} />}
                </View>
                <View style={{ flex: 1 }}>
                  <View style={styles.checkItemTop}>
                    <Text style={styles.checkIcon}>{item.icon}</Text>
                    <View style={[styles.checkCatBadge, { backgroundColor: colors.gold[400] + '15', borderColor: colors.gold[400] + '30' }]}>
                      <Text style={[styles.checkCatText, { color: colors.gold[400] }]}>
                        {isUrdu ? item.categoryUr : item.category}
                      </Text>
                    </View>
                  </View>
                  <Text style={[styles.checkItemText, { color: textPrimary, textDecorationLine: done ? 'line-through' : 'none' }, isUrdu && styles.urduText]}>
                    {isUrdu ? item.itemUr : item.item}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          }}
          ListFooterComponent={<View style={{ height: spacing.xxxl }} />}
        />
      ) : (
        <FlatList
          data={steps}
          keyExtractor={item => item.id}
          contentContainerStyle={[styles.list, { backgroundColor: bg }]}
          style={{ backgroundColor: bg }}
          ListHeaderComponent={mode === 'hajj' ? (
            <View>
              {/* Hajj types expandable card */}
              <TouchableOpacity
                style={[styles.typesCard, { backgroundColor: surface, borderColor: border }]}
                onPress={() => setTypeExpanded(e => !e)}
                activeOpacity={0.85}
              >
                <View style={styles.typesTop}>
                  <View style={[styles.typesIconBox, { backgroundColor: 'rgba(245,158,11,0.15)' }]}>
                    <Ionicons name="information-circle" size={18} color={colors.gold[400]} />
                  </View>
                  <Text style={[styles.typesTitle, { color: textPrimary }]}>
                    {isUrdu ? 'حج کی تین اقسام' : 'Three Types of Hajj'}
                  </Text>
                  <Ionicons name={typeExpanded ? 'chevron-up' : 'chevron-down'} size={15} color={textSecondary} />
                </View>
                {typeExpanded && HAJJ_TYPES.map(ht => (
                  <View key={ht.id} style={[styles.typeItem, { borderTopColor: border }]}>
                    <View style={styles.typeNameRow}>
                      <Text style={[styles.typeName, { color: colors.gold[400] }]}>{ht.name}</Text>
                      <Text style={[styles.typeAr, { fontFamily: 'Amiri_400Regular', color: textPrimary }]}>{ht.arabicName}</Text>
                    </View>
                    <Text style={[styles.typeDesc, { color: textSecondary }]}>{ht.description}</Text>
                  </View>
                ))}
              </TouchableOpacity>

              <View style={styles.stepsHeader}>
                <Ionicons name="git-branch-outline" size={14} color={colors.gold[400]} />
                <Text style={[styles.stepsHeaderText, { color: textSecondary }]}>
                  {isUrdu ? `${steps.length} مراحل — ترتیب سے کریں` : `${steps.length} Steps · Follow in order`}
                </Text>
              </View>
            </View>
          ) : (
            <View style={styles.stepsHeader}>
              <Ionicons name="git-branch-outline" size={14} color={colors.gold[400]} />
              <Text style={[styles.stepsHeaderText, { color: textSecondary }]}>
                {isUrdu ? `${steps.length} مراحل — ترتیب سے کریں` : `${steps.length} Steps · Follow in order`}
              </Text>
            </View>
          )}
          renderItem={({ item, index }) => {
            const isExpanded = expanded === item.id;
            const title = isUrdu ? item.titleUr : item.title;
            const day = isUrdu ? (item.dayUr ?? item.day) : item.day;
            const location = isUrdu ? (item.locationUr ?? item.location) : item.location;
            const description = isUrdu ? item.descriptionUr : item.description;
            const duaTranslation = isUrdu ? (item.duaTranslationUr ?? item.duaTranslation) : item.duaTranslation;
            const importantList = isUrdu ? (item.importantUr ?? item.important) : item.important;
            const sunnahList = isUrdu ? (item.sunnahUr ?? item.sunnah) : item.sunnah;

            return (
              <View style={[styles.stepCard, { backgroundColor: surface, borderColor: border }]}>
                {/* Left color bar + connector */}
                <View style={[styles.stepBar, { backgroundColor: item.color }]} />
                {index < steps.length - 1 && (
                  <View style={[styles.connector, { backgroundColor: item.color + '30' }]} />
                )}

                <View style={styles.stepContent}>
                  {/* Step number + header */}
                  <View style={styles.stepTop}>
                    <View style={[styles.stepNum, { backgroundColor: item.color + '25', borderColor: item.color + '60' }]}>
                      <Text style={[styles.stepNumText, { color: item.color }]}>{item.stepNumber}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.stepDay, { color: item.color }]}>{day}</Text>
                      <Text style={[styles.stepTitle, { color: textPrimary }, isUrdu && styles.urduTitle]}>{title}</Text>
                      <Text style={[styles.stepTitleAr, { fontFamily: 'Amiri_400Regular', color: item.color }]}>{item.arabicTitle}</Text>
                    </View>
                  </View>

                  {/* Location pill */}
                  <View style={[styles.locationPill, { backgroundColor: item.color + '12', borderColor: item.color + '30' }]}>
                    <Ionicons name="location-outline" size={11} color={item.color} />
                    <Text style={[styles.locationText, { color: item.color }]}>{location}</Text>
                  </View>

                  {/* Description */}
                  <Text style={[styles.stepDesc, { color: textPrimary }, isUrdu && styles.urduText]}
                    numberOfLines={isExpanded ? undefined : 3}>
                    {description}
                  </Text>

                  {/* Dua box */}
                  {item.dua && (
                    <View style={[styles.duaBox, { backgroundColor: item.color + '10', borderColor: item.color + '35' }]}>
                      <View style={styles.duaLabel}>
                        <Text style={[styles.duaLabelText, { color: item.color }]}>🤲 {isUrdu ? 'دعا' : 'Dua'}</Text>
                      </View>
                      <Text style={[styles.duaAr, { fontFamily: 'Amiri_400Regular', color: textPrimary }]}>{item.dua}</Text>
                      {item.duaTransliteration && (
                        <Text style={[styles.duaTranslit, { color: textSecondary }]}>{item.duaTransliteration}</Text>
                      )}
                      {duaTranslation && (
                        <Text style={[styles.duaTrans, { color: item.color }, isUrdu && styles.urduText]}>{duaTranslation}</Text>
                      )}
                    </View>
                  )}

                  {/* Expand toggle */}
                  <TouchableOpacity
                    style={[styles.expandBtn, { borderColor: item.color + '50' }]}
                    onPress={() => setExpanded(isExpanded ? null : item.id)}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.expandBtnText, { color: item.color }]}>
                      {isExpanded
                        ? (isUrdu ? 'کم دکھائیں' : 'Show Less')
                        : (isUrdu ? 'تفصیل اور اہم باتیں' : 'Details & Rules')}
                    </Text>
                    <Ionicons name={isExpanded ? 'chevron-up' : 'chevron-down'} size={13} color={item.color} />
                  </TouchableOpacity>

                  {/* Expanded content */}
                  {isExpanded && (
                    <View style={[styles.expandedBody, { borderTopColor: border }]}>
                      {importantList && importantList.length > 0 && (
                        <View style={styles.rulesSection}>
                          <View style={styles.rulesTitleRow}>
                            <View style={[styles.rulesTitlePill, { backgroundColor: '#EF444415', borderColor: '#EF444430' }]}>
                              <Ionicons name="alert-circle" size={12} color="#EF4444" />
                              <Text style={[styles.rulesTitle, { color: '#EF4444' }]}>
                                {isUrdu ? 'اہم باتیں' : 'IMPORTANT'}
                              </Text>
                            </View>
                          </View>
                          {importantList.map((rule, i) => (
                            <View key={i} style={styles.ruleRow}>
                              <View style={[styles.ruleDot, { backgroundColor: '#EF4444' }]} />
                              <Text style={[styles.ruleText, { color: textPrimary }, isUrdu && styles.urduSmallText]}>{rule}</Text>
                            </View>
                          ))}
                        </View>
                      )}
                      {sunnahList && sunnahList.length > 0 && (
                        <View style={styles.rulesSection}>
                          <View style={styles.rulesTitleRow}>
                            <View style={[styles.rulesTitlePill, { backgroundColor: '#4ADE8015', borderColor: '#4ADE8030' }]}>
                              <Ionicons name="star" size={12} color="#4ADE80" />
                              <Text style={[styles.rulesTitle, { color: '#4ADE80' }]}>
                                {isUrdu ? 'سنت اعمال' : 'SUNNAH ACTS'}
                              </Text>
                            </View>
                          </View>
                          {sunnahList.map((s, i) => (
                            <View key={i} style={styles.ruleRow}>
                              <View style={[styles.ruleDot, { backgroundColor: '#4ADE80' }]} />
                              <Text style={[styles.ruleText, { color: textPrimary }, isUrdu && styles.urduSmallText]}>{s}</Text>
                            </View>
                          ))}
                        </View>
                      )}
                    </View>
                  )}
                </View>
              </View>
            );
          }}
          ListFooterComponent={<View style={{ height: spacing.xxxl }} />}
        />
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: { paddingTop: 52, paddingBottom: spacing.lg, paddingHorizontal: spacing.lg, overflow: 'hidden', gap: spacing.xs },
  headerBg: { position: 'absolute', right: 0, bottom: 0, width: '100%', height: '130%', opacity: 0.07 },
  headerKabba: { position: 'absolute', right: 0, bottom: 0, width: 90, height: 90, opacity: 0.25 },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.xs },
  langToggle: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: radius.pill, padding: 3, gap: 2 },
  langBtn: { paddingHorizontal: spacing.md, paddingVertical: 5, borderRadius: radius.pill },
  langBtnActive: { backgroundColor: colors.gold[400] },
  langBtnText: { fontSize: 12, fontWeight: '700', color: 'rgba(255,255,255,0.5)' },
  langBtnTextActive: { color: colors.navy[900] },
  headerAr: { fontSize: 20, color: colors.gold[300] },
  headerEn: { ...typography.heading, color: colors.white },
  headerSub: { fontSize: 12, color: 'rgba(255,255,255,0.4)', fontWeight: '500' },
  modeRow: { flexDirection: 'row', gap: spacing.xs, marginTop: spacing.sm },
  modeBtn: { flex: 1, paddingVertical: spacing.sm, borderRadius: radius.sm, backgroundColor: 'rgba(255,255,255,0.07)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', alignItems: 'center' },
  modeBtnActive: { backgroundColor: 'rgba(245,158,11,0.2)', borderColor: colors.gold[400] },
  modeBtnText: { fontSize: 11, fontWeight: '700', color: 'rgba(255,255,255,0.4)' },
  modeBtnTextActive: { color: colors.gold[300] },

  list: { paddingHorizontal: spacing.lg, paddingTop: spacing.md, gap: spacing.sm },

  typesCard: { borderRadius: radius.md, padding: spacing.lg, borderWidth: 0.5, marginBottom: spacing.md, ...shadow.sm },
  typesTop: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  typesIconBox: { width: 32, height: 32, borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center' },
  typesTitle: { ...typography.subheading, flex: 1 },
  typeItem: { borderTopWidth: 1, paddingTop: spacing.md, marginTop: spacing.sm, gap: 6 },
  typeNameRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flexWrap: 'wrap' },
  typeName: { fontSize: 13, fontWeight: '800' },
  typeAr: { fontSize: 16, lineHeight: 26 },
  typeDesc: { ...typography.bodySmall, lineHeight: 20 },

  stepsHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginBottom: spacing.sm },
  stepsHeaderText: { fontSize: 12, fontWeight: '600' },

  stepCard: { borderRadius: radius.md, borderWidth: 0.5, ...shadow.sm, position: 'relative', overflow: 'hidden', flexDirection: 'row' },
  stepBar: { width: 4, borderTopLeftRadius: radius.md, borderBottomLeftRadius: radius.md },
  connector: { position: 'absolute', left: 4 + spacing.lg + 15, top: 68, width: 2, bottom: -spacing.sm - 1, zIndex: 0 },
  stepContent: { flex: 1, padding: spacing.lg, gap: spacing.sm },
  stepTop: { flexDirection: 'row', gap: spacing.md, alignItems: 'flex-start' },
  stepNum: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center', borderWidth: 2, flexShrink: 0, marginTop: 2 },
  stepNumText: { fontSize: 14, fontWeight: '800' },
  stepDay: { fontSize: 10, fontWeight: '800', letterSpacing: 0.5, textTransform: 'uppercase', opacity: 0.85 },
  stepTitle: { ...typography.subheading, marginTop: 2 },
  stepTitleAr: { fontSize: 15, lineHeight: 28, marginTop: 2 },
  locationPill: { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: radius.pill, paddingHorizontal: spacing.sm, paddingVertical: 3, borderWidth: 1, alignSelf: 'flex-start' },
  locationText: { fontSize: 11, fontWeight: '700' },
  stepDesc: { ...typography.body, lineHeight: 23 },

  duaBox: { borderRadius: radius.sm, padding: spacing.md, borderWidth: 1, gap: spacing.xs },
  duaLabel: { flexDirection: 'row', alignItems: 'center' },
  duaLabelText: { fontSize: 11, fontWeight: '800', letterSpacing: 0.5 },
  duaAr: { fontSize: 19, lineHeight: 38, textAlign: 'right', writingDirection: 'rtl' },
  duaTranslit: { fontSize: 12, fontStyle: 'italic', lineHeight: 19, color: 'rgba(255,255,255,0.5)' },
  duaTrans: { fontSize: 12, fontWeight: '600', lineHeight: 20 },

  expandBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start', borderWidth: 1, borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: 5 },
  expandBtnText: { fontSize: 12, fontWeight: '700' },
  expandedBody: { borderTopWidth: 1, paddingTop: spacing.md, gap: spacing.md },
  rulesSection: { gap: spacing.xs },
  rulesTitleRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  rulesTitlePill: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: spacing.sm, paddingVertical: 3, borderRadius: radius.pill, borderWidth: 1 },
  rulesTitle: { fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  ruleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  ruleDot: { width: 5, height: 5, borderRadius: 3, marginTop: 8, flexShrink: 0 },
  ruleText: { ...typography.bodySmall, flex: 1, lineHeight: 20 },

  // Checklist styles
  checklistHeader: { borderRadius: radius.md, padding: spacing.lg, borderWidth: 0.5, marginBottom: spacing.sm, gap: spacing.sm },
  checklistProgress: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  checklistTitle: { ...typography.subheading },
  checklistCount: { fontSize: 13, fontWeight: '800' },
  progressBarBg: { height: 6, borderRadius: 3, overflow: 'hidden' },
  progressBarFill: { height: 6, borderRadius: 3 },
  checkItem: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md, padding: spacing.lg, borderRadius: radius.md, borderWidth: 0.5, ...shadow.sm },
  checkCircle: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 },
  checkItemTop: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginBottom: 4 },
  checkIcon: { fontSize: 14 },
  checkCatBadge: { borderRadius: radius.pill, paddingHorizontal: spacing.sm, paddingVertical: 2, borderWidth: 1 },
  checkCatText: { fontSize: 10, fontWeight: '700' },
  checkItemText: { ...typography.body, lineHeight: 22 },

  urduText: { textAlign: 'right', fontFamily: 'Amiri_400Regular', fontSize: 14, lineHeight: 28 },
  urduTitle: { textAlign: 'right', fontFamily: 'Amiri_400Regular' },
  urduSmallText: { textAlign: 'right', fontFamily: 'Amiri_400Regular', fontSize: 13, lineHeight: 24 },
});
