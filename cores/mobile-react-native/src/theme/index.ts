/**
 * Theme module public surface (ADR-008 tokens + ADR-010 ThemeProvider).
 */
export {
  spacing,
  radius,
  typography,
  a11y,
  lightTheme,
  darkTheme,
  resolveTheme,
} from './tokens';
export type {
  Theme,
  ThemeColors,
  ColorScheme,
  SpacingToken,
  TypographyVariant,
} from './tokens';
export { ThemeProvider, useTheme } from './ThemeProvider';
export type { ThemeProviderProps } from './ThemeProvider';
