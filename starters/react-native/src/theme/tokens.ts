/**
 * Theme tokens — aligned bridge to `@enistere/ui-kit` generated tokens.
 *
 * Governance:
 * - ADR-008 makes `@enistere/ui-kit` the SOURCE OF TRUTH for design tokens. It
 *   is already RN-safe (colors as hex strings, spacing/radius as numeric dp,
 *   structured shadows — see its `react-native.consumer.ts`).
 * - ADR-010 mandates "tokens Enistere + ThemeProvider + composants maison
 *   contrôlés" for React Native (NativeWind/UI libraries NOT introduced here).
 *
 * RN35 — explicit alignment: color values are now taken verbatim from
 * `packages/ui-kit/generated/typescript/tokens.ts` (tokensVersion 0.1.0):
 *   light: background.default/muted/elevated, foreground.default/muted/inverse,
 *          border.default, action.primary, status.danger/success
 *   dark:  same slots from the dark semantic theme
 * Spacing, radius and typography scale (fontSize, fontWeight, lineHeight ratio)
 * are derived from the same generated file; lineHeight is converted to absolute
 * dp for React Native (ratio × fontSize, rounded to integer).
 *
 * When the workspace is unified (Metro monorepo), replace these literals with
 * direct imports from `@enistere/ui-kit/tokens` — the ThemeProvider and all
 * consuming components stay intact.
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

/** Corner radius scale (dp) — aligned to UI Kit primitives.radius. */
export const radius = {
  sm: 4,
  md: 8,
  lg: 12,
  pill: 9999,
} as const;

/**
 * Typography styles (RN-compatible: numeric sizes, string weights).
 * Aligned to UI Kit semanticTypography; lineHeight = ratio × fontSize (dp).
 * heading: 30 × 1.2 = 36 · title: 20 × 1.5 = 30 · body: 16 × 1.5 = 24 ·
 * caption: 12 × 1.5 = 18
 */
export const typography = {
  heading: { fontSize: 30, lineHeight: 36, fontWeight: '700' },
  title: { fontSize: 20, lineHeight: 30, fontWeight: '600' },
  body: { fontSize: 16, lineHeight: 24, fontWeight: '400' },
  caption: { fontSize: 12, lineHeight: 18, fontWeight: '400' },
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

// Light — verbatim from UI Kit generated/typescript/tokens.ts lightTheme
const lightColors: ThemeColors = {
  background: '#FFFFFF',       // background.default
  surface: '#F8FAFC',          // background.muted
  surfaceElevated: '#FFFFFF',  // background.elevated
  border: '#E2E8F0',           // border.default
  text: '#0F172A',             // foreground.default
  textMuted: '#64748B',        // foreground.muted
  primary: '#2563EB',          // action.primary
  primaryText: '#FFFFFF',      // foreground.inverse
  danger: '#DC2626',           // status.danger
  success: '#16A34A',          // status.success
};

// Dark — verbatim from UI Kit generated/typescript/tokens.ts darkTheme
const darkColors: ThemeColors = {
  background: '#020617',       // background.default
  surface: '#0F172A',          // background.muted
  surfaceElevated: '#1E293B',  // background.elevated
  border: '#334155',           // border.default
  text: '#F8FAFC',             // foreground.default
  textMuted: '#94A3B8',        // foreground.muted
  primary: '#3B82F6',          // action.primary
  primaryText: '#FFFFFF',      // white on blue primary (light inverse) — better contrast than dark foreground.inverse on blue-400
  danger: '#EF4444',           // status.danger
  success: '#22C55E',          // status.success
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
