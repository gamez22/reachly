// ============================================
// REACHLY — Brand Theme & Design Tokens
// Place this at: lib/theme.ts
// ============================================
//
// Reachly runs TWO visual modes depending on user_type:
//   - Creator workflow → Dark mode (energetic, social-app native)
//   - Brand workflow   → Light mode (clean, professional, trustworthy)
//
// Both share the same brand colors as the foundation — only the
// surface/background/text relationship inverts.
//
// Usage:
//   import { getTheme } from './theme';
//   const theme = getTheme(userType); // userType: 'creator' | 'brand'

export const brandColors = {
  primary: '#4E00BF',     // Reachly Purple — primary brand color
  secondary: '#003070',   // Reachly Navy — secondary brand color
} as const;

export const fonts = {
  // Archivo Black/Bold — headlines, titles, numbers, buttons
  headline: 'Archivo-Bold',
  headlineBlack: 'Archivo-Black',
  // Archivo Light — body copy, descriptions, captions
  body: 'Archivo-Light',
  // Archivo Regular — fallback for places Light is too thin (small UI labels)
  bodyRegular: 'Archivo-Regular',
} as const;

// ── CREATOR THEME (Dark Mode) ──
export const creatorTheme = {
  mode: 'dark' as const,

  colors: {
    primary: brandColors.primary,
    secondary: brandColors.secondary,

    background: '#0D0614',       // near-black with a purple undertone
    surface: '#16101F',
    card: '#1F1729',
    card2: '#291E35',

    border: 'rgba(255,255,255,0.08)',

    text: '#F5F3F9',
    textMuted: '#A89FB8',

    primarySoft: 'rgba(78,0,191,0.18)',
    secondarySoft: 'rgba(0,48,112,0.25)',

    success: '#00D68F',
    successSoft: 'rgba(0,214,143,0.12)',
    warning: '#FFB800',
    danger: '#FF4D6D',
  },

  fonts,
} as const;

// ── BRAND THEME (Light Mode) ──
export const brandTheme = {
  mode: 'light' as const,

  colors: {
    primary: brandColors.primary,
    secondary: brandColors.secondary,

    background: '#FFFFFF',
    surface: '#F7F5FA',          // faint purple-tinted off-white
    card: '#FFFFFF',
    card2: '#F0ECF7',

    border: 'rgba(78,0,191,0.12)',

    text: '#1A1422',
    textMuted: '#6B6478',

    primarySoft: 'rgba(78,0,191,0.08)',
    secondarySoft: 'rgba(0,48,112,0.08)',

    success: '#00A876',
    successSoft: 'rgba(0,168,118,0.10)',
    warning: '#C98A00',
    danger: '#E0334F',
  },

  fonts,
} as const;

export type AppTheme = typeof creatorTheme | typeof brandTheme;
export type UserType = 'creator' | 'brand';

/**
 * Returns the correct theme object based on user type.
 * Creators get dark mode, brands get light mode.
 */
export function getTheme(userType: UserType): AppTheme {
  return userType === 'creator' ? creatorTheme : brandTheme;
}

// ── TYPE SCALE (shared across both themes) ──
export const typeScale = {
  display: { fontSize: 32, lineHeight: 38, fontFamily: fonts.headlineBlack },
  h1: { fontSize: 24, lineHeight: 30, fontFamily: fonts.headline },
  h2: { fontSize: 20, lineHeight: 26, fontFamily: fonts.headline },
  h3: { fontSize: 16, lineHeight: 22, fontFamily: fonts.headline },
  body: { fontSize: 14, lineHeight: 21, fontFamily: fonts.body },
  bodySmall: { fontSize: 12, lineHeight: 18, fontFamily: fonts.body },
  caption: { fontSize: 11, lineHeight: 16, fontFamily: fonts.bodyRegular },
  button: { fontSize: 15, lineHeight: 20, fontFamily: fonts.headline },
} as const;

// ── SPACING SCALE (shared) ──
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

// ── RADIUS SCALE (shared) ──
export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 999,
} as const;
