import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { brandTheme, brandColors, fonts, spacing, radius } from '../../lib/theme';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../providers/AuthProvider';
import { TargetGender } from '../../lib/types/database';

const CATEGORIES = [
  'Fitness', 'Food & Drink', 'Beauty', 'Fashion', 'Retail',
  'Health', 'Tech', 'Entertainment', 'Home & Living', 'Other',
];

const GENDERS: { label: string; value: TargetGender }[] = [
  { label: 'Male', value: 'male' },
  { label: 'Female', value: 'female' },
  { label: 'All', value: 'all' },
];

const t = brandTheme.colors;

export default function BrandOnboarding() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, refreshProfile } = useAuth();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Step 1 — Business Identity
  const [businessName, setBusinessName] = useState('');
  const [category, setCategory] = useState('');
  const [bio, setBio] = useState('');
  const [website, setWebsite] = useState('');

  // Step 2 — Target Audience
  const [targetAudience, setTargetAudience] = useState('');
  const [budgetMin, setBudgetMin] = useState('');
  const [budgetMax, setBudgetMax] = useState('');
  const [ageMin, setAgeMin] = useState('');
  const [ageMax, setAgeMax] = useState('');
  const [targetGender, setTargetGender] = useState<TargetGender | null>(null);

  // Step 3 — Location
  const [city, setCity] = useState('');
  const [stateAbbr, setStateAbbr] = useState('');
  const [logoUrl, setLogoUrl] = useState('');

  function validateStep(): string | null {
    if (step === 1) {
      if (!businessName.trim()) return 'Business name is required.';
      if (!category) return 'Select a category.';
    }
    if (step === 2) {
      if (budgetMin && budgetMax) {
        if (parseFloat(budgetMin) > parseFloat(budgetMax))
          return 'Budget minimum cannot exceed maximum.';
      }
      if (ageMin && ageMax) {
        if (parseInt(ageMin, 10) > parseInt(ageMax, 10))
          return 'Age minimum cannot exceed maximum.';
      }
    }
    if (step === 3) {
      if (!city.trim()) return 'City is required.';
      if (stateAbbr.trim().length !== 2) return 'Enter a 2-letter state abbreviation (e.g. AZ).';
    }
    return null;
  }

  function advance() {
    const err = validateStep();
    if (err) { setError(err); return; }
    setError(null);
    setStep(s => s + 1);
  }

  function back() {
    setError(null);
    setStep(s => s - 1);
  }

  function num(val: string): number | null {
    const n = parseFloat(val);
    return isNaN(n) ? null : n;
  }

  function int(val: string): number | null {
    const n = parseInt(val, 10);
    return isNaN(n) ? null : n;
  }

  async function submit() {
    const err = validateStep();
    if (err) { setError(err); return; }
    setError(null);
    setLoading(true);

    const { error: insertError } = await supabase.from('brand_profiles').insert({
      id: user!.id,
      business_name: businessName.trim(),
      category,
      bio: bio.trim() || null,
      website: website.trim() || null,
      logo_url: logoUrl.trim() || null,
      monthly_budget_min: num(budgetMin),
      monthly_budget_max: num(budgetMax),
      target_audience: targetAudience.trim() || null,
      target_age_min: int(ageMin),
      target_age_max: int(ageMax),
      target_gender: targetGender,
    });

    if (insertError) {
      setError(insertError.message);
      setLoading(false);
      return;
    }

    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        onboarding_completed: true,
        city: city.trim(),
        state: stateAbbr.trim().toUpperCase(),
      })
      .eq('id', user!.id);

    if (updateError) {
      setError(updateError.message);
      setLoading(false);
      return;
    }

    await refreshProfile();
    router.replace('/(brand)/discover');
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Progress indicator */}
      <View style={[styles.progressRow, { paddingTop: insets.top + spacing.lg }]}>
        {[1, 2, 3].map(n => (
          <View key={n} style={styles.progressItem}>
            <View style={[
              styles.progressDot,
              n < step && styles.progressDotDone,
              n === step && styles.progressDotActive,
            ]}>
              <Text style={[
                styles.progressDotLabel,
                n < step && { color: '#FFFFFF' },
                n === step && { color: brandColors.primary },
              ]}>
                {n < step ? '✓' : String(n)}
              </Text>
            </View>
            {n < 3 && (
              <View style={[styles.progressLine, n < step && styles.progressLineDone]} />
            )}
          </View>
        ))}
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + spacing.xxl }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* ── Step 1: Business Identity ── */}
        {step === 1 && (
          <View>
            <Text style={styles.stepTitle}>Tell us about{'\n'}your brand.</Text>
            <View style={styles.form}>
              <View>
                <Text style={styles.label}>Business name</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Bloom Coffee Co."
                  placeholderTextColor={t.textMuted}
                  value={businessName}
                  onChangeText={setBusinessName}
                  autoCapitalize="words"
                />
              </View>

              <View>
                <Text style={styles.label}>Category</Text>
                <View style={styles.chipsWrap}>
                  {CATEGORIES.map(cat => {
                    const selected = category === cat;
                    return (
                      <TouchableOpacity
                        key={cat}
                        style={[styles.chip, selected && styles.chipSelected]}
                        onPress={() => setCategory(cat)}
                        activeOpacity={0.7}
                      >
                        <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
                          {cat}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              <View>
                <View style={styles.fieldHeader}>
                  <Text style={styles.label}>Bio / description</Text>
                  <Text style={styles.charCount}>{bio.length}/200</Text>
                </View>
                <TextInput
                  style={[styles.input, styles.multilineInput]}
                  placeholder="What makes your brand unique?"
                  placeholderTextColor={t.textMuted}
                  value={bio}
                  onChangeText={v => setBio(v.slice(0, 200))}
                  multiline
                  textAlignVertical="top"
                />
              </View>

              <View>
                <Text style={styles.label}>
                  Website <Text style={styles.labelNote}>(optional)</Text>
                </Text>
                <TextInput
                  style={styles.input}
                  placeholder="https://yourbrand.com"
                  placeholderTextColor={t.textMuted}
                  value={website}
                  onChangeText={setWebsite}
                  keyboardType="url"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
            </View>
          </View>
        )}

        {/* ── Step 2: Target Audience ── */}
        {step === 2 && (
          <View>
            <Text style={styles.stepTitle}>Who's your{'\n'}audience?</Text>
            <View style={styles.form}>
              <View>
                <Text style={styles.label}>Audience description</Text>
                <TextInput
                  style={[styles.input, styles.multilineInput]}
                  placeholder={'"Women 25–34 in Phoenix interested in fitness"'}
                  placeholderTextColor={t.textMuted}
                  value={targetAudience}
                  onChangeText={setTargetAudience}
                  multiline
                  textAlignVertical="top"
                />
              </View>

              <View>
                <Text style={styles.label}>Monthly budget</Text>
                <View style={styles.rangeRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.rangeLabel}>Min</Text>
                    <View style={styles.affixRow}>
                      <View style={styles.prefix}>
                        <Text style={styles.affixText}>$</Text>
                      </View>
                      <TextInput
                        style={[styles.input, styles.affixInput]}
                        placeholder="500"
                        placeholderTextColor={t.textMuted}
                        value={budgetMin}
                        onChangeText={setBudgetMin}
                        keyboardType="numeric"
                      />
                    </View>
                  </View>
                  <Text style={styles.rangeSep}>–</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.rangeLabel}>Max</Text>
                    <View style={styles.affixRow}>
                      <View style={styles.prefix}>
                        <Text style={styles.affixText}>$</Text>
                      </View>
                      <TextInput
                        style={[styles.input, styles.affixInput]}
                        placeholder="2,000"
                        placeholderTextColor={t.textMuted}
                        value={budgetMax}
                        onChangeText={setBudgetMax}
                        keyboardType="numeric"
                      />
                    </View>
                  </View>
                </View>
              </View>

              <View>
                <Text style={styles.label}>Target age range</Text>
                <View style={styles.rangeRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.rangeLabel}>Min age</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="18"
                      placeholderTextColor={t.textMuted}
                      value={ageMin}
                      onChangeText={setAgeMin}
                      keyboardType="numeric"
                      maxLength={3}
                    />
                  </View>
                  <Text style={styles.rangeSep}>–</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.rangeLabel}>Max age</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="45"
                      placeholderTextColor={t.textMuted}
                      value={ageMax}
                      onChangeText={setAgeMax}
                      keyboardType="numeric"
                      maxLength={3}
                    />
                  </View>
                </View>
              </View>

              <View>
                <Text style={styles.label}>Target gender</Text>
                <View style={styles.chipsWrap}>
                  {GENDERS.map(({ label, value }) => {
                    const selected = targetGender === value;
                    return (
                      <TouchableOpacity
                        key={value}
                        style={[styles.chip, selected && styles.chipSelected]}
                        onPress={() => setTargetGender(value)}
                        activeOpacity={0.7}
                      >
                        <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
                          {label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            </View>
          </View>
        )}

        {/* ── Step 3: Location ── */}
        {step === 3 && (
          <View>
            <Text style={styles.stepTitle}>Where are{'\n'}you based?</Text>
            <View style={styles.form}>
              <View style={styles.locationRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.label}>City</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Phoenix"
                    placeholderTextColor={t.textMuted}
                    value={city}
                    onChangeText={setCity}
                    autoCapitalize="words"
                  />
                </View>
                <View style={styles.stateField}>
                  <Text style={styles.label}>State</Text>
                  <TextInput
                    style={[styles.input, { textAlign: 'center' }]}
                    placeholder="AZ"
                    placeholderTextColor={t.textMuted}
                    value={stateAbbr}
                    onChangeText={v => setStateAbbr(v.toUpperCase().slice(0, 2))}
                    autoCapitalize="characters"
                    maxLength={2}
                  />
                </View>
              </View>

              <View>
                <Text style={styles.label}>
                  Logo URL <Text style={styles.labelNote}>(optional — upload coming soon)</Text>
                </Text>
                <TextInput
                  style={styles.input}
                  placeholder="https://..."
                  placeholderTextColor={t.textMuted}
                  value={logoUrl}
                  onChangeText={setLogoUrl}
                  keyboardType="url"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
            </View>
          </View>
        )}

        {error && <Text style={styles.errorText}>{error}</Text>}

        <View style={[styles.navRow, step > 1 && { justifyContent: 'space-between' }]}>
          {step > 1 && (
            <TouchableOpacity onPress={back} style={styles.backButton}>
              <Text style={styles.backButtonText}>← Back</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={[styles.nextButton, loading && styles.nextButtonDisabled]}
            onPress={step === 3 ? submit : advance}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading
              ? <ActivityIndicator color="#FFFFFF" />
              : <Text style={styles.nextButtonText}>{step === 3 ? 'Finish' : 'Next →'}</Text>
            }
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: t.background },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.xxl,
    paddingBottom: spacing.xl,
  },
  progressItem: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  progressDot: {
    width: 32, height: 32, borderRadius: 16,
    borderWidth: 2, borderColor: t.textMuted,
    alignItems: 'center', justifyContent: 'center',
  },
  progressDotActive: { borderColor: brandColors.primary },
  progressDotDone: { backgroundColor: brandColors.primary, borderColor: brandColors.primary },
  progressDotLabel: { fontFamily: fonts.headline, fontSize: 13, color: t.textMuted },
  progressLine: { flex: 1, height: 2, backgroundColor: t.border, marginHorizontal: spacing.xs },
  progressLineDone: { backgroundColor: brandColors.primary },
  scroll: { paddingHorizontal: spacing.xxl, flexGrow: 1 },
  stepTitle: {
    fontFamily: fonts.headlineBlack, fontSize: 32,
    color: t.text, lineHeight: 38, marginBottom: spacing.xxl,
  },
  form: { gap: spacing.lg },
  label: {
    fontFamily: fonts.headline, fontSize: 12, color: t.textMuted,
    textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: spacing.sm,
  },
  labelNote: { fontFamily: fonts.body, fontSize: 12, textTransform: 'none', letterSpacing: 0 },
  fieldHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: spacing.sm,
  },
  charCount: { fontFamily: fonts.body, fontSize: 12, color: t.textMuted },
  input: {
    backgroundColor: t.surface, borderRadius: radius.md,
    paddingHorizontal: spacing.lg, paddingVertical: spacing.md + 2,
    fontSize: 15, fontFamily: fonts.body, color: t.text,
    borderWidth: 1, borderColor: t.border,
  },
  multilineInput: { minHeight: 90, paddingTop: spacing.md },
  chipsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: {
    borderWidth: 1, borderColor: t.border, borderRadius: radius.full,
    paddingHorizontal: spacing.md, paddingVertical: spacing.xs + 2,
    backgroundColor: t.card,
  },
  chipSelected: { backgroundColor: brandColors.primary, borderColor: brandColors.primary },
  chipText: { fontFamily: fonts.body, fontSize: 14, color: t.textMuted },
  chipTextSelected: { fontFamily: fonts.headline, color: '#FFFFFF' },
  rangeRow: { flexDirection: 'row', alignItems: 'flex-end', gap: spacing.sm },
  rangeLabel: { fontFamily: fonts.body, fontSize: 12, color: t.textMuted, marginBottom: spacing.xs },
  rangeSep: { fontFamily: fonts.headline, fontSize: 18, color: t.textMuted, paddingBottom: spacing.md },
  affixRow: { flexDirection: 'row', alignItems: 'center' },
  prefix: {
    backgroundColor: t.card2, borderWidth: 1, borderColor: t.border, borderRightWidth: 0,
    borderTopLeftRadius: radius.md, borderBottomLeftRadius: radius.md,
    paddingHorizontal: spacing.md, paddingVertical: spacing.md + 2, justifyContent: 'center',
  },
  affixText: { fontFamily: fonts.headline, fontSize: 15, color: t.textMuted },
  affixInput: { flex: 1, borderTopLeftRadius: 0, borderBottomLeftRadius: 0 },
  locationRow: { flexDirection: 'row', gap: spacing.md },
  stateField: { width: 76 },
  errorText: { fontFamily: fonts.body, fontSize: 14, color: '#E0334F', marginTop: spacing.lg },
  navRow: {
    flexDirection: 'row', justifyContent: 'flex-end',
    alignItems: 'center', marginTop: spacing.xxl, paddingBottom: spacing.lg,
  },
  backButton: { paddingVertical: 15, paddingHorizontal: spacing.sm },
  backButtonText: { fontFamily: fonts.body, fontSize: 15, color: t.textMuted },
  nextButton: {
    backgroundColor: brandColors.primary, borderRadius: radius.full,
    paddingVertical: 15, paddingHorizontal: spacing.xxl,
    alignItems: 'center', minWidth: 130,
  },
  nextButtonDisabled: { opacity: 0.6 },
  nextButtonText: { fontFamily: fonts.headline, fontSize: 16, color: '#FFFFFF' },
});
