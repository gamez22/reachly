import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { creatorTheme, brandColors, fonts, spacing, radius } from '../../lib/theme';
import { supabase } from '../../lib/supabase';

const t = creatorTheme.colors;

export default function LoginScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSignIn() {
    setError(null);
    if (!email.trim() || !password) {
      setError('Email and password are required.');
      return;
    }
    setLoading(true);
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    if (signInError) {
      setError(signInError.message);
      setLoading(false);
    }
    // On success: do nothing — AuthProvider's onAuthStateChange fires the redirect
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={[styles.inner, { paddingTop: insets.top + spacing.lg, paddingBottom: insets.bottom + spacing.xxl }]}>
        {/* Back button */}
        <TouchableOpacity
          onPress={() => router.back()}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          style={styles.backButton}
        >
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headline}>Welcome{'\n'}back.</Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor={t.textMuted}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
            returnKeyType="next"
          />
          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor={t.textMuted}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoComplete="password"
            returnKeyType="done"
            onSubmitEditing={handleSignIn}
          />

          {error && <Text style={styles.errorText}>{error}</Text>}

          <TouchableOpacity
            style={[styles.submitButton, loading && styles.submitButtonDisabled]}
            onPress={handleSignIn}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading
              ? <ActivityIndicator color="#FFFFFF" />
              : <Text style={styles.submitButtonText}>Sign In</Text>
            }
          </TouchableOpacity>
        </View>

        {/* Sign up link */}
        <TouchableOpacity
          onPress={() => router.push('/(auth)/welcome')}
          style={styles.signupLink}
        >
          <Text style={styles.signupText}>
            Don't have an account?{' '}
            <Text style={{ color: brandColors.primary, fontFamily: fonts.headline }}>
              Sign up
            </Text>
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: t.background,
  },
  inner: {
    flex: 1,
    paddingHorizontal: spacing.xxl,
  },
  backButton: {
    marginBottom: spacing.xxl,
  },
  backText: {
    fontFamily: fonts.body,
    fontSize: 15,
    color: t.textMuted,
  },
  header: {
    marginBottom: spacing.xxl + spacing.md,
  },
  headline: {
    fontFamily: fonts.headlineBlack,
    fontSize: 34,
    color: t.text,
    lineHeight: 40,
  },
  form: {
    gap: spacing.md,
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
  signupLink: {
    alignItems: 'center',
    marginTop: 'auto',
  },
  signupText: {
    fontFamily: fonts.body,
    fontSize: 15,
    color: t.textMuted,
    textAlign: 'center',
  },
});
