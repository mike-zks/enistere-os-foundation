/**
 * Surface publique de `@enistere/ui-kit` (V1 : tokens uniquement).
 *
 * Source de vérité des design tokens Enistere (ADR-008) : primitives, couleurs sémantiques, thèmes
 * light/dark résolus, et validation. **Aucun composant, aucun framework UI, aucune dépendance React/
 * React Native/Angular.** Les générateurs (CSS/TS/JSON) sont internes ; les artefacts sont dans
 * `generated/` (et exposés via `@enistere/ui-kit/tokens.css` et `/tokens.json`).
 */
export {
  tokens,
  primitives,
  semanticTypography,
  lightTheme,
  darkTheme,
  sharedTokens,
  buildTheme,
  resolveReferenceGraph,
  flattenColorPrimitives,
  flattenThemeReferences,
  lightColorReferences,
  darkColorReferences,
  SEMANTIC_COLOR_KEYS,
  TOKENS_VERSION,
} from './tokens/index.js';

export type {
  HexColor,
  ShadowToken,
  EasingToken,
  TypographyStyle,
  ColorScale,
  ColorPrimitives,
  TypographyPrimitives,
  Primitives,
  SemanticColors,
  SemanticTypography,
  ThemeColorReferences,
  ThemeName,
  ThemeTokens,
  SharedTokens,
  SemanticColorKey,
  BuiltTheme,
  RefResolution,
} from './tokens/index.js';

export {
  validateTokens,
  validateDefaultTokens,
  defaultTokenModel,
} from './validation/validate-tokens.js';
export type { TokenModel, ValidationResult } from './validation/validate-tokens.js';

// Primitives Web (V2) — React requis (peerDependency) ; styles via @enistere/ui-kit/styles.css.
export * from './components/index.js';
export { mergeClassNames } from './utilities/merge-class-names.js';
export type { ClassValue } from './utilities/merge-class-names.js';
