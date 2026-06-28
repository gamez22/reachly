import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getTheme, brandColors, fonts, spacing, radius } from '../../lib/theme';
import { supabase } from '../../lib/supabase';
import { UserType } from '../../lib/types/database';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function SignupScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { userType } = useLocalSearchParams<{ userType: UserType }>();

  const theme = getTheme(userType ?? 'creator');

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSignUp() {
    setError(null);

    if (!fullName.trim() || !email.trim() || !password || !confirmPassword) {
      setError('All fields are required.');
      return;
    }
    if (!EMAIL_REGEX.test(email.trim())) {
      setError('Enter a valid email address.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);

    const { data: authData, error: signUpError } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: { data: { full_name: fullName.trim(), user_type: userType } },
    });

    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
      return;
    }

    if (!authData.user) {
      setError('Check your email to confirm your account, then log in.');
      setLoading(false);
      return;
    }

    setLoading(false);
    router.replace('/(auth)/onboarding');
  }

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: insets.top + spacing.lg,
            paddingBottom: insets.bottom + spacing.xxl,
          },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Back button */}
        <TouchableOpacity
          onPress={() => router.back()}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          style={styles.backButton}
        >
          <Text style={[styles.backText, { color: theme.colors.textMuted }]}>← Back</Text>
        </TouchableOpacity>

        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.headline, { color: theme.colors.text }]}>
            Create your{'\n'}account.
          </Text>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>
              {userType === 'creator' ? 'Creator account' : 'Brand account'}
            </Text>
          </View>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <TextInput
            style={[styles.input, {
              backgroundColor: theme.colors.surface,
              color: theme.colors.text,
              borderColor: theme.colors.border,
            }]}
            placeholder="Full name"
            placeholderTextColor={theme.colors.textMuted}
            value={fullName}
            onChangeText={setFullName}
            autoCapitalize="words"
            autoComplete="name"
            returnKeyType="next"
          />
          <TextInput
            style={[styles.input, {
              backgroundColor: theme.colors.surface,
              color: theme.colors.text,
              borderColor: theme.colors.border,
            }]}
            placeholder="Email"
            placeholderTextColor={theme.colors.textMuted}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
            returnKeyType="next"
          />
          <TextInput
            style={[styles.input, {
              backgroundColor: theme.colors.surface,
              color: theme.colors.text,
              borderColor: theme.colors.border,
            }]}
            placeholder="Password"
            placeholderTextColor={theme.colors.textMuted}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoComplete="new-password"
            returnKeyType="next"
          />
          <TextInput
            style={[styles.input, {
              backgroundColor: theme.colors.surface,
              color: theme.colors.text,
              borderColor: theme.colors.border,
            }]}
            placeholder="Confirm password"
            placeholderTextColor={theme.colors.textMuted}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
            autoComplete="new-password"
            returnKeyType="done"
            onSubmitEditing={handleSignUp}
          />

          {error && <Text style={styles.errorText}>{error}</Text>}

          <TouchableOpacity
            style={[styles.submitButton, loading && styles.submitButtonDisabled]}
            onPress={handleSignUp}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading
              ? <ActivityIndicator color="#FFFFFF" />
              : <Text style={styles.submitButtonText}>Create Account</Text>
            }
          </TouchableOpacity>
        </View>

        {/* Login link */}
        <TouchableOpacity
          onPress={() => router.push('/(auth)/login')}
          style={styles.loginLink}
        >
          <Text style={[styles.loginText, { color: theme.colors.textMuted }]}>
            Already have an account?{' '}
            <Text style={{ color: brandColors.primary, fontFamily: fonts.headline }}>
              Log in
            </Text>
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: spacing.xxl,
  },
  backButton: {
    marginBottom: spacing.xxl,
  },
  backText: {
    fontFamily: fonts.body,
    fontSize: 15,
  },
  header: {
    marginBottom: spacing.xxl + spacing.md,
  },
  headline: {
    fontFamily: fonts.headlineBlack,
    fontSize: 34,
    lineHeight: 40,
    marginBottom: spacing.lg,
  },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: brandColors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: radius.full,
  },
  badgeText: {
    fontFamily: fonts.headline,
    fontSize: 13,
    color: '#FFFFFF',
  },
  form: {
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  input: {
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md + 2,
    fontSize: 15,
    fontFamily: fonts.body,
    borderWidth: 1,
  },
  errorText: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: '#FF4D6D',
    marginTop: spacing.xs,
  },
  submitButton: {
    backgroundColor: brandColors.primary,
    borderRadius: radius.full,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontFamily: fonts.headline,
    fontSize: 16,
    color: '#FFFFFF',
  },
  loginLink: {
    alignItems: 'center',
    marginTop: 'auto',
    paddingTop: spacing.xl,
  },
  loginText: {
    fontFamily: fonts.body,
    fontSize: 15,
    textAlign: 'center',
  },
});
