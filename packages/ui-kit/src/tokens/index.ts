/** Surface des tokens : primitives, thèmes résolus, tokens partagés, agrégat `tokens`, et types. */
export * from './contracts.js';
export { TOKENS_VERSION } from './meta.js';
export { SEMANTIC_COLOR_KEYS, type SemanticColorKey } from './semantic/colors.js';
export { primitives } from './primitives/index.js';
export { semanticTypography } from './semantic/typography.js';
export { lightColorReferences } from './themes/light.js';
export { darkColorReferences } from './themes/dark.js';
export {
  lightTheme,
  darkTheme,
  sharedTokens,
  buildTheme,
  resolveReferenceGraph,
  flattenColorPrimitives,
  flattenThemeReferences,
  type BuiltTheme,
  type RefResolution,
} from './registry.js';

import { primitives } from './primitives/index.js';
import { darkTheme, lightTheme, sharedTokens } from './registry.js';

/** Agrégat pratique des tokens (primitives + tokens partagés + thèmes résolus). */
export const tokens = {
  primitives,
  themes: { light: lightTheme, dark: darkTheme },
  spacing: sharedTokens.spacing,
  radius: sharedTokens.radius,
  shadow: sharedTokens.shadow,
  typography: sharedTokens.typography,
  motion: sharedTokens.motion,
  breakpoint: sharedTokens.breakpoint,
  zIndex: sharedTokens.zIndex,
} as const;
