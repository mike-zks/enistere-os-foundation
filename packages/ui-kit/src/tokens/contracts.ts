/**
 * Contrats de types des design tokens Enistere (ADR-008).
 *
 * UNITÉS CANONIQUES (agnostiques plateforme) :
 * - dimensions (`spacing`, `radius`, `fontSize`, `letterSpacing`, `breakpoint`, shadow offsets) :
 *   **nombres** exprimés en pixels canoniques (px CSS ≈ unité densité-indépendante React Native) ;
 * - couleurs : **chaînes hex** (`#RRGGBB` ou `#RRGGBBAA`) ;
 * - `fontWeight` : **nombre** (100..900) ; `lineHeight` : **ratio** sans unité ;
 * - `duration` : **nombre** en millisecondes ; `easing` : courbe cubic-bézier (4 points) ;
 * - `shadow` : **structure** (jamais une chaîne CSS) pour être adaptable Web/RN.
 *
 * L'adaptation par plateforme (px/rem, dp, Easing) appartient aux générateurs et aux cores clients.
 */

export type HexColor = string;

/** Ombre structurée (agnostique). Le générateur CSS en dérive un `box-shadow`. */
export interface ShadowToken {
  x: number;
  y: number;
  blur: number;
  spread: number;
  color: HexColor;
  opacity: number;
  /** Élévation Material-like (utile React Native/Flutter). */
  elevation: number;
}

/** Courbe d'accélération agnostique (Web : `cubic-bezier`, RN : `Easing.bezier`). */
export interface EasingToken {
  cubicBezier: readonly [number, number, number, number];
}

export interface TypographyStyle {
  fontFamily: string;
  fontSize: number;
  fontWeight: number;
  lineHeight: number;
  letterSpacing: number;
}

// --- Primitives ---

export type ColorScale = Readonly<Record<string, HexColor>>;

export interface ColorPrimitives {
  neutral: ColorScale;
  brand: ColorScale;
  red: ColorScale;
  green: ColorScale;
  amber: ColorScale;
  blue: ColorScale;
}

export interface TypographyPrimitives {
  fontFamily: Readonly<Record<string, string>>;
  fontSize: Readonly<Record<string, number>>;
  fontWeight: Readonly<Record<string, number>>;
  lineHeight: Readonly<Record<string, number>>;
  letterSpacing: Readonly<Record<string, number>>;
}

export interface Primitives {
  color: ColorPrimitives;
  spacing: Readonly<Record<string, number>>;
  radius: Readonly<Record<string, number>>;
  shadow: Readonly<Record<string, ShadowToken>>;
  typography: TypographyPrimitives;
  motion: {
    duration: Readonly<Record<string, number>>;
    easing: Readonly<Record<string, EasingToken>>;
  };
  breakpoint: Readonly<Record<string, number>>;
  zIndex: Readonly<Record<string, number>>;
}

// --- Sémantique (intentions) ---

/** Couleurs sémantiques (résolues par thème). Clés stables — contrat partagé light/dark. */
export interface SemanticColors {
  background: { default: HexColor; muted: HexColor; elevated: HexColor };
  foreground: { default: HexColor; muted: HexColor; inverse: HexColor };
  border: { default: HexColor; strong: HexColor; focus: HexColor };
  action: { primary: HexColor; primaryHover: HexColor; primaryPressed: HexColor; disabled: HexColor };
  status: { success: HexColor; warning: HexColor; danger: HexColor; info: HexColor };
  focus: { ring: HexColor };
  overlay: HexColor;
}

/** Styles typographiques sémantiques (théme-indépendants). */
export interface SemanticTypography {
  display: TypographyStyle;
  heading: TypographyStyle;
  title: TypographyStyle;
  body: TypographyStyle;
  label: TypographyStyle;
  caption: TypographyStyle;
  code: TypographyStyle;
}

/** Carte de références d'un thème : chaque couleur sémantique pointe vers une primitive `color.*`. */
export interface ThemeColorReferences {
  background: { default: string; muted: string; elevated: string };
  foreground: { default: string; muted: string; inverse: string };
  border: { default: string; strong: string; focus: string };
  action: { primary: string; primaryHover: string; primaryPressed: string; disabled: string };
  status: { success: string; warning: string; danger: string; info: string };
  focus: { ring: string };
  overlay: string;
}

export type ThemeName = 'light' | 'dark';

/** Thème résolu, consommé par les plateformes : `theme.colors.background.default`. */
export interface ThemeTokens {
  name: ThemeName;
  colors: SemanticColors;
}

/** Tokens théme-indépendants exposés directement. */
export interface SharedTokens {
  spacing: Readonly<Record<string, number>>;
  radius: Readonly<Record<string, number>>;
  shadow: Readonly<Record<string, ShadowToken>>;
  typography: SemanticTypography;
  motion: Primitives['motion'];
  breakpoint: Readonly<Record<string, number>>;
  zIndex: Readonly<Record<string, number>>;
}
