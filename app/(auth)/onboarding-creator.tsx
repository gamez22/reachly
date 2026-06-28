import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { creatorTheme, brandColors, fonts, spacing, radius } from '../../lib/theme';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../providers/AuthProvider';

const NICHE_OPTIONS = [
  'Fitness', 'Food', 'Lifestyle', 'Fashion', 'Beauty',
  'Tech', 'Travel', 'Gaming', 'Finance', 'Parenting',
];

const t = creatorTheme.colors;

export default function CreatorOnboarding() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, refreshProfile } = useAuth();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Step 1 — Identity
  const [displayName, setDisplayName] = useState('');
  const [handle, setHandle] = useState('');
  const [bio, setBio] = useState('');

  // Step 2 — Platforms & Reach
  const [instagramHandle, setInstagramHandle] = useState('');
  const [instagramFollowers, setInstagramFollowers] = useState('');
  const [tiktokHandle, setTiktokHandle] = useState('');
  const [tiktokFollowers, setTiktokFollowers] = useState('');
  const [avgLikesPerPost, setAvgLikesPerPost] = useState('');
  const [nicheTags, setNicheTags] = useState<string[]>([]);

  // Step 3 — Rate Card
  const [ratePost, setRatePost] = useState('');
  const [rateReel, setRateReel] = useState('');
  const [rateStory, setRateStory] = useState('');
  const [rateTiktok, setRateTiktok] = useState('');
  const [city, setCity] = useState('');
  const [stateAbbr, setStateAbbr] = useState('');

  function validateStep(): string | null {
    if (step === 1) {
      if (!displayName.trim()) return 'Display name is required.';
      if (!handle.trim()) return 'Handle is required.';
      if (!/^[a-z0-9_]+$/.test(handle.trim()))
        return 'Handle can only contain lowercase letters, numbers, and underscores.';
    }
    if (step === 2) {
      if (nicheTags.length === 0) return 'Select at least one niche.';
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

  function toggleNiche(niche: string) {
    setNicheTags(prev =>
      prev.includes(niche) ? prev.filter(n => n !== niche) : [...prev, niche]
    );
  }

  function num(val: string): number | null {
    const n = parseFloat(val);
    return isNaN(n) ? null : n;
  }

  async function submit() {
    const err = validateStep();
    if (err) { setError(err); return; }
    setError(null);
    setLoading(true);

    const { error: insertError } = await supabase.from('creator_profiles').insert({
      id: user!.id,
      display_name: displayName.trim(),
      handle: handle.trim(),
      bio: bio.trim() || null,
      niche_tags: nicheTags,
      instagram_handle: instagramHandle.trim() || null,
      instagram_followers: num(instagramFollowers),
      tiktok_handle: tiktokHandle.trim() || null,
      tiktok_followers: num(tiktokFollowers),
      youtube_handle: null,
      youtube_subscribers: null,
      engagement_rate: null,
      audience_age_range: null,
      audience_gender_split: null,
      verified_at: null,
      rate_post: num(ratePost),
      rate_reel: num(rateReel),
      rate_story: num(rateStory),
      rate_tiktok: num(rateTiktok),
      rate_youtube: null,
      avg_performance_score: null,
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
    router.replace('/(creator)/discover');
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
        contentContainerStyle={[
          styles.scroll,
          { paddingBottom: insets.bottom + spacing.xxl },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* ── Step 1: Identity ── */}
        {step === 1 && (
          <View>
            <Text style={styles.stepTitle}>Tell us about{'\n'}yourself.</Text>
            <View style={styles.form}>
              <View>
                <Text style={styles.label}>Display name</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Your name or persona"
                  placeholderTextColor={t.textMuted}
                  value={displayName}
                  onChangeText={setDisplayName}
                  autoCapitalize="words"
                />
              </View>

              <View>
                <Text style={styles.label}>Handle</Text>
                <View style={styles.affixRow}>
                  <View style={styles.prefix}>
                    <Text style={styles.affixText}>@</Text>
                  </View>
                  <TextInput
                    style={[styles.input, styles.affixInput]}
                    placeholder="yourhandle"
                    placeholderTextColor={t.textMuted}
                    value={handle}
                    onChangeText={v => setHandle(v.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>
              </View>

              <View>
                <View style={styles.bioHeader}>
                  <Text style={styles.label}>Bio</Text>
                  <Text style={styles.charCount}>{bio.length}/150</Text>
                </View>
                <TextInput
                  style={[styles.input, styles.bioInput]}
                  placeholder="Tell brands a bit about you..."
                  placeholderTextColor={t.textMuted}
                  value={bio}
                  onChangeText={v => setBio(v.slice(0, 150))}
                  multiline
                  textAlignVertical="top"
                />
              </View>
            </View>
          </View>
        )}

        {/* ── Step 2: Platforms & Reach ── */}
        {step === 2 && (
          <View>
            <Text style={styles.stepTitle}>Your platforms{'\n'}& reach.</Text>
            <View style={styles.form}>
              <View>
                <Text style={styles.label}>Instagram</Text>
                <View style={styles.platformRow}>
                  <TextInput
                    style={[styles.input, { flex: 1 }]}
                    placeholder="@handle"
                    placeholderTextColor={t.textMuted}
                    value={instagramHandle}
                    onChangeText={setInstagramHandle}
                    autoCapitalize="none"
                  />
                  <TextInput
                    style={[styles.input, styles.followersInput]}
                    placeholder="Followers"
                    placeholderTextColor={t.textMuted}
                    value={instagramFollowers}
                    onChangeText={setInstagramFollowers}
                    keyboardType="numeric"
                  />
                </View>
                <Text style={styles.verifyNote}>We'll verify this when you connect your account</Text>
              </View>

              <View>
                <Text style={styles.label}>TikTok</Text>
                <View style={styles.platformRow}>
                  <TextInput
                    style={[styles.input, { flex: 1 }]}
                    placeholder="@handle"
                    placeholderTextColor={t.textMuted}
                    value={tiktokHandle}
                    onChangeText={setTiktokHandle}
                    autoCapitalize="none"
                  />
                  <TextInput
                    style={[styles.input, styles.followersInput]}
                    placeholder="Followers"
                    placeholderTextColor={t.textMuted}
                    value={tiktokFollowers}
                    onChangeText={setTiktokFollowers}
                    keyboardType="numeric"
                  />
                </View>
                <Text style={styles.verifyNote}>We'll verify this when you connect your account</Text>
              </View>

              <View>
                <Text style={styles.label}>Average likes per post</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. 1200"
                  placeholderTextColor={t.textMuted}
                  value={avgLikesPerPost}
                  onChangeText={setAvgLikesPerPost}
                  keyboardType="numeric"
                />
              </View>

              <View>
                <Text style={styles.label}>
                  Your niches{' '}
                  <Text style={styles.labelNote}>(pick at least 1)</Text>
                </Text>
                <View style={styles.chipsWrap}>
                  {NICHE_OPTIONS.map(niche => {
                    const selected = nicheTags.includes(niche);
                    return (
                      <TouchableOpacity
                        key={niche}
                        style={[styles.chip, selected && styles.chipSelected]}
                        onPress={() => toggleNiche(niche)}
                        activeOpacity={0.7}
                      >
                        <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
                          {niche}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            </View>
          </View>
        )}

        {/* ── Step 3: Rate Card ── */}
        {step === 3 && (
          <View>
            <Text style={styles.stepTitle}>Set your{'\n'}rates.</Text>
            <View style={styles.form}>
              {([
                { label: 'Instagram Post', value: ratePost, setter: setRatePost },
                { label: 'Instagram Reel', value: rateReel, setter: setRateReel },
                { label: 'Story', value: rateStory, setter: setRateStory },
                { label: 'TikTok Video', value: rateTiktok, setter: setRateTiktok },
              ] as const).map(({ label, value, setter }) => (
                <View key={label}>
                  <Text style={styles.label}>{label}</Text>
                  <View style={styles.affixRow}>
                    <View style={styles.prefix}>
                      <Text style={styles.affixText}>$</Text>
                    </View>
                    <TextInput
                      style={[styles.input, styles.affixInput]}
                      placeholder="0"
                      placeholderTextColor={t.textMuted}
                      value={value}
                      onChangeText={setter}
                      keyboardType="numeric"
                    />
                  </View>
                </View>
              ))}

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
            </View>
          </View>
        )}

        {error && <Text style={styles.errorText}>{error}</Text>}

        {/* Navigation */}
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
  container: {
    flex: 1,
    backgroundColor: t.background,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.xxl,
    paddingBottom: spacing.xl,
  },
  progressItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  progressDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: t.textMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressDotActive: {
    borderColor: brandColors.primary,
  },
  progressDotDone: {
    backgroundColor: brandColors.primary,
    borderColor: brandColors.primary,
  },
  progressDotLabel: {
    fontFamily: fonts.headline,
    fontSize: 13,
    color: t.textMuted,
  },
  progressLine: {
    flex: 1,
    height: 2,
    backgroundColor: t.border,
    marginHorizontal: spacing.xs,
  },
  progressLineDone: {
    backgroundColor: brandColors.primary,
  },
  scroll: {
    paddingHorizontal: spacing.xxl,
    flexGrow: 1,
  },
  stepTitle: {
    fontFamily: fonts.headlineBlack,
    fontSize: 32,
    color: t.text,
    lineHeight: 38,
    marginBottom: spacing.xxl,
  },
  form: {
    gap: spacing.lg,
  },
  label: {
    fontFamily: fonts.headline,
    fontSize: 12,
    color: t.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: spacing.sm,
  },
  labelNote: {
    fontFamily: fonts.body,
    fontSize: 12,
    textTransform: 'none',
    letterSpacing: 0,
  },
  input: {
    backgroundColor: t.surface,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md + 2,
    fontSize: 15,
    fontFamily: fonts.body,
    color: t.text,
    borderWidth: 1,
    borderColor: t.border,
  },
  affixRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  prefix: {
    backgroundColor: t.card,
    borderWidth: 1,
    borderColor: t.border,
    borderRightWidth: 0,
    borderTopLeftRadius: radius.md,
    borderBottomLeftRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md + 2,
    justifyContent: 'center',
  },
  suffix: {
    backgroundColor: t.card,
    borderWidth: 1,
    borderColor: t.border,
    borderLeftWidth: 0,
    borderTopRightRadius: radius.md,
    borderBottomRightRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md + 2,
    justifyContent: 'center',
  },
  affixText: {
    fontFamily: fonts.headline,
    fontSize: 15,
    color: t.textMuted,
  },
  affixInput: {
    flex: 1,
    borderTopLeftRadius: 0,
    borderBottomLeftRadius: 0,
  },
  bioHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  charCount: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: t.textMuted,
  },
  bioInput: {
    minHeight: 90,
    paddingTop: spacing.md,
  },
  platformRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  verifyNote: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: t.textMuted,
    marginTop: spacing.xs,
  },
  followersInput: {
    width: 110,
  },
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  chip: {
    borderWidth: 1,
    borderColor: t.border,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
  },
  chipSelected: {
    backgroundColor: brandColors.primary,
    borderColor: brandColors.primary,
  },
  chipText: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: t.textMuted,
  },
  chipTextSelected: {
    fontFamily: fonts.headline,
    color: '#FFFFFF',
  },
  locationRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  stateField: {
    width: 76,
  },
  errorText: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: '#FF4D6D',
    marginTop: spacing.lg,
  },
  navRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginTop: spacing.xxl,
    paddingBottom: spacing.lg,
  },
  backButton: {
    paddingVertical: 15,
    paddingHorizontal: spacing.sm,
  },
  backButtonText: {
    fontFamily: fonts.body,
    fontSize: 15,
    color: t.textMuted,
  },
  nextButton: {
    backgroundColor: brandColors.primary,
    borderRadius: radius.full,
    paddingVertical: 15,
    paddingHorizontal: spacing.xxl,
    alignItems: 'center',
    minWidth: 130,
  },
  nextButtonDisabled: {
    opacity: 0.6,
  },
  nextButtonText: {
    fontFamily: fonts.headline,
    fontSize: 16,
    color: '#FFFFFF',
  },
});
