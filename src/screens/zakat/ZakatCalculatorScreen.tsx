import React, { useState } from 'react';
import {
  Image, KeyboardAvoidingView, Platform, ScrollView,
  StyleSheet, Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { BackButton } from '../../components/common/BackButton';
import { useThemeColors } from '../../hooks/useThemeColors';
import { colors, radius, shadow, spacing, typography } from '../../theme';

// Nisab thresholds (approximate — gold 87.48g, silver 612.36g)
const NISAB_GOLD_GRAMS = 87.48;
const NISAB_SILVER_GRAMS = 612.36;
const ZAKAT_RATE = 0.025; // 2.5%

interface AssetField {
  id: string;
  label: string;
  arabicLabel: string;
  description: string;
  icon: string;
  color: string;
}

const ASSET_FIELDS: AssetField[] = [
  { id: 'cash', label: 'Cash & Bank Balance', arabicLabel: 'النقود والمدخرات', description: 'All cash on hand + bank savings', icon: '💵', color: '#4ADE80' },
  { id: 'gold', label: 'Gold (in USD value)', arabicLabel: 'قيمة الذهب', description: 'Market value of gold jewellery/coins you own for a year', icon: '🥇', color: '#F59E0B' },
  { id: 'silver', label: 'Silver (in USD value)', arabicLabel: 'قيمة الفضة', description: 'Market value of silver items owned for a year', icon: '🥈', color: '#94A3B8' },
  { id: 'stocks', label: 'Stocks & Investments', arabicLabel: 'الأسهم والاستثمارات', description: 'Current market value of shares/mutual funds', icon: '📈', color: '#38BDF8' },
  { id: 'business', label: 'Business Assets', arabicLabel: 'أموال التجارة', description: 'Stock in trade, business receivables', icon: '🏪', color: '#818CF8' },
  { id: 'receivables', label: 'Money Owed to You', arabicLabel: 'الديون المستحقة لك', description: 'Debts others owe you that are likely to be repaid', icon: '🤝', color: '#F472B6' },
];

const DEDUCT_FIELDS: AssetField[] = [
  { id: 'debts', label: 'Debts You Owe', arabicLabel: 'ديونك', description: 'Immediate debts due within the year', icon: '💳', color: '#EF4444' },
  { id: 'expenses', label: 'Basic Living Expenses (Monthly)', arabicLabel: 'نفقات المعيشة الشهرية', description: 'Necessary monthly expenses for you and your family', icon: '🏠', color: '#F97316' },
];

export function ZakatCalculatorScreen() {
  const navigation = useNavigation();
  const { isDark, surface, bg, border, textPrimary, textSecondary } = useThemeColors();
  const [assets, setAssets] = useState<Record<string, string>>({});
  const [deductions, setDeductions] = useState<Record<string, string>>({});
  const [nisabMode, setNisabMode] = useState<'gold' | 'silver'>('gold');
  const [nisabPrice, setNisabPrice] = useState('');
  const [showResult, setShowResult] = useState(false);

  const parseVal = (v: string) => parseFloat(v.replace(/,/g, '')) || 0;

  const totalAssets = ASSET_FIELDS.reduce((sum, f) => sum + parseVal(assets[f.id] ?? ''), 0);
  const totalDeductions = parseDeductions();

  function parseDeductions() {
    const debts = parseVal(deductions['debts'] ?? '');
    const monthlyExpense = parseVal(deductions['expenses'] ?? '');
    return debts + monthlyExpense * 12;
  }

  const netWorth = Math.max(0, totalAssets - totalDeductions);
  const goldPricePerGram = parseVal(nisabPrice) || 62; // approx fallback
  const nisabValue = nisabMode === 'gold'
    ? NISAB_GOLD_GRAMS * goldPricePerGram
    : NISAB_SILVER_GRAMS * (goldPricePerGram / 70); // rough silver ratio

  const zakatable = netWorth >= nisabValue;
  const zakatDue = zakatable ? netWorth * ZAKAT_RATE : 0;

  const handleCalculate = () => setShowResult(true);
  const handleReset = () => {
    setAssets({});
    setDeductions({});
    setNisabPrice('');
    setShowResult(false);
  };

  return (
    <ScreenContainer noPadding>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView style={{ flex: 1, backgroundColor: bg }} showsVerticalScrollIndicator={false}>

          {/* Header */}
          <LinearGradient colors={['#060C1F', '#0B2410', '#113D1E']} style={styles.header}>
            <Image source={require('../../../assets/images/islamicbackground.png')} style={styles.headerBg} resizeMode="cover" />
            <BackButton />
            <Text style={[styles.headerAr, { fontFamily: 'Amiri_400Regular' }]}>حاسبة الزكاة</Text>
            <Text style={styles.headerEn}>Zakat Calculator</Text>
            <Text style={styles.headerSub}>2.5% of net zakatable wealth above Nisab</Text>
          </LinearGradient>

          <View style={[styles.body, { backgroundColor: bg }]}>

            {/* Nisab settings */}
            <SectionTitle icon="settings-outline" label="Nisab Settings" color="#F59E0B" isDark={isDark} textPrimary={textPrimary} />
            <View style={[styles.card, { backgroundColor: surface }]}>
              <Text style={[styles.cardSubLabel, { color: textSecondary }]}>Choose Nisab standard:</Text>
              <View style={styles.toggleRow}>
                {(['gold', 'silver'] as const).map(mode => (
                  <TouchableOpacity
                    key={mode}
                    style={[styles.toggleBtn, nisabMode === mode && styles.toggleBtnActive]}
                    onPress={() => setNisabMode(mode)}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.toggleBtnText, nisabMode === mode && styles.toggleBtnTextActive]}>
                      {mode === 'gold' ? '🥇 Gold (87.48g)' : '🥈 Silver (612g)'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              <NumberInput
                label={`Current ${nisabMode === 'gold' ? 'Gold' : 'Silver'} price per gram (USD)`}
                value={nisabPrice}
                onChange={setNisabPrice}
                placeholder={nisabMode === 'gold' ? 'e.g. 62' : 'e.g. 0.88'}
                isDark={isDark} border={border} textPrimary={textPrimary} textSecondary={textSecondary}
              />
              <View style={[styles.nisabResult, { backgroundColor: '#F59E0B' + '15', borderColor: '#F59E0B' + '30' }]}>
                <Text style={styles.nisabResultLabel}>Nisab threshold:</Text>
                <Text style={styles.nisabResultValue}>${nisabValue.toLocaleString('en', { maximumFractionDigits: 0 })}</Text>
              </View>
            </View>

            {/* Assets */}
            <SectionTitle icon="trending-up-outline" label="Your Assets" color="#4ADE80" isDark={isDark} textPrimary={textPrimary} />
            <View style={[styles.card, { backgroundColor: surface }]}>
              {ASSET_FIELDS.map(field => (
                <NumberInput
                  key={field.id}
                  label={field.label}
                  description={field.description}
                  emoji={field.icon}
                  value={assets[field.id] ?? ''}
                  onChange={v => setAssets(prev => ({ ...prev, [field.id]: v }))}
                  isDark={isDark} border={border} textPrimary={textPrimary} textSecondary={textSecondary}
                />
              ))}
              <View style={[styles.subtotal, { borderTopColor: border }]}>
                <Text style={[styles.subtotalLabel, { color: textSecondary }]}>Total Assets:</Text>
                <Text style={[styles.subtotalValue, { color: '#4ADE80' }]}>${totalAssets.toLocaleString('en', { maximumFractionDigits: 0 })}</Text>
              </View>
            </View>

            {/* Deductions */}
            <SectionTitle icon="trending-down-outline" label="Deductions" color="#EF4444" isDark={isDark} textPrimary={textPrimary} />
            <View style={[styles.card, { backgroundColor: surface }]}>
              {DEDUCT_FIELDS.map(field => (
                <NumberInput
                  key={field.id}
                  label={field.label}
                  description={field.description}
                  emoji={field.icon}
                  value={deductions[field.id] ?? ''}
                  onChange={v => setDeductions(prev => ({ ...prev, [field.id]: v }))}
                  isDark={isDark} border={border} textPrimary={textPrimary} textSecondary={textSecondary}
                />
              ))}
              <View style={[styles.subtotal, { borderTopColor: border }]}>
                <Text style={[styles.subtotalLabel, { color: textSecondary }]}>Total Deductions:</Text>
                <Text style={[styles.subtotalValue, { color: '#EF4444' }]}>${totalDeductions.toLocaleString('en', { maximumFractionDigits: 0 })}</Text>
              </View>
            </View>

            {/* Calculate button */}
            <TouchableOpacity style={styles.calcBtn} onPress={handleCalculate} activeOpacity={0.85}>
              <LinearGradient colors={['#0B3D2E', '#16643F']} style={styles.calcBtnGrad}>
                <Ionicons name="calculator" size={20} color="#4ADE80" />
                <Text style={styles.calcBtnText}>Calculate Zakat</Text>
              </LinearGradient>
            </TouchableOpacity>

            {/* Result */}
            {showResult && (
              <View style={[styles.resultCard, { backgroundColor: surface }]}>
                <LinearGradient colors={zakatable ? ['#0B3D2E', '#0D4F38'] : ['#1A1A2E', '#16213E']} style={styles.resultGrad}>
                  <Text style={[styles.resultAr, { fontFamily: 'Amiri_400Regular' }]}>
                    {zakatable ? 'الزكاة واجبة' : 'الزكاة غير واجبة'}
                  </Text>

                  <View style={styles.resultRow}>
                    <ResultStat label="Net Worth" value={`$${netWorth.toLocaleString('en', { maximumFractionDigits: 0 })}`} color="#94A3B8" />
                    <ResultStat label="Nisab" value={`$${nisabValue.toLocaleString('en', { maximumFractionDigits: 0 })}`} color="#F59E0B" />
                  </View>

                  {zakatable ? (
                    <>
                      <View style={styles.zakatAmountBox}>
                        <Text style={styles.zakatAmountLabel}>Zakat Due (2.5%)</Text>
                        <Text style={styles.zakatAmount}>${zakatDue.toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
                      </View>
                      <Text style={styles.resultNote}>
                        Your net wealth exceeds the Nisab. You are required to pay Zakat.
                        May Allah accept it and purify your wealth.
                      </Text>
                    </>
                  ) : (
                    <Text style={styles.resultNote}>
                      Your net zakatable wealth is below the Nisab threshold. Zakat is not obligatory this year.
                      However, voluntary Sadaqah is always encouraged.
                    </Text>
                  )}
                </LinearGradient>

                <TouchableOpacity onPress={handleReset} style={styles.resetBtn} activeOpacity={0.7}>
                  <Ionicons name="refresh-outline" size={16} color={textSecondary} />
                  <Text style={[styles.resetText, { color: textSecondary }]}>Start Over</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Disclaimer */}
            <Text style={[styles.disclaimer, { color: textSecondary }]}>
              * This calculator provides an estimate. Consult a qualified scholar (mufti) for your specific situation.
              Zakat is due after one lunar year (hawl) has passed on the wealth above Nisab.
            </Text>

            <View style={{ height: spacing.xxxl }} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}

function SectionTitle({ icon, label, color, isDark, textPrimary }: { icon: any; label: string; color: string; isDark: boolean; textPrimary: string }) {
  return (
    <View style={sTStyles.row}>
      <View style={[sTStyles.iconWrap, { backgroundColor: color + '18' }]}>
        <Ionicons name={icon} size={14} color={color} />
      </View>
      <Text style={[sTStyles.label, { color: textPrimary }]}>{label}</Text>
    </View>
  );
}
const sTStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.lg, marginBottom: spacing.sm },
  iconWrap: { width: 28, height: 28, borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center' },
  label: { ...typography.subheading, fontWeight: '800', letterSpacing: 0.5 },
});

function NumberInput({ label, description, emoji, value, onChange, placeholder, isDark, border, textPrimary, textSecondary }: {
  label: string; description?: string; emoji?: string; value: string;
  onChange: (v: string) => void; placeholder?: string;
  isDark: boolean; border: string; textPrimary: string; textSecondary: string;
}) {
  return (
    <View style={niStyles.wrap}>
      <View style={niStyles.labelRow}>
        {emoji && <Text style={niStyles.emoji}>{emoji}</Text>}
        <View style={{ flex: 1 }}>
          <Text style={[niStyles.label, { color: textPrimary }]}>{label}</Text>
          {description && <Text style={[niStyles.desc, { color: textSecondary }]}>{description}</Text>}
        </View>
      </View>
      <View style={[niStyles.inputWrap, { borderColor: border, backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : colors.parchment[50] }]}>
        <Text style={[niStyles.dollar, { color: textSecondary }]}>$</Text>
        <TextInput
          value={value}
          onChangeText={onChange}
          keyboardType="numeric"
          placeholder={placeholder ?? '0'}
          placeholderTextColor={isDark ? 'rgba(255,255,255,0.2)' : colors.parchment[300]}
          style={[niStyles.input, { color: textPrimary }]}
        />
      </View>
    </View>
  );
}
const niStyles = StyleSheet.create({
  wrap: { marginBottom: spacing.md },
  labelRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm, marginBottom: spacing.xs },
  emoji: { fontSize: 18, lineHeight: 24, marginTop: 1 },
  label: { ...typography.bodySmall, fontWeight: '700' },
  desc: { fontSize: 11, marginTop: 1, lineHeight: 16 },
  inputWrap: { flexDirection: 'row', alignItems: 'center', borderRadius: radius.sm, borderWidth: 1, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, gap: 4 },
  dollar: { fontSize: 14, fontWeight: '700' },
  input: { flex: 1, fontSize: 15, fontWeight: '600' },
});

function ResultStat({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <View style={rsStyles.stat}>
      <Text style={rsStyles.label}>{label}</Text>
      <Text style={[rsStyles.value, { color }]}>{value}</Text>
    </View>
  );
}
const rsStyles = StyleSheet.create({
  stat: { flex: 1, alignItems: 'center', gap: 3 },
  label: { fontSize: 11, color: 'rgba(255,255,255,0.4)', fontWeight: '600' },
  value: { fontSize: 16, fontWeight: '800' },
});

const styles = StyleSheet.create({
  header: { paddingTop: 52, paddingBottom: spacing.xl, paddingHorizontal: spacing.lg, overflow: 'hidden', gap: spacing.xs },
  headerBg: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, width: '100%', height: '100%', opacity: 0.08 },
  backBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.xs },
  headerAr: { fontSize: 26, color: '#4ADE80' },
  headerEn: { ...typography.heading, color: colors.white },
  headerSub: { fontSize: 12, color: 'rgba(255,255,255,0.4)', fontWeight: '500' },
  body: { padding: spacing.lg, gap: 0 },
  card: { borderRadius: radius.md, padding: spacing.lg, ...shadow.sm, marginBottom: spacing.xs },
  cardSubLabel: { fontSize: 12, fontWeight: '600', marginBottom: spacing.sm },
  toggleRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
  toggleBtn: { flex: 1, paddingVertical: spacing.sm, borderRadius: radius.sm, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.04)' },
  toggleBtnActive: { backgroundColor: 'rgba(245,158,11,0.15)', borderColor: colors.gold[400] },
  toggleBtnText: { fontSize: 12, fontWeight: '700', color: 'rgba(255,255,255,0.4)' },
  toggleBtnTextActive: { color: colors.gold[300] },
  nisabResult: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderRadius: radius.sm, padding: spacing.md, borderWidth: 1, marginTop: spacing.sm },
  nisabResultLabel: { fontSize: 12, color: colors.gold[400], fontWeight: '700' },
  nisabResultValue: { fontSize: 18, color: colors.gold[300], fontWeight: '800' },
  subtotal: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, paddingTop: spacing.md, marginTop: spacing.xs },
  subtotalLabel: { fontSize: 13, fontWeight: '700' },
  subtotalValue: { fontSize: 16, fontWeight: '800' },
  calcBtn: { borderRadius: radius.md, overflow: 'hidden', marginTop: spacing.lg, ...shadow.md },
  calcBtnGrad: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, paddingVertical: spacing.lg },
  calcBtnText: { ...typography.subheading, color: '#4ADE80' },
  resultCard: { borderRadius: radius.md, overflow: 'hidden', marginTop: spacing.lg, ...shadow.lg },
  resultGrad: { padding: spacing.xl, gap: spacing.md, alignItems: 'center' },
  resultAr: { fontSize: 22, color: colors.white, textAlign: 'center' },
  resultRow: { flexDirection: 'row', width: '100%', gap: spacing.md },
  zakatAmountBox: { alignItems: 'center', gap: 4 },
  zakatAmountLabel: { fontSize: 13, color: 'rgba(255,255,255,0.5)', fontWeight: '700' },
  zakatAmount: { fontSize: 36, color: '#4ADE80', fontWeight: '800' },
  resultNote: { fontSize: 13, color: 'rgba(255,255,255,0.55)', textAlign: 'center', lineHeight: 20 },
  resetBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.xs, padding: spacing.md },
  resetText: { fontSize: 13, fontWeight: '600' },
  disclaimer: { fontSize: 11, textAlign: 'center', lineHeight: 17, marginTop: spacing.lg, paddingHorizontal: spacing.sm },
});
