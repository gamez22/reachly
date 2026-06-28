import { View, Text, TouchableOpacity, StyleSheet, StatusBar } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { creatorTheme, brandColors, fonts, spacing, radius } from '../../lib/theme';

const t = creatorTheme.colors;

export default function WelcomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Top section — dark, flex fills remaining space */}
      <View style={[styles.top, { paddingTop: insets.top + spacing.xl }]}>
        <Text style={styles.wordmark}>REACHLY</Text>
        <View style={styles.heroText}>
          <Text style={styles.headline}>Find your perfect{'\n'}creator match.</Text>
          <Text style={styles.subtext}>The smarter way to grow your brand.</Text>
        </View>
      </View>

      {/* Bottom card — floats above home indicator */}
      <View style={[styles.card, { paddingBottom: insets.bottom + spacing.lg }]}>
        <Text style={styles.tagline}>Join thousands of brands and creators</Text>

        <TouchableOpacity
          style={styles.creatorButton}
          onPress={() => router.push({ pathname: '/(auth)/signup', params: { userType: 'creator' } })}
          activeOpacity={0.85}
        >
          <Text style={styles.creatorButtonText}>I'm a Creator</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.brandButton}
          onPress={() => router.push({ pathname: '/(auth)/signup', params: { userType: 'brand' } })}
          activeOpacity={0.85}
        >
          <Text style={styles.brandButtonText}>I'm a Brand</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => router.push('/(auth)/login')}
          style={styles.loginLink}
        >
          <Text style={styles.loginText}>
            Already have an account?{' '}
            <Text style={{ color: brandColors.primary, fontFamily: fonts.headline }}>
              Log in
            </Text>
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: t.background,
  },
  top: {
    flex: 1,
    paddingHorizontal: spacing.xxl,
    justifyContent: 'space-between',
    paddingBottom: spacing.xxl,
  },
  wordmark: {
    fontFamily: fonts.headlineBlack,
    fontSize: 22,
    color: brandColors.primary,
    letterSpacing: 4,
  },
  heroText: {
    gap: spacing.lg,
  },
  headline: {
    fontFamily: fonts.headlineBlack,
    fontSize: 40,
    color: t.text,
    lineHeight: 46,
  },
  subtext: {
    fontFamily: fonts.body,
    fontSize: 16,
    color: t.textMuted,
    lineHeight: 24,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: spacing.xxl,
    paddingTop: spacing.xl,
    gap: spacing.md,
  },
  tagline: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: '#6B6478',
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  creatorButton: {
    backgroundColor: brandColors.primary,
    borderRadius: radius.full,
    paddingVertical: 16,
    alignItems: 'center',
  },
  creatorButtonText: {
    fontFamily: fonts.headline,
    fontSize: 16,
    color: '#FFFFFF',
  },
  brandButton: {
    borderRadius: radius.full,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: brandColors.primary,
    backgroundColor: '#FFFFFF',
  },
  brandButtonText: {
    fontFamily: fonts.headline,
    fontSize: 16,
    color: brandColors.primary,
  },
  loginLink: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  loginText: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: '#6B6478',
  },
});
