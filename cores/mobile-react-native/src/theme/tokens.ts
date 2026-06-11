/**
 * Theme tokens — minimal PLACEHOLDER bridge to the future `@enistere/ui-kit`.
 *
 * Governance:
 * - ADR-008 makes `@enistere/ui-kit` the SOURCE OF TRUTH for design tokens. It
 *   is already RN-safe (colors as hex strings, spacing/radius as numeric dp,
 *   structured shadows — see its `react-native.consumer.ts`).
 * - ADR-010 mandates "tokens Enistere + ThemeProvider + composants maison
 *   contrôlés" for React Native (NativeWind/UI libraries NOT introduced here).
 *
 * The mission explicitly allows a "bridge minimal" instead of a hard dependency
 * on the UI Kit. This file therefore mirrors the UI Kit token SHAPE with neutral
 * PLACEHOLDER values (NOT a brand identity). When the mobile UI Kit surface
 * ships, replace these literals with imports from `@enistere/ui-kit/tokens` —
 * the `ThemeProvider` and consuming components stay intact.
 */

/** Numeric spacing scale in density-independent pixels (dp). */
export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

/** Corner radius scale (dp). */
export const radius = {
  sm: 4,
  md: 8,
  lg: 16,
  pill: 999,
} as const;

/** Typography styles (RN-compatible: numeric sizes, string weights). */
export const typography = {
  heading: { fontSize: 24, lineHeight: 32, fontWeight: '700' },
  title: { fontSize: 18, lineHeight: 24, fontWeight: '600' },
  body: { fontSize: 16, lineHeight: 22, fontWeight: '400' },
  caption: { fontSize: 13, lineHeight: 18, fontWeight: '400' },
} as const;

/** Minimum touch target (dp) — accessibility floor per ADR-010 §16/§19. */
export const a11y = {
  minTouchTarget: 44,
} as const;

/** The set of semantic color slots a theme must provide. */
export interface ThemeColors {
  readonly background: string;
  readonly surface: string;
  readonly surfaceElevated: string;
  readonly border: string;
  readonly text: string;
  readonly textMuted: string;
  readonly primary: string;
  readonly primaryText: string;
  readonly danger: string;
  readonly success: string;
}

const lightColors: ThemeColors = {
  background: '#FFFFFF',
  surface: '#F5F5F7',
  surfaceElevated: '#FFFFFF',
  border: '#E2E2E8',
  text: '#1A1A22',
  textMuted: '#6B6B78',
  primary: '#2F6BD6',
  primaryText: '#FFFFFF',
  danger: '#C8242A',
  success: '#1F7A38',
};

const darkColors: ThemeColors = {
  background: '#0B0B0F',
  surface: '#16161D',
  surfaceElevated: '#1F1F29',
  border: '#2A2A36',
  text: '#F5F5F7',
  textMuted: '#9A9AA8',
  primary: '#5B8DEF',
  primaryText: '#FFFFFF',
  danger: '#E5484D',
  success: '#46A758',
};

export type ColorScheme = 'light' | 'dark';

/** A fully resolved theme handed to components via `useTheme()`. */
export interface Theme {
  readonly scheme: ColorScheme;
  readonly colors: ThemeColors;
  readonly spacing: typeof spacing;
  readonly radius: typeof radius;
  readonly typography: typeof typography;
  readonly a11y: typeof a11y;
}

export const lightTheme: Theme = {
  scheme: 'light',
  colors: lightColors,
  spacing,
  radius,
  typography,
  a11y,
};

export const darkTheme: Theme = {
  scheme: 'dark',
  colors: darkColors,
  spacing,
  radius,
  typography,
  a11y,
};

export function resolveTheme(scheme: ColorScheme): Theme {
  return scheme === 'dark' ? darkTheme : lightTheme;
}

export type SpacingToken = keyof typeof spacing;
export type TypographyVariant = keyof typeof typography;
