/**
 * Breakpoints PRIMITIFS — orientés **Web** (largeurs min en px). NON directement applicables à React
 * Native : l'adaptation mobile (Dimensions, orientation) est explicite côté core mobile.
 */
export const breakpoints = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
} satisfies Readonly<Record<string, number>>;
